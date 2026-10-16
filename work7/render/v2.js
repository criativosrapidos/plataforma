// Criativo 2 — quem paga R$1.500 a R$3.000 de agência e não tem post todo dia (voz: André Assis)
// Tempos estimados pelas pausas do take (acelerado 1,04x em ../audio)
const T = { s1: 0, s2: 4.6, s3: 10.75, s4: 13.35, s5: 19.05, s6: 23.8, s7: 27.55 };
PUNCHES = [[0, 0.05], [1.0, 0.07], [2.0, 0.08], [2.85, 0.1], [4.7, 0.06], [6.1, 0.08], [6.85, 0.06], [7.9, 0.06],
  [9.0, 0.06], [10.8, 0.06], [12.4, 0.1], [13.4, 0.06], [15.5, 0.05], [19.1, 0.07], [21.85, 0.13],
  [23.9, 0.09], [25.6, 0.06], [27.6, 0.1], [29.2, 0.07]];

// 1. ATENÇÃO — os valores da mensalidade subindo (capa no quadro 0)
function v2s1(t) {
  darkBg(t);
  text('VOCÊ PAGA', 100, 420, 96, C.WH);
  const vals = [['R$1.500', 0.95], ['R$2.000', 1.95], ['R$3.000', 2.8]];
  vals.forEach(([v, at], i) => {
    // o primeiro valor já aparece na capa; os outros entram na fala
    const a = i === 0 ? 1 + 0.06 * Math.sin(prog(t, at, 0.3) * Math.PI) : easeOutBack(prog(t, at, 0.3));
    // na capa os outros valores já aparecem apagados
    if (i > 0 && a < 1) text(v, 100, 600 + i * 170, 150, '#FFFFFF', { alpha: 0.14 * (1 - clamp(a)), skew: i === 2 ? -9 : 0 });
    if (a <= 0) return;
    ctx.save(); ctx.translate(100, 600 + i * 170); ctx.scale(clamp(a, 0, 1.2), clamp(a, 0, 1.2));
    text(v, 0, 0, 150, i === 2 ? C.Y : C.WH, { skew: i === 2 ? -9 : 0 });
    ctx.restore();
  });
  text('por mês pra uma agência...', 100, 1150, 60, '#B9BBC1', { weight: 700, alpha: 0.35 + 0.65 * easeOut(prog(t, 3.2, 0.3)) });
  // nota fiscal descendo
  const nf = easeOut(prog(t, 0.0, 0.6));
  ctx.save(); ctx.globalAlpha = 0.9 * nf; ctx.translate(780, 1330); ctx.rotate(0.1);
  ctx.fillStyle = C.WH; roundRect(-110, -130, 220, 260, 12); ctx.fill();
  for (let i = 0; i < 5; i++) { ctx.fillStyle = '#C9CACE'; roundRect(-80, -95 + i * 36, i === 4 ? 90 : 160, 14, 7); ctx.fill(); }
  text('MENSALIDADE', 0, 110, 22, '#E0322C', { align: 'center' });
  ctx.restore();
}

// 2. DOR — e o Instagram não tem post todo dia; falta equipe
const MISSING = [['COPYWRITER', 7.3], ['EDITOR DE VÍDEO', 8.1]];
function v2s2(t) {
  lightBg();
  rise('E seu Instagram', 100, 390, 80, C.K, t, T.s2 + 0.05);
  rise('não tem post', 100, 490, 80, C.K, t, 5.1);
  pop('TODO DIA?', 100, 620, 120, C.K, t, 6.0, { skew: -9 });
  MISSING.forEach(([s, at], i) => {
    const r = rise('sem ' + s, 100, 820 + i * 110, 74, C.K, t, at);
    if (r > 0) strike(100 + measure('sem ', 74), 820 + i * 110, measure(s, 74), 74, t, at + 0.35);
  });
  // só um designer correndo atrás
  const d = easeOutBack(prog(t, 8.9, 0.32));
  if (d > 0) {
    ctx.save(); ctx.translate(540, 1200); ctx.scale(d, d);
    ctx.fillStyle = C.K; roundRect(-420, -110, 840, 220, 40); ctx.fill();
    // pessoinha correndo
    const run = Math.sin(t * 14);
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(-320, -40, 26, 0, 7); ctx.fill();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-320, -12); ctx.lineTo(-326, 40); ctx.moveTo(-326, 40); ctx.lineTo(-326 + 26 * run, 82);
    ctx.moveTo(-326, 40); ctx.lineTo(-326 - 26 * run, 82); ctx.moveTo(-322, 4); ctx.lineTo(-322 + 30 * run, 30);
    ctx.moveTo(-322, 4); ctx.lineTo(-322 - 30 * run, 30); ctx.stroke();
    speedLines(-470, -40, 110, 10, C.Y, 22);
    text('só 1 designer', -240, -10, 56, C.WH);
    text('correndo atrás', -240, 56, 56, C.Y, { skew: -9 });
    ctx.restore();
  }
}

