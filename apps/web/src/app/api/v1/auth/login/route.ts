import { z } from "zod";
import { autenticar } from "@/lib/auth/login";
import { criarSessao, definirCookieSessao } from "@/lib/auth/session";
import { ipDaRequisicao } from "@/lib/limite";
import { usuarioPorId } from "@/lib/repo/usuarios";
import { ErroApi, lerJson, ok, rota } from "@/lib/api";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha").max(200),
  cliente: z.enum(["web", "app"]).default("app"),
});

export const POST = rota(async (req: Request) => {
  const d = await lerJson(req, Schema);
  const r = await autenticar(d.email, d.senha, await ipDaRequisicao());
  if (!r.ok) throw new ErroApi(r.codigo === "muitas_tentativas" ? 429 : 401, r.codigo, r.mensagem);
  const { token, expira } = await criarSessao(r.id, d.cliente, req.headers.get("user-agent"));
  if (d.cliente === "web") await definirCookieSessao(token, expira);
  return ok({ token, usuario: await usuarioPorId(r.id) });
});
