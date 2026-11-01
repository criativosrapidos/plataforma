import "server-only";

export interface RespostaEdital {
  resposta: string;
  encontrado: boolean;
  citacoes: { item: string | null; pagina: number | null; trecho: string | null }[];
  modelo: string;
  tokensIn: number;
  tokensOut: number;
  cacheReadTokens: number;
  custoCentavos: number;
}

/**
 * Responde só com base no texto do edital, citando item e página.
 * Se não estiver no edital, diz que não encontrou.
 * Implementação padrão (sem ANTHROPIC_API_KEY): busca por trechos com as palavras da pergunta.
 */
export async function perguntarAoEdital(p: { editalTexto: string; pergunta: string; tituloConcurso: string }): Promise<RespostaEdital> {
  const termos = p.pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/\W+/)
    .filter((t) => t.length > 3);
  const paragrafos = p.editalTexto.split(/\n{2,}/);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let melhor = { score: 0, trecho: "" };
  for (const par of paragrafos) {
    const n = norm(par);
    const score = termos.filter((t) => n.includes(t)).length;
    if (score > melhor.score) melhor = { score, trecho: par.trim() };
  }
  const encontrado = melhor.score >= Math.min(2, termos.length) && melhor.score > 0;
  const item = melhor.trecho.match(/^(\d+(?:\.\d+)*)/)?.[1] ?? null;
  return {
    resposta: encontrado
      ? `Segundo o edital: ${melhor.trecho.slice(0, 600)}`
      : "Não encontrei essa informação no edital. Confira o documento oficial ou a página da banca.",
    encontrado,
    citacoes: encontrado ? [{ item, pagina: null, trecho: melhor.trecho.slice(0, 300) }] : [],
    modelo: "busca-local",
    tokensIn: 0,
    tokensOut: 0,
    cacheReadTokens: 0,
    custoCentavos: 0,
  };
}
