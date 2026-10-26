const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1700, height: 2200 }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.resolve(__dirname, "identidade.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await (await p.$("#prancha")).screenshot({ path: "saida/nanoz_identidade_visual.png" });
  for (const id of ["logo_principal", "perfil_instagram", "simbolo_nz"])
    await (await p.$("#" + id)).screenshot({ path: "saida/identidade/" + id + ".png", omitBackground: true });
  const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await d.goto("file://" + path.resolve(__dirname, "landing/index.html")); await d.evaluate(() => document.fonts.ready); await d.waitForTimeout(500);
  await d.screenshot({ path: "saida/landing_computador.jpg", fullPage: true, type: "jpeg", quality: 88 });
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await m.goto("file://" + path.resolve(__dirname, "landing/index.html")); await m.evaluate(() => document.fonts.ready); await m.waitForTimeout(500);
  await m.screenshot({ path: "saida/landing_celular.jpg", fullPage: true, type: "jpeg", quality: 85 });
  await b.close();
})();
