// Criativo 1 — quem anuncia com imagem parada e vê o dinheiro do tráfego ir embora (voz: André)
const T = { s1: 0, s2: 3.44, s3: 8.24, s4: 10.5, s5: 13.76, s6: 20.6, s7: 24.05, s8: 26.64 };
PUNCHES = [[0, 0.05], [0.72, 0.06], [2.8, 0.1], [3.44, 0.06], [5.72, 0.06], [6.96, 0.05], [7.92, 0.05],
  [8.96, 0.06], [9.84, 0.12], [10.72, 0.08], [12.32, 0.06], [13.4, 0.06], [15.12, 0.07], [16.64, 0.05],
  [17.36, 0.05], [18.32, 0.05], [20.08, 0.07], [20.72, 0.08], [23.4, 0.1], [24.32, 0.09], [26.0, 0.13], [27.0, 0.08], [28.64, 0.07]];

// 1. ATENÇÃO — dinheiro no tráfego indo embora (capa no quadro 0)
function v1s1(t) {
  darkBg(t);
  text('VOCÊ TÁ COLOCANDO', 100, 520, 76, C.WH);
  text('DINHEIRO', 100, 660, 150, C.WH);
  text('NO TRÁFEGO...', 100, 790, 112, C.WH);
  const a = easeOutBack(prog(t, 2.24, 0.3));
  ctx.save(); ctx.translate(100, 980); ctx.scale(lerp(1, 1.04, clamp(a)), lerp(1, 1.04, clamp(a)));
  text('E ELE INDO', 0, 0, 112, C.Y, { skew: -9 });
  text('EMBORA?', 0, 128, 150, C.Y, { skew: -9 });
  ctx.restore();
  // cédulas voando pra fora da tela
  for (let i = 0; i < 12; i++) {
    const st = 0.2 + i * 0.22, d = (t - st) % 2.6;
    if (t < st) continue;
    const p = d / 2.6, sp = t > 2.8 ? 1.8 : 1;
    const x = 700 + rand(i) * 260 + p * 500 * sp, y = 1400 - p * 1300 * sp + Math.sin(d * 3 + i) * 30;
    bill(x, y, 0.9 + rand(i + 3) * 0.5, -0.5 + rand(i + 9) + d * 1.5, 1 - p);
  }
}

// 2. DOR — anúncio de imagem parada no feed: ninguém clica, ninguém chama
function v1s2(t) {
  lightBg();
  const ph = easeOut(prog(t, T.s2, 0.4));
  phone(540, 980 + (1 - ph) * 600, 0.86, 0.03, (w, h) => {
    // feed rolando: o anúncio parado passa sem ninguém parar
    const sc = ((t - T.s2) * 140) % 300;
    ctx.fillStyle = '#F2F2F4'; ctx.fillRect(0, 0, w, h);
    for (let k = -1; k < 3; k++) {
      const y = 70 + k * 300 - sc;
      ctx.fillStyle = C.WH; ctx.fillRect(0, y, w, 290);
      ctx.fillStyle = '#D9D9D9'; ctx.beginPath(); ctx.arc(34, y + 28, 16, 0, 7); ctx.fill();
      text('sua_loja · Patrocinado', 60, y + 36, 18, '#555', { weight: 600 });
      ctx.fillStyle = '#C9CACE'; ctx.fillRect(16, y + 56, w - 32, 200);
      text('PROMOÇÃO', w / 2, y + 150, 44, '#9A9CA3', { align: 'center' });
      text('confira!', w / 2, y + 190, 26, '#9A9CA3', { align: 'center', weight: 600 });
    }
  });
  pop('ANÚNCIO DE', 100, 400, 92, C.K, t, 5.04);
  pop('IMAGEM PARADA', 100, 500, 92, C.K, t, 5.72);
  // contadores zerados
  const z = (str, x, y, at) => {
    const p = easeOutBack(prog(t, at, 0.3));
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.04); ctx.scale(p, p);
    ctx.fillStyle = '#E0322C'; roundRect(-200, -52, 400, 104, 26); ctx.fill();
    text(str, 0, 16, 44, C.WH, { align: 'center' });
    ctx.restore();
  };
  z('0 CLIQUES', 300, 1380, 6.64);
  z('0 MENSAGENS', 700, 1460, 7.52);
}

// 3. EXPLICAÇÃO — o problema não é o tráfego, é o criativo
function v1s3(t) {
  darkBg(t);
  rise('O problema', 100, 640, 96, C.WH, t, T.s3);
  rise('não é o', 100, 760, 96, C.WH, t, 8.6);
  const r = rise('TRÁFEGO.', 100, 900, 130, C.WH, t, 8.9);
  if (r > 0) strike(100, 900, measure('TRÁFEGO.', 130), 130, t, 9.6);
  const p = easeOutBack(prog(t, 9.68, 0.32));
  if (p > 0) {
    ctx.save(); ctx.translate(100, 1230); ctx.scale(clamp(p, 0, 1.2), clamp(p, 0, 1.2));
    text('É o', 0, -160, 90, C.WH);
    stripWord('CRIATIVO.', 0, 0, 150, { reveal: easeOut(prog(t, 9.84, 0.25)) });
    ctx.restore();
  }
}

