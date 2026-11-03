import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { sql, type Tx } from "@/lib/db";
import { billing } from "@/lib/billing";
import {
  calcularAcesso, precoCentavos, DIAS_TOLERANCIA_INADIMPLENCIA, TRIAL_DAYS,
  type Acesso, type AssinaturaDTO, type Ciclo, type Plano,
} from "@aviso/shared";

const COLS = sql`id, plano, ciclo, status, metodo, trial_ends_at, current_period_end, cancel_at_period_end`;
const VIVAS = sql`status in ('trial','ativa','inadimplente')`;
const DIA = 86_400_000;

/** Assinatura mais relevante: a viva, senão a mais recente. */
export async function assinaturaAtual(userId: string, tx: Tx = sql): Promise<AssinaturaDTO | null> {
  const [s] = await tx<AssinaturaDTO[]>`
    select ${COLS} from subscriptions where user_id = ${userId}
    order by (status in ('trial','ativa','inadimplente')) desc, created_at desc limit 1`;
  return s ?? null;
}

export async function acessoDoUsuario(userId: string): Promise<Acesso> {
  return calcularAcesso(await assinaturaAtual(userId));
}

/** Hash do e-mail normalizado: marca quem já usou o teste mesmo depois de excluir a conta. */
export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/** Já usou o teste grátis alguma vez? Um teste por pessoa (por conta e por e-mail). */
export async function jaUsouTeste(userId: string, tx: Tx = sql): Promise<boolean> {
  const [r] = await tx`
    select 1 from subscriptions where user_id = ${userId} and trial_ends_at is not null
    union all
    select 1 from testes_usados t join users u on t.email_hash = encode(digest(lower(trim(u.email::text)), 'sha256'), 'hex')
    where u.id = ${userId}
    limit 1`;
  return !!r;
}

/** Trava por pessoa dentro de uma transação: serializa checkout, reativação e cancelamento. */
export async function travarUsuario(tx: Tx, userId: string) {
  await tx`select pg_advisory_xact_lock(hashtext(${"assinatura:" + userId}))`;
}

interface LinhaProvedor {
  id: string;
  provider: string;
  provider_subscription_id: string | null;
}

/**
 * Cancela a cobrança recorrente no provedor (Asaas). Ignora assinaturas sem cobrança real
 * (cortesia) ou criadas por outro provedor que o configurado agora (ex.: mock em dev).
 */
export async function cancelarNoProvedor(sub: LinhaProvedor): Promise<void> {
  if (!sub.provider_subscription_id || sub.provider === "cortesia") return;
  const p = await billing();
  if (p.nome !== sub.provider) {
    console.warn(`[billing] assinatura ${sub.id} é do provedor ${sub.provider}, mas o configurado é ${p.nome}: não cancelada no provedor`);
    return;
  }
  await p.cancelarAssinatura(sub.provider_subscription_id);
}

export type ResultadoAssinar =
  | { ok: true; assinatura: AssinaturaDTO; checkoutUrl: string | null; teste: boolean }
  | { ok: false; status: number; codigo: string; mensagem: string };

/**
 * Checkout: começa o teste de 3 dias (cobrança no 4º dia) ou, se o teste já foi usado, a assinatura paga.
 * - Serializado por pessoa (duplo clique não cria duas cobranças).
 * - Quem já tem acesso pago/teste em dia é mandado para "trocar plano".
 * - Quem cancelou e ainda está no período é mandado para "reativar".
 * - Assinatura antiga sem acesso (ex.: inadimplente) é cancelada NO PROVEDOR antes da nova.
 * - Sem teste, o acesso só libera quando o pagamento é confirmado (webhook); até lá fica "inadimplente" sem acesso.
 */
