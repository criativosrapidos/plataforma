import "server-only";
import { sql } from "@/lib/db";
import { precoCentavos, type Ciclo, type Plano } from "@aviso/shared";
import { lerConfigValor } from "./config";

const TZ = "America/Sao_Paulo";

/** Meia-noite (Brasília) do primeiro dia do período de `p` dias que termina hoje, deslocado `desloc` períodos para trás. */
const inicio = (p: number, desloc = 0) =>
  sql`(((now() at time zone ${TZ})::date - ${p * (1 + desloc) - 1}::int)::timestamp at time zone ${TZ})`;

const diasDoPeriodo = (p: number) => sql`
  select generate_series((now() at time zone ${TZ})::date - ${p - 1}::int, (now() at time zone ${TZ})::date, interval '1 day')::date as dia`;

export interface Comparativo {
  atual: number;
  anterior: number;
}

// ---------------------------------------------------------------- Operação (editor e admin)

export interface Coletor {
  id: string;
  slug: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  frequencia_min: number;
  run_status: string | null;
  iniciado_em: Date | null;
  terminado_em: Date | null;
  docs_novos: number | null;
  erro: string | null;
  erros: number;
  runs: number;
  saude: "ok" | "erro" | "atrasada" | "desligada" | "nunca";
}

export async function metricasOperacao(p: number) {
  const [fila, coletoresBrutos, avisosCanal, avisosDia, custos, custosDia, tempo, docs] = await Promise.all([
    sql<{ total: number; mais_antiga: Date | null; baixa: number }[]>`
      select count(*)::int as total, min(created_at) as mais_antiga,
             count(*) filter (where confianca < 0.6)::int as baixa
      from extractions where status = 'pendente'`,
    sql<Omit<Coletor, "saude">[]>`
      select s.id, s.slug, s.nome, s.tipo, s.ativo, s.frequencia_min,
             r.status as run_status, r.iniciado_em, r.terminado_em, r.docs_novos, r.erro,
             (select count(*)::int from source_runs x where x.source_id = s.id and x.status = 'erro' and x.iniciado_em >= ${inicio(p)}) as erros,
             (select count(*)::int from source_runs x where x.source_id = s.id and x.iniciado_em >= ${inicio(p)}) as runs
      from sources s
      left join lateral (select * from source_runs r where r.source_id = s.id order by r.iniciado_em desc limit 1) r on true
      order by s.ativo desc, s.nome`,
    sql<{ canal: string; enviados: number; falhas: number; custo: number }[]>`
      select canal, count(*) filter (where status = 'enviado')::int as enviados,
             count(*) filter (where status = 'falhou')::int as falhas,
             coalesce(sum(custo_centavos) filter (where status = 'enviado'), 0)::float8 as custo
      from alerts where created_at >= ${inicio(p)} group by canal`,
    sql<{ dia: string; push: number; email: number; whatsapp: number; inapp: number }[]>`
      with dias as (${diasDoPeriodo(p)}),
      a as (
        select (coalesce(enviado_em, created_at) at time zone ${TZ})::date as dia, canal, count(*)::int as n
        from alerts where status = 'enviado' and coalesce(enviado_em, created_at) >= ${inicio(p)} group by 1, 2)
      select to_char(d.dia, 'YYYY-MM-DD') as dia,
        coalesce(sum(a.n) filter (where a.canal = 'push'), 0)::int as push,
        coalesce(sum(a.n) filter (where a.canal = 'email'), 0)::int as email,
        coalesce(sum(a.n) filter (where a.canal = 'whatsapp'), 0)::int as whatsapp,
        coalesce(sum(a.n) filter (where a.canal = 'inapp'), 0)::int as inapp
      from dias d left join a on a.dia = d.dia group by d.dia order by d.dia`,
    sql<{ extracao: number; extracoes: number; perguntas_custo: number; perguntas: number }[]>`
      select
        (select coalesce(sum(custo_centavos), 0)::float8 from extractions where created_at >= ${inicio(p)}) as extracao,
        (select count(*)::int from extractions where created_at >= ${inicio(p)}) as extracoes,
        (select coalesce(sum(custo_centavos), 0)::float8 from questions where created_at >= ${inicio(p)}) as perguntas_custo,
        (select count(*)::int from questions where created_at >= ${inicio(p)}) as perguntas`,
    sql<{ dia: string; extracao: number; perguntas: number; whatsapp: number }[]>`
      with dias as (${diasDoPeriodo(p)}),
      e as (select (created_at at time zone ${TZ})::date as dia, sum(custo_centavos)::float8 as v from extractions where created_at >= ${inicio(p)} group by 1),
      q as (select (created_at at time zone ${TZ})::date as dia, sum(custo_centavos)::float8 as v from questions where created_at >= ${inicio(p)} group by 1),
      w as (select (coalesce(enviado_em, created_at) at time zone ${TZ})::date as dia, sum(custo_centavos)::float8 as v
            from alerts where canal = 'whatsapp' and status = 'enviado' and coalesce(enviado_em, created_at) >= ${inicio(p)} group by 1)
      select to_char(d.dia, 'YYYY-MM-DD') as dia, coalesce(e.v, 0) as extracao, coalesce(q.v, 0) as perguntas, coalesce(w.v, 0) as whatsapp
      from dias d left join e on e.dia = d.dia left join q on q.dia = d.dia left join w on w.dia = d.dia order by d.dia`,
    // Publicação (coleta do ato) → aviso: compara o envio com o ato mais recente do concurso antes dele.
    sql<{ media: number | null; mediana: number | null; n: number; dentro_meta: number }[]>`
      with t as (
        select extract(epoch from (al.enviado_em - coalesce(rd.coletado_em, ac.created_at))) / 60 as minutos
        from (
          select distinct on (contest_id, tipo) contest_id, tipo, enviado_em from alerts
          where status = 'enviado' and enviado_em >= ${inicio(p)} and contest_id is not null
            and tipo in ('edital_publicado', 'autorizado', 'errata', 'local_prova', 'gabarito', 'resultado', 'convocacao')
          order by contest_id, tipo, enviado_em
        ) al
        join lateral (select * from acts ac where ac.contest_id = al.contest_id and ac.created_at <= al.enviado_em order by ac.created_at desc limit 1) ac on true
        left join raw_documents rd on rd.id = ac.raw_document_id
      )
      select avg(minutos)::float8 as media, percentile_cont(0.5) within group (order by minutos)::float8 as mediana,
             count(*)::int as n, count(*) filter (where minutos <= 60)::int as dentro_meta
      from t where minutos >= 0`,
    sql<{ coletados: number; auto: number; pendentes: number; aprovadas: number; rejeitadas: number }[]>`
      select
        (select count(*)::int from raw_documents where coletado_em >= ${inicio(p)}) as coletados,
        count(*) filter (where status = 'auto')::int as auto,
        count(*) filter (where status = 'pendente')::int as pendentes,
        count(*) filter (where status = 'aprovada')::int as aprovadas,
        count(*) filter (where status = 'rejeitada')::int as rejeitadas
      from extractions where created_at >= ${inicio(p)}`,
  ]);

  const agora = Date.now();
  const coletores: Coletor[] = coletoresBrutos.map((c) => {
    let saude: Coletor["saude"] = "ok";
    if (!c.ativo) saude = "desligada";
    else if (!c.iniciado_em) saude = "nunca";
    else if (c.run_status === "erro") saude = "erro";
    else if (agora - new Date(c.iniciado_em).getTime() > c.frequencia_min * 2 * 60_000 + 15 * 60_000) saude = "atrasada";
    return { ...c, saude };
  });

  return { fila: fila[0], coletores, avisosCanal, avisosDia, custos: custos[0], custosDia, tempo: tempo[0], docs: docs[0] };
}

