const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [file, outDir, sel, w] = process.argv.slice(2);
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  const page = await browser.newPage({ viewport: { width: Number(w || 2400), height: 1400 } });
  await page.goto('file://' + path.resolve(file), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => [document.fonts.check('800 40px "Barlow Condensed"'), document.fonts.check('40px Figtree'), document.fonts.check('40px "JetBrains Mono"')]);
  console.log('fonts', ok);
  if (sel === 'shots') {
    const els = await page.$$('[data-shot]');
    for (const el of els) {
      const name = await el.getAttribute('data-shot');
      await el.screenshot({ path: path.join(outDir, name + '.png') });
    }
    console.log('rendered', els.length);
  }
  await browser.close();
})();
