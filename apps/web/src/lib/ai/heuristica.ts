// Leitores heurísticos (regex) de desenvolvimento: classificam e extraem sem IA,
// para tudo rodar localmente e nos testes sem ANTHROPIC_API_KEY. Em produção, a confiança
// deles é limitada para que nada seja publicado sem revisão humana.
import { BANCAS, normalizar, type ActTipo, type DateTipo, type Escolaridade, type Esfera } from "@aviso/shared";
import { MATERIAS_CANONICAS } from "../../../db/subjects";
import { resolverMateria } from "@/lib/pipeline/materias";
import type { DicasDocumento } from "@/lib/pipeline/tipos";

// ---------- Classificação ----------

// Ordem importa: errata cita o edital de abertura; nomeação cita o edital de homologação.
const REGRAS_TIPO: { tipo: ActTipo; re: RegExp; conf: number }[] = [
  { tipo: "retificacao", re: /\bretifica(cao|coes|r|-se|do|da|dos|das)?\b|fica(m)? retificad|\berrata\b/, conf: 0.92 },
  {
    tipo: "edital_abertura",
    re: /torna(m)? public[ao] (a )?(abertura|realizacao)|abertura (das |de )?inscricoes|estabelece (as )?normas (para|relativas a) (a )?realizacao de concurso|(^|\n)\s*edital (n[o°º.]*\s*\d+[^\n]{0,60})?de abertura|abertura de concurso/,
    conf: 0.9,
  },
  { tipo: "homologacao", re: /\bhomolog(a|ar|acao)\b/, conf: 0.88 },
  { tipo: "convocacao", re: /\b(nomear|nomeacao|nomeia|convoca(r|cao)?|convocados?|tomar posse|posse dos)\b/, conf: 0.85 },
  { tipo: "resultado", re: /\bresultado (final|preliminar|definitivo|da prova|das provas|do concurso)|\bgabaritos? (oficial|preliminar|definitivo)/, conf: 0.82 },
  { tipo: "autorizacao", re: /\bautoriza(r|cao)?\b[^.]{0,80}\bconcurso\b|\bfica autorizad[ao][^.]{0,80}concurso/, conf: 0.88 },
  { tipo: "previsto", re: /previsao de (novo )?concurso|concurso previsto|solicita(cao|r) (de )?autorizacao (para|de) concurso|pedido de (novo )?concurso/, conf: 0.65 },
];

/** Classifica um ato pelo título (peso maior) e depois pelo texto todo. */
export function classificarHeuristico(texto: string, titulo?: string | null): { tipo: ActTipo; confianca: number; motivo: string } {
  const cabeca = normalizar(`${titulo ?? ""}\n${texto.slice(0, 700)}`);
  for (const r of REGRAS_TIPO) if (r.re.test(cabeca)) return { tipo: r.tipo, confianca: r.conf, motivo: `título/início: ${r.tipo}` };
  const tudo = normalizar(texto);
  for (const r of REGRAS_TIPO) if (r.re.test(tudo)) return { tipo: r.tipo, confianca: Math.max(0.55, r.conf - 0.2), motivo: `texto: ${r.tipo}` };
  if (/\bedital\b/.test(tudo) && /\binscric/.test(tudo) && /\bconcurso\b/.test(tudo)) return { tipo: "edital_abertura", confianca: 0.7, motivo: "edital + inscrições" };
  return { tipo: "outro", confianca: 0.7, motivo: "nenhum padrão de concurso" };
}

// ---------- Datas ----------

const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const RE_MES = MESES.join("|");

interface DataAchada {
  dia: number;
  mes: number;
  ano: number | null;
  pos: number;
}

