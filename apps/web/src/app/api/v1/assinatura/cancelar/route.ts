import { sql } from "@/lib/db";
import { ErroApi, exigirUsuario, ok, rota } from "@/lib/api";
import { cancelarNoProvedor, travarUsuario } from "@/lib/repo/assinaturas";
import type { AssinaturaDTO } from "@aviso/shared";

/** Cancela: sem nova cobrança; continua usando até o fim do período pago (ou do teste). */
export const POST = rota(async () => {
  const s = await exigirUsuario();
  const a = await sql.begin(async (tx) => {
    await travarUsuario(tx, s.id);
    const [atual] = await tx<{ id: string; provider: string; provider_subscription_id: string | null }[]>`
      select id, provider, provider_subscription_id from subscriptions
      where user_id = ${s.id} and status in ('trial','ativa','inadimplente')`;
    if (!atual) throw new ErroApi(404, "sem_assinatura", "Você não tem assinatura ativa.");
    await cancelarNoProvedor(atual);
    const [c] = await tx<AssinaturaDTO[]>`
      update subscriptions set status = 'cancelada', cancel_at_period_end = true, canceled_at = now(), updated_at = now()
      where id = ${atual.id}
      returning id, plano, ciclo, status, metodo, trial_ends_at, current_period_end, cancel_at_period_end`;
    await tx`insert into audit_log (actor_id, acao, entidade, entidade_id) values (${s.id}, 'assinatura_cancelada', 'subscription', ${c.id})`;
    return c;
  });
  return ok(a);
});
