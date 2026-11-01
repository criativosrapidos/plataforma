import { z } from "zod";
import { sql } from "@/lib/db";
import { conferirSenha } from "@/lib/auth/password";
import { criarSessao, definirCookieSessao } from "@/lib/auth/session";
import { usuarioPorId } from "@/lib/repo/usuarios";
import { ErroApi, lerJson, ok, rota } from "@/lib/api";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
  cliente: z.enum(["web", "app"]).default("app"),
});

export const POST = rota(async (req: Request) => {
  const d = await lerJson(req, Schema);
  const [u] = await sql<{ id: string; senha_hash: string }[]>`
    select id, senha_hash from users where email = ${d.email} and deleted_at is null`;
  if (!u || !(await conferirSenha(d.senha, u.senha_hash))) {
    throw new ErroApi(401, "credenciais_invalidas", "E-mail ou senha incorretos.");
  }
  const { token, expira } = await criarSessao(u.id, d.cliente, req.headers.get("user-agent"));
  if (d.cliente === "web") await definirCookieSessao(token, expira);
  return ok({ token, usuario: await usuarioPorId(u.id) });
});
