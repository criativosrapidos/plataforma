import { sql } from "@/lib/db";
import { ErroApi, exigirUsuario, ok, rota } from "@/lib/api";
import { billing } from "@/lib/billing";
import { cancelarAssinatura } from "@/lib/repo/assinaturas";

export const POST = rota(async () => {
  const s = await exigirUsuario();
  const [atual] = await sql<{ provider_subscription_id: string | null }[]>`
    select provider_subscription_id from subscriptions where user_id = ${s.id} and status in ('trial','ativa','inadimplente')`;
  if (!atual) throw new ErroApi(404, "sem_assinatura", "Você não tem assinatura ativa.");
  if (atual.provider_subscription_id) await (await billing()).cancelarAssinatura(atual.provider_subscription_id);
  const a = await cancelarAssinatura(s.id);
  await sql`insert into audit_log (actor_id, acao, entidade, entidade_id) values (${s.id}, 'assinatura_cancelada', 'subscription', ${a?.id ?? null})`;
  return ok(a);
});
