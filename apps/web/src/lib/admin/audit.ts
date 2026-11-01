import "server-only";
import { sql, type Tx } from "@/lib/db";

/** Registra uma ação sensível do painel em audit_log. Nunca grave senha, token ou hash em `dados`. */
export async function auditar(
  actorId: string | null,
  acao: string,
  entidade: string,
  entidadeId: string | null,
  dados: Record<string, unknown> = {},
  tx: Tx = sql,
) {
  await tx`
    insert into audit_log (actor_id, acao, entidade, entidade_id, dados)
    values (${actorId}, ${acao}, ${entidade}, ${entidadeId}, ${tx.json(JSON.parse(JSON.stringify(dados)))})`;
}
