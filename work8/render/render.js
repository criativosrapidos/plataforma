// Renderiza um story: node render.js <id> <saida.mp4 | pasta> [t1,t2,...]
// Com tempos: prévias PNG na pasta. Sem tempos: MP4 com a duração do story (30 fps).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [id, out, preview] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html') + '?s=' + id);
  await page.evaluate(() => Promise.all([document.fonts.load('800 100px Inter'), document.fonts.load('italic 800 100px Inter'), document.fonts.load('400 100px Inter'), document.fonts.load('600 100px Inter')]));
  await page.evaluate(() => window.ready());
  await page.waitForTimeout(300);
  const canvas = await page.$('#c');
  const grab = async (t, safe) => {
    await page.evaluate(([t, s]) => { window.SHOW_SAFE = s; window.renderFrame(t); }, [t, safe]);
    return canvas.screenshot({ type: 'png' });
  };
  if (preview) {
    const fs = require('fs');
    fs.mkdirSync(out, { recursive: true });
    for (const t of preview.split(',').map(Number)) fs.writeFileSync(`${out}/${id}_${t.toFixed(2).padStart(5, '0')}.png`, await grab(t, !id.startsWith('cover')));
  } else {
    const n = Math.round((await page.evaluate(() => window.DURATION)) * 30);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < n; f++) {
      const buf = await grab(f / 30, false);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
  }
  await browser.close();
})();
