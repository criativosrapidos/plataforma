// Captura quadro a quadro da animação HTML (render(t) determinístico) com Chromium headless.
// Uso: node captura.js <fps> <duracao> <pasta>      ou      node captura.js preview <pasta> t1 t2 ...
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.resolve(__dirname, "anuncio.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  let times, dir;
  if (args[0] === "preview") { dir = args[1]; times = args.slice(2).map(Number); }
  else { const fps = +args[0], dur = +args[1]; dir = args[2]; times = [...Array(Math.round(fps * dur)).keys()].map(i => i / fps); }
  for (let i = 0; i < times.length; i++) {
    await page.evaluate(t => window.render(t), times[i]);
    const name = args[0] === "preview" ? `p_${times[i].toFixed(2)}.jpg` : `f_${String(i).padStart(5, "0")}.jpg`;
    await page.screenshot({ path: path.join(dir, name), type: "jpeg", quality: 94 });
    if (i % 150 === 0) console.log("quadro", i, "/", times.length);
  }
  await browser.close();
})();
