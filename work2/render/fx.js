// Efeitos dinâmicos: câmera com zoom de impacto/tremida, partículas, brilho e stickers
// Impactos (tempo, força) sincronizados com as palavras fortes
const PUNCHES = [
  [0.0, 0.05], [2.4, 0.07], [5.26, 0.06], [6.88, 0.06], [8.16, 0.035], [9.41, 0.035], [10.51, 0.035],
  [11.13, 0.04], [12.09, 0.04], [13.04, 0.04], [14.21, 0.06], [16.2, 0.05], [19.02, 0.08],
  [20.82, 0.05], [22.73, 0.09], [26.03, 0.08], [28.0, 0.06],
];

function rand(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

function camera(t) {
  let z = 0, sx = 0, sy = 0;
  PUNCHES.forEach(([at, k], i) => {
    const d = t - at;
    if (d < 0 || d > 0.5) return;
    const e = Math.exp(-d * 9);
    z += k * e;
    sx += Math.sin(d * 90 + i) * 14 * e * (k / 0.06);
    sy += Math.cos(d * 77 + i) * 10 * e * (k / 0.06);
  });
  // respiração lenta contínua
  z += 0.012 * Math.sin(t * 1.3);
  return { z, sx, sy };
}

function applyCamera(t) {
  const c = camera(t);
  ctx.translate(W / 2 + c.sx, H / 2 + c.sy);
  ctx.scale(1 + c.z, 1 + c.z);
  ctx.translate(-W / 2, -H / 2);
}

// Campo de partículas (poeira brilhante) — determinístico por tempo
function particles(t, color, n = 60, alpha = 0.6) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const r1 = rand(i), r2 = rand(i + 50), r3 = rand(i + 99);
    const speed = 40 + r3 * 120;
    const x = (r1 * W + Math.sin(t * 0.8 + i) * 30) % W;
    const y = ((r2 * H - t * speed) % H + H) % H;
    const s = 2 + r3 * 5;
    ctx.globalAlpha = alpha * (0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i)));
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// Explosão radial de faíscas a partir de (cx, cy) no tempo `at`
function burst(t, at, cx, cy, color, n = 40, reach = 520) {
  const d = t - at;
  if (d < 0 || d > 0.9) return;
  const p = easeOut(d / 0.9);
  ctx.save();
  ctx.strokeStyle = color; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = rand(i + at) * Math.PI * 2;
    const len = reach * (0.5 + rand(i + 7 + at) * 0.5);
    const r0 = len * p * 0.6, r1 = len * p;
    ctx.globalAlpha = 1 - p;
    ctx.lineWidth = 3 + rand(i + 3) * 5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();
}

// Brilho radial atrás de um destaque
function glow(cx, cy, r, color, alpha) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); ctx.restore();
}

// Anel pontilhado girando (como na referência)
function dottedRing(cx, cy, rx, ry, t, color, alpha = 0.5) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2 + t * 0.6;
    const s = 2 + 2 * Math.abs(Math.sin(i * 1.7 + t * 3));
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, s, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// Sticker inclinado com sombra; entra girando
function sticker(str, cx, cy, size, t, at, opts = {}) {
  const { rot = -0.18, bgc = C.WH, fg = C.K, struck = null } = opts;
  const p = easeOutBack(prog(t, at, 0.35));
  if (p <= 0) return;
  const w = measure(str, size) + size * 0.9, h = size * 1.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot + (1 - clamp(p)) * 1.2);
  ctx.scale(p, p);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(-w / 2 + 8, -h / 2 + 12, w, h, 16); ctx.fill();
  ctx.fillStyle = bgc; roundRect(-w / 2, -h / 2, w, h, 16); ctx.fill();
  text(str, 0, size * 0.36, size, fg, { align: 'center' });
  if (struck !== null) {
    const s = easeOut(prog(t, struck, 0.2));
    if (s > 0) { ctx.fillStyle = C.K; roundRect(-w / 2 + 10, -6, (w - 20) * s, 12, 6); ctx.fill(); }
  }
  ctx.restore();
}

// Chip com ícone de check (usos)
function chip(str, cx, cy, t, at) {
  const p = easeOutBack(prog(t, at, 0.3));
  if (p <= 0) return;
  const size = 44, w = measure(str, size) + 150, h = 84;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; roundRect(-w / 2 + 6, -h / 2 + 8, w, h, 42); ctx.fill();
  ctx.fillStyle = C.WH; roundRect(-w / 2, -h / 2, w, h, 42); ctx.fill();
  ctx.fillStyle = C.K; ctx.beginPath(); ctx.arc(w / 2 - 46, 0, 26, 0, 7); ctx.fill();
  ctx.strokeStyle = C.Y; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(w / 2 - 58, 0); ctx.lineTo(w / 2 - 49, 10); ctx.lineTo(w / 2 - 33, -9); ctx.stroke();
  ctx.restore();
  text(str, cx - 46, cy + 16, size, C.K, { align: 'center', alpha: clamp(p) });
}
