// Publicação em várias redes pelo Postiz (Instagram, Facebook, TikTok, LinkedIn, X, YouTube e outras).
// Cada cliente (e a própria agência) escolhe os canais conectados no Postiz; quando uma entrega é aprovada, ela é
// enviada pro Postiz já agendada pro dia e horário do calendário. O Postiz cuida da publicação em cada rede.
// Rotas (https://<projeto>.supabase.co/functions/v1/redes/...):
//   POST /canais      agência lista os canais conectados no Postiz
//   POST /enviar      agência manda uma entrega agora  { "entrega_id": "..." }
//   POST /agendado    o agendador chama a cada 15 min (cabeçalho x-cron-secret): manda as aprovadas que faltam
// Variáveis: POSTIZ_API_KEY, CRON_SECRET e, opcional, POSTIZ_API_URL (Postiz próprio; padrão https://api.postiz.com).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

const env = (k: string, padrao = "") => Deno.env.get(k) ?? padrao;
const API = env("POSTIZ_API_URL", "https://api.postiz.com").replace(/\/$/, "");
const db: SupabaseClient = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const BUCKET = "entregas";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { ...CORS, "Content-Type": "application/json" } });
class Erro extends Error { constructor(msg: string, public status = 400) { super(msg); } }
// deno-lint-ignore no-explicit-any
type Linha = any;

