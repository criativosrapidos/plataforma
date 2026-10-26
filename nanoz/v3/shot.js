const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  for (const [nome, vw, vh, esc] of [["landing_computador", 1440, 900, 1], ["landing_celular", 390, 844, 2]]) {
    const q = await b.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: esc });
    const errs = []; q.on("pageerror", e => errs.push(e.message));
    await q.goto("file://" + path.resolve(__dirname, "landing/index.html")); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(900);
    await q.screenshot({ path: path.resolve(__dirname, "saida/" + nome + ".jpg"), fullPage: true, type: "jpeg", quality: 86 });
    await q.screenshot({ path: path.resolve(__dirname, "saida/" + nome + "_topo.jpg"), type: "jpeg", quality: 90 });
    console.log(nome, errs);
  }
  await b.close();
})();
