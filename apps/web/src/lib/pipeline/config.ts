import "server-only";
import { sql, type Tx } from "@/lib/db";
import { TZ } from "@aviso/shared";

/** Padrões usados quando a chave não existe em app_config. */
export const CONFIG_PADRAO = {
  /** Confiança mínima da extração para publicar sem revisão humana. */
  limiar_confianca: 0.85,
  /** Câmbio para converter o custo da IA (US$) em centavos de real. Referência: outubro/2026. */
  cambio_usd_brl: 5.5,
  /** Custo estimado de 1 mensagem de utilidade no WhatsApp (Brasil), em centavos. Confirmar com a Meta. */
  custo_whatsapp_centavos: 4.4,
  /** Custo estimado de 1 e-mail (Resend), em centavos. */
  custo_email_centavos: 0,
} as const;
export type ChaveConfig = keyof typeof CONFIG_PADRAO;

/** Lê um número de app_config (jsonb), com padrão documentado. */
export async function configNumero(chave: ChaveConfig, tx: Tx = sql): Promise<number> {
  const [r] = await tx<{ valor: unknown }[]>`select valor from app_config where chave = ${chave}`;
  const v = r ? Number(typeof r.valor === "object" && r.valor !== null && "valor" in r.valor ? (r.valor as { valor: unknown }).valor : r.valor) : NaN;
  return Number.isFinite(v) ? v : CONFIG_PADRAO[chave];
}

/** Hora "HH:MM" no fuso de Brasília. */
export function horaBR(agora: Date): string {
  return agora.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Deslocamento do fuso de Brasília em minutos (ex.: -180) para um instante. */
function offsetMinutos(agora: Date): number {
  const nome = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" })
    .formatToParts(agora)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT-03:00";
  const m = nome.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return -180;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Instante (Date) correspondente a uma data AAAA-MM-DD e hora HH:MM no horário de Brasília. */
export function instanteBR(dataISO: string, hhmm: string): Date {
  const aprox = new Date(`${dataISO}T${hhmm}:00Z`);
  return new Date(aprox.getTime() - offsetMinutos(aprox) * 60_000);
}

/** Primeiro dia do mês (horário de Brasília) do instante dado, como Date. */
export function inicioDoMesBR(agora: Date): Date {
  const hoje = agora.toLocaleDateString("en-CA", { timeZone: TZ });
  return instanteBR(`${hoje.slice(0, 7)}-01`, "00:00");
}

/** Semana ISO (AAAA-Wnn) de uma data AAAA-MM-DD. */
export function semanaISO(dataISO: string): string {
  const d = new Date(`${dataISO}T00:00:00Z`);
  const dia = (d.getUTCDay() + 6) % 7; // segunda = 0
  d.setUTCDate(d.getUTCDate() - dia + 3); // quinta da mesma semana
  const ano = d.getUTCFullYear();
  const primeiraQuinta = new Date(Date.UTC(ano, 0, 4));
  const semana = 1 + Math.round(((d.getTime() - primeiraQuinta.getTime()) / 86_400_000 - 3 + ((primeiraQuinta.getUTCDay() + 6) % 7)) / 7);
  return `${ano}-W${String(semana).padStart(2, "0")}`;
}

/** URL pública do site (para links do app/e-mail). */
export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
