// Ilustrações dos nichos — cada uma combina com o rótulo da tela
function drawBurger(cx, cy, s, t) {
  ctx.save(); ctx.translate(cx, cy + Math.sin(t * 4) * 6); ctx.scale(s, s);
  ctx.fillStyle = '#F6B04A'; ctx.beginPath(); ctx.ellipse(0, -40, 130, 80, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#5BB04A'; roundRect(-140, -45, 280, 26, 13); ctx.fill();
  ctx.fillStyle = '#E8432E'; roundRect(-128, -24, 256, 14, 7); ctx.fill();
  ctx.fillStyle = '#6B3420'; roundRect(-135, -14, 270, 46, 23); ctx.fill();
  ctx.fillStyle = '#FFD45A'; roundRect(-140, 30, 280, 16, 8); ctx.fill();
  ctx.fillStyle = '#F6B04A'; roundRect(-130, 46, 260, 44, 22); ctx.fill();
  ctx.fillStyle = '#FFF3D6';
  [[-60, -80], [-10, -95], [45, -82], [80, -60], [-95, -55]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 9, 5, 0.4, 0, 7); ctx.fill(); });
  ctx.restore();
}

function drawShirt(cx, cy, s, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.rotate(Math.sin(t * 3) * 0.05);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(-60, -120); ctx.lineTo(-160, -70); ctx.lineTo(-120, 0); ctx.lineTo(-90, -15); ctx.lineTo(-90, 130);
  ctx.lineTo(90, 130); ctx.lineTo(90, -15); ctx.lineTo(120, 0); ctx.lineTo(160, -70); ctx.lineTo(60, -120);
  ctx.quadraticCurveTo(0, -70, -60, -120); ctx.closePath(); ctx.fill();
  // coração estampado
  ctx.fillStyle = '#E2366B'; ctx.translate(0, 20); ctx.scale(2.2, 2.2);
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.bezierCurveTo(-24, -8, -12, -26, 0, -12); ctx.bezierCurveTo(12, -26, 24, -8, 0, 10); ctx.fill();
  ctx.restore();
}

function drawSalon(cx, cy, s, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  // tesoura abrindo e fechando
  const a = 0.25 + 0.2 * Math.sin(t * 8);
  ctx.strokeStyle = '#2A2D35'; ctx.lineWidth = 16; ctx.lineCap = 'round';
  ctx.fillStyle = '#C9CDD6';
  [a, -a].forEach((r, i) => {
    ctx.save(); ctx.rotate(r - Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -150); ctx.lineWidth = 22; ctx.strokeStyle = '#C9CDD6'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 60, 38, 0, 7); ctx.lineWidth = 16; ctx.strokeStyle = i ? '#E2366B' : '#2A2D35'; ctx.stroke();
    ctx.restore();
  });
  ctx.fillStyle = '#2A2D35'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill();
  // pente
  ctx.save(); ctx.translate(-10, 150); ctx.rotate(-0.15);
  ctx.fillStyle = '#2A2D35'; roundRect(-120, -18, 240, 36, 10); ctx.fill();
  for (let i = 0; i < 14; i++) { ctx.fillRect(-112 + i * 17, 14, 8, 30); }
  ctx.restore();
  // brilhos
  ctx.fillStyle = '#FFFFFF';
  [[130, -120, 1], [-140, -90, 0.7]].forEach(([x, y, k]) => {
    const p = 0.6 + 0.4 * Math.sin(t * 5 + x);
    ctx.save(); ctx.translate(x, y); ctx.scale(k * p, k * p); ctx.rotate(0.785);
    ctx.fillRect(-6, -26, 12, 52); ctx.fillRect(-26, -6, 52, 12); ctx.restore();
  });
  ctx.restore();
}

