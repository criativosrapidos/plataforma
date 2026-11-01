import "server-only";
import { sql, type Tx } from "@/lib/db";
import { enviarEmail } from "@/lib/email";
import { assinaturaAtual } from "@/lib/repo/assinaturas";
import { appUrl, configNumero, horaBR, inicioDoMesBR, instanteBR } from "@/lib/pipeline/config";
import {
  calcularAcesso, canaisPermitidos, dataBR, emHorarioSilencioso, hojeISO, somarDias,
  type Acesso, type AlertCanal, type AlertTipo,
} from "@aviso/shared";
import { enviarAlertaPush, modoLog } from "./push";
import { enviarTemplateWhatsapp } from "./whatsapp";

/**
 * Despacho de avisos.
 * 1) enfileirarAviso decide os canais com `canaisPermitidos` (acesso, plano, ajustes, limite do WhatsApp) e grava
 *    uma linha em `alerts` por canal, com dedup_key único por canal (rodar 2x não manda 2x).
 * 2) enviarPendentes manda push/WhatsApp/e-mail. Horário silencioso ADIA (agendado_para), não descarta.
 *    No envio, o acesso é conferido de novo: sem teste/assinatura em dia, nada de aviso de concurso sai.
 */

export interface NovoAviso {
  userId: string;
  contestId: string | null;
  tipo: AlertTipo;
  titulo: string;
  corpo: string;
  /** Link oficial (obrigatório em todo aviso). */
  urlOficial: string;
  /** Chave de deduplicação (sem o canal). */
  dedupKey: string;
  /** Dias até o fim do prazo (WhatsApp só vale para "acaba amanhã"). */
  diasAteFim?: number;
}

export interface ContextoUsuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  whatsapp_optin: boolean;
  push_on: boolean;
  whatsapp_on: boolean;
  silencio_inicio: string | null;
  silencio_fim: string | null;
  acesso: Acesso;
}

export async function contextoUsuario(userId: string, agora: Date = new Date(), tx: Tx = sql): Promise<ContextoUsuario | null> {
  const [u] = await tx<Omit<ContextoUsuario, "acesso">[]>`
    select u.id, u.nome, u.email::text as email, u.telefone, u.whatsapp_optin,
      coalesce(s.push_on, true) as push_on, coalesce(s.whatsapp_on, false) as whatsapp_on,
      to_char(coalesce(s.silencio_inicio, '22:00'::time), 'HH24:MI') as silencio_inicio,
      to_char(coalesce(s.silencio_fim, '07:00'::time), 'HH24:MI') as silencio_fim
    from users u left join user_settings s on s.user_id = u.id
    where u.id = ${userId} and u.deleted_at is null`;
  if (!u) return null;
  const sub = await assinaturaAtual(userId, tx);
  return { ...u, acesso: calcularAcesso(sub, agora) };
}

/** Se agora é horário silencioso da pessoa, quando ele acaba (horário de Brasília). */
export function fimDoSilencio(agora: Date, inicio: string | null, fim: string | null): Date | null {
  if (!emHorarioSilencioso(horaBR(agora), inicio, fim) || !fim) return null;
  const hoje = hojeISO(agora);
  const hojeFim = instanteBR(hoje, fim);
  return hojeFim > agora ? hojeFim : instanteBR(somarDias(hoje, 1), fim);
}

async function whatsappNoMes(tx: Tx, userId: string, agora: Date): Promise<number> {
  const [r] = await tx<{ n: number }[]>`
    select count(*)::int as n from alerts
    where user_id = ${userId} and canal = 'whatsapp' and status in ('pendente', 'enviado')
      and created_at >= ${inicioDoMesBR(agora)}::timestamptz`;
  return r.n;
}

