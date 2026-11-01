// Regras de negócio puras (sem banco): casar perfil × concurso, matérias em comum, lembretes, diff.
import type { DateTipo, Escolaridade, Esfera } from "./domain";
import { diasEntre, normalizar } from "./format";

export interface PerfilBusca {
  escolaridades: string[];
  areas: string[];
  cargos: string[];
  ufs: string[];
  incluir_nacional: boolean;
  salario_min_centavos: number | null;
  bancas: string[];
  palavras_chave: string[];
  ativo?: boolean;
}

export interface ConcursoParaMatch {
  orgao: string;
  esfera: Esfera;
  uf: string | null;
  banca: string | null;
  escolaridades: string[];
  areas: string[];
  salario_max_centavos: number | null;
  titulo?: string | null;
  resumo?: string | null;
  cargos: { nome: string; escolaridade?: Escolaridade | string | null; salario_centavos?: number | null }[];
}

export interface MatchResultado {
  casa: boolean;
  motivos: string[];
}

/**
 * Um concurso casa com o perfil quando TODOS os filtros preenchidos batem.
 * Filtro vazio = não restringe. Regras:
 * - Escolaridade: alguma escolaridade do concurso está no perfil.
 * - Área: alguma área do concurso está no perfil.
 * - UF: a UF do concurso está no perfil; concursos federais/nacionais passam se incluir_nacional.
 * - Salário mínimo: o maior salário do concurso (ou de algum cargo) ≥ mínimo. Sem salário informado, passa.
 * - Bancas: banca do concurso está no perfil. Sem banca definida, passa (pode ser previsto).
 * - Cargos e palavras-chave: pelo menos um termo aparece em cargo, órgão, título ou resumo.
 */
export function casarPerfil(perfil: PerfilBusca, c: ConcursoParaMatch): MatchResultado {
  const motivos: string[] = [];
  if (perfil.ativo === false) return { casa: false, motivos: ["perfil pausado"] };

  if (perfil.escolaridades.length) {
    const esc = new Set([...c.escolaridades, ...c.cargos.map((r) => r.escolaridade).filter(Boolean) as string[]]);
    if (esc.size && !perfil.escolaridades.some((e) => esc.has(e))) return { casa: false, motivos: ["escolaridade"] };
    motivos.push("escolaridade");
  }
  if (perfil.areas.length) {
    if (c.areas.length && !perfil.areas.some((a) => c.areas.includes(a))) return { casa: false, motivos: ["área"] };
    motivos.push("área");
  }
  if (perfil.ufs.length) {
    const nacional = c.esfera === "federal" && !c.uf && perfil.incluir_nacional;
    if (!nacional && !(c.uf && perfil.ufs.includes(c.uf))) return { casa: false, motivos: ["UF"] };
    motivos.push(nacional ? "nacional" : `UF ${c.uf}`);
  }
  if (perfil.salario_min_centavos) {
    const max = Math.max(c.salario_max_centavos ?? 0, ...c.cargos.map((r) => r.salario_centavos ?? 0));
    if (max > 0 && max < perfil.salario_min_centavos) return { casa: false, motivos: ["salário"] };
    motivos.push("salário");
  }
  if (perfil.bancas.length) {
    if (c.banca && !perfil.bancas.map(normalizar).includes(normalizar(c.banca))) return { casa: false, motivos: ["banca"] };
    motivos.push("banca");
  }
  const termos = [...perfil.cargos, ...perfil.palavras_chave].map(normalizar).filter(Boolean);
  if (termos.length) {
    const texto = normalizar([c.orgao, c.titulo ?? "", c.resumo ?? "", ...c.cargos.map((r) => r.nome)].join(" | "));
    const achou = termos.find((t) => texto.includes(t));
    if (!achou) return { casa: false, motivos: ["palavra-chave"] };
    motivos.push(`“${achou}”`);
  }
  return { casa: true, motivos };
}

// ---------- Matérias em comum ----------

export interface MateriaDeConcurso {
  contest_id: string;
  subject_id: string;
  subject_nome: string;
  questoes: number | null;
}

