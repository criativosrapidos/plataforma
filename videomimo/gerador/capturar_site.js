const { chromium } = require(process.env.PW);
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, colorScheme: 'light', permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/plataforma/videomimo/index.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const v = document.getElementById('demo'); v.pause(); v.currentTime = 2.6; });
  await p.waitForTimeout(800);
  await p.screenshot({ path: out + '/pagina.png', fullPage: true });
  const pos = await p.evaluate(() => ({
    precos: document.getElementById('precos').offsetTop,
    pedido: document.getElementById('pedido').offsetTop,
    total: document.body.scrollHeight,
    botao: document.querySelector('[data-plano="especial"]').getBoundingClientRect().top + scrollY,
  }));
  require('fs').writeFileSync(out + '/pos.json', JSON.stringify(pos));
  // pedido: preencher passo a passo
  await p.evaluate(() => document.getElementById('pedido').scrollIntoView());
  await p.fill('#f-para', ''); await p.fill('#f-de', ''); await p.fill('#f-msg', '');
  await p.selectOption('#f-plano', 'especial');
  let n = 0; const snap = async () => p.screenshot({ path: `${out}/pedido_${String(n++).padStart(3, '0')}.png` });
  await snap();
  for (const [sel, txt] of [['#f-para', 'Ana'], ['#f-de', 'João'], ['#f-msg', 'Feliz aniversário, meu amor!']]) {
    for (let i = 1; i <= txt.length; i++) { await p.fill(sel, txt.slice(0, i)); if (i % 2 === 0 || i === txt.length) await snap(); }
  }
  await p.check('#f-qr'); await snap();
  await p.click('#copiar'); await p.waitForTimeout(300); await snap();
  await b.close();
})();
