import "./helpers/ambiente";
import { fecharBanco, prepararBanco, simularFetch, type ChamadaFetch } from "./helpers/banco";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

// Caminho com ANTHROPIC_API_KEY, com a API simulada (a chave real não existe neste ambiente).
// Confere o formato do pedido (modelo, structured outputs, cache do edital) e o tratamento da resposta.
process.env.ANTHROPIC_API_KEY = "sk-ant-teste";
delete process.env.ANTHROPIC_BASE_URL;

const respostas: { model: string; json: unknown; stop?: string; uso?: Record<string, number> }[] = [];
let chamadas: ChamadaFetch[];

function mensagem(r: (typeof respostas)[number]) {
  return {
    id: `msg_${Math.random().toString(36).slice(2)}`,
    type: "message",
    role: "assistant",
    model: r.model,
    content: [
      { type: "thinking", thinking: "", signature: "sig" }, // Haiku 5.5 pensa por padrão; o texto vem depois
      { type: "text", text: JSON.stringify(r.json) },
    ],
    stop_reason: r.stop ?? "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 2000, output_tokens: 500, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, ...r.uso },
  };
}

const EXTRACAO_BASE = {
  tipo_ato: "edital_abertura",
  orgao: "Tribunal Regional do Trabalho da 2ª Região",
  orgao_sigla: "TRT 2",
  esfera: "federal",
  uf: "sp",
  cidade: null,
  banca: "FCC",
  numero_edital: "Edital nº 01/2026",
  ano: 2026,
  titulo: "TRT 2 · Técnico e Analista",
  resumo: "Concurso para técnico e analista judiciário.",
  cargos: [
    { nome: "Técnico Judiciário", escolaridade: "medio", area: "tribunais", vagas: 30, cadastro_reserva: true, salario_centavos: 905277, jornada: "40h", requisitos: null, materias: [{ nome: "Português", numero_questoes: 15 }], origem: { item: "2.1", pagina: 152 } },
  ],
  taxa_centavos: 8500,
  datas: [
    { tipo: "inscricao", inicio: "2026-11-03", fim: "2026-12-02", descricao: null, origem: { item: "3.1", pagina: 152 } },
    { tipo: "prova", inicio: "17/01/2027", fim: "2027-01-17", descricao: null, origem: { item: "5.1", pagina: 152 } },
  ],
  etapas: ["Prova objetiva"],
  areas: ["tribunais"],
  confianca: { geral: 0.96, orgao: 0.99, numero_edital: 0.98, cargos: 0.95, datas: 0.97, taxa: 0.9, materias: 0.9 },
  observacoes: null,
};

const DOC = { texto: "[página 152]\nEDITAL Nº 1, DE 28 DE OUTUBRO DE 2026 ...", titulo: "EDITAL Nº 1", url: "https://pesquisa.in.gov.br/x?pagina=152", publicadoEm: "2026-10-30" };

before(async () => {
  await prepararBanco();
  chamadas = simularFetch((c) => {
    if (c.url.endsWith("/v1/messages")) {
      const r = respostas.shift();
      if (!r) return { status: 500, json: { type: "error", error: { type: "api_error", message: "sem resposta simulada" } } };
      return { json: mensagem(r) };
    }
    return { status: 404, json: {} };
  });
});

after(fecharBanco);

