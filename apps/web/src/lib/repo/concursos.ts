import "server-only";
import { sql } from "@/lib/db";
import { STATUS_RADAR } from "@aviso/shared";
import type {
  CargoDTO, ConcursoDetalheDTO, ConcursoResumoDTO, DataDTO, Paginado, VersaoDTO,
} from "@aviso/shared";

/** Colunas do resumo + próxima data futura + se o usuário acompanha. */
function selectResumo(userId: string | null) {
  return sql`
    c.id, c.slug, c.titulo, c.orgao, c.orgao_sigla, c.esfera, c.uf, c.cidade, c.banca, c.status,
    c.vagas_total, c.cadastro_reserva, c.salario_max_centavos, c.escolaridades, c.areas, c.url_oficial,
    c.publicado_em, c.exemplo,
    (select json_build_object('tipo', d.tipo, 'data', coalesce(d.fim, d.inicio))
       from contest_dates d where d.contest_id = c.id and coalesce(d.fim, d.inicio) >= (now() at time zone 'America/Sao_Paulo')::date
       order by coalesce(d.fim, d.inicio) limit 1) as proxima_data,
    ${userId ? sql`exists(select 1 from follows f where f.contest_id = c.id and f.user_id = ${userId})` : sql`false`} as acompanhando`;
}

export interface FiltrosBusca {
  q?: string;
  uf?: string;
  escolaridade?: string;
  area?: string;
  banca?: string;
  status?: string;
  esfera?: string;
  salarioMin?: number;
  /** só previstos/autorizados/banca definida (o radar). */
  radar?: boolean;
  /** inclui os status do radar na busca geral. Padrão false: no app o radar é do plano Aprovado. */
  incluirRadar?: boolean;
  abertos?: boolean;
  /** false = esconde concursos de exemplo (seed). Sem valor, não filtra. */
  exemplos?: boolean;
  pagina?: number;
  porPagina?: number;
  ordem?: "recentes" | "salario" | "vagas" | "prazo";
}

/** Escapa % e _ para o ILIKE tratar o texto digitado literalmente. */
function escaparLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => "\\" + m);
}

export async function buscarConcursos(f: FiltrosBusca, userId: string | null = null): Promise<Paginado<ConcursoResumoDTO>> {
  const pagina = Math.max(1, f.pagina ?? 1);
  const porPagina = Math.min(50, Math.max(1, f.porPagina ?? 20));
  const where = sql`
    c.publicado
    ${f.q ? sql`and (c.orgao || ' ' || c.titulo || ' ' || coalesce(c.resumo, '') || ' ' || coalesce(c.orgao_sigla, '')) ilike ${"%" + escaparLike(f.q) + "%"}` : sql``}
    ${f.uf ? sql`and (c.uf = ${f.uf} or (c.esfera = 'federal' and c.uf is null))` : sql``}
    ${f.escolaridade ? sql`and ${f.escolaridade} = any(c.escolaridades)` : sql``}
    ${f.area ? sql`and ${f.area} = any(c.areas)` : sql``}
    ${f.banca ? sql`and lower(c.banca) = lower(${f.banca})` : sql``}
    ${f.status ? sql`and c.status = ${f.status}` : sql``}
    ${f.esfera ? sql`and c.esfera = ${f.esfera}` : sql``}
    ${f.salarioMin ? sql`and coalesce(c.salario_max_centavos, 0) >= ${f.salarioMin}` : sql``}
    ${f.radar ? sql`and c.status = any(${STATUS_RADAR}::text[])` : f.incluirRadar ? sql`` : sql`and not (c.status = any(${STATUS_RADAR}::text[]))`}
    ${f.abertos ? sql`and c.status = 'edital_aberto'` : sql``}
    ${f.exemplos === false ? sql`and not c.exemplo` : sql``}`;
  const ordem =
    f.ordem === "salario" ? sql`c.salario_max_centavos desc nulls last`
    : f.ordem === "vagas" ? sql`c.vagas_total desc nulls last`
    : f.ordem === "prazo" ? sql`(select min(coalesce(d.fim,d.inicio)) from contest_dates d where d.contest_id = c.id and coalesce(d.fim,d.inicio) >= current_date) asc nulls last`
    : sql`coalesce(c.publicado_em, c.created_at::date) desc, c.created_at desc`;
  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from contests c where ${where}`;
  const itens = await sql<ConcursoResumoDTO[]>`
    select ${selectResumo(userId)} from contests c where ${where}
    order by ${ordem} limit ${porPagina} offset ${(pagina - 1) * porPagina}`;
  return { itens, total, pagina, porPagina };
}

export async function resumosPorIds(ids: string[], userId: string | null): Promise<ConcursoResumoDTO[]> {
  if (!ids.length) return [];
  return sql<ConcursoResumoDTO[]>`select ${selectResumo(userId)} from contests c where c.id = any(${ids}::uuid[]) and c.publicado`;
}

export async function datasDoConcurso(contestIds: string[]): Promise<(DataDTO & { contest_id: string })[]> {
  if (!contestIds.length) return [];
  return sql`
    select id, contest_id, tipo, inicio, fim, descricao, fonte_item, fonte_pagina
    from contest_dates where contest_id = any(${contestIds}::uuid[])
    order by coalesce(inicio, fim), tipo`;
}

/** Detalhe por id ou slug. */
export async function concursoDetalhe(idOuSlug: string, userId: string | null): Promise<ConcursoDetalheDTO | null> {
  const ehUuid = /^[0-9a-f-]{36}$/i.test(idOuSlug);
  const [c] = await sql<(ConcursoResumoDTO & { resumo: string | null; numero_edital: string | null; taxa_centavos: number | null; tem_edital_texto: boolean })[]>`
    select ${selectResumo(userId)}, c.resumo, c.numero_edital, c.taxa_centavos, (c.edital_texto is not null) as tem_edital_texto
    from contests c where ${ehUuid ? sql`c.id = ${idOuSlug}` : sql`c.slug = ${idOuSlug}`} and c.publicado`;
  if (!c) return null;
  const [cargos, datas, materias, versoes] = await Promise.all([
    sql<CargoDTO[]>`select id, nome, escolaridade, area, vagas, cadastro_reserva, salario_centavos, jornada, requisitos
                    from contest_roles where contest_id = ${c.id} order by salario_centavos desc nulls last, nome`,
    datasDoConcurso([c.id]),
    sql<ConcursoDetalheDTO["materias"]>`
      select s.id as subject_id, s.nome, cs.questoes, cs.role_id
      from contest_subjects cs join subjects s on s.id = cs.subject_id
      where cs.contest_id = ${c.id} order by cs.questoes desc nulls last, s.nome`,
    sql<VersaoDTO[]>`select versao, resumo, diff_json as diff, created_at from contest_versions
                     where contest_id = ${c.id} order by versao desc`,
  ]);
  const { acompanhamentoDe } = await import("./acompanhamento");
  return {
    ...c,
    cargos,
    datas: datas.map(({ contest_id: _c, ...d }) => d),
    materias,
    versoes,
    acompanhamento: userId ? await acompanhamentoDe(userId, c.id) : null,
  };
}
