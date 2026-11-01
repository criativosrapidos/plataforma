// Popula o banco de desenvolvimento. Idempotente para matérias, fontes e usuários.
// Concursos de exemplo ficam com exemplo = true (não use em produção: SEED_EXEMPLOS=0).
import postgres from "postgres";
import { carregarEnv } from "./env";
import { MATERIAS_CANONICAS } from "../db/subjects";
import { hashSenha } from "../src/lib/auth/password";
import { chaveDedup, hojeISO, slugify, somarDias, CHECKLIST_PADRAO, TRIAL_DAYS } from "@aviso/shared";

carregarEnv();
const sql = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
const H = hojeISO();
const d = (n: number) => somarDias(H, n);

const FONTES = [
  { slug: "dou", nome: "Diário Oficial da União (INLABS)", tipo: "dou", url: "https://inlabs.in.gov.br", frequencia_min: 1440, config: { secoes: ["DO1", "DO2", "DO3"], horario: "06:00" } },
  { slug: "querido-diario", nome: "Querido Diário (diários municipais)", tipo: "querido_diario", url: "https://queridodiario.ok.org.br/api", frequencia_min: 360, config: { termos: ["concurso público", "edital de abertura", "processo seletivo"] } },
  { slug: "cebraspe", nome: "Cebraspe", tipo: "banca", url: "https://www.cebraspe.org.br/concursos", frequencia_min: 60, config: {} },
  { slug: "fgv", nome: "FGV Conhecimento", tipo: "banca", url: "https://conhecimento.fgv.br/concursos", frequencia_min: 60, config: {} },
  { slug: "fcc", nome: "Fundação Carlos Chagas", tipo: "banca", url: "https://www.concursosfcc.com.br", frequencia_min: 60, config: {} },
  { slug: "vunesp", nome: "Vunesp", tipo: "banca", url: "https://www.vunesp.com.br", frequencia_min: 60, config: {} },
  { slug: "cesgranrio", nome: "Cesgranrio", tipo: "banca", url: "https://www.cesgranrio.org.br/concursos", frequencia_min: 60, config: {} },
  { slug: "ibfc", nome: "IBFC", tipo: "banca", url: "https://www.ibfc.org.br", frequencia_min: 60, config: {} },
  { slug: "aocp", nome: "Instituto AOCP", tipo: "banca", url: "https://www.institutoaocp.org.br", frequencia_min: 60, config: {} },
  { slug: "quadrix", nome: "Quadrix", tipo: "banca", url: "https://www.quadrix.org.br", frequencia_min: 60, config: {} },
  { slug: "idecan", nome: "Idecan", tipo: "banca", url: "https://www.idecan.org.br", frequencia_min: 60, config: {} },
];

type Ex = {
  orgao: string; sigla: string; esfera: "federal" | "estadual" | "municipal"; uf: string | null; cidade?: string; banca: string | null;
  numero: string | null; status: string; titulo: string; resumo: string; url: string; taxa?: number; escolaridades: string[]; areas: string[];
  publicado: number;
  cargos: { nome: string; escolaridade: string; vagas: number | null; cr?: boolean; salario: number | null; jornada?: string; area?: string }[];
  datas: { tipo: string; inicio: number | null; fim: number | null; descricao?: string; item?: string; pagina?: number }[];
  materias: [string, number | null][];
};

