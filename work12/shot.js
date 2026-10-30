// node shot.js <saida_dir> — gera os 3 fundos em PNG (1920x1080)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.error(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'meet.html'));
  await p.evaluate(() => Promise.all([document.fonts.load('800 50px Inter'), document.fonts.load('italic 800 50px Inter'), document.fonts.load('400 50px Inter'), document.fonts.load('700 50px Inter')]));
  for (const k of ['escuro', 'amarelo', 'claro']) { await p.evaluate((k) => window.draw(k), k); await (await p.$('#c')).screenshot({ path: `${out}/meet-criativos-rapidos-${k}.png` }); }
  await b.close();
})();
