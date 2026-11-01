import "server-only";
import type { CamposExtraidos } from "./schema";

// Fachada do pipeline usada pelo painel admin e pelos jobs.
// As implementações reais ficam nos módulos deste diretório (coleta, classificação, extração, avisos).

/** Aprova uma extração (revisada ou não): cria/atualiza o concurso (dedup), liga o ato e gera avisos. */
export async function aplicarExtracao(_extractionId: string, _campos: CamposExtraidos, _revisorId: string | null): Promise<{ contestId: string; criado: boolean }> {
  throw new Error("pipeline: aplicarExtracao ainda não implementado");
}

/** Rejeita uma extração (não vira concurso). */
export async function rejeitarExtracao(_extractionId: string, _motivo: string, _revisorId: string): Promise<void> {
  throw new Error("pipeline: rejeitarExtracao ainda não implementado");
}

/**
 * Registra uma alteração (errata/retificação ou edição manual relevante) num concurso:
 * gera contest_versions com o diff, atualiza datas/campos (a agenda de quem acompanha muda junto)
 * e avisa só quem acompanha.
 */
export async function registrarAlteracao(
  _contestId: string,
  _novos: Partial<CamposExtraidos>,
  _opts: { resumo: string; autorId: string | null; actId?: string | null; notificar?: boolean },
): Promise<{ versao: number; alterados: string[]; avisados: number }> {
  throw new Error("pipeline: registrarAlteracao ainda não implementado");
}

/** Roda uma fonte agora (botão "rodar agora" no admin). */
export async function rodarFonte(_slug: string): Promise<{ runId: string; encontrados: number; novos: number }> {
  throw new Error("pipeline: rodarFonte ainda não implementado");
}

/** Processa um documento bruto: classifica e extrai. */
export async function processarDocumento(_rawDocumentId: string): Promise<{ status: string; extractionId?: string }> {
  throw new Error("pipeline: processarDocumento ainda não implementado");
}

/** Manda um aviso de teste (push) para os aparelhos da pessoa. */
export async function enviarAvisoTeste(_userId: string): Promise<{ enviados: number }> {
  throw new Error("pipeline: enviarAvisoTeste ainda não implementado");
}
