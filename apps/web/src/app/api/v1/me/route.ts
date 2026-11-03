import { z } from "zod";
import { sql } from "@/lib/db";
import { ErroApi, exigirUsuario, lerJson, ok, rota } from "@/lib/api";
import { assinaturaAtual, cancelarNoProvedor, travarUsuario } from "@/lib/repo/assinaturas";
import { ajustesDoUsuario, usoDoMes, usuarioPorId } from "@/lib/repo/usuarios";
import { calcularAcesso, PLANO_INFO, type MeResponse } from "@aviso/shared";
import { encerrarSessao } from "@/lib/auth/session";

export const GET = rota(async () => {
  const s = await exigirUsuario();
  const [usuario, assinatura, ajustes, uso, [cont]] = await Promise.all([
    usuarioPorId(s.id),
    assinaturaAtual(s.id),
    ajustesDoUsuario(s.id),
    usoDoMes(s.id),
    sql<{ perfis: number; acompanhando: number; naolidos: number }[]>`
      select (select count(*)::int from profiles where user_id = ${s.id}) as perfis,
             (select count(*)::int from follows where user_id = ${s.id}) as acompanhando,
             (select count(*)::int from alerts where user_id = ${s.id} and canal = 'inapp' and lido_em is null) as naolidos`,
  ]);
  const acesso = calcularAcesso(assinatura);
  const limites = acesso.plano ? PLANO_INFO[acesso.plano].limites : { whatsappMes: 0, perguntasMes: 0 };
  const r: MeResponse = {
    usuario: usuario!,
    assinatura,
    acesso,
    ajustes,
    uso: { whatsappMes: uso.whatsapp, perguntasMes: uso.perguntas, limites },
    contagens: { perfis: cont.perfis, acompanhando: cont.acompanhando, avisosNaoLidos: cont.naolidos },
  };
  return ok(r);
});

const Patch = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  telefone: z.string().trim().regex(/^\+?\d{10,14}$/, "Telefone com DDD, só números").nullable().optional(),
  whatsapp_optin: z.boolean().optional(),
  busca_nominal_optin: z.boolean().optional(),
  nome_busca: z.string().trim().max(160).nullable().optional(),
});

export const PATCH = rota(async (req: Request) => {
  const s = await exigirUsuario();
  const d = await lerJson(req, Patch);
  const tel = d.telefone === undefined ? undefined : d.telefone ? (d.telefone.startsWith("+") ? d.telefone : `+55${d.telefone}`) : null;
  await sql`
    update users set
      nome = coalesce(${d.nome ?? null}, nome),
      telefone = ${tel === undefined ? sql`telefone` : tel},
      whatsapp_optin = coalesce(${d.whatsapp_optin ?? null}, whatsapp_optin),
      whatsapp_optin_em = case when ${d.whatsapp_optin ?? null}::boolean is true and not whatsapp_optin then now() else whatsapp_optin_em end,
      busca_nominal_optin = coalesce(${d.busca_nominal_optin ?? null}, busca_nominal_optin),
      nome_busca = ${d.nome_busca === undefined ? sql`nome_busca` : d.nome_busca},
      updated_at = now()
    where id = ${s.id}`;
  return ok(await usuarioPorId(s.id));
});

/**
 * LGPD: excluir conta. Primeiro cancela a cobrança no provedor (senão a pessoa seguiria sendo cobrada
 * sem conseguir entrar); depois anonimiza os dados pessoais e encerra sessões e assinatura.
 * O hash do e-mail em testes_usados continua (prevenção de fraude do teste grátis).
 */
export const DELETE = rota(async () => {
  const s = await exigirUsuario();
  await sql.begin(async (tx) => {
    await travarUsuario(tx, s.id);
    const vivas = await tx<{ id: string; provider: string; provider_subscription_id: string | null }[]>`
      select id, provider, provider_subscription_id from subscriptions where user_id = ${s.id} and status in ('trial','ativa','inadimplente')`;
    for (const v of vivas) {
      try {
        await cancelarNoProvedor(v);
      } catch (e) {
        console.error("[me] falha ao cancelar no provedor", e);
        throw new ErroApi(502, "cobranca_indisponivel", "Não conseguimos cancelar a cobrança agora. Tente de novo em alguns minutos; nada foi apagado.");
      }
    }
    await tx`update subscriptions set status = 'cancelada', cancel_at_period_end = true, canceled_at = now(), updated_at = now()
             where user_id = ${s.id} and status in ('trial','ativa','inadimplente')`;
    await tx`delete from devices where user_id = ${s.id}`;
    await tx`delete from profiles where user_id = ${s.id}`;
    await tx`update sessions set revoked_at = now() where user_id = ${s.id} and revoked_at is null`;
    await tx`update users set nome = 'Conta excluída', email = ${`excluido+${s.id}@avisoconcurso.invalid`}, telefone = null,
             nome_busca = null, whatsapp_optin = false, busca_nominal_optin = false, deleted_at = now() where id = ${s.id}`;
    await tx`insert into audit_log (actor_id, acao, entidade, entidade_id) values (${s.id}, 'conta_excluida', 'user', ${s.id})`;
  });
  await encerrarSessao(s.sessaoId);
  return ok({ ok: true });
});
