// Anúncio Alessandra Mendes — cenas 5 a 7
// 5. Preço — de R$697 por R$285
function scene5(t) {
  bg(C.OW);
  glow(W / 2, 900, 600, 'rgba(201,139,123,0.5)', 0.3);
  serif('o tratamento que sai por', W / 2, 380, 62, C.ROSE, { align: 'center', alpha: easeOut(prog(t, T.s5, 0.3)) });
  const d = easeOutBack(prog(t, 13.45, 0.3));
  if (d > 0) {
    ctx.save(); ctx.translate(W / 2, 560); ctx.scale(clamp(d), clamp(d));
    text('R$697', 0, 0, 170, C.G, { align: 'center' });
    const s = easeOut(prog(t, 15.7, 0.2));
    if (s > 0) { const w = measure('R$697', 170); ctx.fillStyle = C.WINE2; ctx.save(); ctx.rotate(-0.08); roundRect(-w / 2 - 20, -72, (w + 40) * s, 18, 9); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  text('NESSE DIA, POR APENAS', W / 2, 760, 58, C.INK, { align: 'center', alpha: easeOut(prog(t, 15.7, 0.3)) });
  const p = easeOutBack(prog(t, 17.1, 0.35));
  if (p > 0) {
    ctx.save(); ctx.translate(W / 2, 1030); ctx.scale(p * (1 + 0.03 * Math.sin(t * 5)), p * (1 + 0.03 * Math.sin(t * 5)));
    ctx.fillStyle = C.WINE; roundRect(-380, -180, 760, 280, 50); ctx.fill();
    text('R$285', 0, 45, 228, C.GOLD, { align: 'center' });
    ctx.restore();
  }
  burst(t, 17.14, W / 2, 980, C.GOLD, 40, 600);
  sparkle(180, 860, 0.9, t, C.GOLD); sparkle(900, 1210, 1.1, t + 2, C.GOLD);
  const tg = easeOutBack(prog(t, 18.0, 0.3));
  if (tg > 0) {
    ctx.save(); ctx.translate(W / 2, 1300); ctx.rotate(-0.03); ctx.scale(tg, tg);
    ctx.fillStyle = C.ROSE; roundRect(-250, -44, 500, 88, 44); ctx.fill();
    ctx.restore();
    text('SÓ NO DIA 19', W / 2, 1316, 44, C.WH, { align: 'center', alpha: clamp(tg) });
  }
}

// 6. Presente — caixa abrindo
function scene6(t) {
  bg(C.ROSE);
  rays(W / 2, 900, 1300, t, C.WH, 0.15);
  serif('e você ainda ganha', W / 2, 420, 72, C.WH, { align: 'center', alpha: easeOut(prog(t, T.s6, 0.25)) });
  const o = easeOutBack(prog(t, 20.05, 0.35));
  const cx = W / 2, cy = 900;
  ctx.save(); ctx.translate(cx, cy + Math.sin(t * 3) * 8);
  ctx.fillStyle = C.WINE; roundRect(-170, -60, 340, 240, 18); ctx.fill();
  ctx.fillStyle = C.GOLD; ctx.fillRect(-24, -60, 48, 240);
  // tampa abrindo
  ctx.save(); ctx.translate(0, -60 - o * 90); ctx.rotate(-0.25 * o);
  ctx.fillStyle = C.WINE2; roundRect(-190, -60, 380, 70, 14); ctx.fill();
  ctx.fillStyle = C.GOLD; ctx.fillRect(-24, -60, 48, 70);
  ctx.beginPath(); ctx.ellipse(-48, -76, 46, 26, -0.5, 0, 7); ctx.ellipse(48, -76, 46, 26, 0.5, 0, 7); ctx.fill();
  ctx.restore();
  ctx.restore();
  burst(t, 20.1, cx, cy - 80, C.GOLD, 34, 460);
  if (o > 0.4) { sparkle(cx - 150, cy - 220, 1.2, t, C.WH); sparkle(cx + 170, cy - 260, 0.9, t + 1, C.WH); }
  const g = easeOutBack(prog(t, 20.1, 0.3));
  ctx.save(); ctx.translate(W / 2, 1290); ctx.scale(clamp(g), clamp(g));
  text('UM PRESENTE!', 0, 0, 120, C.WH, { align: 'center' });
  ctx.restore();
}

function rays(cx, cy, r, t, color, alpha) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.5); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r, -r * 0.13); ctx.lineTo(r, r * 0.13); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

