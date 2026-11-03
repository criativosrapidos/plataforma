import "server-only";
import { sql } from "@/lib/db";
import { casarPerfil, STATUS_RADAR, type ConcursoResumoDTO, type PerfilDTO } from "@aviso/shared";
import { resumosPorIds } from "./concursos";

export async function listarPerfis(userId: string): Promise<PerfilDTO[]> {
  return sql<PerfilDTO[]>`
    select id, nome, escolaridades, areas, cargos, ufs, incluir_nacional, salario_min_centavos, bancas, palavras_chave, ativo
    from profiles where user_id = ${userId} order by created_at`;
}

export type PerfilInput = Omit<PerfilDTO, "id">;

export async function criarPerfil(userId: string, p: PerfilInput): Promise<PerfilDTO> {
  const [r] = await sql<PerfilDTO[]>`
    insert into profiles (user_id, nome, escolaridades, areas, cargos, ufs, incluir_nacional, salario_min_centavos, bancas, palavras_chave, ativo)
    values (${userId}, ${p.nome}, ${p.escolaridades}, ${p.areas}, ${p.cargos}, ${p.ufs}, ${p.incluir_nacional},
            ${p.salario_min_centavos}, ${p.bancas}, ${p.palavras_chave}, ${p.ativo})
    returning id, nome, escolaridades, areas, cargos, ufs, incluir_nacional, salario_min_centavos, bancas, palavras_chave, ativo`;
  return r;
}

export async function atualizarPerfil(userId: string, id: string, p: PerfilInput): Promise<PerfilDTO | null> {
  const [r] = await sql<PerfilDTO[]>`
    update profiles set nome = ${p.nome}, escolaridades = ${p.escolaridades}, areas = ${p.areas}, cargos = ${p.cargos},
      ufs = ${p.ufs}, incluir_nacional = ${p.incluir_nacional}, salario_min_centavos = ${p.salario_min_centavos},
      bancas = ${p.bancas}, palavras_chave = ${p.palavras_chave}, ativo = ${p.ativo}, updated_at = now()
    where id = ${id} and user_id = ${userId}
    returning id, nome, escolaridades, areas, cargos, ufs, incluir_nacional, salario_min_centavos, bancas, palavras_chave, ativo`;
  return r ?? null;
}

export async function removerPerfil(userId: string, id: string) {
  await sql`delete from profiles where id = ${id} and user_id = ${userId}`;
}

/** Dados de um concurso no formato do casamento perfil × concurso. */
export async function concursosParaMatch(contestIds?: string[]) {
  return sql<(Parameters<typeof casarPerfil>[1] & { id: string; status: string })[]>`
    select c.id, c.orgao, c.esfera, c.uf, c.banca, c.escolaridades, c.areas, c.salario_max_centavos, c.titulo, c.resumo, c.status,
      coalesce((select json_agg(json_build_object('nome', r.nome, 'escolaridade', r.escolaridade, 'salario_centavos', r.salario_centavos))
                from contest_roles r where r.contest_id = c.id), '[]') as cargos
    from contests c where c.publicado ${contestIds ? sql`and c.id = any(${contestIds}::uuid[])` : sql``}`;
}

/** Concursos abertos/recentes que casam com algum perfil ativo do usuário e que ele ainda não acompanha. */
export async function novidadesParaUsuario(userId: string, limite = 10, comRadar = false): Promise<ConcursoResumoDTO[]> {
  const perfis = (await listarPerfis(userId)).filter((p) => p.ativo);
  if (!perfis.length) return [];
  const candidatos = await sql<{ id: string }[]>`
    select c.id from contests c
    where c.publicado and c.status = any(${comRadar ? ["edital_aberto", ...STATUS_RADAR] : ["edital_aberto"]}::text[])
      and not exists (select 1 from follows f where f.contest_id = c.id and f.user_id = ${userId})
    order by coalesce(c.publicado_em, c.created_at::date) desc limit 200`;
  const dados = await concursosParaMatch(candidatos.map((c) => c.id));
  const ids = dados.filter((c) => perfis.some((p) => casarPerfil(p, c).casa)).map((c) => c.id).slice(0, limite);
  const resumos = await resumosPorIds(ids, userId);
  return ids.map((id) => resumos.find((r) => r.id === id)!).filter(Boolean);
}
