import { FIXTURES } from "./helpers/ambiente";
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { MATERIAS_CANONICAS } from "../db/subjects";
import { classificarHeuristico, datasNaLinha, extrairCargos, extrairHeuristico, numeroDoEdital } from "@/lib/ai/heuristica";
import { custoUSD, MODELO_FORTE, MODELO_RAPIDO } from "@/lib/ai/cliente";
import { perguntarLocal, NAO_ENCONTRADO } from "@/lib/ai/pergunte";
import { ehConcursoPublico } from "@/lib/pipeline/filtro";
import { htmlParaTexto, regrasRobots, robotsPermite } from "@/lib/pipeline/http";
import { criarZip, lerZip } from "@/lib/pipeline/zip";
import { limparNomeMateria, resolverMateria } from "@/lib/pipeline/materias";
import { documentoDoArtigo, orgaoDaCategoria, parseArtigoInlabs } from "@/lib/pipeline/coletores/dou";
import { extrairItensBanca } from "@/lib/pipeline/coletores/bancas";
import { documentoDoDiario, trechosRelevantes } from "@/lib/pipeline/coletores/querido-diario";
import { avaliarCampos } from "@/lib/pipeline/extrair";
import { formatarPeriodo } from "@/lib/pipeline/errata";
import { instanteBR, semanaISO } from "@/lib/pipeline/config";
import { fimDoSilencio } from "@/lib/notify/despachar";
import { textoErrata } from "@/lib/notify/textos";
import { sql } from "@/lib/db";

after(() => sql.end({ timeout: 1 }));

const fixture = (rel: string) => readFileSync(path.join(FIXTURES, rel), "utf8");
const catalogo = MATERIAS_CANONICAS.map((m, i) => ({ id: `s${i}`, ...m }));

describe("matérias canônicas", () => {
  it('"Português" e "Língua Portuguesa" caem na mesma matéria', () => {
    const a = resolverMateria("Português", catalogo);
    const b = resolverMateria("Língua Portuguesa", catalogo);
    const c = resolverMateria("LÍNGUA PORTUGUESA: compreensão e interpretação de textos", catalogo);
    const d = resolverMateria("Noções de Língua Portuguesa", catalogo);
    assert.ok(a);
    assert.equal(a.nome, "Língua Portuguesa");
    assert.equal(b?.id, a.id);
    assert.equal(c?.id, a.id);
    assert.equal(d?.id, a.id);
  });

  it("resolve sinônimos, prefixos e pequenas diferenças", () => {
    assert.equal(resolverMateria("Raciocínio Lógico-Matemático", catalogo)?.nome, "Raciocínio Lógico");
    assert.equal(resolverMateria("Noções de Direito Constitucional", catalogo)?.nome, "Direito Constitucional");
    assert.equal(resolverMateria("Direito Constitucinal", catalogo)?.nome, "Direito Constitucional"); // erro de digitação
    assert.equal(resolverMateria("Noções de Informática", catalogo)?.nome, "Informática");
    assert.equal(resolverMateria("Legislação do SUS", catalogo)?.nome, "Saúde Pública");
    assert.equal(resolverMateria("Astronomia Avançada", catalogo), null);
  });

  it("limpa numeração, conteúdo e caixa alta", () => {
    assert.equal(limparNomeMateria("1. DIREITO ADMINISTRATIVO: atos administrativos"), "Direito Administrativo");
    assert.equal(limparNomeMateria("- Matemática (10 questões)"), "Matemática");
  });
});

describe("filtro e classificação", () => {
  it('filtro "concurso público"', () => {
    assert.ok(ehConcursoPublico("torna pública a abertura de inscrições para CONCURSO PÚBLICO"));
    assert.ok(ehConcursoPublico("Processo seletivo para professor substituto"));
    assert.ok(ehConcursoPublico("NOMEAR os aprovados no concurso de 2025"));
    assert.ok(!ehConcursoPublico("Conceder aposentadoria voluntária a José"));
    assert.ok(!ehConcursoPublico("Pregão eletrônico nº 12/2026 para aquisição de cadeiras"));
  });

  it("classifica os tipos de ato", () => {
    assert.equal(classificarHeuristico("torna pública a abertura das inscrições do concurso público", "EDITAL Nº 1").tipo, "edital_abertura");
    assert.equal(classificarHeuristico("torna pública a retificação do Edital nº 1, de abertura do concurso público", "EDITAL Nº 3").tipo, "retificacao");
    assert.equal(classificarHeuristico("Fica autorizada a realização de concurso público para 100 cargos de Auditor", "PORTARIA MGI Nº 12").tipo, "autorizacao");
    assert.equal(classificarHeuristico("resolve HOMOLOGAR o resultado final do concurso público", "EDITAL Nº 20").tipo, "homologacao");
    assert.equal(classificarHeuristico("NOMEAR os candidatos habilitados no concurso público homologado pelo Edital nº 10", "PORTARIA").tipo, "convocacao");
    assert.equal(classificarHeuristico("Conceder aposentadoria a servidor", "PORTARIA").tipo, "outro");
  });
});

