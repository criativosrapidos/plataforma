// Anúncio de tráfego v6 (29s): final reordenado: Faça como a Alessandra → Chama no WhatsApp → Seu criativo a partir de R$97
// (bonequinha + anúncio real + feedback no WhatsApp) e fechamento "Faça como a Alessandra". Voz: Matheus 1,06x.
window.DURATION = 29;
const T = { s1: 0, s2: 4.6, s5: 7.25, s4: 10.7, s6: 22.7 };
PUNCHES = [[0, 0.05], [0.4, 0.04], [0.95, 0.16], [1.5, 0.06], [2.9, 0.06], [4.75, 0.08], [5.2, 0.07], [5.8, 0.12], [6.4, 0.1],
  [7.35, 0.06], [8.26, 0.16], [8.75, 0.08], [9.2, 0.06], [9.75, 0.12], [10.75, 0.07], [11.6, 0.06], [13.1, 0.12], [15.46, 0.08],
  [16.6, 0.05], [17.6, 0.05], [18.6, 0.06], [19.25, 0.15], [19.5, 0.08], [21.2, 0.12], [22.8, 0.08], [23.9, 0.07], [25.75, 0.13]];
const AD = []; for (let i = 1; i <= 150; i++) { const im = new Image(); im.src = `clips/ad_${String(i).padStart(3, '0')}.jpg`; AD.push(im); }
window.ready = () => Promise.all([...AD, FEED].map((im) => im.complete ? 1 : new Promise((r) => { im.onload = r; im.onerror = r; })));
const easeInOut = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// 1. ATENÇÃO — apuração acirrada correndo, boom em "acabou", zoom no Brasil
function s1(t) {
  bg(C.K); particles(t, C.Y, 60, 0.35);
  // pisca vermelho/amarelo de tensão antes do boom
  if (t < 0.95) { const k = Math.max(0, Math.sin(t * Math.PI * (4 + t * 8))) * 0.07 * (t / 0.95); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = C.Y; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const fl = 1 - prog(t, 0.95, 0.35);
  if (t >= 0.95 && fl > 0) { ctx.save(); ctx.globalAlpha = 0.6 * fl; ctx.fillStyle = C.WH; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const z = easeInOut(prog(t, 1.5, 1.4));
  const R = lerp(380, 745, z), lon0 = lerp(-20 + t * 60, -52, easeOut(prog(t, 0, 1.6))), lat0 = lerp(0, -14, z);
  const m = prog(t, 2.5, 0.5);
  ctx.save(); ctx.globalAlpha = 1 - m; globe(t, lon0, lat0, R, W / 2, lerp(1000, 960, z), z); ctx.restore();
  if (m > 0) {
    const P = brMap(W / 2, 960, 13, m, 0.14);
    const [bx, by] = P(BSB);
    const pin = easeOutBack(prog(t, 2.9, 0.3));
    if (pin > 0) { ctx.save(); ctx.translate(bx, by); ctx.scale(pin, pin); ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill();
      ctx.strokeStyle = C.Y; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 30 + 10 * Math.sin(t * 6), 0, 7); ctx.stroke(); ctx.restore(); }
  }
  // título (capa)
  text('A ELEIÇÃO', 100, 400, 120, C.WH);
  const p = 1 + 0.14 * Math.sin(prog(t, 0.95, 0.35) * Math.PI);
  ctx.save(); ctx.translate(100, 540); ctx.scale(p, p);
  text('ACABOU.', 0, 0, 150, C.Y, { skew: -9 });
  ctx.restore();
  burst(t, 0.95, 400, 480, C.Y, 50, 700);
  // urna + apuração correndo (acirrada: sobe aos trancos)
  urna(830, 1180, 0.5);
  const x = clamp(t / 0.95), jit = x < 1 ? 0.02 * Math.sin(t * 37) : 0;
  const ap = clamp(easeIn(x) * 0.35 + x * 0.65 + jit);
  ctx.save(); ctx.translate(100, 1330);
  text('APURAÇÃO', 0, -24, 34, '#B9BBC1', { weight: 700 });
  text((ap * 100).toFixed(x < 1 ? 2 : 0).replace('.', ',') + '%', 830, -24, 34, C.Y, { align: 'right' });
  ctx.fillStyle = '#2A2D35'; roundRect(0, 0, 830, 26, 13); ctx.fill();
  ctx.fillStyle = C.Y; roundRect(0, 0, 830 * ap, 26, 13); ctx.fill();
  ctx.restore();
  rise('E o resultado pode não ter sido', 100, 1415, 46, C.WH, t, 1.5, { weight: 700 });
  rise('o que você queria.', 100, 1472, 46, C.WH, t, 3.0, { weight: 700 });
}

function s2(t) {
  lightBg();
  const pa = 1, out = 1;
  if (out < 1) {
    ctx.save(); ctx.globalAlpha = 1 - out;
    hazard(820, t, -0.08, clamp(pa)); hazard(1100, -t, 0.06, clamp(pa));
    ctx.save(); ctx.translate(W / 2, 960); ctx.scale(lerp(2.2, 1, easeOut(pa)), lerp(2.2, 1, easeOut(pa))); ctx.rotate(-0.02);
    ctx.fillStyle = C.K; roundRect(-400, -78, 800, 140, 20); ctx.fill();
    text('PRESTA ATENÇÃO.', 0, 22, 84, C.Y, { align: 'center' });
    ctx.restore(); ctx.restore();
  }
    rise('O SEU BOLETO', 100, 420, 96, C.K, t, 4.75);
  pop('VENCE DO MESMO', 100, 540, 96, C.K, t, 5.2, { skew: -9 });
  pop('JEITO.', 100, 650, 96, C.K, t, 5.7, { skew: -9 });
  // boletos empilhando
  const B = [['BOLETO', '2.380,00', 4.8], ['ALUGUEL', '3.500,00', 5.1], ['FORNECEDOR', '4.120,00', 5.4], ['FUNCIONÁRIO', '1.890,00', 5.7]];
  B.forEach(([l, v, at], i) => {
    const p = easeOutBack(prog(t, at, 0.32));
    if (p <= 0) return;
    boleto(540 + (i % 2 ? 40 : -40), lerp(400, 830 + i * 115, clamp(p)), 0.8, (i % 2 ? 0.06 : -0.05), l, v);
  });
  // carimbo vence dia 10
  const st = prog(t, 5.8, 0.2);
  if (st > 0) { ctx.save(); ctx.translate(800, 700); ctx.rotate(-0.12); ctx.scale(lerp(2, 1, easeOut(st)), lerp(2, 1, easeOut(st))); ctx.globalAlpha = clamp(st * 2);
    ctx.strokeStyle = '#E0322C'; ctx.lineWidth = 8; roundRect(-170, -50, 340, 100, 14); ctx.stroke();
    text('VENCE DIA 10', 0, 16, 46, '#E0322C', { align: 'center' }); ctx.restore(); }
  const n = easeOutBack(prog(t, 6.4, 0.32));
  if (n > 0) {
    ctx.save(); ctx.translate(W / 2, 1360); ctx.rotate(-0.03); ctx.scale(n, n);
    ctx.fillStyle = C.K; roundRect(-420, -100, 840, 200, 30); ctx.fill();
    text('NENHUM POLÍTICO VAI', 0, -12, 56, C.WH, { align: 'center' });
    text('PAGAR ISSO POR VOCÊ.', 0, 58, 56, C.Y, { align: 'center' });
    ctx.restore();
  }
}



function s6(t) {
  yellowBg();
  for (let k = 0; k < 3; k++) { const p = ((t - T.s6) * 0.9 + k * 0.33) % 1; speedLines(lerp(-500, W + 100, p), [300, 1540, 1660][k], 360, 18, C.K, 34); }
  const lg = easeOutBack(prog(t, T.s6 + 0.05, 0.4));
  ctx.save(); ctx.translate(W / 2, 410); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2)); drawLogo(0, 0, 520, 1, C.K); ctx.restore();
  // 1º chama no WhatsApp
  ctaButton('CHAMA NO WHATSAPP', null, 680, t, 22.8, 23.9);
  // 2º seu criativo a partir de R$97
  rise('SEU CRIATIVO A PARTIR DE', W / 2, 930, 56, C.K, t, 24.35, { align: 'center' });
  const p = easeOutBack(prog(t, 25.7, 0.35));
  if (p > 0) { ctx.save(); ctx.translate(W / 2, 1230); ctx.scale(p, p);
    ctx.fillStyle = C.K; roundRect(-330, -190, 660, 260, 44); ctx.fill();
    text('R$', -210, -70, 70, C.Y, { align: 'right' });
    text('97', 40, 40, 250, C.Y, { align: 'center' }); ctx.restore();
    burst(t, 25.75, W / 2, 1170, C.K, 40, 560); }
  const r = easeOut(prog(t, 26.6, 0.4));
  text('pronto em até 24h depois do briefing  ·  sem contrato', W / 2, 1420, 29, C.K, { align: 'center', weight: 700, alpha: r });
}