const EXEMPLOS: Ex[] = [
  {
    orgao: "Tribunal Regional Federal da 3ª Região", sigla: "TRF 3", esfera: "federal", uf: "SP", cidade: "São Paulo", banca: "FCC",
    numero: "01/2026", status: "edital_aberto", titulo: "TRF 3 · Técnico e Analista Judiciário",
    resumo: "Concurso para técnico (nível médio) e analista judiciário (superior), com vagas imediatas e cadastro reserva em SP e MS.",
    url: "https://www.trf3.jus.br/concursos", taxa: 8500, escolaridades: ["medio", "superior"], areas: ["tribunais", "juridica"], publicado: -6,
    cargos: [
      { nome: "Técnico Judiciário – Área Administrativa", escolaridade: "medio", vagas: 40, cr: true, salario: 870000, jornada: "40h", area: "tribunais" },
      { nome: "Analista Judiciário – Área Judiciária", escolaridade: "superior", vagas: 25, cr: true, salario: 1420000, jornada: "40h", area: "juridica" },
    ],
    datas: [
      { tipo: "isencao", inicio: -5, fim: 2, item: "5.1", pagina: 7 },
      { tipo: "inscricao", inicio: -5, fim: 21, item: "4.1", pagina: 6 },
      { tipo: "pagamento", inicio: null, fim: 22, item: "4.7", pagina: 6 },
      { tipo: "local_prova", inicio: 40, fim: 40, descricao: "Divulgação dos locais", item: "9.2", pagina: 12 },
      { tipo: "prova", inicio: 47, fim: 47, descricao: "Provas objetiva e discursiva", item: "9.1", pagina: 12 },
    ],
    materias: [["Língua Portuguesa", 15], ["Raciocínio Lógico", 5], ["Direito Constitucional", 10], ["Direito Administrativo", 10], ["Informática", 5], ["Legislação Específica", 10], ["Direito Processual Civil", 5]],
  },
  {
    orgao: "Instituto Nacional do Seguro Social", sigla: "INSS", esfera: "federal", uf: null, banca: "Cebraspe",
    numero: "02/2026", status: "edital_aberto", titulo: "INSS · Técnico do Seguro Social",
    resumo: "Vagas para técnico do seguro social, nível médio, lotação em todo o país.",
    url: "https://www.gov.br/inss/pt-br/acesso-a-informacao/concursos", taxa: 8500, escolaridades: ["medio"], areas: ["administrativa"], publicado: -3,
    cargos: [{ nome: "Técnico do Seguro Social", escolaridade: "medio", vagas: 1000, cr: true, salario: 595000, jornada: "40h", area: "administrativa" }],
    datas: [
      { tipo: "isencao", inicio: -2, fim: 5, item: "6.4", pagina: 9 },
      { tipo: "inscricao", inicio: -2, fim: 16, item: "6.1", pagina: 8 },
      { tipo: "prova", inicio: 54, fim: 54, item: "10.1", pagina: 14 },
    ],
    materias: [["Língua Portuguesa", 20], ["Raciocínio Lógico", 10], ["Direito Constitucional", 10], ["Direito Administrativo", 10], ["Direito Previdenciário", 40], ["Ética no Serviço Público", 5], ["Informática", 10], ["Atualidades", 5]],
  },
  {
    orgao: "Polícia Civil do Estado de Minas Gerais", sigla: "PC MG", esfera: "estadual", uf: "MG", cidade: "Belo Horizonte", banca: "Vunesp",
    numero: "03/2026", status: "edital_aberto", titulo: "PC MG · Investigador de Polícia",
    resumo: "Concurso para investigador de polícia com exigência de nível superior em qualquer área.",
    url: "https://www.policiacivil.mg.gov.br/concursos", taxa: 11000, escolaridades: ["superior"], areas: ["policial"], publicado: -10,
    cargos: [{ nome: "Investigador de Polícia", escolaridade: "superior", vagas: 255, salario: 693000, jornada: "40h", area: "policial" }],
    datas: [
      { tipo: "inscricao", inicio: -9, fim: 4, item: "3.1", pagina: 4 },
      { tipo: "prova", inicio: 33, fim: 33, item: "8.1", pagina: 11 },
    ],
    materias: [["Língua Portuguesa", 15], ["Direito Constitucional", 10], ["Direito Penal", 15], ["Direito Processual Penal", 15], ["Direitos Humanos", 5], ["Informática", 5], ["Criminologia", 5], ["Medicina Legal", 5]],
  },
  {
    orgao: "Prefeitura Municipal de Curitiba", sigla: "Pref. Curitiba", esfera: "municipal", uf: "PR", cidade: "Curitiba", banca: "IBFC",
    numero: "12/2026", status: "edital_aberto", titulo: "Prefeitura de Curitiba · Professor e Agente Administrativo",
    resumo: "Vagas para professor de educação infantil e agente administrativo.",
    url: "https://www.curitiba.pr.gov.br/concursos", taxa: 6000, escolaridades: ["medio", "superior"], areas: ["educacao", "administrativa"], publicado: -1,
    cargos: [
      { nome: "Professor de Educação Infantil", escolaridade: "superior", vagas: 120, salario: 452000, area: "educacao" },
      { nome: "Agente Administrativo", escolaridade: "medio", vagas: 60, salario: 318000, area: "administrativa" },
    ],
    datas: [
      { tipo: "isencao", inicio: 0, fim: 6 },
      { tipo: "inscricao", inicio: 0, fim: 28 },
      { tipo: "prova", inicio: 61, fim: 61 },
    ],
    materias: [["Língua Portuguesa", 10], ["Matemática", 10], ["Informática", 5], ["Conhecimentos Pedagógicos", 15], ["Legislação Específica", 10]],
  },
  {
    orgao: "Banco do Brasil", sigla: "BB", esfera: "federal", uf: null, banca: "Cesgranrio",
    numero: "01/2026", status: "inscricoes_encerradas", titulo: "Banco do Brasil · Escriturário",
    resumo: "Agente comercial e agente de tecnologia, nível médio.",
    url: "https://www.bb.com.br/concursos", taxa: 5000, escolaridades: ["medio"], areas: ["bancaria", "ti"], publicado: -40,
    cargos: [
      { nome: "Escriturário – Agente Comercial", escolaridade: "medio", vagas: 2000, cr: true, salario: 462000, area: "bancaria" },
      { nome: "Escriturário – Agente de Tecnologia", escolaridade: "medio", vagas: 500, cr: true, salario: 462000, area: "ti" },
    ],
    datas: [
      { tipo: "inscricao", inicio: -40, fim: -12 },
      { tipo: "local_prova", inicio: 3, fim: 3 },
      { tipo: "prova", inicio: 9, fim: 9 },
    ],
    materias: [["Língua Portuguesa", 10], ["Língua Inglesa", 5], ["Matemática", 5], ["Atualidades", 5], ["Conhecimentos Bancários", 10], ["Matemática Financeira", 5], ["Informática", 15], ["Vendas e Negociação", 15]],
  },
  {
    orgao: "Receita Federal do Brasil", sigla: "RFB", esfera: "federal", uf: null, banca: null,
    numero: null, status: "autorizado", titulo: "Receita Federal · Auditor-Fiscal e Analista-Tributário",
    resumo: "Concurso autorizado em portaria. Banca ainda não definida.",
    url: "https://www.in.gov.br", escolaridades: ["superior"], areas: ["fiscal"], publicado: -15,
    cargos: [
      { nome: "Auditor-Fiscal da Receita Federal", escolaridade: "superior", vagas: null, salario: 2300000, area: "fiscal" },
      { nome: "Analista-Tributário", escolaridade: "superior", vagas: null, salario: 1300000, area: "fiscal" },
    ],
    datas: [],
    materias: [],
  },
  {
    orgao: "Tribunal de Justiça do Estado da Bahia", sigla: "TJ BA", esfera: "estadual", uf: "BA", cidade: "Salvador", banca: "FGV",
    numero: "01/2026", status: "edital_aberto", titulo: "TJ BA · Técnico Judiciário",
    resumo: "Técnico judiciário (médio) e analista (superior) em várias comarcas.",
    url: "https://www.tjba.jus.br/concursos", taxa: 9000, escolaridades: ["medio", "superior"], areas: ["tribunais"], publicado: -2,
    cargos: [
      { nome: "Técnico Judiciário", escolaridade: "medio", vagas: 80, salario: 520000, area: "tribunais" },
      { nome: "Analista Judiciário", escolaridade: "superior", vagas: 40, salario: 890000, area: "tribunais" },
    ],
    datas: [
      { tipo: "isencao", inicio: -1, fim: 3 },
      { tipo: "inscricao", inicio: -1, fim: 25 },
      { tipo: "prova", inicio: 68, fim: 68 },
    ],
    materias: [["Língua Portuguesa", 15], ["Raciocínio Lógico", 10], ["Direito Constitucional", 10], ["Direito Administrativo", 10], ["Legislação Específica", 15], ["Direito Processual Civil", 10]],
  },
];

