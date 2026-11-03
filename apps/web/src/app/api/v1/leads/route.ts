import { z } from "zod";
import { sql } from "@/lib/db";
import { ErroApi, lerJson, ok, rota } from "@/lib/api";
import { contarTentativa, ipDaRequisicao, mensagemEspera } from "@/lib/limite";

const Schema = z.object({
  nome: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  whatsapp: z.string().trim().max(20).optional(),
  origem: z.string().max(60).optional(),
  utm: z.record(z.string(), z.string()).optional(),
});

/** Formulário da landing antes do app estar nas lojas. */
export const POST = rota(async (req: Request) => {
  const d = await lerJson(req, Schema);
  const lim = await contarTentativa(`leads:ip:${await ipDaRequisicao()}`, 20, 60 * 60);
  if (lim.bloqueado) throw new ErroApi(429, "muitas_tentativas", mensagemEspera(lim.restamSegundos));
  await sql`
    insert into leads (nome, email, whatsapp, origem, utm) values (${d.nome ?? null}, ${d.email}, ${d.whatsapp ?? null}, ${d.origem ?? "landing"}, ${sql.json(d.utm ?? {})})
    on conflict (email) do update set nome = coalesce(excluded.nome, leads.nome), whatsapp = coalesce(excluded.whatsapp, leads.whatsapp)`;
  return ok({ ok: true }, 201);
});
