import "server-only";
import { sql } from "@/lib/db";
import type { AjustesDTO, UsuarioDTO } from "@aviso/shared";

export async function usuarioPorId(id: string): Promise<UsuarioDTO | null> {
  const [u] = await sql<UsuarioDTO[]>`
    select id, nome, email::text as email, role, telefone, whatsapp_optin, busca_nominal_optin, nome_busca
    from users where id = ${id} and deleted_at is null`;
  return u ?? null;
}

export async function ajustesDoUsuario(userId: string): Promise<AjustesDTO> {
  const [a] = await sql<AjustesDTO[]>`
    insert into user_settings (user_id) values (${userId})
    on conflict (user_id) do update set user_id = excluded.user_id
    returning push_on, whatsapp_on, email_resumo, antecedencia_dias,
              to_char(silencio_inicio, 'HH24:MI') as silencio_inicio, to_char(silencio_fim, 'HH24:MI') as silencio_fim`;
  return a;
}

export async function atualizarAjustes(userId: string, a: Partial<AjustesDTO>) {
  await ajustesDoUsuario(userId);
  await sql`
    update user_settings set
      push_on = coalesce(${a.push_on ?? null}, push_on),
      whatsapp_on = coalesce(${a.whatsapp_on ?? null}, whatsapp_on),
      email_resumo = coalesce(${a.email_resumo ?? null}, email_resumo),
      antecedencia_dias = coalesce(${a.antecedencia_dias ?? null}, antecedencia_dias),
      silencio_inicio = ${a.silencio_inicio === undefined ? sql`silencio_inicio` : sql`${a.silencio_inicio}::time`},
      silencio_fim = ${a.silencio_fim === undefined ? sql`silencio_fim` : sql`${a.silencio_fim}::time`},
      updated_at = now()
    where user_id = ${userId}`;
  return ajustesDoUsuario(userId);
}

export async function usoDoMes(userId: string) {
  const [r] = await sql<{ whatsapp: number; perguntas: number }[]>`
    select
      (select count(*)::int from alerts where user_id = ${userId} and canal = 'whatsapp' and status = 'enviado'
         and enviado_em >= date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') as whatsapp,
      (select count(*)::int from questions where user_id = ${userId}
         and created_at >= date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') as perguntas`;
  return r;
}
