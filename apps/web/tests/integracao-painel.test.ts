// Integração painel × motor: interruptores de envio e janela de horário do coletor do DOU.
import "./helpers/ambiente";
import { br, criarAparelho, criarUsuario, fecharBanco, prepararBanco, respostaPadrao, simularFetch } from "./helpers/banco";
import { after, before, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { sql } from "@/lib/db";
import { enfileirarAviso, enviarPendentes } from "@/lib/notify/despachar";
import { rodarJob } from "@/lib/pipeline/jobs";

const AGORA = br("2026-11-10T12:00:00");
let gil: string;
let contest: string;

async function config(chave: string, valor: unknown) {
  await sql`insert into app_config (chave, valor) values (${chave}, ${sql.json(valor as never)})
            on conflict (chave) do update set valor = excluded.valor`;
}

before(async () => {
  await prepararBanco();
  gil = await criarUsuario({
    nome: "Gil", email: "gil@painel.t", plano: "aprovado", status: "ativa", periodEnd: br("2027-06-30T10:00:00"),
    telefone: "+5511977776666", whatsappOptin: true, whatsappOn: true, silencio: null,
  });
  await criarAparelho(gil, "ExponentPushToken[gil-painel]");
  const [c] = await sql<{ id: string }[]>`
    insert into contests (slug, dedup_key, orgao, orgao_sigla, esfera, uf, status, titulo, url_oficial)
    values ('painel', 'painel|1/2026|2026', 'Órgão Painel', 'PNL', 'federal', 'SP', 'edital_aberto', 'PNL · Técnico', 'https://www.in.gov.br/pnl')
    returning id`;
  contest = c.id;
});
after(fecharBanco);
beforeEach(async () => {
  mock.restoreAll();
  await sql`delete from alerts`;
  await sql`delete from app_config where chave in ('avisos_pausados', 'whatsapp_pausado', 'coletor_dou_horario')`;
});

async function enfileirarPrazo(ref: string) {
  await enfileirarAviso(
    { userId: gil, contestId: contest, tipo: "inscricao_acabando", titulo: "Inscrição acaba amanhã", corpo: "PNL", urlOficial: "https://www.in.gov.br/pnl", dedupKey: `painel-${ref}`, diasAteFim: 1 },
    { agora: AGORA },
  );
}

describe("interruptores do painel", () => {
  it("avisos_pausados segura tudo como pendente e libera quando desliga", async () => {
    simularFetch(respostaPadrao);
    await config("avisos_pausados", true);
    await enfileirarPrazo("a");
    const r = await enviarPendentes({ agora: AGORA });
    assert.equal(r.pausado, true);
    const pend = await sql`select canal from alerts where user_id = ${gil} and status = 'pendente' and canal <> 'inapp'`;
    assert.ok(pend.length >= 2, "push e WhatsApp continuam pendentes");
    await config("avisos_pausados", false);
    const r2 = await enviarPendentes({ agora: AGORA });
    assert.equal(r2.pausado, false);
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from alerts where user_id = ${gil} and status = 'enviado' and canal in ('push','whatsapp')`;
    assert.equal(n, 2);
  });

  it("whatsapp_pausado envia o push e deixa o WhatsApp pendente", async () => {
    const chamadas = simularFetch(respostaPadrao);
    await config("whatsapp_pausado", true);
    await enfileirarPrazo("b");
    await enviarPendentes({ agora: AGORA });
    const linhas = await sql<{ canal: string; status: string }[]>`select canal, status from alerts where user_id = ${gil} and canal in ('push','whatsapp') order by canal`;
    assert.deepEqual(linhas.map((l) => `${l.canal}:${l.status}`), ["push:enviado", "whatsapp:pendente"]);
    assert.equal(chamadas.filter((c) => c.url.includes("graph.facebook.com")).length, 0);
  });
});

describe("janela do coletor do DOU (agendador)", () => {
  it("antes do horário configurado não coleta", async () => {
    await config("coletor_dou_horario", "07:30");
    const r = await rodarJob("coletar-dou", { agendado: true, agora: br("2026-11-10T07:00:00") });
    assert.equal(r.ok, true);
    assert.match(String(r.resultado.pulado), /antes do horário/);
  });

  it("depois de uma coleta ok no dia, não coleta de novo", async () => {
    await sql`insert into job_runs (nome, status, iniciado_em, terminado_em, resultado) values ('coletar-dou', 'ok', ${br("2026-11-10T08:00:00")}, ${br("2026-11-10T08:01:00")}, '{}')`;
    const r = await rodarJob("coletar-dou", { agendado: true, agora: br("2026-11-10T09:00:00") });
    assert.equal(r.resultado.pulado, "já coletado hoje");
  });
});
