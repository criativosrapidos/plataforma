import "server-only";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const USER_AGENT = "AvisoConcursoBot/1.0 (+https://avisoconcurso.com.br/robo)";

/**
 * Modo fixture: com COLETA_FIXTURES_DIR definido, os coletores leem arquivos locais em vez da rede
 * (desenvolvimento offline, testes e demonstração ponta a ponta).
 */
export function dirFixtures(): string | null {
  const d = process.env.COLETA_FIXTURES_DIR;
  return d ? path.resolve(/* turbopackIgnore: true */ d) : null;
}

export async function lerFixture(relativo: string): Promise<Buffer | null> {
  const dir = dirFixtures();
  if (!dir) return null;
  const p = path.join(/* turbopackIgnore: true */ dir, relativo);
  return existsSync(/* turbopackIgnore: true */ p) ? readFile(/* turbopackIgnore: true */ p) : null;
}

export async function listarFixtures(relativoDir: string): Promise<string[]> {
  const dir = dirFixtures();
  if (!dir) return [];
  const p = path.join(/* turbopackIgnore: true */ dir, relativoDir);
  if (!existsSync(/* turbopackIgnore: true */ p)) return [];
  return (await readdir(/* turbopackIgnore: true */ p)).sort().map((f) => path.join(relativoDir, f));
}

export class ErroHttp extends Error {
  constructor(public status: number, public url: string, mensagem: string) {
    super(mensagem);
  }
}

/** fetch com User-Agent do robô, timeout e erro claro. */
export async function buscar(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = 30_000, ...resto } = init;
  const headers = new Headers(resto.headers);
  if (!headers.has("user-agent")) headers.set("user-agent", USER_AGENT);
  const r = await fetch(url, { ...resto, headers, signal: AbortSignal.timeout(timeoutMs), redirect: resto.redirect ?? "follow" });
  if (!r.ok) throw new ErroHttp(r.status, url, `HTTP ${r.status} em ${url}`);
  return r;
}

// ---------- robots.txt ----------

interface RegraRobots {
  allow: boolean;
  caminho: string;
}

/** Interpreta um robots.txt e devolve as regras que valem para o nosso robô (grupo próprio ou "*"). */
export function regrasRobots(texto: string, agente = "AvisoConcursoBot"): RegraRobots[] {
  const grupos: { agentes: string[]; regras: RegraRobots[] }[] = [];
  let atual: { agentes: string[]; regras: RegraRobots[] } | null = null;
  let lendoAgentes = false;
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.replace(/#.*$/, "").trim();
    if (!linha) continue;
    const m = linha.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const campo = m[1].toLowerCase();
    const valor = m[2].trim();
    if (campo === "user-agent") {
      if (!atual || !lendoAgentes) {
        atual = { agentes: [], regras: [] };
        grupos.push(atual);
      }
      atual.agentes.push(valor.toLowerCase());
      lendoAgentes = true;
    } else if ((campo === "disallow" || campo === "allow") && atual) {
      lendoAgentes = false;
      if (campo === "disallow" && !valor) continue; // "Disallow:" vazio = tudo liberado
      atual.regras.push({ allow: campo === "allow", caminho: valor });
    } else {
      lendoAgentes = false;
    }
  }
  const nosso = grupos.find((g) => g.agentes.some((a) => a !== "*" && agente.toLowerCase().includes(a)));
  return (nosso ?? grupos.find((g) => g.agentes.includes("*")))?.regras ?? [];
}

function casaCaminho(regra: string, caminho: string): boolean {
  const ancorado = regra.endsWith("$");
  const padrao = regra.replace(/\$$/, "").split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${padrao}${ancorado ? "$" : ""}`).test(caminho);
}

/** Pode buscar este caminho? Regra mais específica (mais longa) vence; empate favorece Allow. */
export function robotsPermite(regras: RegraRobots[], caminho: string): boolean {
  let melhor: RegraRobots | null = null;
  for (const r of regras) {
    if (!casaCaminho(r.caminho, caminho)) continue;
    if (!melhor || r.caminho.length > melhor.caminho.length || (r.caminho.length === melhor.caminho.length && r.allow)) melhor = r;
  }
  return melhor ? melhor.allow : true;
}

const cacheRobots = new Map<string, { regras: RegraRobots[]; ate: number }>();

/** Respeita robots.txt da origem (cache de 6 horas). Sem robots.txt acessível (404), permite. */
export async function podeBuscar(url: string): Promise<boolean> {
  if (dirFixtures()) return true;
  const u = new URL(url);
  const c = cacheRobots.get(u.origin);
  let regras = c && c.ate > Date.now() ? c.regras : null;
  if (!regras) {
    try {
      const r = await fetch(`${u.origin}/robots.txt`, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(10_000) });
      regras = r.ok ? regrasRobots(await r.text()) : [];
    } catch {
      regras = [];
    }
    cacheRobots.set(u.origin, { regras, ate: Date.now() + 6 * 3_600_000 });
  }
  return robotsPermite(regras, u.pathname + u.search);
}

// ---------- HTML → texto ----------

const ENTIDADES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", ordm: "º", ordf: "ª", deg: "°", ndash: "–", mdash: "—",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  atilde: "ã", otilde: "õ", Atilde: "Ã", Otilde: "Õ", acirc: "â", ecirc: "ê", ocirc: "ô", Acirc: "Â", Ecirc: "Ê", Ocirc: "Ô",
  ccedil: "ç", Ccedil: "Ç", agrave: "à", Agrave: "À", uuml: "ü", sect: "§", laquo: "«", raquo: "»", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
};

export function decodificarEntidades(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const cod = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cod) ? String.fromCodePoint(cod) : m;
    }
    return ENTIDADES[e] ?? m;
  });
}

/**
 * Converte HTML em texto preservando a estrutura útil para a extração:
 * parágrafos e itens viram linhas; linhas de tabela viram "célula | célula".
 */
export function htmlParaTexto(html: string): string {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(td|th)>\s*/gi, " | ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|table|section|article|header|footer|ul|ol|dt|dd)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ");
  s = decodificarEntidades(s);
  return s
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").replace(/\s*\|\s*$/, "").replace(/^\s*\|\s*/, "").trim())
    .filter(Boolean)
    .join("\n");
}
