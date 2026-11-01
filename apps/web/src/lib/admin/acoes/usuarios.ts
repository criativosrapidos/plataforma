"use server";

import { PLANOS } from "@aviso/shared";
import { exigirAdmin } from "@/lib/auth/guards";
import { sql } from "@/lib/db";
import { enviarAvisoTeste } from "@/lib/pipeline";
import { atualizarPainel } from "../atualizar";
import { auditar } from "../audit";
import { ehUuid } from "../params";
import { erroAmigavel, falha, sucesso, type Resultado } from "../resultado";

const PAPEIS = ["user", "editor", "admin"] as const;

/** Estende o teste grátis em N dias (1 a 30). Reabre um teste vencido se a pessoa nunca pagou. */
export async function estenderTesteAcao(userId: string, diasTexto?: string): Promise<Resultado> {
  const s = await exigirAdmin("admin");
  if (!ehUuid(userId)) return falha("Usuário inválido.");
  const dias = Number(diasTexto);
  if (!Number.isInteger(dias) || dias < 1 || dias > 30) return falha("Informe de 1 a 30 dias.");
  return sql.begin(async (tx) => {
    const [sub] = await tx<{ id: string; status: string; trial_ends_at: Date | null; pagos: number }[]>`
      select s.id, s.status, s.trial_ends_at,
             (select count(*)::int from payments p where p.subscription_id = s.id and p.status = 'pago') as pagos
      from subscriptions s where s.user_id = ${userId}
      order by (s.status in ('trial', 'ativa', 'inadimplente')) desc, s.created_at desc limit 1 for update`;
    if (!sub || !sub.trial_ends_at) return falha("Esta pessoa não tem teste para estender. Use “Conceder cortesia”.");
    const reabrir = sub.status !== "trial";
    if (reabrir && (sub.pagos > 0 || !["expirada", "cancelada"].includes(sub.status))) {
      return falha("O teste já virou assinatura. Para dar dias extras, use “Conceder cortesia”.");
    }
    const [r] = await tx<{ trial_ends_at: Date }[]>`
      update subscriptions set status = 'trial',
        trial_ends_at = greatest(trial_ends_at, now()) + make_interval(days => ${dias}),
        current_period_end = greatest(trial_ends_at, now()) + make_interval(days => ${dias}),
        canceled_at = null, cancel_at_period_end = false, updated_at = now()
      where id = ${sub.id} returning trial_ends_at`;
    await auditar(s.id, "usuario.estender_teste", "user", userId, { dias, reaberto: reabrir, novo_fim: r.trial_ends_at, assinatura: sub.id }, tx);
    atualizarPainel();
    return sucesso(`Teste estendido em ${dias} ${dias === 1 ? "dia" : "dias"}. A cobrança no provedor deve acompanhar a nova data.`);
  });
}

