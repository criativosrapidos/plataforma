// Agentes de IA da agência e assistente da plataforma.
// Os agentes ficam na tabela "agentes" (nome, cargo, missão, fontes que leem, o que entregam, frequência) e são
// configurados no painel. Cada execução lê só as fontes marcadas e deixa RASCUNHOS em "agente_sugestoes":
// nada vai pro cliente sem alguém da agência aprovar.
// Rotas (https://<projeto>.supabase.co/functions/v1/agentes/...):
//   POST /rodar       agência roda um agente agora            { "agente_id": "..." }
//   POST /perguntar   assistente: agência ou cliente pergunta { "pergunta": "...", "cliente_id": "..." (agência, opcional) }
//   POST /agendado    o agendador chama 1 vez por dia (cabeçalho x-cron-secret): roda os diários e, às segundas, os semanais
// Variáveis: ANTHROPIC_API_KEY, CRON_SECRET e, opcional, ASSISTENTE_MODELO e ASSISTENTE_LIMITE_DIA (cliente, padrão 20).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import Anthropic from "npm:@anthropic-ai/sdk@1.3.0";
import { z } from "npm:zod@4";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@1.3.0/helpers/zod";

const env = (k: string, padrao = "") => Deno.env.get(k) ?? padrao;
const FUSO = "America/Sao_Paulo";
const SITE = env("SITE_URL", "https://criativosrapidos.com.br").replace(/\/$/, "");
const db: SupabaseClient = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const claude = new Anthropic({ apiKey: env("ANTHROPIC_API_KEY") });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { ...CORS, "Content-Type": "application/json" } });
class Erro extends Error { constructor(msg: string, public status = 400) { super(msg); } }

// Mesma tabela de planos do site (assets/core.js). Se mudar lá, mude aqui.
const PLANOS = `Planos mensais: Presença R$ 597/mês (10 stories, 9 posts, 6 carrosséis, 3 reels, 2 anúncios; o cliente posta);
Crescimento R$ 797/mês (20 stories, 12 posts, 9 carrosséis, 6 reels, 3 anúncios; a agência posta);
Autoridade R$ 997/mês (30 stories, 15 posts, 12 carrosséis, 9 reels, 4 anúncios; posta + tráfego pago + relatório).
Pacotes: Largada R$ 97 (2 vídeos e 1 arte pra anúncio), Acelera R$ 297 (identidade visual + 1 anúncio), Turbo R$ 497 (identidade completa, landing page e PDFs).`;
const QTD: Record<string, number> = { "Presença": 30, "Crescimento": 50, "Autoridade": 70 };

const REGRAS = `Você é um agente de IA da Criativos Rápidos, agência de marketing e social media para pequenos negócios no Brasil.
Escreva em português do Brasil, simples, direto e simpático, como a agência fala no WhatsApp.
Nunca invente preço, promoção, prazo, depoimento, número ou nome que não esteja nos dados. Se faltar informação, diga o que falta.
Tudo o que você entrega é rascunho: alguém da agência revisa antes de qualquer coisa chegar a um cliente.
Tabela de planos (a única fonte de preços):
${PLANOS}`;

// ---------------------------------------------------------------- quem chama
async function quem(req: Request) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) throw new Erro("Faça login de novo.", 401);
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data.user) throw new Erro("Sessão expirada. Faça login de novo.", 401);
  const { data: p } = await db.from("perfis").select("id, papel, empresa, plano").eq("id", data.user.id).single();
  if (!p) throw new Erro("Perfil não encontrado.", 401);
  return p as { id: string; papel: string; empresa: string; plano: string };
}

