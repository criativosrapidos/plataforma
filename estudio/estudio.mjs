// Estúdio automático: pega os conteúdos da esteira que chegaram em "Produção" (já com roteiro, copy e direção),
// gera a arte (post, carrossel, stories, anúncio) ou o vídeo (reels, com narração na voz da agência) e manda pro
// app como entrega, pronta pra aprovar. Roda no GitHub Actions (tem navegador e ffmpeg).
// Variáveis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e, opcionais, ELEVENLABS_API_KEY, ELEVENLABS_VOZ, ESTUDIO_MAX.
// Teste local sem banco: node estudio.mjs --exemplo
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as M from "./modelos.mjs";

const aqui = dirname(fileURLToPath(import.meta.url));
const SB = (process.env.SUPABASE_URL || "").replace(/\/$/, ""), KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const FPS = 24;
const LOGO_AGENCIA = "data:image/png;base64," + readFileSync(join(aqui, "../site/assets/logo-icone.png")).toString("base64");
const MARCA_AGENCIA = { cores: ["#101216", "#FFD400", "#FFFFFF"], fontes: "Montserrat e Inter" };

// ---------------------------------------------------------------- Supabase (REST e Storage com a chave de serviço)
async function rest(caminho, opcoes = {}) {
  const r = await fetch(`${SB}/rest/v1/${caminho}`, { ...opcoes, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...(opcoes.headers || {}) } });
  if (!r.ok) throw new Error(`${caminho}: ${r.status} ${await r.text()}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
async function subir(caminho, bytes, tipo) {
  const r = await fetch(`${SB}/storage/v1/object/entregas/${caminho}`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": tipo, "x-upsert": "true" }, body: bytes });
  if (!r.ok) throw new Error(`upload ${caminho}: ${r.status} ${await r.text()}`);
  return caminho;
}
async function linkAssinado(caminho) {
  const r = await fetch(`${SB}/storage/v1/object/sign/entregas/${caminho}`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 3600 }) });
  if (!r.ok) return null;
  const d = await r.json(); return d.signedURL ? `${SB}/storage/v1${d.signedURL}` : null;
}

// ---------------------------------------------------------------- textos da peça
const limpa = (t) => String(t || "").replace(/\*\*/g, "").replace(/^[\s\-•·]+|[\s\-•·]+$/g, "").trim();
function corta(t, n) { t = limpa(t); if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, c.lastIndexOf(" ") > n * 0.6 ? c.lastIndexOf(" ") : n).trim() + "…"; }
function linhasArte(item) {
  const l = String(item.texto_arte || "").split(/\n+/).map(limpa).filter(Boolean);
  const primeira = (item.legenda || "").split(/(?<=[.!?])\s/)[0];
  return { titulo: corta(l[0] || item.titulo, 70), apoio: corta(l[1] || primeira, 130), chamada: l[2] ? corta(l[2], 32) : null };
}
// "Slide 1: ... · Slide 2: ..." ou uma linha por slide
function slides(item) {
  const r = String(item.roteiro || "");
  let partes = r.split(/slide\s*\d+\s*[:\-–]/i).map(limpa).filter(Boolean);
  if (partes.length < 3) partes = r.split(/\n+|\s·\s/).map(limpa).filter(Boolean);
  partes = partes.slice(0, 10);
  if (partes.length < 3) partes = [item.texto_arte || item.titulo, ...(item.legenda || "").split(/(?<=[.!?])\s/).slice(0, 4)].map(limpa).filter(Boolean);
  return partes.map((p) => { const [a, ...b] = p.split(/(?<=[.!?:])\s/); return { titulo: corta(a, 80), apoio: corta(b.join(" "), 150) }; });
}
// cenas do vídeo: tira marcações de tempo e direção ("0-3s:", "texto na tela:") e fica com o que é dito/mostrado
function cenas(item) {
  const r = String(item.roteiro || item.legenda || item.titulo);
  return r.split(/\n+|(?<=[.!?])\s+/).map((x) => limpa(x.replace(/^\(?\d+\s*[-–a]\s*\d+\s*s\)?\s*[:\-–]?/i, "").replace(/^(cena|corte|texto na tela|fala|narra(ção|dor)|close)\s*\d*\s*[:\-–]/i, "")))
    .filter((x) => x.length > 3).slice(0, 8).map((x) => corta(x, 90));
}

// ---------------------------------------------------------------- render
async function foto(pag, html, largura, altura) {
  await pag.setViewportSize({ width: largura, height: altura });
  await pag.setContent(html, { waitUntil: "networkidle" });
  await pag.evaluate(() => document.fonts.ready);
  return await pag.screenshot({ type: "jpeg", quality: 92 });
}

async function narrar(texto, pasta) {
  const chave = process.env.ELEVENLABS_API_KEY; if (!chave) return null;
  const voz = process.env.ELEVENLABS_VOZ || "HR2TRGmi4QbMsO5omv7l";
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=mp3_44100_128`, { method: "POST", headers: { "xi-api-key": chave, "Content-Type": "application/json" }, body: JSON.stringify({ text: texto, model_id: "eleven_multilingual_v2" }) });
  if (!r.ok) { console.error("narração", r.status, await r.text()); return null; }
  const arq = join(pasta, "voz.mp3"); writeFileSync(arq, Buffer.from(await r.arrayBuffer()));
  const dur = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq]).toString());
  return { arq, dur };
}

