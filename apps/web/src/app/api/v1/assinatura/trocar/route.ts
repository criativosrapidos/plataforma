import { z } from "zod";
import { sql } from "@/lib/db";
import { ErroApi, exigirUsuario, lerJson, ok, rota } from "@/lib/api";
import { billing } from "@/lib/billing";
import { trocarPlano } from "@/lib/repo/assinaturas";
import { precoCentavos } from "@aviso/shared";

const Schema = z.object({ plano: z.enum(["aviso", "aprovado"]), ciclo: z.enum(["mensal", "anual"]) });

export const POST = rota(async (req: Request) => {
  const s = await exigirUsuario();
  const d = await lerJson(req, Schema);
  const [atual] = await sql<{ provider_subscription_id: string | null }[]>`
    select provider_subscription_id from subscriptions where user_id = ${s.id} and status in ('trial','ativa','inadimplente')`;
  if (!atual) throw new ErroApi(404, "sem_assinatura", "Você não tem assinatura ativa.");
  if (atual.provider_subscription_id) {
    await (await billing()).atualizarValor({ subscriptionId: atual.provider_subscription_id, valorCentavos: precoCentavos(d.plano, d.ciclo), ciclo: d.ciclo });
  }
  return ok(await trocarPlano(s.id, d.plano, d.ciclo));
});
