import "server-only";

/**
 * WhatsApp Business Cloud API (Meta), só com modelos (templates) de UTILIDADE aprovados.
 * POST https://graph.facebook.com/{versão}/{WHATSAPP_PHONE_ID}/messages
 *   { messaging_product: "whatsapp", to: "5511999990000", type: "template",
 *     template: { name, language: { code: "pt_BR" }, components: [{ type: "body", parameters: [{ type: "text", text }] }] } }
 * Resposta: { messages: [{ id: "wamid..." }] } | { error: { message, code, error_subcode } }
 *
 * Modelo a aprovar na Meta (categoria Utilidade), nome em WHATSAPP_TEMPLATE_PRAZO (padrão "prazo_acabando_amanha"):
 *   "Aviso Concurso: o prazo de {{1}} do concurso {{2}} acaba amanhã, {{3}}. Link oficial: {{4}}"
 * Só é usado para "isenção/inscrição acaba amanhã", no plano Aprovado, até 10 por mês (regra em canaisPermitidos).
 */

export function whatsappConfigurado(): boolean {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

export type ResultadoWhatsapp = { ok: true; id: string } | { ok: false; erro: string; permanente: boolean };

/** Telefone E.164 ("+5511999990000") → só dígitos, como a API espera. */
export function telefoneWhatsapp(tel: string): string | null {
  const d = tel.replace(/\D/g, "");
  return d.length >= 12 && d.length <= 15 ? d : null;
}

export async function enviarTemplateWhatsapp(p: { para: string; parametros: string[]; template?: string; idioma?: string }): Promise<ResultadoWhatsapp> {
  const para = telefoneWhatsapp(p.para);
  if (!para) return { ok: false, erro: "telefone inválido", permanente: true };
  if (process.env.AVISOS_MODO === "log") {
    console.info(`[whatsapp:log] ${para} · ${p.parametros.join(" | ")}`);
    return { ok: true, id: `log-${Date.now()}` };
  }
  if (!whatsappConfigurado()) return { ok: false, erro: "WhatsApp não configurado (WHATSAPP_TOKEN/WHATSAPP_PHONE_ID)", permanente: true };
  const versao = process.env.WHATSAPP_API_VERSION ?? "v21.0";
  const r = await fetch(`https://graph.facebook.com/${versao}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: para,
      type: "template",
      template: {
        name: p.template ?? process.env.WHATSAPP_TEMPLATE_PRAZO ?? "prazo_acabando_amanha",
        language: { code: p.idioma ?? "pt_BR" },
        components: [{ type: "body", parameters: p.parametros.map((text) => ({ type: "text", text: text.slice(0, 900) })) }],
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const j = (await r.json().catch(() => null)) as { messages?: { id: string }[]; error?: { message: string; code?: number } } | null;
  if (r.ok && j?.messages?.[0]?.id) return { ok: true, id: j.messages[0].id };
  const erro = `${r.status} ${j?.error?.message ?? "resposta inválida"}`;
  // 4xx (número inválido, template rejeitado, sem opt-in) não adianta repetir; 429/5xx sim.
  return { ok: false, erro, permanente: r.status >= 400 && r.status < 500 && r.status !== 429 };
}
