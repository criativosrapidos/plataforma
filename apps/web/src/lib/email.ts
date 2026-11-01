import "server-only";

/** Envia e-mail transacional pelo Resend. Sem RESEND_API_KEY, só registra no console (dev). */
export async function enviarEmail(p: { para: string; assunto: string; html: string; texto?: string }): Promise<{ ok: boolean; id?: string; erro?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] para=${p.para} assunto="${p.assunto}"\n${p.texto ?? p.html.replace(/<[^>]+>/g, " ").slice(0, 500)}`);
    return { ok: true, id: "dev" };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Aviso Concurso <avisos@avisoconcurso.com.br>", to: p.para, subject: p.assunto, html: p.html, text: p.texto }),
  });
  if (!r.ok) return { ok: false, erro: `${r.status} ${await r.text()}` };
  return { ok: true, id: ((await r.json()) as { id: string }).id };
}
