import { ZodError } from "zod";
import { errosZodPt } from "./campos-form";

/** Retorno padrão das Server Actions do painel (serializável, sem dados crus do banco). */
export type Resultado<T = undefined> =
  | { ok: true; msg?: string; dados?: T }
  | { ok: false; erro: string; campos?: Record<string, string> };

export const sucesso = <T,>(msg?: string, dados?: T): Resultado<T> => ({ ok: true, msg, dados });
export const falha = (erro: string, campos?: Record<string, string>): Resultado<never> => ({ ok: false, erro, campos });

export const camposDoZod = (e: ZodError) => errosZodPt(e);

/** Converte qualquer erro em mensagem amigável. Erros "ainda não implementado" do pipeline viram aviso claro. */
export function erroAmigavel(e: unknown, contexto = "a ação"): Resultado<never> {
  if (e instanceof ZodError) return falha("Confira os campos destacados.", camposDoZod(e));
  const msg = e instanceof Error ? e.message : String(e);
  if (/ainda não implementado/i.test(msg)) {
    return falha(`O pipeline ainda não está disponível neste ambiente, então não deu para concluir ${contexto}. Nada foi alterado.`);
  }
  if (/duplicate key|unique constraint/i.test(msg)) return falha("Já existe um registro com esses dados.");
  if (/violates foreign key/i.test(msg)) return falha("Este registro está em uso e não pode ser removido.");
  console.error(`[admin] erro em ${contexto}:`, e);
  return falha(`Não deu para concluir ${contexto}: ${msg.slice(0, 200)}`);
}
