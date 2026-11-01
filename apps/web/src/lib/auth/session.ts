import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { sql } from "@/lib/db";

export const COOKIE_SESSAO = "ac_sessao";
const DURACAO_DIAS = 30;

function segredo() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET ausente ou curto demais");
  return new TextEncoder().encode(s);
}

export interface SessaoUsuario {
  id: string;
  nome: string;
  email: string;
  role: "user" | "editor" | "admin";
  sessaoId: string;
}

/** Cria a sessão no banco e devolve o token assinado. */
export async function criarSessao(userId: string, cliente: "web" | "app", userAgent?: string | null) {
  const expira = new Date(Date.now() + DURACAO_DIAS * 86_400_000);
  const [s] = await sql<{ id: string }[]>`
    insert into sessions (user_id, cliente, user_agent, expires_at)
    values (${userId}, ${cliente}, ${userAgent ?? null}, ${expira}) returning id`;
  await sql`update users set ultimo_acesso_em = now() where id = ${userId}`;
  const token = await new SignJWT({ sid: s.id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expira)
    .sign(segredo());
  return { token, expira };
}

export async function definirCookieSessao(token: string, expira: Date) {
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

export async function validarToken(token: string): Promise<SessaoUsuario | null> {
  try {
    const { payload } = await jwtVerify(token, segredo());
    const sid = payload.sid as string | undefined;
    if (!sid || !payload.sub) return null;
    const [u] = await sql<SessaoUsuario[]>`
      select u.id, u.nome, u.email::text as email, u.role, s.id as "sessaoId"
      from sessions s join users u on u.id = s.user_id
      where s.id = ${sid} and s.user_id = ${payload.sub} and s.revoked_at is null
        and s.expires_at > now() and u.deleted_at is null`;
    return u ?? null;
  } catch {
    return null;
  }
}

/** Lê a sessão do header Authorization (app) ou do cookie (site). */
export async function sessaoAtual(): Promise<SessaoUsuario | null> {
  const h = await headers();
  const auth = h.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return validarToken(auth.slice(7).trim());
  const c = (await cookies()).get(COOKIE_SESSAO)?.value;
  return c ? validarToken(c) : null;
}

export async function encerrarSessao(sessaoId: string) {
  await sql`update sessions set revoked_at = now() where id = ${sessaoId}`;
  try {
    (await cookies()).delete(COOKIE_SESSAO);
  } catch {
    /* fora de contexto de resposta */
  }
}
