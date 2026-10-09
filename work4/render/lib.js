// Utilitários de desenho para o vídeo 1080x1920
const W = 1080, H = 1920;
// Paleta Araujo Security: cobre, marrom e creme
const C = { Y: '#B8692A', K: '#2B201A', OW: '#F6F1EC', WH: '#FFFFFF', G: '#7A6A60', CU: '#B8692A', CU2: '#D9A066', BR: '#3A2A22' };
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
  ctx.letterSpacing = `${-0.025 * size}px`;
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

// Logo Araujo Security (recortada do material da cliente), proporção preservada
const LOGOS = {};
['branca', 'marrom'].forEach((k) => { const im = new Image(); im.src = `../marca/araujo-logo-${k}.png`; LOGOS[k] = im; });
function drawLogo(cx, cy, maxW, alpha = 1, variante = 'marrom') {
  const im = LOGOS[variante];
  if (!im.complete || !im.naturalWidth) return;
  const s = maxW / im.naturalWidth, w = im.naturalWidth * s, h = im.naturalHeight * s;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h); ctx.restore();
}