describe("leitor heurístico", () => {
  it("datas por extenso, numéricas e períodos", () => {
    assert.deepEqual(datasNaLinha("no período de 3 de novembro de 2026 a 2 de dezembro de 2026", 2026), ["2026-11-03", "2026-12-02"]);
    assert.deepEqual(datasNaLinha("poderá ser feito de 3 a 9 de novembro de 2026", 2026), ["2026-11-03", "2026-11-09"]);
    assert.deepEqual(datasNaLinha("Período de inscrições | 4/11/2026 a 25/11/2026", 2026), ["2026-11-04", "2026-11-25"]);
    assert.deepEqual(datasNaLinha("de 15/12 a 10/01/2027", 2026), ["2026-12-15", "2027-01-10"]);
    assert.deepEqual(datasNaLinha("4.1 As inscrições, Lei nº 8.112/1990", 2026), []);
    // data de ato citado não é prazo
    assert.deepEqual(datasNaLinha("retificação do Edital nº 1, de 28 de outubro de 2026, inscrições até 9 de dezembro de 2026", 2026), ["2026-12-09"]);
  });

  it("número do edital (próprio na abertura, original na retificação)", () => {
    assert.deepEqual(numeroDoEdital("EDITAL Nº 1, DE 28 DE OUTUBRO DE 2026", "edital_abertura", 2026), { numero: "1/2026", ano: 2026 });
    assert.deepEqual(numeroDoEdital("EDITAL Nº 3, DE 30 DE OUTUBRO DE 2026\nRETIFICAÇÃO\nretificação do Edital nº 1, de 28 de outubro de 2026", "retificacao", 2026), { numero: "1/2026", ano: 2026 });
    assert.deepEqual(numeroDoEdital("EDITAL DE ABERTURA Nº 3/2026", "edital_abertura", 2025), { numero: "3/2026", ano: 2026 });
  });

  it("cargos de tabela", () => {
    const cargos = extrairCargos("Técnico Judiciário – Área Administrativa | Nível médio | 30 | R$ 9.052,77\nAnalista Judiciário | Nível superior | 12 | R$ 14.852,66");
    assert.equal(cargos.length, 2);
    assert.deepEqual(
      cargos.map((c) => [c.nome, c.escolaridade, c.vagas, c.salario_centavos]),
      [["Técnico Judiciário – Área Administrativa", "medio", 30, 905277], ["Analista Judiciário", "superior", 12, 1485266]],
    );
  });

  it("extrai o edital do DOU (fixture INLABS)", () => {
    const doc = documentoDoArtigo(fixture("dou/2026-10-30/515_20261030_23456789.xml"), "2026-10-30")!;
    const e = extrairHeuristico({ texto: doc.texto, titulo: doc.titulo, publicadoEm: doc.publicadoEm, dicas: doc.metadata.dicas }, "edital_abertura");
    assert.equal(e.orgao, "Tribunal Regional do Trabalho da 2ª Região");
    assert.equal(e.orgao_sigla, "TRT 2");
    assert.equal(e.esfera, "federal");
    assert.equal(e.uf, "SP");
    assert.equal(e.banca, "FCC");
    assert.equal(e.numero_edital, "1/2026");
    assert.equal(e.taxa_centavos, 8500);
    assert.equal(e.cargos.length, 3);
    assert.equal(e.cargos.reduce((s, c) => s + (c.vagas ?? 0), 0), 47);
    const data = (t: string) => e.datas.find((d) => d.tipo === t);
    assert.deepEqual([data("inscricao")?.inicio, data("inscricao")?.fim], ["2026-11-03", "2026-12-02"]);
    assert.deepEqual([data("isencao")?.inicio, data("isencao")?.fim], ["2026-11-03", "2026-11-09"]);
    assert.equal(data("prova")?.inicio, "2027-01-17");
    assert.equal(data("prova")?.origem.item, "5.1");
    assert.equal(data("prova")?.origem.pagina, 152);
    assert.equal(data("pagamento")?.fim, "2026-12-03");
    assert.equal(data("local_prova")?.inicio, "2027-01-08");
    assert.deepEqual(e.cargos[0].materias.map((m) => m.nome), ["Português", "Raciocínio Lógico-Matemático", "Noções de Direito Constitucional", "Noções de Direito Administrativo", "Noções de Informática"]);
    assert.equal(e.cargos[0].materias[0].numero_questoes, 15);
    assert.deepEqual(avaliarCampos({ ...e, url_oficial: doc.url } as never, "edital_abertura"), []);
  });

  it("extrai a retificação: só o que muda, com o edital original", () => {
    const doc = documentoDoArtigo(fixture("dou/2026-10-31/515_20261031_23456801.xml"), "2026-10-31")!;
    assert.equal(classificarHeuristico(doc.texto, doc.titulo).tipo, "retificacao");
    const e = extrairHeuristico({ texto: doc.texto, titulo: doc.titulo, publicadoEm: doc.publicadoEm, dicas: doc.metadata.dicas }, "retificacao");
    assert.equal(e.numero_edital, "1/2026");
    assert.deepEqual(
      e.datas.map((d) => [d.tipo, d.inicio, d.fim]),
      [["inscricao", "2026-11-03", "2026-12-09"], ["prova", "2027-01-24", "2027-01-24"]],
    );
  });
});

