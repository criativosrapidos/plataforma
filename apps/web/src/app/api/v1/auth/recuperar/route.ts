import { createHash, randomBytes } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { enviarEmail } from "@/lib/email";
import { lerJson, ok, rota } from "@/lib/api";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
});

/** Máximo de links pedidos por pessoa a cada 15 minutos. */
const LIMITE_RECENTE = 3;

const MENSAGEM = "Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. Ele vale por 1 hora.";

function emailRecuperacao(nome: string, link: string) {
  const primeiro = nome.split(" ")[0];
  const texto = `Oi, ${primeiro}.

Recebemos um pedido para criar uma nova senha no Aviso Concurso.
Use este link em até 1 hora (ele só funciona uma vez):
${link}

Se não foi você, ignore este e-mail. Sua senha continua a mesma.

Aviso Concurso`;
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F5F6F1;font-family:Figtree,Arial,sans-serif;color:#0F1530">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
  <p style="font-size:22px;font-weight:800;margin:0 0 24px"><span style="color:#1F3FD1">●</span> aviso<span style="font-weight:600">concurso</span></p>
  <div style="background:#fff;border:1px solid #E1E3EA;border-radius:20px;padding:28px">
    <h1 style="font-size:24px;margin:0 0 12px;text-transform:uppercase">Criar nova senha</h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 20px">Oi, ${primeiro}. Recebemos um pedido para criar uma nova senha. O link vale por 1 hora e só funciona uma vez.</p>
    <p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#1F3FD1;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px">Criar nova senha</a></p>
    <p style="font-size:14px;line-height:1.6;color:#4F566E;margin:0">Se não foi você, ignore este e-mail. Sua senha continua a mesma.</p>
  </div>
  <p style="font-size:12px;color:#4F566E;margin:20px 0 0">Aviso Concurso · avisoconcurso.com.br</p>
</div></body></html>`;
  return { texto, html };
}

/**
 * Pede um link de nova senha. Responde sempre igual, exista ou não a conta (não revela e-mails).
 * Guarda só o hash sha256 do token; o link expira em 1 hora e é de uso único.
 */
export const POST = rota(async (req: Request) => {
  const { email } = await lerJson(req, Schema);
  const [u] = await sql<{ id: string; nome: string }[]>`
    select id, nome from users where email = ${email} and deleted_at is null`;
  if (u) {
    const [{ recentes }] = await sql<{ recentes: number }[]>`
      select count(*)::int as recentes from password_resets
      where user_id = ${u.id} and expires_at > now() + interval '45 minutes'`;
    if (recentes < LIMITE_RECENTE) {
      const token = randomBytes(32).toString("base64url");
      const hash = createHash("sha256").update(token).digest("hex");
      await sql`delete from password_resets where user_id = ${u.id} and (used_at is not null or expires_at < now())`;
      await sql`insert into password_resets (token_hash, user_id, expires_at) values (${hash}, ${u.id}, now() + interval '1 hour')`;
      const base = process.env.APP_URL ?? new URL(req.url).origin;
      const link = `${base}/redefinir-senha?token=${token}`;
      const { texto, html } = emailRecuperacao(u.nome, link);
      // envia depois de responder, para o tempo de resposta não denunciar se o e-mail existe
      after(async () => {
        const r = await enviarEmail({ para: email, assunto: "Crie uma nova senha · Aviso Concurso", html, texto });
        if (!r.ok) console.error("[recuperar] falha ao enviar e-mail", r.erro);
      });
    }
  }
  return ok({ ok: true, mensagem: MENSAGEM });
});
