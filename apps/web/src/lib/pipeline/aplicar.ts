import "server-only";
import { sql, type Tx } from "@/lib/db";
import { AREAS, chaveDedup, dataBR, normalizar, slugify, type ActTipo, type ContestStatus } from "@aviso/shared";
import { enfileirarVarios } from "@/lib/notify/despachar";
import { textoAutorizado, textoEditalPublicado, textoResultado } from "@/lib/notify/textos";
import { registrarAlteracaoImpl } from "./errata";
import { seguidores, usuariosQueCasam } from "./match";
import { idsDasMaterias } from "./materias";
import { CamposExtraidos } from "./schema";

/**
 * Aplicação de uma extração aprovada (automática ou pelo revisor):
 * dedup por chaveDedup(órgão, nº do edital, ano); cria/atualiza contests (+ cargos, datas, matérias
 * normalizadas, campos desnormalizados), liga o ato e gera os avisos.
 */

export class ErroAplicacao extends Error {
  constructor(public codigo: "edital_original_nao_encontrado" | "concurso_nao_encontrado" | "tipo_invalido" | "rejeitada", mensagem: string) {
    super(mensagem);
  }
}

const STATUS_POR_TIPO: Partial<Record<ActTipo, ContestStatus>> = {
  previsto: "previsto",
  autorizacao: "autorizado",
  edital_abertura: "edital_aberto",
  resultado: "resultado",
  homologacao: "homologado",
};
const ORDEM_STATUS: ContestStatus[] = ["previsto", "autorizado", "banca_definida", "edital_aberto", "inscricoes_encerradas", "prova_realizada", "resultado", "homologado"];

function avanca(atual: ContestStatus, novo: ContestStatus | undefined): boolean {
  if (!novo || atual === "cancelado") return false;
  return ORDEM_STATUS.indexOf(novo) > ORDEM_STATUS.indexOf(atual);
}

interface ExtracaoRow {
  id: string;
  act_id: string | null;
  raw_document_id: string | null;
  contest_id: string | null;
  status: string;
  confianca: string;
  doc_url: string | null;
  doc_publicado_em: string | null;
  doc_texto: string | null;
  doc_storage: string | null;
}

/** Acha o concurso a que o ato se refere: dedup exato, depois nº + ano com órgão parecido. */
export async function acharConcurso(campos: Pick<CamposExtraidos, "orgao" | "orgao_sigla" | "numero_edital" | "ano">, tx: Tx = sql): Promise<{ id: string; status: ContestStatus } | null> {
  const [exato] = await tx<{ id: string; status: ContestStatus }[]>`
    select id, status from contests where dedup_key = ${chaveDedup(campos.orgao, campos.numero_edital, campos.ano)}`;
  if (exato) return exato;
  if (!campos.numero_edital || !campos.ano) return null;
  const num = chaveDedup("x", campos.numero_edital, campos.ano).split("|")[1];
  const candidatos = await tx<{ id: string; status: ContestStatus; orgao: string; orgao_sigla: string | null }[]>`
    select id, status, orgao, orgao_sigla from contests where ano = ${campos.ano} and split_part(dedup_key, '|', 2) = ${num}`;
  const o = normalizar(campos.orgao);
  const s = campos.orgao_sigla ? normalizar(campos.orgao_sigla).replace(/[^a-z0-9]/g, "") : null;
  const parecido = candidatos.filter((c) => {
    const co = normalizar(c.orgao);
    const cs = c.orgao_sigla ? normalizar(c.orgao_sigla).replace(/[^a-z0-9]/g, "") : null;
    return co.includes(o) || o.includes(co) || (s && cs && s === cs);
  });
  return parecido.length === 1 ? parecido[0] : null;
}

