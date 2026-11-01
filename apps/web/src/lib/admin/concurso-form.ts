// Formulário de concurso do painel: schema (validado no cliente e no servidor) e conversões.
import { z } from "zod";
import { AREAS, CONTEST_STATUS, DATE_TIPOS, ESCOLARIDADES, ESFERAS, UFS } from "@aviso/shared";
import { centavosParaInput, inputParaCentavos } from "./formato";
import { novaChave, type CargoForm, type DataForm } from "./campos-form";

const txt = z.string().trim();
const opcional = txt.max(2000).nullable();
const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");
const uuid = z.string().uuid();

export const ConcursoDados = z.object({
  titulo: txt.min(3).max(200),
  orgao: txt.min(2).max(200),
  orgao_sigla: txt.max(40).nullable(),
  esfera: z.enum(ESFERAS),
  uf: z.enum(UFS).nullable(),
  cidade: txt.max(120).nullable(),
  banca: txt.max(120).nullable(),
  numero_edital: txt.max(40).nullable(),
  ano: z.number().int().min(1990).max(2100).nullable(),
  status: z.enum(CONTEST_STATUS),
  resumo: opcional,
  url_oficial: z.string().trim().url().regex(/^https?:\/\//i, "Use um link http(s)"),
  taxa_centavos: z.number().int().min(0).nullable(),
  cadastro_reserva: z.boolean(),
  escolaridades: z.array(z.enum(ESCOLARIDADES)),
  areas: z.array(z.enum(AREAS)),
  publicado_em: dataIso.nullable(),
  publicado: z.boolean(),
  exemplo: z.boolean(),
  edital_texto: z.string().max(3_000_000).nullable(),
  cargos: z.array(
    z.object({
      id: uuid.optional(),
      chave: z.string().min(1),
      nome: txt.min(2).max(200),
      escolaridade: z.enum(ESCOLARIDADES).nullable(),
      area: txt.max(60).nullable(),
      vagas: z.number().int().min(0).nullable(),
      cadastro_reserva: z.boolean(),
      salario_centavos: z.number().int().min(0).nullable(),
      jornada: txt.max(40).nullable(),
      requisitos: opcional,
    }),
  ),
  datas: z.array(
    z
      .object({
        id: uuid.optional(),
        tipo: z.enum(DATE_TIPOS),
        inicio: dataIso.nullable(),
        fim: dataIso.nullable(),
        descricao: txt.max(300).nullable(),
        fonte_item: txt.max(40).nullable(),
        fonte_pagina: z.number().int().min(1).nullable(),
      })
      .refine((d) => d.inicio || d.fim, { message: "Informe início ou fim", path: ["fim"] })
      .refine((d) => !d.inicio || !d.fim || d.fim >= d.inicio, { message: "Fim antes do início", path: ["fim"] }),
  ),
  materias: z.array(z.object({ subject_id: uuid, cargo: z.string().nullable(), questoes: z.number().int().min(0).max(500).nullable() })),
});
export type ConcursoDados = z.infer<typeof ConcursoDados>;

export interface MateriaConcursoForm {
  k: string;
  subject_id: string;
  nome: string;
  cargo: string; // chave do cargo ou "" (todos)
  questoes: string;
}

export interface ModeloConcurso {
  titulo: string;
  orgao: string;
  orgao_sigla: string;
  esfera: string;
  uf: string;
  cidade: string;
  banca: string;
  numero_edital: string;
  ano: string;
  status: string;
  resumo: string;
  url_oficial: string;
  taxa: string;
  cadastro_reserva: boolean;
  escolaridades: string[];
  areas: string[];
  publicado_em: string;
  publicado: boolean;
  exemplo: boolean;
  edital_texto: string;
  cargos: CargoForm[];
  datas: DataForm[];
  materias: MateriaConcursoForm[];
}

/** Linhas do banco → modelo do formulário. */
export interface ConcursoBanco {
  titulo: string;
  orgao: string;
  orgao_sigla: string | null;
  esfera: string;
  uf: string | null;
  cidade: string | null;
  banca: string | null;
  numero_edital: string | null;
  ano: number | null;
  status: string;
  resumo: string | null;
  url_oficial: string;
  taxa_centavos: number | null;
  cadastro_reserva: boolean;
  escolaridades: string[];
  areas: string[];
  publicado_em: string | null;
  publicado: boolean;
  exemplo: boolean;
  edital_texto: string | null;
  cargos: { id: string; nome: string; escolaridade: string | null; area: string | null; vagas: number | null; cadastro_reserva: boolean; salario_centavos: number | null; jornada: string | null; requisitos: string | null }[];
  datas: { id: string; tipo: string; inicio: string | null; fim: string | null; descricao: string | null; fonte_item: string | null; fonte_pagina: number | null }[];
  materias: { subject_id: string; nome: string; role_id: string | null; questoes: number | null }[];
}

const s = (v: unknown) => (v == null ? "" : String(v));

export function modeloDeBanco(c: ConcursoBanco | null): ModeloConcurso {
  if (!c) {
    return {
      titulo: "", orgao: "", orgao_sigla: "", esfera: "federal", uf: "", cidade: "", banca: "", numero_edital: "", ano: String(new Date().getFullYear()),
      status: "edital_aberto", resumo: "", url_oficial: "", taxa: "", cadastro_reserva: false, escolaridades: [], areas: [], publicado_em: "",
      publicado: false, exemplo: false, edital_texto: "", cargos: [], datas: [], materias: [],
    };
  }
  const chavePorRole = new Map<string, string>();
  const cargos: CargoForm[] = c.cargos.map((r) => {
    const k = novaChave();
    chavePorRole.set(r.id, k);
    return {
      k, id: r.id, nome: r.nome, escolaridade: s(r.escolaridade), area: s(r.area), vagas: s(r.vagas), cadastro_reserva: r.cadastro_reserva,
      salario: centavosParaInput(r.salario_centavos), jornada: s(r.jornada), requisitos: s(r.requisitos), materias: [], origem_item: "", origem_pagina: "",
    };
  });
  return {
    titulo: c.titulo, orgao: c.orgao, orgao_sigla: s(c.orgao_sigla), esfera: c.esfera, uf: s(c.uf), cidade: s(c.cidade), banca: s(c.banca),
    numero_edital: s(c.numero_edital), ano: s(c.ano), status: c.status, resumo: s(c.resumo), url_oficial: c.url_oficial,
    taxa: centavosParaInput(c.taxa_centavos), cadastro_reserva: c.cadastro_reserva, escolaridades: c.escolaridades, areas: c.areas,
    publicado_em: s(c.publicado_em), publicado: c.publicado, exemplo: c.exemplo, edital_texto: s(c.edital_texto),
    cargos,
    datas: c.datas.map((d) => ({ k: novaChave(), id: d.id, tipo: d.tipo, inicio: s(d.inicio), fim: s(d.fim), descricao: s(d.descricao), origem_item: s(d.fonte_item), origem_pagina: s(d.fonte_pagina) })),
    materias: c.materias.map((m) => ({ k: novaChave(), subject_id: m.subject_id, nome: m.nome, cargo: m.role_id ? chavePorRole.get(m.role_id) ?? "" : "", questoes: s(m.questoes) })),
  };
}

const nulo = (v: string) => (v.trim() === "" ? null : v.trim());
function inteiro(v: string, k: string, erros: Record<string, string>) {
  const t = v.trim().replace(/\./g, "");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isInteger(n) || n < 0) {
    erros[k] = "Número inteiro inválido";
    return null;
  }
  return n;
}
function dinheiro(v: string, k: string, erros: Record<string, string>) {
  const c = inputParaCentavos(v);
  if (c !== null && Number.isNaN(c)) {
    erros[k] = "Valor inválido (ex.: 8.500,00)";
    return null;
  }
  return c;
}

