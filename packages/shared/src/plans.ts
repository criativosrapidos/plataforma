// Planos e regras de acesso. Fonte única: o backend sempre decide com estas funções.
import type { AlertCanal, AlertTipo } from "./domain";

export const TRIAL_DAYS = 3;
export const PLANOS = ["aviso", "aprovado"] as const;
export type Plano = (typeof PLANOS)[number];
export const CICLOS = ["mensal", "anual"] as const;
export type Ciclo = (typeof CICLOS)[number];

export const SUB_STATUS = ["trial", "ativa", "inadimplente", "cancelada", "expirada"] as const;
export type SubStatus = (typeof SUB_STATUS)[number];

/** Dias de tolerância depois de uma cobrança falhar, antes de bloquear. */
export const DIAS_TOLERANCIA_INADIMPLENCIA = 3;

export interface PlanoInfo {
  id: Plano;
  nome: string;
  precoMensalCentavos: number;
  precoAnualCentavos: number;
  destaque: string;
  inclui: string[];
  limites: { whatsappMes: number; perguntasMes: number };
}

export const PLANO_INFO: Record<Plano, PlanoInfo> = {
  aviso: {
    id: "aviso",
    nome: "Aviso",
    precoMensalCentavos: 990,
    precoAnualCentavos: 9900,
    destaque: "Principal",
    inclui: [
      "Perfis de busca ilimitados",
      "Notificação no celular na hora",
      "Lembrete de isenção e de inscrição",
      "Aviso de errata, com o que mudou",
      "Agenda com todos os concursos",
      "Matérias em comum e checklist",
    ],
    limites: { whatsappMes: 0, perguntasMes: 0 },
  },
  aprovado: {
    id: "aprovado",
    nome: "Aprovado",
    precoMensalCentavos: 1990,
    precoAnualCentavos: 19900,
    destaque: "Completo",
    inclui: [
      "Tudo do Aviso",
      "Prazo acabando também no WhatsApp (até 10 por mês)",
      "Pergunte ao edital com IA (30 por mês)",
      "Radar de previstos e autorizados",
      "Aviso de convocação com seu nome no Diário Oficial",
    ],
    limites: { whatsappMes: 10, perguntasMes: 30 },
  },
};

export function precoCentavos(plano: Plano, ciclo: Ciclo): number {
  const p = PLANO_INFO[plano];
  return ciclo === "anual" ? p.precoAnualCentavos : p.precoMensalCentavos;
}

export type Recurso =
  | "app" // usar o app (agenda, concursos, matérias, checklist, push)
  | "whatsapp"
  | "pergunte_edital"
  | "radar"
  | "convocacao_nominal";

const RECURSOS_POR_PLANO: Record<Plano, Recurso[]> = {
  aviso: ["app"],
  aprovado: ["app", "whatsapp", "pergunte_edital", "radar", "convocacao_nominal"],
};

export interface AssinaturaLike {
  plano: Plano;
  status: SubStatus;
  trial_ends_at: string | Date | null;
  current_period_end: string | Date | null;
}

export interface Acesso {
  /** true quando a pessoa pode usar o app (teste ou assinatura em dia). */
  liberado: boolean;
  plano: Plano | null;
  status: SubStatus | "sem_assinatura";
  emTeste: boolean;
  diasRestantesTeste: number | null;
  recursos: Recurso[];
  motivoBloqueio: null | "sem_assinatura" | "teste_acabou" | "pagamento_pendente" | "cancelada";
}

const DIA = 86_400_000;

/**
 * Regra central de acesso. Sem plano grátis: sem teste ativo nem assinatura em dia,
 * o app mostra só a tela de planos.
 */
export function calcularAcesso(sub: AssinaturaLike | null | undefined, agora: Date = new Date()): Acesso {
  const base: Acesso = {
    liberado: false,
    plano: null,
    status: "sem_assinatura",
    emTeste: false,
    diasRestantesTeste: null,
    recursos: [],
    motivoBloqueio: "sem_assinatura",
  };
  if (!sub) return base;
  const t = agora.getTime();
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : null;
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;

  const liberar = (emTeste: boolean): Acesso => ({
    liberado: true,
    plano: sub.plano,
    status: sub.status,
    emTeste,
    diasRestantesTeste: emTeste && trialEnd ? Math.max(0, Math.ceil((trialEnd - t) / DIA)) : null,
    recursos: RECURSOS_POR_PLANO[sub.plano],
    motivoBloqueio: null,
  });

  switch (sub.status) {
    case "trial":
      if (trialEnd && t < trialEnd) return liberar(true);
      return { ...base, plano: sub.plano, status: sub.status, motivoBloqueio: "teste_acabou" };
    case "ativa":
      if (!periodEnd || t < periodEnd + DIAS_TOLERANCIA_INADIMPLENCIA * DIA) return liberar(false);
      return { ...base, plano: sub.plano, status: sub.status, motivoBloqueio: "pagamento_pendente" };
    case "inadimplente":
      if (periodEnd && t < periodEnd + DIAS_TOLERANCIA_INADIMPLENCIA * DIA) return liberar(false);
      return { ...base, plano: sub.plano, status: sub.status, motivoBloqueio: "pagamento_pendente" };
    case "cancelada":
      // Cancelou: usa até o fim do período já pago (ou do teste).
      if ((periodEnd && t < periodEnd) || (trialEnd && t < trialEnd)) return liberar(!!trialEnd && t < trialEnd && !periodEnd);
      return { ...base, plano: sub.plano, status: sub.status, motivoBloqueio: "cancelada" };
    default:
      return { ...base, plano: sub.plano, status: sub.status, motivoBloqueio: "sem_assinatura" };
  }
}

export function temRecurso(acesso: Acesso, recurso: Recurso): boolean {
  return acesso.liberado && acesso.recursos.includes(recurso);
}

/** Tipos de aviso que só o plano Aprovado recebe. */
export const ALERTAS_SO_APROVADO: AlertTipo[] = ["autorizado", "convocacao"];
/** Tipos de aviso que podem ir por WhatsApp (só Aprovado, só prazo acabando amanhã). */
export const ALERTAS_WHATSAPP: AlertTipo[] = ["isencao_acabando", "inscricao_acabando"];

/**
 * Decide por quais canais um aviso pode sair para a pessoa.
 * Push é o canal principal; WhatsApp é bônus limitado; e-mail só para o resumo semanal e cobrança.
 */
export function canaisPermitidos(params: {
  acesso: Acesso;
  tipo: AlertTipo;
  pushOn: boolean;
  whatsappOn: boolean;
  whatsappOptin: boolean;
  whatsappEnviadosNoMes: number;
  /** dias até o fim do prazo (para WhatsApp só vale "acaba amanhã") */
  diasAteFim?: number;
}): AlertCanal[] {
  const { acesso, tipo } = params;
  if (tipo === "cobranca_amanha") return ["push", "email"];
  if (!acesso.liberado) return [];
  if (ALERTAS_SO_APROVADO.includes(tipo) && acesso.plano !== "aprovado") return [];
  const canais: AlertCanal[] = ["inapp"];
  if (params.pushOn) canais.push("push");
  if (
    acesso.plano === "aprovado" &&
    ALERTAS_WHATSAPP.includes(tipo) &&
    params.diasAteFim === 1 &&
    params.whatsappOn &&
    params.whatsappOptin &&
    params.whatsappEnviadosNoMes < PLANO_INFO.aprovado.limites.whatsappMes
  ) {
    canais.push("whatsapp");
  }
  return canais;
}
