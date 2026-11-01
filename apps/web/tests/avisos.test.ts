import { FIXTURES } from "./helpers/ambiente";
import { acompanhar, br, criarAparelho, criarUsuario, fecharBanco, prepararBanco, respostaPadrao, simularFetch, type ChamadaFetch } from "./helpers/banco";
import { after, before, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "@/lib/db";
import { enfileirarAviso, enviarPendentes } from "@/lib/notify/despachar";
import { conferirRecibos } from "@/lib/notify/push";
import { jobCobrancas, jobConvocacoes, jobLembretes } from "@/lib/pipeline/jobs";
import { guardarDocumento } from "@/lib/pipeline/coletores";
import { documentoDoArtigo } from "@/lib/pipeline/coletores/dou";
import { jobResumoSemanal } from "@/lib/notify/resumo-semanal";

const LONGE = br("2027-06-30T10:00:00");
let chamadas: ChamadaFetch[];
let ana: string, carla: string, gil: string, bruno: string, helena: string;
let x: string, y: string;

async function criarConcurso(sigla: string, datas: { tipo: string; inicio: string | null; fim: string | null }[]): Promise<string> {
  const [c] = await sql<{ id: string }[]>`
    insert into contests (slug, dedup_key, orgao, orgao_sigla, esfera, uf, status, titulo, url_oficial, escolaridades, areas)
    values (${sigla.toLowerCase()}, ${`${sigla.toLowerCase()}|1/2026|2026`}, ${`Órgão ${sigla}`}, ${sigla}, 'federal', 'SP', 'edital_aberto',
            ${`${sigla} · Técnico`}, ${`https://www.in.gov.br/${sigla.toLowerCase()}`}, '{medio}', '{tribunais}')
    returning id`;
  for (const d of datas) await sql`insert into contest_dates (contest_id, tipo, inicio, fim) values (${c.id}, ${d.tipo}, ${d.inicio}, ${d.fim})`;
  return c.id;
}

async function alertas(userId: string, where = sql``) {
  return sql<{ tipo: string; canal: string; status: string; agendado_para: Date | null; custo_centavos: string; url_oficial: string; erro: string | null }[]>`
    select tipo, canal, status, agendado_para, custo_centavos, url_oficial, erro from alerts where user_id = ${userId} ${where} order by tipo, canal`;
}

before(async () => {
  await prepararBanco();
  const whatsapp = { telefone: "+5511988887777", whatsappOptin: true, whatsappOn: true };
  ana = await criarUsuario({ nome: "Ana", email: "ana@t.com", plano: "aprovado", status: "trial", trialEndsAt: br("2026-12-31T10:00:00"), ...whatsapp, nomeBusca: "Ana Maria Concurseira da Silva", buscaNominal: true });
  carla = await criarUsuario({ nome: "Carla", email: "carla@t.com", plano: "aviso", status: "ativa", periodEnd: LONGE, ...whatsapp, nomeBusca: "Carlos Eduardo Pereira", buscaNominal: true });
  gil = await criarUsuario({ nome: "Gil", email: "gil@t.com", plano: "aprovado", status: "ativa", periodEnd: LONGE, ...whatsapp });
  bruno = await criarUsuario({ nome: "Bruno", email: "bruno@t.com", plano: null, ...whatsapp });
  helena = await criarUsuario({ nome: "Helena", email: "helena@t.com", plano: "aprovado", status: "ativa", periodEnd: LONGE, silencio: ["22:00", "07:00"] });
  for (const [u, t] of [[ana, "ana"], [carla, "carla"], [gil, "gil"], [bruno, "bruno"], [helena, "helena"]] as const) await criarAparelho(u, `ExponentPushToken[${t}]`);
  x = await criarConcurso("XPTO", [
    { tipo: "isencao", inicio: "2026-11-03", fim: "2026-11-09" },
    { tipo: "inscricao", inicio: "2026-11-03", fim: "2026-12-02" },
    { tipo: "local_prova", inicio: "2026-11-08", fim: "2026-11-08" },
    { tipo: "prova", inicio: "2027-01-17", fim: "2027-01-17" },
  ]);
  y = await criarConcurso("YPSILON", [{ tipo: "inscricao", inicio: "2026-10-20", fim: "2026-11-09" }]);
  for (const u of [ana, carla, gil, bruno]) await acompanhar(u, x);
  await acompanhar(ana, y);
  // Gil já recebeu 10 WhatsApp neste mês.
  for (let i = 0; i < 10; i++) {
    await sql`insert into alerts (user_id, tipo, canal, titulo, corpo, url_oficial, dedup_key, status, enviado_em, created_at)
              values (${gil}, 'inscricao_acabando', 'whatsapp', 't', 'c', 'https://www.in.gov.br', ${`gil-wa-${i}`}, 'enviado', ${br("2026-11-02T10:00:00")}, ${br("2026-11-02T10:00:00")})`;
  }
  // Ana já recebeu 9.
  for (let i = 0; i < 9; i++) {
    await sql`insert into alerts (user_id, tipo, canal, titulo, corpo, url_oficial, dedup_key, status, enviado_em, created_at)
              values (${ana}, 'inscricao_acabando', 'whatsapp', 't', 'c', 'https://www.in.gov.br', ${`ana-wa-${i}`}, 'enviado', ${br("2026-11-02T10:00:00")}, ${br("2026-11-02T10:00:00")})`;
  }
});

beforeEach(() => {
  mock.restoreAll();
  chamadas = simularFetch(respostaPadrao);
});

after(fecharBanco);

describe("lembretes de prazo", () => {
  it("na antecedência escolhida (3 dias); rodar 2x no mesmo dia não duplica", async () => {
    const agora = br("2026-11-06T08:00:00");
    const r1 = await jobLembretes(agora);
    const r2 = await jobLembretes(agora);
    assert.ok(r1.avisados >= 3);
    assert.equal(r2.avisados, 0);
    const deAna = await alertas(ana, sql`and tipo = 'isencao_acabando'`);
    assert.deepEqual(deAna.map((a) => a.canal), ["inapp", "push"]); // 3 dias antes: sem WhatsApp
    assert.equal((await alertas(bruno)).length, 0, "sem assinatura: nenhum aviso");
  });
});

describe("WhatsApp", () => {
  it('só no Aprovado, só "acaba amanhã" e nunca passa de 10 por mês', async () => {
    const agora = br("2026-11-08T08:00:00");
    await jobLembretes(agora);
    const waAna = await alertas(ana, sql`and canal = 'whatsapp' and created_at >= ${br("2026-11-08T00:00:00")}`);
    // Isenção do XPTO e inscrição do YPSILON acabam amanhã: só cabe 1 (9 + 1 = 10).
    assert.equal(waAna.length, 1);
    assert.equal(waAna[0].tipo, "isencao_acabando");
    assert.equal((await alertas(carla, sql`and canal = 'whatsapp'`)).length, 0, "plano Aviso nunca recebe WhatsApp");
    assert.equal((await alertas(gil, sql`and canal = 'whatsapp' and created_at >= ${br("2026-11-08T00:00:00")}`)).length, 0, "Gil já tinha 10");
    assert.deepEqual((await alertas(gil, sql`and tipo = 'isencao_acabando' and created_at >= ${br("2026-11-08T00:00:00")}`)).map((a) => a.canal), ["inapp", "push"]);
    assert.equal((await alertas(ana, sql`and tipo = 'local_prova'`)).length, 2, "dia do local de prova");

    const [{ n }] = await sql<{ n: number }[]>`
      select count(*)::int as n from alerts where user_id = ${ana} and canal = 'whatsapp' and status in ('pendente','enviado')
        and created_at >= ${br("2026-11-01T00:00:00")}`;
    assert.equal(n, 10);

    await enviarPendentes({ agora });
    const zap = chamadas.filter((c) => c.url.includes("graph.facebook.com"));
    assert.equal(zap.length, 1);
    const corpo = zap[0].corpo as { to: string; template: { name: string; components: { parameters: { text: string }[] }[] } };
    assert.equal(corpo.to, "5511988887777");
    assert.equal(corpo.template.name, "prazo_acabando_amanha");
    assert.deepEqual(corpo.template.components[0].parameters.map((p) => p.text), ["isenção da taxa", "XPTO", "09/11/2026", "https://www.in.gov.br/xpto"]);
    const [enviado] = await alertas(ana, sql`and canal = 'whatsapp' and status = 'enviado' and created_at >= ${br("2026-11-08T00:00:00")}`);
    assert.equal(Number(enviado.custo_centavos), 4.4);
  });

  it("nunca sai para o plano Aviso, mesmo pedindo direto", async () => {
    const r = await enfileirarAviso(
      { userId: carla, contestId: x, tipo: "inscricao_acabando", titulo: "t", corpo: "c", urlOficial: "https://www.in.gov.br/xpto", dedupKey: "carla-direto", diasAteFim: 1 },
      { agora: br("2026-11-08T09:00:00") },
    );
    assert.deepEqual(r.canais, ["inapp", "push"]);
  });
});

describe("horário silencioso e acesso", () => {
  it("adia o push (não descarta) e manda quando o silêncio acaba", async () => {
    const noite = br("2026-11-10T23:00:00");
    await enfileirarAviso({ userId: helena, contestId: x, tipo: "errata", titulo: "Errata no XPTO", corpo: "Mudou a prova.", urlOficial: "https://www.in.gov.br/xpto", dedupKey: "helena-errata" }, { agora: noite });
    const [push] = await alertas(helena, sql`and canal = 'push'`);
    assert.equal(push.status, "pendente");
    assert.equal(push.agendado_para?.toISOString(), br("2026-11-11T07:00:00").toISOString());
    const [inapp] = await alertas(helena, sql`and canal = 'inapp'`);
    assert.equal(inapp.status, "enviado", "no app aparece na hora");

    await enviarPendentes({ agora: br("2026-11-10T23:30:00") });
    assert.equal(chamadas.filter((c) => c.url.includes("exp.host") && JSON.stringify(c.corpo).includes("helena")).length, 0);
    await enviarPendentes({ agora: br("2026-11-11T07:05:00") });
    assert.equal(chamadas.filter((c) => c.url.includes("exp.host") && JSON.stringify(c.corpo).includes("helena")).length, 1);
    assert.equal((await alertas(helena, sql`and canal = 'push'`))[0].status, "enviado");
  });

  it("se o teste acabou enquanto o aviso esperava, ele não sai", async () => {
    const ivo = await criarUsuario({ nome: "Ivo", email: "ivo@t.com", plano: "aprovado", status: "trial", trialEndsAt: br("2026-11-11T06:00:00"), silencio: ["22:00", "07:00"] });
    await criarAparelho(ivo, "ExponentPushToken[ivo]");
    await enfileirarAviso({ userId: ivo, contestId: x, tipo: "errata", titulo: "t", corpo: "c", urlOficial: "https://www.in.gov.br/xpto", dedupKey: "ivo-errata" }, { agora: br("2026-11-10T23:00:00") });
    await enviarPendentes({ agora: br("2026-11-11T07:05:00") });
    const [push] = await alertas(ivo, sql`and canal = 'push'`);
    assert.equal(push.status, "suprimido");
    assert.equal(chamadas.filter((c) => JSON.stringify(c.corpo).includes("ExponentPushToken[ivo]")).length, 0);
  });
});

describe("Expo: tickets e recibos", () => {
  it("DeviceNotRegistered (no ticket ou no recibo) desativa o aparelho", async () => {
    const joana = await criarUsuario({ nome: "Joana", email: "joana@t.com", plano: "aprovado", status: "ativa", periodEnd: LONGE });
    const ruim = await criarAparelho(joana, "ExponentPushToken[Invalido]");
    const bom = await criarAparelho(joana, "ExponentPushToken[joana-bom]");
    const agora = br("2026-11-12T12:00:00");
    await enfileirarAviso({ userId: joana, contestId: x, tipo: "errata", titulo: "t", corpo: "c", urlOficial: "https://www.in.gov.br/xpto", dedupKey: "joana-1" }, { agora });
    await enviarPendentes({ agora });
    const ativos = await sql<{ id: string; ativo: boolean }[]>`select id, ativo from devices where user_id = ${joana}`;
    assert.equal(ativos.find((d) => d.id === ruim)?.ativo, false);
    assert.equal(ativos.find((d) => d.id === bom)?.ativo, true);
    const [ticket] = await sql<{ ticket_id: string }[]>`select ticket_id from push_tickets where device_id = ${bom}`;

    mock.restoreAll();
    simularFetch((c) =>
      c.url.endsWith("/getReceipts")
        ? { json: { data: { [ticket.ticket_id]: { status: "error", message: "gone", details: { error: "DeviceNotRegistered" } } } } }
        : respostaPadrao(c),
    );
    // Recibos ficam prontos ~15 min depois do envio (created_at do ticket é a hora real do envio).
    const r = await conferirRecibos(new Date(Date.now() + 20 * 60_000));
    assert.equal(r.desativados, 1);
    const [d] = await sql<{ ativo: boolean }[]>`select ativo from devices where id = ${bom}`;
    assert.equal(d.ativo, false);
    const [a] = await alertas(joana, sql`and canal = 'push'`);
    assert.equal(a.status, "falhou");
  });
});

describe("cobranças", () => {
  it('"cobrança amanhã" 1 dia antes do fim do teste, uma vez só; vencidos expiram', async () => {
    const joao = await criarUsuario({ nome: "João", email: "joao@t.com", plano: "aprovado", status: "trial", trialEndsAt: br("2026-11-14T10:00:00") });
    await criarAparelho(joao, "ExponentPushToken[joao]");
    const katia = await criarUsuario({ nome: "Kátia", email: "katia@t.com", plano: "aviso", status: "trial", trialEndsAt: br("2026-11-11T10:00:00") });
    const leo = await criarUsuario({ nome: "Léo", email: "leo@t.com", plano: "aviso", status: "inadimplente", periodEnd: br("2026-11-05T10:00:00") });
    const agora = br("2026-11-13T12:00:00");
    const r1 = await jobCobrancas(agora);
    const r2 = await jobCobrancas(agora);
    assert.equal(r1.avisos, 1);
    assert.equal(r2.avisos, 0);
    const avisos = await alertas(joao);
    assert.deepEqual(avisos.map((a) => [a.tipo, a.canal]), [["cobranca_amanha", "email"], ["cobranca_amanha", "push"]]);
    await enviarPendentes({ agora });
    assert.deepEqual((await alertas(joao)).map((a) => a.status), ["enviado", "enviado"]);
    const [sj] = await sql<{ aviso_cobranca_enviado_em: Date | null }[]>`select aviso_cobranca_enviado_em from subscriptions where user_id = ${joao}`;
    assert.ok(sj.aviso_cobranca_enviado_em);
    const st = async (u: string) => (await sql<{ status: string }[]>`select status from subscriptions where user_id = ${u}`)[0].status;
    assert.equal(await st(katia), "expirada");
    assert.equal(await st(leo), "expirada");
    assert.equal(await st(joao), "trial");
  });
});

describe("convocação nominal", () => {
  it("acha o nome de quem é Aprovado e autorizou; plano Aviso não recebe", async () => {
    const xml = readFileSync(path.join(FIXTURES, "dou/2026-10-31/529_20261031_23456802.xml"), "utf8");
    const doc = documentoDoArtigo(xml, "2026-10-31")!;
    await guardarDocumento(null, doc);
    const agora = new Date();
    const r1 = await jobConvocacoes(agora);
    const r2 = await jobConvocacoes(agora);
    assert.equal(r1.avisados, 1);
    assert.equal(r2.avisados, 0);
    const deAna = await alertas(ana, sql`and tipo = 'convocacao'`);
    assert.deepEqual(deAna.map((a) => a.canal), ["inapp", "push"]);
    assert.equal(deAna[0].url_oficial, doc.url);
    assert.equal((await alertas(carla, sql`and tipo = 'convocacao'`)).length, 0);
  });
});

describe("resumo semanal", () => {
  it("manda um por semana para quem tem acesso e tem novidade", async () => {
    const agora = br("2026-11-25T09:00:00"); // inscrição do XPTO acaba em 02/12: entra nos prazos de 14 dias
    const r1 = await jobResumoSemanal(agora);
    const r2 = await jobResumoSemanal(agora);
    assert.equal(r1.enviados, 3, JSON.stringify(r1)); // Ana, Carla e Gil acompanham o XPTO
    assert.ok(r1.semAcesso >= 1);
    assert.equal(r2.enviados + r2.vazios, 0);
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from email_resumos where user_id = ${bruno}`;
    assert.equal(n, 0, "sem assinatura não recebe");
  });
});
