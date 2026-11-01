"use server";

import { z } from "zod";
import { slugify } from "@aviso/shared";
import { exigirAdmin } from "@/lib/auth/guards";
import { sql } from "@/lib/db";
import { processarDocumento, rodarFonte } from "@/lib/pipeline";
import { atualizarPainel } from "../atualizar";
import { auditar } from "../audit";
import { FONTE_TIPOS } from "../formato";
import { ehUuid } from "../params";
import { camposDoZod, erroAmigavel, falha, sucesso, type Resultado } from "../resultado";

// ---------------------------------------------------------------- Documentos

export async function reprocessarDocumentoAcao(id: string): Promise<Resultado<{ status: string; extractionId?: string }>> {
  const s = await exigirAdmin("editor");
  if (!ehUuid(id)) return falha("Documento inválido.");
  try {
    const r = await processarDocumento(id);
    await auditar(s.id, "documento.reprocessar", "raw_document", id, r);
    atualizarPainel();
    return sucesso(`Documento reprocessado: ${r.status}${r.extractionId ? ", com nova extração" : ""}.`, r);
  } catch (e) {
    return erroAmigavel(e, "o reprocessamento");
  }
}

// ---------------------------------------------------------------- Fontes

export async function rodarFonteAcao(id: string): Promise<Resultado<{ runId: string; encontrados: number; novos: number }>> {
  const s = await exigirAdmin("editor");
  if (!ehUuid(id)) return falha("Fonte inválida.");
  const [f] = await sql<{ slug: string; nome: string }[]>`select slug, nome from sources where id = ${id}`;
  if (!f) return falha("Fonte não encontrada.");
  try {
    const r = await rodarFonte(f.slug);
    await auditar(s.id, "fonte.rodar", "source", id, { slug: f.slug, ...r });
    atualizarPainel();
    return sucesso(`${f.nome}: ${r.encontrados} documentos encontrados, ${r.novos} novos.`, r);
  } catch (e) {
    return erroAmigavel(e, `a coleta de ${f.nome}`);
  }
}

export async function alternarFonteAcao(id: string, ativo: boolean): Promise<Resultado> {
  const s = await exigirAdmin("editor");
  if (!ehUuid(id)) return falha("Fonte inválida.");
  const [f] = await sql<{ nome: string }[]>`update sources set ativo = ${!!ativo} where id = ${id} returning nome`;
  if (!f) return falha("Fonte não encontrada.");
  await auditar(s.id, ativo ? "fonte.ligar" : "fonte.desligar", "source", id);
  atualizarPainel();
  return sucesso(`${f.nome} ${ativo ? "ligada: volta a coletar no horário." : "desligada: não coleta até ser religada."}`);
}

const FonteDados = z.object({
  nome: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,60}$/, "Use letras minúsculas, números e hífen")
    .optional(),
  tipo: z.enum(FONTE_TIPOS),
  url: z.string().trim().url().nullable(),
  frequencia_min: z.number().int().min(5, "Mínimo 5 minutos").max(10080, "Máximo 1 semana"),
  ativo: z.boolean(),
  config: z.string(),
});

export async function salvarFonteAcao(id: string | null, bruto: unknown): Promise<Resultado<{ id: string }>> {
  const s = await exigirAdmin("editor");
  if (id !== null && !ehUuid(id)) return falha("Fonte inválida.");
  const v = FonteDados.safeParse(bruto);
  if (!v.success) return falha("Confira os campos.", camposDoZod(v.error));
  let config: unknown;
  try {
    config = JSON.parse(v.data.config || "{}");
  } catch (e) {
    return falha("Configuração não é um JSON válido.", { config: e instanceof Error ? e.message : "JSON inválido" });
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) return falha("A configuração precisa ser um objeto JSON.", { config: "Use { … }" });
  const d = v.data;
  try {
    if (id === null) {
      const slug = d.slug || slugify(d.nome);
      const [f] = await sql<{ id: string }[]>`
        insert into sources (slug, nome, tipo, url, ativo, frequencia_min, config)
        values (${slug}, ${d.nome}, ${d.tipo}, ${d.url}, ${d.ativo}, ${d.frequencia_min}, ${sql.json(config as Record<string, never>)}) returning id`;
      await auditar(s.id, "fonte.criar", "source", f.id, { slug, nome: d.nome, tipo: d.tipo });
      atualizarPainel();
      return sucesso("Fonte criada.", { id: f.id });
    }
    const [antes] = await sql<{ config: unknown; frequencia_min: number; ativo: boolean; url: string | null }[]>`select config, frequencia_min, ativo, url from sources where id = ${id}`;
    if (!antes) return falha("Fonte não encontrada.");
    await sql`update sources set nome = ${d.nome}, tipo = ${d.tipo}, url = ${d.url}, ativo = ${d.ativo}, frequencia_min = ${d.frequencia_min},
              config = ${sql.json(config as Record<string, never>)} where id = ${id}`;
    await auditar(s.id, "fonte.editar", "source", id, { antes, depois: { config, frequencia_min: d.frequencia_min, ativo: d.ativo, url: d.url } });
    atualizarPainel();
    return sucesso("Fonte salva.", { id });
  } catch (e) {
    return erroAmigavel(e, "o salvamento da fonte");
  }
}

// ---------------------------------------------------------------- Matérias

const sinonimosDe = (t: string) => [...new Set(t.split(/[\n,;]/).map((x) => x.trim().toLowerCase()).filter(Boolean))].slice(0, 60);

