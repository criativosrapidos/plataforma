import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Guarda os originais coletados (XML do DOU, HTML das bancas, texto dos diários).
 * Produção: Supabase Storage via REST (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, bucket SUPABASE_STORAGE_BUCKET).
 * Desenvolvimento: disco local em STORAGE_DIR (padrão `.storage/` dentro de apps/web).
 */

export function sha256(conteudo: string | Uint8Array): string {
  return createHash("sha256").update(conteudo).digest("hex");
}

const EXT: Record<string, string> = {
  "application/xml": "xml",
  "text/xml": "xml",
  "text/html": "html",
  "text/plain": "txt",
  "application/json": "json",
  "application/pdf": "pdf",
  "application/zip": "zip",
};

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key, bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "originais" };
}

function dirLocal() {
  return path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), ".storage"));
}

/** Caminho estável do original: originais/AAAA/MM/<hash>.<ext>. Mesmo conteúdo = mesmo caminho (idempotente). */
export function caminhoOriginal(hash: string, mime: string, quando: Date = new Date()): string {
  const ano = quando.getUTCFullYear();
  const mes = String(quando.getUTCMonth() + 1).padStart(2, "0");
  return `originais/${ano}/${mes}/${hash}.${EXT[mime.split(";")[0].trim()] ?? "bin"}`;
}

/** Salva o original e devolve o caminho no Storage. */
export async function salvarOriginal(p: { conteudo: string | Uint8Array; mime: string; hash?: string; quando?: Date }): Promise<string> {
  const hash = p.hash ?? sha256(p.conteudo);
  const caminho = caminhoOriginal(hash, p.mime, p.quando);
  const corpo = typeof p.conteudo === "string" ? Buffer.from(p.conteudo, "utf8") : Buffer.from(p.conteudo);
  const sb = supabase();
  if (sb) {
    const r = await fetch(`${sb.url}/storage/v1/object/${sb.bucket}/${caminho}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${sb.key}`,
        apikey: sb.key,
        "content-type": p.mime,
        "x-upsert": "true",
      },
      body: corpo,
    });
    if (!r.ok) throw new Error(`storage: falha ao salvar ${caminho}: ${r.status} ${await r.text()}`);
    return caminho;
  }
  const destino = path.join(/* turbopackIgnore: true */ dirLocal(), caminho);
  await mkdir(/* turbopackIgnore: true */ path.dirname(destino), { recursive: true });
  await writeFile(/* turbopackIgnore: true */ destino, corpo);
  return caminho;
}

/** Lê um original salvo. */
export async function lerOriginal(caminho: string): Promise<Buffer> {
  const sb = supabase();
  if (sb) {
    const r = await fetch(`${sb.url}/storage/v1/object/${sb.bucket}/${caminho}`, {
      headers: { authorization: `Bearer ${sb.key}`, apikey: sb.key },
    });
    if (!r.ok) throw new Error(`storage: falha ao ler ${caminho}: ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  return readFile(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ dirLocal(), caminho));
}
