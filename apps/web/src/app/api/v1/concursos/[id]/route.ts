import { naoEncontrado, ok, rota } from "@/lib/api";
import { sessaoAtual } from "@/lib/auth/session";
import { concursoDetalhe } from "@/lib/repo/concursos";

type Ctx = { params: Promise<{ id: string }> };

export const GET = rota(async (_req: Request, ctx: Ctx) => {
  const s = await sessaoAtual();
  const c = await concursoDetalhe((await ctx.params).id, s?.id ?? null);
  if (!c) throw naoEncontrado("Concurso não encontrado.");
  return ok(c);
});
