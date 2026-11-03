import "server-only";
import { sql } from "@/lib/db";
import { contarTentativa, mensagemEspera } from "@/lib/limite";
import { conferirSenha, hashSenha } from "./password";

let hashFicticio: Promise<string> | null = null;

export type ResultadoLogin =
  | { ok: true; id: string; role: "user" | "editor" | "admin" }
  | { ok: false; codigo: "credenciais_invalidas" | "muitas_tentativas"; mensagem: string };

/**
 * Confere e-mail e senha com limite de tentativas (por IP e por e-mail) e tempo de resposta
 * igual para e-mail cadastrado ou não (não revela quem tem conta).
 */
export async function autenticar(email: string, senha: string, ip: string): Promise<ResultadoLogin> {
  const [porIp, porEmail] = await Promise.all([
    contarTentativa(`login:ip:${ip}`, 30, 15 * 60),
    contarTentativa(`login:email:${email}`, 10, 15 * 60),
  ]);
  if (porIp.bloqueado || porEmail.bloqueado) {
    return { ok: false, codigo: "muitas_tentativas", mensagem: mensagemEspera(Math.max(porIp.restamSegundos, porEmail.restamSegundos)) };
  }
  const [u] = await sql<{ id: string; role: "user" | "editor" | "admin"; senha_hash: string }[]>`
    select id, role, senha_hash from users where email = ${email} and deleted_at is null`;
  const hash = u?.senha_hash ?? (await (hashFicticio ??= hashSenha("senha-ficticia-para-igualar-o-tempo")));
  const confere = await conferirSenha(senha, hash);
  if (!u || !confere) return { ok: false, codigo: "credenciais_invalidas", mensagem: "E-mail ou senha incorretos." };
  // Login certo zera o contador do e-mail (quem erra e acerta não fica bloqueado depois).
  await sql`delete from rate_limits where chave = ${`login:email:${email}`}`;
  return { ok: true, id: u.id, role: u.role };
}