/** Datas de uma linha, em ordem (preenche o ano que faltar com a próxima data que tem ano). */
export function datasNaLinha(linha: string, anoPadrao: number): string[] {
  let s = normalizar(linha);
  // Datas de atos citados ("Edital nº 1, de 28 de outubro de 2026", "DOU de 29/10/2026") não são prazos.
  s = s.replace(
    new RegExp(`\\b(edital|portaria|resolucao|decreto|lei|instrucao normativa|aviso|extrato)\\s+(n[o°º.]*\\s*)?[\\d./-]+,?\\s+de\\s+\\d{1,2}(o|º)?\\s+de\\s+(${RE_MES})\\s+de\\s+\\d{4}`, "g"),
    " ",
  );
  s = s.replace(new RegExp(`(diario oficial[a-z ]{0,20}|\\bdou\\b)[^,.;]{0,30}?\\bde\\s+(\\d{1,2}\\/\\d{1,2}\\/\\d{4}|\\d{1,2}(o|º)?\\s+de\\s+(${RE_MES})\\s+de\\s+\\d{4})`, "g"), " ");
  // "de 3 a 30 de novembro de 2026" → "3 de novembro a 30 de novembro de 2026"
  s = s.replace(new RegExp(`\\b(\\d{1,2})(?:o|º)?\\s+(a|e|ate)\\s+(\\d{1,2})(?:o|º)?\\s+de\\s+(${RE_MES})`, "g"), "$1 de $4 $2 $3 de $4");
  const re = new RegExp(
    `\\b(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{4}))?(?![\\d\\/])|\\b(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})\\b|\\b(\\d{1,2})(?:o|º)?\\s+de\\s+(${RE_MES})(?:\\s+de\\s+(\\d{4}))?`,
    "g",
  );
  const achadas: DataAchada[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[1]) achadas.push({ dia: +m[1], mes: +m[2], ano: m[3] ? +m[3] : null, pos: m.index });
    else if (m[4]) achadas.push({ dia: +m[4], mes: +m[5], ano: +m[6], pos: m.index });
    else achadas.push({ dia: +m[7], mes: MESES.indexOf(m[8]) + 1, ano: m[9] ? +m[9] : null, pos: m.index });
  }
  let proximoAno: number | null = null;
  let proximoMes: number | null = null;
  for (let i = achadas.length - 1; i >= 0; i--) {
    const a = achadas[i];
    if (a.ano == null) {
      a.ano = proximoAno ?? anoPadrao;
      if (proximoAno != null && proximoMes != null && a.mes > proximoMes) a.ano -= 1; // "15/12 a 10/01/2027"
    }
    proximoAno = a.ano;
    proximoMes = a.mes;
  }
  return achadas
    .filter((a) => a.mes >= 1 && a.mes <= 12 && a.dia >= 1 && a.dia <= 31 && a.ano! >= 2000 && a.ano! <= 2100)
    .map((a) => `${a.ano}-${String(a.mes).padStart(2, "0")}-${String(a.dia).padStart(2, "0")}`);
}

function tipoDaLinha(n: string): DateTipo | null {
  if (/\brecurso/.test(n)) return "recurso";
  if (/\bresultado/.test(n)) return /isencao|inscric/.test(n) ? null : "resultado";
  if (/isencao/.test(n)) return "isencao";
  if (/locais? de (prova|realizacao)|cartao de confirmacao|ensalamento/.test(n)) return "local_prova";
  if (/gabarito/.test(n)) return "gabarito";
  if (/pagamento|boleto|recolhimento/.test(n)) return "pagamento";
  if (/inscric/.test(n)) return "inscricao";
  if (/\bprovas?\b|\baplicacao\b/.test(n)) return "prova";
  return null;
}

const TIPOS_PERIODO: DateTipo[] = ["isencao", "inscricao", "pagamento", "recurso"];

export interface DataExtraida {
  tipo: DateTipo;
  inicio: string | null;
  fim: string | null;
  descricao: string | null;
  origem: { item: string | null; pagina: number | null };
}

/** Página em que um trecho está (marcadores "[página N]" do coletor). */
function paginaEm(texto: string, pos: number): number | null {
  const antes = texto.slice(0, pos);
  const m = [...antes.matchAll(/\[p[áa]gina (\d+)\]/gi)].pop();
  return m ? Number(m[1]) : null;
}

