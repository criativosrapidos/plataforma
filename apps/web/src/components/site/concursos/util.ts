import {
  AREA_LABEL, DATE_TIPO_LABEL, ESCOLARIDADE_LABEL, contagem, dataCurtaBR, diasEntre, hojeISO,
  type Area, type ContestStatus, type ConcursoResumoDTO, type DateTipo, type Escolaridade,
} from "@aviso/shared";
import type { TomEtiqueta } from "@/components/ui/Etiqueta";

/** Concursos de exemplo (seed) só aparecem no site com SHOW_EXEMPLOS=1. */
export function mostrarExemplos() {
  return process.env.SHOW_EXEMPLOS === "1";
}

export const TOM_STATUS: Record<ContestStatus, TomEtiqueta> = {
  previsto: "roxo",
  autorizado: "roxo",
  banca_definida: "azul",
  edital_aberto: "verde",
  inscricoes_encerradas: "cinza",
  prova_realizada: "cinza",
  resultado: "cinza",
  homologado: "cinza",
  cancelado: "verm",
};

export function local(c: Pick<ConcursoResumoDTO, "esfera" | "uf" | "cidade">) {
  if (c.esfera === "federal") return c.uf ? `Federal · ${c.uf}` : "Federal · todo o Brasil";
  if (c.esfera === "municipal") return [c.cidade, c.uf].filter(Boolean).join(" · ") || "Municipal";
  return c.uf ? `Estadual · ${c.uf}` : "Estadual";
}

export function escolaridadesTexto(e: string[]) {
  return e.map((x) => ESCOLARIDADE_LABEL[x as Escolaridade] ?? x).join(", ");
}

export function areasTexto(a: string[]) {
  return a.map((x) => AREA_LABEL[x as Area] ?? x).join(", ");
}

/** "Inscrição até 21/11 · faltam 20 dias" */
export function proximaDataTexto(p: { tipo: DateTipo; data: string } | null) {
  if (!p) return null;
  return { rotulo: DATE_TIPO_LABEL[p.tipo], data: dataCurtaBR(p.data), quando: contagem(p.data), dias: diasEntre(hojeISO(), p.data) };
}

/** Situação de uma data do cronograma em relação a hoje. */
export function situacaoData(inicio: string | null, fim: string | null): { texto: string; tom: TomEtiqueta; passou: boolean } {
  const h = hojeISO();
  const ini = inicio ?? fim;
  const f = fim ?? inicio;
  if (!ini || !f) return { texto: "a definir", tom: "cinza", passou: false };
  if (f < h) return { texto: "encerrado", tom: "cinza", passou: true };
  if (ini <= h && h <= f) {
    if (ini === f) return { texto: "hoje", tom: "verm", passou: false };
    const d = diasEntre(h, f);
    return { texto: d === 0 ? "termina hoje" : d === 1 ? "termina amanhã" : `aberto · ${d} dias`, tom: d <= 2 ? "verm" : "verde", passou: false };
  }
  const d = diasEntre(h, ini);
  return { texto: d === 1 ? "amanhã" : `em ${d} dias`, tom: d <= 3 ? "verm" : "azul", passou: false };
}

export function primeiro(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() || undefined;
}
