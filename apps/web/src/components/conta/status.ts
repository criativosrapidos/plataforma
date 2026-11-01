import {
  DIAS_TOLERANCIA_INADIMPLENCIA, PLANO_INFO, TRIAL_DAYS, brl, dataBR, dataHoraBR, precoCentavos,
  type Acesso, type AssinaturaDTO,
} from "@aviso/shared";
import type { TomEtiqueta } from "@/components/ui/Etiqueta";

export type ResumoAssinatura = {
  etiqueta: string;
  tom: TomEtiqueta;
  titulo: string;
  texto: string;
  /** a pessoa precisa agir (escolher plano, pagar) */
  agir: boolean;
  /** há assinatura viva (trial, ativa ou inadimplente) que pode ser trocada/cancelada */
  viva: boolean;
};

const DIA = 86_400_000;

/** Texto da situação do plano, a partir da assinatura e da regra central de acesso. */
export function resumoAssinatura(a: AssinaturaDTO | null, acesso: Acesso, jaUsouTeste: boolean): ResumoAssinatura {
  const viva = !!a && ["trial", "ativa", "inadimplente"].includes(a.status);
  if (!a || a.status === "expirada") {
    return {
      etiqueta: "Sem plano",
      tom: "cinza",
      titulo: "Você ainda não tem um plano ativo",
      texto: jaUsouTeste
        ? "Seu teste grátis já foi usado. Assine para voltar a receber avisos e usar a agenda no app."
        : `Escolha um plano e teste ${TRIAL_DAYS} dias grátis. Sem plano ativo, o app mostra só a tela de planos.`,
      agir: true,
      viva: false,
    };
  }
  const nome = PLANO_INFO[a.plano].nome;
  const valor = brl(precoCentavos(a.plano, a.ciclo));
  const ciclo = a.ciclo === "anual" ? "por ano" : "por mês";
  switch (a.status) {
    case "trial":
      if (acesso.liberado) {
        const d = acesso.diasRestantesTeste ?? 0;
        return {
          etiqueta: `Teste · ${d === 1 ? "último dia" : `faltam ${d} dias`}`,
          tom: "azul",
          titulo: `Teste grátis do plano ${nome}`,
          texto: `Seu teste vai até ${dataHoraBR(a.trial_ends_at)}. Depois, ${valor} ${ciclo} no ${
            a.metodo === "cartao" ? "cartão" : "Pix automático"
          }, se você não cancelar. A gente avisa 1 dia antes.`,
          agir: false,
          viva,
        };
      }
      return {
        etiqueta: "Teste encerrado",
        tom: "verm",
        titulo: "Seu teste acabou",
        texto: "Estamos aguardando a confirmação do primeiro pagamento. Assim que ela chegar, o acesso volta sozinho.",
        agir: true,
        viva,
      };
    case "ativa":
      return {
        etiqueta: "Ativa",
        tom: "verde",
        titulo: `Plano ${nome} ${a.ciclo === "anual" ? "anual" : "mensal"}`,
        texto: a.current_period_end
          ? `${valor} ${ciclo}. Próxima cobrança em ${dataBR(a.current_period_end)}.`
          : `${valor} ${ciclo}, renovação automática.`,
        agir: false,
        viva,
      };
    case "inadimplente": {
      const limite = a.current_period_end ? new Date(new Date(a.current_period_end).getTime() + DIAS_TOLERANCIA_INADIMPLENCIA * DIA) : null;
      return acesso.liberado
        ? {
            etiqueta: "Pagamento pendente",
            tom: "verm",
            titulo: "Não conseguimos fazer a cobrança",
            texto: `Confira o Pix automático ou o cartão. Você continua com acesso${limite ? ` até ${dataBR(limite)}` : ""}; depois disso, o app fica pausado até o pagamento.`,
            agir: true,
            viva,
          }
        : {
            etiqueta: "Pausado",
            tom: "verm",
            titulo: "Acesso pausado por falta de pagamento",
            texto: "Regularize o pagamento para voltar a receber avisos. Seus perfis e concursos continuam salvos.",
            agir: true,
            viva,
          };
    }
    case "cancelada": {
      const ate = a.current_period_end ?? a.trial_ends_at;
      return acesso.liberado
        ? {
            etiqueta: "Cancelada",
            tom: "marca",
            titulo: `Plano ${nome} cancelado`,
            texto: `Você continua usando até ${dataHoraBR(ate)}. Não haverá nova cobrança.`,
            agir: false,
            viva: false,
          }
        : {
            etiqueta: "Encerrada",
            tom: "cinza",
            titulo: "Sua assinatura terminou",
            texto: `O acesso terminou em ${dataBR(ate)}. Seus perfis e concursos continuam salvos se quiser voltar.`,
            agir: true,
            viva: false,
          };
    }
  }
}
