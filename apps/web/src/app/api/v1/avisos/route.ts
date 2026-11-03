import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirUsuario, lerJson, ok, rota } from "@/lib/api";
import { avisosRecentes } from "@/lib/repo/agenda";

export const GET = rota(async (req: Request) => {
  const s = await exigirUsuario();
  const n = Number(new URL(req.url).searchParams.get("limite") ?? 50);
  const limite = Number.isFinite(n) ? Math.min(100, Math.max(1, Math.trunc(n))) : 50;
  return ok(await avisosRecentes(s.id, limite));
});

/** Marca como lidos: { ids: [...] } ou { todos: true } */
export const POST = rota(async (req: Request) => {
  const s = await exigirUsuario();
  const d = await lerJson(req, z.object({ ids: z.array(z.string().uuid()).optional(), todos: z.boolean().optional() }));
  if (d.todos) await sql`update alerts set lido_em = now() where user_id = ${s.id} and lido_em is null`;
  else if (d.ids?.length) await sql`update alerts set lido_em = now() where user_id = ${s.id} and id = any(${d.ids}::uuid[]) and lido_em is null`;
  return ok({ ok: true });
});