async function slugUnico(tx: Tx, base: string): Promise<string> {
  const s = slugify(base) || "concurso";
  for (let i = 0; i < 50; i++) {
    const tentativa = i === 0 ? s : `${s.slice(0, 74)}-${i + 1}`;
    const [existe] = await tx`select 1 from contests where slug = ${tentativa}`;
    if (!existe) return tentativa;
  }
  return `${s.slice(0, 70)}-${Date.now().toString(36)}`;
}

async function garantirAto(tx: Tx, ex: ExtracaoRow, tipo: ActTipo, contestId: string | null, resumo: string | null): Promise<string> {
  if (ex.act_id) {
    await tx`update acts set contest_id = ${contestId}, tipo = ${tipo}, resumo = coalesce(resumo, ${resumo}) where id = ${ex.act_id}`;
    return ex.act_id;
  }
  if (ex.raw_document_id) {
    const [a] = await tx<{ id: string }[]>`
      insert into acts (raw_document_id, contest_id, tipo, confianca, resumo, url_oficial, publicado_em)
      values (${ex.raw_document_id}, ${contestId}, ${tipo}, ${ex.confianca}, ${resumo}, ${ex.doc_url}, ${ex.doc_publicado_em})
      on conflict (raw_document_id) where raw_document_id is not null
      do update set contest_id = excluded.contest_id, tipo = excluded.tipo
      returning id`;
    return a.id;
  }
  const [a] = await tx<{ id: string }[]>`
    insert into acts (contest_id, tipo, confianca, resumo, url_oficial) values (${contestId}, ${tipo}, ${ex.confianca}, ${resumo}, ${ex.doc_url}) returning id`;
  return a.id;
}

async function marcarExtracao(tx: Tx, ex: ExtracaoRow, campos: CamposExtraidos, contestId: string | null, actId: string, revisorId: string | null, criado: boolean) {
  await tx`update extractions set status = ${revisorId ? "aprovada" : "auto"}, campos_json = ${tx.json(campos as never)}, contest_id = ${contestId},
           act_id = ${actId}, revisado_por = ${revisorId}, revisado_em = ${revisorId ? new Date() : null}
           where id = ${ex.id}`;
  if (ex.raw_document_id) await tx`update raw_documents set status = 'extraido', erro = null where id = ${ex.raw_document_id}`;
  await tx`insert into audit_log (actor_id, acao, entidade, entidade_id, dados)
           values (${revisorId}, ${revisorId ? "extracao_aprovada" : "extracao_auto"}, 'extraction', ${ex.id},
                   ${tx.json({ contestId, criado, tipo: campos.tipo_ato })})`;
}

type Cargo = CamposExtraidos["cargos"][number];

function chaveMaterias(c: Cargo): string {
  return JSON.stringify((c.materias ?? []).map((m) => [normalizar(m.nome), m.numero_questoes ?? null]).sort());
}

/** Insere cargos e matérias (gerais quando todos os cargos têm a mesma lista; senão por cargo). */
async function inserirCargosEMaterias(tx: Tx, contestId: string, cargos: Cargo[], existentes: { id: string; nome: string }[] = []) {
  const ids = new Map<Cargo, string>();
  for (const r of cargos) {
    const ja = existentes.find((e) => normalizar(e.nome) === normalizar(r.nome));
    if (ja) {
      await tx`update contest_roles set escolaridade = coalesce(escolaridade, ${r.escolaridade ?? null}), area = coalesce(area, ${r.area ?? null}),
               vagas = coalesce(vagas, ${r.vagas ?? null}::int), salario_centavos = coalesce(salario_centavos, ${r.salario_centavos ?? null}::int),
               jornada = coalesce(jornada, ${r.jornada ?? null}), requisitos = coalesce(requisitos, ${r.requisitos ?? null})
               where id = ${ja.id}`;
      ids.set(r, ja.id);
      continue;
    }
    const [n] = await tx<{ id: string }[]>`
      insert into contest_roles (contest_id, nome, escolaridade, area, vagas, cadastro_reserva, salario_centavos, jornada, requisitos)
      values (${contestId}, ${r.nome}, ${r.escolaridade ?? null}, ${r.area ?? null}, ${r.vagas ?? null}, ${!!r.cadastro_reserva},
              ${r.salario_centavos ?? null}, ${r.jornada ?? null}, ${r.requisitos ?? null})
      returning id`;
    ids.set(r, n.id);
  }
  const comMaterias = cargos.filter((c) => c.materias?.length);
  if (!comMaterias.length) return;
  const mapa = await idsDasMaterias(tx, comMaterias.flatMap((c) => c.materias.map((m) => m.nome)));
  const gerais = comMaterias.length === cargos.length && comMaterias.every((c) => chaveMaterias(c) === chaveMaterias(comMaterias[0]));
  for (const c of gerais ? [comMaterias[0]] : comMaterias) {
    for (const m of c.materias) {
      const subjectId = mapa.get(m.nome);
      if (!subjectId) continue;
      await tx`insert into contest_subjects (contest_id, role_id, subject_id, questoes)
               values (${contestId}, ${gerais ? null : ids.get(c)!}, ${subjectId}, ${m.numero_questoes ?? null})
               on conflict do nothing`;
    }
  }
}

