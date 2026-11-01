import { FIXTURES } from "./helpers/ambiente";
import { acompanhar, br, criarAparelho, criarUsuario, fecharBanco, prepararBanco, respostaPadrao, simularFetch, type ChamadaFetch } from "./helpers/banco";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { sql } from "@/lib/db";
import { guardarDocumento, rodarFonteImpl } from "@/lib/pipeline/coletores";
import { processarDocumentoImpl, processarPendentes } from "@/lib/pipeline/processar";
import { aplicarExtracaoImpl, rejeitarExtracaoImpl } from "@/lib/pipeline/aplicar";
import { registrarAlteracaoImpl } from "@/lib/pipeline/errata";
import { enfileirarAviso, enviarPendentes } from "@/lib/notify/despachar";
import { rodarJob } from "@/lib/pipeline/jobs";
import { agenda } from "@/lib/repo/agenda";
import { CamposExtraidos } from "@/lib/pipeline/schema";
import { GET as cronGET } from "@/app/api/cron/[job]/route";

const PERFIL_TRIBUNAIS = { escolaridades: ["medio", "superior"], areas: ["tribunais", "juridica", "administrativa"], ufs: ["SP", "BA"], incluir_nacional: true, salario_min_centavos: 500000 };
const DIA1 = br("2026-10-30T09:00:00");
const DIA2 = br("2026-10-31T10:00:00");

let ana: string, bruno: string, carla: string, davi: string, elisa: string, fabio: string;
let chamadas: ChamadaFetch[];
let trtId: string;

async function contar(tabela: string, where = "true"): Promise<number> {
  const [r] = await sql.unsafe<{ n: number }[]>(`select count(*)::int as n from ${tabela} where ${where}`);
  return r.n;
}

async function avisos(userId: string, tipo?: string) {
  return sql<{ tipo: string; canal: string; status: string; url_oficial: string; titulo: string; corpo: string }[]>`
    select tipo, canal, status, url_oficial, titulo, corpo from alerts where user_id = ${userId} ${tipo ? sql`and tipo = ${tipo}` : sql``} order by canal`;
}

before(async () => {
  await prepararBanco();
  process.env.COLETA_FIXTURES_DIR = FIXTURES;
  chamadas = simularFetch(respostaPadrao);
  const fimTeste = br("2026-11-20T10:00:00");
  const umAno = br("2027-10-30T10:00:00");
  ana = await criarUsuario({ nome: "Ana", email: "ana@t.com", plano: "aprovado", status: "trial", trialEndsAt: fimTeste, telefone: "+5511999990000", whatsappOptin: true, whatsappOn: true, perfil: PERFIL_TRIBUNAIS });
  await criarAparelho(ana, "ExponentPushToken[ana-1]");
  bruno = await criarUsuario({ nome: "Bruno", email: "bruno@t.com", plano: null, perfil: PERFIL_TRIBUNAIS });
  await criarAparelho(bruno, "ExponentPushToken[bruno-1]");
  carla = await criarUsuario({ nome: "Carla", email: "carla@t.com", plano: "aviso", status: "ativa", periodEnd: umAno, perfil: PERFIL_TRIBUNAIS });
  await criarAparelho(carla, "ExponentPushToken[carla-1]");
  davi = await criarUsuario({ nome: "Davi", email: "davi@t.com", plano: "aprovado", status: "trial", trialEndsAt: br("2026-10-20T10:00:00"), perfil: PERFIL_TRIBUNAIS });
  elisa = await criarUsuario({ nome: "Elisa", email: "elisa@t.com", plano: "aprovado", status: "ativa", periodEnd: umAno, perfil: { areas: ["policial"], ufs: [] } });
  fabio = await criarUsuario({ nome: "Fábio", email: "fabio@t.com", plano: "aprovado", status: "ativa", periodEnd: umAno, perfil: { ...PERFIL_TRIBUNAIS, ufs: ["RJ"], incluir_nacional: false } });
});

