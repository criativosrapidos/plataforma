import "server-only";
import { redirect } from "next/navigation";
import { sessaoAtual, type SessaoUsuario } from "./session";

/** Para páginas do site (área do cliente). */
export async function exigirLogin(voltarPara = "/conta"): Promise<SessaoUsuario> {
  const s = await sessaoAtual();
  if (!s) redirect(`/entrar?voltar=${encodeURIComponent(voltarPara)}`);
  return s;
}

/** Para o painel admin. Editor: revisão e concursos. Admin: tudo. */
export async function exigirAdmin(nivel: "editor" | "admin" = "editor"): Promise<SessaoUsuario> {
  const s = await sessaoAtual();
  if (!s) redirect(`/entrar?voltar=/admin`);
  const ok = nivel === "editor" ? s.role === "editor" || s.role === "admin" : s.role === "admin";
  if (!ok) redirect("/conta");
  return s;
}
