import { z } from "zod";
import { AREAS, BANCAS, ESCOLARIDADES, UFS } from "@aviso/shared";

const lista = (max = 30) => z.array(z.string().trim().min(1).max(80)).max(max).default([]);

export const PerfilSchema = z.object({
  nome: z.string().trim().min(1).max(60).default("Meu perfil"),
  escolaridades: z.array(z.enum(ESCOLARIDADES)).default([]),
  areas: z.array(z.enum(AREAS)).default([]),
  cargos: lista(),
  ufs: z.array(z.enum(UFS)).default([]),
  incluir_nacional: z.boolean().default(true),
  salario_min_centavos: z.number().int().min(0).max(100_000_00).nullable().default(null),
  bancas: z.array(z.string().refine((b) => (BANCAS as readonly string[]).includes(b) || b.length <= 40)).default([]),
  palavras_chave: lista(),
  ativo: z.boolean().default(true),
});
