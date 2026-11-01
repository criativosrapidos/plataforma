import "server-only";
import { hojeISO } from "@aviso/shared";
import { ehConcursoPublico } from "../filtro";
import { buscar, decodificarEntidades, ErroHttp, htmlParaTexto, lerFixture, listarFixtures, USER_AGENT } from "../http";
import type { DocumentoColetado, FonteRow, OpcoesColeta, ResultadoColeta } from "../tipos";
import { lerZip } from "../zip";

/**
 * Coletor do Diário Oficial da União pelo INLABS (Imprensa Nacional).
 * Formato conferido com o exemplo oficial (github.com/Imprensa-Nacional/inlabs):
 * - login: POST https://inlabs.in.gov.br/logar.php (email, password) → cookie `inlabs_session_cookie`;
 * - download: GET https://inlabs.in.gov.br/index.php?p=AAAA-MM-DD&dl=AAAA-MM-DD-DO3.zip
 *   com `Cookie: inlabs_session_cookie=...` e `origem: 736372697074`; 404 = sem edição;
 * - cada .zip traz um XML por matéria: <xml><article ... pubName pubDate artType artCategory numberPage pdfPage>
 *   <body><Identifica/><Data/><Ementa/><Titulo/><SubTitulo/><Texto/></body></article></xml>.
 * Não inventamos campos: usamos só os atributos acima e o texto.
 */

const BASE = "https://inlabs.in.gov.br";

export interface ArtigoDou {
  id: string | null;
  idMateria: string | null;
  nome: string | null;
  secao: string | null;
  tipo: string | null;
  categoria: string | null;
  publicadoEm: string | null; // AAAA-MM-DD
  pagina: number | null;
  urlPdf: string | null;
  edicao: string | null;
  identifica: string;
  ementa: string;
  titulo: string;
  subtitulo: string;
  textoHtml: string;
}

function atributo(tag: string, nome: string): string | null {
  const m = tag.match(new RegExp(`\\s${nome}\\s*=\\s*"([^"]*)"`, "i")) ?? tag.match(new RegExp(`\\s${nome}\\s*=\\s*'([^']*)'`, "i"));
  return m ? decodificarEntidades(m[1]).trim() || null : null;
}

function elemento(xml: string, nome: string): string {
  const m = xml.match(new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, "i"));
  if (!m) return "";
  const c = m[1].trim();
  const cdata = c.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1] : decodificarEntidades(c);
}

/** "30/10/2026" → "2026-10-30". */
function dataBRparaISO(s: string | null): string | null {
  const m = s?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}

/** Lê uma matéria do XML do INLABS. */
export function parseArtigoInlabs(xml: string): ArtigoDou | null {
  const tag = xml.match(/<article\b[^>]*>/i)?.[0];
  if (!tag) return null;
  const pagina = Number(atributo(tag, "numberPage"));
  return {
    id: atributo(tag, "id"),
    idMateria: atributo(tag, "idMateria"),
    nome: atributo(tag, "name"),
    secao: atributo(tag, "pubName"),
    tipo: atributo(tag, "artType"),
    categoria: atributo(tag, "artCategory"),
    publicadoEm: dataBRparaISO(atributo(tag, "pubDate")),
    pagina: Number.isFinite(pagina) && pagina > 0 ? pagina : null,
    urlPdf: atributo(tag, "pdfPage"),
    edicao: atributo(tag, "editionNumber"),
    identifica: htmlParaTexto(elemento(xml, "Identifica")),
    ementa: htmlParaTexto(elemento(xml, "Ementa")),
    titulo: htmlParaTexto(elemento(xml, "Titulo")),
    subtitulo: htmlParaTexto(elemento(xml, "SubTitulo")),
    textoHtml: elemento(xml, "Texto"),
  };
}

/** Órgão mais específico da categoria do DOU ("Poder Judiciário/Justiça do Trabalho/Tribunal ..." → "Tribunal ..."). */
export function orgaoDaCategoria(categoria: string | null): string | null {
  if (!categoria) return null;
  const partes = categoria.split("/").map((p) => p.trim()).filter(Boolean);
  const genericos = /^(poder (judiciario|judiciário|executivo|legislativo)|entidades de fiscaliza|minist[ée]rio p[úu]blico da uni[ãa]o|justi[çc]a (do trabalho|federal|eleitoral|militar))$/i;
  // Subunidades (diretoria, coordenação...) não são o órgão do concurso: sobe um nível.
  const subunidade = /^(diretoria|coordena|superintend|gabinete|departamento de (gest|administra)|secretaria-executiva|subsecretaria|divis|servi[çc]o de|se[çc][ãa]o de|n[úu]cleo)/i;
  const especificos = partes.filter((p) => !genericos.test(p) && !subunidade.test(p));
  return especificos[especificos.length - 1] ?? partes[partes.length - 1] ?? null;
}

