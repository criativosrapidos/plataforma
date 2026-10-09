// Anúncio Alessandra Mendes — dia de tratamento de melasma em Goiânia. Tempos = take 1 + 0,5s.
const T = { s1: 0, s2: 2.35, s3: 5.95, s4: 9.95, s5: 12.3, s6: 19.75, s7: 21.0, end: 30 };

function pin(cx, cy, s, color, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  const r = (t * 1.2) % 1;
  ctx.strokeStyle = color; ctx.globalAlpha = 0.5 * (1 - r); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(0, 70, 30 + r * 70, 10 + r * 22, 0, 0, 7); ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, -20, 46, Math.PI * 0.85, Math.PI * 0.15); ctx.lineTo(0, 70); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.WINE; ctx.beginPath(); ctx.arc(0, -22, 18, 0, 7); ctx.fill();
  ctx.restore();
}

function sparkle(x, y, s, t, color) {
  const p = 0.5 + 0.5 * Math.sin(t * 4 + x);
  ctx.save(); ctx.translate(x, y); ctx.scale(s * p, s * p); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(4, -4, 30, 0); ctx.quadraticCurveTo(4, 4, 0, 30);
  ctx.quadraticCurveTo(-4, 4, -30, 0); ctx.quadraticCurveTo(-4, -4, 0, -30); ctx.fill(); ctx.restore();
}

function chipLine(items, y, t, at, dark = true) {
  const p = easeOut(prog(t, at, 0.35));
  ctx.save(); ctx.globalAlpha = p;
  const size = 36, pad = 34, gap = 18;
  const ws = items.map((s) => measure(s, size) + pad * 2);
  let x = W / 2 - (ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1)) / 2;
  items.forEach((s, i) => {
    ctx.fillStyle = dark ? 'rgba(212,175,106,0.18)' : C.WINE; roundRect(x, y - 40, ws[i], 76, 38); ctx.fill();
    ctx.strokeStyle = C.GOLD; ctx.lineWidth = 2; if (dark) { roundRect(x, y - 40, ws[i], 76, 38); ctx.stroke(); }
    text(s, x + ws[i] / 2, y + 12, size, dark ? C.GOLD : C.WH, { align: 'center' });
    x += ws[i] + gap;
  });
  ctx.restore();
}

// 1. Gancho — "GOIÂNIA, ATENÇÃO!" (quadro 0 já é a capa)
function scene1(t) {
  bg(C.WINE);
  glow(W / 2, 760, 640, 'rgba(212,175,106,0.55)', 0.3);
  particles(t, C.GOLD, 50, 0.35);
  pin(W / 2, 470, 1.4, C.GOLD, t);
  const g = 1 + 0.07 * Math.sin(prog(t, 0.57, 0.35) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 800); ctx.scale(g, g);
  text('GOIÂNIA,', 0, 0, 150, C.WH, { align: 'center' });
  ctx.restore();
  const a = 1 + 0.08 * Math.sin(prog(t, 1.22, 0.35) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 960); ctx.scale(a, a);
  text('ATENÇÃO!', 0, 0, 150, C.GOLD, { align: 'center' });
  ctx.restore();
  chipLine(['DIA 19', 'SETOR MARISTA', 'SÓ 10 VAGAS'], 1170, t, -1);
  serif('Tratamento de melasma', W / 2, 1320, 60, C.NUDE, { align: 'center' });
}

// 2. Dia 19 + "Alessandra Mendes vem direto de Brasília"
function scene2(t) {
  bg(C.WINE);
  particles(t, C.GOLD, 35, 0.3);
  // calendário dia 19
  const c = easeOutBack(prog(t, 2.45, 0.4));
  ctx.save(); ctx.translate(W / 2, 470); ctx.scale(clamp(c), clamp(c)); ctx.rotate(-0.04);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; roundRect(-150, -150, 310, 300, 30); ctx.fill();
  ctx.fillStyle = C.OW; roundRect(-160, -165, 320, 310, 30); ctx.fill();
  ctx.fillStyle = C.ROSE; roundRect(-160, -165, 320, 80, 30); ctx.fill(); ctx.fillRect(-160, -115, 320, 30);
  text('DIA', 0, -104, 44, C.WH, { align: 'center' });
  text('19', 0, 100, 170, C.WINE, { align: 'center' });
  ctx.restore();
  // nome
  const n = easeOut(prog(t, 3.55, 0.35));
  serif('Alessandra Mendes', W / 2, 800 + (1 - n) * 40, 104, C.WH, { align: 'center', alpha: n });
  // rota Brasília → Goiânia
  const r = prog(t, 4.6, 1.2);
  if (r > 0) {
    const ax = 760, ay = 1180, bx = 320, by = 1060;
    ctx.save(); ctx.globalAlpha = clamp(r * 3);
    // arco pontilhado
    ctx.strokeStyle = C.GOLD; ctx.lineWidth = 6; ctx.setLineDash([4, 18]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, 900, bx, by); ctx.stroke(); ctx.setLineDash([]);
    // ponto viajando
    const e = easeInOut(clamp(r));
    const qx = (1 - e) * (1 - e) * ax + 2 * (1 - e) * e * ((ax + bx) / 2) + e * e * bx;
    const qy = (1 - e) * (1 - e) * ay + 2 * (1 - e) * e * 900 + e * e * by;
    ctx.fillStyle = C.GOLD; ctx.beginPath(); ctx.arc(qx, qy, 16, 0, 7); ctx.fill();
    ctx.fillStyle = C.NUDE; ctx.beginPath(); ctx.arc(ax, ay, 12, 0, 7); ctx.fill();
    text('Brasília', ax, ay + 70, 40, C.NUDE, { align: 'center', weight: 600 });
    ctx.restore();
    if (r > 0.6) pin(bx, by - 30, 0.7, C.GOLD, t);
    text('Goiânia', bx, by + 70, 44, C.WH, { align: 'center', alpha: clamp((r - 0.6) * 3) });
  }
  text('DIRETO DE BRASÍLIA', W / 2, 1400, 54, C.GOLD, { align: 'center', alpha: easeOut(prog(t, 4.95, 0.3)) });
}
function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

