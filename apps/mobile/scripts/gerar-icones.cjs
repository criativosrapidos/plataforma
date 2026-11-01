// Gera os PNGs de ícone, splash, favicon e notificação a partir do símbolo da marca
// (apps/web/public/simbolo.svg). Uso: node scripts/gerar-icones.cjs
// Precisa do Playwright (npm i -g playwright && npx playwright install chromium).
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const RAIZ = path.join(__dirname, "..");
const SAIDA = path.join(RAIZ, "assets", "images");
const PUBLICO = path.join(RAIZ, "public");
const PAPEL = "#F5F6F1";

// Símbolo: bolinha de gabarito azul com "!" branco e ponto amarelo de notificação.
const simbolo = (borda = PAPEL) => `
  <circle cx="46" cy="54" r="38" fill="#1F3FD1"/>
  <rect x="40" y="30" width="12" height="32" rx="6" fill="#FFFFFF"/>
  <circle cx="46" cy="75" r="6.5" fill="#FFFFFF"/>
  <circle cx="80" cy="20" r="15" fill="#FFE14D" stroke="${borda}" stroke-width="6"/>`;

// Silhueta de uma cor só (Android: ícone monocromático e ícone de notificação usam só o alfa).
const silhueta = `
  <defs><mask id="m"><rect width="100" height="100" fill="#fff"/>
    <rect x="40" y="30" width="12" height="32" rx="6" fill="#000"/>
    <circle cx="46" cy="75" r="6.5" fill="#000"/>
    <circle cx="80" cy="20" r="21" fill="#000"/></mask></defs>
  <circle cx="46" cy="54" r="38" fill="#FFFFFF" mask="url(#m)"/>
  <circle cx="80" cy="20" r="15" fill="#FFFFFF"/>`;

/** O símbolo ocupa x 8–95 e y 5–92; centraliza na arte. `escala` = fração do lado ocupada. */
function svg({ lado, fundo, conteudo, escala }) {
  const s = (lado * escala) / 87;
  const tx = lado / 2 - 51.5 * s;
  const ty = lado / 2 - 48.5 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
    ${fundo ? `<rect width="${lado}" height="${lado}" fill="${fundo}"/>` : ""}
    <g transform="translate(${tx} ${ty}) scale(${s})">${conteudo}</g></svg>`;
}

const ARTES = [
  // iOS/Android (legado) e lojas: fundo papel, sem transparência.
  { arquivo: path.join(SAIDA, "icon.png"), lado: 1024, fundo: PAPEL, conteudo: simbolo(), escala: 0.7 },
  // Android adaptive: só o símbolo na zona segura (66%); fundo é a cor em app.config.ts.
  { arquivo: path.join(SAIDA, "android-icon-foreground.png"), lado: 1024, conteudo: simbolo(), escala: 0.5 },
  { arquivo: path.join(SAIDA, "android-icon-monochrome.png"), lado: 1024, conteudo: silhueta, escala: 0.5 },
  // Splash: símbolo sobre o papel (cor de fundo vem do plugin expo-splash-screen).
  { arquivo: path.join(SAIDA, "splash-icon.png"), lado: 1024, conteudo: simbolo(), escala: 0.92 },
  { arquivo: path.join(SAIDA, "favicon.png"), lado: 64, conteudo: simbolo("#FFFFFF"), escala: 0.94 },
  // Ícone da notificação no Android: branco com transparência.
  { arquivo: path.join(SAIDA, "notification-icon.png"), lado: 96, conteudo: silhueta, escala: 0.86 },
  // PWA
  { arquivo: path.join(PUBLICO, "icon-192.png"), lado: 192, fundo: PAPEL, conteudo: simbolo(), escala: 0.7 },
  { arquivo: path.join(PUBLICO, "icon-512.png"), lado: 512, fundo: PAPEL, conteudo: simbolo(), escala: 0.7 },
  { arquivo: path.join(PUBLICO, "apple-touch-icon.png"), lado: 180, fundo: PAPEL, conteudo: simbolo(), escala: 0.7 },
];

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  fs.mkdirSync(PUBLICO, { recursive: true });
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  for (const a of ARTES) {
    await pagina.setViewportSize({ width: a.lado, height: a.lado });
    await pagina.setContent(`<html><body style="margin:0;background:transparent">${svg(a)}</body></html>`);
    await pagina.locator("svg").screenshot({ path: a.arquivo, omitBackground: true });
    console.log("gerado", path.relative(RAIZ, a.arquivo));
  }
  await navegador.close();
})();
