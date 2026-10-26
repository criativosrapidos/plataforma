// Anúncio de tráfego: gancho pós-eleição (neutro, sem candidato) + case Alessandra + CTA WhatsApp (voz: Rodrigo)
window.DURATION = 39;
const T = { s1: 0, s2: 5.4, s3: 13.3, s4: 16.8, s5: 26.45, s6: 32.55 };
PUNCHES = [[0, 0.05], [0.7, 0.08], [2.3, 0.06], [5.45, 0.13], [6.6, 0.07], [7.8, 0.12], [8.82, 0.06], [9.6, 0.06],
  [10.3, 0.06], [11.1, 0.1], [13.4, 0.05], [15.6, 0.1], [16.9, 0.07], [19.4, 0.1], [21.9, 0.07], [24.8, 0.15],
  [26.5, 0.08], [27.6, 0.1], [28.3, 0.1], [29.9, 0.07], [32.6, 0.08], [34.2, 0.13], [37.0, 0.07]];

const CLIP = []; for (let i = 1; i <= 180; i++) { const im = new Image(); im.src = `clips/ale_${String(i).padStart(3, '0')}.jpg`; CLIP.push(im); }
window.ready = () => Promise.all(CLIP.map((im) => im.complete ? 1 : new Promise((r) => { im.onload = r; im.onerror = r; })));

// 1. ATENÇÃO — globo, zoom no Brasil, apuração 100%
function s1(t) {
  bg(C.K); particles(t, C.Y, 50, 0.3);
  const z = easeInOut(prog(t, 2.3, 1.6));
  const R = lerp(380, 745, z), lon0 = lerp(-20 + t * 12, -52, easeOut(prog(t, 0, 2.6))), lat0 = lerp(0, -14, z);
  // mapa nítido entra enquanto o globo some
  const m = prog(t, 3.3, 0.5);
  ctx.save(); ctx.globalAlpha = 1 - m; globe(t, lon0, lat0, R, W / 2, lerp(1050, 960, z), z); ctx.restore();
  if (m > 0) {
    const P = brMap(W / 2, 960, 13, m, 0.14);
    const [bx, by] = P(BSB);
    const pin = easeOutBack(prog(t, 3.7, 0.3));
    if (pin > 0) { ctx.save(); ctx.translate(bx, by); ctx.scale(pin, pin); ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill();
      ctx.strokeStyle = C.Y; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 30 + 10 * Math.sin(t * 6), 0, 7); ctx.stroke(); ctx.restore(); }
  }
  // título (capa)
  const up = easeOut(prog(t, 2.3, 0.5)) * 40;
  text('A ELEIÇÃO', 100, 400 - up, 120, C.WH);
  const p = 1 + 0.06 * Math.sin(prog(t, 0.7, 0.35) * Math.PI);
  ctx.save(); ctx.translate(100, 540 - up); ctx.scale(p, p);
  text('ACABOU.', 0, 0, 150, C.Y, { skew: -9 });
  ctx.restore();
  // urna + barra de apuração
  const u = easeOutBack(prog(t, 2.6, 0.35));
  if (u > 0) {
    urna(830, 1180, 0.5 * u);
    const ap = easeOut(prog(t, 2.8, 1.4));
    ctx.save(); ctx.translate(100, 1330);
    text('APURAÇÃO', 0, -24, 34, '#B9BBC1', { weight: 700, alpha: clamp(u) });
    text(Math.round(ap * 100) + '%', 830, -24, 34, C.Y, { align: 'right', alpha: clamp(u) });
    ctx.fillStyle = '#2A2D35'; roundRect(0, 0, 830, 26, 13); ctx.fill();
    ctx.fillStyle = C.Y; roundRect(0, 0, 830 * ap, 26, 13); ctx.fill();
    ctx.restore();
  }
  rise('E o resultado pode não ter sido', 100, 1415, 46, C.WH, t, 3.1, { weight: 700 });
  rise('o que você queria.', 100, 1472, 46, C.WH, t, 4.0, { weight: 700, alpha: 1 });
}

