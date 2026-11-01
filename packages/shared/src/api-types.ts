// Contrato da API /api/v1 consumida pelo app (Expo) e pelo site.
// Autenticação: header `Authorization: Bearer <token>` (app) ou cookie de sessão (site).
// Erros: { erro: { codigo: string; mensagem: string } } com status HTTP adequado.
import type {
  AlertTipo, ContestStatus, DateTipo, Esfera, Escolaridade,
} from "./domain";
import type { Acesso, Ciclo, Plano } from "./plans";

export interface ApiErro {
  erro: { codigo: string; mensagem: string; campos?: Record<string, string> };
}

export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  role: "user" | "editor" | "admin";
  telefone: string | null;
  whatsapp_optin: boolean;
  busca_nominal_optin: boolean;
  nome_busca: string | null;
}

export interface AssinaturaDTO {
  id: string;
  plano: Plano;
  ciclo: Ciclo;
  status: "trial" | "ativa" | "inadimplente" | "cancelada" | "expirada";
  metodo: "cartao" | "pix_automatico" | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/** GET /api/v1/me */
export interface MeResponse {
  usuario: UsuarioDTO;
  assinatura: AssinaturaDTO | null;
  acesso: Acesso;
  ajustes: AjustesDTO;
  uso: { whatsappMes: number; perguntasMes: number; limites: { whatsappMes: number; perguntasMes: number } };
  contagens: { perfis: number; acompanhando: number; avisosNaoLidos: number };
}

/** POST /api/v1/auth/login | /api/v1/auth/cadastro */
export interface AuthResponse {
  token: string;
  usuario: UsuarioDTO;
}

export interface AjustesDTO {
  push_on: boolean;
  whatsapp_on: boolean;
  email_resumo: boolean;
  antecedencia_dias: 1 | 2 | 3 | 5;
  silencio_inicio: string | null; // "22:00"
  silencio_fim: string | null;
}

export interface PerfilDTO {
  id: string;
  nome: string;
  escolaridades: Escolaridade[];
  areas: string[];
  cargos: string[];
  ufs: string[];
  incluir_nacional: boolean;
  salario_min_centavos: number | null;
  bancas: string[];
  palavras_chave: string[];
  ativo: boolean;
}

export interface CargoDTO {
  id: string;
  nome: string;
  escolaridade: Escolaridade | null;
  area: string | null;
  vagas: number | null;
  cadastro_reserva: boolean;
  salario_centavos: number | null;
  jornada: string | null;
  requisitos: string | null;
}

export interface DataDTO {
  id: string;
  tipo: DateTipo;
  inicio: string | null; // AAAA-MM-DD
  fim: string | null;
  descricao: string | null;
  fonte_item: string | null;
  fonte_pagina: number | null;
}

/** Item de lista (busca, feed, radar). */
export interface ConcursoResumoDTO {
  id: string;
  slug: string;
  titulo: string;
  orgao: string;
  orgao_sigla: string | null;
  esfera: Esfera;
  uf: string | null;
  cidade: string | null;
  banca: string | null;
  status: ContestStatus;
  vagas_total: number | null;
  cadastro_reserva: boolean;
  salario_max_centavos: number | null;
  escolaridades: Escolaridade[];
  areas: string[];
  url_oficial: string;
  publicado_em: string | null;
  proxima_data: { tipo: DateTipo; data: string } | null;
  acompanhando: boolean;
  exemplo: boolean;
}

export interface VersaoDTO {
  versao: number;
  resumo: string | null;
  diff: { campo: string; antes: unknown; depois: unknown }[];
  created_at: string;
}

/** GET /api/v1/concursos/:id */
export interface ConcursoDetalheDTO extends ConcursoResumoDTO {
  resumo: string | null;
  numero_edital: string | null;
  taxa_centavos: number | null;
  cargos: CargoDTO[];
  datas: DataDTO[];
  materias: { subject_id: string; nome: string; questoes: number | null; role_id: string | null }[];
  versoes: VersaoDTO[];
  tem_edital_texto: boolean;
  acompanhamento: AcompanhamentoDTO | null;
}

export interface ChecklistItemDTO {
  id: string;
  texto: string;
  feito: boolean;
  ordem: number;
}

export interface AcompanhamentoDTO {
  id: string;
  contest_id: string;
  cor: string;
  role_id: string | null;
  nas_materias: boolean;
  checklist: ChecklistItemDTO[];
  created_at: string;
}

/** GET /api/v1/acompanhando → lista com o resumo do concurso. */
export interface AcompanhandoItemDTO extends AcompanhamentoDTO {
  concurso: ConcursoResumoDTO;
  datas: DataDTO[];
}

/** GET /api/v1/agenda?de=AAAA-MM-DD&ate=AAAA-MM-DD */
export interface CompromissoDTO {
  id: string; // contest_date id
  contest_id: string;
  concurso: string; // título curto
  orgao_sigla: string | null;
  cor: string;
  tipo: DateTipo;
  inicio: string | null;
  fim: string | null;
  descricao: string | null;
}

/** GET /api/v1/materias */
export interface MateriasEmComumResponse {
  concursos: { contest_id: string; titulo: string; cor: string; ativo: boolean }[];
  materias: { subject_id: string; nome: string; concursos: string[]; questoesTotal: number }[];
}

/** GET /api/v1/hoje */
export interface HojeResponse {
  proximaProva: { contest_id: string; concurso: string; cor: string; data: string; dias: number } | null;
  prazos: CompromissoDTO[]; // próximos 7 dias
  avisos: AvisoDTO[]; // últimos avisos
  novidades: ConcursoResumoDTO[]; // concursos novos que casam com os perfis
}

export interface AvisoDTO {
  id: string;
  contest_id: string | null;
  tipo: AlertTipo;
  titulo: string;
  corpo: string;
  url_oficial: string | null;
  created_at: string;
  lido: boolean;
}

/** POST /api/v1/concursos/:id/perguntas */
export interface PerguntaDTO {
  id: string;
  pergunta: string;
  resposta: string;
  encontrado: boolean;
  citacoes: { item: string | null; pagina: number | null; trecho: string | null }[];
  created_at: string;
}

export interface Paginado<T> {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

/** POST /api/v1/assinatura/checkout */
export interface CheckoutRequest {
  plano: Plano;
  ciclo: Ciclo;
  metodo: "cartao" | "pix_automatico";
}
export interface CheckoutResponse {
  assinatura: AssinaturaDTO;
  /** URL para concluir o cadastro do cartão / autorização do Pix automático no provedor (quando houver). */
  checkout_url: string | null;
}
