// Modelos visuais do Estúdio: cada função devolve o HTML de uma peça, já com as cores e fontes da marca.
// Tudo é texto + formas (sem foto): fica bonito sem depender de banco de imagens, e a marca do cliente manda.

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// paleta a partir da marca: fundo, destaque, texto (com contraste garantido)
export function paleta(marca = {}) {
  const cores = (marca.cores || []).filter((c) => /^#[0-9a-f]{6}$/i.test(c));
  const luz = (h) => { const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const escuras = cores.filter((c) => luz(c) < 0.35), vivas = cores.filter((c) => luz(c) >= 0.35 && luz(c) < 0.9);
  const fundo = escuras[0] || "#101216";
  const destaque = vivas[0] || cores.find((c) => c !== fundo) || "#FFD400";
  const claro = cores.find((c) => luz(c) >= 0.9) || "#FFFFFF";
  return { fundo, destaque, claro, textoDestaque: luz(destaque) > 0.6 ? "#101216" : "#FFFFFF" };
}

function fontes(marca = {}) {
  // a marca pode citar a fonte ("Títulos em Montserrat Black, textos em Inter"); usamos as do Google Fonts que aparecerem
  const conhecidas = ["Montserrat", "Inter", "Poppins", "Playfair Display", "Bebas Neue", "Anton", "Oswald", "Lora", "DM Sans", "Raleway", "Archivo Black", "Nunito", "Roboto"];
  const citadas = conhecidas.filter((f) => new RegExp(f, "i").test(marca.fontes || ""));
  const titulo = citadas[0] || "Montserrat", corpo = citadas[1] || (titulo === "Inter" ? "Montserrat" : "Inter");
  const link = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(titulo)}:wght@700;800;900&family=${encodeURIComponent(corpo)}:wght@400;600;700&display=swap`;
  return { titulo, corpo, link };
}

function base({ marca, largura, altura, corpo }) {
  const p = paleta(marca), f = fontes(marca);
  return `<!doctype html><html><head><meta charset="utf-8"><link href="${f.link}" rel="stylesheet"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${largura}px;height:${altura}px;overflow:hidden}
  body{background:${p.fundo};color:#fff;font-family:'${f.corpo}',sans-serif;position:relative}
  .t{font-family:'${f.titulo}',sans-serif;font-weight:900;letter-spacing:-.02em;line-height:.98}
  .d{color:${p.destaque}}
  .pill{display:inline-block;background:${p.destaque};color:${p.textoDestaque};font-weight:800;border-radius:999px;padding:14px 30px;font-size:30px}
  .marca{position:absolute;left:70px;bottom:60px;display:flex;align-items:center;gap:18px;font-weight:700;font-size:28px;opacity:.95}
  .marca img{width:64px;height:64px;border-radius:16px;object-fit:contain;background:rgba(255,255,255,.06)}
  .forma{position:absolute;border-radius:50%;background:${p.destaque};opacity:.14}
  .num{position:absolute;right:70px;top:60px;font-weight:800;font-size:28px;opacity:.7}
  </style></head><body>${corpo(p)}</body></html>`;
}

function rodape(nome, logo) {
  return `<div class="marca">${logo ? `<img src="${esc(logo)}">` : ""}<span>${esc(nome)}</span></div>`;
}

// tamanho do título conforme o tamanho do texto, pra caber sempre
function tamanho(texto, max, min) {
  const n = String(texto || "").length;
  return Math.max(min, Math.round(max - Math.max(0, n - 18) * ((max - min) / 60)));
}

// ---------------------------------------------------------------- post e anúncio (1080x1350)
export function post({ marca, nome, logo, titulo, apoio, chamada }) {
  return base({ marca, largura: 1080, altura: 1350, corpo: () => `
    <div class="forma" style="width:760px;height:760px;right:-260px;top:-240px"></div>
    <div class="forma" style="width:380px;height:380px;left:-120px;bottom:180px;opacity:.08"></div>
    <div style="position:absolute;left:70px;right:70px;top:170px">
      <div style="width:120px;height:14px;border-radius:9px" class="pill"></div>
      <h1 class="t" style="font-size:${tamanho(titulo, 128, 74)}px;margin-top:46px">${esc(titulo)}</h1>
      ${apoio ? `<p style="font-size:38px;line-height:1.35;margin-top:42px;opacity:.88;max-width:880px">${esc(apoio)}</p>` : ""}
    </div>
    ${chamada ? `<div style="position:absolute;left:70px;bottom:170px"><span class="pill">${esc(chamada)}</span></div>` : ""}
    ${rodape(nome, logo)}` });
}

// ---------------------------------------------------------------- stories (1080x1920)
export function story({ marca, nome, logo, titulo, apoio, chamada }) {
  return base({ marca, largura: 1080, altura: 1920, corpo: () => `
    <div class="forma" style="width:900px;height:900px;left:-300px;top:-300px"></div>
    <div style="position:absolute;left:80px;right:80px;top:520px">
      <h1 class="t" style="font-size:${tamanho(titulo, 140, 84)}px">${esc(titulo)}</h1>
      ${apoio ? `<p style="font-size:44px;line-height:1.35;margin-top:48px;opacity:.9">${esc(apoio)}</p>` : ""}
    </div>
    ${chamada ? `<div style="position:absolute;left:80px;right:80px;bottom:300px;text-align:center"><span class="pill" style="font-size:40px;padding:22px 48px">${esc(chamada)}</span></div>` : ""}
    ${rodape(nome, logo)}` });
}

// ---------------------------------------------------------------- carrossel (1080x1350 por slide)
export function slide({ marca, nome, logo, titulo, apoio, i, total, capa, final }) {
  return base({ marca, largura: 1080, altura: 1350, corpo: (p) => capa ? `
    <div class="forma" style="width:820px;height:820px;right:-280px;bottom:-260px"></div>
    <div style="position:absolute;left:70px;right:70px;top:240px">
      <h1 class="t" style="font-size:${tamanho(titulo, 132, 80)}px">${esc(titulo)}</h1>
      ${apoio ? `<p style="font-size:38px;margin-top:40px;opacity:.88">${esc(apoio)}</p>` : ""}
      <p style="margin-top:70px;font-weight:800;font-size:32px" class="d">Arrasta pro lado →</p>
    </div>${rodape(nome, logo)}` : `
    <div class="num">${i}/${total}</div>
    <div class="forma" style="width:520px;height:520px;right:-180px;bottom:-140px;opacity:.12"></div>
    <div style="position:absolute;left:70px;right:70px;bottom:150px;height:10px;border-radius:9px;background:rgba(255,255,255,.1)"><div style="height:100%;width:${Math.round(i / total * 100)}%;border-radius:9px;background:${p.destaque}"></div></div>
    <div style="position:absolute;left:70px;right:70px;top:${final ? 360 : 220}px">
      ${final ? "" : `<div class="t d" style="font-size:150px;opacity:.9">${String(i - 1).padStart(2, "0")}</div>`}
      <h2 class="t" style="font-size:${tamanho(titulo, final ? 110 : 88, 60)}px;margin-top:30px">${esc(titulo)}</h2>
      ${apoio ? `<p style="font-size:38px;line-height:1.4;margin-top:36px;opacity:.88">${esc(apoio)}</p>` : ""}
      ${final ? `<div style="margin-top:60px"><span class="pill" style="font-size:36px;padding:20px 44px;background:${p.destaque}">Salva e manda pra alguém</span></div>` : ""}
    </div>${rodape(nome, logo)}` });
}

// ---------------------------------------------------------------- vídeo (1080x1920): cenas com texto animado
// a página expõe render(t) pra captura quadro a quadro
export function video({ marca, nome, logo, cenas }) {
  const p = paleta(marca);
  return base({ marca, largura: 1080, altura: 1920, corpo: () => `
    <div class="forma" id="f1" style="width:900px;height:900px;left:-300px;top:-300px"></div>
    <div class="forma" id="f2" style="width:600px;height:600px;right:-200px;bottom:120px;opacity:.1"></div>
    <div id="palco" style="position:absolute;left:80px;right:80px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center"></div>
    <div id="barra" style="position:absolute;left:0;bottom:0;height:12px;background:${p.destaque};width:0"></div>
    ${rodape(nome, logo)}
    <script>
      const CENAS = ${JSON.stringify(cenas)};
      const palco = document.getElementById('palco');
      const total = CENAS.reduce((t, c) => t + c.dur, 0);
      function ease(x) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3); }
      window.render = function (t) {
        let acc = 0, idx = 0;
        for (; idx < CENAS.length - 1 && t >= acc + CENAS[idx].dur; idx++) acc += CENAS[idx].dur;
        const c = CENAS[idx], local = t - acc;
        if (palco.dataset.i !== String(idx)) {
          palco.dataset.i = String(idx);
          palco.innerHTML = '<h1 class="t" style="font-size:' + c.tam + 'px">' + c.html + '</h1>';
        }
        const e = ease(local / 0.45), sai = ease((local - (c.dur - 0.3)) / 0.3);
        palco.style.transform = 'translateY(' + ((1 - e) * 80 - sai * 40) + 'px)';
        palco.style.opacity = String(e * (1 - sai));
        document.getElementById('f1').style.transform = 'translate(' + (t * 12) + 'px,' + (t * 8) + 'px)';
        document.getElementById('f2').style.transform = 'scale(' + (1 + 0.04 * Math.sin(t)) + ')';
        document.getElementById('barra').style.width = (t / total * 100) + '%';
      };
      window.render(0);
    </script>` });
}
export { esc };