/** Grava o aviso nos canais permitidos. Devolve os canais em que uma linha nova foi criada. */
export async function enfileirarAviso(a: NovoAviso, opts: { agora?: Date } = {}): Promise<{ canais: AlertCanal[]; criados: AlertCanal[] }> {
  if (!a.urlOficial || !/^https?:\/\//.test(a.urlOficial)) throw new Error(`Aviso sem url_oficial (${a.dedupKey})`);
  const agora = opts.agora ?? new Date();
  return sql.begin(async (tx) => {
    // Serializa por pessoa: o limite mensal do WhatsApp não estoura com jobs em paralelo.
    await tx`select pg_advisory_xact_lock(hashtextextended(${`avisos:${a.userId}`}, 0))`;
    const ctx = await contextoUsuario(a.userId, agora, tx);
    if (!ctx) return { canais: [], criados: [] };
    const canais = canaisPermitidos({
      acesso: ctx.acesso,
      tipo: a.tipo,
      pushOn: ctx.push_on,
      whatsappOn: ctx.whatsapp_on,
      whatsappOptin: ctx.whatsapp_optin && !!ctx.telefone,
      whatsappEnviadosNoMes: await whatsappNoMes(tx, a.userId, agora),
      diasAteFim: a.diasAteFim,
    });
    const adiar = fimDoSilencio(agora, ctx.silencio_inicio, ctx.silencio_fim);
    const criados: AlertCanal[] = [];
    for (const canal of canais) {
      const imediato = canal === "inapp";
      const agendado = canal === "push" || canal === "whatsapp" ? adiar : null;
      const [r] = await tx<{ id: string }[]>`
        insert into alerts (user_id, contest_id, tipo, canal, titulo, corpo, url_oficial, dedup_key, status, enviado_em, agendado_para, created_at)
        values (${a.userId}, ${a.contestId}, ${a.tipo}, ${canal}, ${a.titulo}, ${a.corpo}, ${a.urlOficial}, ${a.dedupKey},
                ${imediato ? "enviado" : "pendente"}, ${imediato ? agora : null}, ${agendado}, ${agora})
        on conflict (dedup_key, canal) do nothing
        returning id`;
      if (r) criados.push(canal);
    }
    return { canais, criados };
  });
}

/** Enfileira vários avisos; devolve quantas pessoas receberam pelo menos uma linha nova. */
export async function enfileirarVarios(avisos: NovoAviso[], opts: { agora?: Date } = {}): Promise<number> {
  let n = 0;
  for (const a of avisos) {
    const r = await enfileirarAviso(a, opts);
    if (r.criados.length) n++;
  }
  return n;
}

interface AlertaPendente {
  id: string;
  user_id: string;
  contest_id: string | null;
  tipo: AlertTipo;
  canal: AlertCanal;
  titulo: string;
  corpo: string;
  url_oficial: string;
  tentativas: number;
}

const MAX_TENTATIVAS = 5;

async function finalizar(id: string, status: "enviado" | "falhou" | "suprimido", erro: string | null, custo = 0, agora = new Date()) {
  await sql`update alerts set status = ${status}, erro = ${erro}, custo_centavos = ${custo},
            enviado_em = ${status === "enviado" ? agora : null}, agendado_para = null where id = ${id}`;
}

async function parametrosWhatsapp(a: AlertaPendente): Promise<string[]> {
  const tipoData = a.tipo === "isencao_acabando" ? "isencao" : "inscricao";
  const [c] = await sql<{ nome: string; fim: string | null }[]>`
    select coalesce(c.orgao_sigla, c.orgao) as nome,
      (select d.fim from contest_dates d where d.contest_id = c.id and d.tipo = ${tipoData} order by d.fim desc nulls last limit 1) as fim
    from contests c where c.id = ${a.contest_id}`;
  return [a.tipo === "isencao_acabando" ? "isenção da taxa" : "inscrição", c?.nome ?? "acompanhado", c?.fim ? dataBR(c.fim) : "amanhã", a.url_oficial];
}

function htmlEmail(a: AlertaPendente): string {
  return `<div style="font-family:Arial,sans-serif;color:#0F1530;max-width:560px">
<h2 style="font-size:20px;margin:0 0 12px">${a.titulo}</h2>
<p style="font-size:15px;line-height:1.5">${a.corpo}</p>
<p><a href="${a.url_oficial}" style="color:#1F3FD1">${a.url_oficial}</a></p>
<p style="font-size:12px;color:#4F566E">Aviso Concurso · <a href="${appUrl()}/conta" style="color:#4F566E">gerenciar avisos</a></p></div>`;
}

/**
 * Envia avisos pendentes (push, WhatsApp, e-mail) cujo horário chegou.
 * Cada aviso é "reservado" por 10 minutos antes do envio: dois jobs ao mesmo tempo não mandam em dobro.
 */
export async function enviarPendentes(opts: { agora?: Date; limite?: number; userId?: string } = {}) {
  const agora = opts.agora ?? new Date();
  const res = { enviados: 0, adiados: 0, suprimidos: 0, falhas: 0, push: 0, whatsapp: 0, email: 0 };
  const candidatos = await sql<{ id: string }[]>`
    select id from alerts
    where status = 'pendente' and canal in ('push', 'whatsapp', 'email')
      and (agendado_para is null or agendado_para <= ${agora}::timestamptz)
      ${opts.userId ? sql`and user_id = ${opts.userId}` : sql``}
    order by created_at limit ${opts.limite ?? 500}`;
  for (const { id } of candidatos) {
    const [a] = await sql<AlertaPendente[]>`
      update alerts set tentativas = tentativas + 1, agendado_para = ${agora}::timestamptz + interval '10 minutes'
      where id = ${id} and status = 'pendente' and (agendado_para is null or agendado_para <= ${agora}::timestamptz)
      returning id, user_id, contest_id, tipo, canal, titulo, corpo, url_oficial, tentativas`;
    if (!a) continue; // outro processo pegou
    try {
      const ctx = await contextoUsuario(a.user_id, agora);
      if (!ctx) {
        await finalizar(a.id, "suprimido", "conta inexistente", 0, agora);
        res.suprimidos++;
        continue;
      }
      if (a.tipo !== "cobranca_amanha" && !ctx.acesso.liberado) {
        await finalizar(a.id, "suprimido", "sem teste ou assinatura em dia", 0, agora);
        res.suprimidos++;
        continue;
      }
      if (a.canal === "push" || a.canal === "whatsapp") {
        const adiar = fimDoSilencio(agora, ctx.silencio_inicio, ctx.silencio_fim);
        if (adiar) {
          await sql`update alerts set agendado_para = ${adiar}, tentativas = greatest(tentativas - 1, 0) where id = ${a.id}`;
          res.adiados++;
          continue;
        }
      }
      if (a.canal === "push") {
        if (!ctx.push_on) {
          await finalizar(a.id, "suprimido", "push desligado", 0, agora);
          res.suprimidos++;
          continue;
        }
        const r = await enviarAlertaPush(a);
        await finalizar(a.id, r.status, r.erro, 0, agora);
        if (r.status === "enviado") {
          res.enviados++;
          res.push++;
        } else if (r.status === "suprimido") res.suprimidos++;
        else res.falhas++;
      } else if (a.canal === "whatsapp") {
        if (ctx.acesso.plano !== "aprovado" || !ctx.whatsapp_on || !ctx.whatsapp_optin || !ctx.telefone) {
          await finalizar(a.id, "suprimido", "WhatsApp não permitido para a pessoa", 0, agora);
          res.suprimidos++;
          continue;
        }
        const r = await enviarTemplateWhatsapp({ para: ctx.telefone, parametros: await parametrosWhatsapp(a) });
        if (r.ok) {
          await finalizar(a.id, "enviado", null, modoLog() ? 0 : await configNumero("custo_whatsapp_centavos"), agora);
          res.enviados++;
          res.whatsapp++;
        } else if (r.permanente || a.tentativas >= MAX_TENTATIVAS) {
          await finalizar(a.id, r.permanente && /não configurado/.test(r.erro) ? "suprimido" : "falhou", r.erro, 0, agora);
          res.falhas++;
        } else {
          await sql`update alerts set erro = ${r.erro}, agendado_para = ${agora}::timestamptz + make_interval(mins => ${15 * a.tentativas}) where id = ${a.id}`;
          res.falhas++;
        }
      } else if (a.canal === "email") {
        const r = await enviarEmail({ para: ctx.email, assunto: a.titulo, html: htmlEmail(a), texto: `${a.corpo}\n\n${a.url_oficial}` });
        await finalizar(a.id, r.ok ? "enviado" : "falhou", r.erro ?? null, r.ok ? await configNumero("custo_email_centavos") : 0, agora);
        if (r.ok) {
          res.enviados++;
          res.email++;
        } else res.falhas++;
      }
    } catch (e) {
      const msg = (e as Error).message;
      if (a.tentativas >= MAX_TENTATIVAS) await finalizar(a.id, "falhou", msg, 0, agora);
      else await sql`update alerts set erro = ${msg} where id = ${a.id}`;
      res.falhas++;
    }
  }
  return res;
}
