const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage(); await p.goto('file://' + path.resolve(__dirname, 'index.html'));
await p.evaluate(() => document.fonts.load('800 100px Inter')); console.log(await p.evaluate(() => window.checkSafe())); await b.close(); })();
