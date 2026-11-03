// Testes das correções da revisão adversarial da base: cobrança, LGPD, limites, radar, agenda, validação.
import "./helpers/ambiente";
import { criarUsuario, fecharBanco, prepararBanco } from "./helpers/banco";
import { after, before, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { sql } from "@/lib/db";
import type { BillingProvider } from "@/lib/billing";

// As rotas leem a sessão e o IP de next/headers: simulamos o header Authorization (como o app) e o IP.
let tokenAtual: string | null = null;
let ipAtual = "10.0.0.1";
mock.module("next/headers", {
  namedExports: {
    headers: async () => new Headers({ ...(tokenAtual ? { authorization: `Bearer ${tokenAtual}` } : {}), "x-forwarded-for": ipAtual }),
    cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
  },
});

const DIA = 86_400_000;
const BASE = "https://avisoconcurso.com.br/api/v1";

// Provedor de cobrança de teste: registra chamadas; não confirma pagamento na hora (como o Asaas).
const chamadasProvedor: { acao: string; id?: string }[] = [];
let seq = 0;
const provedorTeste: BillingProvider = {
  nome: "teste",
  async criarAssinatura() {
    seq++;
    chamadasProvedor.push({ acao: "criar", id: `sub_teste_${seq}` });
    return { customerId: `cus_teste_${seq}`, subscriptionId: `sub_teste_${seq}`, checkoutUrl: `https://pagar.exemplo/${seq}` };
  },
  async atualizarValor() {},
  async cancelarAssinatura(id) {
    chamadasProvedor.push({ acao: "cancelar", id });
  },
};

type Handler = (req: Request, ctx?: { params: Promise<Record<string, string>> }) => Promise<Response>;
async function chamar(h: Handler, metodo: string, caminho: string, corpo?: unknown, params?: Record<string, string>) {
  const r = await h(
    new Request(`${BASE}${caminho}`, {
      method: metodo,
      headers: { "content-type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    }),
    { params: Promise.resolve(params ?? {}) },
  );
  return { status: r.status, corpo: (await r.json()) as Record<string, unknown> & { erro?: { codigo: string; mensagem: string } } };
}

let R: Record<string, Record<string, Handler>>;
async function token(userId: string) {
  const { criarSessao } = await import("@/lib/auth/session");
  return (await criarSessao(userId, "app")).token;
}
async function concurso(sigla: string, status = "edital_aberto", extra: { publicado?: boolean } = {}) {
  const [c] = await sql<{ id: string }[]>`
    insert into contests (slug, dedup_key, orgao, orgao_sigla, esfera, uf, status, titulo, url_oficial, escolaridades, areas, publicado, edital_texto)
    values (${sigla.toLowerCase()}, ${`${sigla}|1/2026|2026`}, ${`Órgão ${sigla}`}, ${sigla}, 'federal', null, ${status}, ${`${sigla} · Cargo`},
            ${`https://www.in.gov.br/${sigla.toLowerCase()}`}, '{superior}', '{fiscal}', ${extra.publicado ?? true}, 'EDITAL\n5.1 Isenção para CadÚnico.')
    returning id`;
  await sql`insert into contest_dates (contest_id, tipo, inicio, fim) values (${c.id}, 'prova', current_date + 20, current_date + 20)`;
  return c.id;
}

before(async () => {
  await prepararBanco();
  const { registrarProvedor } = await import("@/lib/billing");
  registrarProvedor("teste", async () => provedorTeste);
  R = {
    checkout: await import("@/app/api/v1/assinatura/checkout/route"),
    cancelar: await import("@/app/api/v1/assinatura/cancelar/route"),
    reativar: await import("@/app/api/v1/assinatura/reativar/route"),
    assinatura: await import("@/app/api/v1/assinatura/route"),
    me: await import("@/app/api/v1/me/route"),
    cadastro: await import("@/app/api/v1/auth/cadastro/route"),
    login: await import("@/app/api/v1/auth/login/route"),
    hoje: await import("@/app/api/v1/hoje/route"),
    concursos: await import("@/app/api/v1/concursos/route"),
    acompanhar: await import("@/app/api/v1/concursos/[id]/acompanhar/route"),
    agenda: await import("@/app/api/v1/agenda/route"),
    ajustes: await import("@/app/api/v1/ajustes/route"),
    perguntas: await import("@/app/api/v1/concursos/[id]/perguntas/route"),
    materias: await import("@/app/api/v1/materias/route"),
    acompanhando: await import("@/app/api/v1/acompanhando/route"),
  } as unknown as Record<string, Record<string, Handler>>;
});
after(fecharBanco);
beforeEach(() => {
  delete process.env.BILLING_PROVIDER;
  chamadasProvedor.length = 0;
  ipAtual = `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
});

describe("checkout e assinatura", () => {
  it("teste uma vez; segundo checkout com acesso em dia → 409 (usar trocar)", async () => {
    const u = await criarUsuario({ nome: "Duda", email: "duda@t.com", plano: null });
    tokenAtual = await token(u);
    const a = await chamar(R.checkout.POST, "POST", "/assinatura/checkout", { plano: "aviso" });
    assert.equal(a.status, 201);
    assert.equal((a.corpo.assinatura as { status: string }).status, "trial");
    const b = await chamar(R.checkout.POST, "POST", "/assinatura/checkout", { plano: "aprovado" });
    assert.equal(b.status, 409);
    assert.equal(b.corpo.erro?.codigo, "ja_assinante");
  });

  it("checkouts simultâneos criam uma assinatura só (e só uma no provedor)", async () => {
    process.env.BILLING_PROVIDER = "teste";
    const u = await criarUsuario({ nome: "Eli", email: "eli@t.com", plano: null });
    tokenAtual = await token(u);
    const rs = await Promise.all(Array.from({ length: 4 }, () => chamar(R.checkout.POST, "POST", "/assinatura/checkout", { plano: "aviso" })));
    assert.equal(rs.filter((r) => r.status === 201).length, 1);
    assert.equal(chamadasProvedor.filter((c) => c.acao === "criar").length, 1);
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from subscriptions where user_id = ${u}`;
    assert.equal(n, 1);
  });

  it("quem já usou o teste: sem pagamento confirmado não tem acesso (nada de 'ativa' sem prazo)", async () => {
    process.env.BILLING_PROVIDER = "teste";
    const u = await criarUsuario({ nome: "Fabi", email: "fabi@t.com", plano: "aviso", status: "trial", trialEndsAt: new Date(Date.now() - 5 * DIA) });
    await sql`update subscriptions set status = 'expirada', provider = 'teste', provider_subscription_id = 'sub_velha_fabi' where user_id = ${u}`;
    tokenAtual = await token(u);
    const r = await chamar(R.checkout.POST, "POST", "/assinatura/checkout", { plano: "aprovado" });
    assert.equal(r.status, 201);
    const sub = r.corpo.assinatura as { status: string; trial_ends_at: string | null };
    assert.equal(sub.status, "inadimplente");
    assert.equal(sub.trial_ends_at, null);
    assert.equal(r.corpo.checkout_url, "https://pagar.exemplo/" + seq);
    const h = await chamar(R.hoje.GET, "GET", "/hoje");
    assert.equal(h.status, 402, "sem acesso até o webhook confirmar o pagamento");
    const { calcularAcesso } = await import("@aviso/shared");
    assert.equal(calcularAcesso({ plano: "aprovado", status: "ativa", trial_ends_at: null, current_period_end: null }).liberado, false);
  });

  it("assinatura antiga inadimplente é cancelada no provedor antes da nova", async () => {
    process.env.BILLING_PROVIDER = "teste";
    const u = await criarUsuario({ nome: "Gabi", email: "gabi@t.com", plano: "aviso", status: "inadimplente", periodEnd: new Date(Date.now() - 10 * DIA) });
    await sql`update subscriptions set trial_ends_at = now() - interval '40 days', provider = 'teste', provider_subscription_id = 'sub_velha_gabi' where user_id = ${u}`;
    tokenAtual = await token(u);
    const r = await chamar(R.checkout.POST, "POST", "/assinatura/checkout", { plano: "aviso" });
    assert.equal(r.status, 201);
    assert.ok(chamadasProvedor.some((c) => c.acao === "cancelar" && c.id === "sub_velha_gabi"));
    const vivas = await sql`select 1 from subscriptions where user_id = ${u} and status in ('trial','ativa','inadimplente')`;
    assert.equal(vivas.length, 1);
  });

  it("mock confirma na hora: ativa com período e pagamento registrado", async () => {
    const u = await criarUsuario({ nome: "Hugo", email: "hugo@t.com", plano: "aviso", status: "expirada", trialEndsAt: new Date(Date.now() - 9 * DIA) });
    tokenAtual = await token(u);
    const r = await chamar(R.checkout.POST, "POST", "/assinatura/checkout", { plano: "aviso", ciclo: "anual" });
    const sub = r.corpo.assinatura as { status: string; current_period_end: string };
    assert.equal(sub.status, "ativa");
    assert.ok(new Date(sub.current_period_end).getTime() > Date.now() + 360 * DIA);
    const [p] = await sql<{ valor_centavos: number; status: string }[]>`select valor_centavos, status from payments where user_id = ${u}`;
    assert.deepEqual(p, { valor_centavos: 9900, status: "pago" });
  });

  it("cancelar → checkout pede reativar → reativar volta ao teste sem cobrar agora", async () => {
    process.env.BILLING_PROVIDER = "teste";
    const u = await criarUsuario({ nome: "Iara", email: "iara@t.com", plano: null });
    tokenAtual = await token(u);
    await chamar(R.checkout.POST, "POST", "/assinatura/checkout", { plano: "aprovado" });
    const c = await chamar(R.cancelar.POST, "POST", "/assinatura/cancelar");
    assert.equal((c.corpo as { status: string }).status, "cancelada");
    assert.ok(chamadasProvedor.some((x) => x.acao === "cancelar"));
    const d = await chamar(R.checkout.POST, "POST", "/assinatura/checkout", { plano: "aprovado" });
    assert.equal(d.corpo.erro?.codigo, "reativar");
    const e = await chamar(R.reativar.POST, "POST", "/assinatura/reativar");
    assert.equal(e.status, 200);
    assert.equal((e.corpo as { status: string; cancel_at_period_end: boolean }).status, "trial");
    assert.equal((e.corpo as { cancel_at_period_end: boolean }).cancel_at_period_end, false);
    assert.equal(chamadasProvedor.filter((x) => x.acao === "criar").length, 2, "nova cobrança recorrente a partir do fim do teste");
  });
});

describe("excluir conta (LGPD)", () => {
  it("cancela a cobrança no provedor e não dá novo teste ao recadastrar o mesmo e-mail", async () => {
    process.env.BILLING_PROVIDER = "teste";
    const u = await criarUsuario({ nome: "Juca", email: "juca@t.com", plano: null });
    tokenAtual = await token(u);
    await chamar(R.checkout.POST, "POST", "/assinatura/checkout", { plano: "aviso" });
    const [{ provider_subscription_id: idProv }] = await sql<{ provider_subscription_id: string }[]>`
      select provider_subscription_id from subscriptions where user_id = ${u}`;
    const del = await chamar(R.me.DELETE, "DELETE", "/me");
    assert.equal(del.status, 200);
    assert.ok(chamadasProvedor.some((c) => c.acao === "cancelar" && c.id === idProv), "cobrança cancelada no provedor");
    tokenAtual = null;
    const cad = await chamar(R.cadastro.POST, "POST", "/auth/cadastro", { nome: "Juca", email: "JUCA@t.com", senha: "senha-forte-123", aceito_termos: true });
    assert.equal(cad.status, 201);
    tokenAtual = cad.corpo.token as string;
    const a = await chamar(R.assinatura.GET, "GET", "/assinatura");
    assert.equal(a.corpo.podeTestar, false);
    const r = await chamar(R.checkout.POST, "POST", "/assinatura/checkout", { plano: "aviso" });
    assert.notEqual((r.corpo.assinatura as { status: string }).status, "trial");
  });
});

describe("Pergunte ao edital: limite sob concorrência", () => {
  it("com 28 perguntas no mês, 6 pedidos simultâneos → só 2 passam", async () => {
    const u = await criarUsuario({ nome: "Kika", email: "kika@t.com", plano: "aprovado", status: "ativa", periodEnd: new Date(Date.now() + 20 * DIA) });
    const c = await concurso("PERG");
    for (let i = 0; i < 28; i++) await sql`insert into questions (user_id, contest_id, pergunta, resposta) values (${u}, ${c}, 'p', 'r')`;
    tokenAtual = await token(u);
    const rs = await Promise.all(
      Array.from({ length: 6 }, () => chamar(R.perguntas.POST, "POST", `/concursos/${c}/perguntas`, { pergunta: "Quem tem isenção?" }, { id: c })),
    );
    assert.equal(rs.filter((r) => r.status === 201).length, 2);
    assert.equal(rs.filter((r) => r.status === 429).length, 4);
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from questions where user_id = ${u}`;
    assert.equal(n, 30);
  });
});

describe("radar só no Aprovado", () => {
  let aviso: string, aprovado: string, autorizado: string;
  before(async () => {
    aviso = await criarUsuario({ nome: "Lia", email: "lia@t.com", plano: "aviso", status: "ativa", periodEnd: new Date(Date.now() + 20 * DIA), perfil: { areas: ["fiscal"] } });
    aprovado = await criarUsuario({ nome: "Mel", email: "mel@t.com", plano: "aprovado", status: "ativa", periodEnd: new Date(Date.now() + 20 * DIA), perfil: { areas: ["fiscal"] } });
    autorizado = await concurso("RADAR", "autorizado");
  });

  it("plano Aviso: não vê autorizados na busca nem nas novidades; radar=1 → 403; acompanhar → 403", async () => {
    tokenAtual = await token(aviso);
    const b = await chamar(R.concursos.GET, "GET", "/concursos");
    assert.ok(!(b.corpo.itens as { id: string }[]).some((i) => i.id === autorizado));
    const st = await chamar(R.concursos.GET, "GET", "/concursos?status=autorizado");
    assert.equal((st.corpo.itens as unknown[]).length, 0);
    assert.equal((await chamar(R.concursos.GET, "GET", "/concursos?radar=1")).status, 403);
    const h = await chamar(R.hoje.GET, "GET", "/hoje");
    assert.ok(!(h.corpo.novidades as { id: string }[]).some((i) => i.id === autorizado));
    const a = await chamar(R.acompanhar.POST, "POST", `/concursos/${autorizado}/acompanhar`, {}, { id: autorizado });
    assert.equal(a.status, 403);
  });

  it("plano Aprovado: vê e acompanha", async () => {
    tokenAtual = await token(aprovado);
    const r = await chamar(R.concursos.GET, "GET", "/concursos?radar=1");
    assert.ok((r.corpo.itens as { id: string }[]).some((i) => i.id === autorizado));
    const h = await chamar(R.hoje.GET, "GET", "/hoje");
    assert.ok((h.corpo.novidades as { id: string }[]).some((i) => i.id === autorizado));
    assert.equal((await chamar(R.acompanhar.POST, "POST", `/concursos/${autorizado}/acompanhar`, {}, { id: autorizado })).status, 201);
  });
});

describe("acompanhar", () => {
  it("5 'acompanhar' ao mesmo tempo → 5 cores diferentes", async () => {
    const u = await criarUsuario({ nome: "Nina", email: "nina@t.com", plano: "aviso", status: "ativa", periodEnd: new Date(Date.now() + 20 * DIA) });
    const ids = await Promise.all(["C1", "C2", "C3", "C4", "C5"].map((s) => concurso(s)));
    tokenAtual = await token(u);
    await Promise.all(ids.map((id) => chamar(R.acompanhar.POST, "POST", `/concursos/${id}/acompanhar`, {}, { id })));
    const cores = await sql<{ cor: string }[]>`select cor from follows where user_id = ${u}`;
    assert.equal(new Set(cores.map((c) => c.cor)).size, 5);
  });

  it("concurso despublicado sai da agenda e dá para deixar de acompanhar", async () => {
    const u = await criarUsuario({ nome: "Otto", email: "otto@t.com", plano: "aviso", status: "ativa", periodEnd: new Date(Date.now() + 20 * DIA) });
    const c = await concurso("DESPUB");
    tokenAtual = await token(u);
    await chamar(R.acompanhar.POST, "POST", `/concursos/${c}/acompanhar`, {}, { id: c });
    assert.equal(((await chamar(R.agenda.GET, "GET", "/agenda")).corpo as unknown as unknown[]).length, 1);
    await sql`update contests set publicado = false where id = ${c}`;
    assert.equal(((await chamar(R.agenda.GET, "GET", "/agenda")).corpo as unknown as unknown[]).length, 0);
    assert.equal(((await chamar(R.acompanhando.GET, "GET", "/acompanhando")).corpo as unknown as unknown[]).length, 0);
    const d = await chamar(R.acompanhar.DELETE, "DELETE", `/concursos/${c}/acompanhar`, undefined, { id: c });
    assert.equal(d.status, 200);
    assert.equal((await sql`select 1 from follows where user_id = ${u}`).length, 0);
  });

  it("cargo de outro concurso é recusado", async () => {
    const u = await criarUsuario({ nome: "Pia", email: "pia@t.com", plano: "aviso", status: "ativa", periodEnd: new Date(Date.now() + 20 * DIA) });
    const a = await concurso("CARGOA");
    const b = await concurso("CARGOB");
    const [r] = await sql<{ id: string }[]>`insert into contest_roles (contest_id, nome) values (${b}, 'Analista') returning id`;
    tokenAtual = await token(u);
    const x = await chamar(R.acompanhar.POST, "POST", `/concursos/${a}/acompanhar`, { role_id: r.id }, { id: a });
    assert.equal(x.status, 422);
  });
});

describe("matérias em comum", () => {
  it("não soma cargos do mesmo edital; com cargo escolhido usa o do cargo", async () => {
    const u = await criarUsuario({ nome: "Quel", email: "quel@t.com", plano: "aviso", status: "ativa", periodEnd: new Date(Date.now() + 20 * DIA) });
    const c = await concurso("MAT");
    const [pt] = await sql<{ id: string }[]>`select id from subjects where nome = 'Língua Portuguesa'`;
    const [ra] = await sql<{ id: string }[]>`insert into contest_roles (contest_id, nome) values (${c}, 'Técnico') returning id`;
    const [rb] = await sql<{ id: string }[]>`insert into contest_roles (contest_id, nome) values (${c}, 'Analista') returning id`;
    await sql`insert into contest_subjects (contest_id, role_id, subject_id, questoes) values
      (${c}, null, ${pt.id}, 10), (${c}, ${ra.id}, ${pt.id}, 15), (${c}, ${rb.id}, ${pt.id}, 20)`;
    tokenAtual = await token(u);
    await chamar(R.acompanhar.POST, "POST", `/concursos/${c}/acompanhar`, {}, { id: c });
    const m1 = await chamar(R.materias.GET, "GET", "/materias");
    assert.equal((m1.corpo.materias as { nome: string; questoesTotal: number }[]).find((m) => m.nome === "Língua Portuguesa")?.questoesTotal, 10);
    await chamar(R.acompanhar.PATCH, "PATCH", `/concursos/${c}/acompanhar`, { role_id: rb.id }, { id: c });
    const m2 = await chamar(R.materias.GET, "GET", "/materias");
    assert.equal((m2.corpo.materias as { nome: string; questoesTotal: number }[]).find((m) => m.nome === "Língua Portuguesa")?.questoesTotal, 20);
  });
});

describe("login e validação", () => {
  it("bloqueia depois de 10 erros no mesmo e-mail (429), sem revelar se a conta existe", async () => {
    tokenAtual = null;
    const { hashSenha } = await import("@/lib/auth/password");
    await sql`insert into users (nome, email, senha_hash) values ('Rui', 'rui@t.com', ${await hashSenha("senha-certa-123")})`;
    for (let i = 0; i < 10; i++) {
      const r = await chamar(R.login.POST, "POST", "/auth/login", { email: "rui@t.com", senha: "errada" });
      assert.equal(r.status, 401);
    }
    const bloqueado = await chamar(R.login.POST, "POST", "/auth/login", { email: "rui@t.com", senha: "senha-certa-123" });
    assert.equal(bloqueado.status, 429);
    const inexistente = await chamar(R.login.POST, "POST", "/auth/login", { email: "ninguem@t.com", senha: "x" });
    assert.equal(inexistente.status, 401);
    assert.equal(inexistente.corpo.erro?.mensagem, "E-mail ou senha incorretos.");
  });

  it("entradas mal formadas viram 422, não 500", async () => {
    const u = await criarUsuario({ nome: "Sol", email: "sol@t.com", plano: "aviso", status: "ativa", periodEnd: new Date(Date.now() + 20 * DIA) });
    tokenAtual = await token(u);
    assert.equal((await chamar(R.concursos.GET, "GET", "/concursos?pagina=abc")).status, 422);
    assert.equal((await chamar(R.concursos.GET, "GET", "/concursos?por_pagina=2.5")).status, 422);
    assert.equal((await chamar(R.agenda.GET, "GET", "/agenda?de=2026-02-30")).status, 422);
    assert.equal((await chamar(R.ajustes.PUT, "PUT", "/ajustes", { silencio_inicio: "24:00" })).status, 422);
    assert.equal((await chamar(R.concursos.GET, "GET", "/concursos?q=100%25")).status, 200);
  });
});
