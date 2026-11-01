import "server-only";
import { sql, type Tx } from "@/lib/db";
import { calcularAcesso, TRIAL_DAYS, type Acesso, type AssinaturaDTO, type Ciclo, type Plano } from "@aviso/shared";

const COLS = sql`id, plano, ciclo, status, metodo, trial_ends_at, current_period_end, cancel_at_period_end`;

/** Assinatura mais relevante: a viva, senão a mais recente. */
export async function assinaturaAtual(userId: string, tx: Tx = sql): Promise<AssinaturaDTO | null> {
  const [s] = await tx<AssinaturaDTO[]>`
    select ${COLS} from subscriptions where user_id = ${userId}
    order by (status in ('trial','ativa','inadimplente')) desc, created_at desc limit 1`;
  return s ?? null;
}

export async function acessoDoUsuario(userId: string): Promise<Acesso> {
  return calcularAcesso(await assinaturaAtual(userId));
}

/** Já usou o teste grátis alguma vez? (um teste por pessoa) */
export async function jaUsouTeste(userId: string): Promise<boolean> {
  const [r] = await sql`select 1 from subscriptions where user_id = ${userId} and trial_ends_at is not null limit 1`;
  return !!r;
}

/**
 * Inicia o teste de 3 dias (ou assinatura direta se já usou o teste).
 * Cobrança no 4º dia: current_period_end = fim do teste.
 */
export async function iniciarAssinatura(params: {
  userId: string;
  plano: Plano;
  ciclo: Ciclo;
  metodo: "cartao" | "pix_automatico";
  provider: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
}): Promise<AssinaturaDTO> {
  const teste = !(await jaUsouTeste(params.userId));
  return sql.begin(async (tx) => {
    await tx`update subscriptions set status = 'expirada', updated_at = now()
             where user_id = ${params.userId} and status in ('trial','ativa','inadimplente')`;
    const fimTeste = teste ? new Date(Date.now() + TRIAL_DAYS * 86_400_000) : null;
    const [s] = await tx<AssinaturaDTO[]>`
      insert into subscriptions (user_id, plano, ciclo, status, metodo, trial_ends_at, current_period_end,
                                 provider, provider_customer_id, provider_subscription_id)
      values (${params.userId}, ${params.plano}, ${params.ciclo}, ${teste ? "trial" : "ativa"}, ${params.metodo},
              ${fimTeste}, ${fimTeste}, ${params.provider}, ${params.providerCustomerId ?? null},
              ${params.providerSubscriptionId ?? null})
      returning ${COLS}`;
    return s;
  });
}

export async function trocarPlano(userId: string, plano: Plano, ciclo: Ciclo) {
  const [s] = await sql<AssinaturaDTO[]>`
    update subscriptions set plano = ${plano}, ciclo = ${ciclo}, updated_at = now()
    where user_id = ${userId} and status in ('trial','ativa','inadimplente') returning ${COLS}`;
  return s ?? null;
}

/** Cancelar: continua usando até o fim do período pago / do teste, sem nova cobrança. */
export async function cancelarAssinatura(userId: string) {
  const [s] = await sql<AssinaturaDTO[]>`
    update subscriptions set status = 'cancelada', cancel_at_period_end = true, canceled_at = now(), updated_at = now()
    where user_id = ${userId} and status in ('trial','ativa','inadimplente') returning ${COLS}`;
  return s ?? null;
}
