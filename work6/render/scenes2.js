// Cenas 4 a 7: solução, entrega em 24h, objeção (preço) e convite
const ROLES = [['COPY', -0.5], ['DESIGN', 0.5], ['VÍDEO', 1.0], ['LOCUÇÃO', -1.0], ['SOCIAL MEDIA', 0.0]];
const ROLEPOS = [[260, 440], [800, 470], [790, 1240], [270, 1260], [540, 1400]];

// 4. SOLUÇÃO — "A gente cria pra você": uma equipe inteira
function scene4(t) {
  bg(C.K); grid('#FFFFFF', 0.05);
  glow(W / 2, 860, 600, 'rgba(255,212,0,0.55)', 0.3 + 0.1 * Math.sin(t * 4));
  dottedRing(W / 2, 860, 400, 400, t, C.Y, 0.35);
  const a = easeOutBack(prog(t, T.s4 + 0.02, 0.28));
  ctx.save(); ctx.translate(W / 2, 830); ctx.scale(clamp(a), clamp(a));
  text('A GENTE CRIA', 0, 0, 104, C.WH, { align: 'center' });
  ctx.restore();
  const b = easeOutBack(prog(t, 15.4, 0.3));
  ctx.save(); ctx.translate(W / 2, 960); ctx.scale(lerp(0.4, 1, clamp(b)), lerp(0.4, 1, clamp(b)));
  text('PRA VOCÊ.', 0, 0, 132, C.Y, { align: 'center', skew: -9, alpha: clamp(b * 2) });
  ctx.restore();
  // a equipe entra em volta
  ROLES.forEach(([r, rot], i) => {
    const p = easeOutBack(prog(t, 14.75 + i * 0.12, 0.3));
    if (p <= 0) return;
    const [x, y] = ROLEPOS[i];
    const fy = Math.sin(t * 2.4 + i) * 10;
    ctx.save(); ctx.translate(lerp(W / 2, x, clamp(p)), lerp(860, y, clamp(p)) + fy); ctx.rotate(rot * 0.06); ctx.scale(p, p);
    const w = measure(r, 40) + 70;
    ctx.fillStyle = C.Y; roundRect(-w / 2, -40, w, 80, 40); ctx.fill();
    text(r, 0, 14, 40, C.K, { align: 'center' });
    ctx.restore();
  });
  text('UMA EQUIPE INTEIRA', W / 2, 330, 40, '#B9BBC1', { align: 'center', weight: 700, alpha: easeOut(prog(t, 14.8, 0.3)) });
}

// 5. COMO FUNCIONA — você manda as informações → recebe em até 24h (relógio)
const easeInOut2 = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const TYPES = ['Stories', 'Posts', 'Carrosséis', 'Reels', 'Anúncios'];
function scene5(t) {
  bg(C.OW); grid('#101216', 0.05);
  // briefing: documento preenchendo
  const d = easeOutBack(prog(t, T.s5 + 0.05, 0.3));
  ctx.save(); ctx.translate(250, 480); ctx.rotate(-0.08); ctx.scale(clamp(d), clamp(d));
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; roundRect(-120, -140, 250, 300, 22); ctx.fill();
  ctx.fillStyle = C.WH; roundRect(-130, -150, 250, 300, 22); ctx.fill();
  ctx.fillStyle = C.Y; roundRect(-100, -120, 90, 22, 11); ctx.fill();
  for (let i = 0; i < 5; i++) { const f = easeOut(prog(t, 16.6 + i * 0.25, 0.25)); ctx.fillStyle = '#C9CACE'; roundRect(-100, -70 + i * 40, 190 * f * (i % 2 ? 0.7 : 1), 16, 8); ctx.fill(); }
  ctx.restore();
  text('VOCÊ MANDA', 430, 470, 78, C.K, { alpha: clamp(d) });
  text('as informações do seu negócio', 430, 525, 32, '#5B5E66', { weight: 600, alpha: easeOut(prog(t, 16.9, 0.3)) });
  // seta pontilhada até o relógio
  const ar = prog(t, 17.4, 0.5);
  if (ar > 0) { ctx.save(); ctx.strokeStyle = C.K; ctx.lineWidth = 6; ctx.setLineDash([4, 16]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(250, 650); ctx.quadraticCurveTo(260, 800, 380, 860 * 1); ctx.stroke(); ctx.restore(); }
  // relógio: anel amarelo correndo + 24H
  const c = easeOutBack(prog(t, 17.8, 0.35));
  if (c > 0) {
    const cx = 600, cy = 980;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(clamp(c), clamp(c));
    ctx.fillStyle = C.K; ctx.beginPath(); ctx.arc(0, 0, 260, 0, 7); ctx.fill();
    const sweep = easeInOut2(prog(t, 17.9, 1.95));
    ctx.strokeStyle = C.Y; ctx.lineWidth = 26; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 225, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sweep); ctx.stroke();
    const hrs = Math.round(24 * sweep);
    const pop = 1 + 0.12 * Math.sin(prog(t, 19.85, 0.3) * Math.PI);
    ctx.scale(pop, pop);
    text('EM ATÉ', 0, -80, 36, '#B9BBC1', { align: 'center', weight: 700 });
    text(hrs + 'H', 0, 60, 170, C.Y, { align: 'center' });
    ctx.restore();
    burst(t, 19.85, cx, cy, C.Y, 40, 560);
    text('depois do briefing respondido', cx, 1300, 32, '#5B5E66', { align: 'center', weight: 600, alpha: easeOut(prog(t, 20.2, 0.3)) });
  }
  // o que chega
  TYPES.forEach((s, i) => {
    const p = easeOutBack(prog(t, 20.2 + i * 0.1, 0.28));
    if (p <= 0) return;
    if (i === 4) return; // anúncios entra como sticker ao lado do relógio
    const xx = [170, 360, 590, 820][i];
    ctx.save(); ctx.translate(xx, 1410); ctx.scale(p, p);
    const w = measure(s, 32) + 44;
    ctx.fillStyle = C.K; roundRect(-w / 2, -32, w, 64, 32); ctx.fill();
    text(s, 0, 11, 32, C.WH, { align: 'center' });
    ctx.restore();
  });
  sticker('ANÚNCIOS', 860, 760, 36, t, 20.6, { rot: 0.14, bgc: C.Y });
}

