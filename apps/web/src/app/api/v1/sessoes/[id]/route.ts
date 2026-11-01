import { sql } from "@/lib/db";
import { encerrarSessao } from "@/lib/auth/session";
import { exigirUsuario, naoEncontrado, ok, rota } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Encerra uma sessão da própria pessoa. Se for a atual, também apaga o cookie. */
export const DELETE = rota(async (_req: Request, ctx: Ctx) => {
  const s = await exigirUsuario();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw naoEncontrado("Sessão não encontrada.");
  if (id === s.sessaoId) {
    await encerrarSessao(id);
    return ok({ ok: true, atual: true });
  }
  const [r] = await sql`
    update sessions set revoked_at = now()
    where id = ${id} and user_id = ${s.id} and revoked_at is null returning id`;
  if (!r) throw naoEncontrado("Sessão não encontrada.");
  return ok({ ok: true, atual: false });
});
