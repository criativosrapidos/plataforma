import "server-only";
import { sql } from "@/lib/db";
import { acharConcurso, aplicarExtracaoImpl } from "./aplicar";
import { classificar } from "./classificar";
import { configNumero } from "./config";
import { avaliarCampos, extrairCampos } from "./extrair";
import { CamposExtraidos } from "./schema";
import { ehConcursoPublico } from "./filtro";
import type { RawDocumentRow } from "./tipos";

/**
 * Processa um documento bruto: filtro "concurso público" → classificação → extração (com confiança) →
 * aplicação automática quando a confiança passa do limiar (app_config.limiar_confianca, padrão 0,85)
 * e os campos obrigatórios estão completos; senão a extração fica pendente na fila de revisão do admin.
 * Idempotente: um ato e uma extração viva por documento.
 */

export type StatusProcessamento = "auto" | "pendente" | "descartado" | "sem_concurso" | "ja_processado" | "ocupado" | "erro";

export async function processarDocumentoImpl(
  rawId: string,
  opts: { forcar?: boolean; agora?: Date } = {},
): Promise<{ status: StatusProcessamento; extractionId?: string; contestId?: string; motivo?: string }> {
  const [viva] = await sql<{ id: string; status: string; contest_id: string | null }[]>`
    select id, status, contest_id from extractions where raw_document_id = ${rawId} and status <> 'rejeitada' limit 1`;
  if (viva) return { status: viva.status === "pendente" ? "pendente" : "ja_processado", extractionId: viva.id, contestId: viva.contest_id ?? undefined };

  const [doc] = await sql<RawDocumentRow[]>`
    update raw_documents set status = 'classificado', tentativas = tentativas + 1, processado_em = now(), erro = null
    where id = ${rawId}
      and (${!!opts.forcar} or status in ('novo', 'erro') or (status = 'classificado' and processado_em < now() - interval '30 minutes'))
    returning id, source_id, url, titulo, hash, storage_path, mime, conteudo_texto, publicado_em, metadata, status`;
  if (!doc) return { status: "ocupado" };

  try {
    const texto = doc.conteudo_texto ?? "";
    if (!ehConcursoPublico(`${doc.titulo ?? ""}\n${texto}`)) {
      await sql`update raw_documents set status = 'descartado', erro = 'filtro: não é ato de concurso público' where id = ${doc.id}`;
      return { status: "descartado", motivo: "filtro" };
    }
    const cls = await classificar({ texto, titulo: doc.titulo });
    await sql`update raw_documents set metadata = metadata || ${sql.json({ classificacao: { tipo: cls.tipo, confianca: cls.confianca, modelo: cls.modelo, motivo: cls.motivo ?? null, custo_centavos: cls.custoCentavos } })}
              where id = ${doc.id}`;
    if (cls.tipo === "outro") {
      await sql`update raw_documents set status = 'descartado', erro = ${`classificado como outro: ${cls.motivo ?? ""}`.slice(0, 500)} where id = ${doc.id}`;
      return { status: "descartado", motivo: "outro" };
    }

    const [ato] = await sql<{ id: string }[]>`
      insert into acts (raw_document_id, tipo, confianca, url_oficial, publicado_em)
      values (${doc.id}, ${cls.tipo}, ${cls.confianca}, ${doc.url}, ${doc.publicado_em})
      on conflict (raw_document_id) where raw_document_id is not null
      do update set tipo = excluded.tipo, confianca = excluded.confianca
      returning id`;

    const ext = await extrairCampos({ texto, titulo: doc.titulo, url: doc.url, publicadoEm: doc.publicado_em, dicas: doc.metadata?.dicas }, cls.tipo);
    const tipo = ext.campos?.tipo_ato ?? cls.tipo;
    if (tipo === "outro") {
      await sql`update acts set tipo = 'outro' where id = ${ato.id}`;
      await sql`update raw_documents set status = 'descartado', erro = 'extração: não é ato de concurso' where id = ${doc.id}`;
      return { status: "descartado", motivo: "outro" };
    }
    await sql`update acts set tipo = ${tipo}, resumo = ${ext.campos?.resumo ?? null} where id = ${ato.id}`;

    const limiar = await configNumero("limiar_confianca");
    let auto = !!ext.campos && ext.confianca >= limiar && ext.faltando.length === 0;
    let motivo = ext.motivo ?? (ext.confianca < limiar ? `confiança ${ext.confianca} abaixo do limiar ${limiar}` : null);
    let semConcurso = false;
    if (tipo === "retificacao" && ext.campos && !(await acharConcurso(ext.campos))) {
      auto = false;
      motivo = [motivo, "edital original não encontrado na base"].filter(Boolean).join("; ");
    }
    if (tipo === "homologacao" || tipo === "resultado" || tipo === "convocacao") {
      // Atos de concurso que não está na base (a maioria das nomeações do DOU) só ficam guardados,
      // para a busca nominal; não vão para a fila de revisão.
      const alvo = ext.campos ? await acharConcurso(ext.campos) : null;
      if (!alvo) semConcurso = true;
    }

    const [ex] = await sql<{ id: string }[]>`
      insert into extractions (act_id, raw_document_id, modelo, campos_json, confianca, status, motivo_revisao, tokens_in, tokens_out, custo_centavos)
      values (${ato.id}, ${doc.id}, ${ext.modelo}, ${sql.json((ext.campos ?? ext.bruto) as never)}, ${ext.confianca},
              ${semConcurso ? "auto" : "pendente"}, ${semConcurso ? "sem concurso correspondente na base" : motivo},
              ${ext.tokensIn + cls.tokensIn}, ${ext.tokensOut + cls.tokensOut}, ${ext.custoCentavos + cls.custoCentavos})
      on conflict do nothing
      returning id`;
    if (!ex) {
      const [outra] = await sql<{ id: string; status: string }[]>`select id, status from extractions where raw_document_id = ${doc.id} and status <> 'rejeitada' limit 1`;
      return { status: "ja_processado", extractionId: outra?.id };
    }
    if (semConcurso) {
      await sql`update raw_documents set status = 'extraido' where id = ${doc.id}`;
      return { status: "sem_concurso", extractionId: ex.id };
    }
    if (auto) {
      try {
        const r = await aplicarExtracaoImpl(ex.id, ext.campos!, null, { agora: opts.agora });
        return { status: "auto", extractionId: ex.id, contestId: r.contestId };
      } catch (e) {
        await sql`update extractions set motivo_revisao = ${(e as Error).message.slice(0, 500)} where id = ${ex.id}`;
      }
    }
    await sql`update raw_documents set status = 'revisao' where id = ${doc.id}`;
    return { status: "pendente", extractionId: ex.id, motivo: motivo ?? undefined };
  } catch (e) {
    await sql`update raw_documents set status = 'erro', erro = ${((e as Error).message ?? String(e)).slice(0, 500)} where id = ${doc.id}`;
    throw e;
  }
}

