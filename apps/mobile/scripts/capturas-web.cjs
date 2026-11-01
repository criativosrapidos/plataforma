// Verificação de ponta a ponta no app web (Expo web) contra a API real, com capturas de tela.
// Pré-requisitos: API em http://localhost:3004 com o banco recém-semeado (apps/web: npm run db:reset)
// e o app em http://localhost:8081 (npx expo start --web --port 8081).
// Uso: node scripts/capturas-web.cjs   (precisa do Playwright: npm i -g playwright && npx playwright install chromium)
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const APP = process.env.APP_URL ?? "http://localhost:8081";
const API = process.env.API_URL ?? "http://localhost:3004";
const SAIDA = path.resolve(__dirname, "../../../docs/screenshots/app");

async function api(metodo, caminho, token, corpo) {
  const r = await fetch(`${API}/api/v1${caminho}`, {
    method: metodo,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return r.json();
}
const entrarApi = async (email, senha) => (await api("POST", "/auth/login", null, { email, senha, cliente: "app" })).token;

async function novaPagina(navegador, erros) {
  const ctx = await navegador.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && erros.push(m.text().slice(0, 300)));
  p.on("pageerror", (e) => erros.push(e.message));
  return p;
}

async function foto(p, nome) {
  await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(SAIDA, `${nome}.png`) });
  console.log("  captura", nome);
}

