import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ACT_TIPOS, AREAS, DATE_TIPOS, ESCOLARIDADES, ESFERAS, type ActTipo } from "@aviso/shared";
import type { DicasDocumento } from "@/lib/pipeline/tipos";
import { clienteIA, custoCentavos, MODELO_RAPIDO, tokensEntrada } from "./cliente";

// Extração estruturada com Claude (saída JSON validada com zod via structured outputs).

const Origem = z.object({ item: z.string().nullable(), pagina: z.number().int().nullable() });

export const SaidaExtracao = z.object({
  tipo_ato: z.enum(ACT_TIPOS),
  orgao: z.string().nullable(),
  orgao_sigla: z.string().nullable(),
  esfera: z.enum(ESFERAS).nullable(),
  uf: z.string().nullable(),
  cidade: z.string().nullable(),
  banca: z.string().nullable(),
  numero_edital: z.string().nullable(),
  ano: z.number().int().nullable(),
  titulo: z.string().nullable(),
  resumo: z.string().nullable(),
  cargos: z.array(
    z.object({
      nome: z.string(),
      escolaridade: z.enum(ESCOLARIDADES).nullable(),
      area: z.enum(AREAS).nullable(),
      vagas: z.number().int().nullable(),
      cadastro_reserva: z.boolean(),
      salario_centavos: z.number().int().nullable(),
      jornada: z.string().nullable(),
      requisitos: z.string().nullable(),
      materias: z.array(z.object({ nome: z.string(), numero_questoes: z.number().int().nullable() })),
      origem: Origem,
    }),
  ),
  taxa_centavos: z.number().int().nullable(),
  datas: z.array(
    z.object({ tipo: z.enum(DATE_TIPOS), inicio: z.string().nullable(), fim: z.string().nullable(), descricao: z.string().nullable(), origem: Origem }),
  ),
  etapas: z.array(z.string()),
  areas: z.array(z.enum(AREAS)),
  confianca: z.object({
    geral: z.number(),
    orgao: z.number(),
    numero_edital: z.number(),
    cargos: z.number(),
    datas: z.number(),
    taxa: z.number(),
    materias: z.number(),
  }),
  observacoes: z.string().nullable(),
});
export type SaidaExtracao = z.infer<typeof SaidaExtracao>;

// Prompt estável (cacheável entre documentos): instruções primeiro, documento depois.
const PROMPT_EXTRACAO = `Você lê atos oficiais de concursos públicos brasileiros (editais de abertura, retificações, autorizações, homologações, resultados e convocações publicados em diários oficiais e sites de bancas) e devolve os dados no formato JSON pedido.

Regras:
- Use somente o que está escrito no documento. Se um dado não estiver no texto, use null (ou lista vazia). Nunca invente.
- tipo_ato: "edital_abertura" (abre o concurso e as inscrições), "retificacao" (altera um edital já publicado), "autorizacao" (portaria que autoriza o concurso), "previsto" (concurso anunciado/solicitado, ainda sem autorização), "homologacao" (homologa o resultado final), "resultado" (resultado ou gabarito), "convocacao" (nomeação, convocação ou posse de aprovados), "outro" (não é ato de concurso público).
- numero_edital no formato "N/AAAA" (ex.: "1/2026") e ano = ano desse edital. Em retificação, homologação, resultado ou convocação, informe o número do EDITAL DE ABERTURA a que o ato se refere, não o número do próprio ato.
- orgao: nome completo do órgão que faz o concurso (ex.: "Tribunal Regional do Trabalho da 2ª Região"), sem "O Presidente do". orgao_sigla: sigla curta (ex.: "TRT 2", "INSS", "PC MG").
- esfera: federal, estadual ou municipal. uf: sigla de 2 letras quando o concurso é estadual, municipal ou de órgão federal regional (ex.: TRT 2 = SP); null para órgão federal de abrangência nacional. cidade: só quando o concurso é municipal ou de uma sede específica.
- banca: nome curto da organizadora (Cebraspe, FGV, FCC, Vunesp, Cesgranrio, IBFC, AOCP, Quadrix, Idecan ou o nome curto que aparecer).
- Valores sempre em centavos: R$ 8.500,00 → 850000. salario_centavos: remuneração inicial do cargo. taxa_centavos: valor da taxa de inscrição (se variar por nível, o maior).
- Datas no formato AAAA-MM-DD. tipos: isencao (período para pedir isenção da taxa), inscricao (período de inscrições), pagamento (prazo do boleto), local_prova (divulgação dos locais de prova), prova (aplicação da prova objetiva), gabarito, recurso, resultado, outro. Prazo de um dia só: inicio = fim. Prazo só com data final: inicio = null.
- Em retificação, devolva SÓ o que a retificação altera (por exemplo, datas novas, taxa, vagas), com os valores novos. Os demais campos ficam null ou com listas vazias, exceto orgao, esfera, numero_edital e ano.
- cargos[].materias: disciplinas da prova daquele cargo (conteúdo programático ou quadro de provas), com o nome como aparece no edital e o número de questões quando houver.
- escolaridade: fundamental, medio, tecnico ou superior. area do cargo e areas do concurso: use só os valores permitidos.
- origem: item do edital (ex.: "4.1") e página (o número do marcador "[página N]" mais próximo antes do trecho). null quando não houver.
- etapas: lista curta (ex.: "Prova objetiva", "Prova discursiva", "Avaliação de títulos").
- confianca (0 a 1) por grupo e geral: 0,95 ou mais quando o texto é explícito; abaixo de 0,7 quando foi preciso deduzir, o texto está incompleto, truncado ou ambíguo. Seja honesto: um humano revisa tudo abaixo de 0,85.
- titulo: "<sigla ou órgão> · <cargos principais>" (até 120 caracteres). resumo: 1 ou 2 frases factuais, sem opinião, sem política e sem promessa.`;

