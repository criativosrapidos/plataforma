// Exporta cada elemento [data-shot] de uma página HTML como PNG/JPG (Chromium headless).
// Uso: node shot.js <arquivo.html> <pasta_saida>
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const [html, out] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 2000, height: 1200 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.resolve(html));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  const els = await page.$$("[data-shot]");
  for (const el of els) {
    const name = await el.getAttribute("data-shot");
    const png = name.endsWith(".png");
    await el.screenshot({ path: path.join(out, name), type: png ? "png" : "jpeg", ...(png ? { omitBackground: true } : { quality: 94 }) });
  }
  console.log(els.length, "peças exportadas");
  await browser.close();
})();
