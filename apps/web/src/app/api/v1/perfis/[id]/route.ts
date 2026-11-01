import { exigirUsuario, lerJson, naoEncontrado, ok, rota } from "@/lib/api";
import { atualizarPerfil, removerPerfil } from "@/lib/repo/perfis";
import { PerfilSchema } from "../schema";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = rota(async (req: Request, ctx: Ctx) => {
  const s = await exigirUsuario();
  const { id } = await ctx.params;
  const p = await atualizarPerfil(s.id, id, await lerJson(req, PerfilSchema));
  if (!p) throw naoEncontrado("Perfil não encontrado.");
  return ok(p);
});

export const DELETE = rota(async (_req: Request, ctx: Ctx) => {
  const s = await exigirUsuario();
  await removerPerfil(s.id, (await ctx.params).id);
  return ok({ ok: true });
});
