import "server-only";
import { headers } from "next/headers";
import { sql } from "@/lib/db";

/** IP de quem chama (Vercel: primeiro item do x-forwarded-for). */
export async function ipDaRequisicao(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/**
 * Conta uma tentativa na janela atual e diz se passou do limite.
 * Janela fixa (ex.: 15 min), contador no banco: funciona com várias instâncias serverless.
 */
export async function contarTentativa(chave: string, max: number, janelaSegundos: number): Promise<{ bloqueado: boolean; restamSegundos: number }> {
  const agora = Date.now();
  const inicio = new Date(Math.floor(agora / (janelaSegundos * 1000)) * janelaSegundos * 1000);
  const [r] = await sql<{ n: number }[]>`
    insert into rate_limits (chave, janela, n) values (${chave}, ${inicio}, 1)
    on conflict (chave, janela) do update set n = rate_limits.n + 1 returning n`;
  if (agora % 50 === 0) await sql`delete from rate_limits where janela < now() - interval '1 day'`;
  return { bloqueado: r.n > max, restamSegundos: Math.ceil((+inicio + janelaSegundos * 1000 - agora) / 1000) };
}

export function mensagemEspera(segundos: number): string {
  const min = Math.max(1, Math.ceil(segundos / 60));
  return `Muitas tentativas. Tente de novo em ${min} minuto${min > 1 ? "s" : ""}.`;
}
