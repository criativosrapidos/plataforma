// Stories dos destaques — parte 2: VALORES e CRIATIVOS RÁPIDOS (preços da proposta comercial)

// linha da tabela de créditos
function creditRow(name, cr, y, t, at, dark) {
  const p = easeOut(prog(t, at, 0.3));
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha = p; ctx.translate((1 - p) * -80, 0);
  ctx.fillStyle = dark ? '#1B1E24' : C.WH; roundRect(100, y - 62, 830, 112, 24); ctx.fill();
  text(name, 140, y + 14, 50, dark ? C.WH : C.K, { weight: 700 });
  ctx.fillStyle = C.Y; roundRect(650, y - 44, 250, 76, 18); ctx.fill();
  text(String(cr), 690, y + 16, 54, C.K);
  text(cr === 1 ? 'crédito' : 'créditos', 735, y + 12, 32, C.K, { weight: 700 });
  ctx.restore();
}

// cartão de preço (pacote ou plano)
function priceCard(name, value, sub, y, t, at, hot, suffix = '') {
  const p = easeOutBack(prog(t, at, 0.35));
  if (p <= 0) return;
  ctx.save(); ctx.translate(W / 2 - 25, y); ctx.scale(clamp(p, 0, 1.1), clamp(p, 0, 1.1));
  ctx.fillStyle = hot ? C.Y : C.WH; roundRect(-415, -125, 830, 250, 36); ctx.fill();
  if (hot) { ctx.fillStyle = C.K; roundRect(-180, -150, 360, 52, 26); ctx.fill(); text('MAIS ESCOLHIDO', 0, -114, 26, C.Y, { align: 'center' }); }
  text(name, -370, -30, 54, C.K);
  text(sub, -370, 40, 34, '#3A3D44', { weight: 600 });
  const vw = measure(value, 120);
  text(value, 380, 30, 120, C.K, { align: 'right' });
  text('R$', 380 - vw - 12, -20, 40, C.K, { align: 'right' });
  if (suffix) text(suffix, 380, 80, 28, '#3A3D44', { align: 'right', weight: 700 });
  ctx.restore();
}

// ---------- VALORES ----------
STORIES.vl1 = { dur: 7, punches: [[0, 0.05], [0.6, 0.08]], fn(t) {
  lightBg(); storyHeader('VALORES', 1, 4, false, t);
  rise('Monte do', 100, 440, 100, C.K, t, 0.1);
  pop('SEU JEITO', 100, 570, 124, C.K, t, 0.6, { skew: -9 });
  rise('você escolhe as peças, como num buffet', 100, 640, 34, '#5B5E66', t, 0.9, { weight: 600 });
  [['Stories', 1], ['Post', 2], ['Carrossel', 3], ['Reels', 4], ['Anúncio', 5]].forEach(([n, c], i) => creditRow(n, c, 790 + i * 140, t, 1.3 + i * 0.25));
} };

STORIES.vl2 = { dur: 7, punches: [[0, 0.05], [0.9, 0.06], [1.4, 0.08], [1.9, 0.06]], fn(t) {
  darkBg(t); storyHeader('VALORES', 2, 4, true, t);
  pop('PACOTES', 100, 440, 120, C.WH, t, 0.1);
  rise('pagamento único, sem mensalidade', 100, 510, 36, '#B9BBC1', t, 0.4, { weight: 600 });
  priceCard('LARGADA', '97', '10 créditos · 1 ajuste', 720, t, 0.9);
  priceCard('ACELERA', '297', '20 créditos · identidade visual', 1010, t, 1.4, true);
  priceCard('TURBO', '497', '40 créditos · identidade + bônus', 1300, t, 1.9);
} };

STORIES.vl3 = { dur: 7, punches: [[0, 0.05], [0.9, 0.06], [1.4, 0.08], [1.9, 0.06]], fn(t) {
  yellowBg(); storyHeader('VALORES', 3, 4, false, t);
  pop('PLANOS MENSAIS', 100, 440, 96, C.K, t, 0.1);
  rise('post todo dia · sem fidelidade', 100, 510, 36, '#3A3D44', t, 0.4, { weight: 700 });
  priceCard('PRESENÇA', '597', '30 conteúdos no mês', 720, t, 0.9, false, 'por mês');
  ctx.save();
  priceCard('CRESCIMENTO', '797', '50 conteúdos · a gente posta', 1010, t, 1.4, false, 'por mês');
  ctx.restore();
  priceCard('AUTORIDADE', '997', '70 conteúdos + relatório', 1300, t, 1.9, false, 'por mês');
} };

