const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1700, height: 2300 }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.resolve(__dirname, "identidade.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  await (await p.$("#prancha")).screenshot({ path: path.resolve(__dirname, "saida/nanoz_identidade_visual_v2.png") });
  await (await p.$("#cartoes")).screenshot({ path: path.resolve(__dirname, "saida/identidade/cartao_de_visita.png") });
  for (const id of ["logo_principal", "perfil_instagram", "logo_horizontal_escura", "logo_horizontal_clara"])
    await (await p.$("#" + id)).screenshot({ path: path.resolve(__dirname, "saida/identidade/" + id + ".png") });
  for (const [nome, vw, vh, esc] of [["landing_computador", 1440, 900, 1], ["landing_celular", 390, 844, 2]]) {
    const q = await b.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: esc });
    await q.goto("file://" + path.resolve(__dirname, "landing/index.html")); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(600);
    await q.screenshot({ path: path.resolve(__dirname, "saida/" + nome + ".jpg"), fullPage: true, type: "jpeg", quality: 86 });
  }
  await b.close();
})();
