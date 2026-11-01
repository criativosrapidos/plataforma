import "server-only";
import { hojeISO, normalizar, somarDias } from "@aviso/shared";
import { buscar, dirFixtures, lerFixture } from "../http";
import { sha256 } from "../storage";
import type { DocumentoColetado, FonteRow, OpcoesColeta, ResultadoColeta } from "../tipos";

/**
 * Coletor de diários municipais pela API pública do Querido Diário (Open Knowledge Brasil).
 * GET https://queridodiario.ok.org.br/api/gazettes?querystring=...&published_since=...&published_until=...
 *     &excerpt_size=...&number_of_excerpts=...&size=...&offset=...&sort_by=descending_date
 * Resposta: { total_gazettes, gazettes: [{ territory_id, territory_name, state_code, date, edition,
 *            is_extra_edition, url, txt_url, excerpts[] }] }
 * A cobertura de cidades é parcial. Um documento por diário (município + data + edição).
 * config: { termos?: string[], territory_ids?: string[], baixarTexto?: boolean, diasAtras?: number (padrão 3) }
 */

const API = "https://queridodiario.ok.org.br/api";

export interface DiarioQD {
  territory_id: string;
  territory_name: string;
  state_code: string;
  date: string;
  edition?: string | null;
  is_extra_edition?: boolean;
  url: string;
  txt_url?: string | null;
  excerpts?: string[];
}

/** Trechos do texto integral em volta das menções a concurso (para não mandar o diário inteiro à IA). */
export function trechosRelevantes(texto: string, termos: string[], janela = 5000): string {
  const n = normalizar(texto);
  const alvos = termos.map((t) => normalizar(t));
  const faixas: [number, number][] = [];
  for (const t of alvos) {
    let i = n.indexOf(t);
    while (i >= 0) {
      faixas.push([Math.max(0, i - janela / 5), Math.min(texto.length, i + janela)]);
      i = n.indexOf(t, i + t.length);
    }
  }
  faixas.sort((a, b) => a[0] - b[0]);
  const unidas: [number, number][] = [];
  for (const f of faixas) {
    const u = unidas[unidas.length - 1];
    if (u && f[0] <= u[1]) u[1] = Math.max(u[1], f[1]);
    else unidas.push([...f]);
  }
  return unidas.map(([a, b]) => texto.slice(a, b).trim()).join("\n[...]\n");
}

export function documentoDoDiario(g: DiarioQD, termos: string[], textoIntegral?: string | null): DocumentoColetado {
  const corpo = textoIntegral ? trechosRelevantes(textoIntegral, termos) : (g.excerpts ?? []).join("\n[...]\n");
  const titulo = `Diário Oficial de ${g.territory_name}/${g.state_code} – ${g.date.split("-").reverse().join("/")}${g.edition ? ` (edição ${g.edition})` : ""}`;
  return {
    url: g.url,
    titulo,
    conteudo: textoIntegral ?? JSON.stringify(g),
    mime: textoIntegral ? "text/plain" : "application/json",
    texto: `${titulo}\nMunicípio: ${g.territory_name}/${g.state_code}\n${corpo}`,
    publicadoEm: g.date,
    metadata: {
      fonte: "querido_diario",
      territory_id: g.territory_id,
      edition: g.edition ?? null,
      txt_url: g.txt_url ?? null,
      dicas: { esfera: "municipal", uf: g.state_code, cidade: g.territory_name },
    },
    hash: sha256(`qd|${g.territory_id}|${g.date}|${g.edition ?? ""}|${g.is_extra_edition ? "extra" : ""}|${g.url}`),
  };
}

async function consultar(termo: string, data: string, config: { territory_ids?: string[]; diasAtras?: number }): Promise<DiarioQD[]> {
  const out: DiarioQD[] = [];
  // O Querido Diário indexa com atraso: olhamos alguns dias para trás (o hash evita duplicar).
  const desde = somarDias(data, -(config.diasAtras ?? 3));
  for (let offset = 0; offset < 1000; offset += 100) {
    const q = new URLSearchParams({
      querystring: `"${termo}"`,
      published_since: desde,
      published_until: data,
      excerpt_size: "1500",
      number_of_excerpts: "5",
      size: "100",
      offset: String(offset),
      sort_by: "descending_date",
    });
    for (const t of config.territory_ids ?? []) q.append("territory_ids", t);
    const r = await buscar(`${API}/gazettes?${q}`, { headers: { accept: "application/json" } });
    const j = (await r.json()) as { total_gazettes: number; gazettes: DiarioQD[] };
    out.push(...j.gazettes);
    if (out.length >= j.total_gazettes || j.gazettes.length < 100) break;
  }
  return out;
}

export async function coletarQueridoDiario(fonte: FonteRow, opts: OpcoesColeta = {}): Promise<ResultadoColeta> {
  const data = opts.data ?? hojeISO(opts.agora);
  const config = fonte.config as { termos?: string[]; territory_ids?: string[]; baixarTexto?: boolean; diasAtras?: number };
  const termos = config.termos?.length ? config.termos : ["concurso público", "edital de abertura", "processo seletivo"];
  const porDiario = new Map<string, DiarioQD>();
  if (dirFixtures()) {
    const buf = await lerFixture(`querido-diario/${data}.json`);
    const j = buf ? (JSON.parse(buf.toString("utf8")) as { gazettes: DiarioQD[] }) : { gazettes: [] };
    for (const g of j.gazettes) porDiario.set(`${g.territory_id}|${g.date}|${g.edition ?? ""}|${g.url}`, g);
  } else {
    for (const termo of termos) {
      for (const g of await consultar(termo, data, config)) {
        const k = `${g.territory_id}|${g.date}|${g.edition ?? ""}|${g.url}`;
        const atual = porDiario.get(k);
        if (atual) atual.excerpts = [...new Set([...(atual.excerpts ?? []), ...(g.excerpts ?? [])])];
        else porDiario.set(k, g);
      }
    }
  }
  const documentos: DocumentoColetado[] = [];
  const avisos: string[] = [];
  for (const g of porDiario.values()) {
    let integral: string | null = null;
    if (config.baixarTexto !== false && g.txt_url && !dirFixtures()) {
      try {
        integral = await (await buscar(g.txt_url, { timeoutMs: 60_000 })).text();
      } catch (e) {
        avisos.push(`txt indisponível (${g.territory_name}): ${(e as Error).message}`);
      }
    }
    documentos.push(documentoDoDiario(g, termos, integral));
  }
  return { encontrados: porDiario.size, documentos, avisos };
}
