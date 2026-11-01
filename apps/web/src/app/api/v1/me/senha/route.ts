import { z } from "zod";
import { sql } from "@/lib/db";
import { conferirSenha, hashSenha } from "@/lib/auth/password";
import { ErroApi, exigirUsuario, lerJson, ok, rota } from "@/lib/api";

const Schema = z.object({
  senha_atual: z.string().min(1, "Informe a senha atual"),
  nova_senha: z.string().min(8, "Mínimo de 8 caracteres").max(200, "Senha longa demais"),
  encerrar_outras: z.boolean().default(true),
});

/** Troca a senha de quem está logado. Por padrão, encerra as outras sessões (mantém a atual). */
export const POST = rota(async (req: Request) => {
  const s = await exigirUsuario();
  const d = await lerJson(req, Schema);
  const [u] = await sql<{ senha_hash: string }[]>`select senha_hash from users where id = ${s.id} and deleted_at is null`;
  if (!u || !(await conferirSenha(d.senha_atual, u.senha_hash))) {
    throw new ErroApi(422, "senha_incorreta", "A senha atual não confere.", { senha_atual: "Senha atual incorreta" });
  }
  if (d.senha_atual === d.nova_senha) {
    throw new ErroApi(422, "senha_igual", "A nova senha precisa ser diferente da atual.", { nova_senha: "Escolha uma senha diferente da atual" });
  }
  const nova = await hashSenha(d.nova_senha);
  const encerradas = await sql.begin(async (tx) => {
    await tx`update users set senha_hash = ${nova}, updated_at = now() where id = ${s.id}`;
    const r = d.encerrar_outras
      ? await tx`update sessions set revoked_at = now() where user_id = ${s.id} and id <> ${s.sessaoId} and revoked_at is null returning id`
      : [];
    await tx`insert into audit_log (actor_id, acao, entidade, entidade_id, dados)
             values (${s.id}, 'senha_alterada', 'user', ${s.id}, ${sql.json({ sessoes_encerradas: r.length })})`;
    return r.length;
  });
  return ok({ ok: true, sessoesEncerradas: encerradas });
});
