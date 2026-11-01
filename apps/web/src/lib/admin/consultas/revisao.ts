import "server-only";
import { sql } from "@/lib/db";

export interface ItemFila {
  id: string;
  created_at: Date;
  confianca: number;
  motivo_revisao: string | null;
  modelo: string;
  status: string;
  orgao: string | null;
  titulo: string | null;
  tipo_ato: string | null;
  fonte: string | null;
  doc_titulo: string | null;
  contest_id: string | null;
  contest_titulo: string | null;
  revisor: string | null;
  revisado_em: Date | null;
}

export async function listarFila(f: { status: "pendente" | "aprovada" | "rejeitada"; tipo?: string; fonte?: string; pagina: number; porPagina: number }) {
  const where = sql`
    e.status = ${f.status}
    ${f.tipo ? sql`and coalesce(e.campos_json->>'tipo_ato', a.tipo) = ${f.tipo}` : sql``}
    ${f.fonte ? sql`and rd.source_id = ${f.fonte}` : sql``}`;
  const ordem = f.status === "pendente" ? sql`e.created_at asc, e.id` : sql`e.revisado_em desc nulls last, e.created_at desc`;
  const [{ total }] = await sql<{ total: number }[]>`
    select count(*)::int as total from extractions e
    left join raw_documents rd on rd.id = e.raw_document_id left join acts a on a.id = e.act_id where ${where}`;
  const itens = await sql<ItemFila[]>`
    select e.id, e.created_at, e.confianca::float8 as confianca, e.motivo_revisao, e.modelo, e.status,
           e.campos_json->>'orgao' as orgao, e.campos_json->>'titulo' as titulo,
           coalesce(e.campos_json->>'tipo_ato', a.tipo) as tipo_ato,
           s.nome as fonte, rd.titulo as doc_titulo, e.contest_id, c.titulo as contest_titulo,
           u.nome as revisor, e.revisado_em
    from extractions e
    left join raw_documents rd on rd.id = e.raw_document_id
    left join sources s on s.id = rd.source_id
    left join acts a on a.id = e.act_id
    left join contests c on c.id = e.contest_id
    left join users u on u.id = e.revisado_por
    where ${where}
    order by ${ordem}
    limit ${f.porPagina} offset ${(f.pagina - 1) * f.porPagina}`;
  return { itens, total };
}

export async function fontesComExtracao() {
  return sql<{ id: string; nome: string }[]>`
    select distinct s.id, s.nome from extractions e join raw_documents rd on rd.id = e.raw_document_id
    join sources s on s.id = rd.source_id order by s.nome`;
}

export interface ExtracaoDetalhe {
  id: string;
  status: string;
  confianca: number;
  motivo_revisao: string | null;
  modelo: string;
  campos_json: unknown;
  created_at: Date;
  revisado_em: Date | null;
  revisor: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  custo_centavos: number | null;
  contest_id: string | null;
  contest_titulo: string | null;
  act_tipo: string | null;
  doc: {
    id: string;
    url: string;
    titulo: string | null;
    texto: string | null;
    publicado_em: string | null;
    coletado_em: Date;
    fonte: string | null;
    status: string;
  } | null;
}

export async function extracaoDetalhe(id: string): Promise<ExtracaoDetalhe | null> {
  const [e] = await sql<(Omit<ExtracaoDetalhe, "doc"> & { doc_id: string | null })[]>`
    select e.id, e.status, e.confianca::float8 as confianca, e.motivo_revisao, e.modelo, e.campos_json, e.created_at, e.revisado_em,
           u.nome as revisor, e.tokens_in, e.tokens_out, e.custo_centavos::float8 as custo_centavos,
           e.contest_id, c.titulo as contest_titulo, a.tipo as act_tipo, e.raw_document_id as doc_id
    from extractions e
    left join users u on u.id = e.revisado_por
    left join contests c on c.id = e.contest_id
    left join acts a on a.id = e.act_id
    where e.id = ${id}`;
  if (!e) return null;
  let doc: ExtracaoDetalhe["doc"] = null;
  if (e.doc_id) {
    const [d] = await sql<NonNullable<ExtracaoDetalhe["doc"]>[]>`
      select rd.id, rd.url, rd.titulo, rd.conteudo_texto as texto, rd.publicado_em, rd.coletado_em, s.nome as fonte, rd.status
      from raw_documents rd left join sources s on s.id = rd.source_id where rd.id = ${e.doc_id}`;
    doc = d ?? null;
  }
  const resto: Omit<typeof e, "doc_id"> & { doc_id?: string | null } = { ...e };
  delete resto.doc_id;
  return { ...resto, doc };
}

/** Vizinhos na fila (mais antigas primeiro) para J/K e "próxima" depois de aprovar/rejeitar. */
export async function vizinhosNaFila(id: string) {
  const [r] = await sql<{ anterior: string | null; proxima: string | null; posicao: number | null; total: number; primeira: string | null }[]>`
    with fila as (
      select id, row_number() over (order by created_at, id)::int as pos from extractions where status = 'pendente'
    ), atual as (select pos from fila where id = ${id})
    select (select f.id from fila f, atual where f.pos = atual.pos - 1) as anterior,
           (select f.id from fila f, atual where f.pos = atual.pos + 1) as proxima,
           (select pos from atual) as posicao,
           (select count(*)::int from fila) as total,
           (select f.id from fila f where f.id <> ${id} order by f.pos limit 1) as primeira`;
  return r;
}

export async function nomesMaterias() {
  const r = await sql<{ nome: string }[]>`select nome from subjects order by nome`;
  return r.map((x) => x.nome);
}