export function extrairDatas(texto: string, anoPadrao: number): DataExtraida[] {
  const out = new Map<DateTipo, DataExtraida>();
  let pos = 0;
  for (const linha of texto.split("\n")) {
    const inicioLinha = pos;
    pos += linha.length + 1;
    let n = normalizar(linha);
    let alvo = linha;
    // Errata: "Onde se lê ... Leia-se ..." → vale o que vem depois de "leia-se".
    if (/onde se le/.test(n)) {
      const i = n.indexOf("leia-se");
      if (i < 0) continue;
      n = n.slice(i);
      alvo = linha.slice(i);
    }
    const tipo = tipoDaLinha(n);
    if (!tipo || out.has(tipo)) continue;
    const datas = datasNaLinha(alvo, anoPadrao);
    if (!datas.length) continue;
    let inicio: string | null = datas[0];
    let fim: string | null = datas[datas.length - 1];
    if (datas.length === 1 && TIPOS_PERIODO.includes(tipo)) {
      if (/\b(a partir d|inicio|começa|comeca)/.test(n)) fim = null;
      else inicio = null;
    }
    out.set(tipo, {
      tipo,
      inicio,
      fim,
      descricao: null,
      origem: { item: linha.trim().match(/^(\d+(?:\.\d+)+)/)?.[1] ?? null, pagina: paginaEm(texto, inicioLinha) },
    });
  }
  return [...out.values()];
}

// ---------- Valores ----------

/** "R$ 14.200,00" → 1420000. */
export function centavos(s: string | null | undefined): number | null {
  const m = s?.match(/R\$\s*([\d.]+)(?:,(\d{2}))?/);
  if (!m) return null;
  const v = Number(m[1].replace(/\./g, "")) * 100 + Number(m[2] ?? 0);
  return Number.isFinite(v) && v > 0 ? v : null;
}

// ---------- Órgão, esfera, local, banca ----------