// 5. VIRADA — você não controla a política, mas controla o seu marketing
function s5(t) {
  bg(C.K); grid('#FFFFFF', 0.05); particles(t, C.Y, 40, 0.3);
  brMap(W / 2, 1200, 9, 0.35, 0.05);
  rise('Você não controla', 100, 430, 90, C.WH, t, T.s5 + 0.08);
  const r = pop('A POLÍTICA.', 100, 590, 136, C.WH, t, 8.22);
  if (r > 0) strike(100, 590, measure('A POLÍTICA.', 136), 136, t, 8.75);
  rise('Mas controla', 100, 820, 90, C.WH, t, 9.2);
  const st = easeOut(prog(t, 9.75, 0.25));
  if (st > 0) stripWord('O SEU MARKETING.', 100, 970, 104, { reveal: st });
  const f = easeOutBack(prog(t, 10.15, 0.32));
  if (f > 0) { ctx.save(); ctx.translate(W / 2, 1380); ctx.scale(f, f); ctx.rotate(-0.02);
    ctx.fillStyle = C.K; roundRect(-410, -110, 820, 220, 30); ctx.fill();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 6; roundRect(-410, -110, 820, 220, 30); ctx.stroke();
    text('SEU FATURAMENTO NÃO', 0, -14, 56, C.WH, { align: 'center' });
    text('PODE DEPENDER DE POLÍTICO.', 0, 56, 50, C.Y, { align: 'center' }); ctx.restore(); }
}

