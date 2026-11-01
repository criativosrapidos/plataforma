import type { ActTipo, Esfera } from "@aviso/shared";

/** Pistas que a fonte já dá sobre o ato (ajudam a extração; a IA/heurística confirma no texto). */
export interface DicasDocumento {
  orgao?: string | null;
  esfera?: Esfera | null;
  uf?: string | null;
  cidade?: string | null;
  banca?: string | null;
}

/** Documento devolvido por um coletor, antes de virar raw_documents. */
export interface DocumentoColetado {
  /** Link oficial do ato (vira url_oficial dos avisos). */
  url: string;
  titulo: string | null;
  /** Original como veio da fonte (guardado no Storage). */
  conteudo: string | Buffer;
  mime: string;
  /** Texto limpo para filtro, classificação e extração. Marcadores "[página N]" quando a fonte informa. */
  texto: string;
  /** Data de publicação AAAA-MM-DD. */
  publicadoEm: string | null;
  metadata: Record<string, unknown> & { dicas?: DicasDocumento };
  /** Hash de deduplicação. Padrão: sha256 do conteúdo. */
  hash?: string;
}

export interface ResultadoColeta {
  /** Itens vistos na fonte (antes do filtro). */
  encontrados: number;
  documentos: DocumentoColetado[];
  /** Hash da página (bancas) para detectar mudança. */
  hashPagina?: string | null;
  semMudanca?: boolean;
  avisos?: string[];
}

export interface FonteRow {
  id: string;
  slug: string;
  nome: string;
  tipo: "dou" | "banca" | "querido_diario" | "diario_estadual" | "manual";
  url: string | null;
  ativo: boolean;
  frequencia_min: number;
  config: Record<string, unknown>;
  ultimo_hash: string | null;
  ultimo_run_em: Date | null;
}

export interface OpcoesColeta {
  /** Data a coletar (AAAA-MM-DD). Padrão: hoje (Brasília). */
  data?: string;
  agora?: Date;
}

export interface RawDocumentRow {
  id: string;
  source_id: string | null;
  url: string;
  titulo: string | null;
  hash: string;
  storage_path: string | null;
  mime: string | null;
  conteudo_texto: string | null;
  publicado_em: string | null;
  metadata: Record<string, unknown> & { dicas?: DicasDocumento };
  status: string;
  fonte_tipo?: string | null;
  fonte_slug?: string | null;
}

export interface Classificacao {
  tipo: ActTipo;
  confianca: number;
  modelo: string;
  motivo?: string;
  tokensIn: number;
  tokensOut: number;
  custoCentavos: number;
}