describe("coletores (fixtures)", () => {
  it("lê o XML do INLABS e filtra o que não é concurso", () => {
    const a = parseArtigoInlabs(fixture("dou/2026-10-30/515_20261030_23456789.xml"))!;
    assert.equal(a.secao, "DO3");
    assert.equal(a.publicadoEm, "2026-10-30");
    assert.equal(a.pagina, 152);
    const doc = documentoDoArtigo(fixture("dou/2026-10-30/515_20261030_23456789.xml"), "2026-10-30")!;
    assert.match(doc.url, /^https:\/\/pesquisa\.in\.gov\.br\/.*pagina=152/);
    assert.equal(documentoDoArtigo(fixture("dou/2026-10-30/515_20261030_23456790.xml"), "2026-10-30"), null);
    assert.equal(orgaoDaCategoria("Ministério da Previdência Social/Instituto Nacional do Seguro Social/Diretoria de Gestão de Pessoas"), "Instituto Nacional do Seguro Social");
  });

  it("zip do INLABS (ida e volta)", () => {
    const zip = criarZip([{ nome: "a.xml", conteudo: "<xml>á</xml>" }, { nome: "b.xml", conteudo: "<xml>b</xml>" }]);
    assert.deepEqual(lerZip(zip).map((e) => [e.nome, e.conteudo.toString("utf8")]), [["a.xml", "<xml>á</xml>"], ["b.xml", "<xml>b</xml>"]]);
  });

  it("página da banca: só links de concurso", () => {
    const itens = extrairItensBanca(fixture("bancas/cebraspe.html"), "https://www.cebraspe.org.br/concursos");
    assert.deepEqual(itens.map((i) => i.url), [
      "https://www.cebraspe.org.br/concursos/pf_26",
      "https://cdn.cebraspe.org.br/concursos/pf_26/arquivos/ED_1_PF_26_ABERTURA.PDF",
      "https://www.cebraspe.org.br/concursos/tcu_25",
    ]);
    assert.match(itens[0].contexto, /Inscrições abertas/);
  });

  it("robots.txt", () => {
    const regras = regrasRobots("User-agent: *\nDisallow: /admin\nAllow: /admin/publico\n\nUser-agent: OutroBot\nDisallow: /");
    assert.ok(robotsPermite(regras, "/concursos"));
    assert.ok(!robotsPermite(regras, "/admin/x"));
    assert.ok(robotsPermite(regras, "/admin/publico/y"));
    assert.ok(!robotsPermite(regrasRobots("User-agent: AvisoConcursoBot\nDisallow: /\n\nUser-agent: *\nAllow: /"), "/qualquer"));
  });

  it("Querido Diário: um documento por diário, com trechos", () => {
    const j = JSON.parse(fixture("querido-diario/2026-10-30.json"));
    const d = documentoDoDiario(j.gazettes[0], ["concurso público"]);
    assert.equal(d.metadata.dicas?.cidade, "Campinas");
    assert.match(d.texto, /Professor de Educação Básica/);
    assert.equal(d.url, j.gazettes[0].url);
    const t = trechosRelevantes("x".repeat(20000) + " concurso público para professor " + "y".repeat(20000), ["concurso público"], 1000);
    assert.ok(t.length < 2000 && t.includes("concurso público"));
  });

  it("HTML → texto preserva tabelas", () => {
    assert.equal(htmlParaTexto("<table><tr><td>A</td><td>B</td></tr></table><p>Taxa &ndash; R$ 1,00</p>"), "A | B\nTaxa – R$ 1,00");
  });
});