// 2. DOR — presta atenção: o boleto vence do mesmo jeito
function s2(t) {
  lightBg();
  const pa = prog(t, T.s2, 0.25), out = prog(t, 6.45, 0.3);
  if (out < 1) {
    ctx.save(); ctx.globalAlpha = 1 - out;
    hazard(820, t, -0.08, clamp(pa)); hazard(1100, -t, 0.06, clamp(pa));
    ctx.save(); ctx.translate(W / 2, 960); ctx.scale(lerp(2.2, 1, easeOut(pa)), lerp(2.2, 1, easeOut(pa))); ctx.rotate(-0.02);
    ctx.fillStyle = C.K; roundRect(-400, -78, 800, 140, 20); ctx.fill();
    text('PRESTA ATENÇÃO.', 0, 22, 84, C.Y, { align: 'center' });
    ctx.restore(); ctx.restore();
  }
  if (t < 6.5) return;
  rise('O SEU BOLETO', 100, 420, 96, C.K, t, 6.55);
  pop('VENCE DO MESMO', 100, 540, 96, C.K, t, 7.3, { skew: -9 });
  pop('JEITO.', 100, 650, 96, C.K, t, 7.8, { skew: -9 });
  // boletos empilhando
  const B = [['BOLETO', '2.380,00', 6.7], ['ALUGUEL', '3.500,00', 8.82], ['FORNECEDOR', '4.120,00', 9.6], ['FUNCIONÁRIO', '1.890,00', 10.3]];
  B.forEach(([l, v, at], i) => {
    const p = easeOutBack(prog(t, at, 0.32));
    if (p <= 0) return;
    boleto(540 + (i % 2 ? 40 : -40), lerp(400, 830 + i * 115, clamp(p)), 0.8, (i % 2 ? 0.06 : -0.05), l, v);
  });
  // carimbo vence dia 10
  const st = prog(t, 7.8, 0.2);
  if (st > 0) { ctx.save(); ctx.translate(800, 700); ctx.rotate(-0.12); ctx.scale(lerp(2, 1, easeOut(st)), lerp(2, 1, easeOut(st))); ctx.globalAlpha = clamp(st * 2);
    ctx.strokeStyle = '#E0322C'; ctx.lineWidth = 8; roundRect(-170, -50, 340, 100, 14); ctx.stroke();
    text('VENCE DIA 10', 0, 16, 46, '#E0322C', { align: 'center' }); ctx.restore(); }
  const n = easeOutBack(prog(t, 11.1, 0.32));
  if (n > 0) {
    ctx.save(); ctx.translate(W / 2, 1360); ctx.rotate(-0.03); ctx.scale(n, n);
    ctx.fillStyle = C.K; roundRect(-420, -100, 840, 200, 30); ctx.fill();
    text('NENHUM POLÍTICO VAI', 0, -12, 56, C.WH, { align: 'center' });
    text('PAGAR ISSO POR VOCÊ.', 0, 58, 56, C.Y, { align: 'center' });
    ctx.restore();
  }
}

