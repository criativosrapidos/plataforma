// WhatsApp oficial da agência (WhatsApp Business Platform / Cloud API da Meta) com a atendente de IA.
// Quem chama a agência é atendido na hora: a IA entende o negócio, responde dúvidas, manda áudio (opcional) e marca
// a reunião nos horários livres da agenda. A equipe vê tudo no CRM e assume quando quiser.
// A plataforma NUNCA inicia conversa com quem não pediu contato (optin): é a regra da Meta e o que mantém o número vivo.
// Rotas (https://<projeto>.supabase.co/functions/v1/whatsapp/...):
//   GET  /webhook     verificação da Meta (hub.challenge)
//   POST /webhook     mensagens recebidas (assinatura x-hub-signature-256)
//   POST /enviar      agência manda uma mensagem pra um contato  { "lead_id": "...", "texto": "..." }
//   POST /contato     agência faz o primeiro contato com quem pediu pelo site (modelo aprovado)  { "lead_id": "..." }
// Variáveis: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET, ANTHROPIC_API_KEY
// e, opcionais, WHATSAPP_TEMPLATE_CONTATO (nome do modelo aprovado, com {{1}} = primeiro nome), ELEVENLABS_API_KEY e ELEVENLABS_VOZ.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import Anthropic from "npm:@anthropic-ai/sdk@1.3.0";
import { z } from "npm:zod@4";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@1.3.0/helpers/zod";

const env = (k: string, padrao = "") => Deno.env.get(k) ?? padrao;
const GRAPH = "https://graph.facebook.com/" + env("META_API_VERSION", "v23.0");
const db: SupabaseClient = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const claude = new Anthropic({ apiKey: env("ANTHROPIC_API_KEY") });
const FUSO = "America/Sao_Paulo";
const SAIR = /^\s*(sair|parar|pare|stop|descadastrar|cancelar mensagens|n[aã]o quero (mais )?(receber|mensagens?))\s*[.!]?\s*$/i;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { ...CORS, "Content-Type": "application/json" } });
class Erro extends Error { constructor(msg: string, public status = 400) { super(msg); } }
// deno-lint-ignore no-explicit-any
type Linha = any;

// Mesma tabela de planos do site (assets/core.js). Se mudar lá, mude aqui.
const PLANOS = `Presença R$ 597/mês (30 conteúdos por mês prontos, o cliente posta); Crescimento R$ 797/mês (50 conteúdos, a agência programa e posta);
Autoridade R$ 997/mês (70 conteúdos, posta + gestão de tráfego pago + relatório). Pacotes: Largada R$ 97 (2 vídeos e 1 arte pra anúncio),
Acelera R$ 297 (identidade visual + 1 anúncio), Turbo R$ 497 (identidade completa, landing page e PDFs).`;

// ---------------------------------------------------------------- API da Meta
async function graph(caminho: string, corpo?: unknown, metodo = "POST") {
  if (!env("WHATSAPP_TOKEN") || !env("WHATSAPP_PHONE_ID")) throw new Erro("O WhatsApp oficial ainda não foi conectado (faltam WHATSAPP_TOKEN e WHATSAPP_PHONE_ID).", 500);
  const r = await fetch(`${GRAPH}/${caminho}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}`, ...(corpo instanceof FormData || !corpo ? {} : { "Content-Type": "application/json" }) },
    body: corpo instanceof FormData ? corpo : corpo ? JSON.stringify(corpo) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Erro(String(d.error?.error_data?.details || d.error?.message || `WhatsApp respondeu ${r.status}`), 502);
  return d;
}
const so = (t: string) => String(t || "").replace(/\D/g, "");
function numero(t: string) { let d = so(t); if (d.length === 10 || d.length === 11) d = "55" + d; return d; }

