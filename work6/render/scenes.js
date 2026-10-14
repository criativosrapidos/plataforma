// Vídeo de prospecção (quem não tem agência). Tempos alinhados à locução montada em ../audio/build_voice.sh
const T = { s1: 0, s2: 4.05, s3: 9.75, s4: 14.6, s5: 16.35, s6: 21.3, s7: 24.75, end: 30 };

// fundo com grade fina (como na proposta)
function grid(color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}

// fita de alerta (listras pretas e amarelas) atravessando a tela
function hazard(y, t, rot, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(W / 2, y); ctx.rotate(rot);
  ctx.fillStyle = C.Y; ctx.fillRect(-900, -45, 1800, 90);
  ctx.beginPath(); ctx.rect(-900, -45, 1800, 90); ctx.clip();
  ctx.fillStyle = C.K; const off = (t * 220) % 120;
  for (let x = -1000; x < 1000; x += 120) {
    ctx.beginPath(); ctx.moveTo(x + off, -45); ctx.lineTo(x + off + 60, -45); ctx.lineTo(x + off + 10, 45); ctx.lineTo(x + off - 50, 45); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// coração simples
function heart(x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-26, -6, -14, -26, 0, -12); ctx.bezierCurveTo(14, -26, 26, -6, 0, 12);
  ctx.fill(); ctx.restore();
}

// celular com perfil do Instagram; fill(k) decide cada post do grid
function profilePhone(cx, cy, s, t, opts) {
  const w = 440, h = 820;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.rotate(opts.rot || 0); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; roundRect(14, 24, w + 24, h + 24, 60); ctx.fill();
  ctx.fillStyle = '#23262D'; roundRect(-12, -12, w + 24, h + 24, 60); ctx.fill();
  ctx.save(); roundRect(0, 0, w, h, 48); ctx.clip();
  ctx.fillStyle = C.WH; ctx.fillRect(0, 0, w, h);
  // cabeçalho do perfil
  ctx.fillStyle = opts.avatar; ctx.beginPath(); ctx.arc(70, 120, 46, 0, 7); ctx.fill();
  if (opts.avatarMark) logoMark(42, 98, 0.4, C.K);
  [['posts', opts.posts], ['seguidores', opts.followers], ['seguindo', '180']].forEach(([l, v], i) => {
    text(String(v), 190 + i * 90, 118, 30, C.K, { align: 'center' });
    text(l, 190 + i * 90, 146, 17, '#777', { align: 'center', weight: 500 });
  });
  text(opts.name, 30, 205, 26, C.K);
  text(opts.bio, 30, 236, 19, '#777', { weight: 500 });
  // grid 3x3
  const g = 4, tw = (w - g * 2) / 3;
  for (let k = 0; k < 9; k++) {
    const x = (k % 3) * (tw + g), y = 270 + Math.floor(k / 3) * (tw + g);
    opts.tile(k, x, y, tw, t);
  }
  ctx.restore();
  ctx.fillStyle = '#23262D'; roundRect(w / 2 - 56, -2, 112, 24, 12); ctx.fill();
  ctx.restore();
}

// 1. ATENÇÃO — quadro 0 já é a capa
function scene1(t) {
  bg(C.K); grid('#FFFFFF', 0.05);
  particles(t, C.Y, 50, 0.4);
  const alarm = prog(t, 3.0, 0.25);
  if (alarm > 0) { // pisca de alerta
    const fl = Math.max(0, Math.sin((t - 3.0) * 18)) * (1 - prog(t, 3.0, 0.9));
    ctx.save(); ctx.globalAlpha = 0.18 * fl; ctx.fillStyle = C.Y; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  const up = easeOut(alarm) * 120;
  text('VOCÊ TEM NEGÓCIO', 100, 680 - up, 92, C.WH);
  text('E NÃO TEM', 100, 790 - up, 92, C.WH);
  const p = 1 + 0.06 * Math.sin(prog(t, 1.55, 0.35) * Math.PI);
  ctx.save(); ctx.translate(100, 980 - up); ctx.scale(p, p);
  text('AGÊNCIA?', 0, 0, 178, C.Y, { skew: -9 });
  ctx.restore();
  speedLines(560, 1050 - up, 300 + 40 * Math.sin(t * 4), 16, C.Y, 34);
  // "PRESTA ATENÇÃO" bate com fitas de alerta
  const a = easeOutBack(prog(t, 3.0, 0.3));
  if (a > 0) {
    hazard(1240, t, -0.08, clamp(a)); hazard(1460, -t, 0.06, clamp(a));
    ctx.save(); ctx.translate(W / 2, 1350); ctx.scale(lerp(2.2, 1, clamp(a)), lerp(2.2, 1, clamp(a))); ctx.rotate(-0.02);
    ctx.fillStyle = C.K; roundRect(-400, -78, 800, 140, 20); ctx.fill();
    ctx.strokeStyle = C.Y; ctx.lineWidth = 6; roundRect(-400, -78, 800, 140, 20); ctx.stroke();
    text('PRESTA ATENÇÃO.', 0, 22, 84, C.Y, { align: 'center' });
    ctx.restore();
  }
}

// 2. DOR — perfil parado + gravar/editar/postar riscados + não cabe na rotina
const PAIN = [{ w: 'GRAVAR', at: 4.2 }, { w: 'EDITAR', at: 5.05 }, { w: 'POSTAR', at: 5.83 }];
function scene2(t) {
  bg(C.OW); grid('#101216', 0.05);
  const out = easeIn(prog(t, 7.75, 0.35));
  // perfil abandonado
  const ph = easeOut(prog(t, T.s2, 0.45));
  ctx.save(); ctx.globalAlpha = 1 - out;
  profilePhone(700, 1080 + (1 - ph) * 600 + out * 500, 0.82, t, {
    rot: 0.06, avatar: '#D9D9D9', posts: 3, followers: 41, name: 'Seu negócio', bio: 'último post há 32 dias',
    tile: (k, x, y, tw) => { ctx.fillStyle = k < 3 ? '#C9CACE' : '#EFEFF1'; ctx.fillRect(x, y, tw, tw);
      if (k >= 3) { ctx.strokeStyle = '#D5D6DA'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]); ctx.strokeRect(x + 14, y + 14, tw - 28, tw - 28); ctx.setLineDash([]); } },
  });
  // notificação: o cliente indo pro concorrente
  const n = easeOutBack(prog(t, 6.75, 0.35));
  if (n > 0) {
    ctx.save(); ctx.translate(560, 900); ctx.scale(n, n); ctx.rotate(-0.03);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; roundRect(-330, -50, 680, 112, 28); ctx.fill();
    ctx.fillStyle = C.K; roundRect(-340, -60, 680, 112, 28); ctx.fill();
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(-282, -4, 22, 0, 7); ctx.fill();
    text('Seu cliente seguiu', -240, -14, 30, '#B9BBC1', { weight: 600 });
    text('@concorrente', -240, 26, 36, C.WH);
    ctx.restore();
  }
  ctx.restore();
  // gravar / editar / postar
  PAIN.forEach((p, i) => {
    const a = easeOutBack(prog(t, p.at - 0.05, 0.28));
    if (a <= 0) return;
    const y = 400 + i * 140 - out * 120, x = lerp(-450, 100, a);
    ctx.save(); ctx.globalAlpha = lerp(1, 0.25, out);
    text(p.w, x, y, 118, C.K);
    const s = easeOut(prog(t, p.at + 0.45, 0.16));
    if (s > 0) { const wd = measure(p.w, 118); ctx.fillStyle = '#E0322C';
      ctx.save(); ctx.translate(x - 14, y - 44); ctx.rotate(-0.06); roundRect(0, -8, (wd + 28) * s, 16, 8); ctx.fill(); ctx.restore(); }
    ctx.restore();
  });
  // toda semana: 7 dias riscados
  const ds = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  ds.forEach((d, i) => {
    const a = easeOutBack(prog(t, 6.75 + i * 0.07, 0.25));
    if (a <= 0 || out >= 1) return;
    ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(140 + i * 72, 770); ctx.scale(a, a);
    ctx.strokeStyle = C.K; ctx.lineWidth = 3; roundRect(-30, -30, 60, 60, 12); ctx.stroke();
    text(d, 0, 12, 30, C.K, { align: 'center' });
    ctx.restore();
  });
  // não cabe na sua rotina
  const r = easeOut(prog(t, 7.85, 0.3));
  if (r > 0) {
    text('Não cabe na', 100, 980 + (1 - r) * 60, 112, C.K, { alpha: r });
    text('sua', 100, 1120 + (1 - r) * 60, 112, C.K, { alpha: r });
    stripWord('ROTINA.', 100 + measure('sua ', 112), 1120 + (1 - r) * 60, 112, { reveal: easeOut(prog(t, 8.7, 0.25)) });
  }
}