/** Modelo → dados no formato de ConcursoDados (+ erros de conversão). */
export function dadosDoModelo(m: ModeloConcurso): { valor: unknown; erros: Record<string, string> } {
  const erros: Record<string, string> = {};
  const vistos = new Set<string>();
  m.materias.forEach((x, i) => {
    if (!x.subject_id) erros[`materias.${i}.subject_id`] = "Escolha uma matéria da lista";
    const chave = `${x.subject_id}|${x.cargo}`;
    if (x.subject_id && vistos.has(chave)) erros[`materias.${i}.subject_id`] = "Matéria repetida para o mesmo cargo";
    vistos.add(chave);
  });
  const valor = {
    titulo: m.titulo, orgao: m.orgao, orgao_sigla: nulo(m.orgao_sigla), esfera: m.esfera, uf: nulo(m.uf), cidade: nulo(m.cidade), banca: nulo(m.banca),
    numero_edital: nulo(m.numero_edital), ano: inteiro(m.ano, "ano", erros), status: m.status, resumo: nulo(m.resumo), url_oficial: m.url_oficial.trim(),
    taxa_centavos: dinheiro(m.taxa, "taxa_centavos", erros), cadastro_reserva: m.cadastro_reserva, escolaridades: m.escolaridades, areas: m.areas,
    publicado_em: nulo(m.publicado_em), publicado: m.publicado, exemplo: m.exemplo, edital_texto: m.edital_texto.trim() ? m.edital_texto : null,
    cargos: m.cargos.map((c, i) => ({
      ...(c.id ? { id: c.id } : {}), chave: c.k, nome: c.nome, escolaridade: c.escolaridade || null, area: nulo(c.area),
      vagas: inteiro(c.vagas, `cargos.${i}.vagas`, erros), cadastro_reserva: c.cadastro_reserva, salario_centavos: dinheiro(c.salario, `cargos.${i}.salario_centavos`, erros),
      jornada: nulo(c.jornada), requisitos: nulo(c.requisitos),
    })),
    datas: m.datas.map((d, i) => ({
      ...(d.id ? { id: d.id } : {}), tipo: d.tipo, inicio: nulo(d.inicio), fim: nulo(d.fim), descricao: nulo(d.descricao), fonte_item: nulo(d.origem_item),
      fonte_pagina: inteiro(d.origem_pagina, `datas.${i}.origem.pagina`, erros),
    })),
    materias: m.materias.map((x, i) => ({ subject_id: x.subject_id, cargo: x.cargo || null, questoes: inteiro(x.questoes, `materias.${i}.questoes`, erros) })),
  };
  return { valor, erros };
}

