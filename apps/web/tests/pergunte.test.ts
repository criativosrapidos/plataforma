import "./helpers/ambiente";
import { criarUsuario, fecharBanco, prepararBanco } from "./helpers/banco";
import { after, before, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { sql } from "@/lib/db";

// A rota lê a sessão de next/headers: simulamos só o header Authorization (como o app faz).
let tokenAtual: string | null = null;
mock.module("next/headers", {
  namedExports: {
    headers: async () => new Headers(tokenAtual ? { authorization: `Bearer ${tokenAtual}` } : {}),
    cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
  },
});

const EDITAL = `EDITAL Nº 1/2026
[página 6]
4. DAS INSCRIÇÕES
4.1 As inscrições serão realizadas exclusivamente pela internet, no site da banca.

[página 7]
5. DA ISENÇÃO DA TAXA
5.1 Terá direito à isenção da taxa o candidato inscrito no CadÚnico e o doador de medula óssea cadastrado no REDOME.

[página 12]
9.5 O candidato deverá comparecer com caneta esferográfica de tinta preta e documento oficial com foto.`;

type Rota = typeof import("@/app/api/v1/concursos/[id]/perguntas/route");
let rota: Rota;
let ana: string, carla: string, contestId: string;
let tokenAna: string, tokenCarla: string;

const DIA = 86_400_000;

async function perguntar(pergunta: string) {
  const r = await rota.POST(
    new Request(`https://avisoconcurso.com.br/api/v1/concursos/${contestId}/perguntas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pergunta }),
    }),
    { params: Promise.resolve({ id: contestId }) },
  );
  return { status: r.status, corpo: (await r.json()) as Record<string, unknown> };
}

before(async () => {
  await prepararBanco();
  // Assinaturas em relação à hora real: a rota usa o relógio do servidor.
  ana = await criarUsuario({ nome: "Ana", email: "ana@t.com", plano: "aprovado", status: "trial", trialEndsAt: new Date(Date.now() + 3 * DIA) });
  carla = await criarUsuario({ nome: "Carla", email: "carla@t.com", plano: "aviso", status: "ativa", periodEnd: new Date(Date.now() + 30 * DIA) });
  const [c] = await sql<{ id: string }[]>`
    insert into contests (slug, dedup_key, orgao, esfera, status, titulo, url_oficial, edital_texto)
    values ('trf-teste', 'trf|1/2026|2026', 'Tribunal Regional Federal da 3ª Região', 'federal', 'edital_aberto', 'TRF 3 · Técnico',
            'https://www.trf3.jus.br/concursos', ${EDITAL}) returning id`;
  contestId = c.id;
  const { criarSessao } = await import("@/lib/auth/session");
  tokenAna = (await criarSessao(ana, "app")).token;
  tokenCarla = (await criarSessao(carla, "app")).token;
  rota = await import("@/app/api/v1/concursos/[id]/perguntas/route");
});

after(fecharBanco);

describe("Pergunte ao edital (rota /api/v1/concursos/:id/perguntas)", () => {
  it("responde com base no edital, citando item e página", async () => {
    tokenAtual = tokenAna;
    const r = await perguntar("Quem tem direito à isenção da taxa?");
    assert.equal(r.status, 201);
    assert.equal(r.corpo.encontrado, true);
    assert.deepEqual((r.corpo.citacoes as { item: string; pagina: number }[])[0].item, "5.1");
    assert.deepEqual((r.corpo.citacoes as { item: string; pagina: number }[])[0].pagina, 7);
    assert.equal(r.corpo.restantes, 29);
  });

  it("sem resposta no edital, diz que não encontrou", async () => {
    tokenAtual = tokenAna;
    const r = await perguntar("Qual a cor do uniforme exigido no dia?");
    assert.equal(r.status, 201);
    assert.equal(r.corpo.encontrado, false);
    assert.match(r.corpo.resposta as string, /^Não encontrei essa informação no edital/);
    assert.deepEqual(r.corpo.citacoes, []);
  });

  it("respeita 30 perguntas por mês", async () => {
    tokenAtual = tokenAna;
    // 2 já feitas + 28 = 30 no mês
    for (let i = 0; i < 28; i++) {
      await sql`insert into questions (user_id, contest_id, pergunta, resposta, encontrado) values (${ana}, ${contestId}, ${`p${i}`}, 'r', true)`;
    }
    const r = await perguntar("Qual o horário da prova?");
    assert.equal(r.status, 429);
    assert.equal((r.corpo.erro as { codigo: string }).codigo, "limite_mes");
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from questions where user_id = ${ana}`;
    assert.equal(n, 30, "a 31ª não foi registrada");
  });

  it("só no plano Aprovado e só com login", async () => {
    tokenAtual = tokenCarla;
    assert.equal((await perguntar("Quem tem direito à isenção?")).status, 403);
    tokenAtual = null;
    assert.equal((await perguntar("Quem tem direito à isenção?")).status, 401);
  });
});