// 3. SONHO — o mesmo perfil vivo, postando todo dia, com cara de marca grande
const POSTC = [C.K, C.WH, C.K, '#FFE873', C.K, C.WH, C.K, C.WH, C.K];
function scene3(t) {
  bg(C.Y); grid('#101216', 0.06);
  speedLines(-60 + ((t * 900) % 1400), 1520, 260, 14, C.K, 30);
  const ti = easeOutBack(prog(t, T.s3 + 0.05, 0.3));
  ctx.save(); ctx.translate(100, 400); ctx.scale(clamp(ti), clamp(ti));
  text('POSTANDO', 0, 0, 120, C.K);
  ctx.restore();
  const td = easeOutBack(prog(t, 11.2, 0.3));
  ctx.save(); ctx.translate(100, 530); ctx.scale(clamp(td), clamp(td));
  text('TODO DIA', 0, 0, 120, C.K, { skew: -9 });
  ctx.restore();
  // celular: grid se enchendo de posts
  const ph = easeOut(prog(t, T.s3, 0.4));
  const fol = Math.round(lerp(41, 2840, easeOut(prog(t, 10.2, 4))));
  profilePhone(560, 1020 + (1 - ph) * 500, 0.72, t, {
    rot: -0.04, avatar: C.Y, avatarMark: true, posts: 3 + Math.floor(clamp((t - 10) / 2.6) * 9) * 3, followers: fol.toLocaleString('pt-BR'),
    name: 'Seu negócio', bio: 'postado hoje',
    tile: (k, x, y, tw, t) => {
      const a = easeOutBack(prog(t, 10.0 + k * 0.27, 0.28));
      ctx.fillStyle = '#EFEFF1'; ctx.fillRect(x, y, tw, tw);
      if (a <= 0) return;
      ctx.save(); ctx.translate(x + tw / 2, y + tw / 2); ctx.scale(a, a);
      ctx.fillStyle = POSTC[k]; ctx.fillRect(-tw / 2, -tw / 2, tw, tw);
      const fg = POSTC[k] === C.K ? C.Y : C.K;
      if (k % 3 === 0) { ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-20, -28); ctx.lineTo(30, 0); ctx.lineTo(-20, 28); ctx.closePath(); ctx.fill(); }
      else if (k % 3 === 1) { ctx.fillStyle = fg; roundRect(-48, -26, 96, 18, 9); ctx.fill(); roundRect(-48, 4, 66, 18, 9); ctx.fill(); }
      else { ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill(); }
      ctx.restore();
    },
  });
  // corações e notificações subindo
  for (let i = 0; i < 9; i++) {
    const st = 10.4 + i * 0.4, d = t - st;
    if (d < 0 || d > 1.6) continue;
    ctx.save(); ctx.globalAlpha = 1 - d / 1.6;
    heart(820 + Math.sin(i * 2.3) * 70, 1180 - d * 360, 1.6 + rand(i) * 1.2, i % 2 ? C.K : '#E0322C');
    ctx.restore();
  }
  sticker('+ NOVO PEDIDO NO DIRECT', 360, 1335, 34, t, 12.4, { rot: -0.06, bgc: C.K, fg: C.WH });
  sticker('♥ 1.284', 840, 720, 34, t, 11.6, { rot: 0.12, bgc: C.WH });
  // marca grande
  const m = easeOut(prog(t, 12.55, 0.25));
  if (m > 0) {
    text('com cara de', 100, 1460, 52, C.K, { weight: 700, alpha: m });
    stripWord('MARCA GRANDE', 100 + measure('com cara de ', 52, 700), 1460, 52, { reveal: easeOut(prog(t, 13.1, 0.25)), stripColor: C.K, textColor: C.Y });
  }
}