describe("utilitários", () => {
  it("horário silencioso: até quando adia", () => {
    const fim = fimDoSilencio(new Date("2026-11-03T23:30:00-03:00"), "22:00", "07:00");
    assert.equal(fim?.toISOString(), new Date("2026-11-04T07:00:00-03:00").toISOString());
    const madrugada = fimDoSilencio(new Date("2026-11-04T05:00:00-03:00"), "22:00", "07:00");
    assert.equal(madrugada?.toISOString(), new Date("2026-11-04T07:00:00-03:00").toISOString());
    assert.equal(fimDoSilencio(new Date("2026-11-04T12:00:00-03:00"), "22:00", "07:00"), null);
    assert.equal(instanteBR("2026-11-04", "07:00").toISOString(), "2026-11-04T10:00:00.000Z");
  });

  it("semana ISO", () => {
    assert.equal(semanaISO("2026-11-02"), "2026-W45");
    assert.equal(semanaISO("2027-01-01"), "2026-W53");
  });

  it("texto da errata diz o que mudou", () => {
    const t = textoErrata({ orgao: "Tribunal", orgao_sigla: "TRT 2" }, [{ campo: "data:prova", antes: "2027-01-17", depois: "2027-01-24" }]);
    assert.equal(t.titulo, "Errata no TRT 2");
    assert.equal(t.corpo, "Mudou prova: de 17/01/2027 para 24/01/2027. Sua agenda já foi atualizada.");
    assert.equal(formatarPeriodo({ inicio: "2026-11-03", fim: "2026-12-09" }), "2026-11-03 a 2026-12-09");
  });

  it("custo da IA (Haiku 5.5 e Sonnet 5.5, com cache)", () => {
    assert.ok(Math.abs(custoUSD(MODELO_RAPIDO, { input_tokens: 50_000, output_tokens: 10_000 }) - (0.005 + 0.005)) < 1e-9);
    // prompt acima de 100 mil tokens: faixa longa do Haiku 5.5 (US$ 0,50 / 2,50)
    assert.equal(custoUSD(MODELO_RAPIDO, { input_tokens: 1_000_000, output_tokens: 0 }), 0.5);
    assert.equal(custoUSD(MODELO_FORTE, { input_tokens: 0, output_tokens: 1_000_000 }), 10);
    assert.ok(Math.abs(custoUSD(MODELO_RAPIDO, { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 50_000 }) - 0.0005) < 1e-9);
  });

  it("Pergunte (sem chave): cita item e página; sem resposta, diz que não encontrou", () => {
    const edital = "[página 7]\n5. DA ISENÇÃO\n5.1 Terá direito à isenção da taxa o candidato inscrito no CadÚnico.\n\n[página 12]\n9.1 As provas objetivas serão aplicadas no turno da tarde.";
    const r = perguntarLocal({ editalTexto: edital, pergunta: "Quem tem direito à isenção da taxa?" });
    assert.equal(r.encontrado, true);
    assert.deepEqual(r.citacoes[0], { item: "5.1", pagina: 7, trecho: "5.1 Terá direito à isenção da taxa o candidato inscrito no CadÚnico." });
    const n = perguntarLocal({ editalTexto: edital, pergunta: "Qual a cor do uniforme exigido?" });
    assert.equal(n.encontrado, false);
    assert.equal(n.resposta, NAO_ENCONTRADO);
    assert.deepEqual(n.citacoes, []);
  });
});
