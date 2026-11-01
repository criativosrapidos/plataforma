import { normalizar } from "@aviso/shared";

/** Termos que indicam ato de concurso (sem acento, minúsculo). */
const TERMOS_CONCURSO = [
  /concurso publico/,
  /processo seletivo/,
  /edital de abertura/,
  /concurso para (o )?provimento/,
  /provimento (efetivo )?de cargos?/,
  /selecao publica/,
  /concurso de (provas|admissao)/,
  /autoriza(r|cao)? (a realizacao de )?concurso/,
];

/** Atos de pessoal ligados a concurso (nomeação, convocação, posse) — servem à busca nominal. */
const TERMOS_PESSOAL = [/\bnomear\b/, /\bconvoca(r|cao|dos?|das?)\b/, /\bposse\b/, /\bhomologa/];

/** Filtro "concurso público": decide se um ato do diário interessa ao pipeline. */
export function ehConcursoPublico(texto: string): boolean {
  const n = normalizar(texto);
  if (TERMOS_CONCURSO.some((r) => r.test(n))) return true;
  // "nomear ... aprovados no concurso" sem a expressão exata "concurso público" (ex.: "concurso de 2025")
  return TERMOS_PESSOAL.some((r) => r.test(n)) && /\bconcurso\b/.test(n);
}