async function gravarVideo(pag, dados, pasta) {
  const frases = cenas(dados.item);
  const voz = await narrar(frases.join(" "), pasta);
  const total = voz ? voz.dur + 0.8 : Math.max(8, frases.length * 2.6);
  const chars = frases.reduce((t, f) => t + f.length, 0) || 1;
  const lista = frases.map((f) => {
    const p = f.split(" "), dest = p.length > 3 ? p.slice(0, -2).join(" ") + ' <span class="d">' + p.slice(-2).join(" ") + "</span>" : f;
    return { html: dest.replace(/&(?!amp;)/g, "&amp;"), dur: Math.max(1.4, total * f.length / chars), tam: f.length > 60 ? 84 : f.length > 35 ? 104 : 124 };
  });
  await pag.setViewportSize({ width: 1080, height: 1920 });
  await pag.setContent(M.video({ ...dados, cenas: lista }), { waitUntil: "networkidle" });
  await pag.evaluate(() => document.fonts.ready);
  const quadros = Math.ceil(lista.reduce((t, c) => t + c.dur, 0) * FPS);
  for (let q = 0; q < quadros; q++) {
    await pag.evaluate((t) => window.render(t), q / FPS);
    writeFileSync(join(pasta, `q${String(q).padStart(5, "0")}.jpg`), await pag.screenshot({ type: "jpeg", quality: 85 }));
  }
  const saida = join(pasta, "video.mp4");
  const args = ["-y", "-framerate", String(FPS), "-i", join(pasta, "q%05d.jpg")];
  if (voz) args.push("-i", voz.arq, "-c:a", "aac", "-b:a", "160k", "-shortest");
  args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20", "-movflags", "+faststart", saida);
  execFileSync("ffmpeg", args, { stdio: "ignore" });
  return readFileSync(saida);
}

// gera os arquivos de um item: [{ nome, bytes, tipo }]
async function gerar(pag, item, perfil, logo, pasta) {
  const marca = perfil.papel === "admin" && !(perfil.marca?.cores?.length) ? MARCA_AGENCIA : (perfil.marca || {});
  const nome = perfil.papel === "admin" ? "Criativos Rápidos" : (perfil.empresa || perfil.nome || "");
  const d = { marca, nome, logo, item };
  const a = linhasArte(item);
  if (item.tipo === "reels" || item.tipo === "video") return [{ nome: "video.mp4", bytes: await gravarVideo(pag, d, pasta), tipo: "video/mp4" }];
  if (item.tipo === "stories") return [{ nome: "story.jpg", bytes: await foto(pag, M.story({ ...d, ...a }), 1080, 1920), tipo: "image/jpeg" }];
  if (item.tipo === "carrossel") {
    const s = slides(item), out = [];
    for (let i = 0; i < s.length; i++) {
      const html = M.slide({ ...d, ...s[i], i: i + 1, total: s.length, capa: i === 0, final: i === s.length - 1 && s.length > 2 });
      out.push({ nome: `slide-${i + 1}.jpg`, bytes: await foto(pag, html, 1080, 1350), tipo: "image/jpeg" });
    }
    return out;
  }
  return [{ nome: "post.jpg", bytes: await foto(pag, M.post({ ...d, ...a }), 1080, 1350), tipo: "image/jpeg" }];
}

