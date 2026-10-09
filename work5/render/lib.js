// Utilitários de desenho para o vídeo 1080x1920
const W = 1080, H = 1920;
// Paleta estética (Alessandra Mendes): vinho, nude, rosé e dourado
// v3: preto, dourado champanhe e nude (estética premium)
const C = { Y: '#E3C08D', K: '#120E0D', K2: '#1E1715', OW: '#F7EFE8', WH: '#FFFFFF', G: '#8E7B72', GOLD: '#E3C08D', GOLD2: '#C9A06A', NUDE: '#EBD3C4', ROSE: '#C98B7B', INK: '#2A1E1A', CREAM: '#F7EFE8' };

// Texto serifado itálico para toques elegantes
function serif(str, x, y, size, color, opts = {}) {
  const { align = 'left', alpha = 1 } = opts;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.font = `italic 400 ${size}px Caladea`; ctx.letterSpacing = '0px';
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y); ctx.restore();
}
// Área segura do Reels: evita topo, lateral direita e bloco de baixo
const SAFE = { x0: 80, x1: 930, y0: 250, y1: 1480 };
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, d) => clamp((t - a) / d);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const easeOutBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

function bg(color) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }

function font(size, weight = 800) {
  ctx.font = `${weight} ${size}px Inter`;
  ctx.letterSpacing = `${-0.03 * size}px`;
}

function measure(text, size, weight = 800) { font(size, weight); return ctx.measureText(text).width; }

// Texto com skew opcional (-9° = palavra de destaque)
function text(str, x, y, size, color, opts = {}) {
  const { weight = 800, align = 'left', skew = 0, alpha = 1, base = 'alphabetic' } = opts;
  ctx.save();
  ctx.globalAlpha *= alpha;
  font(size, weight);
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  ctx.translate(x, y);
  if (skew) ctx.transform(1, 0, Math.tan(skew * Math.PI / 180), 1, 0, 0);
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

// Palavra de destaque sobre faixa amarela inclinada (texto preto)
function stripWord(str, x, y, size, opts = {}) {
  const { align = 'left', alpha = 1, reveal = 1, stripColor = C.Y, textColor = C.K } = opts;
  const w = measure(str, size);
  const padX = size * 0.22, top = y - size * 0.86, h = size * 1.08;
  let x0 = align === 'center' ? x - w / 2 : x;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x0, y);
  ctx.transform(1, 0, Math.tan(-9 * Math.PI / 180), 1, 0, 0);
  ctx.fillStyle = stripColor;
  ctx.fillRect(-padX, top - y, (w + padX * 2) * reveal, h);
  ctx.restore();
  if (reveal > 0.35) text(str, x0, y, size, textColor, { skew: -9, alpha: alpha * clamp((reveal - 0.35) / 0.3) });
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// Riscos de velocidade da marca (três barras arredondadas)
function speedLines(x, y, len, thick, color, gap) {
  ctx.save(); ctx.fillStyle = color;
  const lens = [len * 0.7, len, len * 0.55];
  for (let i = 0; i < 3; i++) {
    roundRect(x + (len - lens[i]), y + i * gap, lens[i], thick, thick / 2); ctx.fill();
  }
  ctx.restore();
}

// Logo: usa o arquivo oficial de /marca se existir; senão, o símbolo provisório
const logoImg = new Image();
let logoReady = false;
logoImg.onload = () => { logoReady = true; };
logoImg.onerror = () => { logoReady = false; };
logoImg.src = '../../marca/logo-horizontal-preta.png';


function drawLogo(cx, cy, maxW, alpha = 1, cor = C.K) {
  ctx.save(); ctx.globalAlpha *= alpha;
  if (logoReady) {
    // proporção original preservada: nunca esticar nem inclinar
    if (cor !== C.K) { ctx.filter = 'invert(1)'; }
    const s = maxW / logoImg.naturalWidth;
    const w = logoImg.naturalWidth * s, h = logoImg.naturalHeight * s;
    ctx.drawImage(logoImg, cx - w / 2, cy - h / 2, w, h);
  } else {
    const s = maxW / 760;
    ctx.translate(cx - 380 * s, cy - 110 * s); ctx.scale(s, s);
    speedLines(0, 52, 120, 22, cor, 42);
    ctx.fillStyle = cor;
    ctx.beginPath(); ctx.moveTo(150, 30); ctx.lineTo(300, 110); ctx.lineTo(150, 190); ctx.closePath();
    ctx.lineJoin = 'round'; ctx.lineWidth = 26; ctx.strokeStyle = cor; ctx.stroke(); ctx.fill();
    ctx.restore(); ctx.save(); ctx.globalAlpha *= alpha;
    ctx.translate(cx - 380 * s, cy - 110 * s); ctx.scale(s, s);
    text('criativos', 340, 100, 96, cor);
    text('rápidos', 340, 192, 96, cor);
  }
  ctx.restore();
}