export async function assinar(p: {
  userId: string;
  nome: string;
  email: string;
  plano: Plano;
  ciclo: Ciclo;
  metodo: "cartao" | "pix_automatico";
}): Promise<ResultadoAssinar> {
  return sql.begin(async (tx) => {
    await travarUsuario(tx, p.userId);
    const [viva] = await tx<(AssinaturaDTO & LinhaProvedor)[]>`
      select ${COLS}, provider, provider_subscription_id from subscriptions where user_id = ${p.userId} and ${VIVAS}`;
    if (viva) {
      if (calcularAcesso(viva).liberado) {
        return { ok: false, status: 409, codigo: "ja_assinante", mensagem: "Você já tem uma assinatura ativa. Para mudar de plano, use Trocar plano." };
      }
      await cancelarNoProvedor(viva);
      await tx`update subscriptions set status = 'expirada', updated_at = now() where id = ${viva.id}`;
    } else {
      const [cancelada] = await tx<AssinaturaDTO[]>`
        select ${COLS} from subscriptions where user_id = ${p.userId} and status = 'cancelada' order by created_at desc limit 1`;
      if (cancelada && calcularAcesso(cancelada).liberado) {
        return { ok: false, status: 409, codigo: "reativar", mensagem: "Sua assinatura cancelada ainda vale. Reative para continuar sem pagar de novo agora." };
      }
    }

    const teste = !(await jaUsouTeste(p.userId, tx));
    const provider = await billing();
    const agora = Date.now();
    const valor = precoCentavos(p.plano, p.ciclo);
    const ext = await provider.criarAssinatura({
      userId: p.userId, nome: p.nome, email: p.email, plano: p.plano, ciclo: p.ciclo, metodo: p.metodo,
      valorCentavos: valor, primeiraCobranca: new Date(agora + (teste ? TRIAL_DAYS : 0) * DIA),
    });
    try {
      let status: "trial" | "ativa" | "inadimplente";
      let fimTeste: Date | null = null;
      let fimPeriodo: Date;
      if (teste) {
        status = "trial";
        fimTeste = new Date(agora + TRIAL_DAYS * DIA);
        fimPeriodo = fimTeste;
      } else if (ext.confirmadoNaHora) {
        status = "ativa";
        const d = new Date(agora);
        if (p.ciclo === "anual") d.setFullYear(d.getFullYear() + 1);
        else d.setMonth(d.getMonth() + 1);
        fimPeriodo = d;
      } else {
        // Aguardando o 1º pagamento: sem acesso até o webhook confirmar.
        status = "inadimplente";
        fimPeriodo = new Date(agora - DIAS_TOLERANCIA_INADIMPLENCIA * DIA - 1000);
      }
      const [s] = await tx<AssinaturaDTO[]>`
        insert into subscriptions (user_id, plano, ciclo, status, metodo, trial_ends_at, current_period_end,
                                   provider, provider_customer_id, provider_subscription_id)
        values (${p.userId}, ${p.plano}, ${p.ciclo}, ${status}, ${p.metodo}, ${fimTeste}, ${fimPeriodo},
                ${provider.nome}, ${ext.customerId}, ${ext.subscriptionId})
        returning ${COLS}`;
      if (teste) {
        await tx`insert into testes_usados (email_hash) values (${hashEmail(p.email)}) on conflict do nothing`;
      }
      if (!teste && ext.confirmadoNaHora) {
        await tx`insert into payments (subscription_id, user_id, valor_centavos, status, metodo, provider_payment_id, vencimento, pago_em)
                 values (${s.id}, ${p.userId}, ${valor}, 'pago', ${p.metodo}, ${`${provider.nome}_pay_${randomUUID()}`},
                         (now() at time zone 'America/Sao_Paulo')::date, now())`;
      }
      await tx`insert into audit_log (actor_id, acao, entidade, entidade_id, dados)
               values (${p.userId}, ${teste ? "teste_iniciado" : "assinatura_criada"}, 'subscription', ${s.id},
                       ${sql.json({ plano: p.plano, ciclo: p.ciclo, metodo: p.metodo, status })})`;
      return { ok: true as const, assinatura: s, checkoutUrl: ext.checkoutUrl, teste };
    } catch (e) {
      // O banco não gravou: desfaz a cobrança criada no provedor para não cobrar sem acesso.
      await provider.cancelarAssinatura(ext.subscriptionId).catch((err) => console.error("[billing] falha ao desfazer assinatura", err));
      throw e;
    }
  });
}

