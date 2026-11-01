// Formatação e rótulos do painel (puro: serve para servidor e cliente).
import { numeroBR } from "@aviso/shared";

export type Tom = "azul" | "verde" | "ambar" | "verm" | "cinza" | "roxo" | "teal" | "tinta";

/** "8.500,00" / "8500" / "R$ 85,5" → centavos. Vazio → null. Inválido → NaN. */
export function inputParaCentavos(s: string | null | undefined): number | null {
  const t = (s ?? "").replace(/[R$\s]/g, "").trim();
  if (!t) return null;
  const norm = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const n = Number(norm);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

export function centavosParaInput(c: number | null | undefined): string {
  if (c == null) return "";
  return (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pct(n: number | null | undefined, casas = 0): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}

/** Número compacto para eixos: 1.200 → "1,2 mil". */
export function compacto(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return numeroBR(n);
}

/** "há 5 min", "há 3 h", "há 2 dias". */
export function idade(d: string | Date | null | undefined, agora: Date = new Date()): string {
  if (!d) return "—";
  const ms = agora.getTime() - new Date(d).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} dias`;
}

export function duracao(minutos: number | null | undefined): string {
  if (minutos == null || !Number.isFinite(minutos)) return "—";
  if (minutos < 1) return "< 1 min";
  if (minutos < 60) return `${Math.round(minutos)} min`;
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h < 48) return m ? `${h} h ${m} min` : `${h} h`;
  return `${Math.round(h / 24)} dias`;
}

/** Centavos com casas decimais (custos de IA e WhatsApp são frações de centavo). */
export function brlFino(centavos: number | null | undefined): string {
  if (centavos == null) return "—";
  const reais = centavos / 100;
  const casas = reais !== 0 && Math.abs(reais) < 1 ? 4 : 2;
  return reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: casas });
}

export const SUB_STATUS_ROTULO: Record<string, string> = {
  trial: "Teste",
  ativa: "Ativa",
  inadimplente: "Inadimplente",
  cancelada: "Cancelada",
  expirada: "Expirada",
  sem: "Sem assinatura",
};
export const SUB_STATUS_TOM: Record<string, Tom> = {
  trial: "azul",
  ativa: "verde",
  inadimplente: "ambar",
  cancelada: "verm",
  expirada: "cinza",
  sem: "cinza",
};

export const PLANO_ROTULO: Record<string, string> = { aviso: "Aviso", aprovado: "Aprovado" };
export const CICLO_ROTULO: Record<string, string> = { mensal: "Mensal", anual: "Anual" };
export const PAPEL_ROTULO: Record<string, string> = { user: "Usuário", editor: "Editor", admin: "Admin" };
export const PAPEL_TOM: Record<string, Tom> = { user: "cinza", editor: "teal", admin: "roxo" };

export const PAGAMENTO_ROTULO: Record<string, string> = { pendente: "Pendente", pago: "Pago", falhou: "Falhou", estornado: "Estornado" };
export const PAGAMENTO_TOM: Record<string, Tom> = { pendente: "ambar", pago: "verde", falhou: "verm", estornado: "cinza" };

export const CANAL_ROTULO: Record<string, string> = { push: "Push", whatsapp: "WhatsApp", email: "E-mail", inapp: "No app" };
export const ALERTA_STATUS_ROTULO: Record<string, string> = { pendente: "Pendente", enviado: "Enviado", falhou: "Falhou", suprimido: "Suprimido" };
export const ALERTA_STATUS_TOM: Record<string, Tom> = { pendente: "ambar", enviado: "verde", falhou: "verm", suprimido: "cinza" };

export const DOC_STATUS = ["novo", "classificado", "descartado", "extraido", "revisao", "erro"] as const;
export const DOC_STATUS_ROTULO: Record<string, string> = {
  novo: "Novo",
  classificado: "Classificado",
  descartado: "Descartado",
  extraido: "Extraído",
  revisao: "Em revisão",
  erro: "Erro",
};
export const DOC_STATUS_TOM: Record<string, Tom> = {
  novo: "azul",
  classificado: "teal",
  descartado: "cinza",
  extraido: "verde",
  revisao: "ambar",
  erro: "verm",
};

export const FONTE_TIPOS = ["dou", "banca", "querido_diario", "diario_estadual", "manual"] as const;
export const FONTE_TIPO_ROTULO: Record<string, string> = {
  dou: "DOU",
  banca: "Banca",
  querido_diario: "Querido Diário",
  diario_estadual: "Diário estadual",
  manual: "Manual",
};
export const RUN_STATUS_ROTULO: Record<string, string> = { rodando: "Rodando", ok: "OK", erro: "Erro" };
export const RUN_STATUS_TOM: Record<string, Tom> = { rodando: "azul", ok: "verde", erro: "verm" };

export const EXTRACAO_STATUS_ROTULO: Record<string, string> = { pendente: "Pendente", aprovada: "Aprovada", rejeitada: "Rejeitada", auto: "Automática" };
export const EXTRACAO_STATUS_TOM: Record<string, Tom> = { pendente: "ambar", aprovada: "verde", rejeitada: "verm", auto: "azul" };

export const CONCURSO_STATUS_TOM: Record<string, Tom> = {
  previsto: "roxo",
  autorizado: "roxo",
  banca_definida: "roxo",
  edital_aberto: "verde",
  inscricoes_encerradas: "azul",
  prova_realizada: "cinza",
  resultado: "cinza",
  homologado: "cinza",
  cancelado: "verm",
};

/** Confiança 0..1 → tom (abaixo do limiar é vermelho; perto dele, âmbar). */
export function tomConfianca(c: number, limiar = 0.85): Tom {
  if (c < limiar - 0.2) return "verm";
  if (c < limiar) return "ambar";
  return "verde";
}

/** Escapa um valor para CSV (separador ;, padrão do Excel em pt-BR). */
export function celulaCsv(v: unknown): string {
  if (v == null) return "";
  const s = v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV com BOM (o Excel em pt-BR abre acentos certo) e separador ";". */
export function gerarCsv(cabecalho: string[], linhas: unknown[][]): string {
  return String.fromCharCode(0xfeff) + [cabecalho, ...linhas].map((l) => l.map(celulaCsv).join(";")).join("\r\n");
}

/** Só links http(s) viram href (dado vindo de coleta/IA não é confiável). */
export function linkSeguro(u: string | null | undefined): string | undefined {
  return u && /^https?:\/\//i.test(u) ? u : undefined;
}

/** Horas desde uma data (para destacar itens parados há muito tempo). */
export function horasDesde(d: string | Date | null | undefined): number {
  return d ? (Date.now() - new Date(d).getTime()) / 3_600_000 : 0;
}