/** Campos que, mudando num concurso publicado com seguidores, justificam errata + aviso. */
export const CAMPOS_ERRATA = ["datas", "cargos", "taxa_centavos", "banca", "url_oficial", "numero_edital"] as const;

/** Forma comparável dos campos relevantes (ignora ids e chaves). */
export function relevantes(d: ConcursoDados) {
  return {
    datas: d.datas
      .map((x) => ({ tipo: x.tipo, inicio: x.inicio, fim: x.fim, descricao: x.descricao }))
      .sort((a, b) => (a.tipo + (a.fim ?? a.inicio)).localeCompare(b.tipo + (b.fim ?? b.inicio))),
    cargos: d.cargos.map((c) => ({ nome: c.nome, escolaridade: c.escolaridade, vagas: c.vagas, cadastro_reserva: c.cadastro_reserva, salario_centavos: c.salario_centavos })),
    taxa_centavos: d.taxa_centavos,
    banca: d.banca,
    url_oficial: d.url_oficial,
    numero_edital: d.numero_edital,
  };
}

export function camposRelevantesAlterados(antes: ConcursoDados, depois: ConcursoDados): string[] {
  const a = relevantes(antes) as Record<string, unknown>;
  const b = relevantes(depois) as Record<string, unknown>;
  return CAMPOS_ERRATA.filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}

export const ROTULO_CAMPO: Record<string, string> = {
  datas: "Datas",
  cargos: "Cargos",
  taxa_centavos: "Taxa",
  banca: "Banca",
  url_oficial: "Link oficial",
  numero_edital: "Nº do edital",
  titulo: "Título",
  orgao: "Órgão",
  status: "Situação",
  resumo: "Resumo",
  uf: "UF",
  cidade: "Cidade",
  vagas_total: "Vagas",
  salario_max_centavos: "Salário máximo",
  publicado: "Publicado",
  edital_texto: "Texto do edital",
  materias: "Matérias",
};
