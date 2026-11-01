// Formatação do app em cima das regras de @aviso/shared (datas DD/MM/AAAA, valores R$ 8.500,00).
import {
  CONTEST_STATUS_LABEL,
  DATE_TIPO_LABEL,
  ETAPAS_TRILHA,
  contagem,
  dataCurtaBR,
  diasEntre,
  somarDias,
  type ContestStatus,
  type DateTipo,
} from "@aviso/shared";

export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
export const MESES_ABREV = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
/** Domingo = 0 */
export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DIAS_SEMANA_LETRA = ["D", "S", "T", "Q", "Q", "S", "S"];
export const DIAS_SEMANA_LONGO = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const dois = (n: number) => String(n).padStart(2, "0");

/** Hoje (AAAA-MM-DD) no fuso do aparelho. */
export function hojeLocal(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

export function partes(iso: string) {
  return { ano: +iso.slice(0, 4), mes: +iso.slice(5, 7), dia: +iso.slice(8, 10) };
}

/** 0 = domingo … 6 = sábado */
export function diaDaSemana(iso: string): number {
  const { ano, mes, dia } = partes(iso);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

/** Segunda-feira da semana da data. */
export function inicioDaSemana(iso: string): string {
  const d = diaDaSemana(iso);
  return somarDias(iso, d === 0 ? -6 : 1 - d);
}

export function inicioDoMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function fimDoMes(iso: string): string {
  const { ano, mes } = partes(iso);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${iso.slice(0, 7)}-${dois(ultimo)}`;
}

export function somarMeses(iso: string, n: number): string {
  const { ano, mes } = partes(iso);
  const d = new Date(Date.UTC(ano, mes - 1 + n, 1));
  return `${d.getUTCFullYear()}-${dois(d.getUTCMonth() + 1)}-01`;
}

/** "Novembro de 2026" */
export function mesAno(iso: string): string {
  const { ano, mes } = partes(iso);
  const nome = MESES[mes - 1];
  return `${nome[0].toUpperCase()}${nome.slice(1)} de ${ano}`;
}

/** "seg, 03/11" */
export function diaCurto(iso: string): string {
  return `${DIAS_SEMANA[diaDaSemana(iso)].toLowerCase()}, ${dataCurtaBR(iso)}`;
}

/** Contagem em linguagem de gente, para datas futuras e passadas. */
export function contagemTexto(alvo: string, hoje: string = hojeLocal()): string {
  return contagem(alvo, hoje);
}

/** Dias corridos até a data (negativo = já passou). */
export function diasAte(alvo: string, hoje: string = hojeLocal()): number {
  return diasEntre(hoje, alvo);
}

/** Data que importa num compromisso com período: o fim (prazo). */
export function dataChave(c: { inicio: string | null; fim: string | null }): string | null {
  return c.fim ?? c.inicio;
}

/** Hora do aviso: "06:04" se for hoje, "ontem" ou "28/10". */
export function quando(isoDataHora: string, agora: Date = new Date()): string {
  const d = new Date(isoDataHora);
  const dia = hojeLocal(d);
  const hoje = hojeLocal(agora);
  if (dia === hoje) return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
  if (diasEntre(dia, hoje) === 1) return "ontem";
  return dataCurtaBR(dia);
}

export function saudacao(agora: Date = new Date()): string {
  const h = agora.getHours();
  if (h < 5) return "Boa noite";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function primeiroNome(nome: string | null | undefined): string {
  return (nome ?? "").trim().split(/\s+/)[0] ?? "";
}

export function plural(n: number, um: string, varios: string): string {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;
}

/** "+5511999990000" → "(11) 99999-0000" */
export function telefoneBR(e164: string | null | undefined): string {
  if (!e164) return "";
  const n = e164.replace(/\D/g, "").replace(/^55/, "");
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return e164;
}

/** Sigla curta para bolinhas (2 letras): "TRF 3" → "TR", "INSS" → "IN". */
export function siglaBolinha(titulo: string): string {
  const limpo = titulo.replace(/[^A-Za-zÀ-ú0-9]/g, "");
  return limpo.slice(0, 2).toUpperCase();
}

// ---------- Concursos ----------

/** Índice da etapa atual na trilha previsto → resultado (−1 se cancelado). */
export function etapaAtual(status: ContestStatus): number {
  return ETAPAS_TRILHA.findIndex((e) => e.status.includes(status));
}

export type TomEtiqueta = "aberto" | "encerra" | "errata" | "info" | "neutro" | "marca";

/** Etiqueta principal do concurso: prazo curto em vermelho, edital aberto em verde. */
export function etiquetaConcurso(
  c: { status: ContestStatus; proxima_data: { tipo: DateTipo; data: string } | null },
  hoje: string = hojeLocal(),
): { texto: string; tom: TomEtiqueta } {
  const p = c.proxima_data;
  if (p && (p.tipo === "isencao" || p.tipo === "inscricao" || p.tipo === "pagamento")) {
    const d = diasEntre(hoje, p.data);
    if (d >= 0 && d <= 7) {
      const rotulo = DATE_TIPO_LABEL[p.tipo].split(" ")[0].toUpperCase();
      return {
        texto: d === 0 ? `${rotulo} ACABA HOJE` : d === 1 ? `${rotulo} ACABA AMANHÃ` : `${rotulo} ATÉ ${dataCurtaBR(p.data)}`,
        tom: "encerra",
      };
    }
  }
  if (p?.tipo === "prova") {
    const d = diasEntre(hoje, p.data);
    if (d >= 0 && d <= 3) return { texto: d === 0 ? "PROVA HOJE" : d === 1 ? "PROVA AMANHÃ" : `PROVA EM ${d} DIAS`, tom: "encerra" };
  }
  switch (c.status) {
    case "edital_aberto":
      return { texto: "EDITAL ABERTO", tom: "aberto" };
    case "previsto":
    case "autorizado":
    case "banca_definida":
      return { texto: CONTEST_STATUS_LABEL[c.status].toUpperCase(), tom: "info" };
    case "cancelado":
      return { texto: "CANCELADO", tom: "encerra" };
    default:
      return { texto: CONTEST_STATUS_LABEL[c.status].toUpperCase(), tom: "neutro" };
  }
}

// ---------- "O que mudou" (errata) ----------

const CAMPOS: Record<string, string> = {
  prova: "Data da prova",
  data_prova: "Data da prova",
  isencao: "Isenção",
  isencao_inicio: "Início da isenção",
  isencao_fim: "Fim da isenção",
  inscricao: "Inscrição",
  inscricao_inicio: "Início das inscrições",
  inscricao_fim: "Fim das inscrições",
  pagamento: "Pagamento do boleto",
  local_prova: "Local de prova",
  vagas: "Vagas",
  vagas_total: "Vagas",
  salario: "Salário",
  salario_max_centavos: "Salário",
  taxa: "Taxa",
  taxa_centavos: "Taxa",
  banca: "Banca",
  requisitos: "Requisitos",
  cargos: "Cargos",
};

export function rotuloCampo(campo: string): string {
  return CAMPOS[campo] ?? campo.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/** Valor legível de um campo do diff (datas viram DD/MM/AAAA, centavos viram R$). */
export function valorCampo(campo: string, v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    const [a, m, d] = v.slice(0, 10).split("-");
    return `${d}/${m}/${a}`;
  }
  if (typeof v === "number" && /centavos|salario|taxa/.test(campo)) {
    return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (typeof v === "number") return v.toLocaleString("pt-BR");
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (Array.isArray(v)) return v.map((x) => valorCampo(campo, x)).join(", ");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("inicio" in o || "fim" in o) {
      const ini = valorCampo(campo, o.inicio);
      const fim = valorCampo(campo, o.fim);
      return ini === fim || ini === "—" ? fim : `${ini} a ${fim}`;
    }
    return Object.entries(o)
      .map(([k, x]) => `${k}: ${valorCampo(k, x)}`)
      .join(" · ");
  }
  return String(v);
}
