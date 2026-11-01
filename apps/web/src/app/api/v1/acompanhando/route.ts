import { exigirAcesso, ok, rota } from "@/lib/api";
import { listarAcompanhando } from "@/lib/repo/acompanhamento";

export const GET = rota(async () => ok(await listarAcompanhando((await exigirAcesso()).usuario.id)));