function semChave() { if (!env("ANTHROPIC_API_KEY")) throw new Erro("Os agentes ainda não foram ligados (falta a ANTHROPIC_API_KEY no Supabase).", 500); }
function texto(r: Anthropic.Beta.BetaMessage) { return r.content.map((b) => (b.type === "text" ? b.text : "")).join(""); }
function hoje() { return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function diaDaSemana() { return new Intl.DateTimeFormat("en-US", { timeZone: FUSO, weekday: "short" }).format(new Date()); }
const corta = (t: unknown, n = 400) => (typeof t === "string" && t.length > n ? t.slice(0, n) + "…" : t);

// ---------------------------------------------------------------- o que cada fonte entrega pro agente (resumido)
// deno-lint-ignore no-explicit-any
type Linha = any;
async function lerFontes(fontes: string[], clienteId?: string) {
  const h = hoje(), mes = h.slice(0, 8) + "01", ctx: Record<string, unknown> = { hoje: h };
  const doCli = (q: Linha) => (clienteId ? q.eq("cliente_id", clienteId) : q);
  const tem = (f: string) => fontes.includes(f);
  if (tem("clientes") || clienteId) {
    let q = db.from("perfis").select("id, nome, empresa, plano, ajustes_mes, instagram, marca, criado_em").eq("papel", "cliente");
    if (clienteId) q = q.eq("id", clienteId);
    const { data } = await q;
    ctx.clientes = (data ?? []).map((c: Linha) => ({ ...c, conteudos_por_mes_no_plano: QTD[c.plano] ?? null }));
  }
  if (tem("crm") && !clienteId) {
    const { data } = await db.from("leads").select("id, nome, empresa, interesse, origem, status, observacao, proximo_contato, criado_em").not("status", "in", "(fechou,perdido)").order("criado_em", { ascending: false }).limit(40);
    ctx.crm = data;
  }
  if (tem("briefings")) {
    const { data } = await doCli(db.from("briefings").select("cliente_id, empresa, plano, texto, criado_em").order("criado_em", { ascending: false }).limit(clienteId ? 1 : 30));
    ctx.briefings = (data ?? []).map((b: Linha) => ({ ...b, texto: corta(b.texto, 2500) }));
  }
  if (tem("entregas")) {
    const desde = new Date(Date.now() - 45 * 864e5).toISOString();
    const { data } = await doCli(db.from("entregas").select("id, cliente_id, titulo, tipo, status, comentario, legenda, data_postagem, publicado_em, criado_em").gte("criado_em", desde).order("criado_em", { ascending: false }).limit(150));
    ctx.entregas_45_dias = (data ?? []).map((e: Linha) => ({ ...e, legenda: corta(e.legenda, 200) }));
  }
  if (tem("ideias")) {
    const { data } = await doCli(db.from("ideias").select("cliente_id, origem, tipo, titulo, status, criado_em").order("criado_em", { ascending: false }).limit(80));
    ctx.ideias = data;
  }
  if (tem("relatorios")) {
    const desde = new Date(Date.UTC(Number(h.slice(0, 4)), Number(h.slice(5, 7)) - 3, 1)).toISOString().slice(0, 10);
    const { data } = await doCli(db.from("relatorios").select("id, cliente_id, mes, investido, alcance, impressoes, cliques, conversas, seguidores, campanhas, resumo").gte("mes", desde));
    ctx.relatorios_ultimos_meses = data;
  }
  if (tem("financeiro")) {
    const { data } = await doCli(db.from("cobrancas").select("id, cliente_id, descricao, valor, vencimento, status, pago_em").or(`status.eq.aberta,vencimento.gte.${mes}`).order("vencimento").limit(80));
    ctx.cobrancas = data;
    ctx.cobrancas_em_atraso = (data ?? []).filter((c: Linha) => c.status === "aberta" && c.vencimento < h).map((c: Linha) => c.id);
  }
  if (tem("instagram")) {
    const desde = new Date(Date.now() - 35 * 864e5).toISOString().slice(0, 10);
    const { data } = await doCli(db.from("ig_metricas").select("cliente_id, dia, seguidores, publicacoes, posts").gte("dia", desde).order("dia"));
    // por cliente: a primeira e a última coleta do período, com os posts da última
    const por: Record<string, Linha[]> = {};
    (data ?? []).forEach((m: Linha) => (por[m.cliente_id] ??= []).push(m));
    ctx.instagram = Object.entries(por).map(([id, l]) => ({
      cliente_id: id, seguidores_inicio: l[0].seguidores, seguidores_agora: l[l.length - 1].seguidores, de: l[0].dia, ate: l[l.length - 1].dia,
      posts_recentes: (l[l.length - 1].posts ?? []).map((p: Linha) => ({ ...p, legenda: corta(p.legenda, 120) })),
    }));
  }
  if (tem("site") && !clienteId) ctx.site = await lerSite();
  return ctx;
}

// páginas públicas do site, só o que importa pra SEO
async function lerSite() {
  return await Promise.all(["/", "/videos", "/brief"].map(async (p) => {
    try {
      const html = await (await fetch(SITE + p, { headers: { "User-Agent": "CriativosRapidos-Agente-SEO" } })).text();
      const pega = (re: RegExp) => [...html.matchAll(re)].map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()).filter(Boolean);
      return {
        pagina: SITE + p,
        title: pega(/<title[^>]*>([\s\S]*?)<\/title>/gi)[0] ?? null,
        description: (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) ?? [])[1] ?? null,
        h1: pega(/<h1[^>]*>([\s\S]*?)<\/h1>/gi), h2: pega(/<h2[^>]*>([\s\S]*?)<\/h2>/gi).slice(0, 20),
        imagens_sem_alt: (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? []).length,
        texto: corta(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), 3000),
      };
    } catch (e) { return { pagina: SITE + p, erro: (e as Error).message }; }
  }));
}

