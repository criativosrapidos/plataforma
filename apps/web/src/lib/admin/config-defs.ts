// Chaves conhecidas de app_config (puro: usado no formulário e na validação do servidor).
// O pipeline/jobs leem estas mesmas chaves; valores ausentes no banco usam o padrão daqui.
import { z } from "zod";

export type TipoConfig = "booleano" | "numero" | "hora" | "centavos";

export interface DefConfig {
  chave: string;
  rotulo: string;
  ajuda: string;
  tipo: TipoConfig;
  padrao: boolean | number | string;
  schema: z.ZodType;
  grupo: "Envios" | "Coleta e revisão" | "Negócio";
  min?: number;
  max?: number;
  passo?: number;
}

export const CONFIG_DEFS: DefConfig[] = [
  {
    chave: "avisos_pausados",
    rotulo: "Pausar todos os avisos",
    ajuda: "Freio de emergência: nenhum push, WhatsApp ou e-mail sai enquanto estiver ligado. Os avisos ficam pendentes.",
    tipo: "booleano",
    padrao: false,
    schema: z.boolean(),
    grupo: "Envios",
  },
  {
    chave: "whatsapp_pausado",
    rotulo: "Pausar envios de WhatsApp",
    ajuda: "Suspende só o WhatsApp (ex.: modelo reprovado pela Meta ou custo fora do previsto). Push continua.",
    tipo: "booleano",
    padrao: false,
    schema: z.boolean(),
    grupo: "Envios",
  },
  {
    chave: "revisao_limiar_confianca",
    rotulo: "Limiar de confiança para revisão humana",
    ajuda: "Extrações com confiança abaixo deste valor vão para a fila de revisão antes de virar aviso.",
    tipo: "numero",
    padrao: 0.85,
    min: 0.5,
    max: 0.99,
    passo: 0.01,
    schema: z.number().min(0.5, "Mínimo 0,50").max(0.99, "Máximo 0,99"),
    grupo: "Coleta e revisão",
  },
  {
    chave: "coletor_dou_horario",
    rotulo: "Horário do coletor do DOU",
    ajuda: "Hora (Brasília) em que o job diário lê o Diário Oficial da União. Também atualiza a configuração da fonte DOU.",
    tipo: "hora",
    padrao: "06:00",
    schema: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM, ex.: 06:00"),
    grupo: "Coleta e revisão",
  },
  {
    chave: "custo_fixo_mensal_centavos",
    rotulo: "Custo fixo mensal",
    ajuda: "Usado no ponto de equilíbrio da visão geral (briefing: ≈ R$ 600 com Supabase, Vercel, IA e e-mail).",
    tipo: "centavos",
    padrao: 60000,
    min: 0,
    schema: z.number().int().min(0, "Não pode ser negativo").max(100_000_000),
    grupo: "Negócio",
  },
];

export const DEF_POR_CHAVE = new Map(CONFIG_DEFS.map((d) => [d.chave, d]));
