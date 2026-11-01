import "server-only";
import { sql } from "@/lib/db";
import { billing } from "@/lib/billing";
import { enfileirarAviso, enfileirarVarios, enviarPendentes, type NovoAviso } from "@/lib/notify/despachar";
import { conferirRecibos } from "@/lib/notify/push";
import { jobResumoSemanal } from "@/lib/notify/resumo-semanal";
import { textoCobrancaAmanha, textoConvocacao, textoDataDoDia, textoPrazo, textoProvaAmanha } from "@/lib/notify/textos";
import {
  calcularAcesso, hojeISO, lembretesDoDia, normalizar, precoCentavos, somarDias, temRecurso,
  DIAS_TOLERANCIA_INADIMPLENCIA, PLANO_INFO,
  type AssinaturaLike, type Ciclo, type DateTipo, type Plano,
} from "@aviso/shared";
import { fontesVencidas, rodarFonteImpl } from "./coletores";
import { appUrl } from "./config";
import { processarPendentes } from "./processar";

/** Jobs agendados (Vercel Cron → /api/cron/<nome>; local: npx tsx scripts/job.ts <nome>). */
export const JOBS = [
  "coletar-dou",
  "coletar-bancas",
  "coletar-municipais",
  "processar",
  "lembretes",
  "cobrancas",
  "push-receipts",
  "resumo-semanal",
  "convocacoes",
  "enviar-avisos",
] as const;
export type NomeJob = (typeof JOBS)[number];

export function ehJob(nome: string): nome is NomeJob {
  return (JOBS as readonly string[]).includes(nome);
}

export interface OpcoesJob {
  agora?: Date;
  /** Data de coleta AAAA-MM-DD (DOU, Querido Diário). */
  data?: string;
  limite?: number;
}

// ---------- Lembretes de prazo ----------

/**
 * Prazos de quem acompanha: isenção/inscrição na antecedência escolhida (1/2/3/5 dias) e na véspera,
 * "prova amanhã", e o dia do local de prova/gabarito/resultado. Idempotente por dia (dedup inclui a data-alvo).
 */
export async function jobLembretes(agora: Date = new Date()) {
  const hoje = hojeISO(agora);
  const linhas = await sql<{
    user_id: string; contest_id: string; orgao: string; orgao_sigla: string | null; url_oficial: string;
    tipo: DateTipo; inicio: string | null; fim: string | null; antecedencia: number;
  }[]>`
    select f.user_id, c.id as contest_id, c.orgao, c.orgao_sigla, c.url_oficial, d.tipo, d.inicio, d.fim,
      coalesce(s.antecedencia_dias, 3)::int as antecedencia
    from follows f
    join users u on u.id = f.user_id and u.deleted_at is null
    join contests c on c.id = f.contest_id and c.publicado and c.status <> 'cancelado'
    join contest_dates d on d.contest_id = c.id
    left join user_settings s on s.user_id = f.user_id
    where d.tipo in ('isencao', 'inscricao', 'prova', 'local_prova', 'gabarito', 'resultado')
      and coalesce(d.fim, d.inicio) between ${hoje}::date and ${somarDias(hoje, 5)}::date`;
  const avisos: (NovoAviso & { diasAteFim?: number })[] = [];
  for (const l of linhas) {
    const c = { orgao: l.orgao, orgao_sigla: l.orgao_sigla };
    const alvo = l.fim ?? l.inicio!;
    for (const lem of lembretesDoDia({ tipo: l.tipo, inicio: l.inicio, fim: l.fim }, hoje, l.antecedencia)) {
      const texto = lem.tipo === "prova_amanha" ? textoProvaAmanha(c, alvo) : textoPrazo(lem.tipo, c, alvo, lem.diasAteFim);
      avisos.push({
        userId: l.user_id, contestId: l.contest_id, tipo: lem.tipo, ...texto, urlOficial: l.url_oficial, diasAteFim: lem.diasAteFim,
        dedupKey: `${lem.tipo}:${l.contest_id}:${alvo}:${lem.diasAteFim}:${l.user_id}`,
      });
    }
    if ((l.tipo === "local_prova" || l.tipo === "gabarito" || l.tipo === "resultado") && (l.inicio ?? l.fim) === hoje) {
      avisos.push({
        userId: l.user_id, contestId: l.contest_id, tipo: l.tipo, ...textoDataDoDia(l.tipo, c), urlOficial: l.url_oficial,
        dedupKey: `${l.tipo}:${l.contest_id}:${hoje}:${l.user_id}`,
      });
    }
  }
  const avisados = await enfileirarVarios(avisos, { agora });
  return { candidatos: avisos.length, avisados };
}

