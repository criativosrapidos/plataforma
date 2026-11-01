import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirUsuario, lerJson, ok, rota } from "@/lib/api";

const Schema = z.object({
  expo_push_token: z.string().regex(/^(Expo(nent)?PushToken\[.+\]|[A-Za-z0-9_:\-]{20,})$/, "Token inválido"),
  plataforma: z.enum(["ios", "android", "web"]),
});

/** Registra o token de push do aparelho (chamado depois do 1º concurso salvo). */
export const POST = rota(async (req: Request) => {
  const s = await exigirUsuario();
  const d = await lerJson(req, Schema);
  await sql`
    insert into devices (user_id, expo_push_token, plataforma) values (${s.id}, ${d.expo_push_token}, ${d.plataforma})
    on conflict (expo_push_token) do update set user_id = excluded.user_id, plataforma = excluded.plataforma, ativo = true, last_seen_at = now()`;
  return ok({ ok: true }, 201);
});

export const DELETE = rota(async (req: Request) => {
  const s = await exigirUsuario();
  const { expo_push_token } = await lerJson(req, z.object({ expo_push_token: z.string() }));
  await sql`update devices set ativo = false where user_id = ${s.id} and expo_push_token = ${expo_push_token}`;
  return ok({ ok: true });
});
