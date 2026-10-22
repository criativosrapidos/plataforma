// Gera as imagens e os vídeos de exemplo usados no site (assets/demo e assets/videos).
// Uso: node site-fontes/gerar.js artes        -> artes da Brasa Burger (JPG)
//      node site-fontes/gerar.js icones       -> ícones do app (PNG)
//      node site-fontes/gerar.js video <cena>  -> renderiza site-fontes/videos/<cena>.html em MP4
//      node site-fontes/gerar.js previa <cena> t1 t2 ... -> quadros soltos para conferir
// Precisa do Playwright (Chromium) e do ffmpeg.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const AQUI = __dirname;
const SITE = path.join(AQUI, '..', 'site', 'assets');
const BURGER = fs.readFileSync(path.join(AQUI, 'demo', 'burger.svg.html'), 'utf8').replace(/<!--[\s\S]*?-->/, '');

// troca <!--BURGER--> pelo SVG do hambúrguer e grava uma cópia temporária ao lado do original
function montar(arquivo) {
  const html = fs.readFileSync(arquivo, 'utf8').split('<!--BURGER-->').join(BURGER);
  const tmp = arquivo.replace(/\.html$/, '.tmp.html');
  fs.writeFileSync(tmp, html);
  return tmp;
}

async function artes(b) {
  const p = await b.newPage({ viewport: { width: 1200, height: 1000 } });
  const tmp = montar(path.join(AQUI, 'demo', 'artes.html'));
  await p.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.join(SITE, 'demo'), { recursive: true });
  for (const [id, nome, tipo] of [['post', 'brasa-post-combo', 'jpeg'], ['carrossel', 'brasa-carrossel', 'jpeg'], ['stories', 'brasa-stories', 'jpeg'], ['anuncio', 'brasa-anuncio', 'jpeg'], ['avatar', 'brasa-avatar', 'png']]) {
    const out = path.join(SITE, 'demo', nome + (tipo === 'png' ? '.png' : '.jpg'));
    await p.locator('#' + id).screenshot({ path: out, type: tipo, quality: tipo === 'jpeg' ? 84 : undefined, omitBackground: tipo === 'png' });
    console.log(out);
  }
  fs.unlinkSync(tmp);
}

async function icones(b) {
  const MARCA = '<svg viewBox="0 0 100 74" fill="#101216"><rect x="14" y="15.6" width="19" height="7" rx="3.5"/><rect x="6.5" y="33.5" width="26.5" height="7" rx="3.5"/><rect x="19" y="51.3" width="14" height="7" rx="3.5"/><path d="M40.5 9.5c0-2.6 2.8-4.2 5-2.9l44.6 26.5c2.2 1.3 2.2 4.5 0 5.8L45.5 65.4c-2.2 1.3-5-.3-5-2.9z"/></svg>';
  fs.mkdirSync(path.join(SITE, 'icons'), { recursive: true });
  const p = await b.newPage();
  // [arquivo, tamanho, raio do fundo (fração), largura da marca (fração)]
  for (const [nome, t, raio, marca] of [['icon-192', 192, .22, .62], ['icon-512', 512, .22, .62], ['icon-maskable-512', 512, 0, .5], ['apple-touch-icon', 180, 0, .6], ['favicon-32', 32, .22, .7]]) {
    await p.setViewportSize({ width: t, height: t });
    await p.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${t}px;height:${t}px;border-radius:${raio * t}px;background:#FFD400;display:grid;place-items:center"><div style="width:${marca * t}px;transform:translateX(${t * .02}px)">${MARCA.replace('<svg ', '<svg style="display:block;width:100%" ')}</div></div></body></html>`);
    const out = path.join(SITE, 'icons', nome + '.png');
    await p.screenshot({ path: out, omitBackground: true });
    console.log(out);
  }
}

async function video(b, cena, tempos) {
  const arq = path.join(AQUI, 'videos', cena + '.html');
  const tmp = montar(arq);
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const D = await p.evaluate(() => window.DURATION);
  const dir = path.join(SITE, 'videos');
  fs.mkdirSync(dir, { recursive: true });
  if (tempos) {
    const out = path.join(AQUI, 'previas');
    fs.mkdirSync(out, { recursive: true });
    for (const t of tempos) { await p.evaluate(t => render(t), t); await p.screenshot({ path: path.join(out, `${cena}-${t}.png`) }); }
    console.log('prévias em', out);
  } else {
    const fps = 30, out = path.join(dir, cena + '.mp4');
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '23', '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'inherit'] });
    for (let i = 0; i < D * fps; i++) {
      await p.evaluate(t => render(t), i / fps);
      const buf = await p.screenshot({ type: 'jpeg', quality: 90 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    // capa do vídeo: o quadro marcado com window.POSTER (segundos)
    const tp = await p.evaluate(() => window.POSTER || 1);
    await p.evaluate(t => render(t), tp);
    await p.setViewportSize({ width: 1080, height: 1920 });
    await p.screenshot({ path: path.join(dir, cena + '.jpg'), type: 'jpeg', quality: 80 });
    console.log(out);
  }
  fs.unlinkSync(tmp);
}

(async () => {
  const [modo, cena, ...ts] = process.argv.slice(2);
  const b = await chromium.launch();
  if (modo === 'artes') await artes(b);
  else if (modo === 'icones') await icones(b);
  else if (modo === 'video') await video(b, cena);
  else if (modo === 'previa') await video(b, cena, ts.map(Number));
  else console.log('modo inválido');
  await b.close();
})();
