import { z } from "zod";
import { exigirAcesso, lerJson, naoEncontrado, ok, rota } from "@/lib/api";
import { adicionarItemChecklist } from "@/lib/repo/acompanhamento";

type Ctx = { params: Promise<{ id: string }> };

export const POST = rota(async (req: Request, ctx: Ctx) => {
  const { usuario } = await exigirAcesso();
  const { texto } = await lerJson(req, z.object({ texto: z.string().trim().min(1).max(140) }));
  const i = await adicionarItemChecklist(usuario.id, (await ctx.params).id, texto);
  if (!i) throw naoEncontrado("Acompanhe o concurso para usar o checklist.");
  return ok(i, 201);
});
