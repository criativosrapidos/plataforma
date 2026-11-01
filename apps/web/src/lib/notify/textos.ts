// Textos dos avisos. Tom direto, de concurseiro para concurseiro; sem emoji, sem promessa de aprovação.
import { brl, dataBR, numeroBR, DATE_TIPO_LABEL, type DateTipo } from "@aviso/shared";

export interface ConcursoTexto {
  orgao: string;
  orgao_sigla: string | null;
  vagas_total?: number | null;
  salario_max_centavos?: number | null;
  inscricao_fim?: string | null;
  resumo?: string | null;
}

export function nomeCurto(c: { orgao: string; orgao_sigla: string | null }): string {
  return c.orgao_sigla || c.orgao;
}

export function textoEditalPublicado(c: ConcursoTexto) {
  const partes = [
    c.vagas_total ? `${numeroBR(c.vagas_total)} vagas` : null,
    c.salario_max_centavos ? `até ${brl(c.salario_max_centavos)}` : null,
    c.inscricao_fim ? `inscrições até ${dataBR(c.inscricao_fim)}` : null,
  ].filter(Boolean);
  return {
    titulo: `Saiu edital: ${nomeCurto(c)}`,
    corpo: partes.length ? partes.join(" · ") : (c.resumo ?? "Confira o edital no link oficial."),
  };
}

export function textoAutorizado(c: ConcursoTexto) {
  return {
    titulo: `Concurso autorizado: ${nomeCurto(c)}`,
    corpo: c.resumo ?? "Autorização publicada no Diário Oficial. O edital ainda não saiu.",
  };
}

function valorLegivel(v: unknown): string {
  if (v == null || v === "") return "sem data";
  const s = String(v);
  return s.replace(/\d{4}-\d{2}-\d{2}/g, (d) => dataBR(d));
}

const NOME_CAMPO: Record<string, string> = {
  taxa_centavos: "a taxa de inscrição",
  banca: "a banca",
  vagas_total: "o número de vagas",
  salario_max_centavos: "a remuneração",
  url_oficial: "o link oficial",
  titulo: "o título",
  numero_edital: "o número do edital",
};

export function descreverAlteracao(campo: string, antes: unknown, depois: unknown): string {
  if (campo.startsWith("data:")) {
    const tipo = campo.slice(5) as DateTipo;
    const nome = (DATE_TIPO_LABEL[tipo] ?? tipo).toLowerCase();
    return `${nome}: de ${valorLegivel(antes)} para ${valorLegivel(depois)}`;
  }
  if (campo.endsWith("_centavos")) return `${NOME_CAMPO[campo] ?? campo}: de ${brl(antes as number)} para ${brl(depois as number)}`;
  return `${NOME_CAMPO[campo] ?? campo.replace(/_/g, " ")}: de ${valorLegivel(antes)} para ${valorLegivel(depois)}`;
}

export function textoErrata(c: ConcursoTexto, alteracoes: { campo: string; antes: unknown; depois: unknown }[]) {
  const principais = alteracoes.slice(0, 2).map((a) => descreverAlteracao(a.campo, a.antes, a.depois));
  const mais = alteracoes.length > 2 ? ` e mais ${alteracoes.length - 2}` : "";
  const mexeuData = alteracoes.some((a) => a.campo.startsWith("data:"));
  return {
    titulo: `Errata no ${nomeCurto(c)}`,
    corpo: `Mudou ${principais.join("; ")}${mais}.${mexeuData ? " Sua agenda já foi atualizada." : ""}`,
  };
}

export function textoPrazo(tipo: "isencao_acabando" | "inscricao_acabando", c: ConcursoTexto, fim: string, dias: number) {
  const nome = tipo === "isencao_acabando" ? "Isenção" : "Inscrição";
  const quando = dias === 1 ? "acaba amanhã" : dias === 0 ? "acaba hoje" : `acaba em ${dias} dias`;
  return {
    titulo: `${nome} do ${nomeCurto(c)} ${quando}`,
    corpo:
      tipo === "isencao_acabando"
        ? `Peça a isenção da taxa até ${dataBR(fim)} no site da banca.`
        : `Faça a inscrição até ${dataBR(fim)} e pague o boleto no prazo.`,
  };
}

export function textoProvaAmanha(c: ConcursoTexto, data: string) {
  return {
    titulo: `Prova do ${nomeCurto(c)} é amanhã`,
    corpo: `Prova em ${dataBR(data)}. Confira o local, leve documento com foto e caneta preta de tubo transparente.`,
  };
}

export function textoDataDoDia(tipo: "local_prova" | "gabarito" | "resultado", c: ConcursoTexto) {
  const t = {
    local_prova: { titulo: `Local de prova do ${nomeCurto(c)}`, corpo: "Hoje é a data de divulgação dos locais de prova. Confira no site da banca." },
    gabarito: { titulo: `Gabarito do ${nomeCurto(c)}`, corpo: "Hoje é a data prevista para o gabarito. Confira no site da banca." },
    resultado: { titulo: `Resultado do ${nomeCurto(c)}`, corpo: "Hoje é a data prevista para o resultado. Confira no link oficial." },
  };
  return t[tipo];
}

export function textoResultado(c: ConcursoTexto, homologado: boolean) {
  return {
    titulo: homologado ? `Resultado homologado: ${nomeCurto(c)}` : `Saiu resultado: ${nomeCurto(c)}`,
    corpo: homologado ? "O resultado final foi homologado no Diário Oficial." : "Novo resultado publicado. Confira no link oficial.",
  };
}

export function textoConvocacao(nome: string, ato: string) {
  return {
    titulo: "Seu nome saiu no Diário Oficial",
    corpo: `Encontramos "${nome}" em: ${ato.slice(0, 140)}. Confira o ato oficial e os prazos de posse.`,
  };
}

export function textoCobrancaAmanha(planoNome: string, valorCentavos: number, data: string) {
  return {
    titulo: "Seu teste acaba amanhã",
    corpo: `A primeira cobrança do plano ${planoNome} (${brl(valorCentavos)}) será em ${dataBR(data)}. Se não quiser continuar, cancele antes em Ajustes > Assinatura.`,
  };
}