// Pele ilustrativa (motion), com manchas e brilho passando — sem antes/depois
function skinOrb(cx, cy, r, t) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#F3DCCB'); g.addColorStop(0.6, '#E2BFA8'); g.addColorStop(1, '#C99D85');
  ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // textura de poros
  for (let i = 0; i < 160; i++) {
    const a = rand(i) * 7, d = Math.sqrt(rand(i + 3)) * r;
    ctx.fillStyle = 'rgba(150,100,80,0.10)'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + rand(i + 5) * 2, 0, 7); ctx.fill();
  }
  // manchas de melasma
  [[-0.25, -0.1, 0.32], [0.18, 0.05, 0.24], [-0.02, 0.3, 0.18]].forEach(([x, y, s], i) => {
    const mg = ctx.createRadialGradient(cx + x * r, cy + y * r, 0, cx + x * r, cy + y * r, s * r);
    mg.addColorStop(0, 'rgba(140,85,60,0.45)'); mg.addColorStop(1, 'rgba(140,85,60,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(cx + x * r, cy + y * r, s * r * 1.2, s * r, 0.4 * i, 0, 7); ctx.fill();
  });
  // brilho passando
  const sx = cx - r * 1.6 + ((t * 0.5) % 1) * r * 3.2;
  const sg = ctx.createLinearGradient(sx - 80, cy, sx + 80, cy);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
  ctx.strokeStyle = C.GOLD; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, 7); ctx.stroke();
}

// 3. Tratamento de melasma — nude, pele ilustrativa e local
function scene3(t) {
  bg(C.OW);
  const lt = t - T.s3;
  serif('um dia especial de', W / 2, 360, 68, C.ROSE, { align: 'center', alpha: easeOut(prog(lt, 0, 0.3)) });
  const m = easeOutBack(prog(t, 7.4, 0.35));
  ctx.save(); ctx.translate(W / 2, 500); ctx.scale(clamp(m), clamp(m));
  text('TRATAMENTO', 0, 0, 104, C.INK, { align: 'center' });
  text('DE MELASMA', 0, 112, 104, C.WINE2, { align: 'center' });
  ctx.restore();
  const o = easeOutBack(prog(lt, 0.15, 0.5));
  ctx.save(); ctx.translate(W / 2, 1000); ctx.scale(clamp(o), clamp(o)); ctx.translate(-W / 2, -1000);
  skinOrb(W / 2, 1000, 230, t);
  ctx.restore();
  sparkle(760, 820, 1, t, C.GOLD); sparkle(320, 1180, 0.8, t + 1, C.GOLD);
  text('imagem ilustrativa', W / 2, 1272, 26, C.G, { align: 'center', weight: 500, alpha: clamp(o) });
  const s = easeOutBack(prog(t, 8.85, 0.35));
  if (s > 0) {
    ctx.save(); ctx.translate(W / 2, 1365); ctx.scale(s, s);
    ctx.fillStyle = C.WINE; roundRect(-330, -48, 660, 96, 48); ctx.fill();
    ctx.restore();
    text('SETOR MARISTA · GOIÂNIA', W / 2, 1380, 42, C.WH, { align: 'center', alpha: clamp(s) });
  }
}

// 4. Só 10 vagas — vinho, 10 marcadores entrando
function scene4(t) {
  bg(C.WINE);
  particles(t, C.GOLD, 40, 0.35);
  text('MAS SÃO', W / 2, 400, 80, C.NUDE, { align: 'center', alpha: easeOut(prog(t, T.s4, 0.2)) });
  const s = easeOutBack(prog(t, 10.7, 0.3));
  ctx.save(); ctx.translate(W / 2, 700); ctx.scale(clamp(s) * (1 + 0.05 * Math.sin(t * 6)), clamp(s) * (1 + 0.05 * Math.sin(t * 6)));
  text('SÓ 10', 0, 0, 260, C.GOLD, { align: 'center' });
  ctx.restore();
  text('VAGAS', W / 2, 840, 110, C.WH, { align: 'center', alpha: easeOut(prog(t, 11.3, 0.25)) });
  for (let i = 0; i < 10; i++) {
    const p = easeOutBack(prog(t, 10.75 + i * 0.07, 0.3));
    if (p <= 0) continue;
    const r = Math.floor(i / 5), c = i % 5;
    const x = 230 + c * 155, y = 1050 + r * 170;
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
    ctx.strokeStyle = C.GOLD; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 58, 0, 7); ctx.stroke();
    ctx.fillStyle = C.GOLD; ctx.beginPath(); ctx.arc(0, -14, 18, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 30, 32, 20, 0, Math.PI, 0); ctx.fill();
    ctx.restore();
  }
}