// 3. DOR — quem espera o país melhorar pra vender, fica esperando
function s3(t) {
  bg(C.K); grid('#FFFFFF', 0.05);
  rise('Quem fica esperando', 100, 440, 80, C.WH, t, T.s3 + 0.05);
  rise('o país melhorar', 100, 540, 80, C.WH, t, 13.9);
  rise('pra vender...', 100, 640, 80, C.WH, t, 14.6);
  // ampulheta girando
  ctx.save(); ctx.translate(540, 980); ctx.rotate(Math.floor(t / 1.2) * Math.PI + easeInOut(clamp((t % 1.2) / 0.3)) * Math.PI);
  ctx.strokeStyle = C.Y; ctx.lineWidth = 10; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-110, -160); ctx.lineTo(110, -160); ctx.lineTo(12, 0); ctx.lineTo(110, 160); ctx.lineTo(-110, 160); ctx.lineTo(-12, 0); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = C.Y; ctx.beginPath(); ctx.moveTo(-70, 150); ctx.lineTo(70, 150); ctx.lineTo(0, 70); ctx.closePath(); ctx.fill();
  ctx.restore();
  // carregando travado
  const l = easeOut(prog(t, 13.6, 1.2)) * 0.03;
  ctx.fillStyle = '#2A2D35'; roundRect(140, 1260, 800, 30, 15); ctx.fill();
  ctx.fillStyle = '#E0322C'; roundRect(140, 1260, Math.max(30, 800 * l), 30, 15); ctx.fill();
  text('esperando o Brasil melhorar... 3%', 140, 1240, 32, '#B9BBC1', { weight: 600 });
  const p = easeOutBack(prog(t, 15.6, 0.3));
  if (p > 0) { ctx.save(); ctx.translate(W / 2, 1420); ctx.scale(p, p); ctx.rotate(-0.03);
    ctx.fillStyle = '#E0322C'; roundRect(-400, -70, 800, 130, 28); ctx.fill();
    text('VAI FICAR ESPERANDO.', 0, 20, 62, C.WH, { align: 'center' }); ctx.restore(); }
}

// 4. PROVA — case Alessandra: R$97 → mais de R$1.500 em menos de 24h
function s4(t) {
  yellowBg();
  pill('CASE REAL', 240, 330, 40, C.K, C.Y, t, T.s4 + 0.05, -0.04);
  rise('Alessandra · estética · Goiânia', 100, 430, 40, C.K, t, 17.3, { weight: 700 });
  // celular com o anúncio dela
  const ph = easeOut(prog(t, T.s4, 0.45));
  ctx.save(); ctx.globalAlpha = ph;
  phone(330, 900 + (1 - ph) * 300, 0.7, -0.05, (w, h) => {
    const im = CLIP[Math.min(179, Math.max(0, Math.floor((t - T.s4) * 30) % 180))];
    if (im && im.complete && im.naturalWidth) { const dw = h * 0.5625; ctx.drawImage(im, (w - dw) / 2, 0, dw, h); }
  });
  ctx.restore();
  // coluna da direita: investiu, tempo, vendeu
  const iv = easeOutBack(prog(t, 18.9, 0.3));
  if (iv > 0) { ctx.save(); ctx.translate(760, 640); ctx.scale(iv, iv);
    text('investiu', 0, -70, 40, C.K, { align: 'center', weight: 700 });
    text('R$97', 0, 30, 110, C.K, { align: 'center' }); ctx.restore(); }
  const tm = easeOutBack(prog(t, 21.9, 0.3));
  if (tm > 0) { ctx.save(); ctx.translate(760, 860); ctx.scale(tm, tm);
    ctx.fillStyle = C.K; roundRect(-170, -60, 340, 120, 60); ctx.fill();
    text('< 24H', 0, 24, 70, C.Y, { align: 'center' }); ctx.restore(); }
  // contador de vendas
  const c = prog(t, 23.9, 1.0);
  if (c > 0) {
    const v = Math.round(1500 * easeOut(c) / 10) * 10;
    glow(W / 2, 1300, 520, 'rgba(255,255,255,0.7)', 0.35 * clamp(c * 2));
    ctx.save(); ctx.translate(W / 2, 1330);
    const k = 1 + 0.1 * Math.sin(prog(t, 24.85, 0.3) * Math.PI); ctx.scale(k, k);
    text('vendeu mais de', 0, -150, 44, C.K, { align: 'center', weight: 700 });
    text('R$' + v.toLocaleString('pt-BR'), 0, 0, 170, C.K, { align: 'center' });
    ctx.restore();
    burst(t, 24.85, W / 2, 1270, C.K, 40, 560);
  }
  text('resultado real da cliente · resultados podem variar', W / 2, 1470, 26, '#3A3D44', { align: 'center', weight: 600, alpha: easeOut(prog(t, 25.0, 0.3)) });
}

