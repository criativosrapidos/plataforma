// node shot_office.js <foto> <x> <y> <largura> <modo> <saida_sem_ext> — gera normal e espelhado
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [src, x, y, w, mode, out] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.error(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'office.html'));
  await p.evaluate(() => Promise.all([document.fonts.load('800 50px Inter'), document.fonts.load('italic 800 50px Inter'), document.fonts.load('400 50px Inter')]));
  const url = 'file://' + path.resolve(src);
  for (const m of [false, true]) {
    await p.evaluate(([u, x, y, w, m, mode]) => window.compose(u, +x, +y, +w, m, mode), [url, x, y, w, m, mode]);
    await (await p.$('#c')).screenshot({ path: `${out}${m ? '-espelhado' : ''}.png` });
  }
  await b.close();
})();
