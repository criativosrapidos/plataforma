import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { configNumero } from "@/lib/pipeline/config";

/** Claude Haiku 5.5: extrai todo edital, classifica e responde o Pergunte ao edital. */
export const MODELO_RAPIDO = "claude-haiku-5-5";
/** Claude Sonnet 5.5: segunda leitura quando a confiança da extração fica baixa. */
export const MODELO_FORTE = "claude-sonnet-5-5";

/** Sem ANTHROPIC_API_KEY, o pipeline usa os leitores heurísticos (desenvolvimento e testes). */
export function iaDisponivel(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let cliente: Anthropic | null = null;
export function clienteIA(): Anthropic {
  if (!cliente) cliente = new Anthropic({ maxRetries: 3 });
  return cliente;
}

/**
 * Preço por milhão de tokens (US$), tabela da Anthropic (cache de 06/10/2026).
 * Haiku 5.5 tem duas faixas: prompt até 100 mil tokens e acima disso.
 * Leitura de cache = 0,1× a entrada; escrita no cache de 5 minutos = 1,25× a entrada.
 */
const PRECOS: Record<string, { entrada: number; saida: number; entradaLonga?: number; saidaLonga?: number }> = {
  [MODELO_RAPIDO]: { entrada: 0.1, saida: 0.5, entradaLonga: 0.5, saidaLonga: 2.5 },
  [MODELO_FORTE]: { entrada: 2, saida: 10 },
};

export interface UsoIA {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

/** Custo em US$ de uma chamada. */
export function custoUSD(modelo: string, uso: UsoIA): number {
  const p = PRECOS[modelo];
  if (!p) return 0;
  const escrita = uso.cache_creation_input_tokens ?? 0;
  const leitura = uso.cache_read_input_tokens ?? 0;
  const promptTotal = uso.input_tokens + escrita + leitura;
  const longo = promptTotal > 100_000 && p.entradaLonga !== undefined;
  const entrada = longo ? p.entradaLonga! : p.entrada;
  const saida = longo ? p.saidaLonga! : p.saida;
  return (uso.input_tokens * entrada + escrita * entrada * 1.25 + leitura * entrada * 0.1 + uso.output_tokens * saida) / 1_000_000;
}

/** Custo em centavos de real (câmbio de app_config `cambio_usd_brl`, padrão 5,50). */
export async function custoCentavos(modelo: string, uso: UsoIA): Promise<number> {
  const cambio = await configNumero("cambio_usd_brl");
  return Math.round(custoUSD(modelo, uso) * cambio * 100 * 10_000) / 10_000;
}

/** Tokens de entrada contando cache (para registrar por chamada). */
export function tokensEntrada(uso: UsoIA): number {
  return uso.input_tokens + (uso.cache_creation_input_tokens ?? 0) + (uso.cache_read_input_tokens ?? 0);
}
