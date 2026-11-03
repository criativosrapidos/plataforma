// Vocabulário do domínio. Os valores (strings) são os mesmos gravados no banco.

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
export type UF = (typeof UFS)[number];

export const ESCOLARIDADES = ["fundamental", "medio", "tecnico", "superior"] as const;
export type Escolaridade = (typeof ESCOLARIDADES)[number];
export const ESCOLARIDADE_LABEL: Record<Escolaridade, string> = {
  fundamental: "Fundamental",
  medio: "Médio",
  tecnico: "Técnico",
  superior: "Superior",
};

export const AREAS = [
  "administrativa",
  "fiscal",
  "policial",
  "tribunais",
  "saude",
  "educacao",
  "bancaria",
  "controle",
  "juridica",
  "ti",
  "engenharia",
  "legislativa",
  "militar",
  "outras",
] as const;
export type Area = (typeof AREAS)[number];
export const AREA_LABEL: Record<Area, string> = {
  administrativa: "Administrativa",
  fiscal: "Fiscal",
  policial: "Policial",
  tribunais: "Tribunais",
  saude: "Saúde",
  educacao: "Educação",
  bancaria: "Bancária",
  controle: "Controle",
  juridica: "Jurídica",
  ti: "Tecnologia da Informação",
  engenharia: "Engenharia",
  legislativa: "Legislativa",
  militar: "Militar",
  outras: "Outras",
};

export const BANCAS = [
  "Cebraspe",
  "FGV",
  "FCC",
  "Vunesp",
  "Cesgranrio",
  "IBFC",
  "AOCP",
  "Quadrix",
  "Idecan",
] as const;
export type Banca = (typeof BANCAS)[number];

export const ESFERAS = ["federal", "estadual", "municipal"] as const;
export type Esfera = (typeof ESFERAS)[number];

/** Tipos de ato encontrados nos diários oficiais (saída do classificador). */
export const ACT_TIPOS = [
  "previsto",
  "autorizacao",
  "edital_abertura",
  "retificacao",
  "homologacao",
  "resultado",
  "convocacao",
  "outro",
] as const;
export type ActTipo = (typeof ACT_TIPOS)[number];
export const ACT_TIPO_LABEL: Record<ActTipo, string> = {
  previsto: "Previsto",
  autorizacao: "Autorização",
  edital_abertura: "Edital de abertura",
  retificacao: "Retificação",
  homologacao: "Homologação",
  resultado: "Resultado",
  convocacao: "Convocação",
  outro: "Outro",
};

/** Linha do tempo do concurso (etapas mostradas no app). */
export const CONTEST_STATUS = [
  "previsto",
  "autorizado",
  "banca_definida",
  "edital_aberto",
  "inscricoes_encerradas",
  "prova_realizada",
  "resultado",
  "homologado",
  "cancelado",
] as const;
export type ContestStatus = (typeof CONTEST_STATUS)[number];
export const CONTEST_STATUS_LABEL: Record<ContestStatus, string> = {
  previsto: "Previsto",
  autorizado: "Autorizado",
  banca_definida: "Banca definida",
  edital_aberto: "Edital aberto",
  inscricoes_encerradas: "Inscrições encerradas",
  prova_realizada: "Prova realizada",
  resultado: "Resultado",
  homologado: "Homologado",
  cancelado: "Cancelado",
};
/** Status do "radar" (previsto/autorizado/banca definida): recurso do plano Aprovado no app. */
export const STATUS_RADAR: ContestStatus[] = ["previsto", "autorizado", "banca_definida"];

/** Etapas exibidas na trilha do app: previsto → autorizado → banca → edital → prova → resultado. */
export const ETAPAS_TRILHA: { status: ContestStatus[]; label: string }[] = [
  { status: ["previsto"], label: "Previsto" },
  { status: ["autorizado"], label: "Autorizado" },
  { status: ["banca_definida"], label: "Banca" },
  { status: ["edital_aberto", "inscricoes_encerradas"], label: "Edital" },
  { status: ["prova_realizada"], label: "Prova" },
  { status: ["resultado", "homologado"], label: "Resultado" },
];

export const DATE_TIPOS = [
  "isencao",
  "inscricao",
  "pagamento",
  "local_prova",
  "prova",
  "gabarito",
  "recurso",
  "resultado",
  "outro",
] as const;
export type DateTipo = (typeof DATE_TIPOS)[number];
export const DATE_TIPO_LABEL: Record<DateTipo, string> = {
  isencao: "Isenção",
  inscricao: "Inscrição",
  pagamento: "Pagamento do boleto",
  local_prova: "Local de prova",
  prova: "Prova",
  gabarito: "Gabarito",
  recurso: "Recurso",
  resultado: "Resultado",
  outro: "Outro",
};

export const ALERT_TIPOS = [
  "edital_publicado",
  "autorizado",
  "isencao_acabando",
  "inscricao_acabando",
  "errata",
  "local_prova",
  "prova_amanha",
  "gabarito",
  "resultado",
  "convocacao",
  "cobranca_amanha",
] as const;
export type AlertTipo = (typeof ALERT_TIPOS)[number];
export const ALERT_TIPO_LABEL: Record<AlertTipo, string> = {
  edital_publicado: "Edital publicado",
  autorizado: "Concurso autorizado",
  isencao_acabando: "Isenção acabando",
  inscricao_acabando: "Inscrição acabando",
  errata: "Errata",
  local_prova: "Local de prova",
  prova_amanha: "Prova amanhã",
  gabarito: "Gabarito",
  resultado: "Resultado",
  convocacao: "Convocação",
  cobranca_amanha: "Cobrança amanhã",
};

export const ALERT_CANAIS = ["push", "whatsapp", "email", "inapp"] as const;
export type AlertCanal = (typeof ALERT_CANAIS)[number];

/** Cores por concurso na agenda (ordem de atribuição). */
export const CONTEST_COLORS = ["#1F3FD1", "#7A3FD1", "#0B7F86", "#C2410C", "#0E8A45", "#B4235A", "#5B6475"] as const;

export const CHECKLIST_PADRAO = [
  "Pedir isenção da taxa",
  "Fazer a inscrição",
  "Pagar o boleto",
  "Conferir o local de prova",
  "Separar documento com foto",
  "Caneta preta de tubo transparente",
] as const;

export const ANTECEDENCIAS = [1, 2, 3, 5] as const;
export type Antecedencia = (typeof ANTECEDENCIAS)[number];
