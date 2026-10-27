// Função do Supabase que puxa os números dos anúncios do Meta (Facebook e Instagram Ads) pro relatório de cada cliente.
// Usa um token da agência (usuário do sistema no Gerenciador de Negócios com acesso às contas de anúncio dos clientes).
// Rotas (todas em https://<projeto>.supabase.co/functions/v1/trafego/...):
//   POST /contas        agência lista as contas de anúncio que o token enxerga
//   POST /sincronizar   agência atualiza o mês { "mes": "AAAA-MM-01", "cliente_id": "..." (opcional: sem ele, todos) }
//   POST /agendado      o agendador chama 1 vez por dia (cabeçalho x-cron-secret): atualiza o mês atual
//                       e, nos 3 primeiros dias do mês, fecha o mês anterior
// Variáveis: META_ADS_TOKEN, CRON_SECRET e, opcional, META_API_VERSION (ex.: "v23.0").
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o Supabase já fornece.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

const env = (k: string, padrao = "") => Deno.env.get(k) ?? padrao;
const GRAPH = "https://graph.facebook.com/" + env("META_API_VERSION", "v23.0");
const TOKEN = env("META_ADS_TOKEN");
const FUSO = "America/Sao_Paulo";
// o que conta como "conversa": mensagens iniciadas (WhatsApp, Direct, Messenger) e cadastros
const CONVERSAS = ["onsite_conversion.messaging_conversation_started_7d", "lead", "onsite_conversion.lead_grouped"];

const db: SupabaseClient = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { ...CORS, "Content-Type": "application/json" } });

class Erro extends Error { constructor(msg: string, public status = 400) { super(msg); } }

async function soAgencia(req: Request) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) throw new Erro("Faça login de novo.", 401);
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data.user) throw new Erro("Sessão expirada. Faça login de novo.", 401);
  const { data: p } = await db.from("perfis").select("papel").eq("id", data.user.id).single();
  if (p?.papel !== "admin") throw new Erro("Só a agência pode fazer isso.", 403);
}

async function meta(caminho: string, params: Record<string, string>) {
  if (!TOKEN) throw new Erro("A conexão com o Meta Ads ainda não foi configurada (falta o META_ADS_TOKEN).", 500);
  const q = new URLSearchParams({ ...params, access_token: TOKEN });
  const r = await fetch(`${GRAPH}/${caminho}?${q}`);
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Erro(String(d.error?.error_user_msg || d.error?.message || `Meta respondeu ${r.status}`), 502);
  return d;
}

// "123", "act_123" ou o link do Gerenciador viram "act_123"
function conta(id: string) {
  const n = String(id || "").match(/\d{5,}/);
  return n ? "act_" + n[0] : "";
}

function hojeBrasilia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
// primeiro e último dia do mês, sem passar de hoje
function periodo(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  if (!a || !m) throw new Erro("Mês inválido.");
  const ini = `${a}-${String(m).padStart(2, "0")}-01`;
  const ultimo = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
  const hoje = hojeBrasilia();
  return { ini, fim: ultimo < hoje ? ultimo : hoje, futuro: ini > hoje };
}

function soma(lista: { action_type: string; value: string }[] | undefined, tipos: string[]) {
  return (lista ?? []).filter((a) => tipos.includes(a.action_type)).reduce((t, a) => t + Number(a.value || 0), 0);
}

