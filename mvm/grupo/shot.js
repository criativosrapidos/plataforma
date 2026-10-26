const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1000, height: 1000 } });
  await p.goto("file://" + path.resolve(__dirname, "foto.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await (await p.$("#g")).screenshot({ path: path.resolve(__dirname, "foto_grupo_whatsapp.png") });
  await b.close();
})();
