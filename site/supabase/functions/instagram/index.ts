// Função do Supabase que conecta o Instagram do cliente e publica os conteúdos aprovados.
// Rotas (todas em https://<projeto>.supabase.co/functions/v1/instagram/...):
//   POST /link          cliente logado pede o endereço de login do Instagram
//   GET  /callback      o Instagram volta pra cá depois que o cliente autoriza
//   POST /desconectar   cliente logado remove a conexão
//   POST /publicar      agência publica uma entrega agora  { "entrega_id": "..." }
//   POST /agendados     o agendador chama a cada 10 min (cabeçalho x-cron-secret)
// Variáveis: IG_APP_ID, IG_APP_SECRET, SITE_URL, CRON_SECRET e, opcional, IG_API_VERSION (ex.: "v23.0").
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o Supabase já fornece.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

const env = (k: string, padrao = "") => Deno.env.get(k) ?? padrao;
const SUPABASE_URL = env("SUPABASE_URL");
const SITE_URL = env("SITE_URL", "https://criativosrapidos.com.br").replace(/\/$/, "");
const IG_APP_ID = env("IG_APP_ID");
const IG_APP_SECRET = env("IG_APP_SECRET");
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/instagram/callback`;
const VERSAO = env("IG_API_VERSION");
const GRAPH = "https://graph.instagram.com" + (VERSAO ? "/" + VERSAO : "");
const ESCOPOS = "instagram_business_basic,instagram_business_content_publish";
const FUSO = "America/Sao_Paulo";
const BUCKET = "entregas";

const db: SupabaseClient = createClient(SUPABASE_URL, env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const volta = (q: string) => Response.redirect(`${SITE_URL}/app?${q}#conta`, 302);

class Erro extends Error { constructor(msg: string, public status = 400) { super(msg); } }

// ---------------------------------------------------------------- quem está chamando
async function usuario(req: Request) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) throw new Erro("Faça login de novo.", 401);
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data.user) throw new Erro("Sessão expirada. Faça login de novo.", 401);
  const { data: p } = await db.from("perfis").select("id, papel").eq("id", data.user.id).single();
  if (!p) throw new Erro("Perfil não encontrado.", 401);
  return p as { id: string; papel: string };
}

// ---------------------------------------------------------------- chamadas à API do Instagram
async function ig(caminho: string, params: Record<string, string>, metodo: "GET" | "POST" = "GET") {
  const corpo = new URLSearchParams(params);
  const url = caminho.startsWith("http") ? caminho : `${GRAPH}/${caminho}`;
  const r = metodo === "GET" ? await fetch(`${url}?${corpo}`) : await fetch(url, { method: "POST", body: corpo });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) {
    const m = d.error?.error_user_msg || d.error?.message || d.error_message || `Instagram respondeu ${r.status}`;
    throw new Erro(String(m), 502);
  }
  return d;
}

// ---------------------------------------------------------------- conexão
async function link(req: Request) {
  const eu = await usuario(req);
  if (!IG_APP_ID) throw new Erro("O app do Instagram ainda não foi configurado.", 500);
  const nonce = crypto.randomUUID();
  await db.from("instagram_estados").delete().lt("criado_em", new Date(Date.now() - 3600e3).toISOString());
  const { error } = await db.from("instagram_estados").insert({ nonce, cliente_id: eu.id });
  if (error) throw new Erro(error.message, 500);
  const q = new URLSearchParams({ client_id: IG_APP_ID, redirect_uri: REDIRECT_URI, response_type: "code", scope: ESCOPOS, state: nonce });
  return json({ url: `https://www.instagram.com/oauth/authorize?${q}` });
}