async function inserirDatas(tx: Tx, contestId: string, datas: CamposExtraidos["datas"], soAusentes: boolean) {
  const existentes = soAusentes ? (await tx<{ tipo: string }[]>`select tipo from contest_dates where contest_id = ${contestId}`).map((d) => d.tipo) : [];
  for (const d of datas) {
    if (!d.inicio && !d.fim) continue;
    if (existentes.includes(d.tipo)) continue;
    existentes.push(d.tipo);
    await tx`insert into contest_dates (contest_id, tipo, inicio, fim, descricao, fonte_item, fonte_pagina)
             values (${contestId}, ${d.tipo}, ${d.inicio}, ${d.fim}, ${d.descricao ?? null}, ${d.origem?.item ?? null}, ${d.origem?.pagina ?? null})`;
  }
}

/** Recalcula vagas_total, salario_max, escolaridades, áreas e cadastro reserva a partir dos cargos. */
async function desnormalizar(tx: Tx, contestId: string, areasExtra: string[]) {
  const validas = areasExtra.filter((a) => (AREAS as readonly string[]).includes(a));
  await tx`update contests c set
    vagas_total = coalesce((select nullif(sum(coalesce(r.vagas, 0)), 0)::int from contest_roles r where r.contest_id = c.id), c.vagas_total),
    salario_max_centavos = coalesce((select max(r.salario_centavos) from contest_roles r where r.contest_id = c.id), c.salario_max_centavos),
    cadastro_reserva = c.cadastro_reserva or coalesce((select bool_or(r.cadastro_reserva) from contest_roles r where r.contest_id = c.id), false),
    escolaridades = (select coalesce(array_agg(distinct e), '{}') from (
        select unnest(c.escolaridades) as e union select r.escolaridade from contest_roles r where r.contest_id = c.id and r.escolaridade is not null) x),
    areas = (select coalesce(array_agg(distinct a), '{}') from (
        select unnest(c.areas || ${validas}::text[]) as a union select r.area from contest_roles r where r.contest_id = c.id and r.area = any(${[...AREAS]}::text[])) y),
    updated_at = now()
    where c.id = ${contestId}`;
}