// ---------------------------------------------------------------- execução
async function exemplo() {
  const nav = await chromium.launch(), pag = await nav.newPage(), pasta = mkdtempSync(join(tmpdir(), "estudio-"));
  const perfil = { papel: "admin" };
  const itens = [
    { tipo: "post", titulo: "Post", texto_arte: "Seu Instagram parado está custando clientes\nA gente cria, você aprova e a gente posta.\nChama no WhatsApp", legenda: "" },
    { tipo: "carrossel", titulo: "Carrossel", roteiro: "Slide 1: 3 sinais de que seu Instagram precisa de ajuda · Slide 2: Você posta quando lembra. Sem constância, o algoritmo esquece de você. · Slide 3: Seus posts não vendem. Bonito não é o mesmo que vender. · Slide 4: Você não sabe o que funciona. Sem número, é chute. · Slide 5: A Criativos Rápidos resolve os três." },
    { tipo: "stories", titulo: "Story", texto_arte: "Agenda de novembro aberta\nPoucas vagas pra começar este mês.\nResponde aqui" },
    { tipo: "reels", titulo: "Reels", roteiro: "Você posta todo dia e ninguém compra?\nO problema não é o algoritmo.\nÉ conteúdo sem estratégia.\nA gente monta a pauta, cria e posta pra você.\nCriativos Rápidos. Chama no WhatsApp." },
  ];
  for (const it of itens) {
    const arqs = await gerar(pag, it, perfil, LOGO_AGENCIA, pasta);
    arqs.forEach((a) => writeFileSync(join(process.argv[3] || ".", `exemplo-${it.tipo}-${a.nome}`), a.bytes));
    console.log(it.tipo, arqs.length, "arquivo(s)");
  }
  await nav.close(); rmSync(pasta, { recursive: true, force: true });
}

async function principal() {
  if (!SB || !KEY) throw new Error("Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  const cfg = (await rest("configuracoes?chave=eq.estudio&select=valor"))?.[0]?.valor ?? {};
  const max = Number(process.env.ESTUDIO_MAX || cfg.max || 12);
  // por padrão o Estúdio produz só o marketing da própria agência; em Configurações dá pra ligar pros clientes
  const admins = (await rest("perfis?papel=eq.admin&select=id")).map((x) => x.id);
  let filtro = cfg.quem === "todos" ? "" : `&cliente_id=in.(${admins.join(",")})`;
  const itens = await rest(`producao?etapa=eq.producao${filtro}&select=*&order=data_sugerida.asc.nullslast&limit=${max}`);
  console.log(`${itens.length} conteúdo(s) pra produzir`);
  if (!itens.length) return;
  const nav = await chromium.launch(), pag = await nav.newPage();
  for (const item of itens) {
    const pasta = mkdtempSync(join(tmpdir(), "estudio-"));
    try {
      const perfil = (await rest(`perfis?id=eq.${item.cliente_id}&select=id,papel,nome,empresa,marca`))[0];
      let logo = perfil.papel === "admin" ? LOGO_AGENCIA : null;
      const mats = await rest(`materiais?cliente_id=eq.${item.cliente_id}&categoria=eq.marca&arquivo_path=not.is.null&select=arquivo_path,arquivo_nome&order=criado_em.asc&limit=5`);
      const img = mats.find((m) => /\.(png|jpe?g|webp|svg)$/i.test(m.arquivo_nome || m.arquivo_path));
      if (img) logo = (await linkAssinado(img.arquivo_path)) || logo;
      const arqs = await gerar(pag, item, perfil, logo, pasta);
      const base = `${item.cliente_id}/estudio/${item.id}`;
      const caminhos = [];
      for (const a of arqs) caminhos.push(await subir(`${base}/${a.nome}`, a.bytes, a.tipo));
      const [ent] = await rest("entregas", { method: "POST", body: JSON.stringify({
        cliente_id: item.cliente_id, titulo: item.titulo, tipo: item.tipo, legenda: item.legenda, data_postagem: item.data_sugerida,
        hora_postagem: "10:00", arquivo_path: caminhos[0], arquivo_nome: arqs[0].nome, extras: caminhos.length > 1 ? caminhos.slice(1) : null,
        status: "aguardando", publicar: true,
      }) });
      await rest(`producao?id=eq.${item.id}`, { method: "PATCH", body: JSON.stringify({ etapa: "entregue", entrega_id: ent.id, atualizado_em: new Date().toISOString() }) });
      console.log("ok", item.tipo, item.titulo);
    } catch (e) { console.error("falhou", item.id, e.message); }
    finally { rmSync(pasta, { recursive: true, force: true }); }
  }
  await nav.close();
}

(process.argv[2] === "--exemplo" ? exemplo() : principal()).catch((e) => { console.error(e); process.exit(1); });
