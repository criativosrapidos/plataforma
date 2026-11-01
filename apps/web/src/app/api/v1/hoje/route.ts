import { exigirAcesso, ok, rota } from "@/lib/api";
import { hoje } from "@/lib/repo/agenda";

export const GET = rota(async () => ok(await hoje((await exigirAcesso()).usuario.id)));