after(async () => {
  delete process.env.COLETA_FIXTURES_DIR;
  await fecharBanco();
});

describe("coleta e processamento do DOU (fixture INLABS)", () => {
  it("coletar 2x não duplica documentos (hash) e guarda o original", async () => {
    const r1 = await rodarFonteImpl("dou", { data: "2026-10-30", agora: DIA1 });
    assert.equal(r1.encontrados, 2); // edital + aposentadoria (filtrada)
    assert.equal(r1.novos, 1);
    const r2 = await rodarFonteImpl("dou", { data: "2026-10-30", agora: DIA1 });
    assert.equal(r2.novos, 0);
    assert.equal(await contar("raw_documents"), 1);
    const [doc] = await sql<{ storage_path: string; hash: string }[]>`select storage_path, hash from raw_documents`;
    assert.match(doc.storage_path, new RegExp(`^originais/\\d{4}/\\d{2}/${doc.hash}\\.xml$`));
    assert.equal(await contar("source_runs", "status = 'ok'"), 2);
  });

  it("processar cria o concurso (dedup) e avisa quem casa e tem acesso, com link oficial", async () => {
    const p = await processarPendentes({ agora: DIA1 });
    assert.equal(p.auto, 1, JSON.stringify(p));
    const [c] = await sql<Record<string, unknown>[]>`select * from contests where not exemplo`;
    trtId = c.id as string;
    assert.equal(c.dedup_key, "tribunal-regional-do-trabalho-da-2-regiao|1/2026|2026");
    assert.equal(c.status, "edital_aberto");
    assert.equal(c.uf, "SP");
    assert.equal(c.esfera, "federal");
    assert.equal(c.banca, "FCC");
    assert.equal(c.vagas_total, 47);
    assert.equal(c.salario_max_centavos, 1485266);
    assert.deepEqual([...(c.escolaridades as string[])].sort(), ["medio", "superior"]);
    assert.ok((c.areas as string[]).includes("tribunais"));
    assert.match(c.url_oficial as string, /^https:\/\/pesquisa\.in\.gov\.br/);
    assert.ok((c.edital_texto as string).includes("5.1 A prova objetiva"));
    assert.equal(await contar("contest_roles", `contest_id = '${trtId}'`), 3);
    assert.equal(await contar("contest_dates", `contest_id = '${trtId}'`), 6);
    assert.equal(await contar("acts", `contest_id = '${trtId}' and tipo = 'edital_abertura'`), 1);
    assert.equal(await contar("extractions", "status = 'auto'"), 1);

    const deAna = await avisos(ana, "edital_publicado");
    assert.deepEqual(deAna.map((a) => a.canal), ["inapp", "push"]);
    assert.equal(deAna[0].titulo, "Saiu edital: TRT 2");
    assert.match(deAna[0].corpo, /47 vagas · até R\$\s?14\.852,66 · inscrições até 02\/12\/2026/);
    assert.deepEqual((await avisos(carla, "edital_publicado")).map((a) => a.canal), ["inapp", "push"]);
    assert.equal((await avisos(bruno)).length, 0, "sem plano: nenhum aviso");
    assert.equal((await avisos(davi)).length, 0, "teste vencido: nenhum aviso");
    assert.equal((await avisos(fabio)).length, 0, "perfil de outra UF");
    assert.equal((await avisos(elisa)).length, 0, "perfil de outra área");
  });

  it("push sai pelo Expo com tickets; repetir o envio não manda de novo", async () => {
    const e1 = await enviarPendentes({ agora: DIA1 });
    assert.equal(e1.push, 2);
    const envios = chamadas.filter((c) => c.url.includes("exp.host"));
    assert.equal(envios.length, 2);
    const msg = (envios[0].corpo as { to: string; title: string; data: { url_oficial: string } }[])[0];
    assert.match(msg.data.url_oficial, /^https:\/\//);
    assert.equal(await contar("push_tickets"), 2);
    await enviarPendentes({ agora: DIA1 });
    assert.equal(chamadas.filter((c) => c.url.includes("exp.host")).length, 2);
  });

  it("rodar coletor e processamento de novo não duplica concursos nem avisos", async () => {
    const antes = { contests: await contar("contests"), alerts: await contar("alerts"), extractions: await contar("extractions"), acts: await contar("acts") };
    await rodarFonteImpl("dou", { data: "2026-10-30", agora: DIA1 });
    await processarPendentes({ agora: DIA1 });
    const [ex] = await sql<{ id: string; campos_json: CamposExtraidos }[]>`select id, campos_json from extractions limit 1`;
    await aplicarExtracaoImpl(ex.id, ex.campos_json, null, { agora: DIA1 }); // reaplicar é idempotente
    await processarDocumentoImpl((await sql<{ id: string }[]>`select id from raw_documents limit 1`)[0].id, { forcar: true, agora: DIA1 });
    const depois = { contests: await contar("contests"), alerts: await contar("alerts"), extractions: await contar("extractions"), acts: await contar("acts") };
    assert.deepEqual(depois, antes);
  });

  it("toda notificação tem url_oficial (código e banco)", async () => {
    assert.equal(await contar("alerts", "url_oficial is null or url_oficial !~ '^https?://'"), 0);
    await assert.rejects(
      enfileirarAviso({ userId: ana, contestId: trtId, tipo: "errata", titulo: "x", corpo: "y", urlOficial: "", dedupKey: "sem-url" }),
      /url_oficial/,
    );
    await assert.rejects(
      sql`insert into alerts (user_id, tipo, canal, titulo, corpo, dedup_key) values (${ana}, 'errata', 'inapp', 'x', 'y', 'sem-url-banco')`,
    );
  });

  it("matérias do edital viram matérias canônicas gerais (comuns a todos os cargos)", async () => {
    const m = await sql<{ nome: string; questoes: number | null; role_id: string | null }[]>`
      select s.nome, cs.questoes, cs.role_id from contest_subjects cs join subjects s on s.id = cs.subject_id
      where cs.contest_id = ${trtId} order by s.nome`;
    assert.deepEqual(m.map((x) => [x.nome, x.questoes, x.role_id]), [
      ["Direito Administrativo", 10, null],
      ["Direito Constitucional", 10, null],
      ["Informática", 5, null],
      ["Língua Portuguesa", 15, null],
      ["Raciocínio Lógico", 5, null],
    ]);
  });
});

describe("errata (retificação no DOU)", () => {
  it("muda a data na agenda de quem acompanha e avisa só essas pessoas", async () => {
    await acompanhar(ana, trtId); // Carla casa com o perfil, mas não acompanha
    const r = await rodarFonteImpl("dou", { data: "2026-10-31", agora: DIA2 });
    assert.equal(r.novos, 2); // retificação + nomeação
    const p = await processarPendentes({ agora: DIA2 });
    assert.equal(p.auto, 1, JSON.stringify(p));
    assert.equal(p.semConcurso, 1); // nomeação de concurso que não está na base: só guarda o ato

    const ag = await agenda(ana, "2026-11-01", "2027-03-01", trtId);
    const prova = ag.find((d) => d.tipo === "prova");
    const insc = ag.find((d) => d.tipo === "inscricao");
    assert.equal(prova?.inicio, "2027-01-24");
    assert.deepEqual([insc?.inicio, insc?.fim], ["2026-11-03", "2026-12-09"]);

    const [v] = await sql<{ versao: number; diff_json: { campo: string; antes: unknown; depois: unknown }[] }[]>`
      select versao, diff_json from contest_versions where contest_id = ${trtId}`;
    assert.equal(v.versao, 2);
    assert.deepEqual(v.diff_json.map((d) => [d.campo, d.antes, d.depois]).sort(), [
      ["data:inscricao", "2026-11-03 a 2026-12-02", "2026-11-03 a 2026-12-09"],
      ["data:prova", "2027-01-17", "2027-01-24"],
    ]);

    const errataAna = await avisos(ana, "errata");
    assert.deepEqual(errataAna.map((a) => a.canal), ["inapp", "push"]);
    assert.match(errataAna[0].corpo, /prova: de 17\/01\/2027 para 24\/01\/2027/);
    assert.match(errataAna[0].url_oficial, /pagina=98/); // link do ato da retificação
    assert.equal((await avisos(carla, "errata")).length, 0);
    assert.equal(await contar("alerts", "tipo = 'errata'"), 2);
  });

  it("reprocessar a errata não gera versão nem aviso novos", async () => {
    await rodarFonteImpl("dou", { data: "2026-10-31", agora: DIA2 });
    await processarPendentes({ agora: DIA2 });
    assert.equal(await contar("contest_versions", `contest_id = '${trtId}'`), 1);
    assert.equal(await contar("alerts", "tipo = 'errata'"), 2);
  });

  it("edição manual pelo admin (registrarAlteracao): campos simples, datas e cargos; repetir não gera versão", async () => {
    const novos = {
      taxa_centavos: 9000,
      banca: "Fundação Carlos Chagas",
      datas: [{ tipo: "local_prova" as const, inicio: "2027-01-15", fim: "2027-01-15" }],
      cargos: [{ nome: "Técnico Judiciário – Área Administrativa", vagas: 35, cadastro_reserva: false, materias: [] }],
    };
    const r = await registrarAlteracaoImpl(trtId, novos, { resumo: "Ajuste manual", autorId: null, notificar: false });
    assert.equal(r.versao, 3);
    assert.deepEqual([...r.alterados].sort(), ["banca", "cargo:Técnico Judiciário – Área Administrativa:vagas", "data:local_prova", "taxa_centavos"]);
    assert.equal(r.avisados, 0);
    const [c] = await sql<{ taxa_centavos: number; banca: string; vagas_total: number }[]>`select taxa_centavos, banca, vagas_total from contests where id = ${trtId}`;
    assert.deepEqual(c, { taxa_centavos: 9000, banca: "Fundação Carlos Chagas", vagas_total: 52 });
    const de = await registrarAlteracaoImpl(trtId, novos, { resumo: "Ajuste manual", autorId: null, notificar: false });
    assert.deepEqual(de, { versao: 3, alterados: [], avisados: 0 });
  });
});

describe("bancas e Querido Diário", () => {
  it("banca: página sem mudança (hash) não gera trabalho; edital da PF vira concurso e avisa quem casa", async () => {
    const r1 = await rodarFonteImpl("cebraspe", { agora: DIA2 });
    assert.equal(r1.encontrados, 3);
    assert.equal(r1.novos, 3);
    const r2 = await rodarFonteImpl("cebraspe", { agora: DIA2 });
    assert.equal(r2.novos, 0);
    const [fonte] = await sql<{ ultimo_status: string; ultimo_hash: string }[]>`select ultimo_status, ultimo_hash from sources where slug = 'cebraspe'`;
    assert.equal(fonte.ultimo_status, "ok: sem mudança");
    await processarPendentes({ agora: DIA2 });
    const [pf] = await sql<{ id: string; banca: string; uf: string | null; vagas_total: number; status: string }[]>`
      select id, banca, uf, vagas_total, status from contests where orgao = 'Polícia Federal'`;
    assert.ok(pf, "concurso da PF criado");
    assert.equal(pf.banca, "Cebraspe");
    assert.equal(pf.uf, null);
    assert.equal(pf.vagas_total, 1030);
    assert.deepEqual((await avisos(elisa, "edital_publicado")).map((a) => a.canal), ["inapp", "push"]);
    assert.equal((await avisos(ana, "edital_publicado")).length, 2, "Ana continua só com o aviso do TRT");
  });

  it('"Português" (TRT) e "Língua Portuguesa" (PF) caem na mesma matéria canônica', async () => {
    const r = await sql<{ contest_id: string; subject_id: string }[]>`
      select cs.contest_id, cs.subject_id from contest_subjects cs join subjects s on s.id = cs.subject_id
      join contests c on c.id = cs.contest_id
      where s.nome = 'Língua Portuguesa' and not c.exemplo`;
    assert.equal(r.length, 2);
    assert.equal(new Set(r.map((x) => x.subject_id)).size, 1);
    assert.equal(await contar("subjects", "nome ilike 'portugu%'"), 0, "não criou matéria duplicada");
  });

  it("Querido Diário: edital municipal vira concurso; estágio sem vínculo é descartado", async () => {
    const r = await rodarFonteImpl("querido-diario", { data: "2026-10-30", agora: DIA2 });
    assert.equal(r.novos, 2);
    await processarPendentes({ agora: DIA2 });
    const [c] = await sql<{ esfera: string; uf: string; cidade: string; banca: string; numero_edital: string; taxa_centavos: number }[]>`
      select esfera, uf, cidade, banca, numero_edital, taxa_centavos from contests where orgao = 'Prefeitura Municipal de Campinas'`;
    assert.deepEqual(c, { esfera: "municipal", uf: "SP", cidade: "Campinas", banca: "AOCP", numero_edital: "3/2026", taxa_centavos: 7500 });
    assert.equal(await contar("raw_documents", "status = 'descartado' and titulo like 'Diário Oficial de São Paulo%'"), 1);
  });
});

describe("radar, revisão humana e jobs", () => {
  it("autorização avisa só o plano Aprovado; o edital depois promove o mesmo concurso (sem duplicar)", async () => {
    const aut = await guardarDocumento(null, {
      url: "https://www.in.gov.br/web/dou/-/portaria-mgi-321",
      titulo: "PORTARIA MGI Nº 321, DE 20 DE OUTUBRO DE 2026",
      conteudo: "portaria inss",
      mime: "text/plain",
      texto: "PORTARIA MGI Nº 321, DE 20 DE OUTUBRO DE 2026\nAutoriza a realização de concurso público para provimento de 500 cargos de Técnico do Seguro Social no quadro de pessoal do Instituto Nacional do Seguro Social.",
      publicadoEm: "2026-10-31",
      metadata: { dicas: { esfera: "federal" } },
    });
    assert.equal((await processarDocumentoImpl(aut.id, { agora: DIA2 })).status, "auto");
    const [radar] = await sql<{ id: string; status: string }[]>`select id, status from contests where orgao = 'Instituto Nacional do Seguro Social' and not exemplo`;
    assert.equal(radar.status, "autorizado");
    assert.deepEqual((await avisos(ana, "autorizado")).map((a) => a.canal), ["inapp", "push"]);
    assert.equal((await avisos(carla, "autorizado")).length, 0, "plano Aviso não recebe autorizado");

    const ed = await guardarDocumento(null, {
      url: "https://www.in.gov.br/web/dou/-/edital-5-inss",
      titulo: "EDITAL Nº 5, DE 30 DE OUTUBRO DE 2026",
      conteudo: "edital inss",
      mime: "text/plain",
      texto: [
        "EDITAL Nº 5, DE 30 DE OUTUBRO DE 2026",
        "O PRESIDENTE DO INSTITUTO NACIONAL DO SEGURO SOCIAL torna pública a abertura das inscrições do concurso público, executado pelo Cebraspe.",
        "Técnico do Seguro Social | Nível médio | 500 | R$ 5.905,79",
        "As inscrições serão realizadas no período de 4/11/2026 a 30/11/2026.",
        "A prova objetiva será aplicada em 14/2/2027.",
      ].join("\n"),
      publicadoEm: "2026-10-31",
      metadata: { dicas: { esfera: "federal" } },
    });
    assert.equal((await processarDocumentoImpl(ed.id, { agora: DIA2 })).status, "auto");
    const inss = await sql<{ id: string; status: string; numero_edital: string; vagas_total: number }[]>`
      select id, status, numero_edital, vagas_total from contests where orgao = 'Instituto Nacional do Seguro Social' and not exemplo`;
    assert.equal(inss.length, 1, "não duplicou");
    assert.equal(inss[0].id, radar.id);
    assert.deepEqual([inss[0].status, inss[0].numero_edital, inss[0].vagas_total], ["edital_aberto", "5/2026", 500]);
    assert.equal((await avisos(carla, "edital_publicado")).filter((a) => a.canal === "inapp").length, 2);
  });

  it("baixa confiança vai para a fila; o revisor completa e aplica; rejeitar tira do ar", async () => {
    const d = await guardarDocumento(null, {
      url: "https://www.camara.sp.gov.br/concursos/edital-2-2026",
      titulo: "Câmara Municipal de Santos – Edital nº 2/2026",
      conteudo: "camara santos",
      mime: "text/plain",
      texto: "Câmara Municipal de Santos torna pública a abertura das inscrições do concurso público. Edital nº 2/2026.\nAgente Legislativo | Nível médio | 10 | R$ 4.100,00",
      publicadoEm: "2026-10-31",
      metadata: {},
    });
    const r = await processarDocumentoImpl(d.id, { agora: DIA2 });
    assert.equal(r.status, "pendente"); // sem datas de inscrição e sem UF
    const [ex] = await sql<{ id: string; campos_json: Record<string, unknown>; motivo_revisao: string }[]>`select id, campos_json, motivo_revisao from extractions where id = ${r.extractionId!}`;
    assert.match(ex.motivo_revisao, /datas\.inscricao/);
    const [revisor] = await sql<{ id: string }[]>`insert into users (nome, email, senha_hash, role) values ('Editor', 'editor@t.com', 'x', 'editor') returning id`;
    const campos = CamposExtraidos.parse({
      ...ex.campos_json,
      uf: "SP",
      cidade: "Santos",
      datas: [{ tipo: "inscricao", inicio: "2026-11-05", fim: "2026-11-30" }],
    });
    const ap = await aplicarExtracaoImpl(ex.id, campos, revisor.id, { agora: DIA2 });
    assert.equal(ap.criado, true);
    const [st] = await sql<{ status: string; revisado_por: string }[]>`select status, revisado_por from extractions where id = ${ex.id}`;
    assert.deepEqual(st, { status: "aprovada", revisado_por: revisor.id });
    await rejeitarExtracaoImpl(ex.id, "edital de teste", revisor.id);
    const [c] = await sql<{ publicado: boolean }[]>`select publicado from contests where id = ${ap.contestId}`;
    assert.equal(c.publicado, false);
  });

  it("rodarJob registra a execução; rota de cron exige o segredo", async () => {
    const r = await rodarJob("processar", { agora: DIA2 });
    assert.equal(r.ok, true);
    assert.equal(await contar("job_runs", "nome = 'processar' and status = 'ok'"), 1);
    const ctx = (job: string) => ({ params: Promise.resolve({ job }) });
    assert.equal((await cronGET(new Request("http://x/api/cron/processar"), ctx("processar"))).status, 401);
    assert.equal((await cronGET(new Request("http://x/api/cron/processar", { headers: { authorization: "Bearer errado" } }), ctx("processar"))).status, 401);
    const auth = { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } };
    assert.equal((await cronGET(new Request("http://x/api/cron/nada", auth), ctx("nada"))).status, 404);
    const ok = await cronGET(new Request("http://x/api/cron/enviar-avisos", auth), ctx("enviar-avisos"));
    assert.equal(ok.status, 200);
    assert.equal(((await ok.json()) as { ok: boolean }).ok, true);
  });
});
