import "server-only";
import { redirect } from "next/navigation";
import { sessaoAtual, type SessaoUsuario } from "@/lib/auth/session";

export type NivelPainel = "editor" | "admin";

/**
 * Guarda das páginas do painel. Sem sessão → login do painel; usuário comum → área do cliente;
 * editor tentando tela só de admin → visão geral com aviso.
 * (As Server Actions usam `exigirAdmin()` de `@/lib/auth/guards`.)
 */
export async function exigirPainel(nivel: NivelPainel = "editor", voltar = "/admin"): Promise<SessaoUsuario> {
  const s = await sessaoAtual();
  if (!s) redirect(`/admin/entrar?voltar=${encodeURIComponent(voltar)}`);
  if (s.role === "user") redirect("/conta");
  if (nivel === "admin" && s.role !== "admin") redirect("/admin?negado=1");
  return s;
}

export const ehAdmin = (s: Pick<SessaoUsuario, "role">) => s.role === "admin";
