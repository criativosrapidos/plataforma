import { z } from "zod";
import { sql } from "@/lib/db";
import { hashSenha } from "@/lib/auth/password";
import { criarSessao, definirCookieSessao } from "@/lib/auth/session";
import { usuarioPorId } from "@/lib/repo/usuarios";
import { ErroApi, lerJson, ok, rota } from "@/lib/api";

const Schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(8, "Mínimo de 8 caracteres").max(200),
  aceito_termos: z.literal(true, { message: "Aceite os termos para continuar" }),
  cliente: z.enum(["web", "app"]).default("app"),
});

export const POST = rota(async (req: Request) => {
  const d = await lerJson(req, Schema);
  const [existe] = await sql`select 1 from users where email = ${d.email}`;
  if (existe) throw new ErroApi(409, "email_em_uso", "Já existe uma conta com este e-mail.", { email: "E-mail já cadastrado" });
  const [u] = await sql<{ id: string }[]>`
    insert into users (nome, email, senha_hash, termos_aceitos_em) values (${d.nome}, ${d.email}, ${await hashSenha(d.senha)}, now())
    returning id`;
  await sql`insert into user_settings (user_id) values (${u.id})`;
  const { token, expira } = await criarSessao(u.id, d.cliente, req.headers.get("user-agent"));
  if (d.cliente === "web") await definirCookieSessao(token, expira);
  return ok({ token, usuario: await usuarioPorId(u.id) }, 201);
});