async function guardar(m: Linha) { await db.from("whatsapp_mensagens").insert(m); }
async function mandarTexto(lead: Linha, texto: string, autor: "ia" | "equipe") {
  const r = await graph(`${env("WHATSAPP_PHONE_ID")}/messages`, { messaging_product: "whatsapp", to: numero(lead.whatsapp), type: "text", text: { body: texto, preview_url: false } });
  await guardar({ lead_id: lead.id, telefone: numero(lead.whatsapp), direcao: "saida", autor, tipo: "texto", texto, wa_id: r.messages?.[0]?.id ?? null });
}
// áudio com a voz da agência (ElevenLabs), enviado como arquivo de áudio
async function mandarAudio(lead: Linha, texto: string) {
  const chave = env("ELEVENLABS_API_KEY"); if (!chave) return false;
  const voz = env("ELEVENLABS_VOZ", "HR2TRGmi4QbMsO5omv7l");
  const tts = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=mp3_44100_128`, {
    method: "POST", headers: { "xi-api-key": chave, "Content-Type": "application/json" },
    body: JSON.stringify({ text: texto, model_id: "eleven_multilingual_v2" }),
  });
  if (!tts.ok) { console.error("tts", tts.status, await tts.text()); return false; }
  const fd = new FormData();
  fd.append("messaging_product", "whatsapp"); fd.append("type", "audio/mpeg");
  fd.append("file", new Blob([await tts.arrayBuffer()], { type: "audio/mpeg" }), "audio.mp3");
  const up = await graph(`${env("WHATSAPP_PHONE_ID")}/media`, fd);
  const r = await graph(`${env("WHATSAPP_PHONE_ID")}/messages`, { messaging_product: "whatsapp", to: numero(lead.whatsapp), type: "audio", audio: { id: up.id } });
  await guardar({ lead_id: lead.id, telefone: numero(lead.whatsapp), direcao: "saida", autor: "ia", tipo: "audio", texto, wa_id: r.messages?.[0]?.id ?? null });
  return true;
}
// áudio que a pessoa mandou -> texto (ElevenLabs), pra IA entender
async function transcrever(mediaId: string) {
  const chave = env("ELEVENLABS_API_KEY"); if (!chave) return null;
  const meta = await graph(mediaId, undefined, "GET");
  const arq = await fetch(meta.url, { headers: { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}` } });
  const fd = new FormData();
  fd.append("model_id", "scribe_v1"); fd.append("file", new Blob([await arq.arrayBuffer()], { type: meta.mime_type || "audio/ogg" }), "audio.ogg");
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": chave }, body: fd });
  if (!r.ok) return null;
  return (await r.json()).text ?? null;
}

// ---------------------------------------------------------------- agenda
async function config(chave: string) { const { data } = await db.from("configuracoes").select("valor").eq("chave", chave).maybeSingle(); return data?.valor ?? {}; }
// horários livres dos próximos 7 dias, no fuso de Brasília (UTC-3, sem horário de verão)
async function horariosLivres() {
  const ag = await config("agenda");
  const dias: number[] = ag.dias ?? [1, 2, 3, 4, 5], dur = Number(ag.duracao ?? 30), antes = Number(ag.antecedencia_horas ?? 3);
  const [hi, mi] = String(ag.inicio ?? "09:00").split(":").map(Number), [hf, mf] = String(ag.fim ?? "18:00").split(":").map(Number);
  const agora = Date.now(), limite = agora + antes * 3600e3;
  const { data: marcadas } = await db.from("reunioes").select("inicio, fim").eq("status", "marcada").gte("fim", new Date(agora).toISOString());
  const ocupado = (ini: number, fim: number) => (marcadas ?? []).some((r) => ini < Date.parse(r.fim) && fim > Date.parse(r.inicio));
  const livres: { id: string; texto: string }[] = [];
  const SEM = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  for (let d = 0; d < 8 && livres.length < 16; d++) {
    const base = new Date(agora - 3 * 3600e3); base.setUTCDate(base.getUTCDate() + d);
    const ano = base.getUTCFullYear(), mes = base.getUTCMonth(), dia = base.getUTCDate(), sem = base.getUTCDay();
    if (!dias.includes(sem)) continue;
    for (let m = hi * 60 + mi; m + dur <= hf * 60 + mf; m += dur) {
      const ini = Date.UTC(ano, mes, dia, 0, m) + 3 * 3600e3, fim = ini + dur * 60e3;
      if (ini < limite || ocupado(ini, fim)) continue;
      const hh = String(Math.floor(m / 60)).padStart(2, "0"), mm = String(m % 60).padStart(2, "0");
      livres.push({ id: new Date(ini).toISOString(), texto: `${SEM[sem]} ${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")} às ${hh}:${mm}` });
    }
  }
  return { livres, dur, link: ag.link ?? "" };
}

