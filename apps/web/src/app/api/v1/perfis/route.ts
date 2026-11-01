import { exigirUsuario, lerJson, ok, rota } from "@/lib/api";
import { criarPerfil, listarPerfis } from "@/lib/repo/perfis";
import { PerfilSchema } from "./schema";

export const GET = rota(async () => ok(await listarPerfis((await exigirUsuario()).id)));

export const POST = rota(async (req: Request) => {
  // Perfil pode ser criado no onboarding, antes de escolher o plano.
  const s = await exigirUsuario();
  return ok(await criarPerfil(s.id, await lerJson(req, PerfilSchema)), 201);
});
