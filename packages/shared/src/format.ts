// Formatação pt-BR: datas DD/MM/AAAA, valores R$ 8.500,00.

export const TZ = "America/Sao_Paulo";

export function brl(centavos: number | null | undefined): string {
  if (centavos == null) return "—";
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "2026-11-03" ou Date → "03/11/2026" (datas puras não sofrem fuso). */
export function dataBR(d: string | Date | null | undefined): string {
  if (!d) return "—";
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [a, m, dia] = d.split("-");
    return `${dia}/${m}/${a}`;
  }
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: TZ });
}

export function dataCurtaBR(d: string | Date | null | undefined): string {
  return dataBR(d).slice(0, 5);
}

export function dataHoraBR(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
}

/** Período "03/11 a 02/12" ou data única. */
export function periodoBR(inicio: string | null | undefined, fim: string | null | undefined): string {
  if (inicio && fim && inicio !== fim) return `${dataCurtaBR(inicio)} a ${dataCurtaBR(fim)}`;
  return dataBR(fim || inicio || null);
}

/** Data de hoje (AAAA-MM-DD) no fuso de Brasília. */
export function hojeISO(agora: Date = new Date()): string {
  return agora.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Diferença em dias corridos entre duas datas AAAA-MM-DD (b - a). */
export function diasEntre(a: string, b: string): number {
  const ta = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const tb = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((tb - ta) / 86_400_000);
}

export function somarDias(iso: string, dias: number): string {
  const t = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + dias * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** "faltam 12 dias", "amanhã", "hoje", "há 3 dias". */
export function contagem(dataAlvo: string, hoje: string = hojeISO()): string {
  const d = diasEntre(hoje, dataAlvo);
  if (d === 0) return "hoje";
  if (d === 1) return "amanhã";
  if (d > 1) return `faltam ${d} dias`;
  if (d === -1) return "ontem";
  return `há ${-d} dias`;
}

export function numeroBR(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR");
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Normaliza texto para comparação (sem acento, minúsculo, espaços simples). */
export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
