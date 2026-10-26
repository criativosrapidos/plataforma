const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: 2 });
  await p.goto("file://" + path.resolve("logos.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await (await p.$("#g")).screenshot({ path: "foto_grupo_whatsapp.png" });
  await (await p.$("#h")).screenshot({ path: "jlfitness_logo_horizontal.png", omitBackground: true });
  await (await p.$("#s")).screenshot({ path: "jlfitness_selo_perfil.png", omitBackground: true });
  await b.close();
})();
