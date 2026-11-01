import "server-only";
import { sql } from "@/lib/db";
import { enviarPendentes } from "@/lib/notify/despachar";
import { enviarAlertaPush } from "@/lib/notify/push";
import { aplicarExtracaoImpl, rejeitarExtracaoImpl } from "./aplicar";
import { rodarFonteImpl } from "./coletores";
import { appUrl } from "./config";
import { registrarAlteracaoImpl } from "./errata";
import { processarDocumentoImpl } from "./processar";
import type { CamposExtraidos } from "./schema";

// Fachada do pipeline usada pelo painel admin e pelos jobs.
// As implementações ficam nos módulos deste diretório (coleta, classificação, extração, avisos).

export { ErroAplicacao } from "./aplicar";
export { rodarJob, JOBS, ehJob, type NomeJob } from "./jobs";

/** Aprova uma extração (revisada ou não): cria/atualiza o concurso (dedup), liga o ato e gera avisos. */
export async function aplicarExtracao(extractionId: string, campos: CamposExtraidos, revisorId: string | null): Promise<{ contestId: string; criado: boolean }> {
  const r = await aplicarExtracaoImpl(extractionId, campos, revisorId);
  if (r.avisados) await enviarPendentes({ limite: 1000 });
  return { contestId: r.contestId, criado: r.criado };
}

/** Rejeita uma extração (não vira concurso). */
export async function rejeitarExtracao(extractionId: string, motivo: string, revisorId: string): Promise<void> {
  await rejeitarExtracaoImpl(extractionId, motivo, revisorId);
}

/**
 * Registra uma alteração (errata/retificação ou edição manual relevante) num concurso:
 * gera contest_versions com o diff, atualiza datas/campos (a agenda de quem acompanha muda junto)
 * e avisa só quem acompanha.
 */
export async function registrarAlteracao(
  contestId: string,
  novos: Partial<CamposExtraidos>,
  opts: { resumo: string; autorId: string | null; actId?: string | null; notificar?: boolean },
): Promise<{ versao: number; alterados: string[]; avisados: number }> {
  const r = await registrarAlteracaoImpl(contestId, novos, opts);
  if (r.avisados) await enviarPendentes({ limite: 1000 });
  return r;
}

/** Roda uma fonte agora (botão "rodar agora" no admin). Só coleta; o job "processar" classifica e extrai. */
export async function rodarFonte(slug: string): Promise<{ runId: string; encontrados: number; novos: number }> {
  const r = await rodarFonteImpl(slug);
  return { runId: r.runId, encontrados: r.encontrados, novos: r.novos };
}

/** Processa um documento bruto: classifica e extrai (reprocessa mesmo se já tinha sido descartado). */
export async function processarDocumento(rawDocumentId: string): Promise<{ status: string; extractionId?: string }> {
  const r = await processarDocumentoImpl(rawDocumentId, { forcar: true });
  if (r.status === "auto") await enviarPendentes({ limite: 1000 });
  return { status: r.status, extractionId: r.extractionId };
}

/** Manda um aviso de teste (push) para os aparelhos da pessoa. */
export async function enviarAvisoTeste(userId: string): Promise<{ enviados: number }> {
  const url = appUrl();
  const [a] = await sql<{ id: string }[]>`
    insert into alerts (user_id, tipo, canal, titulo, corpo, url_oficial, dedup_key, status)
    values (${userId}, 'teste', 'push', 'Aviso de teste', 'Se você recebeu isto, os avisos do Aviso Concurso estão chegando neste aparelho.',
            ${url}, ${`teste:${userId}:${Date.now()}`}, 'pendente')
    returning id`;
  const r = await enviarAlertaPush({ id: a.id, user_id: userId, contest_id: null, tipo: "teste", titulo: "Aviso de teste", corpo: "Se você recebeu isto, os avisos do Aviso Concurso estão chegando neste aparelho.", url_oficial: url });
  await sql`update alerts set status = ${r.status}, erro = ${r.erro}, enviado_em = ${r.status === "enviado" ? new Date() : null} where id = ${a.id}`;
  return { enviados: r.tickets };
}