/** Avisa quem casa (perfil × concurso) e quem já acompanha: edital publicado ou autorizado (só Aprovado). */
export async function avisarNovoConcurso(contestId: string, tipoAto: ActTipo, urlAto: string | null, agora?: Date): Promise<number> {
  const [c] = await sql<{ orgao: string; orgao_sigla: string | null; vagas_total: number | null; salario_max_centavos: number | null; url_oficial: string; resumo: string | null; inscricao_fim: string | null }[]>`
    select orgao, orgao_sigla, vagas_total, salario_max_centavos, url_oficial, resumo,
      (select d.fim from contest_dates d where d.contest_id = c.id and d.tipo = 'inscricao' order by d.fim desc nulls last limit 1) as inscricao_fim
    from contests c where c.id = ${contestId} and c.publicado`;
  if (!c) return 0;
  const tipo = tipoAto === "edital_abertura" ? ("edital_publicado" as const) : ("autorizado" as const);
  const texto = tipo === "edital_publicado" ? textoEditalPublicado(c) : textoAutorizado(c);
  const quem = new Set([...(await usuariosQueCasam(contestId, agora)).map((u) => u.userId), ...(await seguidores(contestId))]);
  return enfileirarVarios(
    [...quem].map((userId) => ({ userId, contestId, tipo, ...texto, urlOficial: urlAto ?? c.url_oficial, dedupKey: `${tipo}:${contestId}:${userId}` })),
    { agora },
  );
}

export interface ResultadoAplicacao {
  contestId: string;
  criado: boolean;
  avisados: number;
}