function urlOficial(a: ArtigoDou, data: string): string {
  if (a.urlPdf) return a.urlPdf.replace(/^http:\/\//, "https://");
  const [ano, mes, dia] = (a.publicadoEm ?? data).split("-");
  return `https://www.in.gov.br/leiturajornal?data=${dia}-${mes}-${ano}&secao=${(a.secao ?? "do3").toLowerCase()}`;
}

/** Transforma uma matéria em documento coletado (ou null se não for de concurso). */
export function documentoDoArtigo(xml: string, data: string): DocumentoColetado | null {
  const a = parseArtigoInlabs(xml);
  if (!a) return null;
  const corpo = htmlParaTexto(a.textoHtml);
  const texto = [
    a.pagina ? `[página ${a.pagina}]` : null,
    a.categoria ? `Órgão: ${a.categoria.replace(/\//g, " / ")}` : null,
    a.identifica,
    a.titulo,
    a.subtitulo,
    a.ementa,
    corpo,
  ]
    .filter(Boolean)
    .join("\n");
  if (!ehConcursoPublico(texto)) return null;
  return {
    url: urlOficial(a, data),
    titulo: a.identifica || a.nome,
    conteudo: xml,
    mime: "application/xml",
    texto,
    publicadoEm: a.publicadoEm ?? data,
    metadata: {
      fonte: "dou",
      secao: a.secao,
      artType: a.tipo,
      artCategory: a.categoria,
      idMateria: a.idMateria,
      pagina: a.pagina,
      edicao: a.edicao,
      dicas: { orgao: orgaoDaCategoria(a.categoria), esfera: "federal" },
    },
  };
}

/** Login no INLABS; devolve o valor do cookie de sessão. */
async function loginInlabs(email: string, senha: string): Promise<string> {
  const r = await fetch(`${BASE}/logar.php`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": USER_AGENT,
    },
    body: new URLSearchParams({ email, password: senha }).toString(),
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  const cookies = r.headers.getSetCookie?.() ?? [r.headers.get("set-cookie") ?? ""];
  for (const c of cookies) {
    const m = c.match(/inlabs_session_cookie=([^;]+)/);
    if (m) return m[1];
  }
  throw new Error("INLABS: login falhou (sem cookie de sessão). Confira INLABS_EMAIL/INLABS_SENHA.");
}

async function baixarSecao(cookie: string, data: string, secao: string): Promise<Buffer | null> {
  try {
    const r = await buscar(`${BASE}/index.php?p=${data}&dl=${data}-${secao}.zip`, {
      headers: { cookie: `inlabs_session_cookie=${cookie}`, origem: "736372697074" },
      timeoutMs: 120_000,
    });
    const tipo = r.headers.get("content-type") ?? "";
    const buf = Buffer.from(await r.arrayBuffer());
    // Sem edição o INLABS pode devolver HTML em vez de 404.
    if (tipo.includes("text/html") || buf.readUInt32LE(0) !== 0x04034b50) return null;
    return buf;
  } catch (e) {
    if (e instanceof ErroHttp && e.status === 404) return null;
    throw e;
  }
}

/** XMLs do dia: do INLABS ou, em modo fixture, de dou/AAAA-MM-DD/*.xml|*.zip. */
async function xmlsDoDia(fonte: FonteRow, data: string): Promise<{ xmls: string[]; avisos: string[] }> {
  const avisos: string[] = [];
  const locais = await listarFixtures(`dou/${data}`);
  if (process.env.COLETA_FIXTURES_DIR) {
    const xmls: string[] = [];
    for (const f of locais) {
      const buf = (await lerFixture(f))!;
      if (f.endsWith(".zip")) xmls.push(...lerZip(buf).filter((e) => e.nome.endsWith(".xml")).map((e) => e.conteudo.toString("utf8")));
      else if (f.endsWith(".xml")) xmls.push(buf.toString("utf8"));
    }
    return { xmls, avisos };
  }
  const email = process.env.INLABS_EMAIL;
  const senha = process.env.INLABS_SENHA;
  if (!email || !senha) throw new Error("INLABS_EMAIL/INLABS_SENHA não configurados (cadastro gratuito em inlabs.in.gov.br).");
  const secoes = Array.isArray(fonte.config.secoes) ? (fonte.config.secoes as string[]) : ["DO1", "DO2", "DO3"];
  const cookie = await loginInlabs(email, senha);
  const xmls: string[] = [];
  for (const secao of [...secoes, ...secoes.map((s) => `${s}E`)]) {
    const zip = await baixarSecao(cookie, data, secao);
    if (!zip) {
      if (!secao.endsWith("E")) avisos.push(`${secao} ${data}: sem edição`);
      continue;
    }
    xmls.push(...lerZip(zip).filter((e) => e.nome.toLowerCase().endsWith(".xml")).map((e) => e.conteudo.toString("utf8")));
  }
  return { xmls, avisos };
}

export async function coletarDou(fonte: FonteRow, opts: OpcoesColeta = {}): Promise<ResultadoColeta> {
  const data = opts.data ?? hojeISO(opts.agora);
  const { xmls, avisos } = await xmlsDoDia(fonte, data);
  const documentos = xmls.map((x) => documentoDoArtigo(x, data)).filter((d): d is DocumentoColetado => !!d);
  return { encontrados: xmls.length, documentos, avisos };
}
