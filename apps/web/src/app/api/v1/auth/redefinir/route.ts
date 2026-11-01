import { createHash } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { hashSenha } from "@/lib/auth/password";
import { criarSessao, definirCookieSessao } from "@/lib/auth/session";
import { usuarioPorId } from "@/lib/repo/usuarios";
import { enviarEmail } from "@/lib/email";
import { ErroApi, lerJson, ok, rota } from "@/lib/api";

const Schema = z.object({
  token: z.string().trim().min(20, "Link inválido").max(200, "Link inválido"),
  senha: z.string().min(8, "Mínimo de 8 caracteres").max(200, "Senha longa demais"),
  cliente: z.enum(["web", "app"]).default("web"),
});

/**
 * Cria a nova senha a partir do link do e-mail. O token é de uso único e vale 1 hora.
 * Ao trocar, todas as sessões abertas são encerradas e uma nova é criada para quem redefiniu.
 */
export const POST = rota(async (req: Request) => {
  const d = await lerJson(req, Schema);
  const hash = createHash("sha256").update(d.token).digest("hex");
  const novaHash = await hashSenha(d.senha);
  const userId = await sql.begin(async (tx) => {
    const [r] = await tx<{ user_id: string }[]>`
      select pr.user_id from password_resets pr join users u on u.id = pr.user_id
      where pr.token_hash = ${hash} and pr.used_at is null and pr.expires_at > now() and u.deleted_at is null
      for update of pr`;
    if (!r) throw new ErroApi(400, "link_invalido", "Este link expirou ou já foi usado. Peça um novo.");
    await tx`update password_resets set used_at = now() where user_id = ${r.user_id} and used_at is null`;
    await tx`update users set senha_hash = ${novaHash}, updated_at = now() where id = ${r.user_id}`;
    await tx`update sessions set revoked_at = now() where user_id = ${r.user_id} and revoked_at is null`;
    await tx`insert into audit_log (actor_id, acao, entidade, entidade_id) values (${r.user_id}, 'senha_redefinida', 'user', ${r.user_id})`;
    return r.user_id;
  });

  const usuario = await usuarioPorId(userId);
  const { token, expira } = await criarSessao(userId, d.cliente, req.headers.get("user-agent"));
  if (d.cliente === "web") await definirCookieSessao(token, expira);
  if (usuario) {
    after(() =>
      enviarEmail({
        para: usuario.email,
        assunto: "Sua senha foi alterada · Aviso Concurso",
        texto: `Oi, ${usuario.nome.split(" ")[0]}. A senha da sua conta no Aviso Concurso foi alterada agora e as outras sessões foram encerradas. Se não foi você, responda este e-mail.`,
        html: `<p>Oi, ${usuario.nome.split(" ")[0]}.</p><p>A senha da sua conta no Aviso Concurso foi alterada agora e as outras sessões foram encerradas.</p><p>Se não foi você, responda este e-mail.</p>`,
      }),
    );
  }
  return ok({ token, usuario });
});
