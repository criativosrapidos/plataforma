"use server";

import { exigirAdmin } from "@/lib/auth/guards";
import { sql } from "@/lib/db";
import { atualizarPainel } from "../atualizar";
import { auditar } from "../audit";
import { DEF_POR_CHAVE } from "../config-defs";
import { camposDoZod, falha, sucesso, type Resultado } from "../resultado";

const CHAVE_RE = /^[a-z][a-z0-9_]{1,62}$/;

async function gravar(chave: string, valor: unknown, actorId: string) {
  const [antes] = await sql<{ valor: unknown }[]>`select valor from app_config where chave = ${chave}`;
  await sql`insert into app_config (chave, valor) values (${chave}, ${sql.json(valor as never)})
            on conflict (chave) do update set valor = excluded.valor, updated_at = now()`;
  if (chave === "coletor_dou_horario" && typeof valor === "string") {
    // mantém a configuração da fonte DOU em sincronia
    await sql`update sources set config = jsonb_set(config, '{horario}', to_jsonb(${valor}::text)) where slug = 'dou'`;
  }
  await auditar(actorId, "config.alterar", "app_config", chave, { antes: antes?.valor ?? null, depois: valor });
}

/** Salva uma chave conhecida (validada pelo schema da definição). */
export async function salvarConfigAcao(chave: string, valor: unknown): Promise<Resultado> {
  const s = await exigirAdmin("admin");
  const def = DEF_POR_CHAVE.get(chave);
  if (!def) return falha("Chave desconhecida.");
  const v = def.schema.safeParse(valor);
  if (!v.success) return falha(Object.values(camposDoZod(v.error))[0] ?? "Valor inválido.");
  await gravar(chave, v.data, s.id);
  atualizarPainel();
  return sucesso(`“${def.rotulo}” salvo.`);
}

/** Salva uma chave livre com valor JSON (para chaves que ainda não têm tela própria). */
export async function salvarConfigBrutaAcao(chave: string, texto: string): Promise<Resultado> {
  const s = await exigirAdmin("admin");
  const k = typeof chave === "string" ? chave.trim() : "";
  if (!CHAVE_RE.test(k)) return falha("Chave: letras minúsculas, números e _ (ex.: limite_envios_hora).");
  if (DEF_POR_CHAVE.has(k)) return falha("Esta chave tem campo próprio acima.");
  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch {
    return falha("Valor precisa ser JSON válido (ex.: true, 10, \"texto\", {\"a\": 1}).");
  }
  await gravar(k, valor, s.id);
  atualizarPainel();
  return sucesso(`Chave “${k}” salva.`);
}

/** Remove a chave do banco (chaves conhecidas voltam ao padrão). */
export async function restaurarConfigAcao(chave: string): Promise<Resultado> {
  const s = await exigirAdmin("admin");
  const [r] = await sql<{ valor: unknown }[]>`delete from app_config where chave = ${chave} returning valor`;
  if (!r) return falha("Já está no padrão.");
  await auditar(s.id, "config.restaurar", "app_config", chave, { antes: r.valor });
  atualizarPainel();
  return sucesso(DEF_POR_CHAVE.has(chave) ? "Voltou ao valor padrão." : `Chave “${chave}” removida.`);
}
