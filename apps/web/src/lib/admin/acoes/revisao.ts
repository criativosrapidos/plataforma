"use server";

import { exigirAdmin } from "@/lib/auth/guards";
import { sql } from "@/lib/db";
import { aplicarExtracao, rejeitarExtracao } from "@/lib/pipeline";
import { CamposExtraidos } from "@/lib/pipeline/schema";
import { atualizarPainel } from "../atualizar";
import { auditar } from "../audit";
import { ehUuid } from "../params";
import { camposDoZod, erroAmigavel, falha, sucesso, type Resultado } from "../resultado";

async function pendente(id: string) {
  const [e] = await sql<{ status: string; confianca: number }[]>`select status, confianca::float8 as confianca from extractions where id = ${id}`;
  if (!e) return "Extração não encontrada.";
  if (e.status !== "pendente") return "Esta extração já foi revisada por outra pessoa. Atualize a fila.";
  return null;
}

/** Aprovar e publicar: valida os campos revisados e entrega ao pipeline (cria/atualiza o concurso e gera avisos). */
export async function aprovarExtracaoAcao(id: string, campos: unknown): Promise<Resultado<{ contestId: string; criado: boolean }>> {
  const s = await exigirAdmin("editor");
  if (!ehUuid(id)) return falha("Extração inválida.");
  const v = CamposExtraidos.safeParse(campos);
  if (!v.success) return falha("Confira os campos destacados antes de aprovar.", camposDoZod(v.error));
  const motivo = await pendente(id);
  if (motivo) return falha(motivo);
  try {
    const r = await aplicarExtracao(id, v.data, s.id);
    await auditar(s.id, "extracao.aprovar", "extraction", id, { contestId: r.contestId, criado: r.criado, orgao: v.data.orgao, tipo_ato: v.data.tipo_ato });
    atualizarPainel();
    return sucesso(r.criado ? "Aprovada. Concurso criado e avisos na fila de envio." : "Aprovada. Concurso atualizado.", r);
  } catch (e) {
    return erroAmigavel(e, "a aprovação");
  }
}

export async function rejeitarExtracaoAcao(id: string, motivo: string): Promise<Resultado> {
  const s = await exigirAdmin("editor");
  if (!ehUuid(id)) return falha("Extração inválida.");
  const m = typeof motivo === "string" ? motivo.trim().slice(0, 500) : "";
  if (m.length < 3) return falha("Escreva o motivo da rejeição.");
  const pend = await pendente(id);
  if (pend) return falha(pend);
  try {
    await rejeitarExtracao(id, m, s.id);
    await auditar(s.id, "extracao.rejeitar", "extraction", id, { motivo: m });
    atualizarPainel();
    return sucesso("Extração rejeitada. Não vira concurso nem aviso.");
  } catch (e) {
    return erroAmigavel(e, "a rejeição");
  }
}