async function passo(nome, f) {
  process.stdout.write(`• ${nome}\n`);
  await f();
}

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const navegador = await chromium.launch();
  const erros = [];

  // ---------------- Ana (teste do Aprovado, acompanha 3 concursos) ----------------
  const tokenAna = await entrarApi("ana@exemplo.com", "aviso1234");
  const acomp = await api("GET", "/acompanhando", tokenAna);
  const porSigla = (s) => acomp.find((a) => a.concurso.orgao_sigla === s);
  const trf = porSigla("TRF 3");
  const inss = porSigla("INSS");
  const tjba = porSigla("TJ BA");
  assert.ok(trf && inss && tjba, "seed: Ana deve acompanhar TRF 3, INSS e TJ BA");

  const p = await novaPagina(navegador, erros);
  await passo("Boas-vindas e login da Ana", async () => {
    await p.goto(APP, { waitUntil: "networkidle" });
    await p.getByTestId("boas-vindas-continuar").waitFor();
    await foto(p, "01-boas-vindas");
    await p.getByTestId("ir-entrar").click();
    await p.getByTestId("campo-email").fill("ana@exemplo.com");
    await p.getByTestId("campo-senha").fill("aviso1234");
    await p.getByTestId("botao-entrar").click();
    await p.getByTestId("tela-hoje").waitFor();
    await p.getByTestId("hero-prova").waitFor();
    await foto(p, "02-hoje");
  });

  await passo("Agenda: esconder o INSS pelo filtro", async () => {
    await p.getByTestId("aba-agenda").click();
    await p.getByTestId("tela-agenda").waitFor();
    await p.getByText("Isenção · INSS").first().waitFor();
    await p.getByTestId(`filtro-${inss.concurso.slug}`).click();
    await p.waitForTimeout(600);
    assert.equal(await p.getByTestId("tela-agenda").getByText("Isenção · INSS").count(), 0, "INSS deveria sumir da agenda");
    await foto(p, "03-agenda-filtro");
  });

  await passo("Matérias: desligar o TJ BA (PATCH nas_materias)", async () => {
    await p.getByTestId("aba-materias").click();
    await p.getByTestId("tela-materias").waitFor();
    await p.getByTestId(`mat-filtro-${tjba.contest_id}`).click();
    await p.waitForTimeout(1500);
    const m = await api("GET", "/materias", tokenAna);
    assert.equal(m.concursos.find((c) => c.contest_id === tjba.contest_id).ativo, false, "TJ BA deveria estar desligado nas matérias");
    assert.ok(m.materias.every((x) => !x.concursos.includes(tjba.contest_id)), "matérias recalculadas sem o TJ BA");
    await foto(p, "04-materias");
  });

  await passo("Concursos acompanhados", async () => {
    await p.getByTestId("aba-concursos").click();
    await p.getByTestId("tela-concursos").waitFor();
    await foto(p, "05-concursos");
  });

  await passo("Detalhe do TRF 3: marcar item do checklist", async () => {
    await p.getByLabel(`Abrir ${trf.concurso.titulo}`).click();
    await p.getByTestId("tela-concurso").waitFor();
    const lista = p.getByTestId("checklist");
    await lista.waitFor();
    const item = lista.getByTestId("check-1");
    await item.scrollIntoViewIfNeeded();
    await item.click();
    await p.waitForTimeout(1200);
    const depois = await api("GET", "/acompanhando", tokenAna);
    const feito = depois.find((a) => a.contest_id === trf.contest_id).checklist.find((i) => i.ordem === 1).feito;
    assert.equal(feito, true, "item 'Fazer a inscrição' deveria estar marcado");
    await lista.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await foto(p, "06-detalhe-checklist");
  });

  await passo("Pergunte ao edital", async () => {
    await p.getByTestId("abrir-pergunte").scrollIntoViewIfNeeded();
    await p.getByTestId("abrir-pergunte").click();
    await p.getByTestId("sugestao-0").click();
    await p.getByText("Fonte:").first().waitFor({ timeout: 15000 });
    const perguntas = await api("GET", `/concursos/${trf.contest_id}/perguntas`, tokenAna);
    assert.ok(perguntas.length >= 1, "pergunta registrada");
    assert.ok(perguntas[perguntas.length - 1].citacoes.length >= 1, "resposta com citação");
    await foto(p, "07-pergunte");
  });

  await passo("Ajustes: antecedência do lembrete para 5 dias", async () => {
    await p.goto(`${APP}/ajustes`, { waitUntil: "networkidle" });
    await p.getByTestId("tela-ajustes").waitFor();
    await p.getByTestId("seg-5").click();
    await p.waitForTimeout(1200);
    const me = await api("GET", "/me", tokenAna);
    assert.equal(me.ajustes.antecedencia_dias, 5, "antecedência salva");
    await foto(p, "08-ajustes");
  });

  // ---------------- Bruno (sem plano) ----------------
  const b = await novaPagina(navegador, erros);
  await passo("Bruno cai no paywall e começa o teste", async () => {
    await b.goto(`${APP}/entrar`, { waitUntil: "networkidle" });
    await b.getByTestId("campo-email").fill("bruno@exemplo.com");
    await b.getByTestId("campo-senha").fill("aviso1234");
    await b.getByTestId("botao-entrar").click();
    await b.getByTestId("comecar-teste").waitFor();
    assert.match(b.url(), /\/planos$/);
    await b.getByTestId("plano-aprovado").click();
    await foto(b, "09-paywall");
    await b.getByTestId("comecar-teste").click();
    await b.getByTestId("assistente-continuar").waitFor();
    const me = await api("GET", "/me", await entrarApi("bruno@exemplo.com", "aviso1234"));
    assert.equal(me.acesso.liberado, true);
    assert.equal(me.acesso.emTeste, true);
    assert.equal(me.acesso.plano, "aprovado");
    await b.getByTestId("pular-perfil").click();
    await b.getByTestId("tela-hoje").waitFor();
  });

  // ---------------- Pessoa nova pelo onboarding completo ----------------
  const n = await novaPagina(navegador, erros);
  const email = `nova${Date.now()}@exemplo.com`;
  await passo(`Onboarding completo (${email})`, async () => {
    await n.goto(APP, { waitUntil: "networkidle" });
    for (let i = 0; i < 3; i++) await n.getByTestId("boas-vindas-continuar").click();
    await n.getByTestId("campo-nome").fill("Carla Nova");
    await n.getByTestId("campo-email").fill(email);
    await n.getByTestId("campo-senha").fill("senha12345");
    await n.getByTestId("aceito-termos").click();
    await n.getByTestId("botao-criar-conta").click();
    await n.getByTestId("esc-medio").click();
    await n.getByTestId("esc-superior").click();
    await n.getByTestId("assistente-continuar").click();
    await n.getByTestId("area-tribunais").click();
    await n.getByTestId("area-administrativa").click();
    await n.getByTestId("assistente-continuar").click();
    await n.getByTestId("uf-SP").click();
    await n.getByTestId("uf-PR").click();
    await foto(n, "10-assistente");
    await n.getByTestId("assistente-continuar").click();
    await n.getByTestId("sal-300000").click();
    await n.getByTestId("assistente-continuar").click();
    await n.getByTestId("assistente-continuar").click();
    await n.getByTestId("comecar-teste").waitFor();
    await n.getByTestId("comecar-teste").click();
    await n.getByTestId("tela-hoje").waitFor();
    const token = await entrarApi(email, "senha12345");
    const me = await api("GET", "/me", token);
    assert.equal(me.contagens.perfis, 1, "perfil criado no assistente");
    assert.equal(me.acesso.liberado, true, "teste ativo");
    const perfis = await api("GET", "/perfis", token);
    assert.deepEqual([...perfis[0].ufs].sort(), ["PR", "SP"]);
    assert.equal(perfis[0].salario_min_centavos, 300000);
  });

  await navegador.close();
  const relevantes = erros.filter((e) => !/DevTools|push token/i.test(e));
  if (relevantes.length) {
    console.log("\nErros no console:\n" + relevantes.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("\nTudo certo: fluxos verificados, sem erros no console.");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