async function callback(url: URL) {
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  if (!code || !state) return volta("ig=cancelado");
  const { data: est } = await db.from("instagram_estados").select("*").eq("nonce", state).maybeSingle();
  await db.from("instagram_estados").delete().eq("nonce", state);
  if (!est || Date.now() - new Date(est.criado_em).getTime() > 3600e3) return volta("ig=expirado");
  try {
    // código -> token curto -> token de 60 dias
    const resp = await ig("https://api.instagram.com/oauth/access_token", {
      client_id: IG_APP_ID, client_secret: IG_APP_SECRET, grant_type: "authorization_code", redirect_uri: REDIRECT_URI, code: code.replace(/#_$/, ""),
    }, "POST");
    const curto = resp.data?.[0] ?? resp; // a API devolve { data: [ {...} ] } ou o objeto direto
    const longo = await ig("access_token", { grant_type: "ig_exchange_token", client_secret: IG_APP_SECRET, access_token: curto.access_token });
    const me = await ig("me", { fields: "user_id,username", access_token: longo.access_token });
    await db.from("instagram_contas").upsert({
      cliente_id: est.cliente_id, ig_user_id: String(me.user_id ?? curto.user_id), username: me.username,
      token: longo.access_token, expira_em: new Date(Date.now() + (longo.expires_in ?? 5184000) * 1000).toISOString(), conectado_em: new Date().toISOString(),
    });
    await db.from("perfis").update({ instagram: me.username }).eq("id", est.cliente_id);
    return volta("ig=ok");
  } catch (e) {
    console.error("callback", e);
    return volta("ig=erro");
  }
}

async function desconectar(req: Request) {
  const eu = await usuario(req);
  await db.from("instagram_contas").delete().eq("cliente_id", eu.id);
  await db.from("perfis").update({ instagram: null }).eq("id", eu.id);
  return json({ ok: true });
}

// ---------------------------------------------------------------- publicação
const ehVideo = (nome: string) => /\.(mp4|mov|m4v)$/i.test(nome || "");
const ehJpeg = (nome: string) => /\.jpe?g$/i.test(nome || "");

async function urlPublica(path: string) {
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) throw new Erro("Não consegui ler o arquivo no Storage.", 500);
  return data.signedUrl;
}

async function esperarContainer(id: string, token: string, limiteMs: number) {
  const fim = Date.now() + limiteMs;
  while (Date.now() < fim) {
    const s = await ig(id, { fields: "status_code,status", access_token: token });
    if (s.status_code === "FINISHED") return true;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Erro("O Instagram não aceitou o arquivo: " + (s.status || s.status_code));
    await new Promise((r) => setTimeout(r, 4000));
  }
  return false;
}

// Publica uma entrega. Devolve "publicado", "processando" (vídeo ainda subindo: termina na próxima rodada) ou lança erro.
async function publicar(entregaId: string): Promise<string> {
  const { data: e } = await db.from("entregas").select("*").eq("id", entregaId).single();
  if (!e) throw new Erro("Entrega não encontrada.", 404);
  if (e.publicado_em) return "publicado";
  const { data: conta } = await db.from("instagram_contas").select("*").eq("cliente_id", e.cliente_id).maybeSingle();
  if (!conta) throw new Erro("Esse cliente ainda não conectou o Instagram.");
  const token = conta.token;

  try {
    let criacao = e.ig_container as string | null;
    if (!criacao) {
      if (!e.arquivo_path) throw new Erro("Pra postar sozinho, envie o arquivo pelo painel (link do Drive não serve).");
      const nomes = [e.arquivo_nome || e.arquivo_path, ...((e.extras ?? []) as string[])];
      const caminhos = [e.arquivo_path, ...((e.extras ?? []) as string[])];
      const story = e.tipo === "stories";
      const legenda = story ? undefined : (e.legenda ?? "").slice(0, 2200);

      if (caminhos.length > 1 && !story) {
        // carrossel: um container por imagem/vídeo e depois o container do carrossel
        const filhos: string[] = [];
        for (let i = 0; i < caminhos.length && i < 10; i++) {
          const url = await urlPublica(caminhos[i]);
          const video = ehVideo(nomes[i] || caminhos[i]);
          if (!video && !ehJpeg(nomes[i] || caminhos[i])) throw new Erro("As imagens precisam ser JPG pra postar no Instagram.");
          const c = await ig(`me/media`, video ? { media_type: "VIDEO", video_url: url, is_carousel_item: "true", access_token: token } : { image_url: url, is_carousel_item: "true", access_token: token }, "POST");
          if (video) await esperarContainer(c.id, token, 60000);
          filhos.push(c.id);
        }
        const car = await ig(`me/media`, { media_type: "CAROUSEL", children: filhos.join(","), caption: legenda ?? "", access_token: token }, "POST");
        criacao = car.id;
      } else {
        const url = await urlPublica(e.arquivo_path);
        const video = ehVideo(e.arquivo_nome || e.arquivo_path);
        if (!video && !ehJpeg(e.arquivo_nome || e.arquivo_path)) throw new Erro("A imagem precisa ser JPG pra postar no Instagram.");
        const p: Record<string, string> = { access_token: token };
        if (video) { p.media_type = story ? "STORIES" : "REELS"; p.video_url = url; }
        else { p.image_url = url; if (story) p.media_type = "STORIES"; }
        if (legenda) p.caption = legenda;
        const c = await ig(`me/media`, p, "POST");
        criacao = c.id;
      }
      await db.from("entregas").update({ ig_container: criacao, publicacao_erro: null }).eq("id", e.id);
    }

    const pronto = await esperarContainer(criacao!, token, 90000);
    if (!pronto) return "processando";
    const pub = await ig(`me/media_publish`, { creation_id: criacao!, access_token: token }, "POST");
    let link: string | null = null;
    try { link = (await ig(pub.id, { fields: "permalink", access_token: token })).permalink ?? null; } catch (_) { /* link é só um extra */ }
    await db.from("entregas").update({ publicado_em: new Date().toISOString(), publicado_link: link, publicacao_erro: null, ig_container: null }).eq("id", e.id);
    return "publicado";
  } catch (err) {
    // para de tentar sozinho até a agência mandar de novo
    await db.from("entregas").update({ publicacao_erro: (err as Error).message, publicar: false, ig_container: null }).eq("id", e.id);
    throw err;
  }
}

