import { FIXTURES } from "./helpers/ambiente";
import { br, criarUsuario, fecharBanco, prepararBanco, simularFetch } from "./helpers/banco";
import { after, before, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "@/lib/db";
import { POST } from "@/app/api/webhooks/asaas/route";
import { asaasProvider } from "@/lib/billing/asaas";

// Payloads montados a partir da documentação pública do Asaas (eventos PAYMENT_* e SUBSCRIPTION_*),
// em tests/fixtures/asaas/. A API do Asaas não é acessível deste ambiente para gravar ao vivo.
const payload = (nome: string) => JSON.parse(readFileSync(path.join(FIXTURES, "asaas", nome), "utf8"));

function requisicao(corpo: unknown, token: string | null = process.env.ASAAS_WEBHOOK_TOKEN!) {
  return new Request("https://avisoconcurso.com.br/api/webhooks/asaas", {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { "asaas-access-token": token } : {}) },
    body: JSON.stringify(corpo),
  });
}

let ana: string;
let outra: string;

async function sub(userId: string) {
  const [s] = await sql<{ status: string; current_period_end: Date | null; cancel_at_period_end: boolean }[]>`
    select status, current_period_end, cancel_at_period_end from subscriptions where user_id = ${userId}`;
  return s;
}

async function pagamentos(userId: string) {
  return sql<{ provider_payment_id: string; status: string; valor_centavos: number; vencimento: string; metodo: string }[]>`
    select provider_payment_id, status, valor_centavos, vencimento, metodo from payments where user_id = ${userId} order by vencimento`;
}

before(async () => {
  await prepararBanco();
  ana = await criarUsuario({ nome: "Ana", email: "ana@t.com", plano: "aprovado", status: "trial", trialEndsAt: br("2026-11-04T10:00:00"), providerSubscriptionId: "sub_VXJBYgP2u0eO" });
  outra = await criarUsuario({ nome: "Otávio", email: "otavio@t.com", plano: "aviso", status: "ativa", periodEnd: br("2026-12-01T10:00:00"), providerSubscriptionId: "sub_OUTRA123" });
});

after(fecharBanco);

describe("webhook do Asaas", () => {
  it("recusa sem o token certo", async () => {
    assert.equal((await POST(requisicao(payload("payment-confirmed.json"), null))).status, 401);
    assert.equal((await POST(requisicao(payload("payment-confirmed.json"), "errado"))).status, 401);
    assert.equal((await pagamentos(ana)).length, 0);
  });

  it("pagamento confirmado: ativa a assinatura com novo fim de período; repetido não duplica", async () => {
    const r1 = await POST(requisicao(payload("payment-confirmed.json")));
    assert.equal(r1.status, 200);
    const r2 = await POST(requisicao(payload("payment-confirmed.json")));
    assert.equal(r2.status, 200);
    assert.equal(((await r2.json()) as { duplicado?: boolean }).duplicado, true);
    // Outro evento do mesmo pagamento (RECEIVED) também não duplica nem estende de novo.
    assert.equal((await POST(requisicao(payload("payment-received.json")))).status, 200);
    const ps = await pagamentos(ana);
    assert.equal(ps.length, 1);
    assert.deepEqual(ps[0], { provider_payment_id: "pay_080225913252", status: "pago", valor_centavos: 1990, vencimento: "2026-11-04", metodo: "cartao" });
    const s = await sub(ana);
    assert.equal(s.status, "ativa");
    assert.equal(s.current_period_end?.toISOString().slice(0, 10), "2026-12-04");
    assert.equal((await sql`select 1 from webhook_events`).length, 2);
  });

  it("evento fora de ordem (PENDING depois de pago) não regride o pagamento", async () => {
    await POST(requisicao(payload("payment-updated-pending.json")));
    assert.equal((await pagamentos(ana))[0].status, "pago");
    assert.equal((await sub(ana)).status, "ativa");
  });

  it("cobrança vencida → inadimplente", async () => {
    await POST(requisicao(payload("payment-overdue.json")));
    const ps = await pagamentos(ana);
    assert.equal(ps.length, 2);
    assert.deepEqual([ps[1].status, ps[1].metodo], ["pendente", "pix"]);
    assert.equal((await sub(ana)).status, "inadimplente");
  });

  it("estorno → pagamento estornado e assinatura cancelada", async () => {
    await POST(requisicao(payload("payment-refunded.json")));
    assert.equal((await pagamentos(ana)).find((p) => p.provider_payment_id === "pay_080225913252")?.status, "estornado");
    const s = await sub(ana);
    assert.equal(s.status, "cancelada");
    assert.equal(s.cancel_at_period_end, true);
  });

  it("assinatura apagada no Asaas → cancelada (usa até o fim do período)", async () => {
    await POST(requisicao(payload("subscription-deleted.json")));
    const s = await sub(outra);
    assert.equal(s.status, "cancelada");
    assert.equal(s.current_period_end?.toISOString().slice(0, 10), "2026-12-01");
  });

  it("evento de assinatura desconhecida é registrado e ignorado", async () => {
    const p = payload("payment-confirmed.json");
    p.id = "evt_desconhecido";
    p.payment.id = "pay_x";
    p.payment.subscription = "sub_nao_existe";
    const r = await POST(requisicao(p));
    assert.equal(r.status, 200);
    assert.match(((await r.json()) as { acao: string }).acao, /ignorado/);
    assert.equal((await sql`select 1 from payments where provider_payment_id = 'pay_x'`).length, 0);
  });
});

describe("provedor Asaas", () => {
  it("cria cliente e assinatura com 1ª cobrança no fim do teste e devolve o link da fatura", async () => {
    const chamadas = simularFetch((c) => {
      if (c.url.includes("/customers?")) return { json: { data: [] } };
      if (c.url.endsWith("/customers")) return { json: { id: "cus_novo" } };
      if (c.url.endsWith("/subscriptions")) return { json: { id: "sub_novo" } };
      if (c.url.includes("/subscriptions/sub_novo/payments")) return { json: { data: [{ invoiceUrl: "https://sandbox.asaas.com/i/123" }] } };
      return { status: 404, json: {} };
    });
    const r = await asaasProvider.criarAssinatura({
      userId: ana, nome: "Ana", email: "ana@t.com", plano: "aprovado", ciclo: "mensal", metodo: "cartao", valorCentavos: 1990,
      primeiraCobranca: br("2026-11-04T10:00:00"),
    });
    assert.deepEqual(r, { customerId: "cus_novo", subscriptionId: "sub_novo", checkoutUrl: "https://sandbox.asaas.com/i/123" });
    const criar = chamadas.find((c) => c.url.endsWith("/subscriptions"))!;
    assert.deepEqual(
      { ...(criar.corpo as object), description: undefined },
      { customer: "cus_novo", billingType: "CREDIT_CARD", value: 19.9, nextDueDate: "2026-11-04", cycle: "MONTHLY", description: undefined, externalReference: ana },
    );
    assert.equal(criar.headers["access_token"], process.env.ASAAS_API_KEY);
    mock.restoreAll();
  });
});
