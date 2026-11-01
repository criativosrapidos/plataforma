import "server-only";
import { classificarHeuristico } from "@/lib/ai/heuristica";
import { classificarComIA } from "@/lib/ai/extrair";
import { iaDisponivel } from "@/lib/ai/cliente";
import type { Classificacao } from "./tipos";

/**
 * Classifica o ato: previsto, autorizacao, edital_abertura, retificacao, homologacao, resultado, convocacao, outro.
 * Com ANTHROPIC_API_KEY usa Claude Haiku 5.5 (esforço baixo); sem chave, o classificador heurístico.
 */
export async function classificar(doc: { texto: string; titulo: string | null }): Promise<Classificacao> {
  const h = classificarHeuristico(doc.texto, doc.titulo);
  const heuristica: Classificacao = { ...h, modelo: "heuristica", tokensIn: 0, tokensOut: 0, custoCentavos: 0 };
  if (!iaDisponivel()) return heuristica;
  try {
    return await classificarComIA(doc);
  } catch (e) {
    return { ...heuristica, modelo: "heuristica", motivo: `${h.motivo} (IA indisponível: ${(e as Error).message})` };
  }
}
