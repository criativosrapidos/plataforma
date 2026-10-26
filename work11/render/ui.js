// Telas simplificadas dos apps (Instagram, Facebook, Business Suite) para o tutorial.
// Tela do celular: 440 x 820 unidades (ver phone() em comps.js).
const SW = 440, SH = 820;
const IG = ['#F9CE34', '#EE2A7B', '#6228D7'], FB = '#1877F2';

function appIcon(kind, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (kind === 'ig') {
    const g = ctx.createLinearGradient(-50, 50, 50, -50); g.addColorStop(0, IG[0]); g.addColorStop(0.5, IG[1]); g.addColorStop(1, IG[2]);
    ctx.fillStyle = g; roundRect(-50, -50, 100, 100, 28); ctx.fill();
    ctx.strokeStyle = C.WH; ctx.lineWidth = 8; roundRect(-28, -28, 56, 56, 16); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.stroke();
    ctx.fillStyle = C.WH; ctx.beginPath(); ctx.arc(17, -17, 4.5, 0, 7); ctx.fill();
  } else if (kind === 'fb') {
    ctx.fillStyle = FB; roundRect(-50, -50, 100, 100, 28); ctx.fill();
    text('f', 6, 36, 96, C.WH, { align: 'center', weight: 800 });
  } else {
    ctx.fillStyle = FB; roundRect(-50, -50, 100, 100, 28); ctx.fill();
    ctx.strokeStyle = C.WH; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(-14, 0, 16, 12, 0, 0, 7); ctx.ellipse(14, 0, 16, 12, 0, 0, 7); ctx.stroke();
  }
  ctx.restore();
}

// barra superior do app
function topBar(title, opts = {}) {
  ctx.fillStyle = C.WH; ctx.fillRect(0, 0, SW, 110);
  ctx.fillStyle = '#E6E6EA'; ctx.fillRect(0, 109, SW, 1);
  if (opts.back) { ctx.strokeStyle = C.K; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(42, 60); ctx.lineTo(28, 74); ctx.lineTo(42, 88); ctx.stroke(); }
  text(title, opts.back ? 64 : 26, 86, opts.big ? 34 : 28, opts.color || C.K, { weight: 800 });
  if (opts.menu) { ctx.fillStyle = C.K; for (let i = 0; i < 3; i++) roundRect(380, 62 + i * 11, 34, 5, 2.5), ctx.fill(); }
}

// item de lista; hi = 0..1 destaque amarelo
function row(label, y, hi = 0, opts = {}) {
  if (hi > 0) { ctx.fillStyle = `rgba(255,212,0,${0.55 * hi})`; roundRect(12, y - 34, SW - 24, 64, 14); ctx.fill(); }
  if (opts.icon) opts.icon(46, y - 2);
  text(label, opts.icon ? 86 : 30, y + 9, 24, C.K, { weight: hi > 0.5 ? 800 : 600 });
  if (opts.right) text(opts.right, SW - 30, y + 9, 22, opts.rightColor || FB, { align: 'right', weight: 800 });
  else { ctx.strokeStyle = '#B9BBC1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(SW - 36, y - 8); ctx.lineTo(SW - 28, y); ctx.lineTo(SW - 36, y + 8); ctx.stroke(); }
}

function button(label, y, color, hi = 0, w = SW - 60) {
  const x = (SW - w) / 2;
  if (hi > 0) { ctx.fillStyle = `rgba(255,212,0,${0.8 * hi})`; roundRect(x - 8, y - 38, w + 16, 76, 22); ctx.fill(); }
  ctx.fillStyle = color; roundRect(x, y - 30, w, 60, 16); ctx.fill();
  text(label, SW / 2, y + 9, 24, C.WH, { align: 'center', weight: 800 });
}

// campo de formulário que vai "digitando" (p = 0..1)
function field(label, value, y, p) {
  ctx.fillStyle = '#F2F2F5'; roundRect(30, y - 34, SW - 60, 66, 14); ctx.fill();
  ctx.strokeStyle = p > 0 && p < 1 ? FB : '#D5D6DA'; ctx.lineWidth = 3; roundRect(30, y - 34, SW - 60, 66, 14); ctx.stroke();
  if (p <= 0) { text(label, 50, y + 8, 22, '#9A9CA3', { weight: 600 }); return; }
  text(label, 50, y - 12, 15, '#9A9CA3', { weight: 700 });
  text(value.slice(0, Math.ceil(value.length * clamp(p))), 50, y + 18, 22, C.K, { weight: 700 });
}

// confirmação grande (check verde)
function success(label, sub, p) {
  ctx.fillStyle = C.WH; ctx.fillRect(0, 0, SW, SH);
  const e = easeOutBack(clamp(p * 2));
  ctx.save(); ctx.translate(SW / 2, 330); ctx.scale(e, e);
  ctx.fillStyle = '#2E9E5B'; ctx.beginPath(); ctx.arc(0, 0, 90, 0, 7); ctx.fill();
  ctx.strokeStyle = C.WH; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-10, 30); ctx.lineTo(44, -28); ctx.stroke();
  ctx.restore();
  text(label, SW / 2, 500, 32, C.K, { align: 'center', weight: 800, alpha: clamp(p * 3 - 0.5) });
  if (sub) text(sub, SW / 2, 545, 22, '#5B5E66', { align: 'center', weight: 600, alpha: clamp(p * 3 - 0.8) });
}

// dedo tocando num ponto da tela (coordenadas da tela do celular)
function tap(cx, cy, s, x, y, t, at) {
  const d = t - at;
  if (d < -0.5 || d > 0.6) return;
  const X = cx + (x - SW / 2) * s, Y = cy + (y - SH / 2) * s;
  const appr = easeOut(clamp((d + 0.5) / 0.5));
  const hx = lerp(X + 160, X, appr), hy = lerp(Y + 260, Y, appr) + (d >= 0 && d < 0.12 ? 8 : 0);
  if (d >= 0) { const r = clamp(d / 0.45); ctx.save(); ctx.globalAlpha = 1 - r; ctx.strokeStyle = C.Y; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(X, Y, 20 + r * 70, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,212,0,0.35)'; ctx.beginPath(); ctx.arc(X, Y, 28, 0, 7); ctx.fill(); ctx.restore(); }
  // mão (indicador)
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.35); ctx.globalAlpha = clamp(1.6 - d * 2.5);
  ctx.fillStyle = '#F3C9A8'; ctx.strokeStyle = C.K; ctx.lineWidth = 5;
  ctx.beginPath(); roundRect(-14, -4, 28, 90, 14); ctx.fill(); ctx.stroke();
  ctx.beginPath(); roundRect(-30, 60, 80, 90, 30); ctx.fill(); ctx.stroke();
  ctx.restore();
}