// ---------------------------------------------------------------- execução de um agente
const TIPOS = ["mensagem_whatsapp", "ideia", "legenda", "comentario_relatorio", "alerta", "tarefa"] as const;
const Saida = z.object({
  resumo: z.string().describe("Uma ou duas frases sobre o que você encontrou"),
  itens: z.array(z.object({
    tipo: z.enum(TIPOS),
    prioridade: z.enum(["alta", "media", "baixa"]),
    titulo: z.string().describe("Título curto do item"),
    texto: z.string().describe("O conteúdo pronto: a mensagem, a legenda, o roteiro da ideia, o comentário, o alerta ou a tarefa"),
    cliente_id: z.string().nullable().describe("id do cliente, exatamente como veio nos dados, ou null"),
    lead_id: z.string().nullable().describe("id do contato do CRM, exatamente como veio nos dados, ou null"),
    entrega_id: z.string().nullable().describe("id da entrega (pra legenda), exatamente como veio nos dados, ou null"),
    relatorio_id: z.string().nullable().describe("id do relatório (pra comentário), exatamente como veio nos dados, ou null"),
    formato: z.enum(["reels", "post", "carrossel", "stories", "anuncio"]).nullable().describe("Só pra ideias"),
  })).describe("Os itens pra agência aprovar; lista vazia se não houver nada a fazer"),
});
const SAIDAS: Record<string, string> = {
  mensagem_whatsapp: "mensagem de WhatsApp pronta pra um contato do CRM (lead_id) ou pra um cliente (cliente_id)",
  ideia: "ideia de conteúdo pra um cliente (cliente_id e formato)",
  legenda: "legenda pronta pra uma entrega sem legenda (entrega_id)",
  comentario_relatorio: "comentário do relatório do mês pro cliente ler (relatorio_id)",
  alerta: "aviso pra agência sobre algo que precisa de atenção",
  tarefa: "tarefa pra alguém da equipe fazer, com o passo a passo",
};

async function rodar(agenteId: string) {
  semChave();
  const { data: a } = await db.from("agentes").select("*").eq("id", agenteId).single();
  if (!a) throw new Erro("Agente não encontrado.", 404);
  const ctx = await lerFontes(a.fontes ?? []);
  const { data: pend } = await db.from("agente_sugestoes").select("titulo, tipo").eq("agente_id", a.id).eq("status", "pendente");
  const saidas = (a.saidas?.length ? a.saidas : ["alerta", "tarefa"]) as string[];
  const r = await claude.beta.messages.create({
    model: a.modelo || "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `${REGRAS}\n\nVocê é "${a.nome}"${a.cargo ? ` (${a.cargo})` : ""}.\nSua função:\n${a.missao}\n\nVocê pode entregar só estes tipos de item:\n${saidas.map((s) => `- ${s}: ${SAIDAS[s] ?? s}`).join("\n")}\nNo máximo 15 itens, os mais importantes primeiro. Não repita itens que já estão esperando aprovação.`,
    output_config: { effort: "medium", format: zodOutputFormat(Saida) },
    messages: [{ role: "user", content: JSON.stringify({ dados: ctx, ja_esperando_aprovacao: pend ?? [] }) }],
  });
  if (r.stop_reason === "refusal" || r.stop_reason === "max_tokens") throw new Erro("O agente não conseguiu terminar (" + r.stop_reason + ").", 502);
  const ok = Saida.safeParse(JSON.parse(texto(r)));
  if (!ok.success) throw new Erro("Resposta fora do formato esperado.", 502);
  // só guarda ids que existem nos dados que o agente recebeu
  const ids = new Set<string>();
  JSON.stringify(ctx, (k, v) => { if (k === "id" || k === "cliente_id") ids.add(String(v)); return v; });
  const val = (x: string | null) => (x && ids.has(x) ? x : null);
  const linhas = ok.data.itens.filter((i) => saidas.includes(i.tipo)).slice(0, 15).map((i) => ({
    agente_id: a.id, tipo: i.tipo, prioridade: i.prioridade, titulo: i.titulo,
    cliente_id: val(i.cliente_id), lead_id: val(i.lead_id), entrega_id: val(i.entrega_id),
    conteudo: { texto: i.texto, formato: i.formato, relatorio_id: val(i.relatorio_id) },
  }));
  if (linhas.length) { const { error } = await db.from("agente_sugestoes").insert(linhas); if (error) throw new Erro(error.message, 500); }
  const resultado = ok.data.resumo + ` (${linhas.length} ${linhas.length === 1 ? "item" : "itens"})`;
  await db.from("agentes").update({ ultima_execucao: new Date().toISOString(), ultimo_resultado: resultado }).eq("id", a.id);
  return { novas: linhas.length, resumo: ok.data.resumo };
}

