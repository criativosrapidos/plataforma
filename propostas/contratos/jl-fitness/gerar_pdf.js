// Gera o PDF do contrato a partir de contrato.html: node gerar_pdf.js
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'contrato.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({
    path: path.join(__dirname, 'contrato-jl-fitness-plano-crescimento.pdf'),
    format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;margin:0 15mm;padding-top:5px;border-top:1.5px solid #FFD400;font-family:Arial;font-size:7.5px;color:#5A5D66;display:flex;justify-content:space-between"><span><b style="color:#101216">criativos rápidos</b> · conteúdo que vende, entregue em 24 h</span><span>CNPJ 67.844.754/0001-07 · página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>',
  });
  await b.close();
})();
