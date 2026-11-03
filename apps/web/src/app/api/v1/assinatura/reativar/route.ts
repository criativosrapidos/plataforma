import { ErroApi, exigirUsuario, ok, rota } from "@/lib/api";
import { reativarAssinatura } from "@/lib/repo/assinaturas";

/** Desfaz o cancelamento enquanto o período pago (ou o teste) ainda vale. Nada é cobrado agora. */
export const POST = rota(async () => {
  const s = await exigirUsuario();
  const r = await reativarAssinatura(s.id, s.nome, s.email);
  if (!r.ok) throw new ErroApi(r.status, r.codigo, r.mensagem);
  return ok(r.assinatura);
});
