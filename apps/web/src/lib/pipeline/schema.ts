import { z } from "zod";
import { DATE_TIPOS, ESCOLARIDADES, ESFERAS, ACT_TIPOS } from "@aviso/shared";

/** Origem de cada campo no edital (item e página), exigida na extração. */
const Origem = z.object({ item: z.string().nullable().optional(), pagina: z.number().int().nullable().optional() }).partial();

export const CargoExtraido = z.object({
  nome: z.string().min(2),
  escolaridade: z.enum(ESCOLARIDADES).nullable().optional(),
  area: z.string().nullable().optional(),
  vagas: z.number().int().nullable().optional(),
  cadastro_reserva: z.boolean().optional().default(false),
  salario_centavos: z.number().int().nullable().optional(),
  jornada: z.string().nullable().optional(),
  requisitos: z.string().nullable().optional(),
  materias: z.array(z.object({ nome: z.string(), numero_questoes: z.number().int().nullable().optional() })).optional().default([]),
  origem: Origem.optional(),
});

/**
 * Campos que o extrator com IA devolve (validados com este schema). Também é o formulário da fila de revisão.
 * `numero_edital`/`ano` identificam o EDITAL DO CONCURSO (dedup: órgão + número + ano). Em retificação,
 * homologação, resultado e convocação, são os do edital de abertura a que o ato se refere.
 */
export const CamposExtraidos = z.object({
  tipo_ato: z.enum(ACT_TIPOS),
  orgao: z.string().min(2),
  orgao_sigla: z.string().nullable().optional(),
  esfera: z.enum(ESFERAS),
  uf: z.string().length(2).nullable().optional(),
  cidade: z.string().nullable().optional(),
  banca: z.string().nullable().optional(),
  numero_edital: z.string().nullable().optional(),
  ano: z.number().int().nullable().optional(),
  titulo: z.string().nullable().optional(),
  resumo: z.string().nullable().optional(),
  cargos: z.array(CargoExtraido).default([]),
  taxa_centavos: z.number().int().nullable().optional(),
  datas: z
    .array(z.object({ tipo: z.enum(DATE_TIPOS), inicio: z.string().nullable(), fim: z.string().nullable(), descricao: z.string().nullable().optional(), origem: Origem.optional() }))
    .default([]),
  etapas: z.array(z.string()).optional().default([]),
  url_oficial: z.string().url(),
  areas: z.array(z.string()).optional().default([]),
  /** Confiança (0 a 1) por campo, informada pelo extrator. Opcional. */
  confianca_campos: z.record(z.string(), z.number()).optional(),
});
export type CamposExtraidos = z.infer<typeof CamposExtraidos>;
