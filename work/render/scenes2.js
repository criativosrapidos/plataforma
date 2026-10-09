// Cena 4: moldura de celular com 3 vídeos de exemplo + selos
const PHONE = { x: 325, y: 280, w: 430, h: 770, r: 56 };
const NICHES = [
  { name: 'Alimentação', bg: '#E8572A', bg2: '#F39A3C', draw: drawBurger },
  { name: 'Beleza', bg: '#D9779A', bg2: '#F2B5C8', draw: drawBeauty },
  { name: 'Loja', bg: '#2F7D8C', bg2: '#57B3BF', draw: drawBag },
];

function drawBurger(cx, cy, s, t) {
  ctx.save(); ctx.translate(cx, cy + Math.sin(t * 4) * 6); ctx.scale(s, s);
  ctx.fillStyle = '#F6B04A'; ctx.beginPath(); ctx.ellipse(0, -40, 130, 80, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#5BB04A'; roundRect(-140, -45, 280, 26, 13); ctx.fill();
  ctx.fillStyle = '#6B3420'; roundRect(-135, -20, 270, 48, 24); ctx.fill();
  ctx.fillStyle = '#FFD45A'; roundRect(-140, 26, 280, 18, 9); ctx.fill();
  ctx.fillStyle = '#F6B04A'; roundRect(-130, 44, 260, 46, 22); ctx.fill();
  ctx.fillStyle = '#FFF3D6';
  [[-60, -80], [-10, -95], [45, -82], [80, -60], [-95, -55]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 9, 5, 0.4, 0, 7); ctx.fill(); });
  ctx.restore();
}
function drawBeauty(cx, cy, s, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.rotate(Math.sin(t * 3) * 0.06);
  // espelho de mão
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(-30, -40, 100, 120, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#FCE3EC'; ctx.beginPath(); ctx.ellipse(-30, -40, 80, 100, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; roundRect(-48, 70, 36, 140, 18); ctx.fill();
  // brilho
  ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.ellipse(-60, -80, 14, 30, 0.5, 0, 7); ctx.fill();
  // batom
  ctx.globalAlpha = 1; ctx.fillStyle = '#7A1F3D'; roundRect(90, 10, 54, 130, 10); ctx.fill();
  ctx.fillStyle = '#C2185B'; ctx.beginPath(); ctx.moveTo(96, 10); ctx.lineTo(96, -50); ctx.lineTo(138, -30); ctx.lineTo(138, 10); ctx.fill();
  ctx.restore();
}
function drawBag(cx, cy, s, t) {
  ctx.save(); ctx.translate(cx, cy + Math.abs(Math.sin(t * 4)) * -10); ctx.scale(s, s);
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 16;
  ctx.beginPath(); ctx.arc(0, -70, 55, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#FFFFFF'; roundRect(-120, -70, 240, 220, 26); ctx.fill();
  ctx.fillStyle = '#2F7D8C'; ctx.beginPath(); ctx.arc(0, 40, 46, 0, 7); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; font(56); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('%', 0, 42);
  ctx.restore();
}

function drawPhone(t) {
  const { x, y, w, h, r } = PHONE;
  const lt = t - T.s4;
  const enter = easeOutBack(prog(lt, 0, 0.4));
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2 + (1 - enter) * 300);
  ctx.scale(lerp(0.8, 1, enter), lerp(0.8, 1, enter));
  ctx.translate(-(x + w / 2), -(y + h / 2));
  // corpo
  ctx.fillStyle = '#2A2D35'; roundRect(x - 16, y - 16, w + 32, h + 32, r + 14); ctx.fill();
  ctx.save(); roundRect(x, y, w, h, r); ctx.clip();
  // troca dos vídeos com rolagem vertical tipo Reels
  const cuts = [0, 1.6, 3.3];
  let idx = 0; for (let i = 0; i < 3; i++) if (lt >= cuts[i]) idx = i;
  const sw = idx > 0 ? easeOut(prog(lt, cuts[idx], 0.3)) : 1;
  const drawNiche = (n, off, localT) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, n.bg2); g.addColorStop(1, n.bg);
    ctx.save(); ctx.translate(0, off);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    n.draw(x + w / 2, y + h * 0.45, 1.0, localT);
    text(n.name, x + 36, y + h - 120, 46, C.WH);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(x + 36, y + h - 80, w - 72, 8, 4); ctx.fill();
    ctx.fillStyle = C.WH; roundRect(x + 36, y + h - 80, (w - 72) * clamp(localT / 1.7), 8, 4); ctx.fill();
    ctx.restore();
  };
  if (idx > 0 && sw < 1) drawNiche(NICHES[idx - 1], -sw * h, lt - cuts[idx - 1]);
  drawNiche(NICHES[idx], (1 - sw) * h, lt - cuts[idx]);
  ctx.restore();
  // notch
  ctx.fillStyle = '#2A2D35'; roundRect(x + w / 2 - 70, y - 2, 140, 30, 15); ctx.fill();
  ctx.restore();
}

function badge(str, cy, at, t) {
  const p = easeOutBack(prog(t, at, 0.32));
  if (p <= 0) return;
  const size = 50, w = measure(str, size) + 70, h = 74;
  ctx.save();
  ctx.translate(W / 2, cy); ctx.scale(p, p);
  ctx.transform(1, 0, Math.tan(-9 * Math.PI / 180), 1, 0, 0);
  ctx.fillStyle = C.Y; roundRect(-w / 2, -h / 2, w, h, 14); ctx.fill();
  ctx.restore();
  text(str, W / 2, cy + 18, size, C.K, { align: 'center', alpha: clamp(p) });
}

function scene4(t) {
  bg(C.K);
  drawPhone(t);
  badge('ATÉ 30s', 1125, 11.0, t);
  badge('PRONTO PRA POSTAR', 1215, 13.1, t);
  badge('PRONTO PRA ANUNCIAR', 1305, 14.0, t);
}