// ---------------------------------------------------------------- atendente de IA
const Resposta = z.object({
  resposta: z.string().describe("A próxima mensagem pro contato, como no WhatsApp: curta (até 4 frases), sem markdown"),
  em_audio: z.boolean().describe("true se essa resposta fica melhor em áudio (explicação, boas-vindas); false pra respostas curtas"),
  reuniao: z.string().nullable().describe("id EXATO de um horário livre que a pessoa confirmou, ou null"),
  etapa: z.enum(["novo", "conversando", "proposta", "fechou", "perdido"]),
  anotacao: z.string().describe("Resumo pro CRM: negócio, dores, interesse, objeções, próximo passo"),
  chamar_equipe: z.boolean().describe("true se a pessoa pediu humano, reclamou, ou é assunto que a IA não deve resolver"),
  nome: z.string().nullable(), empresa: z.string().nullable(),
});

async function atender(lead: Linha) {
  const { data: ag } = await db.from("agentes").select("*").eq("etapa", "whatsapp").eq("ativo", true).order("ordem").limit(1);
  const a = ag?.[0];
  if (!a || !lead.ia_ativa || !env("ANTHROPIC_API_KEY")) return;
  const [{ data: hist }, treino, agenda] = await Promise.all([
    db.from("whatsapp_mensagens").select("direcao, autor, texto, criado_em").eq("lead_id", lead.id).order("criado_em", { ascending: false }).limit(30),
    config("atendente"), horariosLivres(),
  ]);
  const conversa = (hist ?? []).reverse().map((m) => `${m.direcao === "entrada" ? "CONTATO" : m.autor === "ia" ? "VOCÊ" : "EQUIPE"}: ${m.texto ?? "(mídia)"}`).join("\n");
  const r = await claude.beta.messages.create({
    model: a.modelo || "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `Você é ${a.nome}, ${a.cargo ?? "atendente"} da Criativos Rápidos, agência de marketing e social media pra pequenos negócios.
Diga que é assistente virtual da agência se perguntarem. Português do Brasil, tom de WhatsApp, simpático e direto.
Sua função: ${a.missao}
Planos (os únicos preços que você pode citar): ${PLANOS}
Nunca invente preço, prazo, desconto, resultado garantido ou case. Se não souber, diga que confirma com a equipe.
Pra marcar reunião (${agenda.dur} minutos, online), ofereça 2 ou 3 horários da lista de livres e só marque um id que a pessoa confirmou.
${treino.texto ? "Treino da agência (siga):\n" + treino.texto : ""}`,
    output_config: { effort: "low", format: zodOutputFormat(Resposta) },
    messages: [{ role: "user", content: JSON.stringify({ contato: { nome: lead.nome, empresa: lead.empresa, interesse: lead.interesse, etapa: lead.status, anotacao: lead.observacao }, horarios_livres: agenda.livres, conversa }) }],
  });
  if (r.stop_reason === "refusal") return;
  const texto = r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const ok = Resposta.safeParse(JSON.parse(texto));
  if (!ok.success) { console.error("formato", texto); return; }
  const o = ok.data;
  // marca a reunião, se o horário ainda estiver livre
  let confirmacao = "";
  const slot = o.reuniao && agenda.livres.find((s) => s.id === o.reuniao);
  if (slot) {
    const ini = Date.parse(slot.id);
    await db.from("reunioes").insert({ lead_id: lead.id, nome: o.nome ?? lead.nome, telefone: lead.whatsapp, inicio: slot.id, fim: new Date(ini + agenda.dur * 60e3).toISOString(), marcada_por: "ia", observacao: o.anotacao });
    if (agenda.link && !o.resposta.includes(agenda.link)) confirmacao = `\n\nLink da reunião: ${agenda.link}`;
  }
  await db.from("leads").update({
    status: lead.status === "fechou" ? "fechou" : o.etapa, observacao: o.anotacao,
    nome: lead.nome && !/^Contato /.test(lead.nome) ? lead.nome : (o.nome ?? lead.nome),
    empresa: lead.empresa ?? o.empresa, ia_ativa: !o.chamar_equipe,
  }).eq("id", lead.id);
  const treinoAudio = !!treino.audio;
  if (!(treinoAudio && o.em_audio && await mandarAudio(lead, o.resposta).catch((e) => { console.error(e); return false; })))
    await mandarTexto(lead, o.resposta + confirmacao, "ia");
  else if (confirmacao) await mandarTexto(lead, confirmacao.trim(), "ia");
  if (o.chamar_equipe) await db.from("agente_sugestoes").insert({ agente_id: a.id, tipo: "alerta", prioridade: "alta", lead_id: lead.id, titulo: "Atender no WhatsApp: " + (o.nome ?? lead.nome), conteudo: { texto: "A atendente passou a conversa pra equipe. " + o.anotacao } });
}

// ---------------------------------------------------------------- webhook
async function assinaturaOk(req: Request, corpo: string) {
  const segredo = env("WHATSAPP_APP_SECRET"); if (!segredo) return false;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(corpo)))).map((b) => b.toString(16).padStart(2, "0")).join("");
  return (req.headers.get("x-hub-signature-256") ?? "") === "sha256=" + sig;
}

async function receber(corpo: Linha) {
  for (const e of corpo.entry ?? []) for (const ch of e.changes ?? []) {
    const v = ch.value ?? {};
    const nomes = Object.fromEntries((v.contacts ?? []).map((c: Linha) => [c.wa_id, c.profile?.name]));
    for (const m of v.messages ?? []) {
      const tel = so(m.from);
      const { data: ja } = await db.from("whatsapp_mensagens").select("id").eq("wa_id", m.id).maybeSingle();
      if (ja) continue; // a Meta reenvia: não responde duas vezes
      let texto: string | null = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? null;
      if (m.type === "audio" && m.audio?.id) texto = (await transcrever(m.audio.id).catch(() => null)) ?? "(áudio sem transcrição)";
      if (!texto) texto = `(${m.type})`;
      // acha o contato pelo número (com ou sem o 55) ou cria um novo no CRM
      const { data: leads } = await db.from("leads").select("*").like("whatsapp_num", `%${tel.slice(-8)}`).order("criado_em", { ascending: false }).limit(5);
      let lead = (leads ?? []).find((l) => numero(l.whatsapp) === tel || numero(l.whatsapp).endsWith(tel.slice(-10)));
      if (!lead) {
        const { data: novo, error } = await db.from("leads").insert({ nome: nomes[m.from] || "Contato " + tel.slice(-4), whatsapp: tel, origem: "whatsapp", status: "novo", optin: true }).select().single();
        if (error) { console.error(error); continue; }
        lead = novo;
      }
      await guardar({ lead_id: lead.id, telefone: tel, direcao: "entrada", autor: "contato", tipo: m.type, texto, wa_id: m.id });
      await db.from("leads").update({ ultima_entrada_em: new Date().toISOString(), optin: true }).eq("id", lead.id);
      lead.optin = true;
      if (SAIR.test(texto)) {
        await db.from("leads").update({ ia_ativa: false, optin: false, status: "perdido", observacao: (lead.observacao ? lead.observacao + "\n" : "") + "Pediu pra não receber mais mensagens." }).eq("id", lead.id);
        await mandarTexto(lead, "Tudo bem, não vamos mais te mandar mensagens. Se precisar, é só chamar aqui. 👋", "ia").catch(console.error);
        continue;
      }
      await atender(lead).catch((err) => console.error("atender", err));
    }
  }
}

async function soAgencia(req: Request) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data.user) throw new Erro("Faça login de novo.", 401);
  const { data: p } = await db.from("perfis").select("papel").eq("id", data.user.id).single();
  if (p?.papel !== "admin") throw new Erro("Só a agência pode fazer isso.", 403);
}

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url), rota = url.pathname.replace(/^.*\/whatsapp/, "") || "/";
  try {
    if (rota === "/webhook" && req.method === "GET") {
      const ok = url.searchParams.get("hub.mode") === "subscribe" && env("WHATSAPP_VERIFY_TOKEN") && url.searchParams.get("hub.verify_token") === env("WHATSAPP_VERIFY_TOKEN");
      return ok ? new Response(url.searchParams.get("hub.challenge") ?? "") : new Response("forbidden", { status: 403 });
    }
    if (req.method !== "POST") throw new Erro("Método não permitido.", 405);
    if (rota === "/webhook") {
      const corpo = await req.text();
      if (!(await assinaturaOk(req, corpo))) return new Response("assinatura inválida", { status: 401 });
      // responde 200 na hora pra Meta e atende em segundo plano
      const tarefa = receber(JSON.parse(corpo)).catch((e) => console.error("webhook", e));
      if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(tarefa); else await tarefa;
      return new Response("ok");
    }
    await soAgencia(req);
    const b = await req.json().catch(() => ({}));
    const { data: lead } = await db.from("leads").select("*").eq("id", String(b.lead_id)).single();
    if (!lead) throw new Erro("Contato não encontrado.", 404);
    if (rota === "/enviar") {
      const texto = String(b.texto ?? "").trim();
      if (!texto) throw new Erro("Escreva a mensagem.");
      const janela = lead.ultima_entrada_em && Date.now() - Date.parse(lead.ultima_entrada_em) < 24 * 3600e3;
      if (!janela) throw new Erro("Esse contato não falou com a gente nas últimas 24 h. Pela regra do WhatsApp, só dá pra retomar com o modelo de primeiro contato (e só se ele pediu contato).", 409);
      await mandarTexto(lead, texto, "equipe");
      return json({ ok: true });
    }
    if (rota === "/contato") {
      if (!lead.optin) throw new Erro("Esse contato não pediu pra ser chamado no WhatsApp. Aborde por outro canal.", 409);
      const modelo = env("WHATSAPP_TEMPLATE_CONTATO");
      if (!modelo) throw new Erro("Falta aprovar o modelo de primeiro contato na Meta e colocar o nome em WHATSAPP_TEMPLATE_CONTATO.", 500);
      const primeiro = String(lead.nome || "").split(" ")[0] || "tudo bem";
      const r = await graph(`${env("WHATSAPP_PHONE_ID")}/messages`, { messaging_product: "whatsapp", to: numero(lead.whatsapp), type: "template",
        template: { name: modelo, language: { code: "pt_BR" }, components: [{ type: "body", parameters: [{ type: "text", text: primeiro }] }] } });
      await guardar({ lead_id: lead.id, telefone: numero(lead.whatsapp), direcao: "saida", autor: "equipe", tipo: "modelo", texto: `(modelo ${modelo})`, wa_id: r.messages?.[0]?.id ?? null });
      return json({ ok: true });
    }
    throw new Erro("Rota não encontrada.", 404);
  } catch (e) {
    const err = e as Erro;
    if (!(err instanceof Erro)) console.error(err);
    return json({ error: err.message || "Erro inesperado." }, err.status || 500);
  }
});