STORIES.vl4 = { dur: 5, punches: [[0, 0.05], [0.7, 0.1], [3.4, 0.06]], fn(t) {
  darkBg(t); storyHeader('VALORES', 4, 4, true, t);
  rise('Escolheu?', 100, 560, 120, C.WH, t, 0.1);
  rise('Manda o nome do pacote', 100, 700, 64, C.WH, t, 0.5, { weight: 700 });
  rise('ou plano no direct', 100, 780, 64, C.WH, t, 0.65, { weight: 700 });
  pop('E A GENTE JÁ TE MANDA', 100, 920, 66, C.Y, t, 1.0, { skew: -9 });
  pop('O BRIEFING.', 100, 1010, 66, C.Y, t, 1.2, { skew: -9 });
  ctx.save(); ctx.translate(0, 0);
  // botão amarelo no escuro
  const b = easeOutBack(prog(t, 1.8, 0.35));
  if (b > 0) {
    const press = t >= 3.4 && t < 3.55 ? 0.92 : 1;
    ctx.translate(W / 2, 1250); ctx.scale(b * press, b * press);
    ctx.fillStyle = C.Y; roundRect(-410, -95, 820, 180, 90); ctx.fill();
    logoMark(-350, -38, 0.6, C.K);
    text('CHAMA NO DIRECT', 40, 20, 60, C.K, { align: 'center' });
  }
  ctx.restore();
} };

// ---------- CRIATIVOS RÁPIDOS ----------
STORIES.cr1 = { dur: 5, punches: [[0, 0.05], [0.4, 0.08], [1.8, 0.1]], fn(t) {
  darkBg(t); storyHeader('CRIATIVOS RÁPIDOS', 1, 5, true, t);
  glow(W / 2, 560, 500, 'rgba(255,212,0,0.5)', 0.35);
  const lg = easeOutBack(prog(t, 0.2, 0.45));
  ctx.save(); ctx.translate(W / 2, 560); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2));
  ctx.fillStyle = C.Y; roundRect(-330, -110, 220, 220, 48); ctx.fill();
  logoMark(-292, -60, 1.0, C.K);
  ctx.fillStyle = C.WH; ctx.font = '400 84px Inter'; ctx.letterSpacing = '-1px'; ctx.textAlign = 'left'; ctx.fillText('criativos', -80, -8);
  ctx.font = 'italic 800 90px Inter'; ctx.letterSpacing = '-2px'; ctx.fillText('rápidos', -86, 80);
  ctx.restore();
  rise('Tudo que uma', 100, 900, 100, C.WH, t, 1.0);
  rise('agência entrega.', 100, 1020, 100, C.WH, t, 1.2);
  pop('POST TODO DIA.', 100, 1180, 116, C.Y, t, 1.8, { skew: -9 });
  rise('rápido e sem prender você em contrato', 100, 1300, 36, '#B9BBC1', t, 2.4, { weight: 600 });
} };

const ROLES2 = [['Copywriter', 'textos que fazem parar e chamar'], ['Designer', 'artes com cara de marca'], ['Social media', 'calendário e postagem'], ['Editor de vídeo', 'reels e anúncios com ritmo'], ['Locutor', 'voz que vende']];
STORIES.cr2 = { dur: 7, punches: [[0, 0.05], [0.6, 0.08]], fn(t) {
  lightBg(); storyHeader('CRIATIVOS RÁPIDOS', 2, 5, false, t);
  rise('Uma equipe', 100, 440, 104, C.K, t, 0.1);
  pop('INTEIRA PRA VOCÊ', 100, 570, 92, C.K, t, 0.6, { skew: -9 });
  ROLES2.forEach(([r, d], i) => {
    const p = easeOutBack(prog(t, 1.2 + i * 0.3, 0.32));
    if (p <= 0) return;
    const y = 760 + i * 150;
    ctx.save(); ctx.translate(100, y); ctx.scale(clamp(p, 0, 1.1), clamp(p, 0, 1.1));
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(46, -14, 46, 0, 7); ctx.fill();
    ctx.strokeStyle = C.K; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(28, -14); ctx.lineTo(42, 0); ctx.lineTo(66, -28); ctx.stroke();
    text(r, 120, -12, 52, C.K);
    text(d, 120, 34, 32, '#5B5E66', { weight: 600 });
    ctx.restore();
  });
  rise('você não precisa contratar cinco pessoas', W / 2, 1470, 32, C.K, t, 3.0, { align: 'center', weight: 700 });
} };

