import { sql } from "@/lib/db";
import { exigirUsuario, ok, rota } from "@/lib/api";

interface SessaoDTO {
  id: string;
  cliente: "web" | "app";
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  atual: boolean;
}

/** Sessões abertas (não revogadas e não expiradas) de quem está logado. */
export const GET = rota(async () => {
  const s = await exigirUsuario();
  const sessoes = await sql<SessaoDTO[]>`
    select id, cliente, user_agent, created_at, expires_at, (id = ${s.sessaoId}) as atual
    from sessions where user_id = ${s.id} and revoked_at is null and expires_at > now()
    order by (id = ${s.sessaoId}) desc, created_at desc`;
  return ok(sessoes);
});

/** Encerra todas as outras sessões (mantém a atual). */
export const DELETE = rota(async () => {
  const s = await exigirUsuario();
  const r = await sql`
    update sessions set revoked_at = now()
    where user_id = ${s.id} and id <> ${s.sessaoId} and revoked_at is null returning id`;
  await sql`insert into audit_log (actor_id, acao, entidade, entidade_id, dados)
            values (${s.id}, 'sessoes_encerradas', 'user', ${s.id}, ${sql.json({ quantidade: r.length })})`;
  return ok({ ok: true, encerradas: r.length });
});
