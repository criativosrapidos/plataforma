import "server-only";
import { sql } from "@/lib/db";
import { like } from "./busca";

// ---------------------------------------------------------------- Documentos

export interface LinhaDocumento {
  id: string;
  titulo: string | null;
  url: string;
  status: string;
  erro: string | null;
  publicado_em: string | null;
  coletado_em: Date;
  fonte: string | null;
  extracoes: number;
  tamanho: number;
}

export async function listarDocumentos(f: { status?: string; fonte?: string; de?: string; ate?: string; q?: string; pagina: number; porPagina: number }) {
  const where = sql`
    true
    ${f.status ? sql`and rd.status = ${f.status}` : sql``}
    ${f.fonte ? sql`and rd.source_id = ${f.fonte}` : sql``}
    ${f.de ? sql`and rd.coletado_em >= (${f.de}::date::timestamp at time zone 'America/Sao_Paulo')` : sql``}
    ${f.ate ? sql`and rd.coletado_em < ((${f.ate}::date + 1)::timestamp at time zone 'America/Sao_Paulo')` : sql``}
    ${f.q ? sql`and (coalesce(rd.titulo, '') || ' ' || rd.url) ilike ${like(f.q)}` : sql``}`;
  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from raw_documents rd where ${where}`;
  const itens = await sql<LinhaDocumento[]>`
    select rd.id, rd.titulo, rd.url, rd.status, rd.erro, rd.publicado_em, rd.coletado_em, s.nome as fonte,
           (select count(*)::int from extractions e where e.raw_document_id = rd.id) as extracoes,
           coalesce(length(rd.conteudo_texto), 0)::int as tamanho
    from raw_documents rd left join sources s on s.id = rd.source_id
    where ${where} order by rd.coletado_em desc
    limit ${f.porPagina} offset ${(f.pagina - 1) * f.porPagina}`;
  const porStatus = await sql<{ status: string; n: number }[]>`select status, count(*)::int as n from raw_documents group by status`;
  return { itens, total, porStatus };
}

export async function documentoDetalhe(id: string) {
  const [d] = await sql<{
    id: string; titulo: string | null; url: string; hash: string; storage_path: string | null; mime: string | null; conteudo_texto: string | null;
    publicado_em: string | null; coletado_em: Date; metadata: unknown; status: string; erro: string | null; fonte: string | null; fonte_id: string | null;
  }[]>`
    select rd.id, rd.titulo, rd.url, rd.hash, rd.storage_path, rd.mime, rd.conteudo_texto, rd.publicado_em, rd.coletado_em, rd.metadata,
           rd.status, rd.erro, s.nome as fonte, s.id as fonte_id
    from raw_documents rd left join sources s on s.id = rd.source_id where rd.id = ${id}`;
  if (!d) return null;
  const [extracoes, atos] = await Promise.all([
    sql<{ id: string; status: string; confianca: number; modelo: string; created_at: Date; orgao: string | null }[]>`
      select id, status, confianca::float8 as confianca, modelo, created_at, campos_json->>'orgao' as orgao
      from extractions where raw_document_id = ${id} order by created_at desc`,
    sql<{ id: string; tipo: string; contest_id: string | null; contest_titulo: string | null; confianca: number | null }[]>`
      select a.id, a.tipo, a.contest_id, c.titulo as contest_titulo, a.confianca::float8 as confianca
      from acts a left join contests c on c.id = a.contest_id where a.raw_document_id = ${id} order by a.created_at desc`,
  ]);
  return { ...d, extracoes, atos };
}

// ---------------------------------------------------------------- Fontes

export interface LinhaFonte {
  id: string;
  slug: string;
  nome: string;
  tipo: string;
  url: string | null;
  ativo: boolean;
  frequencia_min: number;
  ultimo: { status: string; iniciado_em: string; docs_novos: number; erro: string | null } | null;
  erros_7d: number;
  runs_7d: number;
  docs_7d: number;
}

export async function listarFontes() {
  return sql<LinhaFonte[]>`
    select s.id, s.slug, s.nome, s.tipo, s.url, s.ativo, s.frequencia_min,
      (select json_build_object('status', r.status, 'iniciado_em', r.iniciado_em, 'docs_novos', r.docs_novos, 'erro', r.erro)
         from source_runs r where r.source_id = s.id order by r.iniciado_em desc limit 1) as ultimo,
      (select count(*)::int from source_runs r where r.source_id = s.id and r.status = 'erro' and r.iniciado_em > now() - interval '7 days') as erros_7d,
      (select count(*)::int from source_runs r where r.source_id = s.id and r.iniciado_em > now() - interval '7 days') as runs_7d,
      (select coalesce(sum(r.docs_novos), 0)::int from source_runs r where r.source_id = s.id and r.iniciado_em > now() - interval '7 days') as docs_7d
    from sources s order by s.ativo desc, s.tipo, s.nome`;
}

export async function fonteDetalhe(id: string, f: { soErros: boolean; pagina: number; porPagina: number }) {
  const [fonte] = await sql<{ id: string; slug: string; nome: string; tipo: string; url: string | null; ativo: boolean; frequencia_min: number; config: unknown; ultimo_hash: string | null; created_at: Date }[]>`
    select id, slug, nome, tipo, url, ativo, frequencia_min, config, ultimo_hash, created_at from sources where id = ${id}`;
  if (!fonte) return null;
  const where = sql`source_id = ${id} ${f.soErros ? sql`and status = 'erro'` : sql``}`;
  const [[{ total }], runs] = await Promise.all([
    sql<{ total: number }[]>`select count(*)::int as total from source_runs where ${where}`,
    sql<{ id: string; iniciado_em: Date; terminado_em: Date | null; status: string; docs_encontrados: number; docs_novos: number; erro: string | null }[]>`
      select id, iniciado_em, terminado_em, status, docs_encontrados, docs_novos, erro from source_runs where ${where}
      order by iniciado_em desc limit ${f.porPagina} offset ${(f.pagina - 1) * f.porPagina}`,
  ]);
  return { fonte, runs, total };
}

export async function todasFontes() {
  return sql<{ id: string; nome: string }[]>`select id, nome from sources order by nome`;
}

// ---------------------------------------------------------------- Matérias

export interface LinhaMateria {
  id: string;
  nome: string;
  slug: string;
  sinonimos: string[];
  concursos: number;
  usos: number;
}

export async function listarMaterias(q?: string) {
  return sql<LinhaMateria[]>`
    select s.id, s.nome, s.slug, s.sinonimos,
           count(distinct cs.contest_id)::int as concursos, count(cs.id)::int as usos
    from subjects s left join contest_subjects cs on cs.subject_id = s.id
    ${q ? sql`where (s.nome || ' ' || array_to_string(s.sinonimos, ' ')) ilike ${like(q)}` : sql``}
    group by s.id order by s.nome`;
}