export async function aplicarExtracaoImpl(
  extractionId: string,
  camposEntrada: CamposExtraidos,
  revisorId: string | null,
  opts: { agora?: Date; notificar?: boolean } = {},
): Promise<ResultadoAplicacao> {
  const campos = CamposExtraidos.parse(camposEntrada);
  const [ex] = await sql<ExtracaoRow[]>`
    select e.id, e.act_id, e.raw_document_id, e.contest_id, e.status, e.confianca,
      d.url as doc_url, d.publicado_em as doc_publicado_em, d.conteudo_texto as doc_texto, d.storage_path as doc_storage
    from extractions e left join raw_documents d on d.id = e.raw_document_id where e.id = ${extractionId}`;
  if (!ex) throw new Error("Extração não encontrada");
  if ((ex.status === "auto" || ex.status === "aprovada") && ex.contest_id) return { contestId: ex.contest_id, criado: false, avisados: 0 };
  if (ex.status === "rejeitada") throw new ErroAplicacao("rejeitada", "Extração rejeitada. Reprocesse o documento para aplicar.");
  const tipo = campos.tipo_ato;
  const notificar = opts.notificar !== false;
  const urlAto = ex.doc_url ?? campos.url_oficial;

  if (tipo === "outro") throw new ErroAplicacao("tipo_invalido", 'Ato classificado como "outro": corrija o tipo ou rejeite.');

  if (tipo === "retificacao") {
    const original = await acharConcurso(campos);
    if (!original) throw new ErroAplicacao("edital_original_nao_encontrado", "Edital original não encontrado (confira órgão, número e ano do edital retificado).");
    const actId = await sql.begin((tx) => garantirAto(tx, ex, tipo, original.id, campos.resumo ?? null));
    const r = await registrarAlteracaoImpl(original.id, campos, {
      resumo: campos.resumo ?? `Retificação publicada em ${dataBR(ex.doc_publicado_em ?? new Date().toISOString().slice(0, 10))}.`,
      autorId: revisorId,
      actId,
      notificar,
      agora: opts.agora,
      urlOficial: urlAto,
    });
    await sql.begin((tx) => marcarExtracao(tx, ex, campos, original.id, actId, revisorId, false));
    return { contestId: original.id, criado: false, avisados: r.avisados };
  }

  if (tipo === "homologacao" || tipo === "resultado" || tipo === "convocacao") {
    const c = await acharConcurso(campos);
    if (!c) throw new ErroAplicacao("concurso_nao_encontrado", "Concurso deste ato não está na base (confira órgão, número e ano do edital).");
    const novoStatus = STATUS_POR_TIPO[tipo];
    const promoveu = avanca(c.status, novoStatus);
    await sql.begin(async (tx) => {
      const actId = await garantirAto(tx, ex, tipo, c.id, campos.resumo ?? null);
      if (promoveu) await tx`update contests set status = ${novoStatus!}, updated_at = now() where id = ${c.id}`;
      await marcarExtracao(tx, ex, campos, c.id, actId, revisorId, false);
    });
    let avisados = 0;
    if (notificar && tipo !== "convocacao") {
      const [info] = await sql<{ orgao: string; orgao_sigla: string | null }[]>`select orgao, orgao_sigla from contests where id = ${c.id}`;
      const texto = textoResultado(info, tipo === "homologacao");
      avisados = await enfileirarVarios(
        (await seguidores(c.id)).map((userId) => ({ userId, contestId: c.id, tipo: "resultado" as const, ...texto, urlOficial: urlAto, dedupKey: `resultado:${ex.raw_document_id ?? ex.id}:${userId}` })),
        { agora: opts.agora },
      );
    }
    return { contestId: c.id, criado: false, avisados };
  }

  // previsto | autorizacao | edital_abertura
  const ano = campos.ano ?? (ex.doc_publicado_em ? Number(ex.doc_publicado_em.slice(0, 4)) : new Date().getFullYear());
  const dedup = chaveDedup(campos.orgao, campos.numero_edital, ano);
  const statusNovo = STATUS_POR_TIPO[tipo]!;
  const r = await sql.begin(async (tx) => {
    let existente: { id: string; status: ContestStatus } | null =
      (await tx<{ id: string; status: ContestStatus }[]>`select id, status from contests where dedup_key = ${dedup} for update`)[0] ?? null;
    if (!existente) existente = await acharConcurso({ ...campos, ano }, tx);
    if (!existente && tipo === "edital_abertura") {
      // Concurso que estava no radar (previsto/autorizado, sem número) ganha o edital: promove, não duplica.
      const [radar] = await tx<{ id: string; status: ContestStatus }[]>`
        select id, status from contests
        where dedup_key = any(${[chaveDedup(campos.orgao, null, ano), chaveDedup(campos.orgao, null, ano - 1)]}::text[])
          and status in ('previsto', 'autorizado', 'banca_definida')
        order by created_at desc limit 1 for update`;
      if (radar) {
        await tx`update contests set dedup_key = ${dedup}, numero_edital = ${campos.numero_edital ?? null}, ano = ${ano} where id = ${radar.id}`;
        existente = radar;
      }
    }
    const textoEdital = tipo === "edital_abertura" ? ex.doc_texto : null;
    if (!existente) {
      const titulo = campos.titulo?.trim() || `${campos.orgao_sigla ?? campos.orgao}${campos.cargos[0] ? ` · ${campos.cargos[0].nome}` : ""}`;
      const [novo] = await tx<{ id: string }[]>`
        insert into contests (slug, dedup_key, orgao, orgao_sigla, esfera, uf, cidade, banca, numero_edital, ano, status, titulo, resumo,
          url_oficial, taxa_centavos, cadastro_reserva, escolaridades, areas, edital_storage_path, edital_texto, publicado_em, publicado)
        values (${await slugUnico(tx, `${titulo}-${ano}`)}, ${dedup}, ${campos.orgao}, ${campos.orgao_sigla ?? null}, ${campos.esfera},
          ${campos.uf ?? null}, ${campos.cidade ?? null}, ${campos.banca ?? null}, ${campos.numero_edital ?? null}, ${ano}, ${statusNovo},
          ${titulo.slice(0, 200)}, ${campos.resumo ?? null}, ${campos.url_oficial}, ${campos.taxa_centavos ?? null},
          ${campos.cargos.some((c) => c.cadastro_reserva)}, ${[]}::text[], ${[]}::text[], ${tipo === "edital_abertura" ? ex.doc_storage : null},
          ${textoEdital}, ${ex.doc_publicado_em}, true)
        returning id`;
      await inserirCargosEMaterias(tx, novo.id, campos.cargos);
      await inserirDatas(tx, novo.id, campos.datas, false);
      await desnormalizar(tx, novo.id, campos.areas ?? []);
      const actId = await garantirAto(tx, ex, tipo, novo.id, campos.resumo ?? null);
      await marcarExtracao(tx, ex, campos, novo.id, actId, revisorId, true);
      return { contestId: novo.id, criado: true, promoveuEdital: false };
    }
    // Mesmo concurso (outra fonte, ou o edital de um autorizado): completa o que falta, sem duplicar.
    const promoveu = avanca(existente.status, statusNovo);
    await tx`update contests set
      status = ${promoveu ? statusNovo : existente.status},
      orgao_sigla = coalesce(orgao_sigla, ${campos.orgao_sigla ?? null}),
      uf = coalesce(uf, ${campos.uf ?? null}), cidade = coalesce(cidade, ${campos.cidade ?? null}),
      banca = coalesce(banca, ${campos.banca ?? null}), numero_edital = coalesce(numero_edital, ${campos.numero_edital ?? null}),
      taxa_centavos = coalesce(taxa_centavos, ${campos.taxa_centavos ?? null}::int), resumo = coalesce(resumo, ${campos.resumo ?? null}),
      url_oficial = case when ${promoveu && tipo === "edital_abertura"} then ${campos.url_oficial} else url_oficial end,
      edital_texto = coalesce(edital_texto, ${textoEdital}), edital_storage_path = coalesce(edital_storage_path, ${tipo === "edital_abertura" ? ex.doc_storage : null}),
      updated_at = now()
      where id = ${existente.id}`;
    const cargosAtuais = await tx<{ id: string; nome: string }[]>`select id, nome from contest_roles where contest_id = ${existente.id}`;
    await inserirCargosEMaterias(tx, existente.id, campos.cargos, cargosAtuais);
    await inserirDatas(tx, existente.id, campos.datas, true);
    await desnormalizar(tx, existente.id, campos.areas ?? []);
    const actId = await garantirAto(tx, ex, tipo, existente.id, campos.resumo ?? null);
    await marcarExtracao(tx, ex, campos, existente.id, actId, revisorId, false);
    return { contestId: existente.id, criado: false, promoveuEdital: promoveu && tipo === "edital_abertura" };
  });
  let avisados = 0;
  if (notificar && (r.criado || r.promoveuEdital)) avisados = await avisarNovoConcurso(r.contestId, tipo, urlAto, opts.agora);
  return { contestId: r.contestId, criado: r.criado, avisados };
}

