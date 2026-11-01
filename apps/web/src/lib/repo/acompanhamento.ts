import "server-only";
import { sql } from "@/lib/db";
import { CHECKLIST_PADRAO, CONTEST_COLORS, type AcompanhamentoDTO, type AcompanhandoItemDTO } from "@aviso/shared";
import { datasDoConcurso, resumosPorIds } from "./concursos";

export async function acompanhamentoDe(userId: string, contestId: string): Promise<AcompanhamentoDTO | null> {
  const [f] = await sql<AcompanhamentoDTO[]>`
    select f.id, f.contest_id, f.cor, f.role_id, f.nas_materias, f.created_at,
      coalesce((select json_agg(json_build_object('id', i.id, 'texto', i.texto, 'feito', i.feito, 'ordem', i.ordem) order by i.ordem, i.created_at)
                from checklist_items i where i.follow_id = f.id), '[]') as checklist
    from follows f where f.user_id = ${userId} and f.contest_id = ${contestId}`;
  return f ?? null;
}

/** Acompanhar: escolhe a próxima cor livre e cria o checklist padrão. Idempotente. */
export async function acompanhar(userId: string, contestId: string, roleId?: string | null): Promise<AcompanhamentoDTO> {
  const existente = await acompanhamentoDe(userId, contestId);
  if (existente) return existente;
  await sql.begin(async (tx) => {
    const usadas = (await tx<{ cor: string }[]>`select cor from follows where user_id = ${userId}`).map((r) => r.cor);
    const cor = CONTEST_COLORS.find((c) => !usadas.includes(c)) ?? CONTEST_COLORS[usadas.length % CONTEST_COLORS.length];
    const [f] = await tx<{ id: string }[]>`
      insert into follows (user_id, contest_id, role_id, cor) values (${userId}, ${contestId}, ${roleId ?? null}, ${cor})
      on conflict (user_id, contest_id) do nothing returning id`;
    if (f) {
      const itens = CHECKLIST_PADRAO.map((texto, ordem) => ({ follow_id: f.id, texto, ordem }));
      await tx`insert into checklist_items ${tx(itens, "follow_id", "texto", "ordem")}`;
    }
  });
  return (await acompanhamentoDe(userId, contestId))!;
}

export async function deixarDeAcompanhar(userId: string, contestId: string) {
  await sql`delete from follows where user_id = ${userId} and contest_id = ${contestId}`;
}

export async function atualizarAcompanhamento(
  userId: string,
  contestId: string,
  d: { cor?: string; role_id?: string | null; nas_materias?: boolean },
) {
  await sql`
    update follows set
      cor = coalesce(${d.cor ?? null}, cor),
      role_id = ${d.role_id === undefined ? sql`role_id` : d.role_id},
      nas_materias = coalesce(${d.nas_materias ?? null}, nas_materias)
    where user_id = ${userId} and contest_id = ${contestId}`;
  return acompanhamentoDe(userId, contestId);
}

export async function listarAcompanhando(userId: string): Promise<AcompanhandoItemDTO[]> {
  const follows = await sql<AcompanhamentoDTO[]>`
    select f.id, f.contest_id, f.cor, f.role_id, f.nas_materias, f.created_at,
      coalesce((select json_agg(json_build_object('id', i.id, 'texto', i.texto, 'feito', i.feito, 'ordem', i.ordem) order by i.ordem, i.created_at)
                from checklist_items i where i.follow_id = f.id), '[]') as checklist
    from follows f join contests c on c.id = f.contest_id
    where f.user_id = ${userId} order by f.created_at`;
  const ids = follows.map((f) => f.contest_id);
  const [resumos, datas] = await Promise.all([resumosPorIds(ids, userId), datasDoConcurso(ids)]);
  return follows.flatMap((f) => {
    const concurso = resumos.find((r) => r.id === f.contest_id);
    if (!concurso) return [];
    return [{ ...f, concurso, datas: datas.filter((d) => d.contest_id === f.contest_id).map(({ contest_id: _c, ...d }) => d) }];
  });
}

/** Garante que o item de checklist pertence ao usuário. */
async function followDoItem(userId: string, itemId: string) {
  const [r] = await sql<{ follow_id: string }[]>`
    select i.follow_id from checklist_items i join follows f on f.id = i.follow_id
    where i.id = ${itemId} and f.user_id = ${userId}`;
  return r?.follow_id ?? null;
}

export async function adicionarItemChecklist(userId: string, contestId: string, texto: string) {
  const [f] = await sql<{ id: string }[]>`select id from follows where user_id = ${userId} and contest_id = ${contestId}`;
  if (!f) return null;
  const [i] = await sql`
    insert into checklist_items (follow_id, texto, ordem)
    values (${f.id}, ${texto}, (select coalesce(max(ordem), -1) + 1 from checklist_items where follow_id = ${f.id}))
    returning id, texto, feito, ordem`;
  return i;
}

export async function atualizarItemChecklist(userId: string, itemId: string, d: { feito?: boolean; texto?: string }) {
  if (!(await followDoItem(userId, itemId))) return null;
  const [i] = await sql`
    update checklist_items set feito = coalesce(${d.feito ?? null}, feito), texto = coalesce(${d.texto ?? null}, texto)
    where id = ${itemId} returning id, texto, feito, ordem`;
  return i;
}

export async function removerItemChecklist(userId: string, itemId: string) {
  if (!(await followDoItem(userId, itemId))) return false;
  await sql`delete from checklist_items where id = ${itemId}`;
  return true;
}
