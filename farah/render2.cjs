// Renderiza cena2.html quadro a quadro e junta com a trilha.
// Uso: node render2.cjs <saida.mp4> <audio> <duracao> [--quadros t1,t2,...]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = __dirname, args = process.argv.slice(2);
const saida = path.resolve(args[0]), audio = path.resolve(args[1]), dur = +args[2];
const qi = args.indexOf('--quadros'), soQuadros = qi >= 0 ? args[qi + 1].split(',').map(Number) : null;
const FPS = 30;
const palavras = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/palavras_v2.json')));
const fotos = {}, produtos = {};
for (const f of fs.readdirSync(path.join(ROOT, 'assets/fotos'))) if (/^praia_.*\.jpg$/.test(f)) fotos[f.slice(0, -4)] = 'assets/fotos/' + f;
for (const f of ['bebida', 'refri', 'energetico', 'doces', 'chinelo', 'bone', 'carregador']) produtos[f] = `assets/produtos/${f}.png`;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => m.type() === 'error' && console.error('pagina:', m.text()));
  page.on('pageerror', e => console.error('erro na pagina:', e.message));
  await page.addInitScript(d => { window.DATA = d; }, { palavras, fotos, produtos, fps: FPS });
  await page.goto('file://' + path.join(ROOT, 'cena2.html'));
  await page.evaluate(() => window.PRONTO);
  if (soQuadros) {
    fs.mkdirSync(saida, { recursive: true });
    for (const t of soQuadros) { await page.evaluate(t => renderAt(t), t); await page.screenshot({ path: path.join(saida, `q_${t.toFixed(2)}.png`) }); }
    await browser.close(); return;
  }
  const n = Math.round(dur * FPS);
  const p = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', audio,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-af', 'apad', '-t', String(dur), '-movflags', '+faststart', saida],
    { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => renderAt(t), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!p.stdin.write(buf)) await new Promise(r => p.stdin.once('drain', r));
  }
  p.stdin.end(); await new Promise(r => p.on('close', r)); await browser.close(); console.log('ok', saida);
})();
