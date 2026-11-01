"use server";

import { chaveDedup, slugify, type DateTipo } from "@aviso/shared";
import { exigirAdmin } from "@/lib/auth/guards";
import { sql, type Tx } from "@/lib/db";
import { registrarAlteracao } from "@/lib/pipeline";
import type { CamposExtraidos } from "@/lib/pipeline/schema";
import { atualizarPainel } from "../atualizar";
import { auditar } from "../audit";
import { camposRelevantesAlterados, ConcursoDados, modeloDeBanco, dadosDoModelo, ROTULO_CAMPO } from "../concurso-form";
import { concursoBanco, contagemExemplos } from "../consultas/concursos";
import { ehUuid } from "../params";
import { camposDoZod, erroAmigavel, falha, sucesso, type Resultado } from "../resultado";

/** Grava cargos, datas e matérias por "upsert" (mantém ids: follows.role_id não se perde). */
async function gravarFilhos(tx: Tx, contestId: string, d: ConcursoDados, partes: { cargos: boolean; datas: boolean; materias: boolean }) {
  const idPorChave = new Map<string, string>();
  if (partes.cargos) {
    const existentes = new Set((await tx<{ id: string }[]>`select id from contest_roles where contest_id = ${contestId}`).map((r) => r.id));
    const manter = new Set<string>();
    for (const c of d.cargos) {
      if (c.id && existentes.has(c.id)) {
        await tx`update contest_roles set nome = ${c.nome}, escolaridade = ${c.escolaridade}, area = ${c.area}, vagas = ${c.vagas},
                 cadastro_reserva = ${c.cadastro_reserva}, salario_centavos = ${c.salario_centavos}, jornada = ${c.jornada}, requisitos = ${c.requisitos}
                 where id = ${c.id}`;
        manter.add(c.id);
        idPorChave.set(c.chave, c.id);
      } else {
        const [r] = await tx<{ id: string }[]>`
          insert into contest_roles (contest_id, nome, escolaridade, area, vagas, cadastro_reserva, salario_centavos, jornada, requisitos)
          values (${contestId}, ${c.nome}, ${c.escolaridade}, ${c.area}, ${c.vagas}, ${c.cadastro_reserva}, ${c.salario_centavos}, ${c.jornada}, ${c.requisitos})
          returning id`;
        idPorChave.set(c.chave, r.id);
      }
    }
    const remover = [...existentes].filter((x) => !manter.has(x));
    if (remover.length) await tx`delete from contest_roles where id = any(${remover}::uuid[])`;
  } else {
    // cargos gravados por outro caminho (errata): casa matérias pelo nome do cargo
    const roles = await tx<{ id: string; nome: string }[]>`select id, nome from contest_roles where contest_id = ${contestId}`;
    for (const c of d.cargos) {
      const r = roles.find((x) => x.nome.trim().toLowerCase() === c.nome.trim().toLowerCase());
      if (r) idPorChave.set(c.chave, r.id);
    }
  }
  if (partes.datas) {
    const existentes = new Set((await tx<{ id: string }[]>`select id from contest_dates where contest_id = ${contestId}`).map((r) => r.id));
    const manter = new Set<string>();
    for (const x of d.datas) {
      if (x.id && existentes.has(x.id)) {
        await tx`update contest_dates set tipo = ${x.tipo}, inicio = ${x.inicio}, fim = ${x.fim}, descricao = ${x.descricao},
                 fonte_item = ${x.fonte_item}, fonte_pagina = ${x.fonte_pagina},
                 updated_at = case when (tipo, inicio, fim) is distinct from (${x.tipo}, ${x.inicio}::date, ${x.fim}::date) then now() else updated_at end
                 where id = ${x.id}`;
        manter.add(x.id);
      } else {
        await tx`insert into contest_dates (contest_id, tipo, inicio, fim, descricao, fonte_item, fonte_pagina)
                 values (${contestId}, ${x.tipo}, ${x.inicio}, ${x.fim}, ${x.descricao}, ${x.fonte_item}, ${x.fonte_pagina})`;
      }
    }
    const remover = [...existentes].filter((x) => !manter.has(x));
    if (remover.length) await tx`delete from contest_dates where id = any(${remover}::uuid[])`;
  }
  if (partes.materias) {
    await tx`delete from contest_subjects where contest_id = ${contestId}`;
    for (const m of d.materias) {
      const roleId = m.cargo ? idPorChave.get(m.cargo) ?? null : null;
      await tx`insert into contest_subjects (contest_id, role_id, subject_id, questoes) values (${contestId}, ${roleId}, ${m.subject_id}, ${m.questoes})
               on conflict do nothing`;
    }
  }
}

