import "server-only";
import { timingSafeEqual } from "node:crypto";
import { sql } from "@/lib/db";
import type { Ciclo } from "@aviso/shared";
import type { BillingProvider } from "./index";

/**
 * Asaas (API v3). Docs públicas: https://docs.asaas.com
 * - Cliente: GET /customers?externalReference=<userId> ou POST /customers { name, email, externalReference }.
 * - Assinatura: POST /subscriptions { customer, billingType, value, nextDueDate, cycle, description, externalReference }
 *   com nextDueDate = fim do teste (cobrança no 4º dia). billingType CREDIT_CARD (cartão) ou PIX.
 *   Pix Automático (autorização de débito recorrente) quando ASAAS_PIX_AUTOMATICO=1 (POST /pix/automatic/authorizations).
 * - O link para concluir (cartão / QR do Pix) é o invoiceUrl da 1ª cobrança da assinatura.
 * - Webhook (header asaas-access-token = ASAAS_WEBHOOK_TOKEN) é a fonte da verdade do pagamento.
 * Cabeçalhos: access_token e User-Agent (obrigatório para contas novas).
 */

function base(): string {
  return (process.env.ASAAS_BASE_URL ?? "https://api-sandbox.asaas.com/v3").replace(/\/+$/, "");
}

async function asaas<T>(metodo: "GET" | "POST" | "PUT" | "DELETE", caminho: string, corpo?: unknown): Promise<T> {
  const chave = process.env.ASAAS_API_KEY;
  if (!chave) throw new Error("ASAAS_API_KEY não configurada");
  const r = await fetch(`${base()}${caminho}`, {
    method: metodo,
    headers: { access_token: chave, "content-type": "application/json", accept: "application/json", "user-agent": "AvisoConcurso/1.0" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    signal: AbortSignal.timeout(30_000),
  });
  const j = (await r.json().catch(() => ({}))) as T & { errors?: { code: string; description: string }[] };
  if (!r.ok) throw new Error(`Asaas ${metodo} ${caminho}: ${r.status} ${j.errors?.map((e) => e.description).join("; ") ?? ""}`.trim());
  return j;
}

const ciclo = (c: Ciclo) => (c === "anual" ? "YEARLY" : "MONTHLY");
const dia = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

export const asaasProvider: BillingProvider = {
  nome: "asaas",
  async criarAssinatura(p) {
    const existente = await asaas<{ data: { id: string }[] }>("GET", `/customers?externalReference=${encodeURIComponent(p.userId)}&limit=1`);
    const customerId =
      existente.data[0]?.id ??
      (await asaas<{ id: string }>("POST", "/customers", { name: p.nome, email: p.email, externalReference: p.userId, notificationDisabled: false })).id;
    const descricao = `Aviso Concurso · plano ${p.plano === "aprovado" ? "Aprovado" : "Aviso"} (${p.ciclo})`;
    const valor = Math.round(p.valorCentavos) / 100;
    const pixAutomatico = p.metodo === "pix_automatico" && process.env.ASAAS_PIX_AUTOMATICO === "1";
    const sub = await asaas<{ id: string }>("POST", "/subscriptions", {
      customer: customerId,
      billingType: p.metodo === "cartao" ? "CREDIT_CARD" : "PIX",
      value: valor,
      nextDueDate: dia(p.primeiraCobranca),
      cycle: ciclo(p.ciclo),
      description: descricao,
      externalReference: p.userId,
    });
    let checkoutUrl: string | null = null;
    if (pixAutomatico) {
      // Autorização do Pix Automático (jornada com QR): a pessoa autoriza uma vez no app do banco.
      const aut = await asaas<{ id: string; paymentLink?: string | null; invoiceUrl?: string | null }>("POST", "/pix/automatic/authorizations", {
        customerId,
        frequency: p.ciclo === "anual" ? "ANNUALLY" : "MONTHLY",
        contractId: `aviso-${p.userId}`,
        startDate: dia(p.primeiraCobranca),
        value: valor,
        description: descricao,
      });
      checkoutUrl = aut.paymentLink ?? aut.invoiceUrl ?? null;
    }
    if (!checkoutUrl) {
      const cobrancas = await asaas<{ data: { invoiceUrl: string | null }[] }>("GET", `/subscriptions/${sub.id}/payments?limit=1`);
      checkoutUrl = cobrancas.data[0]?.invoiceUrl ?? null;
    }
    return { customerId, subscriptionId: sub.id, checkoutUrl };
  },
  async atualizarValor(p) {
    await asaas("PUT", `/subscriptions/${p.subscriptionId}`, { value: p.valorCentavos / 100, cycle: ciclo(p.ciclo), updatePendingPayments: true });
  },
  async cancelarAssinatura(subscriptionId) {
    await asaas("DELETE", `/subscriptions/${subscriptionId}`);
  },
};

// ---------- Webhook ----------

export interface PagamentoAsaas {
  id: string;
  customer?: string;
  subscription?: string | null;
  value?: number;
  billingType?: string;
  status?: string;
  dueDate?: string;
  paymentDate?: string | null;
  confirmedDate?: string | null;
  externalReference?: string | null;
}

export interface EventoAsaas {
  id?: string;
  event: string;
  dateCreated?: string;
  payment?: PagamentoAsaas;
  subscription?: { id: string; status?: string; externalReference?: string | null };
}

/** Compara o token do webhook em tempo constante. Sem ASAAS_WEBHOOK_TOKEN configurado, recusa tudo. */
export function tokenWebhookValido(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Chave de idempotência do evento (o Asaas manda `id` único por evento; senão, evento + pagamento + status). */
export function idDoEvento(e: EventoAsaas): string {
  return e.id ?? `${e.event}:${e.payment?.id ?? e.subscription?.id ?? "?"}:${e.payment?.status ?? e.subscription?.status ?? ""}`;
}

type StatusPagamento = "pendente" | "pago" | "falhou" | "estornado";

function statusPagamento(evento: string, status: string | undefined): StatusPagamento {
  if (/REFUND|CHARGEBACK/.test(evento) || status === "REFUNDED" || status?.startsWith("CHARGEBACK")) return "estornado";
  if (["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(evento) || ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"].includes(status ?? "")) return "pago";
  if (["PAYMENT_DELETED", "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED", "PAYMENT_REPROVED_BY_RISK_ANALYSIS"].includes(evento)) return "falhou";
  return "pendente";
}

const METODO: Record<string, string> = { CREDIT_CARD: "cartao", PIX: "pix", BOLETO: "boleto", UNDEFINED: "indefinido" };

/**
 * Aplica um evento do Asaas em payments/subscriptions. Idempotente:
 * - payments é único por provider_payment_id (upsert; "pago"/"estornado" não regridem para "pendente");
 * - o novo current_period_end é calculado a partir do vencimento da cobrança (repetir dá o mesmo resultado).
 */
export async function aplicarEventoAsaas(e: EventoAsaas): Promise<{ acao: string }> {
  return sql.begin(async (tx) => {
    if (e.payment) {
      const p = e.payment;
      const [sub] = await tx<{ id: string; user_id: string; status: string; ciclo: Ciclo; current_period_end: Date | null }[]>`
        select id, user_id, status, ciclo, current_period_end from subscriptions
        where (${p.subscription ?? null}::text is not null and provider_subscription_id = ${p.subscription ?? null})
           or (${p.subscription ?? null}::text is null and ${p.externalReference ?? null}::text is not null and user_id::text = ${p.externalReference ?? null}
               and status in ('trial', 'ativa', 'inadimplente'))
        order by created_at desc limit 1 for update`;
      if (!sub) return { acao: "ignorado: assinatura não encontrada" };
      const status = statusPagamento(e.event, p.status);
      const pagoEm = status === "pago" ? (p.confirmedDate ?? p.paymentDate ?? e.dateCreated ?? null) : null;
      await tx`
        insert into payments (subscription_id, user_id, valor_centavos, status, metodo, provider_payment_id, vencimento, pago_em)
        values (${sub.id}, ${sub.user_id}, ${Math.round((p.value ?? 0) * 100)}, ${status}, ${METODO[p.billingType ?? ""] ?? p.billingType ?? null},
                ${p.id}, ${p.dueDate ?? null}, ${pagoEm ? new Date(pagoEm) : null})
        on conflict (provider_payment_id) do update set
          status = case
            when payments.status = 'estornado' then 'estornado'
            when payments.status = 'pago' and excluded.status in ('pendente', 'falhou') then 'pago'
            else excluded.status end,
          valor_centavos = excluded.valor_centavos,
          vencimento = coalesce(excluded.vencimento, payments.vencimento),
          pago_em = coalesce(payments.pago_em, excluded.pago_em),
          metodo = coalesce(excluded.metodo, payments.metodo)`;
      if (status === "pago" && p.dueDate) {
        const intervalo = sub.ciclo === "anual" ? "1 year" : "1 month";
        // Reativa: se o teste tinha expirado e não há outra assinatura viva, volta a valer.
        const outraViva = sub.status === "expirada"
          ? (await tx`select 1 from subscriptions where user_id = ${sub.user_id} and id <> ${sub.id} and status in ('trial','ativa','inadimplente')`).length > 0
          : false;
        await tx`
          update subscriptions set
            status = case when status in ('trial', 'ativa', 'inadimplente') or (status = 'expirada' and not ${outraViva}) then 'ativa' else status end,
            current_period_end = greatest(coalesce(current_period_end, ${p.dueDate}::date::timestamptz),
                                          (${p.dueDate}::date + ${intervalo}::interval)::timestamptz),
            updated_at = now()
          where id = ${sub.id}`;
        return { acao: "pagamento confirmado" };
      }
      if (e.event === "PAYMENT_OVERDUE" || e.event === "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED" || e.event === "PAYMENT_REPROVED_BY_RISK_ANALYSIS") {
        await tx`update subscriptions set status = 'inadimplente', updated_at = now() where id = ${sub.id} and status in ('trial', 'ativa')`;
        return { acao: "inadimplente" };
      }
      if (status === "estornado") {
        await tx`update subscriptions set status = 'cancelada', cancel_at_period_end = true, canceled_at = coalesce(canceled_at, now()),
                 current_period_end = least(coalesce(current_period_end, now()), now()), updated_at = now()
                 where id = ${sub.id} and status in ('trial', 'ativa', 'inadimplente')`;
        return { acao: "estornado" };
      }
      return { acao: `pagamento ${status}` };
    }
    if (e.subscription && (e.event === "SUBSCRIPTION_DELETED" || e.event === "SUBSCRIPTION_INACTIVATED")) {
      const r = await tx`update subscriptions set status = 'cancelada', cancel_at_period_end = true, canceled_at = coalesce(canceled_at, now()), updated_at = now()
                         where provider_subscription_id = ${e.subscription.id} and status in ('trial', 'ativa', 'inadimplente')`;
      return { acao: r.count ? "assinatura cancelada" : "ignorado" };
    }
    return { acao: "ignorado" };
  });
}