async function postiz(caminho: string, init: RequestInit = {}) {
  if (!env("POSTIZ_API_KEY")) throw new Erro("O Postiz ainda não foi conectado (falta a POSTIZ_API_KEY).", 500);
  const r = await fetch(`${API}/public/v1/${caminho}`, { ...init, headers: { Authorization: env("POSTIZ_API_KEY"), ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(init.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Erro(`Postiz respondeu ${r.status}: ${t.slice(0, 300)}`, 502);
  return t ? JSON.parse(t) : null;
}
async function canais(): Promise<Linha[]> {
  const d = await postiz("integrations");
  return (Array.isArray(d) ? d : d?.integrations ?? []).map((c: Linha) => ({ id: c.id, nome: c.name, rede: c.identifier ?? c.providerIdentifier, foto: c.picture ?? null, desligado: !!c.disabled }));
}

// sobe o arquivo da entrega pro Postiz (as redes só aceitam mídia hospedada lá)
async function subirMidia(caminho: string) {
  const { data, error } = await db.storage.from(BUCKET).download(caminho);
  if (error || !data) throw new Erro("Não achei o arquivo " + caminho, 404);
  const fd = new FormData();
  fd.append("file", new Blob([await data.arrayBuffer()], { type: data.type || "application/octet-stream" }), caminho.split("/").pop() ?? "arquivo");
  const r = await postiz("upload", { method: "POST", body: fd });
  return { id: r.id ?? crypto.randomUUID(), path: r.path };
}

// ajustes de cada rede (o que não vale pra rede é ignorado por ela, por isso só mandamos o necessário)
function ajustes(rede: string, e: Linha) {
  if (/^instagram/.test(rede)) return { post_type: e.tipo === "stories" ? "story" : "post" };
  if (rede === "tiktok") return { privacy_level: "PUBLIC_TO_EVERYONE", duet: true, stitch: true, comment: true, content_posting_method: "DIRECT_POST" };
  if (rede === "youtube") return { title: String(e.titulo || "Vídeo").slice(0, 100), type: "public" };
  if (rede === "x") return { who_can_reply_post: "everyone" };
  return undefined;
}
// o que cada rede aceita: vídeo pra TikTok/YouTube, stories só onde existe stories
function aceita(rede: string, e: Linha, video: boolean) {
  if (rede === "tiktok" || rede === "youtube") return video;
  if (e.tipo === "stories") return /^instagram|^facebook/.test(rede);
  return true;
}
function quando(e: Linha) {
  const d = e.data_postagem ? new Date(`${e.data_postagem}T${String(e.hora_postagem || "10:00").slice(0, 5)}:00-03:00`) : new Date();
  const minimo = Date.now() + 5 * 60e3;
  return new Date(Math.max(d.getTime(), minimo)).toISOString();
}

async function enviar(entregaId: string) {
  const { data: e } = await db.from("entregas").select("*").eq("id", entregaId).single();
  if (!e) throw new Erro("Entrega não encontrada.", 404);
  if (e.status !== "aprovado") throw new Erro("Só vai pras redes depois de aprovada.");
  if (!e.arquivo_path) throw new Erro("Essa entrega não tem arquivo na plataforma (link do Drive não vai pras redes).");
  const { data: p } = await db.from("perfis").select("redes").eq("id", e.cliente_id).single();
  const escolhidos: string[] = (e.redes?.length ? e.redes : p?.redes) ?? [];
  if (!escolhidos.length) throw new Erro("Esse cliente ainda não tem redes escolhidas.");
  const todos = await canais();
  const video = /\.(mp4|mov|webm|m4v)$/i.test(e.arquivo_nome || e.arquivo_path);
  const alvo = todos.filter((c) => escolhidos.includes(c.id) && !c.desligado && aceita(c.rede, e, video));
  if (!alvo.length) throw new Erro("Nenhuma das redes escolhidas aceita esse formato.");
  const midias = [await subirMidia(e.arquivo_path)];
  for (const x of e.extras ?? []) midias.push(await subirMidia(x));
  const r = await postiz("posts", { method: "POST", body: JSON.stringify({
    type: "schedule", date: quando(e), shortLink: false, tags: [],
    posts: alvo.map((c) => ({ integration: { id: c.id }, value: [{ content: e.legenda || e.titulo || "", image: midias }], settings: ajustes(c.rede, e) })),
  }) });
  // se o Instagram vai pelo Postiz, a postagem direta da plataforma fica desligada pra não sair duas vezes
  const comInsta = alvo.some((c) => /^instagram/.test(c.rede));
  await db.from("entregas").update({ redes_enviado_em: new Date().toISOString(), redes_resultado: { canais: alvo.map((c) => c.rede), postiz: r }, ...(comInsta ? { publicar: false } : {}) }).eq("id", e.id);
  return alvo.map((c) => c.rede);
}

async function soAgencia(req: Request) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data.user) throw new Erro("Faça login de novo.", 401);
  const { data: p } = await db.from("perfis").select("papel").eq("id", data.user.id).single();
  if (p?.papel !== "admin") throw new Erro("Só a agência pode fazer isso.", 403);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const rota = new URL(req.url).pathname.replace(/^.*\/redes/, "") || "/";
  try {
    if (req.method !== "POST") throw new Erro("Método não permitido.", 405);
    if (rota === "/agendado") {
      if (!env("CRON_SECRET") || req.headers.get("x-cron-secret") !== env("CRON_SECRET")) throw new Erro("Não autorizado.", 401);
      const { data: perfis } = await db.from("perfis").select("id").not("redes", "is", null);
      const ids = (perfis ?? []).map((x) => x.id);
      if (!ids.length) return json({ enviados: 0 });
      const { data: lista } = await db.from("entregas").select("id").eq("status", "aprovado").is("redes_enviado_em", null).is("redes_resultado", null).not("arquivo_path", "is", null).in("cliente_id", ids).limit(15);
      const res: Record<string, unknown> = {};
      for (const e of lista ?? []) { try { res[e.id] = await enviar(e.id); } catch (x) { res[e.id] = "erro: " + (x as Error).message; await db.from("entregas").update({ redes_resultado: { erro: (x as Error).message } }).eq("id", e.id); } }
      return json({ resultado: res });
    }
    await soAgencia(req);
    if (rota === "/canais") return json({ canais: await canais() });
    if (rota === "/enviar") { const b = await req.json().catch(() => ({})); return json({ redes: await enviar(String(b.entrega_id)) }); }
    throw new Erro("Rota não encontrada.", 404);
  } catch (e) {
    const err = e as Erro;
    if (!(err instanceof Erro)) console.error(err);
    return json({ error: err.message || "Erro inesperado." }, err.status || 500);
  }
});