// 4. PROVA — uma cena só: bonequinha + anúncio real + vendas + feedback dela no WhatsApp
const FEED = new Image(); FEED.src = 'clips/feedback.png';
function adScreen(t, t0) { return (w, h) => {
  const im = AD[Math.min(149, Math.max(0, Math.floor((t - t0) * 30) % 150))];
  if (im && im.complete && im.naturalWidth) { const dw = h * 0.5625; ctx.drawImage(im, (w - dw) / 2, 0, dw, h); }
}; }
function feedScreen(t) { return (w, h) => {
  ctx.fillStyle = '#0B0B0C'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1C1C1E'; ctx.fillRect(0, 0, w, 120);
  ctx.fillStyle = HAIR; ctx.beginPath(); ctx.arc(70, 78, 30, 0, 7); ctx.fill();
  text('Alessandra', 120, 90, 30, C.WH, { weight: 700 });
  if (!(FEED.complete && FEED.naturalWidth)) return;
  // recorta só a coluna dos balões (x 20–590 do print) pra ficar maior e legível
  const SX = 20, SW = 570, k = w / SW, fh = FEED.naturalHeight * k, y0 = 160;
  ctx.drawImage(FEED, SX, 0, SW, FEED.naturalHeight, 0, y0, w, fh);
  const mark = (x0, x1, y, at) => { const m = easeOut(prog(t, at, 0.4)); if (m <= 0) return;
    ctx.fillStyle = 'rgba(255,212,0,0.38)'; ctx.fillRect((x0 - SX) * k, y0 + (y - 22) * k, (x1 - x0) * k * m, 44 * k); };
  mark(205, 478, 82, 20.0); mark(48, 150, 118, 20.3); mark(140, 305, 230, 20.8); mark(48, 548, 383, 21.3); mark(48, 170, 420, 21.7);
}; }
function s4(t) {
  yellowBg();
  pill('CASE REAL', 230, 330, 40, C.K, C.Y, t, T.s4 + 0.05, -0.04);
  rise('Alessandra · estética · Goiânia', 100, 425, 38, C.K, t, 11.0, { weight: 700 });
  // topo: o criativo de R$97, depois o faturamento contando a cada venda
  const c = prog(t, 16.5, 2.6), sw = easeOut(prog(t, 16.3, 0.25));
  if (sw < 1) {
    ctx.save(); ctx.globalAlpha = 1 - sw; ctx.translate(W / 2, 600);
    text('fez um criativo de', 0, -70, 44, C.K, { align: 'center', weight: 700, alpha: easeOut(prog(t, 11.9, 0.3)) });
    const q = easeOutBack(prog(t, 13.1, 0.32));
    if (q > 0) { ctx.scale(clamp(q, 0, 1.2), clamp(q, 0, 1.2)); text('R$97', 0, 60, 150, C.K, { align: 'center' }); }
    ctx.restore();
  }
  if (c > 0) {
    const v = Math.min(10, Math.floor(c * 10.001)) * 285;
    ctx.save(); ctx.translate(W / 2, lerp(600, 575, easeInOut(prog(t, 19.3, 0.6)))); ctx.globalAlpha = sw;
    text('em 24 horas faturou', 0, -70, 44, C.K, { align: 'center', weight: 700 });
    const k = 1 + 0.12 * Math.sin(prog(t, 19.2, 0.35) * Math.PI); ctx.scale(k, k);
    text('R$' + v.toLocaleString('pt-BR'), 0, 60, 150, C.K, { align: 'center' });
    ctx.restore();
  }
  burst(t, 19.2, W / 2, 560, C.K, 44, 600);
  // fase final (19,3s+): bonequinha vai pro canto, anúncio à esquerda, feedback à direita
  const m = easeInOut(prog(t, 19.3, 0.6));
  const e = easeOutBack(prog(t, T.s4, 0.5));
  boneca(lerp(330, 210, m), lerp(lerp(1700, 1080, clamp(e)), 1330, m), lerp(0.82, 0.4, m), t, prog(t, 16.6, 0.5));
  ctx.save(); ctx.globalAlpha = 1 - m; pill('EM 24 HORAS', 330, 760, 40, C.WH, C.K, t, 15.46, 0.05); ctx.restore();
  // o anúncio real dela (fica a cena toda)
  const ap = easeOutBack(prog(t, 11.6, 0.35));
  if (ap > 0) {
    phone(lerp(790, 220, m), lerp(1090, 900, m), lerp(0.62, 0.46, m) * clamp(ap, 0, 1.1), lerp(0.06, -0.04, m), adScreen(t, 11.6));
    pill('O ANÚNCIO DELA', lerp(790, 220, m), lerp(790, 680, m), 28, C.K, C.Y, t, 11.8, 0.05);
  }
  // cada venda sai do celular e voa pro contador
  for (let i = 0; i < 10; i++) {
    const at = 16.5 + i * 0.26, d = (t - at) / 0.7;
    if (d < 0 || d > 1) continue;
    const x = lerp(790, W / 2 + (i % 2 ? 160 : -160), easeOut(d)), y = lerp(1000, 640, easeOut(d));
    ctx.save(); ctx.globalAlpha = 1 - easeIn(d); ctx.translate(x, y); ctx.scale(1 - 0.3 * d, 1 - 0.3 * d);
    ctx.fillStyle = C.WH; roundRect(-150, -30, 300, 60, 18); ctx.fill();
    ctx.fillStyle = '#2E9E5B'; ctx.beginPath(); ctx.arc(-118, 0, 16, 0, 7); ctx.fill();
    text('$', -118, 9, 22, C.WH, { align: 'center' });
    text('Nova venda', -92, -4, 22, '#5B5E66', { weight: 600 });
    text('R$285', -92, 22, 26, C.K);
    text('#' + (i + 1), 136, 10, 24, '#9A9CA3', { align: 'right' });
    ctx.restore();
  }
  // o feedback dela no WhatsApp entra pela direita
  const fb = easeOutBack(prog(t, 19.4, 0.45));
  if (fb > 0) {
    phone(lerp(1350, 680, clamp(fb, 0, 1.05)), 1060, 0.95, 0.03, feedScreen(t));
    pill('O FEEDBACK DELA', 680, 690, 30, C.K, C.Y, t, 19.7, -0.04);
  }
  const b = easeOutBack(prog(t, 19.25, 0.3));
  if (b > 0) { ctx.save(); ctx.translate(W / 2, 1462); ctx.rotate(-0.03); ctx.scale(b, b);
    ctx.fillStyle = C.K; roundRect(-420, -56, 840, 100, 26); ctx.fill();
    const fl = prog(t, 21.15, 0.25);
    ctx.save(); ctx.scale(1, Math.abs(Math.cos(fl * Math.PI)) || 0.001);
    if (fl < 0.5) text('10 PROCEDIMENTOS VENDIDOS', 0, 14, 48, C.Y, { align: 'center' });
    else text('FAÇA COMO A ALESSANDRA!', 0, 16, 54, C.Y, { align: 'center' });
    ctx.restore(); ctx.restore(); }
  text('resultado real da cliente · resultados podem variar', 100, 470, 24, '#3A3D44', { weight: 600, alpha: easeOut(prog(t, 11.3, 0.3)) });
}

const SCENES = [
  { at: T.s1, fn: s1 }, { at: T.s2, fn: s2, wipe: true }, { at: T.s5, fn: s5, zoom: true },
  { at: T.s4, fn: s4, zoom: true }, { at: T.s6, fn: s6, zoom: true },
];