// 3. EXPLICAÇÃO — você não paga uma equipe, paga uma pessoa
function v2s3(t) {
  darkBg(t);
  rise('Você não tá', 100, 560, 100, C.WH, t, T.s3);
  rise('pagando', 100, 680, 100, C.WH, t, 11.0);
  const r = rise('UMA EQUIPE.', 100, 820, 120, C.WH, t, 11.3);
  if (r > 0) strike(100, 820, measure('UMA EQUIPE.', 120), 120, t, 12.0);
  rise('Tá pagando', 100, 1040, 100, C.WH, t, 12.4);
  const p = easeOut(prog(t, 12.75, 0.25));
  if (p > 0) stripWord('UMA PESSOA.', 100, 1190, 130, { reveal: p });
  // ícones: 5 lugares vazios e 1 ocupado
  for (let i = 0; i < 5; i++) {
    const a = easeOutBack(prog(t, 11.1 + i * 0.06, 0.3));
    if (a <= 0) continue;
    ctx.save(); ctx.translate(200 + i * 170, 1400); ctx.scale(a, a);
    const on = i === 0;
    ctx.fillStyle = on ? C.Y : 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(0, -30, 30, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 40, 50, 34, 0, Math.PI, 0); ctx.fill();
    ctx.restore();
  }
}

// 4. SONHO — uma equipe inteira postando todo dia
const TEAM = [['COPY', 15.5, [250, 880]], ['DESIGN', 16.0, [790, 860]], ['VÍDEO', 16.5, [240, 1290]], ['LOCUÇÃO', 17.1, [810, 1300]], ['SOCIAL MEDIA', 17.7, [540, 1390]]];
function v2s4(t) {
  yellowBg();
  rise('Imagina ter uma', 100, 410, 80, C.K, t, T.s4 + 0.05);
  pop('EQUIPE INTEIRA', 100, 540, 108, C.K, t, 14.4, { skew: -9 });
  // centro: calendário com check todo dia
  ctx.save(); ctx.translate(540, 1090);
  for (let i = 0; i < 7; i++) {
    const a = easeOutBack(prog(t, 18.2 + i * 0.08, 0.25));
    const x = -270 + i * 90;
    ctx.fillStyle = C.K; roundRect(x - 38, -38, 76, 76, 14); ctx.fill();
    if (a > 0) { ctx.save(); ctx.translate(x, 0); ctx.scale(a, a); ctx.strokeStyle = C.Y; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-4, 14); ctx.lineTo(18, -14); ctx.stroke(); ctx.restore(); }
    text('STQQSSD'[i], x, -56, 26, C.K, { align: 'center' });
  }
  ctx.restore();
  TEAM.forEach(([r, at, [x, y]], i) => {
    const p = easeOutBack(prog(t, at, 0.3));
    if (p <= 0) return;
    const fy = Math.sin(t * 2.4 + i) * 8;
    ctx.save(); ctx.translate(x, y + fy); ctx.rotate((i % 2 ? 1 : -1) * 0.05); ctx.scale(p, p);
    const w = measure(r, 40) + 70;
    ctx.fillStyle = C.K; roundRect(-w / 2, -40, w, 80, 40); ctx.fill();
    text(r, 0, 14, 40, C.Y, { align: 'center' });
    ctx.restore();
  });
  rise('postando todo dia', W / 2, 1475, 56, C.K, t, 18.3, { align: 'center', weight: 700 });
}

// 5. SOLUÇÃO + PREÇO — plano mensal a partir de R$597
function v2s5(t) {
  darkBg(t);
  const lg = easeOutBack(prog(t, 19.15, 0.35));
  ctx.save(); ctx.translate(W / 2, 400); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2));
  drawLogo(0, 0, 560, 1, C.WH); ctx.restore();
  rise('plano mensal a partir de', W / 2, 700, 56, '#B9BBC1', t, 20.4, { align: 'center', weight: 700 });
  const p = easeOutBack(prog(t, 21.85, 0.35));
  if (p > 0) {
    glow(W / 2, 900, 520, 'rgba(255,212,0,0.6)', 0.4 * clamp(p));
    ctx.save(); ctx.translate(W / 2, 1000); ctx.scale(p, p);
    text('R$', -310, -110, 70, C.Y);
    text('597', 30, 0, 300, C.Y, { align: 'center' });
    text('por mês', 0, 90, 50, '#B9BBC1', { align: 'center', weight: 700 });
    ctx.restore();
  }
  burst(t, 21.9, W / 2, 900, C.Y, 46, 620);
  pill('POST TODO DIA', 330, 1270, 38, C.Y, C.K, t, 22.6, -0.05);
  pill('EQUIPE COMPLETA', 720, 1370, 38, C.WH, C.K, t, 22.9, 0.04);
}

// 6. OBJEÇÃO — sem fidelidade: fica porque gosta
function v2s6(t) {
  lightBg();
  stamp('SEM FIDELIDADE', 520, t, 23.9, -0.05, C.K, 88);
  rise('você fica', 100, 820, 96, C.K, t, 25.0);
  pop('PORQUE GOSTA,', 100, 960, 100, C.K, t, 25.5, { skew: -9 });
  const r = rise('não por contrato.', 100, 1120, 84, C.K, t, 26.3);
  if (r > 0) strike(100 + measure('não por ', 84), 1120, measure('contrato.', 84), 84, t, 26.9);
}

// 7. CTA — compara e chama no direct
function v2s7(t) {
  endCard(t, T.s7, ['Compara.'], 'CHAMA A GENTE', 'NO DIRECT', 28.3, 29.3,
    'Planos mensais a partir de R$597', 'copy · design · vídeo · locução · social media');
}

const SCENES = [
  { at: T.s1, fn: v2s1 }, { at: T.s2, fn: v2s2, wipe: true }, { at: T.s3, fn: v2s3 },
  { at: T.s4, fn: v2s4, zoom: true }, { at: T.s5, fn: v2s5, zoom: true }, { at: T.s6, fn: v2s6 },
  { at: T.s7, fn: v2s7, zoom: true },
];
