import "server-only";
import { sql } from "@/lib/db";

/**
 * Push pelo Expo Push API (APNs + FCM).
 * - Envio: POST https://exp.host/--/api/v2/push/send (até 100 mensagens) → um ticket por mensagem, na mesma ordem.
 * - Recibos: POST https://exp.host/--/api/v2/push/getReceipts { ids } (até 1000), ~15 min depois.
 * - Erro "DeviceNotRegistered" (no ticket ou no recibo) → desativa o token.
 * EXPO_ACCESS_TOKEN é opcional (segurança reforçada de envio). AVISOS_MODO=log só registra no console.
 */

const URL_ENVIO = "https://exp.host/--/api/v2/push/send";
const URL_RECIBOS = "https://exp.host/--/api/v2/push/getReceipts";

export interface MensagemPush {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

export type TicketPush =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; details?: { error?: string } };

export type ReciboPush = { status: "ok" } | { status: "error"; message: string; details?: { error?: string } };

function cabecalhos(): HeadersInit {
  const h: Record<string, string> = { accept: "application/json", "accept-encoding": "gzip, deflate", "content-type": "application/json" };
  if (process.env.EXPO_ACCESS_TOKEN) h.authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  return h;
}

export function modoLog(): boolean {
  return process.env.AVISOS_MODO === "log";
}

/** Envia mensagens (em lotes de 100). Devolve um ticket por mensagem, na mesma ordem. */
export async function enviarPush(mensagens: MensagemPush[]): Promise<TicketPush[]> {
  if (modoLog()) {
    for (const m of mensagens) console.info(`[push:log] ${m.to} · ${m.title} · ${m.body}`);
    return mensagens.map((_, i) => ({ status: "ok" as const, id: `log-${Date.now()}-${i}` }));
  }
  const tickets: TicketPush[] = [];
  for (let i = 0; i < mensagens.length; i += 100) {
    const lote = mensagens.slice(i, i + 100);
    const r = await fetch(URL_ENVIO, { method: "POST", headers: cabecalhos(), body: JSON.stringify(lote), signal: AbortSignal.timeout(30_000) });
    const j = (await r.json().catch(() => null)) as { data?: TicketPush[]; errors?: { message: string }[] } | null;
    if (!r.ok || !j?.data) throw new Error(`Expo push ${r.status}: ${j?.errors?.map((e) => e.message).join("; ") ?? "resposta inválida"}`);
    tickets.push(...j.data);
  }
  return tickets;
}

/** Busca recibos (em lotes de 1000). */
export async function buscarRecibos(ids: string[]): Promise<Record<string, ReciboPush>> {
  const out: Record<string, ReciboPush> = {};
  for (let i = 0; i < ids.length; i += 1000) {
    const r = await fetch(URL_RECIBOS, { method: "POST", headers: cabecalhos(), body: JSON.stringify({ ids: ids.slice(i, i + 1000) }), signal: AbortSignal.timeout(30_000) });
    const j = (await r.json().catch(() => null)) as { data?: Record<string, ReciboPush>; errors?: { message: string }[] } | null;
    if (!r.ok || !j?.data) throw new Error(`Expo recibos ${r.status}: ${j?.errors?.map((e) => e.message).join("; ") ?? "resposta inválida"}`);
    Object.assign(out, j.data);
  }
  return out;
}

export interface AlertaParaPush {
  id: string;
  user_id: string;
  contest_id: string | null;
  tipo: string;
  titulo: string;
  corpo: string;
  url_oficial: string;
}

/** Envia o push de um aviso para todos os aparelhos ativos da pessoa e guarda os tickets. */
export async function enviarAlertaPush(a: AlertaParaPush): Promise<{ status: "enviado" | "falhou" | "suprimido"; erro: string | null; tickets: number }> {
  const aparelhos = await sql<{ id: string; expo_push_token: string }[]>`
    select id, expo_push_token from devices where user_id = ${a.user_id} and ativo`;
  if (!aparelhos.length) return { status: "suprimido", erro: "sem aparelho ativo", tickets: 0 };
  const data = { alertId: a.id, tipo: a.tipo, contestId: a.contest_id, url_oficial: a.url_oficial, rota: a.contest_id ? `/concursos/${a.contest_id}` : "/hoje" };
  const tickets = await enviarPush(
    aparelhos.map((d) => ({ to: d.expo_push_token, title: a.titulo, body: a.corpo, data, sound: "default", priority: "high", channelId: "avisos" })),
  );
  let ok = 0;
  const erros: string[] = [];
  for (const [i, t] of tickets.entries()) {
    const d = aparelhos[i];
    if (t.status === "ok") {
      ok++;
      if (!modoLog()) await sql`insert into push_tickets (alert_id, device_id, ticket_id) values (${a.id}, ${d.id}, ${t.id}) on conflict (ticket_id) do nothing`;
    } else {
      erros.push(t.details?.error ?? t.message);
      if (t.details?.error === "DeviceNotRegistered") await sql`update devices set ativo = false where id = ${d.id}`;
    }
  }
  return { status: ok ? "enviado" : "falhou", erro: erros.length ? erros.join("; ").slice(0, 500) : null, tickets: ok };
}

/** Confere os recibos dos tickets pendentes (15 min a 24 h) e desativa aparelhos que saíram. */
export async function conferirRecibos(agora: Date = new Date()): Promise<{ conferidos: number; erros: number; desativados: number }> {
  const pend = await sql<{ id: string; ticket_id: string; device_id: string | null; alert_id: string | null }[]>`
    select id, ticket_id, device_id, alert_id from push_tickets
    where status = 'pendente' and created_at <= ${agora}::timestamptz - interval '15 minutes'
      and created_at >= ${agora}::timestamptz - interval '24 hours'
    order by created_at limit 5000`;
  if (!pend.length) return { conferidos: 0, erros: 0, desativados: 0 };
  const recibos = await buscarRecibos(pend.map((p) => p.ticket_id));
  let erros = 0;
  let desativados = 0;
  for (const p of pend) {
    const r = recibos[p.ticket_id];
    if (!r) continue; // ainda não pronto
    if (r.status === "ok") {
      await sql`update push_tickets set status = 'ok', checked_at = now() where id = ${p.id}`;
      continue;
    }
    erros++;
    const codigo = r.details?.error ?? r.message;
    await sql`update push_tickets set status = 'erro', erro = ${codigo}, checked_at = now() where id = ${p.id}`;
    if (r.details?.error === "DeviceNotRegistered" && p.device_id) {
      const res = await sql`update devices set ativo = false where id = ${p.device_id} and ativo`;
      desativados += res.count;
    }
    if (p.alert_id) {
      // Se nenhum ticket do aviso deu certo, o aviso falhou.
      await sql`update alerts set status = 'falhou', erro = ${`recibo: ${codigo}`}
                where id = ${p.alert_id} and not exists (select 1 from push_tickets t where t.alert_id = ${p.alert_id} and t.status <> 'erro')`;
    }
  }
  return { conferidos: Object.keys(recibos).length, erros, desativados };
}
