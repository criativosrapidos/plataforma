import "server-only";
import { normalizar, slugify } from "@aviso/shared";
import { ehConcursoPublico } from "../filtro";
import { buscar, decodificarEntidades, dirFixtures, htmlParaTexto, lerFixture, podeBuscar } from "../http";
import { sha256 } from "../storage";
import type { DocumentoColetado, FonteRow, OpcoesColeta, ResultadoColeta } from "../tipos";

/**
 * Coletor das páginas de concursos das bancas (Cebraspe, FGV, FCC, Vunesp, Cesgranrio, IBFC, AOCP, Quadrix, Idecan).
 * - Respeita robots.txt; lê a página a cada hora; se o hash da lista não mudou, não faz mais nada.
 * - Cada link de concurso/edital vira um documento (hash = banca + link + título): rodar 2x não duplica.
 * - Se o link aponta para uma página HTML da própria banca, o texto dela entra no documento.
 * config (sources.config): { linkRegex?: string (filtra hrefs), maxItens?: number, detalhes?: boolean }
 */

const NOMES_BANCA: Record<string, string> = {
  cebraspe: "Cebraspe", fgv: "FGV", fcc: "FCC", vunesp: "Vunesp", cesgranrio: "Cesgranrio",
  ibfc: "IBFC", aocp: "AOCP", quadrix: "Quadrix", idecan: "Idecan",
};

export interface ItemBanca {
  url: string;
  titulo: string;
  contexto: string;
}

const LIXO = /^(inscri[çc][õo]es?|saiba mais|leia mais|ver mais|acesse|clique aqui|voltar|in[íi]cio|home|contato|login|entrar|resultados?|todos( os concursos)?|concursos?|editais|ajuda)$/i;

/** Extrai da página da banca os links que parecem concursos/editais. */
export function extrairItensBanca(html: string, baseUrl: string, config: { linkRegex?: string } = {}): ItemBanca[] {
  const filtroHref = config.linkRegex ? new RegExp(config.linkRegex, "i") : null;
  const itens = new Map<string, ItemBanca>();
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const href = attrs.match(/\bhref\s*=\s*["']([^"'#]+)["']/i)?.[1];
    if (!href || /^(mailto|javascript|tel):/i.test(href)) continue;
    let url: string;
    try {
      url = new URL(decodificarEntidades(href), baseUrl).toString();
    } catch {
      continue;
    }
    const tituloAttr = attrs.match(/\btitle\s*=\s*["']([^"']+)["']/i)?.[1];
    const titulo = htmlParaTexto(m[2]).replace(/\s+/g, " ").trim() || (tituloAttr ? decodificarEntidades(tituloAttr) : "");
    if (titulo.length < 8 || LIXO.test(titulo)) continue;
    if (filtroHref && !filtroHref.test(url)) continue;
    // Contexto: texto logo depois do link (até o próximo link), útil para datas/situação na listagem.
    const depois = html.slice(re.lastIndex, re.lastIndex + 600).split(/<a\b/i)[0];
    const contexto = htmlParaTexto(depois).replace(/\s+/g, " ").slice(0, 300);
    const alvo = normalizar(`${titulo} ${url}`);
    if (!filtroHref && !/concurso|edital|selecao|seletivo|retifica/.test(alvo)) continue;
    if (!itens.has(url)) itens.set(url, { url, titulo, contexto });
  }
  return [...itens.values()];
}

/** Trecho estável da página para o hash (só a lista de links de concurso). */
function assinaturaLista(itens: ItemBanca[]): string {
  return sha256(itens.map((i) => `${i.url}\t${normalizar(i.titulo)}`).sort().join("\n"));
}

async function lerPagina(fonte: FonteRow, url: string, principal: boolean): Promise<string | null> {
  if (dirFixtures()) {
    const rel = principal ? `bancas/${fonte.slug}.html` : `bancas/${fonte.slug}/${slugify(new URL(url).pathname + new URL(url).search) || "index"}.html`;
    return (await lerFixture(rel))?.toString("utf8") ?? null;
  }
  if (!(await podeBuscar(url))) return null;
  const r = await buscar(url, { headers: { accept: "text/html,application/xhtml+xml" } });
  const tipo = r.headers.get("content-type") ?? "";
  if (!tipo.includes("html")) return null;
  return r.text();
}

export async function coletarBanca(fonte: FonteRow, opts: OpcoesColeta = {}): Promise<ResultadoColeta> {
  if (!fonte.url) throw new Error(`fonte ${fonte.slug} sem URL`);
  if (!dirFixtures() && !(await podeBuscar(fonte.url))) {
    return { encontrados: 0, documentos: [], avisos: [`robots.txt não permite ${fonte.url}`] };
  }
  const html = await lerPagina(fonte, fonte.url, true);
  if (html == null) return { encontrados: 0, documentos: [], avisos: ["página indisponível"] };
  const config = fonte.config as { linkRegex?: string; maxItens?: number; detalhes?: boolean };
  const itens = extrairItensBanca(html, fonte.url, config);
  const hashPagina = assinaturaLista(itens);
  if (fonte.ultimo_hash && fonte.ultimo_hash === hashPagina) {
    return { encontrados: itens.length, documentos: [], hashPagina, semMudanca: true };
  }
  const banca = NOMES_BANCA[fonte.slug] ?? fonte.nome;
  const hoje = (opts.agora ?? new Date()).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const documentos: DocumentoColetado[] = [];
  for (const item of itens.slice(0, config.maxItens ?? 40)) {
    let detalhe: string | null = null;
    const mesmaOrigem = new URL(item.url).origin === new URL(fonte.url).origin;
    const ehPdf = /\.pdf($|\?)/i.test(item.url);
    if (config.detalhes !== false && mesmaOrigem && !ehPdf) {
      try {
        detalhe = await lerPagina(fonte, item.url, false);
      } catch {
        detalhe = null;
      }
    }
    const textoDetalhe = detalhe ? htmlParaTexto(detalhe) : "";
    const texto = [`Banca: ${banca}`, item.titulo, item.contexto, textoDetalhe].filter(Boolean).join("\n");
    if (!ehConcursoPublico(texto) && !/edital|concurso/i.test(item.titulo)) continue;
    documentos.push({
      url: item.url,
      titulo: item.titulo,
      conteudo: detalhe ?? JSON.stringify(item),
      mime: detalhe ? "text/html" : "application/json",
      texto,
      publicadoEm: hoje,
      metadata: { fonte: "banca", banca, item, pdf: ehPdf, dicas: { banca } },
      hash: sha256(`banca|${fonte.slug}|${item.url}|${normalizar(item.titulo)}`),
    });
  }
  return { encontrados: itens.length, documentos, hashPagina };
}
