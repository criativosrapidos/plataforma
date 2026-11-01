import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirAcesso, lerJson, naoEncontrado, ok, rota } from "@/lib/api";
import { acompanhar, atualizarAcompanhamento, deixarDeAcompanhar } from "@/lib/repo/acompanhamento";
import { CONTEST_COLORS } from "@aviso/shared";

type Ctx = { params: Promise<{ id: string }> };

async function contestId(idOuSlug: string) {
  const [c] = await sql<{ id: string }[]>`select id from contests where (id::text = ${idOuSlug} or slug = ${idOuSlug}) and publicado`;
  if (!c) throw naoEncontrado("Concurso não encontrado.");
  return c.id;
}

export const POST = rota(async (req: Request, ctx: Ctx) => {
  const { usuario } = await exigirAcesso();
  const corpo = await req.json().catch(() => ({}));
  const roleId = z.object({ role_id: z.string().uuid().nullable().optional() }).parse(corpo).role_id;
  return ok(await acompanhar(usuario.id, await contestId((await ctx.params).id), roleId), 201);
});

const Patch = z.object({
  cor: z.enum(CONTEST_COLORS).optional(),
  role_id: z.string().uuid().nullable().optional(),
  nas_materias: z.boolean().optional(),
});

export const PATCH = rota(async (req: Request, ctx: Ctx) => {
  const { usuario } = await exigirAcesso();
  const f = await atualizarAcompanhamento(usuario.id, await contestId((await ctx.params).id), await lerJson(req, Patch));
  if (!f) throw naoEncontrado("Você não acompanha este concurso.");
  return ok(f);
});

export const DELETE = rota(async (_req: Request, ctx: Ctx) => {
  const { usuario } = await exigirAcesso();
  await deixarDeAcompanhar(usuario.id, await contestId((await ctx.params).id));
  return ok({ ok: true });
});
