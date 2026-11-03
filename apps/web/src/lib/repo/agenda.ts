import "server-only";
import { sql } from "@/lib/db";
import {
  hojeISO, materiasEmComum, somarDias, diasEntre,
  type CompromissoDTO, type HojeResponse, type MateriasEmComumResponse, type MateriaDeConcurso, type AvisoDTO,
} from "@aviso/shared";

/** Compromissos de todos os concursos acompanhados que se sobrepõem ao intervalo. */
export async function agenda(userId: string, de: string, ate: string, contestId?: string): Promise<CompromissoDTO[]> {
  return sql<CompromissoDTO[]>`
    select d.id, d.contest_id, coalesce(c.orgao_sigla, c.orgao) as concurso, c.orgao_sigla, f.cor,
           d.tipo, d.inicio, d.fim, d.descricao
    from follows f
    join contests c on c.id = f.contest_id and c.publicado
    join contest_dates d on d.contest_id = c.id
    where f.user_id = ${userId}
      ${contestId ? sql`and c.id = ${contestId}` : sql``}
      and coalesce(d.inicio, d.fim) <= ${ate} and coalesce(d.fim, d.inicio) >= ${de}
    order by coalesce(d.fim, d.inicio), d.tipo`;
}

export async function materias(userId: string): Promise<MateriasEmComumResponse> {
  const concursos = await sql<{ contest_id: string; titulo: string; cor: string; ativo: boolean; role_id: string | null }[]>`
    select f.contest_id, coalesce(c.orgao_sigla, c.orgao) as titulo, f.cor, f.nas_materias as ativo, f.role_id
    from follows f join contests c on c.id = f.contest_id and c.publicado where f.user_id = ${userId} order by f.created_at`;
  const ids = concursos.map((c) => c.contest_id);
  const linhas = ids.length
    ? await sql<(MateriaDeConcurso & { role_id: string | null })[]>`
        select cs.contest_id, cs.subject_id, s.nome as subject_nome, cs.questoes, cs.role_id
        from contest_subjects cs join subjects s on s.id = cs.subject_id
        where cs.contest_id = any(${ids}::uuid[])`
    : [];
  // Uma linha por (concurso, matéria), sem somar cargos diferentes do mesmo edital:
  // com cargo escolhido, vale a linha do cargo (ou a geral); sem cargo, a geral (ou a de maior nº de questões).
  const escolhida = new Map<string, (typeof linhas)[number]>();
  for (const l of linhas) {
    const roleEscolhido = concursos.find((c) => c.contest_id === l.contest_id)?.role_id ?? null;
    if (l.role_id && roleEscolhido && l.role_id !== roleEscolhido) continue;
    const k = `${l.contest_id}|${l.subject_id}`;
    const atual = escolhida.get(k);
    const peso = (x: typeof l) =>
      (roleEscolhido && x.role_id === roleEscolhido ? 2_000_000 : 0) + (x.role_id === null ? 1_000_000 : 0) + (x.questoes ?? 0);
    if (!atual || peso(l) > peso(atual)) escolhida.set(k, l);
  }
  const filtradas = [...escolhida.values()];
  const ativos = new Set(concursos.filter((c) => c.ativo).map((c) => c.contest_id));
  return {
    concursos: concursos.map(({ role_id: _r, ...c }) => c),
    materias: materiasEmComum(filtradas, ativos),
  };
}

export async function avisosRecentes(userId: string, limite = 20): Promise<AvisoDTO[]> {
  return sql<AvisoDTO[]>`
    select id, contest_id, tipo, titulo, corpo, url_oficial, created_at, (lido_em is not null) as lido
    from alerts where user_id = ${userId} and canal = 'inapp'
    order by created_at desc limit ${limite}`;
}

export async function hoje(userId: string, comRadar = false): Promise<HojeResponse> {
  const h = hojeISO();
  const [proximas, prazos, avisos] = await Promise.all([
    sql<{ contest_id: string; concurso: string; cor: string; data: string }[]>`
      select c.id as contest_id, coalesce(c.orgao_sigla, c.orgao) as concurso, f.cor, coalesce(d.inicio, d.fim) as data
      from follows f join contests c on c.id = f.contest_id and c.publicado join contest_dates d on d.contest_id = c.id
      where f.user_id = ${userId} and d.tipo = 'prova' and coalesce(d.inicio, d.fim) >= ${h}
      order by coalesce(d.inicio, d.fim) limit 1`,
    agenda(userId, h, somarDias(h, 7)),
    avisosRecentes(userId, 10),
  ]);
  const { novidadesParaUsuario } = await import("./perfis");
  const p = proximas[0];
  return {
    proximaProva: p ? { ...p, dias: diasEntre(h, p.data) } : null,
    prazos,
    avisos,
    novidades: await novidadesParaUsuario(userId, 5, comRadar),
  };
}
