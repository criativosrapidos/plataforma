import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { aplicarEventoAsaas, idDoEvento, tokenWebhookValido, type EventoAsaas } from "@/lib/billing/asaas";

/**
 * Webhook do Asaas (cobranças e assinaturas).
 * - Valida o header `asaas-access-token` contra ASAAS_WEBHOOK_TOKEN.
 * - Idempotente: cada evento é registrado em webhook_events; repetido e já processado → 200 sem efeito.
 *   Além disso, payments é único por provider_payment_id.
 * - Erro ao processar → 500 (o Asaas reenvia e reprocessamos).
 */
export async function POST(req: Request) {
  if (!tokenWebhookValido(req.headers.get("asaas-access-token"))) {
    return NextResponse.json({ erro: { codigo: "nao_autorizado", mensagem: "Token do webhook inválido." } }, { status: 401 });
  }
  let evento: EventoAsaas;
  try {
    evento = (await req.json()) as EventoAsaas;
  } catch {
    return NextResponse.json({ erro: { codigo: "json_invalido", mensagem: "Corpo inválido." } }, { status: 400 });
  }
  if (!evento?.event) return NextResponse.json({ erro: { codigo: "evento_invalido", mensagem: "Evento sem tipo." } }, { status: 400 });

  const eventId = idDoEvento(evento);
  const [reg] = await sql<{ id: string; processado_em: Date | null }[]>`
    insert into webhook_events (provider, event_id, tipo, payload) values ('asaas', ${eventId}, ${evento.event}, ${sql.json(evento as never)})
    on conflict (provider, event_id) do update set tentativas = webhook_events.tentativas + 1
    returning id, processado_em`;
  if (reg.processado_em) return NextResponse.json({ ok: true, duplicado: true });
  try {
    const r = await aplicarEventoAsaas(evento);
    await sql`update webhook_events set processado_em = now(), erro = null where id = ${reg.id}`;
    return NextResponse.json({ ok: true, acao: r.acao });
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    console.error("[webhook asaas]", msg);
    await sql`update webhook_events set erro = ${msg} where id = ${reg.id}`;
    return NextResponse.json({ erro: { codigo: "erro_interno", mensagem: "Falha ao processar o evento." } }, { status: 500 });
  }
}