// 6. OBJEÇÃO — sem contrato, sem fidelidade, a partir de R$97
function scene6(t) {
  bg(C.K); grid('#FFFFFF', 0.05);
  particles(t, C.Y, 40, 0.35);
  const stamp = (str, y, at, rot) => {
    const p = prog(t, at, 0.22);
    if (p <= 0) return;
    const e = easeOut(p);
    ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); ctx.scale(lerp(2.4, 1, e), lerp(2.4, 1, e)); ctx.globalAlpha = clamp(p * 2);
    const w = measure(str, 80) + 80;
    ctx.strokeStyle = C.WH; ctx.lineWidth = 8; roundRect(-w / 2, -70, w, 120, 18); ctx.stroke();
    text(str, 0, 18, 80, C.WH, { align: 'center' });
    ctx.restore();
  };
  stamp('SEM CONTRATO', 430, 21.45, -0.05);
  stamp('SEM FIDELIDADE', 600, 21.95, 0.04);
  text('a partir de', W / 2, 820, 60, '#B9BBC1', { align: 'center', weight: 700, alpha: easeOut(prog(t, 22.35, 0.3)) });
  const p = easeOutBack(prog(t, 23.3, 0.35));
  if (p > 0) {
    glow(W / 2, 1020, 520, 'rgba(255,212,0,0.6)', 0.4 * clamp(p));
    ctx.save(); ctx.translate(W / 2, 1090); ctx.scale(p * (1 + 0.02 * Math.sin(t * 6)), p * (1 + 0.02 * Math.sin(t * 6)));
    text('R$', -250, -120, 80, C.Y);
    text('97', 40, 0, 330, C.Y, { align: 'center' });
    ctx.restore();
  }
  burst(t, 23.35, W / 2, 1000, C.Y, 46, 620);
  const l = easeOutBack(prog(t, 23.9, 0.3));
  if (l > 0) {
    ctx.save(); ctx.translate(W / 2, 1290); ctx.scale(l, l);
    ctx.fillStyle = C.Y; roundRect(-250, -42, 500, 84, 42); ctx.fill();
    ctx.restore();
    text('PACOTE LARGADA', W / 2, 1305, 40, C.K, { align: 'center', alpha: clamp(l) });
  }
}

// 7. CONVITE — logo + responde essa mensagem agora
const CLICK = 28.05;
function scene7(t) {
  bg(C.Y); grid('#101216', 0.06);
  for (let k = 0; k < 3; k++) {
    const p = ((t - T.s7) * 0.9 + k * 0.33) % 1;
    speedLines(lerp(-500, W + 100, p), [300, 1540, 1660][k], 360, 18, C.K, 34);
  }
  const lg = easeOutBack(prog(t, 24.85, 0.4));
  ctx.save(); ctx.translate(W / 2, 560); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2));
  drawLogo(0, 0, 700, 1, C.K);
  ctx.restore();
  const q = easeOut(prog(t, 26.95, 0.3));
  text('Bora começar?', W / 2, 860 + (1 - q) * 40, 96, C.K, { align: 'center', alpha: q });
  const b = easeOutBack(prog(t, 27.2, 0.35));
  if (b > 0) {
    const pulse = 1 + 0.04 * Math.sin((t - 27.2) * 2 * Math.PI * 1.4) * (t > 28.4 ? 1 : 0);
    const press = t >= CLICK && t < CLICK + 0.15 ? 0.92 : 1;
    ctx.save(); ctx.translate(W / 2, 1060); ctx.scale(b * pulse * press, b * pulse * press);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; roundRect(-405, -85, 820, 180, 90); ctx.fill();
    ctx.fillStyle = C.K; roundRect(-410, -95, 820, 180, 90); ctx.fill();
    logoMark(-350, -38, 0.6, C.Y);
    text('RESPONDE ESSA', 40, -12, 54, C.Y, { align: 'center' });
    text('MENSAGEM AGORA', 40, 50, 54, C.Y, { align: 'center' });
    ctx.restore();
    // mão/cursor tocando
    const hp = prog(t, 27.6, 0.45);
    if (hp > 0) {
      const hx = lerp(980, 860, easeOut(hp)), hy = lerp(1400, 1150, easeOut(hp)) + (t >= CLICK && t < CLICK + 0.15 ? 10 : 0);
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.3);
      ctx.fillStyle = C.WH; ctx.strokeStyle = C.K; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 90); ctx.lineTo(22, 70); ctx.lineTo(38, 104); ctx.lineTo(52, 97); ctx.lineTo(36, 64); ctx.lineTo(64, 64); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
    if (t >= CLICK) { const r = prog(t, CLICK, 0.5); ctx.save(); ctx.globalAlpha = 1 - r; ctx.strokeStyle = C.K; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(860, 1150, 30 + r * 90, 0, 7); ctx.stroke(); ctx.restore(); }
  }
  const r = easeOut(prog(t, 28.4, 0.4));
  text('Largada · Acelera · Turbo', W / 2, 1290, 44, C.K, { align: 'center', alpha: r });
  text('sem fidelidade  ·  entrega em até 24h', W / 2, 1350, 34, C.K, { align: 'center', weight: 600, alpha: r });
}
