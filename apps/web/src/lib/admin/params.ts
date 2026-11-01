// Leitura de searchParams das telas do painel (filtros, ordenação, paginação).

export type SP = Record<string, string | string[] | undefined>;

export function str(sp: SP, k: string): string | undefined {
  const v = sp[k];
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  return s ? s : undefined;
}

export function int(sp: SP, k: string, padrao: number, min = -Infinity, max = Infinity): number {
  const n = Number(str(sp, k));
  if (!Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** Valor de uma lista fechada (protege SQL dinâmico de ordenação/filtros). */
export function um<T extends string>(sp: SP, k: string, opcoes: readonly T[]): T | undefined {
  const v = str(sp, k);
  return v && (opcoes as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function boolParam(sp: SP, k: string): boolean | undefined {
  const v = str(sp, k);
  if (v === "sim" || v === "1" || v === "true") return true;
  if (v === "nao" || v === "0" || v === "false") return false;
  return undefined;
}

/** Data AAAA-MM-DD válida ou undefined. */
export function dataParam(sp: SP, k: string): string | undefined {
  const v = str(sp, k);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}

export const PERIODOS = [7, 30, 90] as const;
export type Periodo = (typeof PERIODOS)[number];
export function periodo(sp: SP): Periodo {
  const n = int(sp, "p", 30);
  return (PERIODOS as readonly number[]).includes(n) ? (n as Periodo) : 30;
}

/** Monta URL preservando os params atuais e aplicando mudanças (undefined/"" remove). */
export function urlCom(base: string, sp: SP, mudancas: Record<string, string | number | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (s) u.set(k, s);
  }
  for (const [k, v] of Object.entries(mudancas)) {
    if (v === undefined || v === null || v === "") u.delete(k);
    else u.set(k, String(v));
  }
  const q = u.toString();
  return q ? `${base}?${q}` : base;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ehUuid = (s: string | undefined | null): s is string => !!s && UUID_RE.test(s);
