
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.resolve("identidade.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  await (await p.$("#p1")).screenshot({ path: "saida/jlfitness_identidade_visual.png" });
  await (await p.$("#p2")).screenshot({ path: "saida/jlfitness_instagram_proposta.png" });
  await b.close();
})();