/** Plano cortesia até uma data: encerra a assinatura viva e cria uma "ativa" com provider = cortesia (fora do MRR). */
export async function concederCortesiaAcao(userId: string, plano: string, ate: string): Promise<Resultado> {
  const s = await exigirAdmin("admin");
  if (!ehUuid(userId)) return falha("Usuário inválido.");
  if (!(PLANOS as readonly string[]).includes(plano)) return falha("Escolha o plano.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ate)) return falha("Escolha a data final.");
  const fim = new Date(`${ate}T23:59:59-03:00`);
  if (Number.isNaN(fim.getTime()) || fim.getTime() <= Date.now()) return falha("A data final precisa ser no futuro.");
  if (fim.getTime() > Date.now() + 366 * 86_400_000) return falha("Cortesia de no máximo 1 ano.");
  try {
    return await sql.begin(async (tx) => {
      const encerradas = await tx<{ id: string; plano: string; status: string; provider: string }[]>`
        update subscriptions set status = 'expirada', updated_at = now()
        where user_id = ${userId} and status in ('trial', 'ativa', 'inadimplente') returning id, plano, status, provider`;
      const [nova] = await tx<{ id: string }[]>`
        insert into subscriptions (user_id, plano, ciclo, status, current_period_end, cancel_at_period_end, provider)
        values (${userId}, ${plano}, 'mensal', 'ativa', ${fim}, true, 'cortesia') returning id`;
      await auditar(s.id, "usuario.cortesia", "user", userId, { plano, ate, nova: nova.id, encerradas }, tx);
      atualizarPainel();
      const pagaNoProvedor = encerradas.some((e) => e.provider !== "cortesia" && e.provider !== "mock" && e.status !== "trial");
      return sucesso(
        `Cortesia ${plano === "aprovado" ? "Aprovado" : "Aviso"} até ${ate.split("-").reverse().join("/")}.` +
          (pagaNoProvedor ? " Atenção: cancele a cobrança no provedor de pagamento." : ""),
      );
    });
  } catch (e) {
    return erroAmigavel(e, "a cortesia");
  }
}

export async function mudarPapelAcao(userId: string, papel?: string): Promise<Resultado> {
  const s = await exigirAdmin("admin");
  if (!ehUuid(userId)) return falha("Usuário inválido.");
  if (!papel || !(PAPEIS as readonly string[]).includes(papel)) return falha("Escolha o papel.");
  if (userId === s.id && papel !== "admin") return falha("Você não pode tirar o seu próprio acesso de admin. Peça a outro admin.");
  return sql.begin(async (tx) => {
    const [u] = await tx<{ role: string; nome: string }[]>`select role, nome from users where id = ${userId} and deleted_at is null for update`;
    if (!u) return falha("Usuário não encontrado.");
    if (u.role === papel) return falha(`${u.nome} já tem esse papel.`);
    if (u.role === "admin") {
      const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from users where role = 'admin' and deleted_at is null`;
      if (n <= 1) return falha("Este é o único admin. Promova outra pessoa antes.");
    }
    await tx`update users set role = ${papel}, updated_at = now() where id = ${userId}`;
    await auditar(s.id, "usuario.papel", "user", userId, { antes: u.role, depois: papel }, tx);
    atualizarPainel();
    return sucesso(`${u.nome} agora é ${papel === "user" ? "usuário" : papel}.`);
  });
}

/** Revoga todas as sessões ativas (desloga do app e do site). A sua sessão atual é preservada. */
export async function revogarSessoesAcao(userId: string): Promise<Resultado> {
  const s = await exigirAdmin("admin");
  if (!ehUuid(userId)) return falha("Usuário inválido.");
  const r = await sql`update sessions set revoked_at = now() where user_id = ${userId} and revoked_at is null and id <> ${s.sessaoId}`;
  await auditar(s.id, "usuario.revogar_sessoes", "user", userId, { revogadas: r.count });
  atualizarPainel();
  return sucesso(r.count ? `${r.count} ${r.count === 1 ? "sessão revogada" : "sessões revogadas"}.` : "Nenhuma sessão ativa para revogar.");
}

export async function revogarSessaoAcao(userId: string, sessaoId: string): Promise<Resultado> {
  const s = await exigirAdmin("admin");
  if (!ehUuid(userId) || !ehUuid(sessaoId)) return falha("Sessão inválida.");
  if (sessaoId === s.sessaoId) return falha("Esta é a sua sessão atual. Use Sair.");
  const r = await sql`update sessions set revoked_at = now() where id = ${sessaoId} and user_id = ${userId} and revoked_at is null`;
  if (!r.count) return falha("Sessão já encerrada.");
  await auditar(s.id, "usuario.revogar_sessao", "user", userId, { sessao: sessaoId });
  atualizarPainel();
  return sucesso("Sessão revogada.");
}

export async function enviarAvisoTesteAcao(userId: string): Promise<Resultado> {
  const s = await exigirAdmin("admin");
  if (!ehUuid(userId)) return falha("Usuário inválido.");
  try {
    const r = await enviarAvisoTeste(userId);
    await auditar(s.id, "usuario.aviso_teste", "user", userId, r);
    return sucesso(r.enviados ? `Aviso de teste enviado para ${r.enviados} ${r.enviados === 1 ? "aparelho" : "aparelhos"}.` : "Nenhum aparelho ativo para receber o push.");
  } catch (e) {
    return erroAmigavel(e, "o envio do aviso de teste");
  }
}
