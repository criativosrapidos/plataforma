// Modelo do formulário de CamposExtraidos (fila de revisão) e conversões de/para o JSON da extração.
// Puro: roda no cliente (validação imediata) e no servidor.
import type { ZodError } from "zod";
import { centavosParaInput, inputParaCentavos } from "./formato";

let seq = 0;
export const novaChave = () => `k${++seq}_${Math.random().toString(36).slice(2, 7)}`;

export interface MateriaForm {
  k: string;
  nome: string;
  numero_questoes: string;
}
export interface CargoForm {
  k: string;
  id?: string;
  nome: string;
  escolaridade: string;
  area: string;
  vagas: string;
  cadastro_reserva: boolean;
  salario: string;
  jornada: string;
  requisitos: string;
  materias: MateriaForm[];
  origem_item: string;
  origem_pagina: string;
}
export interface DataForm {
  k: string;
  id?: string;
  tipo: string;
  inicio: string;
  fim: string;
  descricao: string;
  origem_item: string;
  origem_pagina: string;
}
export interface ModeloCampos {
  tipo_ato: string;
  orgao: string;
  orgao_sigla: string;
  esfera: string;
  uf: string;
  cidade: string;
  banca: string;
  numero_edital: string;
  ano: string;
  titulo: string;
  resumo: string;
  url_oficial: string;
  taxa: string;
  areas: string[];
  etapas: string;
  cargos: CargoForm[];
  datas: DataForm[];
}

type J = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));
const obj = (v: unknown): J => (v && typeof v === "object" && !Array.isArray(v) ? (v as J) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function cargoVazio(): CargoForm {
  return { k: novaChave(), nome: "", escolaridade: "", area: "", vagas: "", cadastro_reserva: false, salario: "", jornada: "", requisitos: "", materias: [], origem_item: "", origem_pagina: "" };
}
export function dataVazia(tipo = "inscricao"): DataForm {
  return { k: novaChave(), tipo, inicio: "", fim: "", descricao: "", origem_item: "", origem_pagina: "" };
}

/** JSON da extração (possivelmente incompleto) → modelo do formulário. */
export function deCampos(json: unknown): ModeloCampos {
  const c = obj(json);
  return {
    tipo_ato: s(c.tipo_ato) || "outro",
    orgao: s(c.orgao),
    orgao_sigla: s(c.orgao_sigla),
    esfera: s(c.esfera),
    uf: s(c.uf).toUpperCase(),
    cidade: s(c.cidade),
    banca: s(c.banca),
    numero_edital: s(c.numero_edital),
    ano: s(c.ano),
    titulo: s(c.titulo),
    resumo: s(c.resumo),
    url_oficial: s(c.url_oficial),
    taxa: typeof c.taxa_centavos === "number" ? centavosParaInput(c.taxa_centavos) : "",
    areas: arr(c.areas).map(String),
    etapas: arr(c.etapas).map(String).join("\n"),
    cargos: arr(c.cargos).map((x) => {
      const r = obj(x);
      const o = obj(r.origem);
      return {
        k: novaChave(),
        nome: s(r.nome),
        escolaridade: s(r.escolaridade),
        area: s(r.area),
        vagas: s(r.vagas),
        cadastro_reserva: r.cadastro_reserva === true,
        salario: typeof r.salario_centavos === "number" ? centavosParaInput(r.salario_centavos) : "",
        jornada: s(r.jornada),
        requisitos: s(r.requisitos),
        materias: arr(r.materias).map((m) => ({ k: novaChave(), nome: s(obj(m).nome), numero_questoes: s(obj(m).numero_questoes) })),
        origem_item: s(o.item),
        origem_pagina: s(o.pagina),
      };
    }),
    datas: arr(c.datas).map((x) => {
      const d = obj(x);
      const o = obj(d.origem);
      return { k: novaChave(), tipo: s(d.tipo) || "outro", inicio: s(d.inicio), fim: s(d.fim), descricao: s(d.descricao), origem_item: s(o.item), origem_pagina: s(o.pagina) };
    }),
  };
}

const nulo = (v: string) => (v.trim() === "" ? null : v.trim());

function inteiro(v: string, chave: string, erros: Record<string, string>, min = 0): number | null {
  const t = v.trim().replace(/\./g, "");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isInteger(n) || n < min) {
    erros[chave] = "Número inteiro inválido";
    return null;
  }
  return n;
}

function dinheiro(v: string, chave: string, erros: Record<string, string>): number | null {
  const c = inputParaCentavos(v);
  if (c !== null && Number.isNaN(c)) {
    erros[chave] = "Valor inválido (ex.: 8.500,00)";
    return null;
  }
  return c;
}

function origem(item: string, pagina: string, chave: string, erros: Record<string, string>) {
  const p = inteiro(pagina, `${chave}.pagina`, erros, 1);
  if (!item.trim() && p == null) return undefined;
  return { item: nulo(item), pagina: p };
}

