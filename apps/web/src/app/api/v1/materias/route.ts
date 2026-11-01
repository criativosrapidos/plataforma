import { exigirAcesso, ok, rota } from "@/lib/api";
import { materias } from "@/lib/repo/agenda";

export const GET = rota(async () => ok(await materias((await exigirAcesso()).usuario.id)));
