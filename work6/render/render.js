// Renderiza quadros: node render.js <saida_dir> [t1,t2,...] (prévia) ou todos os 900 quadros em stream para ffmpeg
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const preview = process.argv[3];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.evaluate(() => document.fonts.load('800 100px Inter'));
  await page.waitForTimeout(300);
  const canvas = await page.$('#c');
  const grab = async (t, safe) => {
    await page.evaluate(([t, s]) => { window.SHOW_SAFE = s; window.renderFrame(t); }, [t, safe]);
    return canvas.screenshot({ type: 'png' });
  };
  if (preview) {
    const fs = require('fs');
    for (const t of preview.split(',').map(Number)) fs.writeFileSync(`${out}/prev_${t.toFixed(2)}.png`, await grab(t, true));
  } else {
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < 900; f++) {
      const buf = await grab(f / 30, false);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % 150 === 0) console.log('frame', f);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
  }
  await browser.close();
})();
