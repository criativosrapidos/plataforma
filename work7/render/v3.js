// Criativo 3 — Instagram parado, sem ninguém pra cuidar (voz: Bianca)
const T = { s1: 0, s2: 2.16, s3: 7.2, s4: 10.72, s5: 17.5, s6: 23.62, s7: 26.5 };
PUNCHES = [[0, 0.05], [0.64, 0.06], [1.6, 0.1], [2.6, 0.06], [3.04, 0.08], [5.4, 0.05], [6.32, 0.13],
  [7.28, 0.05], [9.64, 0.08], [10.08, 0.06], [12.96, 0.08], [13.6, 0.06], [14.16, 0.06], [14.8, 0.06],
  [15.52, 0.07], [16.88, 0.06], [17.68, 0.07], [20.16, 0.05], [22.96, 0.1], [23.92, 0.1], [25.04, 0.13],
  [26.56, 0.08], [27.92, 0.07], [29.3, 0.07]];

// 1. ATENÇÃO — quando foi a última vez que você postou? (capa no quadro 0)
function v3s1(t) {
  darkBg(t);
  text('QUANDO FOI', 100, 520, 110, C.WH);
  text('A ÚLTIMA VEZ', 100, 640, 110, C.WH);
  text('QUE VOCÊ', 100, 760, 110, C.WH);
  const p = 1 + 0.06 * Math.sin(prog(t, 1.6, 0.35) * Math.PI);
  ctx.save(); ctx.translate(100, 940); ctx.scale(p, p);
  text('POSTOU?', 0, 0, 180, C.Y, { skew: -9 });
  ctx.restore();
  // contador de dias sem postar subindo
  const d = 47;
  const dp = 1 + 0.08 * Math.sin(prog(t, 1.0, 0.35) * Math.PI);
  ctx.save(); ctx.translate(540, 1240); ctx.rotate(-0.03); ctx.scale(dp, dp);
  ctx.fillStyle = C.WH; roundRect(-330, -110, 660, 200, 30); ctx.fill();
  ctx.save(); roundRect(-330, -110, 660, 200, 30); ctx.clip();
  ctx.fillStyle = '#E0322C'; ctx.fillRect(-330, -110, 660, 60); ctx.restore();
  text('ÚLTIMO POST', 0, -70, 30, C.WH, { align: 'center' });
  text('há ' + d + ' dias', 0, 50, 90, C.K, { align: 'center' });
  ctx.restore();
}

// 2. DOR — perfil parado; o cliente acha que você fechou
function v3s2(t) {
  lightBg();
  rise('SEU INSTAGRAM', 100, 380, 92, C.K, t, T.s2 + 0.05);
  pop('TÁ PARADO...', 100, 500, 110, C.K, t, 3.04, { skew: -9 });
  const ph = easeOut(prog(t, T.s2, 0.45));
  phone(600, 1060 + (1 - ph) * 600, 0.72, 0.05, (w) => profileScreen(w, t, {
    avatar: '#D9D9D9', posts: 3, followers: 41, name: 'Seu negócio', bio: 'último post há 47 dias', tile: deadTile,
  }));
  // teia no canto do celular
  const web = clamp(prog(t, 3.6, 0.6));
  if (web > 0) {
    ctx.save(); ctx.globalAlpha = 0.7 * web; ctx.strokeStyle = '#8A8C93'; ctx.lineWidth = 3;
    const ox = 790, oy = 760;
    for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i * Math.PI / 10; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(a) * -160, oy + Math.sin(a) * 160); ctx.stroke(); }
    for (let r = 40; r <= 160; r += 40) { ctx.beginPath(); ctx.arc(ox, oy, r, Math.PI / 2, Math.PI); ctx.stroke(); }
    ctx.restore();
  }
  // placa FECHADO balançando
  const f = easeOutBack(prog(t, 6.2, 0.35));
  if (f > 0) {
    ctx.save(); ctx.translate(600, 900); ctx.rotate(Math.sin((t - 6.2) * 5) * 0.12 * Math.exp(-(t - 6.2) * 1.5)); ctx.scale(f, f);
    ctx.strokeStyle = C.K; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-120, -120); ctx.lineTo(0, -190); ctx.lineTo(120, -120); ctx.stroke();
    ctx.fillStyle = '#E0322C'; roundRect(-230, -130, 460, 170, 22); ctx.fill();
    text('FECHOU?', 0, -14, 96, C.WH, { align: 'center' });
    ctx.restore();
  }
  rise('e o cliente acha que você...', 100, 620, 50, C.K, t, 4.0, { weight: 700 });
}

