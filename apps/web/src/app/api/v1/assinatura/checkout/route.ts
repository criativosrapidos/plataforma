import { z } from "zod";
import { ErroApi, exigirUsuario, lerJson, ok, rota } from "@/lib/api";
import { assinar } from "@/lib/repo/assinaturas";
import type { CheckoutResponse } from "@aviso/shared";

const Schema = z.object({
  plano: z.enum(["aviso", "aprovado"]),
  ciclo: z.enum(["mensal", "anual"]).default("mensal"),
  metodo: z.enum(["cartao", "pix_automatico"]).default("pix_automatico"),
});

/**
 * Começa o teste de 3 dias (cobrança no 4º dia) ou assina direto se o teste já foi usado.
 * Sem teste, o acesso só libera quando o provedor confirmar o pagamento.
 */
export const POST = rota(async (req: Request) => {
  const s = await exigirUsuario();
  const d = await lerJson(req, Schema);
  const r = await assinar({ userId: s.id, nome: s.nome, email: s.email, ...d });
  if (!r.ok) throw new ErroApi(r.status, r.codigo, r.mensagem);
  const resposta: CheckoutResponse = { assinatura: r.assinatura, checkout_url: r.checkoutUrl };
  return ok(resposta, 201);
});