/**
 * Reativar uma assinatura cancelada que ainda está no período pago (ou no teste):
 * volta a cobrar a partir do fim do período, sem cobrar nada agora.
 */
export async function reativarAssinatura(userId: string, nome: string, email: string): Promise<ResultadoAssinar> {
  return sql.begin(async (tx) => {
    await travarUsuario(tx, userId);
    const [viva] = await tx`select 1 from subscriptions where user_id = ${userId} and ${VIVAS}`;
    if (viva) return { ok: false, status: 409, codigo: "ja_assinante", mensagem: "Sua assinatura já está ativa." };
    const [c] = await tx<(AssinaturaDTO & LinhaProvedor)[]>`
      select ${COLS}, provider, provider_subscription_id from subscriptions
      where user_id = ${userId} and status = 'cancelada' order by created_at desc limit 1`;
    const fim = c ? Math.max(c.current_period_end ? +new Date(c.current_period_end) : 0, c.trial_ends_at ? +new Date(c.trial_ends_at) : 0) : 0;
    if (!c || fim <= Date.now()) {
      return { ok: false, status: 409, codigo: "nada_para_reativar", mensagem: "Não há assinatura cancelada dentro do período. Escolha um plano para assinar." };
    }
    const emTeste = !!c.trial_ends_at && +new Date(c.trial_ends_at) > Date.now() && fim === +new Date(c.trial_ends_at);
    let ids = { customerId: null as string | null, subscriptionId: c.provider_subscription_id };
    let provedor = c.provider;
    if (c.provider !== "cortesia") {
      const provider = await billing();
      const ext = await provider.criarAssinatura({
        userId, nome, email, plano: c.plano, ciclo: c.ciclo, metodo: c.metodo ?? "pix_automatico",
        valorCentavos: precoCentavos(c.plano, c.ciclo), primeiraCobranca: new Date(fim),
      });
      ids = { customerId: ext.customerId, subscriptionId: ext.subscriptionId };
      provedor = provider.nome;
    }
    const [s] = await tx<AssinaturaDTO[]>`
      update subscriptions set status = ${emTeste ? "trial" : "ativa"}, cancel_at_period_end = false, canceled_at = null,
        provider = ${provedor}, provider_customer_id = coalesce(${ids.customerId}, provider_customer_id),
        provider_subscription_id = ${ids.subscriptionId}, updated_at = now()
      where id = ${c.id} returning ${COLS}`;
    await tx`insert into audit_log (actor_id, acao, entidade, entidade_id) values (${userId}, 'assinatura_reativada', 'subscription', ${s.id})`;
    return { ok: true as const, assinatura: s, checkoutUrl: null, teste: emTeste };
  });
}

export async function trocarPlano(userId: string, plano: Plano, ciclo: Ciclo) {
  const [s] = await sql<AssinaturaDTO[]>`
    update subscriptions set plano = ${plano}, ciclo = ${ciclo}, updated_at = now()
    where user_id = ${userId} and status in ('trial','ativa','inadimplente') returning ${COLS}`;
  return s ?? null;
}

/** Cancelar: continua usando até o fim do período pago / do teste, sem nova cobrança. */
export async function cancelarAssinatura(userId: string) {
  const [s] = await sql<AssinaturaDTO[]>`
    update subscriptions set status = 'cancelada', cancel_at_period_end = true, canceled_at = now(), updated_at = now()
    where user_id = ${userId} and status in ('trial','ativa','inadimplente') returning ${COLS}`;
  return s ?? null;
}