// 3. EXPLICAÇÃO — não é falta de vontade: não tem ninguém pra cuidar
function v3s3(t) {
  darkBg(t);
  rise('Não é que você', 100, 600, 92, C.WH, t, T.s3 + 0.08);
  rise('não queira.', 100, 710, 92, C.WH, t, 7.76);
  rise('É que não tem', 100, 920, 92, C.WH, t, 8.96);
  const p = easeOut(prog(t, 9.62, 0.25));
  if (p > 0) stripWord('NINGUÉM', 100, 1080, 140, { reveal: p });
  pop('pra cuidar.', 100, 1220, 100, C.Y, t, 10.0, { skew: -9 });
}

// 4. SONHO — o perfil vivo: post, story, reels, todo dia, com a sua cara
function v3s4(t) {
  yellowBg();
  rise('Imagina ver tudo', 100, 360, 76, C.K, t, T.s4 + 0.1);
  pop('VIVO', 100, 520, 160, C.K, t, 12.96, { skew: -9 });
  const ph = easeOut(prog(t, T.s4, 0.4));
  phone(620, 1050 + (1 - ph) * 500, 0.68, -0.04, (w) => profileScreen(w, t, {
    avatar: C.Y, avatarMark: true, posts: 3 + Math.floor(clamp((t - 11.6) / 2.4) * 9) * 3,
    followers: Math.round(lerp(41, 2840, easeOut(prog(t, 11.6, 4)))).toLocaleString('pt-BR'),
    name: 'Seu negócio', bio: 'postado hoje', tile: (k, x, y, tw, t) => brandTile(k, x, y, tw, t, 11.6),
  }));
  pill('POST', 220, 760, 44, C.K, C.Y, t, 13.6, -0.08);
  pill('STORY', 210, 900, 44, C.WH, C.K, t, 14.16, 0.06);
  pill('REELS', 230, 1040, 44, C.K, C.Y, t, 14.8, -0.05);
  for (let i = 0; i < 8; i++) {
    const st = 12.2 + i * 0.45, d = t - st;
    if (d < 0 || d > 1.6) continue;
    ctx.save(); ctx.globalAlpha = 1 - d / 1.6;
    heart(860 + Math.sin(i * 2.3) * 50, 1150 - d * 360, 1.5 + rand(i) * 1.1, i % 2 ? C.K : '#E0322C');
    ctx.restore();
  }
  const r = easeOut(prog(t, 15.52, 0.25));
  if (r > 0) {
    text('todo dia, com a', 100, 1460, 52, C.K, { weight: 700, alpha: r });
    stripWord('SUA CARA', 100 + measure('todo dia, com a ', 52, 700), 1460, 52, { reveal: easeOut(prog(t, 16.6, 0.25)), stripColor: C.K, textColor: C.Y });
  }
}

// 5. SOLUÇÃO — a gente cuida: você manda as informações e recebe em até 24h
function v3s5(t) {
  lightBg();
  const lg = easeOutBack(prog(t, 17.6, 0.35));
  ctx.save(); ctx.translate(W / 2, 380); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2));
  drawLogo(0, 0, 560, 1, C.K); ctx.restore();
  rise('cuida disso', W / 2, 580, 84, C.K, t, 18.68, { align: 'center' });
  pop('PRA VOCÊ', W / 2, 700, 110, C.K, t, 19.3, { align: 'center', skew: -9 });
  pill('VOCÊ MANDA AS INFORMAÇÕES', W / 2, 840, 36, C.K, C.WH, t, 20.16);
  clock24(W / 2, 1180, 250, t, 21.0, 1.7, 22.96);
}

// 6. OBJEÇÃO — sem contrato, a partir de R$97
function v3s6(t) {
  darkBg(t);
  stamp('SEM CONTRATO', 470, t, 23.9, -0.05);
  stamp('SEM FIDELIDADE', 640, t, 24.45, 0.04);
  price(W / 2, 1100, t, 25.04, 'a partir de');
  pill('PACOTE LARGADA', W / 2, 1300, 40, C.Y, C.K, t, 25.7);
}

// 7. CTA — dá vida pro seu Instagram hoje
function v3s7(t) {
  endCard(t, T.s7, ['Dá vida pro seu', 'Instagram hoje.'], 'CHAMA NO DIRECT', null, 28.4, 29.3,
    'Post, story e reels com a sua cara', 'sem contrato  ·  entrega em até 24h');
}

const SCENES = [
  { at: T.s1, fn: v3s1 }, { at: T.s2, fn: v3s2, wipe: true }, { at: T.s3, fn: v3s3 },
  { at: T.s4, fn: v3s4, zoom: true }, { at: T.s5, fn: v3s5, wipe: true }, { at: T.s6, fn: v3s6 },
  { at: T.s7, fn: v3s7, zoom: true },
];
