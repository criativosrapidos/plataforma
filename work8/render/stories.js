// Stories dos destaques — parte 1: CLIENTES e FUNCIONAMENTO
// Cada story: { dur, punches, clip?, fn(t) }. Texto sempre dentro da área segura dos stories.
const STORIES = {};

// etiqueta do destaque no topo + contador de páginas
function storyHeader(label, n, total, dark, t) {
  const a = easeOut(prog(t, 0, 0.3));
  const fg = dark ? C.WH : C.K;
  ctx.save(); ctx.globalAlpha = a;
  logoMark(100, 268, 0.34, dark ? C.Y : C.K);
  text(label, 160, 300, 32, fg, { weight: 800 });
  text(`${n}/${total}`, 930, 300, 30, fg, { align: 'right', weight: 600, alpha: 0.6 });
  ctx.restore();
}

// celular tocando um vídeo de cliente (quadros em clips/)
function clipPhone(name, cx, cy, s, rot, t, t0) {
  phone(cx, cy, s, rot, (w, h) => {
    const im = clipFrame(name, t - t0);
    if (im && im.complete && im.naturalWidth) { const dw = h * 0.5625; ctx.drawImage(im, (w - dw) / 2, 0, dw, h); }
    else { ctx.fillStyle = C.K; ctx.fillRect(0, 0, w, h); }
  });
}

// lista numerada com bolinha amarela (passos)
function step(n, title, sub, x, y, t, at, dark) {
  const p = easeOutBack(prog(t, at, 0.32));
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(clamp(p, 0, 1.1), clamp(p, 0, 1.1));
  ctx.fillStyle = C.Y; roundRect(0, -56, 104, 104, 26); ctx.fill();
  text(String(n), 52, 22, 64, C.K, { align: 'center' });
  text(title, 136, -8, 54, dark ? C.WH : C.K);
  text(sub, 136, 40, 32, dark ? '#B9BBC1' : '#5B5E66', { weight: 600 });
  ctx.restore();
}

// ---------- CLIENTES ----------
STORIES.cl1 = { dur: 5, punches: [[0, 0.05], [0.9, 0.08], [2.2, 0.06]], fn(t) {
  darkBg(t); storyHeader('CLIENTES', 1, 4, true, t);
  rise('Quem já', 100, 560, 110, C.WH, t, 0.1);
  rise('acelerou', 100, 690, 130, C.WH, t, 0.3);
  pop('COM A GENTE', 100, 840, 120, C.Y, t, 0.9, { skew: -9 });
  pill('SEGUROS · BRASÍLIA', 360, 1080, 40, C.Y, C.K, t, 1.8, -0.05);
  pill('ESTÉTICA · GOIÂNIA', 640, 1200, 40, C.WH, C.K, t, 2.2, 0.04);
  pill('E O SEU NEGÓCIO?', 420, 1330, 40, C.K, C.Y, t, 2.8, -0.03);
  rise('toca pra ver →', W / 2, 1460, 40, '#B9BBC1', t, 3.4, { align: 'center', weight: 600 });
} };

STORIES.cl2 = { dur: 7, clip: 'araujo', punches: [[0, 0.05], [0.6, 0.06]], fn(t) {
  lightBg(); storyHeader('CLIENTES', 2, 4, false, t);
  rise('ARAUJO SECURITY', 100, 420, 76, C.K, t, 0.05);
  rise('Taynah Araujo · seguros · Brasília', 100, 480, 34, '#5B5E66', t, 0.2, { weight: 600 });
  const ph = easeOut(prog(t, 0, 0.5));
  ctx.save(); ctx.globalAlpha = ph;
  clipPhone('araujo', 540, 1010 + (1 - ph) * 200, 0.88, -0.02, t, 0);
  ctx.restore();
  pill('ANÚNCIO EM VÍDEO', 290, 1440, 36, C.K, C.Y, t, 0.8, -0.04);
  pill('LOCUÇÃO FEMININA', 760, 1400, 32, C.Y, C.K, t, 1.2, 0.05);
} };

STORIES.cl3 = { dur: 7, clip: 'alessandra', punches: [[0, 0.05], [0.6, 0.06]], fn(t) {
  darkBg(t); storyHeader('CLIENTES', 3, 4, true, t);
  rise('ALESSANDRA MENDES', 100, 420, 72, C.WH, t, 0.05);
  rise('tratamento de melasma · Goiânia', 100, 480, 34, '#B9BBC1', t, 0.2, { weight: 600 });
  const ph = easeOut(prog(t, 0, 0.5));
  ctx.save(); ctx.globalAlpha = ph;
  clipPhone('alessandra', 540, 1010 + (1 - ph) * 200, 0.88, 0.02, t, 0);
  ctx.restore();
  pill('ANÚNCIO COM AS FOTOS DELA', 400, 1440, 32, C.Y, C.K, t, 0.8, -0.04);
} };

STORIES.cl4 = { dur: 5, punches: [[0, 0.05], [0.8, 0.1], [3.2, 0.06]], fn(t) {
  yellowBg(); storyHeader('CLIENTES', 4, 4, false, t);
  rise('O próximo', 100, 620, 120, C.K, t, 0.1);
  rise('pode ser o', 100, 750, 120, C.K, t, 0.35);
  const p = easeOut(prog(t, 0.8, 0.3));
  if (p > 0) stripWord('SEU NEGÓCIO.', 100, 920, 120, { reveal: p, stripColor: C.K, textColor: C.Y });
  ctaButton('CHAMA NO DIRECT', null, 1180, t, 1.6, 3.2);
} };

