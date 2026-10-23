// Prints da landing: desktop (1440) e celular (390), página inteira.
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  for (const [nome, w, h, dpr] of [["lp_desktop.jpg", 1440, 900, 1], ["lp_celular.jpg", 390, 844, 2]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    await p.goto("file://" + path.resolve(__dirname, "index.html"));
    await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: "header{position:relative!important} .zap{display:none}" });
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(__dirname, "saida", nome), fullPage: true, type: "jpeg", quality: 90 });
  }
  await b.close();
})();