// data e hora de agora em Brasília, no formato "AAAA-MM-DD" e "HH:MM"
function agoraBrasilia() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}

async function agendados() {
  const agora = agoraBrasilia();
  const { data: lista } = await db.from("entregas").select("id, data_postagem, hora_postagem, cliente_id")
    .eq("status", "aprovado").eq("publicar", true).is("publicado_em", null).not("data_postagem", "is", null).lte("data_postagem", agora.data)
    .order("data_postagem").limit(25);
  const { data: contas } = await db.from("instagram_contas").select("cliente_id, token, expira_em");
  const conectados = new Set((contas ?? []).map((c) => c.cliente_id));
  const vencidas = (lista ?? []).filter((e) => conectados.has(e.cliente_id) && (e.data_postagem < agora.data || String(e.hora_postagem ?? "10:00").slice(0, 5) <= agora.hora));
  const resultado: Record<string, string> = {};
  for (const e of vencidas.slice(0, 6)) {
    try { resultado[e.id] = await publicar(e.id); } catch (err) { resultado[e.id] = "erro: " + (err as Error).message; }
  }
  // renova tokens que vencem em menos de 10 dias
  for (const c of contas ?? []) {
    if (c.expira_em && new Date(c.expira_em).getTime() - Date.now() < 10 * 864e5) {
      try {
        const r = await ig("refresh_access_token", { grant_type: "ig_refresh_token", access_token: c.token });
        await db.from("instagram_contas").update({ token: r.access_token, expira_em: new Date(Date.now() + r.expires_in * 1000).toISOString() }).eq("cliente_id", c.cliente_id);
      } catch (err) { console.error("renovar token", c.cliente_id, err); }
    }
  }
  return json({ verificados: vencidas.length, resultado });
}

// ---------------------------------------------------------------- roteador
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const rota = url.pathname.replace(/^.*\/instagram/, "") || "/";
  try {
    if (rota === "/callback" && req.method === "GET") return await callback(url);
    if (req.method !== "POST") throw new Erro("Método não permitido.", 405);
    if (rota === "/link") return await link(req);
    if (rota === "/desconectar") return await desconectar(req);
    if (rota === "/publicar") {
      const eu = await usuario(req);
      if (eu.papel !== "admin") throw new Erro("Só a agência pode publicar.", 403);
      const { entrega_id } = await req.json();
      return json({ resultado: await publicar(String(entrega_id)) });
    }
    if (rota === "/agendados") {
      if (!env("CRON_SECRET") || req.headers.get("x-cron-secret") !== env("CRON_SECRET")) throw new Erro("Não autorizado.", 401);
      return await agendados();
    }
    throw new Erro("Rota não encontrada.", 404);
  } catch (e) {
    const err = e as Erro;
    if (!(err instanceof Erro)) console.error(err);
    return json({ error: err.message || "Erro inesperado." }, err.status || 500);
  }
});
