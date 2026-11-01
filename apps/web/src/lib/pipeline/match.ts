import "server-only";
import { sql } from "@/lib/db";
import { calcularAcesso, casarPerfil, type AssinaturaLike, type ConcursoParaMatch, type PerfilBusca } from "@aviso/shared";

/**
 * Casamento perfil × concurso: quem tem perfil ativo que casa e acesso liberado (teste ou assinatura em dia).
 * O filtro de acesso é repetido no despacho (canaisPermitidos), por segurança.
 */

export async function concursoParaMatch(contestId: string): Promise<(ConcursoParaMatch & { id: string }) | null> {
  const [c] = await sql<(ConcursoParaMatch & { id: string })[]>`
    select c.id, c.orgao, c.esfera, c.uf, c.banca, c.escolaridades, c.areas, c.salario_max_centavos, c.titulo, c.resumo,
      coalesce((select json_agg(json_build_object('nome', r.nome, 'escolaridade', r.escolaridade, 'salario_centavos', r.salario_centavos))
                from contest_roles r where r.contest_id = c.id), '[]') as cargos
    from contests c where c.id = ${contestId}`;
  return c ?? null;
}

/** Ids das pessoas com perfil ativo que casa com o concurso e acesso liberado. */
export async function usuariosQueCasam(contestId: string, agora: Date = new Date()): Promise<{ userId: string; motivos: string[] }[]> {
  const c = await concursoParaMatch(contestId);
  if (!c) return [];
  // Pré-filtro barato no banco (UF/escolaridade); a regra completa é casarPerfil.
  const perfis = await sql<(PerfilBusca & { user_id: string })[]>`
    select p.user_id, p.escolaridades, p.areas, p.cargos, p.ufs, p.incluir_nacional, p.salario_min_centavos, p.bancas, p.palavras_chave, p.ativo
    from profiles p join users u on u.id = p.user_id
    where p.ativo and u.deleted_at is null
      and (cardinality(p.ufs) = 0 or ${c.uf}::text = any(p.ufs) or (${c.esfera} = 'federal' and ${c.uf}::text is null and p.incluir_nacional))`;
  const porUsuario = new Map<string, string[]>();
  for (const p of perfis) {
    if (porUsuario.has(p.user_id)) continue;
    const m = casarPerfil(p, c);
    if (m.casa) porUsuario.set(p.user_id, m.motivos);
  }
  if (!porUsuario.size) return [];
  const subs = await sql<(AssinaturaLike & { user_id: string })[]>`
    select distinct on (user_id) user_id, plano, status, trial_ends_at, current_period_end
    from subscriptions where user_id = any(${[...porUsuario.keys()]}::uuid[])
    order by user_id, (status in ('trial','ativa','inadimplente')) desc, created_at desc`;
  const acesso = new Map(subs.map((s) => [s.user_id, calcularAcesso(s, agora)]));
  return [...porUsuario.entries()].filter(([id]) => acesso.get(id)?.liberado).map(([userId, motivos]) => ({ userId, motivos }));
}

/** Quem acompanha o concurso (agenda). */
export async function seguidores(contestId: string): Promise<string[]> {
  const r = await sql<{ user_id: string }[]>`
    select f.user_id from follows f join users u on u.id = f.user_id where f.contest_id = ${contestId} and u.deleted_at is null`;
  return r.map((x) => x.user_id);
}