const EDITAL_TEXTO = `EDITAL Nº 01/2026 – ABERTURA (exemplo para desenvolvimento)

1. DAS DISPOSIÇÕES PRELIMINARES
1.1 O concurso será regido por este edital e executado pela banca organizadora.

4. DAS INSCRIÇÕES
4.1 As inscrições serão realizadas exclusivamente pela internet, no site da banca, no período indicado no cronograma.
4.7 O boleto da taxa de inscrição deverá ser pago até o dia útil seguinte ao fim das inscrições.

5. DA ISENÇÃO DA TAXA
5.1 Terá direito à isenção o candidato inscrito no CadÚnico, o doador de medula óssea cadastrado no REDOME e o doador de sangue, nos termos da lei.
5.3 O pedido de isenção deverá ser feito no período próprio, mais curto que o das inscrições.

7. DOS REQUISITOS
7.1 Técnico: certificado de conclusão do ensino médio. Analista: diploma de curso superior em Direito.

9. DAS PROVAS
9.1 As provas objetiva e discursiva serão aplicadas na mesma data, no turno da tarde, com duração de 4 horas e 30 minutos.
9.2 Os locais de prova serão divulgados no site da banca com antecedência mínima de 7 dias.
9.5 O candidato deverá comparecer com caneta esferográfica de tinta preta, fabricada em material transparente, e documento oficial com foto.

12. DA REMUNERAÇÃO
12.1 Técnico Judiciário: R$ 8.700,00. Analista Judiciário: R$ 14.200,00, já incluídas as gratificações.`;