/**
 * Processa os documentos novos (e os que falharam, até 3 tentativas).
 * Para dentro do tempo do cron (prazoMs, padrão 4 min): o que sobrar fica para a próxima rodada.
 */
export async function processarPendentes(opts: { limite?: number; agora?: Date; prazoMs?: number } = {}) {
  const inicio = Date.now();
  const prazo = opts.prazoMs ?? 240_000;
  const docs = await sql<{ id: string }[]>`
    select id from raw_documents
    where status = 'novo'
       or (status = 'erro' and tentativas < 3)
       or (status = 'classificado' and processado_em < now() - interval '30 minutes' and tentativas < 3)
    order by publicado_em nulls last, coletado_em, id
    limit ${opts.limite ?? 30}`;
  const r = { processados: 0, auto: 0, pendentes: 0, descartados: 0, semConcurso: 0, erros: 0, mensagensErro: [] as string[] };
  for (const { id } of docs) {
    if (Date.now() - inicio > prazo) break;
    try {
      const s = await processarDocumentoImpl(id, { agora: opts.agora });
      r.processados++;
      if (s.status === "auto") r.auto++;
      else if (s.status === "pendente") r.pendentes++;
      else if (s.status === "descartado") r.descartados++;
      else if (s.status === "sem_concurso") r.semConcurso++;
    } catch (e) {
      r.erros++;
      r.mensagensErro.push(`${id}: ${(e as Error).message}`.slice(0, 300));
    }
  }
  r.auto += await retentarRetificacoes(opts.agora);
  return r;
}

/**
 * Retificações que chegaram antes do edital (ou de outra fonte) ficam pendentes com "edital original não encontrado".
 * A cada rodada tentamos de novo; se o edital já está na base e o resto estava ok, aplicamos sozinhos.
 */
export async function retentarRetificacoes(agora?: Date): Promise<number> {
  const limiar = await configNumero("limiar_confianca");
  const pend = await sql<{ id: string; campos_json: unknown; confianca: string }[]>`
    select id, campos_json, confianca from extractions
    where status = 'pendente' and motivo_revisao like '%edital original não encontrado%' and confianca >= ${limiar}
    order by created_at limit 50`;
  let n = 0;
  for (const p of pend) {
    const campos = CamposExtraidos.safeParse(p.campos_json);
    if (!campos.success || avaliarCampos(campos.data, "retificacao").length) continue;
    if (!(await acharConcurso(campos.data))) continue;
    try {
      await aplicarExtracaoImpl(p.id, campos.data, null, { agora });
      n++;
    } catch {
      /* continua na fila */
    }
  }
  return n;
}
