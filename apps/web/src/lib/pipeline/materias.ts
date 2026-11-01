import { normalizar, slugify } from "@aviso/shared";
import type { Tx } from "@/lib/db";

/**
 * Normalização de matérias para a tabela canônica (subjects): nome exato, sinônimo ou similaridade.
 * Assim "Português", "LÍNGUA PORTUGUESA" e "Noções de Língua Portuguesa" caem na mesma matéria
 * e as "matérias em comum" cruzam editais diferentes.
 */

export interface MateriaCatalogo {
  id: string;
  nome: string;
  sinonimos: string[];
}

const PREFIXOS = [
  "nocoes basicas de ", "nocoes de ", "conhecimentos basicos de ", "conhecimentos gerais de ", "conhecimentos de ",
  "conhecimentos em ", "fundamentos de ", "elementos de ", "topicos de ", "introducao a ", "introducao ao ", "estudo de ",
];

/** Limpa o nome como aparece no edital: numeração, conteúdo depois de ":" e parênteses, caixa. */
export function limparNomeMateria(bruto: string): string {
  let s = bruto
    .replace(/^\s*[-–•*]\s*/, "")
    .replace(/^\s*(\d+(\.\d+)*|[ivxlc]+)[.)\-–]?\s+/i, "")
    .replace(/\(.*?\)/g, " ")
    .split(/\s*[:;]\s*|\s+[–—]\s+|\s+-\s+/)[0]
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,]+$/, "");
  if (s === s.toUpperCase()) {
    // "LÍNGUA PORTUGUESA" → "Língua Portuguesa" (preposições em minúsculo)
    s = s
      .toLowerCase()
      .split(" ")
      .map((p, i) => (i > 0 && /^(de|da|do|das|dos|e|em|no|na|a|o|ao|à)$/.test(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
      .join(" ");
  }
  return s;
}

function chave(s: string): string {
  return normalizar(s).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function semPrefixo(s: string): string {
  for (const p of PREFIXOS) if (s.startsWith(p)) return s.slice(p.length);
  return s;
}

/** Coeficiente de Dice sobre bigramas de caracteres (0 a 1). */
export function similaridade(a: string, b: string): number {
  const x = chave(a).replace(/ /g, "");
  const y = chave(b).replace(/ /g, "");
  if (x === y) return 1;
  if (x.length < 2 || y.length < 2) return 0;
  const bigramas = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) ?? 0) + 1);
    return m;
  };
  const bx = bigramas(x);
  const by = bigramas(y);
  let comum = 0;
  for (const [k, n] of bx) comum += Math.min(n, by.get(k) ?? 0);
  return (2 * comum) / (x.length - 1 + (y.length - 1));
}

export const LIMIAR_SIMILARIDADE = 0.86;

/** Acha a matéria canônica para um nome do edital. Devolve null se nada for parecido o bastante. */
export function resolverMateria<T extends MateriaCatalogo>(nomeBruto: string, catalogo: T[]): T | null {
  const limpo = limparNomeMateria(nomeBruto);
  const k = chave(limpo);
  if (!k) return null;
  const formas = new Set([k, semPrefixo(k)]);
  // 1) nome ou sinônimo exatos (com e sem "Noções de")
  for (const m of catalogo) {
    const nomes = [m.nome, ...m.sinonimos].map(chave);
    if (nomes.some((n) => formas.has(n) || formas.has(semPrefixo(n)))) return m;
  }
  // 2) similaridade de caracteres (erros de digitação, plural, hífen)
  let melhor: { m: T; s: number } | null = null;
  for (const m of catalogo) {
    for (const n of [m.nome, ...m.sinonimos]) {
      for (const f of formas) {
        const s = similaridade(f, n);
        if (!melhor || s > melhor.s) melhor = { m, s };
      }
    }
  }
  return melhor && melhor.s >= LIMIAR_SIMILARIDADE ? melhor.m : null;
}

/**
 * Resolve uma lista de nomes contra a tabela subjects; cria a matéria quando não existe nada parecido
 * (o nome limpo vira canônico e passa a casar nos próximos editais).
 */
export async function idsDasMaterias(tx: Tx, nomes: string[]): Promise<Map<string, string>> {
  const catalogo = await tx<MateriaCatalogo[]>`select id, nome, sinonimos from subjects`;
  const out = new Map<string, string>();
  for (const nome of nomes) {
    if (out.has(nome)) continue;
    const achada = resolverMateria(nome, catalogo);
    if (achada) {
      out.set(nome, achada.id);
      continue;
    }
    const limpo = limparNomeMateria(nome);
    if (limpo.length < 3) continue;
    const [nova] = await tx<MateriaCatalogo[]>`
      insert into subjects (nome, slug, sinonimos) values (${limpo}, ${slugify(limpo)}, ${[]}::text[])
      on conflict (slug) do update set nome = subjects.nome
      returning id, nome, sinonimos`;
    catalogo.push(nova);
    out.set(nome, nova.id);
  }
  return out;
}
