import { z } from "zod";
import { sql } from "@/lib/db";
import { ErroApi, exigirAcesso, exigirUsuario, lerJson, naoEncontrado, ok, rota, semAcesso } from "@/lib/api";
import { acompanhar, atualizarAcompanhamento, deixarDeAcompanhar } from "@/lib/repo/acompanhamento";
import { CONTEST_COLORS, STATUS_RADAR, temRecurso, type ContestStatus } from "@aviso/shared";

type Ctx = { params: Promise<{ id: string }> };

/** Resolve id ou slug. Para seguir, o concurso precisa estar publicado; para deixar de seguir, não. */
async function concurso(idOuSlug: string, exigirPublicado: boolean) {
  const [c] = await sql<{ id: string; status: ContestStatus }[]>`
    select id, status from contests where (id::text = ${idOuSlug} or slug = ${idOuSlug}) ${exigirPublicado ? sql`and publicado` : sql``}`;
  if (!c) throw naoEncontrado("Concurso não encontrado.");
  return c;
}

/** O cargo de interesse precisa ser deste concurso. */
async function validarCargo(contestId: string, roleId: string | null | undefined) {
  if (!roleId) return;
  const [r] = await sql`select 1 from contest_roles where id = ${roleId} and contest_id = ${contestId}`;
  if (!r) throw new ErroApi(422, "invalido", "Cargo não pertence a este concurso.", { role_id: "Cargo inválido" });
}

export const POST = rota(async (req: Request, ctx: Ctx) => {
  const { usuario, acesso } = await exigirAcesso();
  const corpo = await req.json().catch(() => ({}));
  const roleId = z.object({ role_id: z.string().uuid().nullable().optional() }).parse(corpo).role_id;
  const c = await concurso((await ctx.params).id, true);
  if (STATUS_RADAR.includes(c.status) && !temRecurso(acesso, "radar")) {
    throw semAcesso("Acompanhar concursos previstos e autorizados é do plano Aprovado (radar).");
  }
  await validarCargo(c.id, roleId);
  return ok(await acompanhar(usuario.id, c.id, roleId), 201);
});

const Patch = z.object({
  cor: z.enum(CONTEST_COLORS).optional(),
  role_id: z.string().uuid().nullable().optional(),
  nas_materias: z.boolean().optional(),
});

export const PATCH = rota(async (req: Request, ctx: Ctx) => {
  const { usuario } = await exigirAcesso();
  const d = await lerJson(req, Patch);
  const c = await concurso((await ctx.params).id, false);
  await validarCargo(c.id, d.role_id);
  const f = await atualizarAcompanhamento(usuario.id, c.id, d);
  if (!f) throw naoEncontrado("Você não acompanha este concurso.");
  return ok(f);
});

/** Deixar de acompanhar funciona mesmo se o concurso foi despublicado (não deixa a pessoa presa). */
export const DELETE = rota(async (_req: Request, ctx: Ctx) => {
  const usuario = await exigirUsuario(); // quem perdeu o acesso também pode limpar a própria lista
  await deixarDeAcompanhar(usuario.id, (await concurso((await ctx.params).id, false)).id);
  return ok({ ok: true });
});