function drawPet(cx, cy, s, t) {
  ctx.save(); ctx.translate(cx, cy + Math.abs(Math.sin(t * 4)) * -10); ctx.scale(s, s);
  // pata
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.ellipse(0, 40, 82, 70, 0, 0, 7); ctx.fill();
  [[-92, -40], [-38, -95], [38, -95], [92, -40]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 34, 44, x * 0.004, 0, 7); ctx.fill(); });
  // ossinho
  ctx.save(); ctx.translate(0, 170); ctx.rotate(-0.12); ctx.fillStyle = '#FFD45A';
  roundRect(-90, -16, 180, 32, 16); ctx.fill();
  [[-92, -16], [-92, 16], [92, -16], [92, 16]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill(); });
  ctx.restore();
  ctx.restore();
}

// Raios girando atrás do produto (estilo anúncio)
function rays(cx, cy, r, t, color, alpha) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.8); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r, -r * 0.13); ctx.lineTo(r, r * 0.13); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// Anúncio de exemplo dentro do celular: título, produto com raios, selo e botão — tudo do mesmo nicho
const ADS = {
  burger: { title: 'COMBO DO DIA', tag: 'DELIVERY', cta: 'PEÇA AGORA', bg1: '#F39A3C', bg2: '#C8361F', draw: drawBurger },
  salon: { title: 'ESCOVA + HIDRATAÇÃO', tag: 'NOVIDADE', cta: 'AGENDE JÁ', bg1: '#F7C6D5', bg2: '#C95A84', draw: drawSalon },
  shop: { title: 'COLEÇÃO NOVA', tag: 'CHEGOU', cta: 'VEM CONFERIR', bg1: '#6FB7FF', bg2: '#2F5FD0', draw: drawShirt },
  pet: { title: 'BANHO & TOSA', tag: 'PROMO', cta: 'AGENDE JÁ', bg1: '#7ED9B0', bg2: '#1F8A6A', draw: drawPet },
};

function adScreen(key, t, intro = 1) {
  const a = ADS[key];
  return (x, y, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, a.bg1); g.addColorStop(1, a.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const k = w / 430;
    rays(w / 2, h * 0.5, w * 0.9, t, '#FFFFFF', 0.14 * intro);
    // título quicando
    const tb = easeOutBack(clamp(t / 0.4));
    ctx.save(); ctx.translate(w / 2, h * 0.17); ctx.scale(tb, tb);
    const size = (a.title.length > 14 ? 34 : 46) * k;
    text(a.title, 0, 0, size, C.WH, { align: 'center', skew: -9 });
    ctx.restore();
    a.draw(w / 2, h * 0.5, 0.95 * k * (0.9 + 0.1 * easeOutBack(clamp(t / 0.5))), t);
    // selo girando
    ctx.save(); ctx.translate(w * 0.78, h * 0.31); ctx.rotate(0.25 + Math.sin(t * 4) * 0.08);
    ctx.fillStyle = C.Y; roundRect(-70 * k, -24 * k, 140 * k, 48 * k, 10 * k); ctx.fill();
    text(a.tag, 0, 10 * k, 24 * k, C.K, { align: 'center' });
    ctx.restore();
    // botão
    const pb = 1 + 0.05 * Math.sin(t * 7);
    ctx.save(); ctx.translate(w / 2, h * 0.83); ctx.scale(pb, pb);
    ctx.fillStyle = C.WH; roundRect(-120 * k, -30 * k, 240 * k, 60 * k, 30 * k); ctx.fill();
    text(a.cta, 0, 11 * k, 28 * k, C.K, { align: 'center' });
    ctx.restore();
    // barra de progresso do vídeo
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(24 * k, h - 26 * k, w - 48 * k, 6 * k, 3 * k); ctx.fill();
    ctx.fillStyle = C.WH; roundRect(24 * k, h - 26 * k, (w - 48 * k) * clamp(t / 3), 6 * k, 3 * k); ctx.fill();
  };
}

// "Foto do produto" crua: fundo neutro, sem texto, sem efeito
function rawPhoto(x, y, w, h, t) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#D9D4CB'); g.addColorStop(1, '#B9B2A6');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.72, w * 0.36, h * 0.06, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.filter = 'saturate(0.55) brightness(0.95)';
  drawBurger(x + w / 2, y + h * 0.55, w / 430, 0);
  ctx.restore();
}
