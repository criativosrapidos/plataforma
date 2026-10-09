// Cenas 5 a 7
const STEPS = [
  { n: '1', l1: 'VOCÊ MANDA', l2: 'AS INFORMAÇÕES', at: 15.52 },
  { n: '2', l1: 'A GENTE', l2: 'CRIA', at: 17.0 },
  { n: '3', l1: 'VOCÊ', l2: 'RECEBE', at: 17.95 },
];

// 5. Prazo — três passos + contador até 24h (fundo claro: nada de texto amarelo)
function scene5(t) {
  bg(C.OW);
  STEPS.forEach((s, i) => {
    const p = easeOutBack(prog(t, s.at - 0.08, 0.35));
    if (p <= 0) return;
    const y = 330 + i * 200;
    const x = lerp(-300, 110, clamp(p));
    const done = i < 2 ? prog(t, STEPS[i + 1].at - 0.1, 0.2) : 0;
    ctx.save(); ctx.globalAlpha = lerp(1, 0.55, done);
    ctx.fillStyle = C.K; ctx.beginPath(); ctx.arc(x + 62, y + 62, 62, 0, 7); ctx.fill();
    text(s.n, x + 62, y + 92, 86, C.Y, { align: 'center' }); // amarelo sobre círculo preto
    text(s.l1, x + 160, y + 56, 62, C.K);
    text(s.l2, x + 160, y + 120, 62, C.K);
    ctx.restore();
  });
  // contador
  const c = prog(t, 18.96, 1.3);
  if (c > 0) {
    const a = easeOut(prog(t, 18.9, 0.25));
    const v = Math.round(easeOut(c) * 24);
    const y = 1180;
    ctx.save(); ctx.globalAlpha = a;
    text('em até', 110, 945, 64, C.K, { weight: 700 });
    ctx.restore();
    const label = `${v}h`;
    const pop = c >= 1 ? 1 + 0.08 * Math.sin(prog(t, 20.2, 0.3) * Math.PI) : 1;
    ctx.save(); ctx.translate(110, y); ctx.scale(pop, pop);
    stripWord(label, 0, 0, 230, { alpha: a, reveal: 1 });
    ctx.restore();
    text('*a partir do briefing completo', 110, 1290, 38, C.G, { weight: 600, alpha: prog(t, 20.3, 0.3) });
  }
}

// 6. Anúncio — gráfico simples subindo em amarelo (sem números)
function scene6(t) {
  bg(C.K);
  const lt = t - T.s6;
  const a = easeOut(prog(lt, 0, 0.25));
  text('Quer seus', 110, 450 + (1 - a) * 40, 104, C.WH, { alpha: a });
  text('anúncios', 110, 565 + (1 - a) * 40, 104, C.WH, { alpha: a });
  const v = easeOutBack(prog(t, 22.25, 0.32));
  ctx.save(); ctx.translate(110, 740); ctx.scale(lerp(0.7, 1, v), lerp(0.7, 1, v));
  text('VENDENDO', 0, 0, 140, C.Y, { skew: -9, alpha: clamp(v * 2) });
  ctx.restore();
  const m = easeOut(prog(t, 22.85, 0.3));
  text('muito mais?', 110, 870, 104, C.WH, { alpha: m });
  // gráfico
  const g = prog(lt, 0.5, 2.0);
  const bx = 130, by = 1330, bw = 110, gap = 40, hs = [120, 170, 240, 320, 430];
  ctx.strokeStyle = '#3A3D45'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(bx - 20, by + 2); ctx.lineTo(bx + 5 * (bw + gap), by + 2); ctx.stroke();
  const pts = [];
  hs.forEach((h, i) => {
    const p = easeOutBack(prog(g, i * 0.12, 0.4));
    const hh = h * clamp(p, 0, 1.15);
    ctx.fillStyle = i === 4 ? C.Y : 'rgba(255,212,0,0.55)';
    roundRect(bx + i * (bw + gap), by - hh, bw, hh, 12); ctx.fill();
    pts.push([bx + i * (bw + gap) + bw / 2, by - hh - 40]);
  });
  // linha de tendência com seta
  const lp = easeOut(prog(g, 0.55, 0.4));
  if (lp > 0) {
    ctx.save(); ctx.strokeStyle = C.Y; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    const n = Math.floor(lp * 4), f = lp * 4 - n;
    for (let i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    let end = pts[Math.min(n, 4)];
    if (n < 4) { end = [lerp(pts[n][0], pts[n + 1][0], f), lerp(pts[n][1], pts[n + 1][1], f)]; ctx.lineTo(end[0], end[1]); }
    ctx.stroke();
    if (lp >= 1) {
      ctx.fillStyle = C.Y; ctx.translate(end[0], end[1]); ctx.rotate(-0.85);
      ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(-14, -26); ctx.lineTo(-14, 26); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}

// 7. Final — logo oficial no amarelo, frase e botão pulsando
const CLICK_AT = 27.26;
function scene7(t) {
  bg(C.Y);
  const lt = t - T.s7;
  const l = easeOutBack(prog(lt, 0, 0.4));
  ctx.save(); ctx.globalAlpha = clamp(l * 1.5);
  // escala uniforme (sem esticar/inclinar)
  const s = lerp(0.85, 1, l);
  ctx.translate(W / 2, 520); ctx.scale(s, s); ctx.translate(-W / 2, -520);
  drawLogo(W / 2, 520, 640);
  ctx.restore();
  const p = easeOut(prog(t, 25.7, 0.3));
  text('Seu vídeo pronto', W / 2, 860 + (1 - p) * 40, 92, C.K, { align: 'center', alpha: p });
  const q = easeOut(prog(t, 26.2, 0.3));
  ctx.save(); ctx.globalAlpha = q;
  const s1 = 'em ', s2 = '24 horas.';
  const w1 = measure(s1, 92), w2 = measure(s2, 92);
  const x0 = W / 2 - (w1 + w2) / 2;
  text(s1, x0, 975, 92, C.K);
  // destaque inclinado sobre faixa preta (texto branco) — amarelo não aparece sobre amarelo
  stripWord(s2, x0 + w1, 975, 92, { stripColor: C.K, textColor: C.WH, reveal: easeOut(prog(t, 26.5, 0.25)) });
  ctx.restore();
  // botão
  const b = easeOutBack(prog(t, 26.95, 0.35));
  if (b > 0) {
    const pulse = 1 + 0.045 * Math.sin((t - 26.95) * 2 * Math.PI * 1.6) * (t > 27.5 ? 1 : 0);
    const press = t >= CLICK_AT && t < CLICK_AT + 0.16 ? 0.93 : 1;
    const bw = 640, bh = 140, cy = 1200;
    ctx.save(); ctx.translate(W / 2, cy); ctx.scale(b * pulse * press, b * pulse * press);
    // anel pulsando
    const ring = ((t - 26.95) * 1.6) % 1;
    if (t > 27.5) { ctx.strokeStyle = `rgba(16,18,22,${0.35 * (1 - ring)})`; ctx.lineWidth = 8; roundRect(-bw / 2 - ring * 40, -bh / 2 - ring * 40, bw + ring * 80, bh + ring * 80, 70 + ring * 40); ctx.stroke(); }
    ctx.fillStyle = C.K; roundRect(-bw / 2, -bh / 2, bw, bh, 70); ctx.fill();
    text('CHAMA NO DIRECT', 0, 22, 60, C.WH, { align: 'center' });
    ctx.restore();
  }
  text('*a partir do briefing completo', W / 2, 1330, 36, C.K, { weight: 600, align: 'center', alpha: easeOut(prog(t, 26.6, 0.3)) * 0.75 });
}
