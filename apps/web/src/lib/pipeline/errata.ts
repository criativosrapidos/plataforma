import "server-only";
import { sql, type Tx } from "@/lib/db";
import { DATE_TIPO_LABEL, diffCampos, normalizar, type CampoAlterado, type DateTipo } from "@aviso/shared";
import { enfileirarVarios } from "@/lib/notify/despachar";
import { textoErrata } from "@/lib/notify/textos";
import { seguidores } from "./match";
import type { CamposExtraidos } from "./schema";

/**
 * Errata/retificação (ou edição manual relevante) num concurso:
 * compara com o que está no banco (diffCampos), atualiza datas/campos — a agenda de quem acompanha
 * lê contest_dates, então muda junto —, grava contest_versions e avisa SÓ quem acompanha.
 * Idempotente: aplicar a mesma errata de novo não gera versão nem aviso (diff vazio).
 */

interface DataAtual {
  id: string;
  tipo: DateTipo;
  inicio: string | null;
  fim: string | null;
}

interface CargoAtual {
  id: string;
  nome: string;
  vagas: number | null;
  salario_centavos: number | null;
}

/** "2027-01-17" ou "2026-11-03 a 2026-12-02" (formato do diff_json). */
export function formatarPeriodo(d: { inicio: string | null; fim: string | null } | null | undefined): string | null {
  if (!d || (!d.inicio && !d.fim)) return null;
  if (d.inicio && d.fim && d.inicio !== d.fim) return `${d.inicio} a ${d.fim}`;
  return d.fim ?? d.inicio;
}

const CAMPOS_ERRATA = ["banca", "taxa_centavos"] as const;
const CAMPOS_MANUAIS = ["banca", "taxa_centavos", "titulo", "resumo", "url_oficial", "orgao_sigla", "uf", "cidade", "numero_edital"] as const;
type CampoSimples = (typeof CAMPOS_MANUAIS)[number];

function rotulo(campo: string): string {
  if (campo.startsWith("data:")) return DATE_TIPO_LABEL[campo.slice(5) as DateTipo] ?? campo.slice(5);
  if (campo.startsWith("cargo:")) {
    const [, nome, attr] = campo.split(":");
    return `${nome}${attr === "vagas" ? " (vagas)" : attr === "salario_centavos" ? " (remuneração)" : ""}`;
  }
  const m: Record<string, string> = { banca: "Banca", taxa_centavos: "Taxa de inscrição", titulo: "Título", resumo: "Resumo", url_oficial: "Link oficial", orgao_sigla: "Sigla", uf: "UF", cidade: "Cidade", numero_edital: "Número do edital" };
  return m[campo] ?? campo;
}

export interface OpcoesAlteracao {
  resumo: string;
  autorId: string | null;
  actId?: string | null;
  notificar?: boolean;
  agora?: Date;
  /** Link oficial do ato que mudou (padrão: link do ato ou do concurso). */
  urlOficial?: string | null;
}