/** Rejeita a extração. Se ela tinha criado um concurso sozinha, o concurso sai do ar (publicado = false). */
export async function rejeitarExtracaoImpl(extractionId: string, motivo: string, revisorId: string): Promise<void> {
  await sql.begin(async (tx) => {
    const [ex] = await tx<{ id: string; status: string; contest_id: string | null; raw_document_id: string | null }[]>`
      select id, status, contest_id, raw_document_id from extractions where id = ${extractionId} for update`;
    if (!ex) throw new Error("Extração não encontrada");
    await tx`update extractions set status = 'rejeitada', motivo_revisao = ${motivo}, revisado_por = ${revisorId}, revisado_em = now() where id = ${ex.id}`;
    if (ex.raw_document_id) await tx`update raw_documents set status = 'descartado', erro = ${`rejeitado: ${motivo}`.slice(0, 500)} where id = ${ex.raw_document_id}`;
    if (ex.contest_id && (ex.status === "auto" || ex.status === "aprovada")) {
      const [outra] = await tx`select 1 from extractions where contest_id = ${ex.contest_id} and id <> ${ex.id} and status in ('auto', 'aprovada') limit 1`;
      if (!outra) await tx`update contests set publicado = false, updated_at = now() where id = ${ex.contest_id}`;
    }
    await tx`insert into audit_log (actor_id, acao, entidade, entidade_id, dados)
             values (${revisorId}, 'extracao_rejeitada', 'extraction', ${ex.id}, ${tx.json({ motivo, contestId: ex.contest_id })})`;
  });
}