// ---------- Cobranças ----------

/**
 * - Push/e-mail "cobrança amanhã" 1 dia antes do fim do teste (aviso_cobranca_enviado_em).
 * - Teste vencido sem pagamento (24 h de folga para o webhook) → expirada e cancela no provedor.
 * - Assinatura vencida sem renovação → inadimplente; inadimplente após a tolerância → expirada.
 */
export async function jobCobrancas(agora: Date = new Date()) {
  const r = { avisos: 0, testesExpirados: 0, inadimplentes: 0, expirados: 0, errosProvedor: [] as string[] };
  const trials = await sql<{ id: string; user_id: string; plano: Plano; ciclo: Ciclo; trial_ends_at: Date }[]>`
    select id, user_id, plano, ciclo, trial_ends_at from subscriptions
    where status = 'trial' and not cancel_at_period_end and aviso_cobranca_enviado_em is null
      and trial_ends_at > ${agora}::timestamptz and trial_ends_at <= ${agora}::timestamptz + interval '1 day'`;
  for (const s of trials) {
    const texto = textoCobrancaAmanha(PLANO_INFO[s.plano].nome, precoCentavos(s.plano, s.ciclo), hojeISO(s.trial_ends_at));
    await enfileirarAviso(
      { userId: s.user_id, contestId: null, tipo: "cobranca_amanha", ...texto, urlOficial: `${appUrl()}/conta/assinatura`, dedupKey: `cobranca_amanha:${s.id}:${s.trial_ends_at.toISOString().slice(0, 10)}` },
      { agora },
    );
    await sql`update subscriptions set aviso_cobranca_enviado_em = ${agora}, updated_at = now() where id = ${s.id}`;
    r.avisos++;
  }
  const cancelarNoProvedor = async (subs: { provider: string; provider_subscription_id: string | null }[]) => {
    for (const s of subs) {
      if (!s.provider_subscription_id || s.provider === "mock") continue;
      try {
        const p = await billing();
        if (p.nome === s.provider) await p.cancelarAssinatura(s.provider_subscription_id);
      } catch (e) {
        r.errosProvedor.push(`${s.provider_subscription_id}: ${(e as Error).message}`);
      }
    }
  };
  const testes = await sql<{ provider: string; provider_subscription_id: string | null }[]>`
    update subscriptions s set status = 'expirada', updated_at = now()
    where s.status = 'trial' and s.trial_ends_at < ${agora}::timestamptz - interval '1 day'
      and not exists (select 1 from payments p where p.subscription_id = s.id and p.status = 'pago')
    returning provider, provider_subscription_id`;
  r.testesExpirados = testes.length;
  await cancelarNoProvedor(testes);
  const vencidas = await sql`
    update subscriptions set status = 'inadimplente', updated_at = now()
    where status = 'ativa' and not cancel_at_period_end and current_period_end < ${agora}::timestamptz - interval '1 day'
    returning id`;
  r.inadimplentes = vencidas.length;
  const expiradas = await sql<{ provider: string; provider_subscription_id: string | null }[]>`
    update subscriptions set status = 'expirada', updated_at = now()
    where status = 'inadimplente'
      and coalesce(current_period_end, trial_ends_at) + make_interval(days => ${DIAS_TOLERANCIA_INADIMPLENCIA}) < ${agora}::timestamptz
    returning provider, provider_subscription_id`;
  r.expirados = expiradas.length;
  await cancelarNoProvedor(expiradas);
  return r;
}

// ---------- Convocação nominal (plano Aprovado) ----------

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Procura o nome (nome_busca) de quem é Aprovado e autorizou (busca_nominal_optin) nos atos coletados
 * nos últimos dias (nomeação, convocação, posse, homologação) e avisa com o link oficial.
 */
