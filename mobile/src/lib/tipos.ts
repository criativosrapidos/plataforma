// Formato das linhas do banco (supabase/migrations).
export type Comunidade = { id: string; nome: string; exemplos: string[]; ordem: number };
export type Instituicao = { id: string; nome: string; descricao: string | null };

export type Meta = {
  id: string;
  user_id: string;
  comunidade_id: string;
  titulo: string;
  modo: 'so_eu' | 'com_fiscal';
  checkins_por_semana: number;
  valor_centavos: number;
  semanas: number;
  instituicao_id: string;
  fiscal_id: string | null;
  codigo_convite: string;
  inicio: string;
  status: 'ativa' | 'cumprida' | 'encerrada';
  criado_em: string;
};

export type Checkin = {
  id: string;
  meta_id: string;
  user_id: string;
  dia: string;
  foto_path: string;
  texto: string | null;
  status: 'pendente' | 'aprovado' | 'recusado';
  criado_em: string;
};

export type Multa = {
  id: string;
  meta_id: string;
  semana: number;
  checkins_feitos: number;
  valor_centavos: number;
  status: 'aberta' | 'contestada' | 'paga' | 'cancelada';
  contestacao: string | null;
  pago_em: string | null;
  criado_em: string;
};

export type Post = {
  id: string;
  dia: string;
  texto: string | null;
  foto_path: string;
  status: Checkin['status'];
  criado_em: string;
  user_id: string;
  nome: string;
  meta_id: string;
  titulo: string;
  comunidade_id: string;
  valor_centavos: number;
  inicio: string;
  semanas: number;
  dia_da_meta: number;
  apoios: number;
  apoiei: boolean;
};