export async function registrarAlteracaoImpl(
  contestId: string,
  novos: Partial<CamposExtraidos>,
  opts: OpcoesAlteracao,
): Promise<{ versao: number; alterados: string[]; avisados: number }> {
  const resultado = await sql.begin(async (tx: Tx) => {
    const [c] = await tx<Record<CampoSimples, unknown>[]>`
      select banca, taxa_centavos, titulo, resumo, url_oficial, orgao_sigla, uf, cidade, numero_edital
      from contests where id = ${contestId} for update`;
    if (!c) throw new Error("Concurso não encontrado");
    const datas = await tx<DataAtual[]>`select id, tipo, inicio, fim from contest_dates where contest_id = ${contestId} order by coalesce(inicio, fim)`;
    const cargos = await tx<CargoAtual[]>`select id, nome, vagas, salario_centavos from contest_roles where contest_id = ${contestId}`;

    const antes: Record<string, unknown> = {};
    const depois: Record<string, unknown> = {};
    const camposPermitidos: readonly CampoSimples[] = opts.actId ? CAMPOS_ERRATA : CAMPOS_MANUAIS;
    for (const f of camposPermitidos) {
      const v = (novos as Record<string, unknown>)[f];
      if (v === undefined || v === null || v === "") continue;
      antes[f] = c[f] ?? null;
      depois[f] = v;
    }
    const novasDatas: { tipo: DateTipo; inicio: string | null; fim: string | null; descricao?: string | null; origem?: { item?: string | null; pagina?: number | null } }[] = [];
    for (const d of novos.datas ?? []) {
      if (!d.inicio && !d.fim) continue;
      const atual = datas.find((x) => x.tipo === d.tipo);
      const nova = { inicio: d.inicio ?? (d.fim && atual?.inicio && atual.inicio <= d.fim ? atual.inicio : d.fim), fim: d.fim ?? d.inicio };
      antes[`data:${d.tipo}`] = formatarPeriodo(atual);
      depois[`data:${d.tipo}`] = formatarPeriodo(nova);
      novasDatas.push({ tipo: d.tipo, ...nova, descricao: d.descricao ?? null, origem: d.origem });
    }
    const novosCargos: { atual: CargoAtual | null; vagas: number | null; salario: number | null; nome: string; dados: NonNullable<CamposExtraidos["cargos"]>[number] }[] = [];
    for (const r of novos.cargos ?? []) {
      const atual = cargos.find((x) => normalizar(x.nome) === normalizar(r.nome)) ?? null;
      if (atual) {
        if (r.vagas != null) {
          antes[`cargo:${atual.nome}:vagas`] = atual.vagas;
          depois[`cargo:${atual.nome}:vagas`] = r.vagas;
        }
        if (r.salario_centavos != null) {
          antes[`cargo:${atual.nome}:salario_centavos`] = atual.salario_centavos;
          depois[`cargo:${atual.nome}:salario_centavos`] = r.salario_centavos;
        }
      } else {
        antes[`cargo:${r.nome}`] = null;
        depois[`cargo:${r.nome}`] = `${r.vagas ?? "?"} vagas`;
      }
      novosCargos.push({ atual, vagas: r.vagas ?? null, salario: r.salario_centavos ?? null, nome: r.nome, dados: r });
    }

    const diff: CampoAlterado[] = diffCampos(antes, depois);
    const [{ versao: atualVersao }] = await tx<{ versao: number }[]>`
      select coalesce(max(versao), 1)::int as versao from contest_versions where contest_id = ${contestId}`;
    if (!diff.length) return { versao: atualVersao, diff, urlAto: null as string | null };
    const mudou = new Set(diff.map((d) => d.campo));

    // Campos simples
    for (const f of camposPermitidos) {
      if (!mudou.has(f)) continue;
      await tx`update contests set ${tx({ [f]: depois[f] })}, updated_at = now() where id = ${contestId}`;
    }
    // Datas (a agenda lê daqui)
    for (const d of novasDatas) {
      if (!mudou.has(`data:${d.tipo}`)) continue;
      const atual = datas.find((x) => x.tipo === d.tipo);
      if (atual) {
        await tx`update contest_dates set inicio = ${d.inicio}, fim = ${d.fim}, descricao = coalesce(${d.descricao ?? null}, descricao),
                 fonte_item = coalesce(${d.origem?.item ?? null}, fonte_item), fonte_pagina = coalesce(${d.origem?.pagina ?? null}::int, fonte_pagina),
                 updated_at = now() where id = ${atual.id}`;
      } else {
        await tx`insert into contest_dates (contest_id, tipo, inicio, fim, descricao, fonte_item, fonte_pagina)
                 values (${contestId}, ${d.tipo}, ${d.inicio}, ${d.fim}, ${d.descricao ?? null}, ${d.origem?.item ?? null}, ${d.origem?.pagina ?? null})`;
      }
    }
    // Cargos
    let mexeuCargos = false;
    for (const r of novosCargos) {
      if (r.atual) {
        if (!mudou.has(`cargo:${r.atual.nome}:vagas`) && !mudou.has(`cargo:${r.atual.nome}:salario_centavos`)) continue;
        await tx`update contest_roles set vagas = coalesce(${r.vagas}::int, vagas), salario_centavos = coalesce(${r.salario}::int, salario_centavos)
                 where id = ${r.atual.id}`;
      } else {
        await tx`insert into contest_roles (contest_id, nome, escolaridade, area, vagas, cadastro_reserva, salario_centavos, jornada, requisitos)
                 values (${contestId}, ${r.nome}, ${r.dados.escolaridade ?? null}, ${r.dados.area ?? null}, ${r.vagas}, ${!!r.dados.cadastro_reserva},
                         ${r.salario}, ${r.dados.jornada ?? null}, ${r.dados.requisitos ?? null})`;
      }
      mexeuCargos = true;
    }
    if (mexeuCargos) {
      await tx`update contests c set
        vagas_total = (select nullif(sum(coalesce(r.vagas, 0)), 0)::int from contest_roles r where r.contest_id = c.id),
        salario_max_centavos = coalesce((select max(r.salario_centavos) from contest_roles r where r.contest_id = c.id), c.salario_max_centavos),
        updated_at = now()
        where c.id = ${contestId}`;
    }
    await tx`update contests set updated_at = now() where id = ${contestId}`;

    const versao = atualVersao + 1;
    const diffJson = diff.map((d) => ({ ...d, rotulo: rotulo(d.campo) }));
    await tx`insert into contest_versions (contest_id, act_id, versao, diff_json, resumo)
             values (${contestId}, ${opts.actId ?? null}, ${versao}, ${tx.json(diffJson)}, ${opts.resumo})`;
    await tx`insert into audit_log (actor_id, acao, entidade, entidade_id, dados)
             values (${opts.autorId}, 'concurso_alterado', 'contest', ${contestId}, ${tx.json({ versao, diff: diffJson, actId: opts.actId ?? null })})`;
    const [ato] = opts.actId ? await tx<{ url_oficial: string | null }[]>`select url_oficial from acts where id = ${opts.actId}` : [];
    return { versao, diff, urlAto: ato?.url_oficial ?? null };
  });

  let avisados = 0;
  if (resultado.diff.length && opts.notificar !== false) {
    const [c] = await sql<{ orgao: string; orgao_sigla: string | null; url_oficial: string }[]>`
      select orgao, orgao_sigla, url_oficial from contests where id = ${contestId}`;
    const url = opts.urlOficial ?? resultado.urlAto ?? c.url_oficial;
    const texto = textoErrata(c, resultado.diff);
    const quem = await seguidores(contestId);
    avisados = await enfileirarVarios(
      quem.map((userId) => ({
        userId,
        contestId,
        tipo: "errata" as const,
        ...texto,
        urlOficial: url,
        dedupKey: `errata:${contestId}:v${resultado.versao}:${userId}`,
      })),
      { agora: opts.agora },
    );
  }
  return { versao: resultado.versao, alterados: resultado.diff.map((d) => d.campo), avisados };
}
