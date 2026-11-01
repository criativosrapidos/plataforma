import { exigirAcesso, ok, rota } from "@/lib/api";
import { agenda } from "@/lib/repo/agenda";
import { hojeISO, somarDias } from "@aviso/shared";

const data = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);

export const GET = rota(async (req: Request) => {
  const { usuario } = await exigirAcesso();
  const u = new URL(req.url).searchParams;
  const de = data(u.get("de")) ?? hojeISO();
  const ate = data(u.get("ate")) ?? somarDias(de, 60);
  return ok(await agenda(usuario.id, de, ate, u.get("concurso") ?? undefined));
});
