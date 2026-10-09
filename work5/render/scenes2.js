// Anúncio Alessandra Mendes v2 — cenas 4 a 7
// 4. SONHO — foto de perfil em tela cheia
function scene4(t) {
  bg(C.OW);
  photoCover(FOTO_PERFIL, T.s4, t, 0.62, 0.3, 0.08);
  shade('rgba(62,26,36,0)', 'rgba(62,26,36,0.95)');
  sparkle(300, 560, 1.1, t, C.WH); sparkle(880, 380, 0.8, t + 1.3, C.WH);
  serif('imagina se olhar no espelho...', W / 2, 1180, 62, C.WH, { align: 'center', alpha: easeOut(prog(t, 9.5, 0.35)) });
  const a = easeOutBack(prog(t, 11.9, 0.32));
  ctx.save(); ctx.translate(W / 2, 1300); ctx.scale(clamp(a), clamp(a));
  text('PELE MAIS UNIFORME', 0, 0, 78, C.GOLD, { align: 'center' });
  ctx.restore();
  const b = easeOut(prog(t, 13.1, 0.3));
  text('sem precisar esconder nada', W / 2, 1395, 46, C.WH, { align: 'center', weight: 600, alpha: b });
}

// 5. SOLUÇÃO — Alessandra, dia 19, de Brasília, Setor Marista
function scene5(t) {
  bg(C.WINE);
  particles(t, C.GOLD, 35, 0.3);
  const f = easeOutBack(prog(t, T.s5, 0.45));
  ctx.save(); ctx.translate(W / 2, 560); ctx.scale(lerp(0.85, 1, clamp(f)), lerp(0.85, 1, clamp(f))); ctx.rotate(-0.02);
  ctx.globalAlpha = clamp(f * 1.5);
  const z = 1 - 0.07 * prog(t, T.s5, 5);
  const cw = 620 * z, ch = 780 * z;
  photoCard(FOTO_SENTADA, 0, 0, 440, 560, [430 - cw / 2, 640 - ch / 2, cw, ch], 34);
  ctx.restore();
  // selo DIA 19
  const c = easeOutBack(prog(t, 14.5, 0.35));
  ctx.save(); ctx.translate(770, 370); ctx.scale(clamp(c) * 0.62, clamp(c) * 0.62); ctx.rotate(0.08);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; roundRect(-150, -150, 310, 300, 30); ctx.fill();
  ctx.fillStyle = C.OW; roundRect(-160, -165, 320, 310, 30); ctx.fill();
  ctx.fillStyle = C.ROSE; roundRect(-160, -165, 320, 80, 30); ctx.fill(); ctx.fillRect(-160, -115, 320, 30);
  text('DIA', 0, -104, 44, C.WH, { align: 'center' });
  text('19', 0, 100, 170, C.WINE, { align: 'center' });
  ctx.restore();
  const n = easeOut(prog(t, 15.35, 0.35));
  serif('Alessandra Mendes', W / 2, 950 + (1 - n) * 30, 96, C.WH, { align: 'center', alpha: n });
  // rota curta Brasília → Goiânia
  const r = prog(t, 16.6, 1.0);
  if (r > 0) {
    const ax = 780, ay = 1075, bx = 300, by = 1075;
    ctx.save(); ctx.globalAlpha = clamp(r * 3);
    ctx.strokeStyle = C.GOLD; ctx.lineWidth = 6; ctx.setLineDash([4, 18]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(540, 1010, bx, by); ctx.stroke(); ctx.setLineDash([]);
    const e = easeInOut(clamp(r));
    const qx = (1 - e) * (1 - e) * ax + 2 * (1 - e) * e * 540 + e * e * bx;
    const qy = (1 - e) * (1 - e) * ay + 2 * (1 - e) * e * 1010 + e * e * by;
    ctx.fillStyle = C.GOLD; ctx.beginPath(); ctx.arc(qx, qy, 14, 0, 7); ctx.fill();
    text('Brasília', ax + 10, ay + 52, 36, C.NUDE, { align: 'center', weight: 600 });
    text('Goiânia', bx - 10, by + 52, 36, C.WH, { align: 'center', weight: 700 });
    ctx.restore();
  }
  pill('TRATAMENTO DE MELASMA', W / 2, 1245, 44, C.GOLD, C.WINE, t, 17.75);
  pill('SETOR MARISTA · GOIÂNIA', W / 2, 1365, 38, 'rgba(212,175,106,0.22)', C.WH, t, 19.0);
}

// 6. OBJEÇÃO — preço: de R$697 por R$285 + presente
function scene6(t) {
  bg(C.OW);
  glow(W / 2, 900, 600, 'rgba(201,139,123,0.5)', 0.3);
  serif('e não precisa pagar', W / 2, 370, 62, C.ROSE, { align: 'center', alpha: easeOut(prog(t, 20.3, 0.3)) });
  const d = easeOutBack(prog(t, 21.2, 0.3));
  if (d > 0) {
    ctx.save(); ctx.translate(W / 2, 545); ctx.scale(clamp(d), clamp(d));
    text('R$697', 0, 0, 160, C.G, { align: 'center' });
    const s = easeOut(prog(t, 22.8, 0.2));
    if (s > 0) { const w = measure('R$697', 160); ctx.fillStyle = C.WINE2; ctx.save(); ctx.rotate(-0.08); roundRect(-w / 2 - 20, -68, (w + 40) * s, 18, 9); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  text('NESSE DIA, SAI POR', W / 2, 730, 58, C.INK, { align: 'center', alpha: easeOut(prog(t, 22.8, 0.3)) });
  const p = easeOutBack(prog(t, 23.8, 0.35));
  if (p > 0) {
    ctx.save(); ctx.translate(W / 2, 980); ctx.scale(p * (1 + 0.03 * Math.sin(t * 5)), p * (1 + 0.03 * Math.sin(t * 5)));
    ctx.fillStyle = C.WINE; roundRect(-380, -180, 760, 280, 50); ctx.fill();
    text('R$285', 0, 45, 228, C.GOLD, { align: 'center' });
    ctx.restore();
  }
  burst(t, 23.83, W / 2, 930, C.GOLD, 40, 600);
  // presente
  const g = easeOutBack(prog(t, 26.1, 0.35));
  if (g > 0) {
    ctx.save(); ctx.translate(330, 1270); ctx.scale(g, g); ctx.rotate(-0.08 + Math.sin(t * 4) * 0.04);
    ctx.fillStyle = C.ROSE; roundRect(-70, -40, 140, 110, 10); ctx.fill();
    ctx.fillStyle = C.GOLD; ctx.fillRect(-12, -40, 24, 110);
    ctx.fillStyle = C.WINE2; roundRect(-80, -66, 160, 34, 8); ctx.fill();
    ctx.fillStyle = C.GOLD; ctx.fillRect(-12, -66, 24, 34);
    ctx.beginPath(); ctx.ellipse(-24, -76, 24, 14, -0.5, 0, 7); ctx.ellipse(24, -76, 24, 14, 0.5, 0, 7); ctx.fill();
    ctx.restore();
    text('+ UM PRESENTE', 640, 1300, 64, C.WINE2, { align: 'center', alpha: clamp(g) });
    burst(t, 26.19, 330, 1240, C.GOLD, 22, 260);
  }
}

// 7. CONVITE com urgência — só 10 vagas + MELASMA no direct
const CLICK6 = 29.54;
function scene7(t) {
  bg(C.WINE);
  photoCover(FOTO_PERFIL, T.s7, t, 0.62, 0.3, 0.05);
  ctx.save(); ctx.globalAlpha = 0.86; ctx.fillStyle = C.WINE; ctx.fillRect(0, 0, W, H); ctx.restore();
  particles(t, C.GOLD, 40, 0.35);
  const s = easeOutBack(prog(t, 27.4, 0.3));
  ctx.save(); ctx.translate(W / 2, 430); ctx.scale(clamp(s) * (1 + 0.04 * Math.sin(t * 6)), clamp(s) * (1 + 0.04 * Math.sin(t * 6)));
  text('SÓ 10 VAGAS', 0, 0, 132, C.GOLD, { align: 'center' });
  ctx.restore();
  for (let i = 0; i < 10; i++) {
    const p = easeOutBack(prog(t, 27.6 + i * 0.05, 0.3));
    if (p <= 0) continue;
    const x = 175 + i * 81, y = 530;
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
    ctx.fillStyle = C.GOLD; ctx.beginPath(); ctx.arc(0, -10, 14, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 22, 24, 15, 0, Math.PI, 0); ctx.fill();
    ctx.restore();
  }
  // avatar + nome
  const av = easeOutBack(prog(t, 27.9, 0.4));
  ctx.save(); ctx.translate(225, 690); ctx.scale(clamp(av), clamp(av)); avatar(0, 0, 72); ctx.restore();
  serif('Alessandra Mendes', 615, 712, 72, C.WH, { align: 'center', alpha: easeOut(prog(t, 28.0, 0.3)) });
  // botão
  const b = easeOutBack(prog(t, 28.75, 0.35));
  if (b > 0) {
    const pulse = 1 + 0.045 * Math.sin((t - 28.75) * 2 * Math.PI * 1.4) * (t > 29.7 ? 1 : 0);
    const press = t >= CLICK6 && t < CLICK6 + 0.15 ? 0.93 : 1;
    ctx.save(); ctx.translate(W / 2, 900); ctx.scale(b * pulse * press, b * pulse * press);
    const gr = ctx.createLinearGradient(-390, 0, 390, 0);
    gr.addColorStop(0, '#E7C88A'); gr.addColorStop(1, '#C9A050');
    ctx.fillStyle = gr; roundRect(-390, -95, 780, 190, 95); ctx.fill();
    ctx.restore();
    text('MANDE "MELASMA"', W / 2, 892, 58, C.WINE, { align: 'center', alpha: clamp(b) });
    text('NO DIRECT', W / 2, 952, 44, C.WINE2, { align: 'center', alpha: clamp(b) });
  }
  text('@alessandramendes.x', W / 2, 1075, 50, C.WH, { align: 'center', weight: 700, alpha: easeOut(prog(t, 29.3, 0.3)) });
  const r = easeOut(prog(t, 29.8, 0.4));
  ctx.save(); ctx.globalAlpha = r;
  ctx.strokeStyle = 'rgba(212,175,106,0.6)'; ctx.lineWidth = 3; roundRect(140, 1150, 800, 250, 34); ctx.stroke();
  ctx.restore();
  text('Tratamento de melasma', W / 2, 1220, 44, C.NUDE, { align: 'center', weight: 700, alpha: r });
  text('de R$697 por R$285 + presente', W / 2, 1295, 50, C.GOLD, { align: 'center', alpha: r });
  text('Dia 19  ·  Setor Marista  ·  Goiânia', W / 2, 1365, 36, C.WH, { align: 'center', weight: 600, alpha: r });
}