export async function jobConvocacoes(agora: Date = new Date(), dias = 2) {
  const pessoas = await sql<{ id: string; nome_busca: string }[]>`
    select id, nome_busca from users where busca_nominal_optin and nome_busca is not null and deleted_at is null`;
  const alvos: { id: string; nome: string; re: RegExp }[] = [];
  for (const p of pessoas) {
    const [sub] = await sql<AssinaturaLike[]>`
      select plano, status, trial_ends_at, current_period_end from subscriptions where user_id = ${p.id}
      order by (status in ('trial','ativa','inadimplente')) desc, created_at desc limit 1`;
    if (!temRecurso(calcularAcesso(sub, agora), "convocacao_nominal")) continue;
    const nome = normalizar(p.nome_busca).replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();
    if (nome.split(" ").length < 2 || nome.length < 8) continue; // nome curto demais = falso positivo
    alvos.push({ id: p.id, nome: p.nome_busca.trim(), re: new RegExp(`(^|[^a-z])${escaparRegex(nome).replace(/ /g, "\\s+")}([^a-z]|$)`) });
  }
  if (!alvos.length) return { pessoas: 0, documentos: 0, avisados: 0 };
  const docs = await sql<{ id: string; url: string; titulo: string | null; conteudo_texto: string; contest_id: string | null }[]>`
    select d.id, d.url, d.titulo, d.conteudo_texto, a.contest_id
    from raw_documents d left join acts a on a.raw_document_id = d.id
    where d.coletado_em >= ${agora}::timestamptz - make_interval(days => ${dias}) and d.conteudo_texto is not null
      and (a.tipo in ('convocacao', 'homologacao', 'resultado') or d.conteudo_texto ~* '(nomea|nomear|convoca|posse)')`;
  const avisos: NovoAviso[] = [];
  for (const d of docs) {
    const texto = normalizar(d.conteudo_texto).replace(/[^a-z0-9 \n]+/g, " ");
    for (const a of alvos) {
      if (!a.re.test(texto)) continue;
      avisos.push({
        userId: a.id, contestId: d.contest_id, tipo: "convocacao", ...textoConvocacao(a.nome, d.titulo ?? "ato publicado no Diário Oficial"),
        urlOficial: d.url, dedupKey: `convocacao:${d.id}:${a.id}`,
      });
    }
  }
  const avisados = await enfileirarVarios(avisos, { agora });
  return { pessoas: alvos.length, documentos: docs.length, avisados };
}

// ---------- Coleta ----------

async function coletarTipo(tipo: "banca" | "querido_diario", opts: OpcoesJob) {
  const out: Record<string, unknown> = {};
  for (const slug of await fontesVencidas(tipo, opts.agora)) {
    try {
      const r = await rodarFonteImpl(slug, { data: opts.data, agora: opts.agora });
      out[slug] = { encontrados: r.encontrados, novos: r.novos, avisos: r.avisos };
    } catch (e) {
      out[slug] = { erro: (e as Error).message };
    }
  }
  return out;
}

async function processarEEnviar(opts: OpcoesJob) {
  const processamento = await processarPendentes({ limite: opts.limite, agora: opts.agora });
  const envio = await enviarPendentes({ agora: opts.agora });
  return { processamento, envio };
}

// ---------- Execução ----------

async function executar(nome: NomeJob, opts: OpcoesJob): Promise<Record<string, unknown>> {
  const agora = opts.agora;
  switch (nome) {
    case "coletar-dou": {
      const r = await rodarFonteImpl("dou", { data: opts.data, agora });
      return { coleta: { encontrados: r.encontrados, novos: r.novos, avisos: r.avisos }, ...(await processarEEnviar(opts)) };
    }
    case "coletar-bancas":
      return { coleta: await coletarTipo("banca", opts), ...(await processarEEnviar(opts)) };
    case "coletar-municipais":
      return { coleta: await coletarTipo("querido_diario", opts), ...(await processarEEnviar(opts)) };
    case "processar":
      return processarEEnviar(opts);
    case "lembretes":
      return { lembretes: await jobLembretes(agora), envio: await enviarPendentes({ agora }) };
    case "cobrancas":
      return { cobrancas: await jobCobrancas(agora), envio: await enviarPendentes({ agora }) };
    case "push-receipts":
      return conferirRecibos(agora);
    case "resumo-semanal":
      return jobResumoSemanal(agora);
    case "convocacoes":
      return { convocacoes: await jobConvocacoes(agora), envio: await enviarPendentes({ agora }) };
    case "enviar-avisos":
      return enviarPendentes({ agora });
  }
}

/** Roda um job registrando a execução em job_runs. Reaproveitado pela rota de cron e por scripts/job.ts. */
export async function rodarJob(nome: NomeJob, opts: OpcoesJob = {}): Promise<{ id: string; nome: NomeJob; ok: boolean; resultado: Record<string, unknown>; erro?: string }> {
  const [run] = await sql<{ id: string }[]>`insert into job_runs (nome) values (${nome}) returning id`;
  try {
    const resultado = await executar(nome, opts);
    await sql`update job_runs set status = 'ok', terminado_em = now(), resultado = ${sql.json(resultado as never)} where id = ${run.id}`;
    return { id: run.id, nome, ok: true, resultado };
  } catch (e) {
    const erro = (e as Error).message ?? String(e);
    await sql`update job_runs set status = 'erro', terminado_em = now(), erro = ${erro} where id = ${run.id}`;
    return { id: run.id, nome, ok: false, resultado: {}, erro };
  }
}
