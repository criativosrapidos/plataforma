import { z } from "zod";
import { exigirAcesso, lerJson, naoEncontrado, ok, rota } from "@/lib/api";
import { atualizarItemChecklist, removerItemChecklist } from "@/lib/repo/acompanhamento";

type Ctx = { params: Promise<{ itemId: string }> };

export const PATCH = rota(async (req: Request, ctx: Ctx) => {
  const { usuario } = await exigirAcesso();
  const d = await lerJson(req, z.object({ feito: z.boolean().optional(), texto: z.string().trim().min(1).max(140).optional() }));
  const i = await atualizarItemChecklist(usuario.id, (await ctx.params).itemId, d);
  if (!i) throw naoEncontrado("Item não encontrado.");
  return ok(i);
});

export const DELETE = rota(async (_req: Request, ctx: Ctx) => {
  const { usuario } = await exigirAcesso();
  if (!(await removerItemChecklist(usuario.id, (await ctx.params).itemId))) throw naoEncontrado("Item não encontrado.");
  return ok({ ok: true });
});
