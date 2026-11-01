import "server-only";
import { sql } from "@/lib/db";
import { CONFIG_DEFS, DEF_POR_CHAVE } from "../config-defs";

export interface LinhaConfig {
  chave: string;
  valor: unknown;
  updated_at: Date | null;
  conhecida: boolean;
}

/** Valor de uma chave de app_config (ou o padrão definido em config-defs). */
export async function lerConfigValor(chave: string): Promise<unknown> {
  const [r] = await sql<{ valor: unknown }[]>`select valor from app_config where chave = ${chave}`;
  return r ? r.valor : DEF_POR_CHAVE.get(chave)?.padrao ?? null;
}

export async function listarConfig(): Promise<LinhaConfig[]> {
  const linhas = await sql<{ chave: string; valor: unknown; updated_at: Date }[]>`select chave, valor, updated_at from app_config order by chave`;
  const mapa = new Map(linhas.map((l) => [l.chave, l]));
  const conhecidas = CONFIG_DEFS.map((d) => ({
    chave: d.chave,
    valor: mapa.has(d.chave) ? mapa.get(d.chave)!.valor : d.padrao,
    updated_at: mapa.get(d.chave)?.updated_at ?? null,
    conhecida: true,
  }));
  const outras = linhas.filter((l) => !DEF_POR_CHAVE.has(l.chave)).map((l) => ({ ...l, conhecida: false }));
  return [...conhecidas, ...outras];
}
