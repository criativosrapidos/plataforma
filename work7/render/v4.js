// Criativo 4 — quem está abrindo um negócio novo (voz: Christine). Tempos pelas pausas do take.
const T = { s1: 0, s2: 2.95, s3: 6.25, s4: 10.85, s5: 18.45, s6: 23.38, s7: 26.72 };
PUNCHES = [[0, 0.05], [0.9, 0.07], [1.7, 0.12], [3.1, 0.06], [4.45, 0.06], [5.35, 0.08], [6.35, 0.06],
  [7.55, 0.07], [8.5, 0.07], [9.65, 0.12], [11.0, 0.05], [12.6, 0.08], [13.9, 0.06], [14.75, 0.06],
  [15.75, 0.06], [16.3, 0.06], [17.4, 0.07], [18.55, 0.07], [22.6, 0.1], [23.5, 0.1], [25.5, 0.13], [26.8, 0.08], [29.0, 0.07]];

// fachada de loja com toldo listrado; door = 0..1 (portas abrindo)
function storefront(cx, cy, s, t, door, sign) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = C.WH; ctx.fillRect(-300, -160, 600, 420);
  ctx.fillStyle = C.K; ctx.fillRect(-320, -250, 640, 100);
  text(sign, 0, -182, 50, C.Y, { align: 'center' });
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? C.Y : C.K;
    ctx.beginPath(); ctx.moveTo(-340 + i * 85, -150); ctx.lineTo(-255 + i * 85, -150); ctx.lineTo(-262 + i * 85, -80); ctx.lineTo(-333 + i * 85, -80); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(-297 + i * 85, -80, 36, 0, Math.PI); ctx.fill(); }
  ctx.fillStyle = '#DCEBF5'; ctx.fillRect(-260, -20, 200, 200); ctx.fillRect(60, -20, 200, 200);
  // porta dupla
  ctx.fillStyle = '#2A2D35'; ctx.fillRect(-60, 0, 120, 260);
  ctx.fillStyle = '#FFE873'; ctx.fillRect(-58 * door, 2, 116 * door, 256);
  ctx.fillStyle = C.K; ctx.fillRect(-60, 0, 60 * (1 - door), 260); ctx.fillRect(60 - 60 * (1 - door), 0, 60 * (1 - door), 260);
  ctx.restore();
}

// 1. ATENÇÃO — vai abrir seu negócio? presta atenção (capa no quadro 0)
function v4s1(t) {
  darkBg(t);
  text('VAI ABRIR', 100, 470, 130, C.WH);
  text('SEU', 100, 610, 130, C.WH);
  const p = 1 + 0.06 * Math.sin(prog(t, 0.9, 0.35) * Math.PI);
  ctx.save(); ctx.translate(100, 780); ctx.scale(p, p);
  text('NEGÓCIO?', 0, 0, 170, C.Y, { skew: -9 });
  ctx.restore();
  storefront(540, 1180, 0.62, t, 0, 'SUA LOJA');
  const a = easeOutBack(prog(t, 1.69, 0.3));
  if (a > 0) {
    hazard(1060, t, -0.08, clamp(a)); hazard(1420, -t, 0.06, clamp(a));
    ctx.save(); ctx.translate(W / 2, 1250); ctx.scale(lerp(2.2, 1, clamp(a)), lerp(2.2, 1, clamp(a))); ctx.rotate(-0.02);
    ctx.fillStyle = C.K; roundRect(-400, -78, 800, 140, 20); ctx.fill();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 6; roundRect(-400, -78, 800, 140, 20); ctx.stroke();
    text('PRESTA ATENÇÃO.', 0, 22, 84, C.Y, { align: 'center' });
    ctx.restore();
  }
}

// 2. O seu primeiro cliente vai te conhecer pelo Instagram
function v4s2(t) {
  lightBg();
  rise('O seu primeiro', 100, 400, 92, C.K, t, T.s2 + 0.1);
  pop('CLIENTE', 100, 540, 140, C.K, t, 3.7, { skew: -9 });
  rise('vai te conhecer', 100, 650, 80, C.K, t, 4.4);
  // pessoa -> celular com o seu perfil
  const a = easeOutBack(prog(t, 3.8, 0.3));
  if (a > 0) { ctx.save(); ctx.translate(250, 1100); ctx.scale(a, a); ctx.fillStyle = C.K;
    ctx.beginPath(); ctx.arc(0, -90, 60, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 60, 110, 90, 0, Math.PI, 0); ctx.fill(); ctx.restore(); }
  const ar = prog(t, 4.6, 0.5);
  if (ar > 0) { ctx.save(); ctx.strokeStyle = C.K; ctx.lineWidth = 7; ctx.setLineDash([4, 18]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(380, 1050); ctx.lineTo(380 + 230 * easeOut(ar), 1050); ctx.stroke(); ctx.restore(); }
  const ph = easeOutBack(prog(t, 5.1, 0.35));
  if (ph > 0) phone(770, 1100, 0.5 * ph, 0.05, (w, h) => {
    ctx.fillStyle = C.K; ctx.fillRect(0, 0, w, h);
    // ícone de câmera (Instagram genérico)
    ctx.strokeStyle = C.Y; ctx.lineWidth = 22; roundRect(w / 2 - 120, h / 2 - 120, 240, 240, 64); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 56, 0, 7); ctx.stroke();
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(w / 2 + 72, h / 2 - 72, 14, 0, 7); ctx.fill();
  });
  pill('PELO INSTAGRAM', W / 2, 1420, 50, C.K, C.Y, t, 5.35, -0.03);
}