export interface MateriaEmComum {
  subject_id: string;
  nome: string;
  concursos: string[]; // contest_ids
  questoesTotal: number;
}

/**
 * Ordena por número de concursos em que a matéria cai e, no empate, pela soma de questões.
 * Só considera os concursos ligados (ativos) pela pessoa.
 */
export function materiasEmComum(itens: MateriaDeConcurso[], concursosAtivos?: Set<string>): MateriaEmComum[] {
  const mapa = new Map<string, MateriaEmComum>();
  for (const it of itens) {
    if (concursosAtivos && !concursosAtivos.has(it.contest_id)) continue;
    let m = mapa.get(it.subject_id);
    if (!m) {
      m = { subject_id: it.subject_id, nome: it.subject_nome, concursos: [], questoesTotal: 0 };
      mapa.set(it.subject_id, m);
    }
    if (!m.concursos.includes(it.contest_id)) m.concursos.push(it.contest_id);
    m.questoesTotal += it.questoes ?? 0;
  }
  return [...mapa.values()].sort(
    (a, b) => b.concursos.length - a.concursos.length || b.questoesTotal - a.questoesTotal || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

// ---------- Lembretes de prazo ----------

export interface DataConcurso {
  tipo: DateTipo;
  inicio: string | null;
  fim: string | null;
}

/**
 * Quais lembretes disparar hoje para uma data do concurso, dada a antecedência escolhida (1/2/3/5 dias).
 * - Isenção/inscrição: no dia "antecedência" antes do fim E na véspera (acaba amanhã).
 * - Prova: na véspera ("prova amanhã").
 */
export function lembretesDoDia(
  d: DataConcurso,
  hoje: string,
  antecedencia: number,
): { tipo: "isencao_acabando" | "inscricao_acabando" | "prova_amanha"; diasAteFim: number }[] {
  const out: { tipo: "isencao_acabando" | "inscricao_acabando" | "prova_amanha"; diasAteFim: number }[] = [];
  const alvo = d.fim ?? d.inicio;
  if (!alvo) return out;
  const faltam = diasEntre(hoje, alvo);
  if (d.tipo === "isencao" || d.tipo === "inscricao") {
    if (faltam === antecedencia || faltam === 1) {
      out.push({ tipo: d.tipo === "isencao" ? "isencao_acabando" : "inscricao_acabando", diasAteFim: faltam });
    }
  }
  if (d.tipo === "prova" && faltam === 1) out.push({ tipo: "prova_amanha", diasAteFim: 1 });
  return out;
}

/** Está no horário silencioso? (ex.: 22:00 às 07:00). Horas em "HH:MM". */
export function emHorarioSilencioso(agoraHHMM: string, inicio: string | null, fim: string | null): boolean {
  if (!inicio || !fim || inicio === fim) return false;
  if (inicio < fim) return agoraHHMM >= inicio && agoraHHMM < fim;
  return agoraHHMM >= inicio || agoraHHMM < fim;
}

// ---------- Diff de errata ----------

export interface CampoAlterado {
  campo: string;
  antes: unknown;
  depois: unknown;
}

/** Compara duas versões rasas (ou com arrays/objetos serializados) e lista o que mudou. */
export function diffCampos(antes: Record<string, unknown>, depois: Record<string, unknown>): CampoAlterado[] {
  const chaves = new Set([...Object.keys(antes), ...Object.keys(depois)]);
  const out: CampoAlterado[] = [];
  for (const k of chaves) {
    const a = antes[k];
    const b = depois[k];
    if (b === undefined) continue; // errata não informa = não mudou
    if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) out.push({ campo: k, antes: a ?? null, depois: b });
  }
  return out;
}

/** Chave de deduplicação de concurso: órgão + número do edital + ano. */
export function chaveDedup(orgao: string, numeroEdital: string | null | undefined, ano: number | null | undefined): string {
  const num = (numeroEdital ?? "").replace(/\s+/g, "").replace(/^0+/, "").toLowerCase();
  return `${normalizar(orgao).replace(/[^a-z0-9]+/g, "-")}|${num || "s-n"}|${ano ?? "s-a"}`;
}
