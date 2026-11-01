import "server-only";
import { sql } from "@/lib/db";
import { usoDoMes } from "@/lib/repo/usuarios";
import { like } from "./busca";

export const ORDENS_USUARIO = ["cadastro", "acesso", "nome"] as const;

export interface LinhaUsuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  telefone: string | null;
  created_at: Date;
  ultimo_acesso_em: Date | null;
  plano: string | null;
  status: string | null;
  ciclo: string | null;
  provider: string | null;
  trial_ends_at: Date | null;
  current_period_end: Date | null;
  acompanhando: number;
}

const SUB_ATUAL = sql`
  left join lateral (
    select s.plano, s.status, s.ciclo, s.provider, s.trial_ends_at, s.current_period_end from subscriptions s where s.user_id = u.id
    order by (s.status in ('trial', 'ativa', 'inadimplente')) desc, s.created_at desc limit 1
  ) sub on true`;

export async function listarUsuarios(f: { q?: string; status?: string; plano?: string; papel?: string; ordem: string; dir: "asc" | "desc"; pagina: number; porPagina: number }) {
  const where = sql`
    u.deleted_at is null
    ${f.q ? sql`and (u.nome || ' ' || u.email::text || ' ' || coalesce(u.telefone, '')) ilike ${like(f.q)}` : sql``}
    ${f.status ? (f.status === "sem" ? sql`and sub.status is null` : sql`and sub.status = ${f.status}`) : sql``}
    ${f.plano ? sql`and sub.plano = ${f.plano}` : sql``}
    ${f.papel ? sql`and u.role = ${f.papel}` : sql``}`;
  const dir = f.dir === "asc" ? sql`asc` : sql`desc`;
  const ordem = f.ordem === "acesso" ? sql`u.ultimo_acesso_em ${dir} nulls last` : f.ordem === "nome" ? sql`u.nome ${dir}` : sql`u.created_at ${dir}`;
  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from users u ${SUB_ATUAL} where ${where}`;
  const itens = await sql<LinhaUsuario[]>`
    select u.id, u.nome, u.email::text as email, u.role, u.telefone, u.created_at, u.ultimo_acesso_em,
           sub.plano, sub.status, sub.ciclo, sub.provider, sub.trial_ends_at, sub.current_period_end,
           (select count(*)::int from follows fo where fo.user_id = u.id) as acompanhando
    from users u ${SUB_ATUAL}
    where ${where} order by ${ordem}, u.id limit ${f.porPagina} offset ${(f.pagina - 1) * f.porPagina}`;
  return { itens, total };
}

export async function usuarioDetalhe(id: string) {
  // Nunca selecionar senha_hash.
  const [u] = await sql<{
    id: string; nome: string; email: string; role: string; telefone: string | null; whatsapp_optin: boolean; whatsapp_optin_em: Date | null;
    busca_nominal_optin: boolean; nome_busca: string | null; termos_aceitos_em: Date | null; email_verificado_em: Date | null;
    ultimo_acesso_em: Date | null; created_at: Date; deleted_at: Date | null;
  }[]>`
    select id, nome, email::text as email, role, telefone, whatsapp_optin, whatsapp_optin_em, busca_nominal_optin, nome_busca,
           termos_aceitos_em, email_verificado_em, ultimo_acesso_em, created_at, deleted_at
    from users where id = ${id}`;
  if (!u) return null;
  const [assinaturas, pagamentos, perfis, acompanha, avisos, sessoes, aparelhos, ajustes, uso, auditoria] = await Promise.all([
    sql<{ id: string; plano: string; ciclo: string; status: string; metodo: string | null; provider: string; trial_ends_at: Date | null; current_period_end: Date | null; cancel_at_period_end: boolean; canceled_at: Date | null; created_at: Date }[]>`
      select id, plano, ciclo, status, metodo, provider, trial_ends_at, current_period_end, cancel_at_period_end, canceled_at, created_at
      from subscriptions where user_id = ${id} order by (status in ('trial', 'ativa', 'inadimplente')) desc, created_at desc`,
    sql<{ id: string; valor_centavos: number; status: string; metodo: string | null; vencimento: string | null; pago_em: Date | null; created_at: Date; provider_payment_id: string | null }[]>`
      select id, valor_centavos, status, metodo, vencimento, pago_em, created_at, provider_payment_id from payments
      where user_id = ${id} order by created_at desc limit 50`,
    sql<{ id: string; nome: string; escolaridades: string[]; areas: string[]; ufs: string[]; cargos: string[]; palavras_chave: string[]; salario_min_centavos: number | null; ativo: boolean }[]>`
      select id, nome, escolaridades, areas, ufs, cargos, palavras_chave, salario_min_centavos, ativo from profiles where user_id = ${id} order by created_at`,
    sql<{ contest_id: string; titulo: string; cor: string; created_at: Date; feitos: number; itens: number }[]>`
      select f.contest_id, c.titulo, f.cor, f.created_at,
             (select count(*)::int from checklist_items ci where ci.follow_id = f.id and ci.feito) as feitos,
             (select count(*)::int from checklist_items ci where ci.follow_id = f.id) as itens
      from follows f join contests c on c.id = f.contest_id where f.user_id = ${id} order by f.created_at desc`,
    sql<{ id: string; tipo: string; canal: string; titulo: string; status: string; erro: string | null; created_at: Date; enviado_em: Date | null; lido_em: Date | null }[]>`
      select id, tipo, canal, titulo, status, erro, created_at, enviado_em, lido_em from alerts where user_id = ${id} order by created_at desc limit 25`,
    sql<{ id: string; cliente: string; user_agent: string | null; created_at: Date; expires_at: Date; revoked_at: Date | null }[]>`
      select id, cliente, user_agent, created_at, expires_at, revoked_at from sessions where user_id = ${id}
      order by (revoked_at is null and expires_at > now()) desc, created_at desc limit 30`,
    sql<{ id: string; plataforma: string; ativo: boolean; last_seen_at: Date }[]>`
      select id, plataforma, ativo, last_seen_at from devices where user_id = ${id} order by last_seen_at desc`,
    sql<{ push_on: boolean; whatsapp_on: boolean; email_resumo: boolean; antecedencia_dias: number }[]>`
      select push_on, whatsapp_on, email_resumo, antecedencia_dias from user_settings where user_id = ${id}`,
    usoDoMes(id),
    sql<{ id: number; acao: string; created_at: Date; ator: string | null; dados: unknown }[]>`
      select a.id, a.acao, a.created_at, u.nome as ator, a.dados from audit_log a left join users u on u.id = a.actor_id
      where a.entidade = 'user' and a.entidade_id = ${id} order by a.created_at desc limit 20`,
  ]);
  return { u, assinaturas, pagamentos, perfis, acompanha, avisos, sessoes, aparelhos, ajustes: ajustes[0] ?? null, uso, auditoria };
}
