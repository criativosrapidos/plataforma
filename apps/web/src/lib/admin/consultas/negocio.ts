import "server-only";
import { sql } from "@/lib/db";
import { like } from "./busca";

const TZ = "America/Sao_Paulo";
const fimDoDia = (d: string) => sql`((${d}::date + 1)::timestamp at time zone ${TZ})`;
const inicioDoDia = (d: string) => sql`(${d}::date::timestamp at time zone ${TZ})`;

export interface Pagina {
  pagina: number;
  porPagina: number; // 0 = sem limite (exportação)
}
const limite = (p: Pagina) => (p.porPagina ? sql`limit ${p.porPagina} offset ${(p.pagina - 1) * p.porPagina}` : sql`limit 50000`);

// ---------------------------------------------------------------- Financeiro

export async function receitaMensal(meses = 12) {
  return sql<{ mes: string; aviso: number; aprovado: number; outros: number }[]>`
    with m as (
      select generate_series(date_trunc('month', now() at time zone ${TZ}) - make_interval(months => ${meses - 1}),
                             date_trunc('month', now() at time zone ${TZ}), interval '1 month')::date as mes
    ), p as (
      select date_trunc('month', p.pago_em at time zone ${TZ})::date as mes, s.plano, sum(p.valor_centavos)::int as v
      from payments p left join subscriptions s on s.id = p.subscription_id
      where p.status = 'pago' and p.pago_em >= (date_trunc('month', now() at time zone ${TZ}) - make_interval(months => ${meses - 1})) at time zone ${TZ}
      group by 1, 2
    )
    select to_char(m.mes, 'YYYY-MM') as mes,
      coalesce(sum(p.v) filter (where p.plano = 'aviso'), 0)::int as aviso,
      coalesce(sum(p.v) filter (where p.plano = 'aprovado'), 0)::int as aprovado,
      coalesce(sum(p.v) filter (where p.plano is null), 0)::int as outros
    from m left join p on p.mes = m.mes group by m.mes order by m.mes`;
}

export async function resumoFinanceiro() {
  const [r] = await sql<{ mes_atual: number; mes_anterior: number; inadimplentes: number; falhas_abertas: number; valor_falhas: number; estornos_90d: number; cortesias: number }[]>`
    select
      (select coalesce(sum(valor_centavos), 0)::int from payments where status = 'pago' and pago_em >= date_trunc('month', now() at time zone ${TZ}) at time zone ${TZ}) as mes_atual,
      (select coalesce(sum(valor_centavos), 0)::int from payments where status = 'pago'
         and pago_em >= (date_trunc('month', now() at time zone ${TZ}) - interval '1 month') at time zone ${TZ}
         and pago_em < date_trunc('month', now() at time zone ${TZ}) at time zone ${TZ}) as mes_anterior,
      (select count(*)::int from subscriptions where status = 'inadimplente') as inadimplentes,
      (select count(*)::int from payments p join subscriptions s on s.id = p.subscription_id where p.status = 'falhou' and s.status = 'inadimplente') as falhas_abertas,
      (select coalesce(sum(p.valor_centavos), 0)::int from payments p join subscriptions s on s.id = p.subscription_id where p.status = 'falhou' and s.status = 'inadimplente') as valor_falhas,
      (select coalesce(sum(valor_centavos), 0)::int from payments where status = 'estornado' and created_at > now() - interval '90 days') as estornos_90d,
      (select count(*)::int from subscriptions where provider = 'cortesia' and status = 'ativa') as cortesias`;
  return r;
}

export interface FiltroAssinaturas {
  status?: string;
  plano?: string;
  ciclo?: string;
  provider?: string;
  q?: string;
}