STORIES.cr3 = { dur: 6, punches: [[0, 0.05], [0.6, 0.08]], fn(t) {
  yellowBg(); storyHeader('CRIATIVOS RÁPIDOS', 3, 5, false, t);
  rise('O que', 100, 440, 110, C.K, t, 0.1);
  pop('A GENTE CRIA', 100, 570, 116, C.K, t, 0.6, { skew: -9 });
  const items = ['Stories', 'Posts', 'Carrosséis', 'Reels', 'Anúncios'];
  items.forEach((s, i) => {
    const p = easeOutBack(prog(t, 1.1 + i * 0.25, 0.3));
    if (p <= 0) return;
    const y = 760 + i * 145, x = 100 + (i % 2) * 120;
    ctx.save(); ctx.translate(x, y); ctx.rotate((i % 2 ? 1 : -1) * 0.025); ctx.scale(clamp(p, 0, 1.1), clamp(p, 0, 1.1));
    const w = measure(s, 72) + 150;
    ctx.fillStyle = C.K; roundRect(0, -62, w, 116, 58); ctx.fill();
    logoMark(30, -26, 0.4, C.Y);
    text(s, 110, 22, 72, C.WH);
    ctx.restore();
  });
} };

STORIES.cr4 = { dur: 6, punches: [[0, 0.05], [0.5, 0.08], [1.6, 0.08], [2.7, 0.08]], fn(t) {
  darkBg(t); storyHeader('CRIATIVOS RÁPIDOS', 4, 5, true, t);
  rise('Por que', 100, 440, 100, C.WH, t, 0.1);
  pop('COM A GENTE?', 100, 560, 100, C.Y, t, 0.3, { skew: -9 });
  const it = [['Sem fidelidade', 'você fica porque gosta, não por contrato'], ['Entrega rápida', 'em até 24h depois do briefing'], ['Você aprova tudo', 'nada vai pro ar sem o seu ok']];
  it.forEach(([a, b], i) => {
    const y = 790 + i * 230, at = 0.5 + i * 1.1;
    const p = easeOutBack(prog(t, at, 0.32));
    if (p <= 0) return;
    ctx.save(); ctx.translate(100, y); ctx.scale(clamp(p, 0, 1.1), clamp(p, 0, 1.1));
    ctx.fillStyle = '#1B1E24'; roundRect(0, -90, 830, 180, 32); ctx.fill();
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(80, 0, 44, 0, 7); ctx.fill();
    ctx.strokeStyle = C.K; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(75, 15); ctx.lineTo(102, -16); ctx.stroke();
    text(a, 150, -8, 54, C.WH);
    text(b, 150, 42, 31, '#B9BBC1', { weight: 600 });
    ctx.restore();
  });
} };

STORIES.cr5 = { dur: 5, punches: [[0, 0.05], [0.4, 0.1], [3.2, 0.06]], fn(t) {
  endCard(t, -0.1, ['Bora começar?'], 'CHAMA NO DIRECT', null, 1.6, 3.2,
    'Pacotes a partir de R$97', 'sem fidelidade  ·  entrega em até 24h');
  storyHeader('CRIATIVOS RÁPIDOS', 5, 5, false, t);
} };

// ---------- CAPAS DOS DESTAQUES (o Instagram recorta o círculo do centro) ----------
function coverBase() { bg(C.Y); }
function gear(cx, cy, r, color) {
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = color;
  for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * Math.PI / 4); roundRect(-r * 0.2, -r * 1.12, r * 0.4, r * 0.5, r * 0.08); ctx.fill(); ctx.restore(); }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, 7); ctx.fill();
  ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(0, 0, r * 0.36, 0, 7); ctx.fill();
  ctx.restore();
}
STORIES.cover_clientes = { dur: 1, fn() { coverBase();
  ctx.fillStyle = C.K;
  ctx.beginPath(); ctx.arc(430, 880, 90, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(430, 1120, 160, 130, 0, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(650, 860, 100, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(650, 1120, 175, 150, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = C.K; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 26 : 62; ctx.lineTo(760 + Math.cos(a) * r, 700 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
} };
STORIES.cover_funcionamento = { dur: 1, fn() { coverBase(); gear(540, 960, 230, C.K); } };
STORIES.cover_valores = { dur: 1, fn() { coverBase(); text('R$', 540, 1060, 300, C.K, { align: 'center' }); } };
STORIES.cover_criativos = { dur: 1, fn() { coverBase(); logoMark(540 - 75 * 2.6, 960 - 60 * 2.6, 2.6, C.K); } };