// 3. DOR — perfil vazio, sem logo, sem post: não passa confiança
function v4s3(t) {
  lightBg();
  const ph = easeOut(prog(t, T.s3, 0.4));
  phone(680, 1000 + (1 - ph) * 600, 0.7, 0.05, (w) => {
    profileScreen(w, t, { avatar: '#D9D9D9', posts: 0, followers: 2, name: 'Seu negócio', bio: '', tile: (k, x, y, tw) => { ctx.fillStyle = '#F2F2F4'; ctx.fillRect(x, y, tw, tw); } });
    text('?', 70, 138, 56, '#9A9CA3', { align: 'center' });
  });
  rise('E perfil', 100, 380, 100, C.K, t, T.s3 + 0.08);
  pop('VAZIO,', 100, 520, 140, C.K, t, 6.65, { skew: -9 });
  const tag = (str, y, at) => {
    const r = rise('sem ' + str, 100, y, 70, C.K, t, at);
    if (r > 0) strike(100 + measure('sem ', 70), y, measure(str, 70), 70, t, at + 0.3);
  };
  tag('LOGO', 700, 7.55);
  tag('POST', 800, 8.45);
  const n = easeOutBack(prog(t, 9.62, 0.32));
  if (n > 0) {
    ctx.save(); ctx.translate(W / 2, 1380); ctx.rotate(-0.04); ctx.scale(n, n);
    ctx.fillStyle = '#E0322C'; roundRect(-410, -70, 820, 140, 30); ctx.fill();
    text('NÃO PASSA CONFIANÇA', 0, 22, 62, C.WH, { align: 'center' });
    ctx.restore();
  }
}

// 4. SONHO — abrir as portas com cara de marca grande, tudo pronto pra inauguração
function v4s4(t) {
  yellowBg();
  rise('Imagina abrir as portas', 100, 360, 66, C.K, t, T.s4 + 0.1);
  rise('com cara de', 100, 460, 66, C.K, t, 11.9, { weight: 700 });
  const mg = easeOut(prog(t, 12.6, 0.25));
  if (mg > 0) stripWord('MARCA GRANDE', 100, 590, 104, { reveal: mg, stripColor: C.K, textColor: C.Y });
  const door = easeInOut2(prog(t, 11.2, 1.4));
  storefront(540, 1010, 0.95, t, door, 'SUA MARCA');
  // confete na abertura
  for (let i = 0; i < 26; i++) {
    const d = t - 12.4 - rand(i) * 0.4;
    if (d < 0 || d > 2.2) continue;
    const x = 540 + (rand(i + 5) - 0.5) * 900, y = 700 + d * 420 + Math.sin(d * 5 + i) * 30;
    ctx.save(); ctx.globalAlpha = 1 - d / 2.2; ctx.translate(x, y); ctx.rotate(d * 6 + i);
    ctx.fillStyle = i % 3 ? C.K : C.WH; ctx.fillRect(-10, -5, 20, 10); ctx.restore();
  }
  pill('LOGO', 200, 1340, 38, C.K, C.Y, t, 13.9, -0.06);
  pill('POSTS', 400, 1370, 38, C.WH, C.K, t, 14.75, 0.04);
  pill('STORIES', 615, 1340, 38, C.K, C.Y, t, 15.75, -0.04);
  pill('VÍDEOS', 825, 1375, 38, C.WH, C.K, t, 16.3, 0.06);
  rise('prontos pro dia da inauguração', W / 2, 1475, 46, C.K, t, 16.8, { align: 'center', weight: 700 });
}
const easeInOut2 = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// 5. SOLUÇÃO — a Criativos Rápidos monta tudo, em até 24h depois do briefing
function v4s5(t) {
  lightBg();
  const lg = easeOutBack(prog(t, 18.55, 0.35));
  ctx.save(); ctx.translate(W / 2, 380); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2));
  drawLogo(0, 0, 560, 1, C.K); ctx.restore();
  rise('monta tudo', W / 2, 580, 84, C.K, t, 20.1, { align: 'center' });
  pop('PRA VOCÊ', W / 2, 700, 110, C.K, t, 20.5, { align: 'center', skew: -9 });
  clock24(W / 2, 1090, 260, t, 19.5, 3.0, 22.6);
  rise('depois do briefing respondido', W / 2, 1430, 40, '#5B5E66', t, 22.7, { align: 'center', weight: 600 });
}

// 6. OBJEÇÃO — sem contrato, a partir de R$97
function v4s6(t) {
  darkBg(t);
  stamp('SEM CONTRATO', 470, t, 23.45, -0.05);
  stamp('SEM FIDELIDADE', 640, t, 24.3, 0.04);
  price(W / 2, 1100, t, 25.5, 'a partir de');
  pill('PACOTE LARGADA', W / 2, 1300, 40, C.Y, C.K, t, 26.0);
}

// 7. CTA — começa do jeito certo
function v4s7(t) {
  endCard(t, T.s7, ['Começa do', 'jeito certo.'], 'CHAMA NO DIRECT', null, 28.1, 29.0,
    'Sua marca pronta pra inauguração', 'sem contrato  ·  entrega em até 24h');
}

const SCENES = [
  { at: T.s1, fn: v4s1 }, { at: T.s2, fn: v4s2, wipe: true }, { at: T.s3, fn: v4s3, zoom: true },
  { at: T.s4, fn: v4s4, zoom: true }, { at: T.s5, fn: v4s5, wipe: true }, { at: T.s6, fn: v4s6 },
  { at: T.s7, fn: v4s7, zoom: true },
];
