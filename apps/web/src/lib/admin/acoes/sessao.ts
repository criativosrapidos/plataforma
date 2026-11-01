"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth/guards";
import { conferirSenha } from "@/lib/auth/password";
import { criarSessao, definirCookieSessao, encerrarSessao } from "@/lib/auth/session";
import { sql } from "@/lib/db";
import { auditar } from "../audit";
import { buscaGlobal, type ResultadoBusca } from "../consultas/busca";

/** Sugestões da busca global do cabeçalho. Usuários só aparecem para admin. */
export async function buscarGlobalAcao(q: string): Promise<ResultadoBusca> {
  const s = await exigirAdmin("editor");
  if (typeof q !== "string") return { concursos: [], usuarios: [] };
  return buscaGlobal(q.slice(0, 100), s.role === "admin", 5);
}

export async function sairDoPainel() {
  const s = await exigirAdmin("editor");
  await encerrarSessao(s.sessaoId);
  redirect("/admin/entrar");
}

const destinoSeguro = (v: string) => (v.startsWith("/admin") && !v.startsWith("//") ? v : "/admin");

/** Login do painel (funciona sem JavaScript; senha nunca vai para a URL). Só editor e admin entram. */
export async function entrarNoPainel(_anterior: { erro: string } | null, fd: FormData): Promise<{ erro: string }> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const senha = String(fd.get("senha") ?? "");
  const voltar = destinoSeguro(String(fd.get("voltar") ?? "/admin"));
  if (!email || !senha) return { erro: "Informe e-mail e senha." };
  const [u] = await sql<{ id: string; role: string; senha_hash: string }[]>`
    select id, role, senha_hash from users where email = ${email} and deleted_at is null`;
  if (!u || !(await conferirSenha(senha, u.senha_hash))) return { erro: "E-mail ou senha incorretos." };
  if (u.role === "user") return { erro: "Esta conta não tem acesso ao painel." };
  const { token, expira } = await criarSessao(u.id, "web", (await headers()).get("user-agent"));
  await definirCookieSessao(token, expira);
  await auditar(u.id, "painel.entrar", "user", u.id);
  redirect(voltar);
}
