import "server-only";
import { sql } from "@/lib/db";
import { salvarOriginal, sha256 } from "../storage";
import type { DocumentoColetado, FonteRow, OpcoesColeta, ResultadoColeta } from "../tipos";
import { coletarBanca } from "./bancas";
import { coletarDou } from "./dou";
import { coletarQueridoDiario } from "./querido-diario";

type Coletor = (fonte: FonteRow, opts: OpcoesColeta) => Promise<ResultadoColeta>;

const COLETORES: Partial<Record<FonteRow["tipo"], Coletor>> = {
  dou: coletarDou,
  banca: coletarBanca,
  querido_diario: coletarQueridoDiario,
  // diario_estadual: fase 2 (um coletor por estado)
};

/**
 * Guarda o documento bruto: original no Storage + linha em raw_documents.
 * Idempotente pelo hash (rodar 2x não duplica).
 */
export async function guardarDocumento(sourceId: string | null, doc: DocumentoColetado): Promise<{ id: string; novo: boolean }> {
  const hash = doc.hash ?? sha256(doc.conteudo);
  const [existe] = await sql<{ id: string }[]>`select id from raw_documents where hash = ${hash}`;
  if (existe) return { id: existe.id, novo: false };
  const storagePath = await salvarOriginal({ conteudo: doc.conteudo, mime: doc.mime, hash });
  const [r] = await sql<{ id: string }[]>`
    insert into raw_documents (source_id, url, titulo, hash, storage_path, mime, conteudo_texto, publicado_em, metadata)
    values (${sourceId}, ${doc.url}, ${doc.titulo}, ${hash}, ${storagePath}, ${doc.mime}, ${doc.texto},
            ${doc.publicadoEm}, ${sql.json(doc.metadata as Parameters<typeof sql.json>[0])})
    on conflict (hash) do nothing
    returning id`;
  if (r) return { id: r.id, novo: true };
  const [depois] = await sql<{ id: string }[]>`select id from raw_documents where hash = ${hash}`;
  return { id: depois.id, novo: false };
}

/** Roda uma fonte: registra source_runs, guarda os documentos novos e atualiza o status da fonte. */
export async function rodarFonteImpl(slug: string, opts: OpcoesColeta = {}): Promise<{ runId: string; encontrados: number; novos: number; documentos: string[]; avisos: string[] }> {
  const [fonte] = await sql<FonteRow[]>`
    select id, slug, nome, tipo, url, ativo, frequencia_min, config, ultimo_hash, ultimo_run_em from sources where slug = ${slug}`;
  if (!fonte) throw new Error(`Fonte não encontrada: ${slug}`);
  const coletor = COLETORES[fonte.tipo];
  const [run] = await sql<{ id: string }[]>`insert into source_runs (source_id) values (${fonte.id}) returning id`;
  try {
    if (!coletor) throw new Error(`Sem coletor para o tipo ${fonte.tipo} (previsto para a fase 2)`);
    const res = await coletor(fonte, opts);
    let novos = 0;
    const ids: string[] = [];
    for (const doc of res.documentos) {
      const g = await guardarDocumento(fonte.id, doc);
      if (g.novo) {
        novos++;
        ids.push(g.id);
      }
    }
    const status = res.semMudanca ? "ok: sem mudança" : `ok: ${res.encontrados} itens, ${novos} novos${res.avisos?.length ? ` (${res.avisos.join("; ")})` : ""}`;
    await sql`update source_runs set terminado_em = now(), status = 'ok', docs_encontrados = ${res.encontrados}, docs_novos = ${novos}
              where id = ${run.id}`;
    await sql`update sources set ultimo_run_em = now(), ultimo_status = ${status.slice(0, 500)},
              ultimo_hash = coalesce(${res.hashPagina ?? null}, ultimo_hash) where id = ${fonte.id}`;
    return { runId: run.id, encontrados: res.encontrados, novos, documentos: ids, avisos: res.avisos ?? [] };
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    await sql`update source_runs set terminado_em = now(), status = 'erro', erro = ${msg} where id = ${run.id}`;
    await sql`update sources set ultimo_run_em = now(), ultimo_status = ${`erro: ${msg}`.slice(0, 500)} where id = ${fonte.id}`;
    throw e;
  }
}

/** Fontes ativas de um tipo cuja frequência já venceu. */
export async function fontesVencidas(tipo: FonteRow["tipo"], agora: Date = new Date()): Promise<string[]> {
  const r = await sql<{ slug: string }[]>`
    select slug from sources
    where ativo and tipo = ${tipo}
      and (ultimo_run_em is null or ultimo_run_em + make_interval(mins => frequencia_min - 5) <= ${agora}::timestamptz)
    order by ultimo_run_em nulls first`;
  return r.map((x) => x.slug);
}