// ---------- FUNCIONAMENTO ----------
STORIES.fn1 = { dur: 6, punches: [[0, 0.05], [0.7, 0.08], [1.4, 0.04], [2.0, 0.04], [2.6, 0.04], [3.2, 0.04]], fn(t) {
  lightBg(); storyHeader('FUNCIONAMENTO', 1, 4, false, t);
  rise('Como', 100, 470, 110, C.K, t, 0.1);
  pop('FUNCIONA', 100, 600, 140, C.K, t, 0.6, { skew: -9 });
  step(1, 'Escolhe', 'o pacote ou plano', 100, 820, t, 1.3);
  step(2, 'Responde', 'o briefing', 100, 990, t, 1.9);
  step(3, 'Aprova', 'as peças', 100, 1160, t, 2.5);
  step(4, 'Recebe', 'e posta', 100, 1330, t, 3.1);
} };

STORIES.fn2 = { dur: 6, punches: [[0, 0.05], [0.3, 0.06], [2.9, 0.06]], fn(t) {
  darkBg(t); storyHeader('FUNCIONAMENTO', 2, 4, true, t);
  step(1, 'Escolhe o pacote', 'e recebe seus créditos', 100, 470, t, 0.2, true);
  // créditos caindo na carteira
  for (let i = 0; i < 6; i++) {
    const p = easeOutBack(prog(t, 0.7 + i * 0.12, 0.3));
    if (p <= 0) continue;
    ctx.save(); ctx.translate(260 + i * 110, 680); ctx.scale(p, p); ctx.rotate(Math.sin(t * 3 + i) * 0.1);
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(0, 0, 44, 0, 7); ctx.fill();
    ctx.strokeStyle = C.K; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); ctx.stroke();
    text('1', 0, 16, 44, C.K, { align: 'center' });
    ctx.restore();
  }
  step(2, 'Responde o briefing', 'conta do negócio e manda fotos', 100, 960, t, 2.8, true);
  // fotos voando pro briefing
  for (let i = 0; i < 3; i++) {
    const p = easeOut(prog(t, 3.3 + i * 0.25, 0.5));
    if (p <= 0) continue;
    ctx.save(); ctx.translate(lerp(900, 330 + i * 190, p), lerp(1500, 1230, p)); ctx.rotate((i - 1) * 0.12);
    ctx.fillStyle = C.WH; ctx.fillRect(-80, -95, 160, 190);
    ctx.fillStyle = ['#C9CACE', '#FFE873', '#9A9CA3'][i]; ctx.fillRect(-66, -81, 132, 132);
    ctx.restore();
  }
  rise('você tem até 7 dias pra responder', 100, 1420, 36, '#B9BBC1', t, 4.0, { weight: 600 });
} };

STORIES.fn3 = { dur: 6, punches: [[0, 0.05], [0.3, 0.06], [1.6, 0.08], [2.9, 0.06], [4.2, 0.08]], fn(t) {
  lightBg(); storyHeader('FUNCIONAMENTO', 3, 4, false, t);
  step(3, 'Aprova as peças', 'você vê tudo antes e pede ajustes', 100, 470, t, 0.2);
  // cartão de aprovação com check
  const c = easeOutBack(prog(t, 0.7, 0.35));
  if (c > 0) {
    ctx.save(); ctx.translate(540, 760); ctx.scale(c, c); ctx.rotate(-0.03);
    ctx.fillStyle = C.K; roundRect(-380, -130, 760, 260, 36); ctx.fill();
    ctx.fillStyle = C.Y; roundRect(-340, -90, 180, 180, 18); ctx.fill();
    logoMark(-300, -40, 0.7, C.K);
    text('carrossel_promo.png', -130, -20, 34, C.WH, { weight: 600 });
    const ok = easeOutBack(prog(t, 1.6, 0.3));
    ctx.save(); ctx.translate(30, 50); ctx.scale(clamp(ok), clamp(ok));
    ctx.fillStyle = '#2E9E5B'; roundRect(-160, -40, 320, 80, 40); ctx.fill();
    text('✓ APROVADO', 0, 14, 36, C.WH, { align: 'center' }); ctx.restore();
    ctx.restore();
  }
  step(4, 'Recebe e posta', 'ou a gente posta por você nos planos', 100, 1120, t, 2.8);
  pill('NADA VAI PRO AR SEM O SEU OK', W / 2, 1400, 36, C.K, C.Y, t, 4.2, -0.03);
} };

STORIES.fn4 = { dur: 6, punches: [[0, 0.05], [1.9, 0.12], [3.4, 0.06]], fn(t) {
  darkBg(t); storyHeader('FUNCIONAMENTO', 4, 4, true, t);
  rise('Briefing respondido?', W / 2, 470, 70, C.WH, t, 0.1, { align: 'center' });
  clock24(W / 2, 860, 300, t, 0.4, 1.4, 1.9);
  rise('a gente entrega tudo', W / 2, 1300, 56, C.WH, t, 2.3, { align: 'center', weight: 700 });
  pop('EM ATÉ 24 HORAS', W / 2, 1400, 72, C.Y, t, 2.7, { align: 'center', skew: -9 });
} };
