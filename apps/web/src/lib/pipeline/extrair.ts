import "server-only";
import { UFS, type ActTipo } from "@aviso/shared";
import { extrairHeuristico } from "@/lib/ai/heuristica";
import { extrairComIA, type ExtracaoIA, type SaidaExtracao } from "@/lib/ai/extrair";
import { iaDisponivel, MODELO_FORTE, MODELO_RAPIDO } from "@/lib/ai/cliente";
import { configNumero } from "./config";
import { CamposExtraidos } from "./schema";
import type { DicasDocumento } from "./tipos";

export interface DocumentoParaExtrair {
  texto: string;
  titulo: string | null;
  url: string;
  publicadoEm: string | null;
  dicas?: DicasDocumento;
}

export interface ResultadoExtracao {
  /** Campos validados pelo schema (null se a extração não fechou o mínimo). */
  campos: CamposExtraidos | null;
  /** O que foi extraído, mesmo incompleto (vai para campos_json da fila de revisão). */
  bruto: Record<string, unknown>;
  confianca: number;
  confiancaCampos: Record<string, number>;
  faltando: string[];
  modelo: string;
  tokensIn: number;
  tokensOut: number;
  custoCentavos: number;
  motivo: string | null;
}

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Campos obrigatórios por tipo de ato para publicar sem revisão. */
export function avaliarCampos(c: Partial<CamposExtraidos>, tipo: ActTipo): string[] {
  const faltando: string[] = [];
  if (!c.orgao) faltando.push("orgao");
  if (!c.esfera) faltando.push("esfera");
  if (!c.url_oficial) faltando.push("url_oficial");
  const datas = c.datas ?? [];
  switch (tipo) {
    case "edital_abertura":
      if (!c.numero_edital) faltando.push("numero_edital");
      if (!c.ano) faltando.push("ano");
      if (!c.cargos?.length) faltando.push("cargos");
      if (!datas.some((d) => d.tipo === "inscricao" && (d.fim || d.inicio))) faltando.push("datas.inscricao");
      if (c.esfera && c.esfera !== "federal" && !c.uf) faltando.push("uf");
      if (c.esfera === "municipal" && !c.cidade) faltando.push("cidade");
      break;
    case "retificacao":
      if (!c.numero_edital) faltando.push("numero_edital");
      if (!c.ano) faltando.push("ano");
      if (!datas.length && c.taxa_centavos == null && !c.cargos?.length && !c.banca) faltando.push("alteracoes");
      break;
    case "homologacao":
    case "resultado":
    case "convocacao":
      if (!c.numero_edital) faltando.push("numero_edital");
      if (!c.ano) faltando.push("ano");
      break;
    default:
      break;
  }
  return faltando;
}

function limparUf(uf: string | null | undefined): string | null {
  const u = uf?.trim().toUpperCase();
  return u && (UFS as readonly string[]).includes(u) ? u : null;
}

function normalizarNumero(numero: string | null | undefined, ano: number | null | undefined): string | null {
  if (!numero) return null;
  const m = numero.match(/(\d{1,4})\s*(?:\/\s*(\d{4}))?/);
  if (!m) return numero.trim() || null;
  return `${Number(m[1])}/${m[2] ?? ano ?? ""}`.replace(/\/$/, "");
}

/** Converte a saída da IA no formato do pipeline (o link oficial vem sempre da fonte, nunca do modelo). */
function deIA(s: SaidaExtracao, doc: DocumentoParaExtrair): Record<string, unknown> {
  return {
    tipo_ato: s.tipo_ato,
    orgao: s.orgao?.trim() || doc.dicas?.orgao || null,
    orgao_sigla: s.orgao_sigla,
    esfera: s.esfera ?? doc.dicas?.esfera ?? null,
    uf: limparUf(s.uf ?? doc.dicas?.uf),
    cidade: s.cidade ?? doc.dicas?.cidade ?? null,
    banca: s.banca ?? doc.dicas?.banca ?? null,
    numero_edital: normalizarNumero(s.numero_edital, s.ano),
    ano: s.ano,
    titulo: s.titulo,
    resumo: s.resumo,
    cargos: s.cargos.filter((c) => c.nome.trim().length >= 2),
    taxa_centavos: s.taxa_centavos,
    datas: s.datas
      .map((d) => ({ ...d, inicio: d.inicio && RE_DATA.test(d.inicio) ? d.inicio : null, fim: d.fim && RE_DATA.test(d.fim) ? d.fim : null }))
      .filter((d) => d.inicio || d.fim),
    etapas: s.etapas,
    url_oficial: doc.url,
    areas: s.areas,
    confianca_campos: s.confianca,
  };
}