export async function salvarMateriaAcao(id: string | null, nome: string, sinonimosTexto: string): Promise<Resultado<{ id: string }>> {
  const s = await exigirAdmin("editor");
  if (id !== null && !ehUuid(id)) return falha("Matéria inválida.");
  const n = typeof nome === "string" ? nome.trim().replace(/\s+/g, " ") : "";
  if (n.length < 2 || n.length > 80) return falha("Nome entre 2 e 80 caracteres.", { nome: "Nome entre 2 e 80 caracteres" });
  const sin = sinonimosDe(typeof sinonimosTexto === "string" ? sinonimosTexto : "").filter((x) => x !== n.toLowerCase());
  const [dup] = await sql<{ id: string }[]>`select id from subjects where (lower(nome) = lower(${n}) or slug = ${slugify(n)}) and (${id}::uuid is null or id <> ${id})`;
  if (dup) return falha("Já existe uma matéria com esse nome. Para juntar as duas, use Mesclar.", { nome: "Já existe" });
  try {
    if (id === null) {
      const [r] = await sql<{ id: string }[]>`insert into subjects (nome, slug, sinonimos) values (${n}, ${slugify(n)}, ${sin}) returning id`;
      await auditar(s.id, "materia.criar", "subject", r.id, { nome: n, sinonimos: sin });
      atualizarPainel();
      return sucesso(`Matéria “${n}” criada.`, { id: r.id });
    }
    const [antes] = await sql<{ nome: string; sinonimos: string[] }[]>`select nome, sinonimos from subjects where id = ${id}`;
    if (!antes) return falha("Matéria não encontrada.");
    await sql`update subjects set nome = ${n}, slug = ${slugify(n)}, sinonimos = ${sin} where id = ${id}`;
    await auditar(s.id, "materia.editar", "subject", id, { antes, depois: { nome: n, sinonimos: sin } });
    atualizarPainel();
    return sucesso("Matéria salva.", { id });
  } catch (e) {
    return erroAmigavel(e, "o salvamento da matéria");
  }
}

export async function apagarMateriaAcao(id: string): Promise<Resultado> {
  const s = await exigirAdmin("editor");
  if (!ehUuid(id)) return falha("Matéria inválida.");
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from contest_subjects where subject_id = ${id}`;
  if (n > 0) return falha(`Em uso em ${n} ${n === 1 ? "concurso/cargo" : "concursos/cargos"}. Mescle com outra matéria em vez de apagar.`);
  const [r] = await sql<{ nome: string }[]>`delete from subjects where id = ${id} returning nome`;
  if (!r) return falha("Matéria não encontrada.");
  await auditar(s.id, "materia.apagar", "subject", id, { nome: r.nome });
  atualizarPainel();
  return sucesso(`Matéria “${r.nome}” apagada.`);
}

/** Mescla `origem` em `destino`: move os usos (somando questões quando o mesmo concurso/cargo já tem o destino), herda nome e sinônimos e apaga a origem. */
export async function mesclarMateriasAcao(origemId: string, destinoId?: string): Promise<Resultado> {
  const s = await exigirAdmin("editor");
  if (!ehUuid(origemId) || !destinoId || !ehUuid(destinoId)) return falha("Escolha a matéria de destino.");
  if (origemId === destinoId) return falha("Escolha uma matéria diferente.");
  try {
    const r = await sql.begin(async (tx) => {
      const [o] = await tx<{ nome: string; sinonimos: string[] }[]>`select nome, sinonimos from subjects where id = ${origemId} for update`;
      const [d] = await tx<{ nome: string; sinonimos: string[] }[]>`select nome, sinonimos from subjects where id = ${destinoId} for update`;
      if (!o || !d) throw new Error("Matéria não encontrada.");
      // Onde o destino já existe no mesmo concurso/cargo: soma as questões e remove a linha da origem.
      const somadas = await tx`
        update contest_subjects dst set questoes = case when dst.questoes is null and src.questoes is null then null
                                                     else coalesce(dst.questoes, 0) + coalesce(src.questoes, 0) end
        from contest_subjects src
        where src.subject_id = ${origemId} and dst.subject_id = ${destinoId} and dst.contest_id = src.contest_id
          and dst.role_id is not distinct from src.role_id`;
      await tx`
        delete from contest_subjects src using contest_subjects dst
        where src.subject_id = ${origemId} and dst.subject_id = ${destinoId} and dst.contest_id = src.contest_id
          and dst.role_id is not distinct from src.role_id`;
      const movidas = await tx`update contest_subjects set subject_id = ${destinoId} where subject_id = ${origemId}`;
      const sin = [...new Set([...d.sinonimos, o.nome.toLowerCase(), ...o.sinonimos])].filter((x) => x !== d.nome.toLowerCase());
      await tx`update subjects set sinonimos = ${sin} where id = ${destinoId}`;
      await tx`delete from subjects where id = ${origemId}`;
      await auditar(s.id, "materia.mesclar", "subject", destinoId, { origem: o.nome, destino: d.nome, movidas: movidas.count, somadas: somadas.count }, tx);
      return { o: o.nome, d: d.nome, total: movidas.count + somadas.count };
    });
    atualizarPainel();
    return sucesso(`“${r.o}” mesclada em “${r.d}” (${r.total} ${r.total === 1 ? "uso movido" : "usos movidos"}).`);
  } catch (e) {
    return erroAmigavel(e, "a mesclagem");
  }
}
