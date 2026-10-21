const { chromium } = require('playwright'); const path = require('path');
(async () => {
 const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 const p = await b.newPage({ viewport: { width: 1700, height: 2100 }, deviceScaleFactor: 2 });
 await p.goto('file://' + path.resolve('logo.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
 await (await p.$('#prancha')).screenshot({ path: 'prancha.png', omitBackground: false });
 await (await p.$('#logo_horizontal_clara')).screenshot({ path: 'logo_horizontal_clara.png', omitBackground: true });
 await (await p.$('#logo_horizontal_escura')).screenshot({ path: 'logo_horizontal_escura.png', omitBackground: true });
 await (await p.$('#logo_vertical')).screenshot({ path: 'logo_vertical.png', omitBackground: true });
 await (await p.$('#simbolo')).screenshot({ path: 'simbolo.png', omitBackground: true });
 await (await p.$('#selo_perfil')).screenshot({ path: 'selo_perfil.png', omitBackground: true });
 await b.close();
})();
