import { z } from "zod";
import { exigirUsuario, lerJson, ok, rota } from "@/lib/api";
import { billing } from "@/lib/billing";
import { iniciarAssinatura, jaUsouTeste } from "@/lib/repo/assinaturas";
import { sql } from "@/lib/db";
import { precoCentavos, TRIAL_DAYS, type CheckoutResponse } from "@aviso/shared";

const Schema = z.object({
  plano: z.enum(["aviso", "aprovado"]),
  ciclo: z.enum(["mensal", "anual"]).default("mensal"),
  metodo: z.enum(["cartao", "pix_automatico"]).default("pix_automatico"),
});

/** Começa o teste de 3 dias (cobrança no 4º dia) ou assina direto se o teste já foi usado. */
export const POST = rota(async (req: Request) => {
  const s = await exigirUsuario();
  const d = await lerJson(req, Schema);
  const teste = !(await jaUsouTeste(s.id));
  const provider = await billing();
  const primeira = new Date(Date.now() + (teste ? TRIAL_DAYS : 0) * 86_400_000);
  const ext = await provider.criarAssinatura({
    userId: s.id, nome: s.nome, email: s.email, plano: d.plano, ciclo: d.ciclo, metodo: d.metodo,
    valorCentavos: precoCentavos(d.plano, d.ciclo), primeiraCobranca: primeira,
  });
  const assinatura = await iniciarAssinatura({
    userId: s.id, plano: d.plano, ciclo: d.ciclo, metodo: d.metodo, provider: provider.nome,
    providerCustomerId: ext.customerId, providerSubscriptionId: ext.subscriptionId,
  });
  await sql`insert into audit_log (actor_id, acao, entidade, entidade_id, dados)
            values (${s.id}, ${teste ? "teste_iniciado" : "assinatura_criada"}, 'subscription', ${assinatura.id}, ${sql.json(d)})`;
  const r: CheckoutResponse = { assinatura, checkout_url: ext.checkoutUrl };
  return ok(r, 201);
});
