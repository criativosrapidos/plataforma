const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [mode] = process.argv.slice(2);
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + path.resolve('src/video2.html'), { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  const el = await pg.$('#v');
  const fps = 30, dur = await pg.evaluate(() => window.DUR);
  const times = mode === 'test' ? [0.9, 3.6, 6.3, 8.0, 10.8, 14.6, 17.5, 23.0, 26.5, 29, 31.8, 35.6] : Array.from({ length: Math.round(dur * fps) }, (_, i) => i / fps);
  for (let i = 0; i < times.length; i++) {
    await pg.evaluate(t => window.render(t), times[i]);
    await el.screenshot({ path: path.join('../video/f2', (mode === 'test' ? 't' : 'f') + String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 88 });
  }
  console.log('frames', times.length);
  await b.close();
})();
