// Exporta a logo recriada: SVG (vetor) e PNG transparente em alta, nas versões cor, selo, negativo e branco.
const fs = require("fs"), path = require("path");
global.window = {};
eval(fs.readFileSync(path.join(__dirname, "brand.js"), "utf8"));
const M = window.MULTAGRO, out = path.join(__dirname, "../saida/logo");
for (const t of ["cor", "badge", "negativo", "branco"]) fs.writeFileSync(path.join(out, `multagro_logo_${t}.svg`), M.emblema(2000, t, "x"));
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 2400, height: 2400 } });
  for (const t of ["cor", "badge", "negativo", "branco"]) {
    await p.setContent(`<html><body style="margin:0;background:transparent"><div id="l" style="display:inline-block">${M.emblema(2000, t, "x")}</div></body></html>`);
    await (await p.$("#l svg")).screenshot({ path: path.join(out, `multagro_logo_${t}.png`), omitBackground: true });
  }
  await b.close();
})();