/** Modelo do formulário → objeto no formato de CamposExtraidos (+ erros de conversão por caminho). */
export function paraCampos(m: ModeloCampos): { valor: J; erros: Record<string, string> } {
  const erros: Record<string, string> = {};
  const datas = m.datas.map((d, i) => {
    if (!d.inicio && !d.fim) erros[`datas.${i}.fim`] = "Informe início ou fim";
    if (d.inicio && d.fim && d.fim < d.inicio) erros[`datas.${i}.fim`] = "Fim antes do início";
    return { tipo: d.tipo, inicio: nulo(d.inicio), fim: nulo(d.fim), descricao: nulo(d.descricao), origem: origem(d.origem_item, d.origem_pagina, `datas.${i}.origem`, erros) };
  });
  const valor: J = {
    tipo_ato: m.tipo_ato,
    orgao: m.orgao.trim(),
    orgao_sigla: nulo(m.orgao_sigla),
    esfera: m.esfera || undefined,
    uf: nulo(m.uf)?.toUpperCase() ?? null,
    cidade: nulo(m.cidade),
    banca: nulo(m.banca),
    numero_edital: nulo(m.numero_edital),
    ano: inteiro(m.ano, "ano", erros, 1900),
    titulo: nulo(m.titulo),
    resumo: nulo(m.resumo),
    url_oficial: m.url_oficial.trim(),
    taxa_centavos: dinheiro(m.taxa, "taxa_centavos", erros),
    areas: m.areas,
    etapas: m.etapas
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean),
    cargos: m.cargos.map((c, i) => ({
      nome: c.nome.trim(),
      escolaridade: c.escolaridade || null,
      area: nulo(c.area),
      vagas: inteiro(c.vagas, `cargos.${i}.vagas`, erros),
      cadastro_reserva: c.cadastro_reserva,
      salario_centavos: dinheiro(c.salario, `cargos.${i}.salario_centavos`, erros),
      jornada: nulo(c.jornada),
      requisitos: nulo(c.requisitos),
      materias: c.materias
        .filter((x) => x.nome.trim())
        .map((x, j) => ({ nome: x.nome.trim(), numero_questoes: inteiro(x.numero_questoes, `cargos.${i}.materias.${j}.numero_questoes`, erros) })),
      origem: origem(c.origem_item, c.origem_pagina, `cargos.${i}.origem`, erros),
    })),
    datas,
  };
  return { valor, erros };
}

/** Mensagens de validação em pt-BR (sem mexer na configuração global do zod). */
export function errosZodPt(e: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = i.path.map(String).join(".") || "_";
    if (out[k]) continue;
    const it = i as unknown as { code: string; input?: unknown; minimum?: number; maximum?: number; format?: string; origin?: string };
    const n = (x?: number) => (x ?? 0).toLocaleString("pt-BR");
    let msg = "Valor inválido";
    if (it.code === "invalid_type") msg = it.input === undefined || it.input === null || it.input === "" ? "Obrigatório" : "Valor inválido";
    else if (it.code === "too_small")
      msg = it.input === "" ? "Obrigatório" : it.origin === "string" ? `Mínimo de ${n(it.minimum)} caracteres` : it.origin === "array" ? `Pelo menos ${n(it.minimum)}` : `Mínimo ${n(it.minimum)}`;
    else if (it.code === "too_big") msg = it.origin === "string" ? `Máximo de ${n(it.maximum)} caracteres` : `Máximo ${n(it.maximum)}`;
    else if (it.code === "invalid_format") msg = it.format === "url" ? "URL inválida (comece com https://)" : "Formato inválido";
    else if (it.code === "invalid_value") msg = "Escolha uma opção";
    out[k] = msg;
  }
  return out;
}

/**
 * Campos de baixa confiança: usa `campos_json.confianca_campos` (ou `_confianca`) — mapa caminho → 0..1 —
 * quando o extrator fornece, mais sinais simples (falta de origem, vagas/salário vazios, menções no motivo).
 */
export function camposBaixaConfianca(json: unknown, motivo: string | null, limiar: number): Record<string, string> {
  const c = obj(json);
  const out: Record<string, string> = {};
  const mapa = obj(c.confianca_campos ?? c._confianca);
  for (const [k, v] of Object.entries(mapa)) {
    if (typeof v === "number" && v < limiar) out[k] = `Confiança ${Math.round(v * 100)}% na extração`;
  }
  arr(c.datas).forEach((d, i) => {
    const o = obj(obj(d).origem);
    if (!o.item && !o.pagina && !out[`datas.${i}`]) out[`datas.${i}`] = "Sem item/página de origem no edital";
  });
  arr(c.cargos).forEach((r, i) => {
    const x = obj(r);
    if (x.vagas == null && x.cadastro_reserva !== true && !out[`cargos.${i}.vagas`]) out[`cargos.${i}.vagas`] = "Vagas não informadas";
    if (x.salario_centavos == null && !out[`cargos.${i}.salario_centavos`]) out[`cargos.${i}.salario_centavos`] = "Salário não informado";
  });
  if (!c.url_oficial) out.url_oficial = "Sem link oficial";
  const m = (motivo ?? "").toLowerCase();
  const sinais: [RegExp, string][] = [
    [/data|prazo|cronograma/, "datas"],
    [/taxa/, "taxa_centavos"],
    [/banca/, "banca"],
    [/classifica|tipo de ato|previsto|autoriza/, "tipo_ato"],
    [/órgão|orgao/, "orgao"],
    [/edital n|número do edital|numero do edital/, "numero_edital"],
  ];
  for (const [re, k] of sinais) if (re.test(m) && !out[k]) out[k] = "Citado no motivo da revisão";
  if (/sal[aá]rio|remunera/.test(m)) arr(c.cargos).forEach((_, i) => (out[`cargos.${i}.salario_centavos`] ??= "Citado no motivo da revisão"));
  if (/vaga/.test(m)) arr(c.cargos).forEach((_, i) => (out[`cargos.${i}.vagas`] ??= "Citado no motivo da revisão"));
  return out;
}

/** Procura um alerta de baixa confiança para o campo ou para alguma seção-mãe (ex.: "datas" cobre "datas.0.fim"). */
export function alertaDe(mapa: Record<string, string>, caminho: string): string | false {
  const partes = caminho.split(".");
  for (let n = partes.length; n > 0; n--) {
    const k = partes.slice(0, n).join(".");
    if (mapa[k]) return mapa[k];
  }
  return false;
}