const ORGAO_RE =
  /(Tribunal (?:Regional|Superior|de Justi[çc]a|de Contas|Regional Eleitoral)[^,;.\n(|]{0,80}|Prefeitura (?:Municipal )?de [^,;.\n(|]{2,40}|C[âa]mara (?:Municipal )?de [^,;.\n(|]{2,40}|Pol[íi]cia (?:Federal|Rodovi[áa]ria Federal|Civil|Militar|Penal)[^,;.\n(|]{0,50}|Minist[ée]rio (?:P[úu]blico )?[^,;.\n(|]{3,70}|Instituto Nacional [^,;.\n(|]{3,60}|Instituto Federal [^,;.\n(|]{3,60}|Universidade (?:Federal|Estadual)[^,;.\n(|]{3,60}|Ag[êe]ncia Nacional [^,;.\n(|]{3,60}|Banco (?:do Brasil|Central do Brasil|do Nordeste|da Amaz[ôo]nia)|Caixa Econ[ôo]mica Federal|Receita Federal(?: do Brasil)?|Defensoria P[úu]blica [^,;.\n(|]{3,60}|Procuradoria[^,;.\n(|]{3,60}|Assembleia Legislativa [^,;.\n(|]{3,40}|Secretaria (?:de Estado |Municipal )?d[aeo] [^,;.\n(|]{3,60}|Conselho (?:Regional|Federal) [^,;.\n(|]{3,60}|Senado Federal|C[âa]mara dos Deputados|Corpo de Bombeiros Militar[^,;.\n(|]{0,40}|Departamento de Pol[íi]cia [^,;.\n(|]{3,40}|Controladoria-Geral [^,;.\n(|]{3,40}|Advocacia-Geral da Uni[ãa]o)/i;

const CORTE_ORGAO = /\s+(torna|no uso|resolve|faz saber|comunica|por meio|mediante|para (o|a|os|as) |de acordo|nos termos|em conformidade|realizar[áa]|considerando|referente|relativo|que trata)\b.*$/i;

/** "PREFEITURA MUNICIPAL DE CAMPINAS" → "Prefeitura Municipal de Campinas". */
function capitalizar(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .split(" ")
    .map((p, i) => (i > 0 && /^(de|da|do|das|dos|e|em|no|na)$/.test(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

function limparOrgao(s: string): string {
  return capitalizar(
    s
      .replace(/\s+[–—-]\s+.*$/, "")
      .replace(CORTE_ORGAO, "")
      .replace(/\s+(concurso|edital)\b.*$/i, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

const UF_NOMES: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE", "distrito federal": "DF", "espirito santo": "ES",
  goias: "GO", maranhao: "MA", "mato grosso do sul": "MS", "mato grosso": "MT", "minas gerais": "MG", para: "PA", paraiba: "PB", parana: "PR",
  pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ", "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO", roraima: "RR",
  "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};
const UFS_RE = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO";
const TRT_UF = ["", "RJ", "SP", "MG", "RS", "BA", "PE", "CE", "PA", "PR", "DF", "AM", "SC", "PB", "RO", "SP", "MA", "ES", "GO", "AL", "SE", "RN", "PI", "MT", "MS"];
const TRF_UF = ["", "DF", "RJ", "SP", "RS", "PE", "MG"];

function ufPorRegiao(orgao: string): string | null {
  const n = normalizar(orgao);
  const trt = n.match(/tribunal regional do trabalho da (\d{1,2})/);
  if (trt) return TRT_UF[+trt[1]] || null;
  const trf = n.match(/tribunal regional federal da (\d)/);
  if (trf) return TRF_UF[+trf[1]] || null;
  return null;
}

function siglaRegional(orgao: string): string | null {
  const n = normalizar(orgao);
  const trt = n.match(/tribunal regional do trabalho da (\d{1,2})/);
  if (trt) return `TRT ${trt[1]}`;
  const trf = n.match(/tribunal regional federal da (\d)/);
  if (trf) return `TRF ${trf[1]}`;
  const tre = n.match(/tribunal regional eleitoral d[eo] (.+)/);
  if (tre && UF_NOMES[tre[1].trim()]) return `TRE ${UF_NOMES[tre[1].trim()]}`;
  const tj = n.match(/tribunal de justica d[aeo] (estado d[aeo] )?(.+)/);
  if (tj && UF_NOMES[tj[2].trim()]) return `TJ ${UF_NOMES[tj[2].trim()]}`;
  return null;
}

function ufNoTexto(texto: string): string | null {
  const n = normalizar(texto);
  const estado = n.match(/estado d[aeo] ([a-z ]{4,25}?)(?=[,.;\n)]|\s+(e|no|na|com|para|torna|-)\b)/);
  if (estado) {
    const nome = Object.keys(UF_NOMES).find((k) => estado[1].trim() === k);
    if (nome) return UF_NOMES[nome];
  }
  const sigla = texto.match(new RegExp(`[A-Za-zÀ-ú]\\s*[/-]\\s*(${UFS_RE})\\b`));
  return sigla?.[1] ?? null;
}

function esferaDe(orgao: string, texto: string): Esfera {
  const n = normalizar(`${orgao}\n${texto.slice(0, 1500)}`);
  const o = normalizar(orgao);
  if (/prefeitura|municipio|camara municipal|secretaria municipal/.test(o)) return "municipal";
  if (/tribunal de justica|policia (civil|militar|penal)|assembleia|estado d[aeo]|estadual|defensoria publica do estado|ministerio publico do estado|secretaria de estado|corpo de bombeiros/.test(o)) return "estadual";
  if (/federal|uniao|nacional|tribunal regional|tribunal superior|ministerio|banco do brasil|caixa economica|senado|camara dos deputados|agencia nacional|advocacia-geral|controladoria-geral/.test(o)) return "federal";
  if (/prefeitura|municipio/.test(n)) return "municipal";
  if (/estado d[aeo]/.test(n)) return "estadual";
  return "federal";
}

const BANCA_ALIAS: [RegExp, string][] = [
  [/cebraspe|centro brasileiro de pesquisa em avaliacao/, "Cebraspe"],
  [/\bfgv\b|fundacao getulio vargas/, "FGV"],
  [/\bfcc\b|fundacao carlos chagas/, "FCC"],
  [/vunesp/, "Vunesp"],
  [/cesgranrio/, "Cesgranrio"],
  [/\bibfc\b|instituto brasileiro de formacao e capacitacao/, "IBFC"],
  [/\baocp\b/, "AOCP"],
  [/quadrix/, "Quadrix"],
  [/idecan/, "Idecan"],
];

function bancaNoTexto(texto: string): string | null {
  const n = normalizar(texto);
  for (const [re, nome] of BANCA_ALIAS) if (re.test(n)) return nome;
  return BANCAS.find((b) => n.includes(normalizar(b))) ?? null;
}

// ---------- Número do edital ----------

const RE_EDITAL = new RegExp(
  `edital\\s+(?:de abertura\\s+|complementar\\s+)?(?:n[o°º.]*|numero)\\s*(\\d{1,4})\\s*(?:\\/\\s*(\\d{4})|,?\\s+de\\s+\\d{1,2}(?:o|º)?\\s+de\\s+(?:${RE_MES})\\s+de\\s+(\\d{4}))?`,
  "g",
);

/** Edital de referência: o próprio (abertura) ou o que está sendo retificado/homologado/convocado. */
export function numeroDoEdital(texto: string, tipo: ActTipo, anoPadrao: number): { numero: string | null; ano: number | null } {
  const n = normalizar(texto);
  const refs = [...n.matchAll(RE_EDITAL)].map((m) => ({ pos: m.index ?? 0, num: +m[1], ano: m[2] ? +m[2] : m[3] ? +m[3] : null }));
  if (!refs.length) return { numero: null, ano: null };
  let escolhida = refs[0];
  if (tipo !== "edital_abertura" && tipo !== "previsto" && tipo !== "autorizacao") {
    // O primeiro edital citado costuma ser o próprio ato ("EDITAL Nº 3 ... retifica o Edital nº 1"): procura outro.
    const proprio = refs[0];
    const outros = refs.filter((r) => r.num !== proprio.num || (r.ano != null && proprio.ano != null && r.ano !== proprio.ano));
    const gatilho = n.search(/retific|homolog|convoca|nomear|regid[oa] pel|de que trata|referente ao|relativo ao|objeto do/);
    escolhida = outros.find((r) => r.pos > gatilho) ?? outros[0] ?? proprio;
  }
  const ano = escolhida.ano ?? anoPadrao;
  return { numero: `${escolhida.num}/${ano}`, ano };
}

// ---------- Cargos ----------

const CARGO_RE =
  /\b(analista|t[ée]cnico|auditor|agente|assistente|auxiliar|professor|investigador|escriv[ãa]o|delegado|perito|papiloscopista|policial|soldado|oficial|escritur[áa]rio|engenheiro|m[ée]dico|enfermeiro|procurador|defensor|especialista|inspetor|fiscal|guarda|motorista|psic[óo]logo|contador|administrador|economista|arquiteto|advogado|bibliotec[áa]rio|secret[áa]rio|operador|tecnologista|pesquisador|juiz|promotor|farmac[êe]utico|nutricionista|odont[óo]logo|educador|monitor|cuidador|vigia|atendente|recepcionista)\b/i;

export interface CargoExtraidoH {
  nome: string;
  escolaridade: Escolaridade | null;
  area: string | null;
  vagas: number | null;
  cadastro_reserva: boolean;
  salario_centavos: number | null;
  jornada: string | null;
  requisitos: string | null;
  materias: { nome: string; numero_questoes: number | null }[];
  origem: { item: string | null; pagina: number | null };
}

function escolaridadeDe(s: string): Escolaridade | null {
  const n = normalizar(s);
  if (/nivel superior|ensino superior|curso superior|graduacao|diploma/.test(n)) return "superior";
  if (/nivel tecnico|curso tecnico|ensino tecnico/.test(n)) return "tecnico";
  if (/nivel medio|ensino medio|segundo grau/.test(n)) return "medio";
  if (/fundamental/.test(n)) return "fundamental";
  if (/\bsuperior\b/.test(n)) return "superior";
  if (/\bmedio\b/.test(n)) return "medio";
  return null;
}

function escolaridadePeloNome(nome: string): Escolaridade | null {
  const n = normalizar(nome);
  if (/^(analista|auditor|delegado|procurador|defensor|juiz|promotor|medico|engenheiro|professor|perito|advogado|contador|economista|arquiteto|psicologo|enfermeiro|farmaceutico|nutricionista|odontologo)/.test(n)) return "superior";
  if (/^tecnico (judiciario|administrativo|do seguro|bancario|em )/.test(n) || /^escriturario/.test(n)) return "medio";
  return null;
}

const AREAS_RE: [RegExp, string][] = [
  [/tribunal de contas|controladoria|\bcgu\b/, "controle"],
  [/tribunal|justica|judiciari/, "tribunais"],
  [/judiciaria|procurador|defensor|advogad|direito|promotor|juiz/, "juridica"],
  [/policia|policial|investigador|delegado|escrivao|papiloscop|perito criminal|agente penitenciario|penal/, "policial"],
  [/receita|fazenda|auditor[- ]fiscal|fiscal de tributos|tributari|sefaz/, "fiscal"],
  [/saude|hospital|medico|enferm|farmac|nutricion|odonto/, "saude"],
  [/professor|educacao|pedagog|escola/, "educacao"],
  [/banco do brasil|caixa economica|bancari|escriturario/, "bancaria"],
  [/tecnologia da informacao|informatica|desenvolvimento de sistemas|\bti\b|suporte em ti/, "ti"],
  [/engenh/, "engenharia"],
  [/camara|assembleia|senado|legislativ/, "legislativa"],
  [/militar|soldado|bombeiro|aeronautica|marinha|exercito/, "militar"],
  [/administrativ|seguro social|assistente|agente administrativo/, "administrativa"],
];

function areasDe(s: string): string[] {
  const n = normalizar(s);
  return [...new Set(AREAS_RE.filter(([re]) => re.test(n)).map(([, a]) => a))];
}

function limparNomeCargo(s: string): string {
  return s
    .replace(/^\s*[-–•]\s*/, "")
    .replace(/^\s*\d+(\.\d+)*[.)\-–]?\s+/, "")
    .replace(/^\s*(c[óo]digo\s*\d+\s*[-–:]?\s*|\d{2,4}\s*[-–]\s*)/i, "")
    .replace(/^\s*cargo\s*(\d+)?\s*[:\-–]?\s*/i, "")
    .replace(/^(o|a|os|as) cargos? de\s+/i, "")
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/, "")
    .trim();
}

export function extrairCargos(texto: string): CargoExtraidoH[] {
  const cargos = new Map<string, CargoExtraidoH>();
  let pos = 0;
  for (const linha of texto.split("\n")) {
    const inicioLinha = pos;
    pos += linha.length + 1;
    if (!CARGO_RE.test(linha)) continue;
    const temValor = /R\$/.test(linha);
    const temVagas = /\b\d+\s+vagas?\b|cadastro (de )?reserva|\bCR\b/i.test(linha);
    let nome: string | null = null;
    let vagas: number | null = null;
    let cr = /cadastro (de )?reserva|\bCR\b/i.test(linha);
    if (linha.includes("|")) {
      const celulas = linha.split("|").map((c) => c.trim());
      const idx = celulas.findIndex((c) => CARGO_RE.test(c) && !/R\$/.test(c));
      if (idx < 0) continue;
      nome = limparNomeCargo(celulas[idx]);
      for (const c of celulas.slice(idx + 1)) {
        if (/^\d{1,5}$/.test(c) && vagas == null) vagas = +c;
        else if (/^(\d{1,5})\s*(\+\s*CR)?\s*vagas?/i.test(c) && vagas == null) vagas = +c.match(/\d+/)![0];
        if (/^CR$|cadastro/i.test(c)) cr = true;
      }
      if (vagas == null && !temValor && !cr) continue;
    } else {
      if (!temValor && !temVagas) continue;
      const antes = linha.split(/:\s|\s[–—-]\s(?=\d)|,\s*(?=\d+\s+vagas?)/)[0];
      if (!CARGO_RE.test(antes) || antes.length > 120) continue;
      nome = limparNomeCargo(antes);
      const v = linha.match(/\b(\d{1,5})\s+vagas?\b/i);
      if (v) vagas = +v[1];
    }
    if (!nome || nome.length < 4 || nome.split(" ").length > 14) continue;
    if (/^(o|a|os|as|cada|todo|todos|para|com|no|na|do|da)\b/i.test(nome)) continue;
    const k = normalizar(nome);
    const existente = cargos.get(k);
    const salario = centavos(linha);
    const jornada = linha.match(/\b(\d{2})\s*(h|horas)(?:\s*semanais)?\b/i);
    const novo: CargoExtraidoH = {
      nome,
      escolaridade: escolaridadeDe(linha) ?? escolaridadePeloNome(nome),
      area: areasDe(`${nome} ${linha}`)[0] ?? null,
      vagas,
      cadastro_reserva: cr,
      salario_centavos: salario,
      jornada: jornada ? `${jornada[1]}h` : null,
      requisitos: null,
      materias: [],
      origem: { item: linha.trim().match(/^(\d+(?:\.\d+)+)/)?.[1] ?? null, pagina: paginaEm(texto, inicioLinha) },
    };
    if (!existente) cargos.set(k, novo);
    else {
      existente.escolaridade ??= novo.escolaridade;
      existente.vagas ??= novo.vagas;
      existente.salario_centavos ??= novo.salario_centavos;
      existente.jornada ??= novo.jornada;
      existente.cadastro_reserva ||= novo.cadastro_reserva;
    }
  }
  return [...cargos.values()];
}

// ---------- Matérias ----------

const CATALOGO_PADRAO = MATERIAS_CANONICAS.map((m, i) => ({ id: String(i), nome: m.nome, sinonimos: m.sinonimos }));

export function extrairMaterias(texto: string): { nome: string; numero_questoes: number | null }[] {
  const n = normalizar(texto);
  const inicio = n.search(/conteudo programatico|objetos? de avaliacao|conhecimentos basicos|disciplinas|das provas objetivas|composicao da prova|quadro de provas/);
  if (inicio < 0) return [];
  const trecho = texto.slice(inicio);
  const out = new Map<string, { nome: string; numero_questoes: number | null }>();
  for (const linha of trecho.split("\n").slice(0, 400)) {
    const l = linha.trim();
    if (!l || l.length > 400) continue;
    let nome: string | null = null;
    let q: number | null = null;
    if (l.includes("|")) {
      const cel = l.split("|").map((c) => c.trim());
      nome = cel[0];
      const num = cel.slice(1).find((c) => /^\d{1,3}$/.test(c));
      q = num ? +num : null;
    } else {
      const m = l.match(/^[-–•]?\s*([A-Za-zÀ-ú][A-Za-zÀ-ú ,\-]{2,70}?)\s*(?:\((\d{1,3})\s*quest[õo]es?\)|[:–-]\s*(\d{1,3})\s*quest[õo]es?|:|$)/);
      if (m) {
        nome = m[1];
        q = m[2] ? +m[2] : m[3] ? +m[3] : null;
      }
    }
    if (!nome || nome.split(" ").length > 8) continue;
    const canon = resolverMateria(nome, CATALOGO_PADRAO);
    if (!canon) continue;
    const k = canon.nome;
    if (!out.has(k)) out.set(k, { nome: nome.trim(), numero_questoes: q });
    else if (q != null && out.get(k)!.numero_questoes == null) out.get(k)!.numero_questoes = q;
  }
  return [...out.values()];
}

// ---------- Extração completa ----------

export interface ExtracaoHeuristica {
  tipo_ato: ActTipo;
  orgao: string | null;
  orgao_sigla: string | null;
  esfera: Esfera;
  uf: string | null;
  cidade: string | null;
  banca: string | null;
  numero_edital: string | null;
  ano: number | null;
  titulo: string | null;
  resumo: string | null;
  cargos: CargoExtraidoH[];
  taxa_centavos: number | null;
  datas: DataExtraida[];
  etapas: string[];
  areas: string[];
}

export function extrairHeuristico(doc: {
  texto: string;
  titulo?: string | null;
  publicadoEm?: string | null;
  dicas?: DicasDocumento;
}, tipo: ActTipo): ExtracaoHeuristica {
  const texto = doc.texto;
  const anoPadrao = Number((doc.publicadoEm ?? new Date().toISOString()).slice(0, 4));
  const cabeca = `${doc.titulo ?? ""}\n${texto.slice(0, 2500)}`;
  const orgaoTexto = cabeca.match(ORGAO_RE)?.[1];
  const orgao = limparOrgao(doc.dicas?.orgao || orgaoTexto || "") || null;
  const siglaParenteses = orgao ? texto.match(new RegExp(`${orgao.slice(-20).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(([A-Z][A-Z0-9ª\\s/-]{1,14})\\)`))?.[1] : null;
  const sigla = siglaParenteses?.replace(/-/g, " ").trim() ?? (orgao ? siglaRegional(orgao) : null);
  const esfera = doc.dicas?.esfera ?? (orgao ? esferaDe(orgao, texto) : "federal");
  const nacional = esfera === "federal" && orgao && /nacional|federal do brasil|receita federal|policia federal|policia rodoviaria federal|banco do brasil|caixa economica/.test(normalizar(orgao));
  const uf = doc.dicas?.uf ?? (orgao ? ufPorRegiao(orgao) : null) ?? (nacional ? null : ufNoTexto(cabeca));
  const cidade =
    doc.dicas?.cidade ??
    (orgao?.match(/(?:Prefeitura|C[âa]mara)(?: Municipal)? de (.+)$/)?.[1]?.trim() ||
      texto.match(/(?:Munic[íi]pio|cidade) de ([A-ZÀ-Ú][A-Za-zÀ-ú' ]{2,40}?)(?=[,.;/\-–]|\s+(?:e|no|na|com|torna)\b)/)?.[1] ||
      null);
  const { numero, ano } = numeroDoEdital(texto, tipo, anoPadrao);
  const cargos = extrairCargos(texto);
  const materias = extrairMaterias(texto);
  for (const c of cargos) c.materias = materias;
  const taxaLinha = texto.split("\n").find((l) => /taxa de inscri|valor da inscri|valor da taxa/i.test(l) && /R\$/.test(l));
  const datas = extrairDatas(texto, anoPadrao);
  const vagas = cargos.reduce((s, c) => s + (c.vagas ?? 0), 0);
  const salMax = Math.max(0, ...cargos.map((c) => c.salario_centavos ?? 0));
  const nomeCurto = sigla ?? orgao ?? "Concurso";
  const titulo = cargos.length ? `${nomeCurto} · ${cargos.slice(0, 2).map((c) => c.nome.split(/\s[–-]\s/)[0]).join(" e ")}` : doc.titulo ?? nomeCurto;
  const partes = [
    cargos.length ? `${cargos.length === 1 ? "Cargo" : "Cargos"}: ${cargos.map((c) => c.nome).join("; ")}` : null,
    vagas ? `${vagas} vagas` : null,
    salMax ? `remuneração até R$ ${(salMax / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : null,
  ].filter(Boolean);
  return {
    tipo_ato: tipo,
    orgao,
    orgao_sigla: sigla,
    esfera,
    uf: uf && new RegExp(`^(${UFS_RE})$`).test(uf) ? uf : null,
    cidade: esfera === "federal" && !doc.dicas?.cidade ? null : cidade,
    banca: doc.dicas?.banca ?? bancaNoTexto(texto),
    numero_edital: numero,
    ano: ano ?? anoPadrao,
    titulo: titulo.slice(0, 160),
    resumo: partes.length ? `${partes.join(" · ")}.` : null,
    cargos,
    taxa_centavos: centavos(taxaLinha),
    datas,
    etapas: [],
    areas: [...new Set([...areasDe(orgao ?? ""), ...cargos.map((c) => c.area).filter((a): a is string => !!a)])],
  };
}