/** Campos desnormalizados a partir dos cargos. */
function derivados(d: ConcursoDados) {
  const vagas = d.cargos.reduce((s, c) => s + (c.vagas ?? 0), 0);
  const sal = Math.max(0, ...d.cargos.map((c) => c.salario_centavos ?? 0));
  const esc = [...new Set([...d.escolaridades, ...d.cargos.map((c) => c.escolaridade).filter((x): x is NonNullable<typeof x> => !!x)])];
  return {
    vagas_total: vagas || null,
    salario_max_centavos: sal || null,
    escolaridades: esc,
    cadastro_reserva: d.cadastro_reserva || d.cargos.some((c) => c.cadastro_reserva),
  };
}

async function slugLivre(base: string, tx: Tx) {
  const raiz = slugify(base) || "concurso";
  for (let i = 1; i < 50; i++) {
    const s = i === 1 ? raiz : `${raiz}-${i}`;
    const [r] = await tx`select 1 from contests where slug = ${s}`;
    if (!r) return s;
  }
  return `${raiz}-${Date.now()}`;
}

async function conflitoDedup(dedup: string, id: string | null) {
  const [r] = await sql<{ id: string; titulo: string }[]>`select id, titulo from contests where dedup_key = ${dedup} and (${id}::uuid is null or id <> ${id})`;
  return r ?? null;
}

/** Monta o Partial<CamposExtraidos> da errata com os campos relevantes que mudaram. */
function novosParaErrata(d: ConcursoDados, alterados: string[], nomesMaterias: Map<string, string>): Partial<CamposExtraidos> {
  const n: Partial<CamposExtraidos> = {};
  if (alterados.includes("datas")) {
    n.datas = d.datas.map((x) => ({
      tipo: x.tipo as DateTipo,
      inicio: x.inicio,
      fim: x.fim,
      descricao: x.descricao,
      origem: x.fonte_item || x.fonte_pagina ? { item: x.fonte_item, pagina: x.fonte_pagina } : undefined,
    }));
  }
  if (alterados.includes("cargos")) {
    n.cargos = d.cargos.map((c) => ({
      nome: c.nome,
      escolaridade: c.escolaridade,
      area: c.area,
      vagas: c.vagas,
      cadastro_reserva: c.cadastro_reserva,
      salario_centavos: c.salario_centavos,
      jornada: c.jornada,
      requisitos: c.requisitos,
      materias: d.materias.filter((m) => m.cargo === c.chave).map((m) => ({ nome: nomesMaterias.get(m.subject_id) ?? "", numero_questoes: m.questoes })),
    }));
  }
  if (alterados.includes("taxa_centavos")) n.taxa_centavos = d.taxa_centavos;
  if (alterados.includes("banca")) n.banca = d.banca;
  if (alterados.includes("url_oficial")) n.url_oficial = d.url_oficial;
  if (alterados.includes("numero_edital")) n.numero_edital = d.numero_edital;
  return n;
}

/**
 * Cria ou salva um concurso.
 * modo "direto": grava tudo aqui (correção sem avisar ninguém).
 * modo "errata": campos relevantes vão para `registrarAlteracao` (versão + agenda + aviso a quem acompanha); o resto é gravado aqui.
 */
