import "server-only";
import { sql, type Tx } from "@/lib/db";
import type { ConcursoBanco } from "../concurso-form";
import { like } from "./busca";

export const ORDENS_CONCURSO = ["atualizado", "publicado_em", "titulo", "vagas", "salario", "seguidores", "prazo"] as const;
export type OrdemConcurso = (typeof ORDENS_CONCURSO)[number];

export interface FiltroConcursos {
  q?: string;
  status?: string;
  esfera?: string;
  uf?: string;
  banca?: string;
  publicado?: boolean;
  exemplo?: boolean;
  ordem: OrdemConcurso;
  dir: "asc" | "desc";
  pagina: number;
  porPagina: number;
}

export interface LinhaConcurso {
  id: string;
  titulo: string;
  orgao: string;
  orgao_sigla: string | null;
  status: string;
  esfera: string;
  uf: string | null;
  banca: string | null;
  numero_edital: string | null;
  vagas_total: number | null;
  salario_max_centavos: number | null;
  publicado: boolean;
  exemplo: boolean;
  updated_at: Date;
  publicado_em: string | null;
  seguidores: number;
  proxima: { tipo: string; data: string } | null;
}

export async function listarConcursos(f: FiltroConcursos) {
  const where = sql`
    true
    ${f.q ? sql`and (c.orgao || ' ' || c.titulo || ' ' || coalesce(c.orgao_sigla, '') || ' ' || coalesce(c.numero_edital, '') || ' ' || coalesce(c.cidade, '')) ilike ${like(f.q)}` : sql``}
    ${f.status ? sql`and c.status = ${f.status}` : sql``}
    ${f.esfera ? sql`and c.esfera = ${f.esfera}` : sql``}
    ${f.uf ? (f.uf === "nacional" ? sql`and c.uf is null` : sql`and c.uf = ${f.uf}`) : sql``}
    ${f.banca ? (f.banca === "sem" ? sql`and c.banca is null` : sql`and c.banca = ${f.banca}`) : sql``}
    ${f.publicado !== undefined ? sql`and c.publicado = ${f.publicado}` : sql``}
    ${f.exemplo !== undefined ? sql`and c.exemplo = ${f.exemplo}` : sql``}`;
  const dir = f.dir === "asc" ? sql`asc` : sql`desc`;
  const ordem = {
    atualizado: sql`c.updated_at ${dir}`,
    publicado_em: sql`c.publicado_em ${dir} nulls last`,
    titulo: sql`c.titulo ${dir}`,
    vagas: sql`c.vagas_total ${dir} nulls last`,
    salario: sql`c.salario_max_centavos ${dir} nulls last`,
    seguidores: sql`seguidores ${dir}`,
    prazo: sql`(select min(coalesce(d.fim, d.inicio)) from contest_dates d where d.contest_id = c.id and coalesce(d.fim, d.inicio) >= current_date) ${dir} nulls last`,
  }[f.ordem];
  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from contests c where ${where}`;
  const itens = await sql<LinhaConcurso[]>`
    select c.id, c.titulo, c.orgao, c.orgao_sigla, c.status, c.esfera, c.uf, c.banca, c.numero_edital, c.vagas_total, c.salario_max_centavos,
           c.publicado, c.exemplo, c.updated_at, c.publicado_em,
           (select count(*)::int from follows fo where fo.contest_id = c.id) as seguidores,
           (select json_build_object('tipo', d.tipo, 'data', coalesce(d.fim, d.inicio)) from contest_dates d
              where d.contest_id = c.id and coalesce(d.fim, d.inicio) >= (now() at time zone 'America/Sao_Paulo')::date
              order by coalesce(d.fim, d.inicio) limit 1) as proxima
    from contests c where ${where}
    order by ${ordem}, c.id
    limit ${f.porPagina} offset ${(f.pagina - 1) * f.porPagina}`;
  return { itens, total };
}

export async function bancasEmUso() {
  const r = await sql<{ banca: string }[]>`select distinct banca from contests where banca is not null order by banca`;
  return r.map((x) => x.banca);
}

export async function contagemExemplos() {
  const [r] = await sql<{ concursos: number; seguidores: number }[]>`
    select count(*)::int as concursos, (select count(*)::int from follows f join contests c on c.id = f.contest_id where c.exemplo) as seguidores
    from contests where exemplo`;
  return r;
}

export async function todasMaterias() {
  return sql<{ id: string; nome: string }[]>`select id, nome from subjects order by nome`;
}

/** Estado do concurso no formato do formulário (usado na tela e para comparar antes/depois ao salvar). */
export async function concursoBanco(id: string, tx: Tx = sql): Promise<(ConcursoBanco & { id: string; slug: string }) | null> {
  const [c] = await tx<(Omit<ConcursoBanco, "cargos" | "datas" | "materias"> & { id: string; slug: string })[]>`
    select id, slug, titulo, orgao, orgao_sigla, esfera, uf, cidade, banca, numero_edital, ano, status, resumo, url_oficial, taxa_centavos,
           cadastro_reserva, escolaridades, areas, publicado_em, publicado, exemplo, edital_texto
    from contests where id = ${id}`;
  if (!c) return null;
  const [cargos, datas, materias] = await Promise.all([
    tx<ConcursoBanco["cargos"]>`select id, nome, escolaridade, area, vagas, cadastro_reserva, salario_centavos, jornada, requisitos
                                from contest_roles where contest_id = ${id} order by salario_centavos desc nulls last, nome`,
    tx<ConcursoBanco["datas"]>`select id, tipo, inicio, fim, descricao, fonte_item, fonte_pagina from contest_dates
                               where contest_id = ${id} order by coalesce(inicio, fim), tipo`,
    tx<ConcursoBanco["materias"]>`select cs.subject_id, s.nome, cs.role_id, cs.questoes from contest_subjects cs
                                  join subjects s on s.id = cs.subject_id where cs.contest_id = ${id} order by cs.questoes desc nulls last, s.nome`,
  ]);
  return { ...c, cargos, datas, materias };
}

export async function extrasDoConcurso(id: string) {
  const [seguidores, versoes, atos, extracoes] = await Promise.all([
    sql<{ n: number }[]>`select count(*)::int as n from follows where contest_id = ${id}`,
    sql<{ versao: number; resumo: string | null; diff_json: unknown; created_at: Date; act_tipo: string | null }[]>`
      select v.versao, v.resumo, v.diff_json, v.created_at, a.tipo as act_tipo
      from contest_versions v left join acts a on a.id = v.act_id where v.contest_id = ${id} order by v.versao desc`,
    sql<{ id: string; tipo: string; confianca: number | null; resumo: string | null; url_oficial: string | null; publicado_em: string | null; created_at: Date; doc_id: string | null; doc_titulo: string | null }[]>`
      select a.id, a.tipo, a.confianca::float8 as confianca, a.resumo, a.url_oficial, a.publicado_em, a.created_at,
             a.raw_document_id as doc_id, rd.titulo as doc_titulo
      from acts a left join raw_documents rd on rd.id = a.raw_document_id where a.contest_id = ${id} order by a.created_at desc`,
    sql<{ id: string; status: string; confianca: number; created_at: Date }[]>`
      select id, status, confianca::float8 as confianca, created_at from extractions where contest_id = ${id} order by created_at desc limit 20`,
  ]);
  return { seguidores: seguidores[0].n, versoes, atos, extracoes };
}
