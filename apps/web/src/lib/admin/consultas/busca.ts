import "server-only";
import { sql } from "@/lib/db";

/** Escapa curingas do ILIKE. */
export const like = (q: string) => `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;

export interface ResultadoBusca {
  concursos: { id: string; titulo: string; orgao: string; status: string; uf: string | null; publicado: boolean; exemplo: boolean }[];
  usuarios: { id: string; nome: string; email: string; role: string }[];
}

export async function buscaGlobal(q: string, incluirUsuarios: boolean, limite = 6): Promise<ResultadoBusca> {
  const t = q.trim();
  if (t.length < 2) return { concursos: [], usuarios: [] };
  const termo = like(t);
  const [concursos, usuarios] = await Promise.all([
    sql<ResultadoBusca["concursos"]>`
      select id, titulo, orgao, status, uf, publicado, exemplo from contests
      where (orgao || ' ' || titulo || ' ' || coalesce(orgao_sigla, '') || ' ' || coalesce(numero_edital, '') || ' ' || coalesce(banca, '')) ilike ${termo}
      order by publicado desc, updated_at desc limit ${limite}`,
    incluirUsuarios
      ? sql<ResultadoBusca["usuarios"]>`
          select id, nome, email::text as email, role from users
          where deleted_at is null and (nome ilike ${termo} or email::text ilike ${termo} or coalesce(telefone, '') ilike ${termo})
          order by created_at desc limit ${limite}`
      : Promise.resolve([] as ResultadoBusca["usuarios"]),
  ]);
  return { concursos, usuarios };
}

export async function tamanhoFila(): Promise<number> {
  const [r] = await sql<{ n: number }[]>`select count(*)::int as n from extractions where status = 'pendente'`;
  return r.n;
}
