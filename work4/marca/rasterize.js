// Gera PNG transparente em alta resolução a partir dos SVGs da logo
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 2400, height: 933 } });
  for (const k of ['marrom', 'branca', 'cobre']) {
    const svg = fs.readFileSync(path.join(__dirname, `araujo-logo-${k}.svg`), 'utf8').replace('width="1800" height="700"', 'width="2400" height="933"');
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, `araujo-logo-${k}.png`), omitBackground: true, clip: { x: 0, y: 0, width: 2400, height: 933 } });
  }
  await b.close(); console.log('ok');
})();