async function main() {
  // Matérias canônicas
  for (const m of MATERIAS_CANONICAS) {
    await sql`insert into subjects (nome, slug, sinonimos) values (${m.nome}, ${slugify(m.nome)}, ${m.sinonimos})
              on conflict (nome) do update set sinonimos = excluded.sinonimos`;
  }
  // Fontes
  for (const f of FONTES) {
    await sql`insert into sources (slug, nome, tipo, url, frequencia_min, config)
              values (${f.slug}, ${f.nome}, ${f.tipo}, ${f.url}, ${f.frequencia_min}, ${sql.json(f.config)})
              on conflict (slug) do nothing`;
  }
  // Usuários de desenvolvimento
  const senha = await hashSenha("aviso1234");
  const usuarios = [
    { nome: "Admin Aviso", email: "admin@avisoconcurso.com.br", role: "admin" },
    { nome: "Edu Editor", email: "editor@avisoconcurso.com.br", role: "editor" },
    { nome: "Ana Concurseira", email: "ana@exemplo.com", role: "user" },
    { nome: "Bruno Sem Plano", email: "bruno@exemplo.com", role: "user" },
  ];
  const ids: Record<string, string> = {};
  for (const u of usuarios) {
    const [r] = await sql<{ id: string }[]>`
      insert into users (nome, email, senha_hash, role, termos_aceitos_em) values (${u.nome}, ${u.email}, ${senha}, ${u.role}, now())
      on conflict (email) do update set role = excluded.role returning id`;
    ids[u.email] = r.id;
    await sql`insert into user_settings (user_id) values (${r.id}) on conflict do nothing`;
  }
  const ana = ids["ana@exemplo.com"];
  const [temSub] = await sql`select 1 from subscriptions where user_id = ${ana}`;
  if (!temSub) {
    const fim = new Date(Date.now() + TRIAL_DAYS * 86_400_000);
    await sql`insert into subscriptions (user_id, plano, ciclo, status, metodo, trial_ends_at, current_period_end, provider)
              values (${ana}, 'aprovado', 'mensal', 'trial', 'pix_automatico', ${fim}, ${fim}, 'mock')`;
    await sql`update users set telefone = '+5511999990000', whatsapp_optin = true, whatsapp_optin_em = now() where id = ${ana}`;
    await sql`insert into profiles (user_id, nome, escolaridades, areas, ufs, incluir_nacional, salario_min_centavos, palavras_chave)
              values (${ana}, 'Tribunais e INSS', '{medio,superior}', '{tribunais,juridica,administrativa}', '{SP,BA}', true, 500000, '{}')`;
  }
  for (const id of [ids["admin@avisoconcurso.com.br"], ids["editor@avisoconcurso.com.br"]]) {
    await sql`insert into subscriptions (user_id, plano, ciclo, status, current_period_end, provider)
              select ${id}, 'aprovado', 'anual', 'ativa', now() + interval '1 year', 'mock'
              where not exists (select 1 from subscriptions where user_id = ${id})`;
  }

  if (process.env.SEED_EXEMPLOS === "0") return;
  const subj = new Map((await sql<{ id: string; nome: string }[]>`select id, nome from subjects`).map((s) => [s.nome, s.id]));
  const contestIds: string[] = [];
  for (const e of EXEMPLOS) {
    const ano = 2026;
    const dedup = chaveDedup(e.orgao, e.numero, ano);
    const vagas = e.cargos.reduce((s, c) => s + (c.vagas ?? 0), 0) || null;
    const salMax = Math.max(...e.cargos.map((c) => c.salario ?? 0)) || null;
    const [c] = await sql<{ id: string; novo: boolean }[]>`
      insert into contests (slug, dedup_key, orgao, orgao_sigla, esfera, uf, cidade, banca, numero_edital, ano, status, titulo, resumo,
        url_oficial, taxa_centavos, vagas_total, cadastro_reserva, salario_max_centavos, escolaridades, areas, publicado_em, exemplo, edital_texto)
      values (${slugify(e.titulo + "-" + ano)}, ${dedup}, ${e.orgao}, ${e.sigla}, ${e.esfera}, ${e.uf}, ${e.cidade ?? null}, ${e.banca},
        ${e.numero}, ${ano}, ${e.status}, ${e.titulo}, ${e.resumo}, ${e.url}, ${e.taxa ?? null}, ${vagas},
        ${e.cargos.some((x) => x.cr)}, ${salMax}, ${e.escolaridades}, ${e.areas}, ${d(e.publicado)}, true,
        ${e.status === "edital_aberto" ? EDITAL_TEXTO : null})
      on conflict (dedup_key) do update set updated_at = now()
      returning id, (xmax = 0) as novo`;
    contestIds.push(c.id);
    if (!c.novo) continue;
    for (const r of e.cargos) {
      await sql`insert into contest_roles (contest_id, nome, escolaridade, area, vagas, cadastro_reserva, salario_centavos, jornada)
                values (${c.id}, ${r.nome}, ${r.escolaridade}, ${r.area ?? null}, ${r.vagas}, ${!!r.cr}, ${r.salario}, ${r.jornada ?? null})`;
    }
    for (const dt of e.datas) {
      await sql`insert into contest_dates (contest_id, tipo, inicio, fim, descricao, fonte_item, fonte_pagina)
                values (${c.id}, ${dt.tipo}, ${dt.inicio == null ? null : d(dt.inicio)}, ${dt.fim == null ? null : d(dt.fim)},
                        ${dt.descricao ?? null}, ${dt.item ?? null}, ${dt.pagina ?? null})`;
    }
    for (const [nome, q] of e.materias) {
      await sql`insert into contest_subjects (contest_id, subject_id, questoes) values (${c.id}, ${subj.get(nome)!}, ${q})`;
    }
    await sql`insert into acts (contest_id, tipo, confianca, resumo, url_oficial, publicado_em)
              values (${c.id}, ${e.status === "autorizado" ? "autorizacao" : "edital_abertura"}, 0.97, ${e.resumo}, ${e.url}, ${d(e.publicado)})`;
  }
  // Errata de exemplo no TRF 3
  const trf = contestIds[0];
  await sql`insert into contest_versions (contest_id, versao, diff_json, resumo)
            values (${trf}, 2, ${sql.json([{ campo: "prova", antes: d(40), depois: d(47) }])}, 'Retificação nº 1: a data da prova mudou.')
            on conflict do nothing`;

  // Ana acompanha TRF 3, INSS e TJ BA
  const cores = ["#1F3FD1", "#7A3FD1", "#0B7F86"];
  for (const [i, cid] of [contestIds[0], contestIds[1], contestIds[6]].entries()) {
    const [f] = await sql<{ id: string }[]>`
      insert into follows (user_id, contest_id, cor) values (${ana}, ${cid}, ${cores[i]})
      on conflict (user_id, contest_id) do nothing returning id`;
    if (f) {
      for (const [ordem, texto] of CHECKLIST_PADRAO.entries()) {
        await sql`insert into checklist_items (follow_id, texto, ordem, feito) values (${f.id}, ${texto}, ${ordem}, ${ordem === 0 && i === 0})`;
      }
    }
  }
  const [temAviso] = await sql`select 1 from alerts where user_id = ${ana}`;
  if (!temAviso) {
    const avisos = [
      { cid: contestIds[6], tipo: "edital_publicado", titulo: "Saiu edital: TJ BA", corpo: "120 vagas · até R$ 8.900,00 · inscrições até " + d(25).split("-").reverse().join("/") },
      { cid: contestIds[0], tipo: "errata", titulo: "Errata no TRF 3", corpo: "Mudou a data da prova. Sua agenda já foi atualizada." },
      { cid: contestIds[0], tipo: "isencao_acabando", titulo: "Isenção do TRF 3 acaba em 2 dias", corpo: "Peça a isenção da taxa no site da banca." },
    ];
    for (const [i, a] of avisos.entries()) {
      await sql`insert into alerts (user_id, contest_id, tipo, canal, titulo, corpo, url_oficial, dedup_key, status, enviado_em, created_at)
                values (${ana}, ${a.cid}, ${a.tipo}, 'inapp', ${a.titulo}, ${a.corpo}, 'https://www.in.gov.br', ${"seed-" + i}, 'enviado', now() - ${i + " hours"}::interval, now() - ${i + " hours"}::interval)`;
    }
  }
  console.log(`seed ok · ${MATERIAS_CANONICAS.length} matérias · ${FONTES.length} fontes · ${EXEMPLOS.length} concursos de exemplo`);
  console.log("logins (senha aviso1234): admin@avisoconcurso.com.br · editor@avisoconcurso.com.br · ana@exemplo.com (teste Aprovado) · bruno@exemplo.com (sem plano)");
}

main()
  .then(() => sql.end())
  .catch(async (e) => {
    console.error(e);
    await sql.end();
    process.exit(1);
  });
