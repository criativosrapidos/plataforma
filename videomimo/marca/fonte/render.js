// Renderiza elementos HTML em PNG. Uso: node render.js pagina.html saida_dir id1:arquivo1 id2:arquivo2 ...
const { chromium } = require(process.env.PW);
const path = require('path');
(async () => {
  const [pagina, saida, ...alvos] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 1 })).newPage();
  await p.goto('file://' + path.resolve(pagina));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  for (const a of alvos) {
    const [id, arq] = a.split(':');
    await p.locator('#' + id).screenshot({ path: path.join(saida, arq), omitBackground: true });
  }
  await b.close();
})();
