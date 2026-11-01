import { z } from "zod";
import { exigirUsuario, lerJson, ok, rota } from "@/lib/api";
import { ajustesDoUsuario, atualizarAjustes } from "@/lib/repo/usuarios";

export const GET = rota(async () => ok(await ajustesDoUsuario((await exigirUsuario()).id)));

const hora = z.string().regex(/^\d{2}:\d{2}$/).nullable();
const Schema = z.object({
  push_on: z.boolean().optional(),
  whatsapp_on: z.boolean().optional(),
  email_resumo: z.boolean().optional(),
  antecedencia_dias: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5)]).optional(),
  silencio_inicio: hora.optional(),
  silencio_fim: hora.optional(),
});

export const PUT = rota(async (req: Request) => {
  const s = await exigirUsuario();
  return ok(await atualizarAjustes(s.id, await lerJson(req, Schema)));
});
export const PATCH = PUT;