// ---------------------------------------------------------------- Negócio (só admin)
// Exclui contas da equipe (role <> 'user') e cortesias (provider = 'cortesia') do faturamento.

const ATUAL = sql`
  select distinct on (s.user_id) s.* from subscriptions s
  join users u on u.id = s.user_id and u.deleted_at is null and u.role = 'user'
  order by s.user_id, (s.status in ('trial', 'ativa', 'inadimplente')) desc, s.created_at desc`;

export async function metricasNegocio(p: number) {
  const [porStatus, mrrLinhas, testes, conversao, churn, cadastros, leads, receita, serie, custoFixo] = await Promise.all([
    sql<{ status: string; plano: string; n: number }[]>`
      with atual as (${ATUAL}) select status, plano, count(*)::int as n from atual group by 1, 2`,
    sql<{ status: string; plano: Plano; ciclo: Ciclo; n: number }[]>`
      with atual as (${ATUAL})
      select status, plano, ciclo, count(*)::int as n from atual
      where status in ('ativa', 'inadimplente') and provider <> 'cortesia' group by 1, 2, 3`,
    sql<Comparativo[]>`
      select count(*) filter (where s.created_at >= ${inicio(p)})::int as atual,
             count(*) filter (where s.created_at < ${inicio(p)})::int as anterior
      from subscriptions s join users u on u.id = s.user_id and u.role = 'user'
      where s.trial_ends_at is not null and s.created_at >= ${inicio(p, 1)}`,
    sql<{ encerrados: number; convertidos: number }[]>`
      select count(*)::int as encerrados,
        count(*) filter (where s.status in ('ativa', 'inadimplente')
          or exists (select 1 from payments pg where pg.user_id = s.user_id and pg.status = 'pago' and pg.created_at >= s.created_at))::int as convertidos
      from subscriptions s join users u on u.id = s.user_id and u.role = 'user'
      where s.trial_ends_at is not null and s.provider <> 'cortesia'
        and s.trial_ends_at >= ${inicio(p)} and s.trial_ends_at <= now()`,
    sql<{ base: number; cancelados: number; cancelados_teste: number }[]>`
      select
        (select count(distinct s.user_id)::int from subscriptions s join users u on u.id = s.user_id and u.role = 'user'
          where s.provider <> 'cortesia' and s.created_at < ${inicio(p)}
            and exists (select 1 from payments pg where pg.subscription_id = s.id and pg.status = 'pago' and pg.pago_em < ${inicio(p)})
            and (s.canceled_at is null or s.canceled_at >= ${inicio(p)})
            and not (s.status = 'expirada' and s.updated_at < ${inicio(p)})) as base,
        (select count(*)::int from subscriptions s join users u on u.id = s.user_id and u.role = 'user'
          where s.provider <> 'cortesia' and s.canceled_at >= ${inicio(p)}
            and exists (select 1 from payments pg where pg.subscription_id = s.id and pg.status = 'pago')) as cancelados,
        (select count(*)::int from subscriptions s join users u on u.id = s.user_id and u.role = 'user'
          where s.canceled_at >= ${inicio(p)}
            and not exists (select 1 from payments pg where pg.subscription_id = s.id and pg.status = 'pago')) as cancelados_teste`,
    sql<Comparativo[]>`
      select count(*) filter (where created_at >= ${inicio(p)})::int as atual,
             count(*) filter (where created_at < ${inicio(p)})::int as anterior
      from users where role = 'user' and deleted_at is null and created_at >= ${inicio(p, 1)}`,
    sql<Comparativo[]>`
      select count(*) filter (where created_at >= ${inicio(p)})::int as atual,
             count(*) filter (where created_at < ${inicio(p)})::int as anterior
      from leads where created_at >= ${inicio(p, 1)}`,
    sql<Comparativo[]>`
      select coalesce(sum(valor_centavos) filter (where pago_em >= ${inicio(p)}), 0)::int as atual,
             coalesce(sum(valor_centavos) filter (where pago_em < ${inicio(p)}), 0)::int as anterior
      from payments where status = 'pago' and pago_em >= ${inicio(p, 1)}`,
    sql<{ dia: string; cadastros: number; testes: number; leads: number }[]>`
      with dias as (${diasDoPeriodo(p)}),
      c as (select (created_at at time zone ${TZ})::date as dia, count(*)::int as n from users
            where role = 'user' and deleted_at is null and created_at >= ${inicio(p)} group by 1),
      t as (select (s.created_at at time zone ${TZ})::date as dia, count(*)::int as n from subscriptions s
            join users u on u.id = s.user_id and u.role = 'user' where s.trial_ends_at is not null and s.created_at >= ${inicio(p)} group by 1),
      l as (select (created_at at time zone ${TZ})::date as dia, count(*)::int as n from leads where created_at >= ${inicio(p)} group by 1)
      select to_char(d.dia, 'YYYY-MM-DD') as dia, coalesce(c.n, 0) as cadastros, coalesce(t.n, 0) as testes, coalesce(l.n, 0) as leads
      from dias d left join c on c.dia = d.dia left join t on t.dia = d.dia left join l on l.dia = d.dia order by d.dia`,
    lerConfigValor("custo_fixo_mensal_centavos"),
  ]);

  const mrrPorPlano: Record<Plano, number> = { aviso: 0, aprovado: 0 };
  let emRisco = 0;
  let pagantes = 0;
  for (const l of mrrLinhas) {
    const mensal = l.ciclo === "anual" ? precoCentavos(l.plano, "anual") / 12 : precoCentavos(l.plano, "mensal");
    if (l.status === "ativa") {
      mrrPorPlano[l.plano] += mensal * l.n;
      pagantes += l.n;
    } else emRisco += mensal * l.n;
  }
  const mrr = mrrPorPlano.aviso + mrrPorPlano.aprovado;

  return {
    porStatus,
    mrr,
    mrrPorPlano,
    emRisco,
    pagantes,
    testes: testes[0],
    conversao: { ...conversao[0], taxa: conversao[0].encerrados ? conversao[0].convertidos / conversao[0].encerrados : null },
    churn: { ...churn[0], taxa: churn[0].base ? churn[0].cancelados / churn[0].base : null },
    cadastros: cadastros[0],
    leads: leads[0],
    receita: receita[0],
    serie,
    custoFixo: Number(custoFixo),
  };
}