export async function listarAssinaturas(f: FiltroAssinaturas, p: Pagina) {
  const where = sql`
    true
    ${f.status ? sql`and s.status = ${f.status}` : sql``}
    ${f.plano ? sql`and s.plano = ${f.plano}` : sql``}
    ${f.ciclo ? sql`and s.ciclo = ${f.ciclo}` : sql``}
    ${f.provider ? sql`and s.provider = ${f.provider}` : sql``}
    ${f.q ? sql`and (u.nome || ' ' || u.email::text) ilike ${like(f.q)}` : sql``}`;
  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from subscriptions s join users u on u.id = s.user_id where ${where}`;
  const itens = await sql<{
    id: string; user_id: string; nome: string; email: string; plano: string; ciclo: string; status: string; metodo: string | null; provider: string;
    trial_ends_at: Date | null; current_period_end: Date | null; created_at: Date; canceled_at: Date | null; pago_total: number;
  }[]>`
    select s.id, s.user_id, u.nome, u.email::text as email, s.plano, s.ciclo, s.status, s.metodo, s.provider, s.trial_ends_at, s.current_period_end,
           s.created_at, s.canceled_at,
           (select coalesce(sum(p.valor_centavos), 0)::int from payments p where p.subscription_id = s.id and p.status = 'pago') as pago_total
    from subscriptions s join users u on u.id = s.user_id where ${where}
    order by s.created_at desc ${limite(p)}`;
  return { itens, total };
}

export async function providersEmUso() {
  return (await sql<{ provider: string }[]>`select distinct provider from subscriptions order by 1`).map((r) => r.provider);
}

export interface FiltroPagamentos {
  status?: string;
  de?: string;
  ate?: string;
  q?: string;
}

export async function listarPagamentos(f: FiltroPagamentos, p: Pagina) {
  const where = sql`
    true
    ${f.status ? sql`and pg.status = ${f.status}` : sql``}
    ${f.de ? sql`and pg.created_at >= ${inicioDoDia(f.de)}` : sql``}
    ${f.ate ? sql`and pg.created_at < ${fimDoDia(f.ate)}` : sql``}
    ${f.q ? sql`and (u.nome || ' ' || u.email::text || ' ' || coalesce(pg.provider_payment_id, '')) ilike ${like(f.q)}` : sql``}`;
  const [{ total, soma }] = await sql<{ total: number; soma: number }[]>`
    select count(*)::int as total, coalesce(sum(pg.valor_centavos), 0)::int as soma from payments pg join users u on u.id = pg.user_id where ${where}`;
  const itens = await sql<{
    id: string; user_id: string; nome: string; email: string; valor_centavos: number; status: string; metodo: string | null; vencimento: string | null;
    pago_em: Date | null; created_at: Date; provider_payment_id: string | null; plano: string | null;
  }[]>`
    select pg.id, pg.user_id, u.nome, u.email::text as email, pg.valor_centavos, pg.status, pg.metodo, pg.vencimento, pg.pago_em, pg.created_at,
           pg.provider_payment_id, s.plano
    from payments pg join users u on u.id = pg.user_id left join subscriptions s on s.id = pg.subscription_id
    where ${where} order by pg.created_at desc ${limite(p)}`;
  return { itens, total, soma };
}

export async function listarInadimplentes() {
  return sql<{ id: string; user_id: string; nome: string; email: string; telefone: string | null; plano: string; ciclo: string; metodo: string | null; current_period_end: Date | null; valor: number | null; falhou_em: Date | null; tentativas: number }[]>`
    select s.id, s.user_id, u.nome, u.email::text as email, u.telefone, s.plano, s.ciclo, s.metodo, s.current_period_end,
           f.valor_centavos as valor, f.created_at as falhou_em,
           (select count(*)::int from payments x where x.subscription_id = s.id and x.status = 'falhou') as tentativas
    from subscriptions s join users u on u.id = s.user_id
    left join lateral (select valor_centavos, created_at from payments p where p.subscription_id = s.id and p.status = 'falhou' order by created_at desc limit 1) f on true
    where s.status = 'inadimplente' order by f.created_at asc nulls last`;
}

// ---------------------------------------------------------------- Avisos

export interface FiltroAvisos {
  tipo?: string;
  canal?: string;
  status?: string;
  de?: string;
  ate?: string;
  q?: string;
}

function whereAvisos(f: FiltroAvisos) {
  return sql`
    true
    ${f.tipo ? sql`and a.tipo = ${f.tipo}` : sql``}
    ${f.canal ? sql`and a.canal = ${f.canal}` : sql``}
    ${f.status ? sql`and a.status = ${f.status}` : sql``}
    ${f.de ? sql`and a.created_at >= ${inicioDoDia(f.de)}` : sql``}
    ${f.ate ? sql`and a.created_at < ${fimDoDia(f.ate)}` : sql``}
    ${f.q ? sql`and (a.titulo || ' ' || u.email::text || ' ' || u.nome) ilike ${like(f.q)}` : sql``}`;
}

export async function listarAvisos(f: FiltroAvisos, p: Pagina) {
  const where = whereAvisos(f);
  const [resumo] = await sql<{ total: number; enviados: number; falhas: number; suprimidos: number; pendentes: number; custo: number }[]>`
    select count(*)::int as total, count(*) filter (where a.status = 'enviado')::int as enviados, count(*) filter (where a.status = 'falhou')::int as falhas,
           count(*) filter (where a.status = 'suprimido')::int as suprimidos, count(*) filter (where a.status = 'pendente')::int as pendentes,
           coalesce(sum(a.custo_centavos), 0)::float8 as custo
    from alerts a join users u on u.id = a.user_id where ${where}`;
  const porCanal = await sql<{ canal: string; total: number; falhas: number; custo: number }[]>`
    select a.canal, count(*)::int as total, count(*) filter (where a.status = 'falhou')::int as falhas, coalesce(sum(a.custo_centavos), 0)::float8 as custo
    from alerts a join users u on u.id = a.user_id where ${where} group by a.canal order by total desc`;
  const itens = await sql<{
    id: string; user_id: string; nome: string; email: string; contest_id: string | null; concurso: string | null; tipo: string; canal: string; titulo: string;
    corpo: string; status: string; erro: string | null; custo_centavos: number; created_at: Date; enviado_em: Date | null; lido_em: Date | null; url_oficial: string | null;
  }[]>`
    select a.id, a.user_id, u.nome, u.email::text as email, a.contest_id, c.titulo as concurso, a.tipo, a.canal, a.titulo, a.corpo, a.status, a.erro,
           a.custo_centavos::float8 as custo_centavos, a.created_at, a.enviado_em, a.lido_em, a.url_oficial
    from alerts a join users u on u.id = a.user_id left join contests c on c.id = a.contest_id
    where ${where} order by a.created_at desc ${limite(p)}`;
  return { resumo, porCanal, itens };
}

// ---------------------------------------------------------------- Leads

export interface FiltroLeads {
  q?: string;
  origem?: string;
  de?: string;
  ate?: string;
}

export async function listarLeads(f: FiltroLeads, p: Pagina) {
  const where = sql`
    true
    ${f.q ? sql`and (coalesce(l.nome, '') || ' ' || l.email::text || ' ' || coalesce(l.whatsapp, '')) ilike ${like(f.q)}` : sql``}
    ${f.origem ? (f.origem === "sem" ? sql`and l.origem is null` : sql`and l.origem = ${f.origem}`) : sql``}
    ${f.de ? sql`and l.created_at >= ${inicioDoDia(f.de)}` : sql``}
    ${f.ate ? sql`and l.created_at < ${fimDoDia(f.ate)}` : sql``}`;
  const [{ total, convertidos }] = await sql<{ total: number; convertidos: number }[]>`
    select count(*)::int as total, count(u.id)::int as convertidos
    from leads l left join users u on u.email = l.email and u.deleted_at is null where ${where}`;
  const itens = await sql<{ id: string; nome: string | null; email: string; whatsapp: string | null; origem: string | null; utm: Record<string, string>; created_at: Date; user_id: string | null }[]>`
    select l.id, l.nome, l.email::text as email, l.whatsapp, l.origem, l.utm, l.created_at, u.id as user_id
    from leads l left join users u on u.email = l.email and u.deleted_at is null
    where ${where} order by l.created_at desc ${limite(p)}`;
  return { itens, total, convertidos };
}

export async function origensDeLeads() {
  return (await sql<{ origem: string }[]>`select distinct origem from leads where origem is not null order by 1`).map((r) => r.origem);
}