// ---------------------------------------------------------------- assistente (perguntas livres)
async function perguntar(req: Request) {
  semChave();
  const eu = await quem(req);
  const b = await req.json().catch(() => ({}));
  const pergunta = String(b.pergunta ?? "").trim().slice(0, 1500);
  if (!pergunta) throw new Erro("Escreva a pergunta.");
  const admin = eu.papel === "admin";
  const clienteId = admin ? (b.cliente_id ? String(b.cliente_id) : undefined) : eu.id; // cliente só enxerga o que é dele
  if (!admin) {
    const limite = Number(env("ASSISTENTE_LIMITE_DIA", "20"));
    const { count } = await db.from("assistente_perguntas").select("id", { count: "exact", head: true }).eq("autor_id", eu.id).gte("criado_em", hoje() + "T00:00:00-03:00");
    if ((count ?? 0) >= limite) throw new Erro(`Você chegou ao limite de ${limite} perguntas por hoje. Amanhã libera de novo.`, 429);
  }
  const fontes = admin && !clienteId
    ? ["clientes", "crm", "entregas", "relatorios", "financeiro", "instagram", "ideias"]
    : ["clientes", "briefings", "entregas", "ideias", "relatorios", "instagram", ...(admin ? ["financeiro"] : [])];
  const ctx = await lerFontes(fontes, clienteId);
  const papel = admin
    ? "Você é o assistente interno da agência. Responda perguntas da equipe sobre clientes, vendas, entregas, resultados e dinheiro, com base nos dados."
    : `Você é o assistente do app do cliente ${eu.empresa ?? ""}. Responda dúvidas dele sobre os conteúdos, o plano, os resultados e o Instagram, com base só nos dados dele. Se ele pedir algo que a equipe precisa fazer (ajuste, conteúdo novo), oriente a usar o app (Pedir ajuste, Ideias) ou o WhatsApp da agência.`;
  const r = await claude.beta.messages.create({
    model: env("ASSISTENTE_MODELO", "claude-opus-5-5"),
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `${REGRAS}\n\n${papel}\nResponda curto (até 8 frases ou uma lista curta), sem markdown pesado.`,
    output_config: { effort: "low" },
    messages: [{ role: "user", content: `Dados:\n${JSON.stringify(ctx)}\n\nPergunta: ${pergunta}` }],
  });
  const resposta = r.stop_reason === "refusal" ? "Não consigo responder essa pergunta." : texto(r).trim();
  await db.from("assistente_perguntas").insert({ autor_id: eu.id, cliente_id: clienteId ?? null, pergunta, resposta, tokens_entrada: r.usage.input_tokens, tokens_saida: r.usage.output_tokens });
  return json({ resposta });
}

// ---------------------------------------------------------------- roteador
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const rota = new URL(req.url).pathname.replace(/^.*\/agentes/, "") || "/";
  try {
    if (req.method !== "POST") throw new Erro("Método não permitido.", 405);
    if (rota === "/perguntar") return await perguntar(req);
    if (rota === "/rodar") {
      const eu = await quem(req);
      if (eu.papel !== "admin") throw new Erro("Só a agência pode rodar os agentes.", 403);
      const b = await req.json().catch(() => ({}));
      return json(await rodar(String(b.agente_id)));
    }
    if (rota === "/agendado") {
      if (!env("CRON_SECRET") || req.headers.get("x-cron-secret") !== env("CRON_SECRET")) throw new Erro("Não autorizado.", 401);
      const freq = diaDaSemana() === "Mon" ? ["diaria", "semanal"] : ["diaria"];
      const { data: lista } = await db.from("agentes").select("id, nome").eq("ativo", true).in("frequencia", freq);
      const res = await Promise.allSettled((lista ?? []).map((a) => rodar(a.id)));
      return json({ resultado: Object.fromEntries((lista ?? []).map((a, i) => [a.nome, res[i].status === "fulfilled" ? (res[i] as PromiseFulfilledResult<{ novas: number }>).value.novas : "erro: " + (res[i] as PromiseRejectedResult).reason?.message])) });
    }
    throw new Erro("Rota não encontrada.", 404);
  } catch (e) {
    const err = e as Erro;
    if (!(err instanceof Erro)) console.error(err);
    return json({ error: err.message || "Erro inesperado." }, err.status || 500);
  }
});
