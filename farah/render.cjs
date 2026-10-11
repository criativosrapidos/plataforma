// Captura os quadros de cena.html com Chromium headless e envia ao ffmpeg.
// Uso: node render.cjs <saida.mp4> [audio.mp3] [--quadros t1,t2,...]  (--quadros: só salva PNGs)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');

const ROOT = __dirname;
const args = process.argv.slice(2);
const saida = path.resolve(args[0]);
const audio = args[1] && !args[1].startsWith('--') ? path.resolve(args[1]) : null;
const qi = args.indexOf('--quadros');
const soQuadros = qi >= 0 ? args[qi + 1].split(',').map(Number) : null;

const timings = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/timings.json')));
const cues = JSON.parse(fs.readFileSync(path.join(ROOT, 'cues.json'))).cues;
let fotos = {};
try { fotos = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/mapa_fotos.json'))).fotos; } catch {}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.addInitScript(d => { window.DATA = d; }, { cues, timings, fotos });
  await page.goto('file://' + path.join(ROOT, 'cena.html'));
  await page.evaluate(() => window.PRONTO);

  if (soQuadros) {
    fs.mkdirSync(saida, { recursive: true });
    for (const t of soQuadros) {
      await page.evaluate(t => renderAt(t), t);
      await page.screenshot({ path: path.join(saida, `q_${t.toFixed(2)}.png`) });
    }
    await browser.close(); return;
  }

  const fps = timings.fps, n = Math.round(timings.duracao * fps);
  const ff = ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
  if (audio) ff.push('-i', audio);
  ff.push('-map', '0:v');
  if (audio) ff.push('-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-af', 'apad');
  ff.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps),
          '-t', String(timings.duracao), '-movflags', '+faststart', saida);
  const p = spawn('ffmpeg', ['-v', 'error', ...ff], { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => renderAt(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!p.stdin.write(buf)) await new Promise(r => p.stdin.once('drain', r));
    if (i % 90 === 0) process.stdout.write(`quadro ${i}/${n}\n`);
  }
  p.stdin.end();
  await new Promise(r => p.on('close', r));
  await browser.close();
  console.log('ok', saida);
})();
