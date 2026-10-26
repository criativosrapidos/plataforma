// Anúncio de tráfego v2 (30s): gancho pós-eleição com tensão, case Alessandra (bonequinha) R$2.850 e CTA WhatsApp (voz: Matheus)
// A voz entra em 1,3s; antes disso a trilha de tensão segura a pessoa com a apuração correndo.
window.DURATION = 30;
const T = { s1: 0, s2: 6.4, s4: 9.3, s5: 19.95, s6: 23.95 };
PUNCHES = [[0, 0.04], [0.6, 0.03], [1.1, 0.04], [1.5, 0.05], [1.9, 0.07], [2.2, 0.16], [2.95, 0.06], [4.4, 0.06],
  [6.5, 0.08], [7.0, 0.07], [7.6, 0.12], [8.2, 0.1], [9.4, 0.07], [10.5, 0.1], [13.0, 0.08], [14.3, 0.06], [15.5, 0.07],
  [16.9, 0.15], [20.0, 0.08], [21.0, 0.1], [22.3, 0.1], [23.2, 0.07], [24.0, 0.08], [25.25, 0.13], [27.4, 0.07]];
const easeInOut = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// 1. ATENÇÃO — apuração acirrada correndo, boom em "acabou", zoom no Brasil
function s1(t) {
  bg(C.K); particles(t, C.Y, 60, 0.35);
  // pisca vermelho/amarelo de tensão antes do boom
  if (t < 2.2) { const k = Math.max(0, Math.sin(t * Math.PI * (2 + t * 3))) * 0.06 * (t / 2.2); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = C.Y; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const fl = 1 - prog(t, 2.2, 0.35);
  if (t >= 2.2 && fl > 0) { ctx.save(); ctx.globalAlpha = 0.6 * fl; ctx.fillStyle = C.WH; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const z = easeInOut(prog(t, 2.9, 1.5));
  const R = lerp(380, 745, z), lon0 = lerp(-20 + t * 40, -52, easeOut(prog(t, 0, 2.9))), lat0 = lerp(0, -14, z);
  const m = prog(t, 3.9, 0.5);
  ctx.save(); ctx.globalAlpha = 1 - m; globe(t, lon0, lat0, R, W / 2, lerp(1000, 960, z), z); ctx.restore();
  if (m > 0) {
    const P = brMap(W / 2, 960, 13, m, 0.14);
    const [bx, by] = P(BSB);
    const pin = easeOutBack(prog(t, 4.3, 0.3));
    if (pin > 0) { ctx.save(); ctx.translate(bx, by); ctx.scale(pin, pin); ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill();
      ctx.strokeStyle = C.Y; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 30 + 10 * Math.sin(t * 6), 0, 7); ctx.stroke(); ctx.restore(); }
  }
  // título (capa)
  text('A ELEIÇÃO', 100, 400, 120, C.WH);
  const p = 1 + 0.14 * Math.sin(prog(t, 2.2, 0.35) * Math.PI);
  ctx.save(); ctx.translate(100, 540); ctx.scale(p, p);
  text('ACABOU.', 0, 0, 150, C.Y, { skew: -9 });
  ctx.restore();
  burst(t, 2.2, 400, 480, C.Y, 50, 700);
  // urna + apuração correndo (acirrada: sobe aos trancos)
  urna(830, 1180, 0.5);
  const x = clamp(t / 2.2), jit = x < 1 ? 0.02 * Math.sin(t * 37) : 0;
  const ap = clamp(easeIn(x) * 0.35 + x * 0.65 + jit);
  ctx.save(); ctx.translate(100, 1330);
  text('APURAÇÃO', 0, -24, 34, '#B9BBC1', { weight: 700 });
  text((ap * 100).toFixed(x < 1 ? 2 : 0).replace('.', ',') + '%', 830, -24, 34, C.Y, { align: 'right' });
  ctx.fillStyle = '#2A2D35'; roundRect(0, 0, 830, 26, 13); ctx.fill();
  ctx.fillStyle = C.Y; roundRect(0, 0, 830 * ap, 26, 13); ctx.fill();
  ctx.restore();
  rise('E o resultado pode não ter sido', 100, 1415, 46, C.WH, t, 2.9, { weight: 700 });
  rise('o que você queria.', 100, 1472, 46, C.WH, t, 4.4, { weight: 700 });
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
    rise('O SEU BOLETO', 100, 420, 96, C.K, t, 6.5);
  pop('VENCE DO MESMO', 100, 540, 96, C.K, t, 7.0, { skew: -9 });
  pop('JEITO.', 100, 650, 96, C.K, t, 7.5, { skew: -9 });
  // boletos empilhando
  const B = [['BOLETO', '2.380,00', 6.55], ['ALUGUEL', '3.500,00', 7.0], ['FORNECEDOR', '4.120,00', 7.3], ['FUNCIONÁRIO', '1.890,00', 7.6]];
  B.forEach(([l, v, at], i) => {
    const p = easeOutBack(prog(t, at, 0.32));
    if (p <= 0) return;
    boleto(540 + (i % 2 ? 40 : -40), lerp(400, 830 + i * 115, clamp(p)), 0.8, (i % 2 ? 0.06 : -0.05), l, v);
  });
  // carimbo vence dia 10
  const st = prog(t, 7.6, 0.2);
  if (st > 0) { ctx.save(); ctx.translate(800, 700); ctx.rotate(-0.12); ctx.scale(lerp(2, 1, easeOut(st)), lerp(2, 1, easeOut(st))); ctx.globalAlpha = clamp(st * 2);
    ctx.strokeStyle = '#E0322C'; ctx.lineWidth = 8; roundRect(-170, -50, 340, 100, 14); ctx.stroke();
    text('VENCE DIA 10', 0, 16, 46, '#E0322C', { align: 'center' }); ctx.restore(); }
  const n = easeOutBack(prog(t, 8.2, 0.32));
  if (n > 0) {
    ctx.save(); ctx.translate(W / 2, 1360); ctx.rotate(-0.03); ctx.scale(n, n);
    ctx.fillStyle = C.K; roundRect(-420, -100, 840, 200, 30); ctx.fill();
    text('NENHUM POLÍTICO VAI', 0, -12, 56, C.WH, { align: 'center' });
    text('PAGAR ISSO POR VOCÊ.', 0, 58, 56, C.Y, { align: 'center' });
    ctx.restore();
  }
}

function s5(t) {
  bg(C.K); grid('#FFFFFF', 0.05);
  const P = brMap(W / 2, 1050, 11, 0.5 * (1 - prog(t, 22.2, 0.5)) + 0.15, 0.06);
  const [bx, by] = P(BSB);
  ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(bx, by, 14, 0, 7); ctx.fill();
  rise('Você não controla', 100, 420, 88, C.WH, t, T.s5 + 0.05);
  const r = rise('BRASÍLIA.', 100, 560, 130, C.WH, t, 20.4);
  if (r > 0) strike(100, 560, measure('BRASÍLIA.', 130), 130, t, 21.0);
  rise('Mas controla', 100, 780, 88, C.WH, t, 22.27);
  const s = easeOut(prog(t, 22.75, 0.25));
  if (s > 0) stripWord('O SEU MARKETING.', 100, 920, 104, { reveal: s });
  const f = easeOutBack(prog(t, 23.2, 0.32));
  if (f > 0) { ctx.save(); ctx.translate(W / 2, 1300); ctx.scale(f, f); ctx.rotate(-0.02);
    ctx.strokeStyle = C.Y; ctx.lineWidth = 6; roundRect(-410, -110, 820, 220, 30); ctx.stroke();
    text('SEU FATURAMENTO NÃO', 0, -14, 56, C.WH, { align: 'center' });
    text('PODE DEPENDER DE POLÍTICO.', 0, 56, 50, C.Y, { align: 'center' }); ctx.restore(); }
}

function s6(t) {
  yellowBg();
  for (let k = 0; k < 3; k++) { const p = ((t - T.s6) * 0.9 + k * 0.33) % 1; speedLines(lerp(-500, W + 100, p), [300, 1540, 1660][k], 360, 18, C.K, 34); }
  const lg = easeOutBack(prog(t, T.s6 + 0.1, 0.4));
  ctx.save(); ctx.translate(W / 2, 430); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2)); drawLogo(0, 0, 560, 1, C.K); ctx.restore();
  rise('SEU CRIATIVO POR', W / 2, 640, 60, C.K, t, 24.1, { align: 'center' });
  const p = easeOutBack(prog(t, 25.2, 0.35));
  if (p > 0) { ctx.save(); ctx.translate(W / 2, 900); ctx.scale(p, p);
    ctx.fillStyle = C.K; roundRect(-330, -190, 660, 260, 44); ctx.fill();
    text('R$', -210, -70, 70, C.Y, { align: 'right' });
    text('97', 40, 40, 250, C.Y, { align: 'center' }); ctx.restore();
    burst(t, 25.25, W / 2, 840, C.K, 40, 560); }
  ctaButton('CHAMA NO WHATSAPP', null, 1170, t, 26.0, 27.4);
  const r = easeOut(prog(t, 26.5, 0.4));
  text('pronto em até 24h depois do briefing', W / 2, 1360, 40, C.K, { align: 'center', weight: 700, alpha: r });
  text('sem contrato  ·  sem fidelidade', W / 2, 1420, 34, C.K, { align: 'center', weight: 600, alpha: r });
}