export async function salvarConcursoAcao(
  id: string | null,
  bruto: unknown,
  modo: "direto" | "errata" = "direto",
  resumoErrata = "",
): Promise<Resultado<{ id: string; avisados?: number }>> {
  const s = await exigirAdmin("editor");
  if (id !== null && !ehUuid(id)) return falha("Concurso inválido.");
  const v = ConcursoDados.safeParse(bruto);
  if (!v.success) return falha("Confira os campos destacados.", camposDoZod(v.error));
  const d = v.data;
  const dedup = chaveDedup(d.orgao, d.numero_edital, d.ano);
  const outro = await conflitoDedup(dedup, id);
  if (outro) return falha(`Já existe um concurso com este órgão, nº de edital e ano: “${outro.titulo}”.`, { numero_edital: "Duplicaria outro concurso" });
  const der = derivados(d);

  try {
    if (id === null) {
      const novoId = await sql.begin(async (tx) => {
        const slug = await slugLivre(`${d.titulo}-${d.ano ?? ""}`, tx);
        const [c] = await tx<{ id: string }[]>`
          insert into contests (slug, dedup_key, orgao, orgao_sigla, esfera, uf, cidade, banca, numero_edital, ano, status, titulo, resumo, url_oficial,
            taxa_centavos, vagas_total, cadastro_reserva, salario_max_centavos, escolaridades, areas, edital_texto, publicado_em, publicado, exemplo)
          values (${slug}, ${dedup}, ${d.orgao}, ${d.orgao_sigla}, ${d.esfera}, ${d.uf}, ${d.cidade}, ${d.banca}, ${d.numero_edital}, ${d.ano}, ${d.status},
            ${d.titulo}, ${d.resumo}, ${d.url_oficial}, ${d.taxa_centavos}, ${der.vagas_total}, ${der.cadastro_reserva}, ${der.salario_max_centavos},
            ${der.escolaridades}, ${d.areas}, ${d.edital_texto}, ${d.publicado_em}, ${d.publicado}, ${d.exemplo})
          returning id`;
        await gravarFilhos(tx, c.id, d, { cargos: true, datas: true, materias: true });
        await auditar(s.id, "concurso.criar", "contest", c.id, { titulo: d.titulo, publicado: d.publicado }, tx);
        return c.id;
      });
      atualizarPainel();
      return sucesso("Concurso criado.", { id: novoId });
    }

    const atual = await concursoBanco(id);
    if (!atual) return falha("Concurso não encontrado.");
    const antes = dadosDoModelo(modeloDeBanco(atual)).valor as ConcursoDados;
    const alterados = camposRelevantesAlterados(antes, d);
    let avisados: number | undefined;

    if (modo === "errata" && alterados.length) {
      const nomes = new Map((await sql<{ id: string; nome: string }[]>`select id, nome from subjects`).map((x) => [x.id, x.nome]));
      const resumo = resumoErrata.trim().slice(0, 300) || `Alteração em ${alterados.map((k) => ROTULO_CAMPO[k] ?? k).join(", ")}`;
      const r = await registrarAlteracao(id, novosParaErrata(d, alterados, nomes), { resumo, autorId: s.id, notificar: true });
      avisados = r.avisados;
      await auditar(s.id, "concurso.errata", "contest", id, { resumo, alterados, versao: r.versao, avisados: r.avisados });
    }

    const pelaErrata = modo === "errata" ? new Set(alterados) : new Set<string>();
    await sql.begin(async (tx) => {
      await tx`
        update contests set
          titulo = ${d.titulo}, orgao = ${d.orgao}, orgao_sigla = ${d.orgao_sigla}, esfera = ${d.esfera}, uf = ${d.uf}, cidade = ${d.cidade},
          ano = ${d.ano}, status = ${d.status}, resumo = ${d.resumo}, areas = ${d.areas}, edital_texto = ${d.edital_texto},
          publicado_em = ${d.publicado_em}, publicado = ${d.publicado}, exemplo = ${d.exemplo}, dedup_key = ${dedup},
          ${pelaErrata.has("banca") ? sql`` : sql`banca = ${d.banca},`}
          ${pelaErrata.has("numero_edital") ? sql`` : sql`numero_edital = ${d.numero_edital},`}
          ${pelaErrata.has("url_oficial") ? sql`` : sql`url_oficial = ${d.url_oficial},`}
          ${pelaErrata.has("taxa_centavos") ? sql`` : sql`taxa_centavos = ${d.taxa_centavos},`}
          ${pelaErrata.has("cargos") ? sql`` : sql`vagas_total = ${der.vagas_total}, salario_max_centavos = ${der.salario_max_centavos}, cadastro_reserva = ${der.cadastro_reserva},`}
          escolaridades = ${der.escolaridades},
          updated_at = now()
        where id = ${id}`;
      await gravarFilhos(tx, id, d, { cargos: !pelaErrata.has("cargos"), datas: !pelaErrata.has("datas"), materias: true });
      const camposMudados = (Object.keys(d) as (keyof ConcursoDados)[]).filter((k) => JSON.stringify(antes[k]) !== JSON.stringify(d[k]));
      await auditar(s.id, modo === "errata" ? "concurso.salvar_com_errata" : "concurso.corrigir", "contest", id, {
        campos: camposMudados,
        sem_aviso: modo === "direto" && alterados.length > 0 ? alterados : undefined,
      }, tx);
    });
    atualizarPainel();
    return sucesso(
      modo === "errata" && alterados.length
        ? `Errata registrada${avisados != null ? ` e ${avisados} ${avisados === 1 ? "pessoa avisada" : "pessoas avisadas"}` : ""}.`
        : "Concurso salvo.",
      { id, avisados },
    );
  } catch (e) {
    return erroAmigavel(e, modo === "errata" ? "o registro da errata" : "o salvamento");
  }
}

export async function publicarConcursoAcao(id: string, publicar: boolean): Promise<Resultado> {
  const s = await exigirAdmin("editor");
  if (!ehUuid(id)) return falha("Concurso inválido.");
  const [c] = await sql<{ url_oficial: string }[]>`update contests set publicado = ${!!publicar}, updated_at = now() where id = ${id} returning url_oficial`;
  if (!c) return falha("Concurso não encontrado.");
  await auditar(s.id, publicar ? "concurso.publicar" : "concurso.despublicar", "contest", id);
  atualizarPainel();
  return sucesso(publicar ? "Publicado: já aparece no app e no site." : "Despublicado: saiu do app e do site.");
}

/** Remove os concursos de exemplo (seed). Só admin. Leva junto seguidores, checklists e avisos ligados a eles. */
export async function apagarExemplosAcao(): Promise<Resultado> {
  const s = await exigirAdmin("admin");
  const antes = await contagemExemplos();
  const r = await sql`delete from contests where exemplo = true`;
  await auditar(s.id, "concurso.apagar_exemplos", "contest", null, { apagados: r.count, seguidores: antes.seguidores });
  atualizarPainel();
  return sucesso(r.count ? `${r.count} concursos de exemplo apagados.` : "Não havia concursos de exemplo.");
}
