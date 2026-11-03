import { exigirAcesso, ok, rota } from "@/lib/api";
import { hoje } from "@/lib/repo/agenda";
import { temRecurso } from "@aviso/shared";

export const GET = rota(async () => {
  const { usuario, acesso } = await exigirAcesso();
  return ok(await hoje(usuario.id, temRecurso(acesso, "radar")));
});