describe("extração com Claude", () => {
  it("Haiku 5.5 com structured outputs; link oficial vem da fonte; custo e tokens registrados", async () => {
    const { extrairCampos } = await import("@/lib/pipeline/extrair");
    respostas.push({ model: "claude-haiku-5-5", json: EXTRACAO_BASE });
    const r = await extrairCampos(DOC, "edital_abertura");
    const pedido = chamadas.at(-1)!.corpo as {
      model: string;
      output_config: { format: { type: string; schema: { properties: Record<string, unknown> } }; effort: string };
      system: { text: string; cache_control?: { type: string } }[];
      thinking?: unknown;
    };
    assert.equal(pedido.model, "claude-haiku-5-5");
    assert.equal(pedido.output_config.format.type, "json_schema");
    assert.ok(pedido.output_config.format.schema.properties.confianca);
    assert.equal(pedido.output_config.effort, "medium");
    assert.deepEqual(pedido.system[0].cache_control, { type: "ephemeral" });
    assert.equal(pedido.thinking, undefined);
    assert.equal(chamadas.filter((c) => c.url.endsWith("/v1/messages")).length, 1, "confiança alta: sem segunda leitura");
    assert.equal(r.modelo, "claude-haiku-5-5");
    assert.equal(r.confianca, 0.96);
    assert.ok(r.campos);
    assert.equal(r.campos.url_oficial, DOC.url);
    assert.equal(r.campos.uf, "SP");
    assert.equal(r.campos.numero_edital, "1/2026");
    assert.deepEqual(r.campos.datas.map((d) => [d.tipo, d.inicio, d.fim]), [["inscricao", "2026-11-03", "2026-12-02"], ["prova", null, "2027-01-17"]]);
    assert.equal(r.tokensIn, 2000);
    assert.equal(r.tokensOut, 500);
    // (2000 × 0,10 + 500 × 0,50) / 1e6 US$ × 5,5 × 100
    assert.ok(Math.abs(r.custoCentavos - 0.2475) < 1e-6, String(r.custoCentavos));
  });

  it("confiança baixa no Haiku → segunda leitura com Sonnet 5.5", async () => {
    const { extrairCampos } = await import("@/lib/pipeline/extrair");
    const antes = chamadas.length;
    respostas.push({ model: "claude-haiku-5-5", json: { ...EXTRACAO_BASE, confianca: { ...EXTRACAO_BASE.confianca, geral: 0.6 } } });
    respostas.push({ model: "claude-sonnet-5-5", json: { ...EXTRACAO_BASE, confianca: { ...EXTRACAO_BASE.confianca, geral: 0.93 } } });
    const r = await extrairCampos(DOC, "edital_abertura");
    const modelos = chamadas.slice(antes).map((c) => (c.corpo as { model: string }).model);
    assert.deepEqual(modelos, ["claude-haiku-5-5", "claude-sonnet-5-5"]);
    assert.equal(r.modelo, "claude-haiku-5-5+claude-sonnet-5-5");
    assert.equal(r.confianca, 0.93);
    assert.equal(r.tokensIn, 4000);
  });

  it("campos obrigatórios faltando limitam a confiança (vai para revisão)", async () => {
    const { extrairCampos } = await import("@/lib/pipeline/extrair");
    const incompleto = { ...EXTRACAO_BASE, datas: [] };
    respostas.push({ model: "claude-haiku-5-5", json: incompleto }, { model: "claude-sonnet-5-5", json: incompleto });
    const r = await extrairCampos(DOC, "edital_abertura");
    assert.ok(r.confianca <= 0.8);
    assert.deepEqual(r.faltando, ["datas.inscricao"]);
  });

  it("classificação com Haiku 5.5 (esforço baixo)", async () => {
    const { classificar } = await import("@/lib/pipeline/classificar");
    respostas.push({ model: "claude-haiku-5-5", json: { tipo: "retificacao", confianca: 0.97, motivo: "altera datas do edital" } });
    const r = await classificar({ texto: "torna pública a retificação", titulo: "EDITAL Nº 3" });
    assert.equal(r.tipo, "retificacao");
    assert.equal(r.modelo, "claude-haiku-5-5");
    assert.equal((chamadas.at(-1)!.corpo as { output_config: { effort: string } }).output_config.effort, "low");
  });
});

describe("Pergunte ao edital com Claude", () => {
  const edital = "[página 7]\n5.1 Terá direito à isenção da taxa o candidato inscrito no CadÚnico.";

  it("edital em cache (cache_control no bloco do edital), cita item e página e registra tokens de cache", async () => {
    const { perguntarAoEdital } = await import("@/lib/ai/pergunte");
    respostas.push({
      model: "claude-haiku-5-5",
      json: { encontrado: true, resposta: "Tem direito quem está no CadÚnico (item 5.1).", citacoes: [{ item: "5.1", pagina: 7, trecho: "Terá direito à isenção da taxa o candidato inscrito no CadÚnico" }] },
      uso: { input_tokens: 30, cache_read_input_tokens: 5000 },
    });
    const r = await perguntarAoEdital({ editalTexto: edital, pergunta: "Quem tem isenção?", tituloConcurso: "TRT 2" });
    const pedido = chamadas.at(-1)!.corpo as { system: { text: string; cache_control?: unknown }[]; messages: { content: string }[] };
    assert.equal(pedido.system.length, 2);
    assert.equal(pedido.system[0].cache_control, undefined);
    assert.deepEqual(pedido.system[1].cache_control, { type: "ephemeral" });
    assert.ok(pedido.system[1].text.includes("CadÚnico"));
    assert.equal(pedido.messages[0].content, "Quem tem isenção?");
    assert.equal(r.encontrado, true);
    assert.deepEqual(r.citacoes[0], { item: "5.1", pagina: 7, trecho: "Terá direito à isenção da taxa o candidato inscrito no CadÚnico" });
    assert.equal(r.cacheReadTokens, 5000);
    assert.equal(r.tokensIn, 5030);
    assert.equal(r.modelo, "claude-haiku-5-5");
  });

  it("citação que não está no edital não vale: responde que não encontrou", async () => {
    const { perguntarAoEdital, NAO_ENCONTRADO } = await import("@/lib/ai/pergunte");
    respostas.push({ model: "claude-haiku-5-5", json: { encontrado: true, resposta: "A prova é de manhã.", citacoes: [{ item: "9.9", pagina: 1, trecho: "A prova será aplicada pela manhã" }] } });
    const r = await perguntarAoEdital({ editalTexto: edital, pergunta: "Qual o turno da prova?", tituloConcurso: "TRT 2" });
    assert.equal(r.encontrado, false);
    assert.equal(r.resposta, NAO_ENCONTRADO);
  });
});