async function sincronizarCliente(c: { id: string; meta_ad_account: string }, mes: string) {
  const p = periodo(mes);
  if (p.futuro) return "mês ainda não começou";
  const act = conta(c.meta_ad_account);
  if (!act) throw new Erro("Conta de anúncio inválida.");
  const time_range = JSON.stringify({ since: p.ini, until: p.fim });
  const campos = "spend,reach,impressions,clicks,inline_link_clicks,actions";
  const [geral, camp] = await Promise.all([
    meta(`${act}/insights`, { level: "account", fields: campos, time_range }),
    meta(`${act}/insights`, { level: "campaign", fields: "campaign_name," + campos, time_range, limit: "50" }),
  ]);
  const g = geral.data?.[0] ?? {};
  const campanhas = (camp.data ?? [])
    .map((x: Record<string, unknown>) => ({
      nome: x.campaign_name,
      investido: Number(x.spend || 0),
      alcance: Number(x.reach || 0),
      cliques: Number(x.inline_link_clicks || x.clicks || 0),
      conversas: soma(x.actions as never, CONVERSAS),
    }))
    .sort((a: { investido: number }, b: { investido: number }) => b.investido - a.investido)
    .slice(0, 10);
  const linha = {
    cliente_id: c.id,
    mes: p.ini,
    investido: Number(g.spend || 0),
    alcance: Number(g.reach || 0),
    impressoes: Number(g.impressions || 0),
    cliques: Number(g.inline_link_clicks || g.clicks || 0),
    conversas: soma(g.actions, CONVERSAS),
    campanhas,
    origem: "meta",
    atualizado_em: new Date().toISOString(),
  };
  // upsert só com esses campos: o comentário, o link e os seguidores lançados à mão continuam
  const { error } = await db.from("relatorios").upsert(linha, { onConflict: "cliente_id,mes" });
  if (error) throw new Erro(error.message, 500);
  return "ok";
}

async function sincronizar(mes: string, clienteId?: string) {
  let q = db.from("perfis").select("id, empresa, meta_ad_account").not("meta_ad_account", "is", null).neq("meta_ad_account", "");
  if (clienteId) q = q.eq("id", clienteId);
  const { data: lista, error } = await q;
  if (error) throw new Erro(error.message, 500);
  if (clienteId && !lista?.length) throw new Erro("Esse cliente ainda não tem conta de anúncio ligada.");
  const resultado: Record<string, string> = {};
  for (const c of lista ?? []) {
    try { resultado[c.empresa || c.id] = await sincronizarCliente(c, mes); }
    catch (e) { resultado[c.empresa || c.id] = "erro: " + (e as Error).message; }
  }
  return resultado;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const rota = new URL(req.url).pathname.replace(/^.*\/trafego/, "") || "/";
  try {
    if (req.method !== "POST") throw new Erro("Método não permitido.", 405);
    if (rota === "/contas") {
      await soAgencia(req);
      const d = await meta("me/adaccounts", { fields: "name,account_id,account_status,currency", limit: "200" });
      return json({ contas: (d.data ?? []).map((x: Record<string, unknown>) => ({ id: "act_" + x.account_id, nome: x.name, ativa: x.account_status === 1, moeda: x.currency })) });
    }
    if (rota === "/sincronizar") {
      await soAgencia(req);
      const b = await req.json().catch(() => ({}));
      return json({ resultado: await sincronizar(String(b.mes || hojeBrasilia().slice(0, 8) + "01"), b.cliente_id ? String(b.cliente_id) : undefined) });
    }
    if (rota === "/agendado") {
      if (!env("CRON_SECRET") || req.headers.get("x-cron-secret") !== env("CRON_SECRET")) throw new Erro("Não autorizado.", 401);
      const hoje = hojeBrasilia(), resultado: Record<string, unknown> = {};
      if (Number(hoje.slice(8, 10)) <= 3) {
        const d = new Date(Date.UTC(Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7)) - 2, 1)).toISOString().slice(0, 10);
        resultado[d] = await sincronizar(d);
      }
      resultado[hoje.slice(0, 8) + "01"] = await sincronizar(hoje.slice(0, 8) + "01");
      return json({ resultado });
    }
    throw new Erro("Rota não encontrada.", 404);
  } catch (e) {
    const err = e as Erro;
    if (!(err instanceof Erro)) console.error(err);
    return json({ error: err.message || "Erro inesperado." }, err.status || 500);
  }
});