/** Limite de texto enviado (≈ 150 mil tokens). Acima disso a extração vai para revisão humana. */
export const MAX_CARACTERES = 600_000;

export interface ExtracaoIA {
  saida: SaidaExtracao | null;
  modelo: string;
  tokensIn: number;
  tokensOut: number;
  cacheReadTokens: number;
  custoCentavos: number;
  erro: string | null;
  truncado: boolean;
}

export async function extrairComIA(p: {
  texto: string;
  titulo: string | null;
  url: string;
  publicadoEm: string | null;
  dicas?: DicasDocumento;
  tipoSugerido: ActTipo;
  modelo?: string;
}): Promise<ExtracaoIA> {
  const modelo = p.modelo ?? MODELO_RAPIDO;
  const truncado = p.texto.length > MAX_CARACTERES;
  const texto = truncado ? p.texto.slice(0, MAX_CARACTERES) : p.texto;
  const contexto = [
    `Título: ${p.titulo ?? "(sem título)"}`,
    `Link oficial: ${p.url}`,
    `Publicado em: ${p.publicadoEm ?? "não informado"}`,
    `Classificação prévia: ${p.tipoSugerido}`,
    p.dicas && Object.values(p.dicas).some(Boolean) ? `Pistas da fonte (confirme no texto): ${JSON.stringify(p.dicas)}` : null,
    truncado ? "ATENÇÃO: o documento foi cortado por tamanho; reduza a confiança." : null,
  ]
    .filter(Boolean)
    .join("\n");
  try {
    const r = await clienteIA().messages.parse({
      model: modelo,
      max_tokens: 16000,
      system: [{ type: "text", text: PROMPT_EXTRACAO, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `${contexto}\n\n<documento>\n${texto}\n</documento>` }],
      output_config: { format: zodOutputFormat(SaidaExtracao), effort: "medium" },
    });
    const uso = r.usage;
    const base = {
      modelo,
      tokensIn: tokensEntrada(uso),
      tokensOut: uso.output_tokens,
      cacheReadTokens: uso.cache_read_input_tokens ?? 0,
      custoCentavos: await custoCentavos(modelo, uso),
      truncado,
    };
    if (r.stop_reason === "refusal") return { ...base, saida: null, erro: "o modelo recusou o documento" };
    if (r.stop_reason === "max_tokens") return { ...base, saida: null, erro: "resposta cortada (max_tokens)" };
    return { ...base, saida: r.parsed_output, erro: r.parsed_output ? null : "saída vazia" };
  } catch (e) {
    const msg =
      e instanceof Anthropic.RateLimitError ? "limite de taxa da API (tente depois)"
      : e instanceof Anthropic.APIError ? `API ${e.status}: ${e.message}`
      : (e as Error).message;
    return { saida: null, modelo, tokensIn: 0, tokensOut: 0, cacheReadTokens: 0, custoCentavos: 0, erro: msg, truncado };
  }
}

// ---------- Classificação ----------

const SaidaClassificacao = z.object({ tipo: z.enum(ACT_TIPOS), confianca: z.number(), motivo: z.string() });

const PROMPT_CLASSIFICACAO = `Classifique o ato oficial brasileiro em um tipo: "previsto" (concurso anunciado/solicitado), "autorizacao" (portaria que autoriza concurso), "edital_abertura" (abre concurso e inscrições), "retificacao" (altera edital publicado), "homologacao" (homologa resultado final), "resultado" (resultado ou gabarito), "convocacao" (nomeação, convocação ou posse de aprovados) ou "outro" (não é ato de concurso público, ex.: licitação, aposentadoria, processo seletivo de bolsa sem vínculo). Dê confiança de 0 a 1 e um motivo curto.`;

export async function classificarComIA(p: { texto: string; titulo: string | null }) {
  const modelo = MODELO_RAPIDO;
  const r = await clienteIA().messages.parse({
    model: modelo,
    max_tokens: 2000,
    system: PROMPT_CLASSIFICACAO,
    messages: [{ role: "user", content: `Título: ${p.titulo ?? ""}\n\n${p.texto.slice(0, 8000)}` }],
    output_config: { format: zodOutputFormat(SaidaClassificacao), effort: "low" },
  });
  if (!r.parsed_output) throw new Error(`classificação sem resposta (${r.stop_reason})`);
  return {
    tipo: r.parsed_output.tipo,
    confianca: Math.max(0, Math.min(1, r.parsed_output.confianca)),
    motivo: r.parsed_output.motivo,
    modelo,
    tokensIn: tokensEntrada(r.usage),
    tokensOut: r.usage.output_tokens,
    custoCentavos: await custoCentavos(modelo, r.usage),
  };
}