// 5. VIRADA — você não controla Brasília, mas controla o seu marketing
function s5(t) {
  bg(C.K); grid('#FFFFFF', 0.05);
  const P = brMap(W / 2, 1050, 11, 0.5 * (1 - prog(t, 28.2, 0.5)) + 0.15, 0.06);
  const [bx, by] = P(BSB);
  ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(bx, by, 14, 0, 7); ctx.fill();
  rise('Você não controla', 100, 420, 88, C.WH, t, T.s5 + 0.05);
  const r = rise('BRASÍLIA.', 100, 560, 130, C.WH, t, 26.9);
  if (r > 0) strike(100, 560, measure('BRASÍLIA.', 130), 130, t, 27.6);
  rise('Mas controla', 100, 780, 88, C.WH, t, 28.27);
  const s = easeOut(prog(t, 28.9, 0.25));
  if (s > 0) stripWord('O SEU MARKETING.', 100, 920, 104, { reveal: s });
  const f = easeOutBack(prog(t, 29.9, 0.32));
  if (f > 0) { ctx.save(); ctx.translate(W / 2, 1300); ctx.scale(f, f); ctx.rotate(-0.02);
    ctx.strokeStyle = C.Y; ctx.lineWidth = 6; roundRect(-410, -110, 820, 220, 30); ctx.stroke();
    text('SEU FATURAMENTO NÃO', 0, -14, 56, C.WH, { align: 'center' });
    text('PODE DEPENDER DE POLÍTICO.', 0, 56, 50, C.Y, { align: 'center' }); ctx.restore(); }
}

// 6. CTA — anúncio em vídeo por R$97, chama no WhatsApp
function s6(t) {
  yellowBg();
  for (let k = 0; k < 3; k++) { const p = ((t - T.s6) * 0.9 + k * 0.33) % 1; speedLines(lerp(-500, W + 100, p), [300, 1540, 1660][k], 360, 18, C.K, 34); }
  const lg = easeOutBack(prog(t, T.s6 + 0.1, 0.4));
  ctx.save(); ctx.translate(W / 2, 430); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2)); drawLogo(0, 0, 560, 1, C.K); ctx.restore();
  rise('ANÚNCIO EM VÍDEO POR', W / 2, 640, 60, C.K, t, 32.7, { align: 'center' });
  const p = easeOutBack(prog(t, 34.1, 0.35));
  if (p > 0) { ctx.save(); ctx.translate(W / 2, 900); ctx.scale(p, p);
    ctx.fillStyle = C.K; roundRect(-330, -190, 660, 260, 44); ctx.fill();
    text('R$', -210, -70, 70, C.Y, { align: 'right' });
    text('97', 40, 40, 250, C.Y, { align: 'center' }); ctx.restore();
    burst(t, 34.15, W / 2, 840, C.K, 40, 560); }
  ctaButton('CHAMA NO WHATSAPP', null, 1170, t, 35.2, 37.0);
  const r = easeOut(prog(t, 35.6, 0.4));
  text('pronto em até 24h depois do briefing', W / 2, 1360, 40, C.K, { align: 'center', weight: 700, alpha: r });
  text('sem contrato  ·  sem fidelidade', W / 2, 1420, 34, C.K, { align: 'center', weight: 600, alpha: r });
}

const easeInOut = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const SCENES = [
  { at: T.s1, fn: s1 }, { at: T.s2, fn: s2 }, { at: T.s3, fn: s3, wipe: true },
  { at: T.s4, fn: s4, zoom: true }, { at: T.s5, fn: s5, zoom: true }, { at: T.s6, fn: s6, zoom: true },
];