// 4. EXPLICAÇÃO — 3 segundos pra parar ou passar
function v1s4(t) {
  yellowBg();
  const lt = t - T.s4;
  pop('EM', W / 2, 375, 70, C.K, t, T.s4, { align: 'center' });
  // anel preto correndo os 3 segundos em volta do número
  const ring = prog(t, 10.72, 3);
  ctx.save(); ctx.strokeStyle = C.K; ctx.lineWidth = 22; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(W / 2, 680, 250, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ring); ctx.stroke(); ctx.restore();
  const k = 1 + 0.2 * Math.sin(prog(t, 10.72, 0.3) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 820); ctx.scale(k, k);
  text('3', 0, 0, 420, C.K, { align: 'center' });
  ctx.restore();
  rise('SEGUNDOS', W / 2, 1020, 90, C.K, t, 10.96, { align: 'center' });
  rise('a pessoa decide se', W / 2, 1140, 56, C.K, t, 11.44, { align: 'center', weight: 700 });
  pill('PARA...', 330, 1290, 64, C.K, C.Y, t, 12.32, -0.05);
  pill('OU PASSA', 730, 1290, 64, C.WH, C.K, t, 13.12, 0.05);
  // dedo deslizando pra cima (passa)
  const sw = prog(t, 13.3, 0.45);
  if (sw > 0 && sw < 1) { ctx.save(); ctx.globalAlpha = 1 - sw; ctx.fillStyle = C.K;
    ctx.beginPath(); ctx.arc(860, lerp(1500, 1150, easeOut(sw)), 34, 0, 7); ctx.fill(); ctx.restore(); }
}

// 5. SONHO — o anúncio em vídeo que para o scroll e faz chamar
function v1s5(t) {
  darkBg(t);
  glow(W / 2, 980, 620, 'rgba(255,212,0,0.5)', 0.3 + 0.08 * Math.sin(t * 4));
  pop('PARANDO', 100, 360, 110, C.WH, t, 15.12);
  pop('O SCROLL', 100, 480, 110, C.Y, t, 15.4, { skew: -9 });
  phone(540, 1010, 0.8, -0.03, (w, h) => {
    ctx.fillStyle = C.K; ctx.fillRect(0, 0, w, h);
    // vídeo animado: barras de velocidade e play pulsando
    for (let i = 0; i < 4; i++) speedLines(-120 + ((t * 600 + i * 220) % 700), 160 + i * 120, 200, 12, C.Y, 24);
    const pu = 1 + 0.08 * Math.sin(t * 8);
    ctx.save(); ctx.translate(w / 2, 420); ctx.scale(pu, pu); ctx.fillStyle = C.Y;
    ctx.beginPath(); ctx.moveTo(-50, -70); ctx.lineTo(80, 0); ctx.lineTo(-50, 70); ctx.closePath(); ctx.fill(); ctx.restore();
    // onda da locução
    const lo = prog(t, 17.36, 0.2);
    if (lo > 0) for (let i = 0; i < 22; i++) {
      const hh = 10 + 50 * Math.abs(Math.sin(t * 9 + i * 0.7)) * lo;
      ctx.fillStyle = C.WH; roundRect(40 + i * 17, 640 - hh / 2, 9, hh, 4); ctx.fill();
    }
    text('Patrocinado', 24, 40, 18, '#B9BBC1', { weight: 600 });
    // a copy
    const cp = prog(t, 18.32, 0.3);
    if (cp > 0) { ctx.save(); ctx.globalAlpha = cp; ctx.fillStyle = C.Y; roundRect(30, 720, w - 60, 70, 35); ctx.fill();
      text('CHAMA NO WHATSAPP', w / 2, 766, 26, C.K, { align: 'center' }); ctx.restore(); }
  });
  pill('VÍDEO COM MOVIMENTO', 300, 760, 34, C.Y, C.K, t, 16.16, -0.07);
  pill('LOCUÇÃO', 850, 1080, 34, C.WH, C.K, t, 17.36, 0.08);
  pill('COPY QUE VENDE', 300, 1330, 34, C.Y, C.K, t, 18.32, -0.04);
  toast('Nova mensagem', 'Oi! Vi seu anúncio', 560, 1420, t, 19.6);
}

// 6. SOLUÇÃO — a Criativos Rápidos cria isso pra você em até 24h
function v1s6(t) {
  lightBg();
  const lg = easeOutBack(prog(t, 20.7, 0.35));
  ctx.save(); ctx.translate(W / 2, 400); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2));
  drawLogo(0, 0, 560, 1, C.K); ctx.restore();
  rise('cria isso', W / 2, 600, 84, C.K, t, 21.68, { align: 'center' });
  pop('PRA VOCÊ', W / 2, 720, 110, C.K, t, 22.2, { align: 'center', skew: -9 });
  clock24(W / 2, 1100, 270, t, 21.9, 1.5, 23.4);
}

// 7. OBJEÇÃO — sem contrato, a partir de R$97
function v1s7(t) {
  darkBg(t);
  stamp('SEM CONTRATO', 470, t, 24.32, -0.05);
  stamp('SEM FIDELIDADE', 640, t, 24.75, 0.04);
  price(W / 2, 1150, t, 26.0, 'a partir de');
}

// 8. CTA — para de queimar dinheiro, chama a gente agora
function v1s8(t) {
  endCard(t, T.s8, ['Para de queimar', 'dinheiro.'], 'CHAMA A GENTE', 'AGORA', 27.84, 28.7,
    'Anúncios em vídeo que param o scroll', 'sem fidelidade  ·  entrega em até 24h');
}

const SCENES = [
  { at: T.s1, fn: v1s1 }, { at: T.s2, fn: v1s2, wipe: true }, { at: T.s3, fn: v1s3 },
  { at: T.s4, fn: v1s4, zoom: true }, { at: T.s5, fn: v1s5, zoom: true }, { at: T.s6, fn: v1s6, wipe: true },
  { at: T.s7, fn: v1s7 }, { at: T.s8, fn: v1s8, zoom: true },
];