// 7. CTA — vinho, "garanta sua vaga pelo direct"
const CLICK5 = 22.5;
function scene7(t) {
  bg(C.WINE);
  glow(W / 2, 950, 620, 'rgba(212,175,106,0.5)', 0.3);
  particles(t, C.GOLD, 45, 0.35);
  const lt = t - T.s7;
  text('CORRE E', W / 2, 350, 80, C.NUDE, { align: 'center', alpha: easeOut(prog(lt, 0, 0.25)) });
  const g = easeOutBack(prog(t, 21.35, 0.3));
  ctx.save(); ctx.translate(W / 2, 490); ctx.scale(clamp(g), clamp(g));
  text('GARANTE SUA VAGA', 0, 0, 82, C.GOLD, { align: 'center' });
  ctx.restore();
  const av = easeOutBack(prog(lt, 0.25, 0.4));
  ctx.save(); ctx.translate(225, 640); ctx.scale(clamp(av), clamp(av)); avatar(0, 0, 70); ctx.restore();
  serif('Alessandra Mendes', 615, 665, 74, C.WH, { align: 'center', alpha: easeOut(prog(lt, 0.3, 0.3)) });
  // botão direct
  const b = easeOutBack(prog(t, 22.2, 0.35));
  if (b > 0) {
    const pulse = 1 + 0.045 * Math.sin((t - 22.2) * 2 * Math.PI * 1.4) * (t > 22.8 ? 1 : 0);
    const press = t >= CLICK5 && t < CLICK5 + 0.15 ? 0.93 : 1;
    ctx.save(); ctx.translate(W / 2, 830); ctx.scale(b * pulse * press, b * pulse * press);
    const gr = ctx.createLinearGradient(-380, 0, 380, 0);
    gr.addColorStop(0, '#E7C88A'); gr.addColorStop(1, '#C9A050');
    ctx.fillStyle = gr; roundRect(-380, -80, 760, 160, 80); ctx.fill();
    // ícone de mensagem
    ctx.translate(-300, 0); ctx.strokeStyle = C.WINE; ctx.lineWidth = 9; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-34, -24); ctx.lineTo(34, -34); ctx.lineTo(10, 34); ctx.lineTo(0, 6); ctx.closePath(); ctx.stroke();
    ctx.restore();
    text('CHAMAR NO DIRECT', W / 2 + 40, 849, 52, C.WINE, { align: 'center', alpha: clamp(b) });
  }
  const h = easeOut(prog(t, 22.9, 0.35));
  text('@alessandramendes.x', W / 2, 990, 52, C.WH, { align: 'center', weight: 700, alpha: h });
  // resumo da oferta
  const r = easeOut(prog(t, 23.4, 0.4));
  ctx.save(); ctx.globalAlpha = r;
  ctx.strokeStyle = 'rgba(212,175,106,0.6)'; ctx.lineWidth = 3; roundRect(140, 1080, 800, 290, 34); ctx.stroke();
  ctx.restore();
  text('Tratamento de melasma', W / 2, 1150, 46, C.NUDE, { align: 'center', weight: 700, alpha: r });
  text('de R$697 por R$285', W / 2, 1230, 58, C.GOLD, { align: 'center', alpha: r });
  text('Dia 19  ·  Setor Marista  ·  Só 10 vagas', W / 2, 1310, 38, C.WH, { align: 'center', weight: 600, alpha: r });
  // contador de vagas pulsando
  const v = 0.6 + 0.4 * Math.abs(Math.sin(t * 3));
  ctx.save(); ctx.globalAlpha = r * v; ctx.fillStyle = '#E25555'; ctx.beginPath(); ctx.arc(W / 2 - 300, 1424, 10, 0, 7); ctx.fill(); ctx.restore();
  text('vagas limitadas — garanta a sua', W / 2 + 20, 1436, 34, C.NUDE, { align: 'center', weight: 600, alpha: r });
}