// 4. PROVA — a bonequinha da Alessandra: criativo de R$97 → R$2.850 em 24h, 10 procedimentos
function s4(t) {
  yellowBg();
  pill('CASE REAL', 230, 330, 40, C.K, C.Y, t, T.s4 + 0.05, -0.04);
  rise('Alessandra · estética · Goiânia', 100, 425, 38, C.K, t, 9.6, { weight: 700 });
  // topo: primeiro o criativo de R$97, depois o faturamento contando
  const c = prog(t, 14.2, 2.7), sw = easeOut(prog(t, 14.0, 0.25));
  if (sw < 1) {
    ctx.save(); ctx.globalAlpha = 1 - sw; ctx.translate(W / 2, 600);
    text('fez um criativo de', 0, -70, 44, C.K, { align: 'center', weight: 700, alpha: easeOut(prog(t, 10.2, 0.3)) });
    const q = easeOutBack(prog(t, 10.5, 0.32));
    if (q > 0) { ctx.scale(clamp(q, 0, 1.2), clamp(q, 0, 1.2)); text('R$97', 0, 60, 150, C.K, { align: 'center' }); }
    ctx.restore();
  }
  if (c > 0) {
    const v = Math.min(10, Math.floor(c * 10.001)) * 285;
    ctx.save(); ctx.translate(W / 2, 600); ctx.globalAlpha = sw;
    text('e faturou', 0, -70, 44, C.K, { align: 'center', weight: 700 });
    const k = 1 + 0.12 * Math.sin(prog(t, 16.9, 0.35) * Math.PI); ctx.scale(k, k);
    text('R$' + v.toLocaleString('pt-BR'), 0, 60, 150, C.K, { align: 'center' });
    ctx.restore();
  }
  burst(t, 16.9, W / 2, 560, C.K, 44, 600);
  // a bonequinha entra de baixo e comemora
  const e = easeOutBack(prog(t, T.s4, 0.5));
  boneca(330, lerp(1700, 1080, clamp(e)), 0.82, t, prog(t, 14.4, 0.5));
  // selo do criativo de R$97 e do tempo
  pill('EM 24 HORAS', 330, 760, 40, C.WH, C.K, t, 12.9, 0.05);
  // 10 notificações de venda
  for (let i = 0; i < 10; i++) {
    const at = 14.2 + i * 0.27, p = easeOutBack(prog(t, at, 0.25));
    if (p <= 0) continue;
    const y = 720 + i * 66;
    ctx.save(); ctx.translate(780, y); ctx.scale(p, p);
    ctx.fillStyle = C.WH; roundRect(-150, -30, 300, 60, 18); ctx.fill();
    ctx.fillStyle = '#2E9E5B'; ctx.beginPath(); ctx.arc(-118, 0, 16, 0, 7); ctx.fill();
    text('$', -118, 9, 22, C.WH, { align: 'center' });
    text('Nova venda', -92, -4, 22, '#5B5E66', { weight: 600 });
    text('R$285', -92, 22, 26, C.K);
    text('#' + (i + 1), 136, 10, 24, '#9A9CA3', { align: 'right' });
    ctx.restore();
  }
  // faixa final
  const b = easeOutBack(prog(t, 17.0, 0.3));
  if (b > 0) { ctx.save(); ctx.translate(W / 2, 1445); ctx.rotate(-0.03); ctx.scale(b, b);
    ctx.fillStyle = C.K; roundRect(-420, -56, 840, 100, 26); ctx.fill();
    text('10 PROCEDIMENTOS VENDIDOS', 0, 14, 48, C.Y, { align: 'center' }); ctx.restore(); }
  text('resultado real da cliente · resultados podem variar', W / 2, 1515, 24, '#3A3D44', { align: 'center', weight: 600, alpha: easeOut(prog(t, 17.4, 0.3)) });
}

const SCENES = [
  { at: T.s1, fn: s1 }, { at: T.s2, fn: s2, wipe: true }, { at: T.s4, fn: s4, zoom: true },
  { at: T.s5, fn: s5, zoom: true }, { at: T.s6, fn: s6, zoom: true },
];