function validar(bruto: Record<string, unknown>): CamposExtraidos | null {
  const r = CamposExtraidos.safeParse(bruto);
  return r.success ? r.data : null;
}

async function viaIA(doc: DocumentoParaExtrair, tipo: ActTipo, modelo: string): Promise<{ ia: ExtracaoIA; bruto: Record<string, unknown> | null; confianca: number; faltando: string[] }> {
  const ia = await extrairComIA({ ...doc, tipoSugerido: tipo, modelo });
  if (!ia.saida) return { ia, bruto: null, confianca: 0, faltando: ["extracao"] };
  const bruto = deIA(ia.saida, doc);
  const tipoFinal = (ia.saida.tipo_ato ?? tipo) as ActTipo;
  const faltando = avaliarCampos(bruto as Partial<CamposExtraidos>, tipoFinal);
  let confianca = Math.max(0, Math.min(1, ia.saida.confianca.geral));
  if (faltando.length) confianca = Math.min(confianca, 0.8);
  if (ia.truncado) confianca = Math.min(confianca, 0.6);
  if (!validar(bruto)) confianca = Math.min(confianca, 0.5);
  return { ia, bruto, confianca, faltando };
}

/**
 * Extrai os campos do ato. Claude Haiku 5.5 em todos; se a confiança ficar abaixo do limiar,
 * segunda leitura com Claude Sonnet 5.5. Sem chave de API, o extrator heurístico (desenvolvimento).
 */
export async function extrairCampos(doc: DocumentoParaExtrair, tipo: ActTipo): Promise<ResultadoExtracao> {
  if (!iaDisponivel()) {
    const h = extrairHeuristico(doc, tipo);
    const bruto: Record<string, unknown> = { ...h, url_oficial: doc.url };
    const faltando = avaliarCampos(bruto as Partial<CamposExtraidos>, tipo);
    const campos = validar(bruto);
    const base = tipo === "edital_abertura" ? 0.9 : tipo === "retificacao" ? 0.92 : 0.88;
    let confianca = Math.round(base * Math.max(0, 1 - 0.15 * faltando.length) * 1000) / 1000;
    if (!campos) confianca = Math.min(confianca, 0.4);
    // O leitor heurístico nunca publica sozinho em produção.
    if (process.env.NODE_ENV === "production") confianca = Math.min(confianca, 0.5);
    return {
      campos,
      bruto,
      confianca,
      confiancaCampos: {},
      faltando,
      modelo: "heuristica",
      tokensIn: 0,
      tokensOut: 0,
      custoCentavos: 0,
      motivo: faltando.length ? `faltando: ${faltando.join(", ")}` : null,
    };
  }
  const limiar = await configNumero("limiar_confianca");
  let r = await viaIA(doc, tipo, MODELO_RAPIDO);
  const tokens = { in: r.ia.tokensIn, out: r.ia.tokensOut, custo: r.ia.custoCentavos };
  let modelo = MODELO_RAPIDO;
  const erros = [r.ia.erro].filter(Boolean) as string[];
  if (r.confianca < limiar) {
    const forte = await viaIA(doc, tipo, MODELO_FORTE);
    tokens.in += forte.ia.tokensIn;
    tokens.out += forte.ia.tokensOut;
    tokens.custo += forte.ia.custoCentavos;
    modelo = `${MODELO_RAPIDO}+${MODELO_FORTE}`;
    if (forte.ia.erro) erros.push(forte.ia.erro);
    if (forte.bruto && (forte.confianca >= r.confianca || !r.bruto)) r = forte;
  }
  const bruto = r.bruto ?? { tipo_ato: tipo, url_oficial: doc.url };
  const motivos = [...erros, r.faltando.length ? `faltando: ${r.faltando.join(", ")}` : null, r.ia.truncado ? "documento truncado" : null].filter(Boolean);
  return {
    campos: validar(bruto),
    bruto,
    confianca: Math.round(r.confianca * 1000) / 1000,
    confiancaCampos: (bruto.confianca_campos as Record<string, number>) ?? {},
    faltando: r.faltando,
    modelo,
    tokensIn: tokens.in,
    tokensOut: tokens.out,
    custoCentavos: tokens.custo,
    motivo: motivos.length ? motivos.join("; ") : null,
  };
}
