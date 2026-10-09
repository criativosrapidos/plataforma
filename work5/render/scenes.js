// Anúncio Alessandra Mendes v2 — atenção → dor → explicação → sonho → solução → objeção → convite.
// Tempos = take de 38s sem a frase do sol, acelerado 10% e deslocado 0,3s. Duração 32s.
window.DURATION = 32;
const T = { s1: 0, s2: 2.05, s3: 7.3, s4: 9.4, s5: 14.4, s6: 20.15, s7: 27.15, end: 32 };

const FOTO_PERFIL = new Image(); FOTO_PERFIL.src = 'foto-perfil.jpg';       // 1066x1600, fundo claro
const FOTO_SENTADA = new Image(); FOTO_SENTADA.src = 'foto-alessandra.jpg'; // 828x1448, estante
function ready(im) { return im.complete && im.naturalWidth; }

// foto preenchendo a tela (cover) com zoom lento e foco horizontal fx (0..1)
function photoCover(im, t0, t, fx = 0.5, fy = 0.4, zoom = 0.06) {
  if (!ready(im)) return;
  const s0 = Math.max(W / im.naturalWidth, H / im.naturalHeight);
  const s = s0 * (1 + zoom * clamp((t - t0) / 6));
  const w = im.naturalWidth * s, h = im.naturalHeight * s;
  ctx.drawImage(im, (W - w) * fx, (H - h) * fy, w, h);
}
function photoCard(im, cx, cy, w, h, crop, r) {
  if (!ready(im)) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(cx - w / 2 + 14, cy - h / 2 + 20, w, h, r); ctx.fill();
  roundRect(cx - w / 2, cy - h / 2, w, h, r); ctx.clip();
  ctx.drawImage(im, crop[0], crop[1], crop[2], crop[3], cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
  ctx.strokeStyle = C.GOLD; ctx.lineWidth = 6; roundRect(cx - w / 2, cy - h / 2, w, h, r); ctx.stroke();
}
function avatar(cx, cy, r) {
  if (!ready(FOTO_PERFIL)) return;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
  ctx.drawImage(FOTO_PERFIL, 300, 330, 620, 620, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
  ctx.strokeStyle = C.GOLD; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, 7); ctx.stroke();
}
function shade(top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(0.45, 'rgba(62,26,36,0)'); g.addColorStop(0.62, 'rgba(62,26,36,0.35)'); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function pin(cx, cy, s, color, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  const r = (t * 1.2) % 1;
  ctx.strokeStyle = color; ctx.globalAlpha = 0.5 * (1 - r); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(0, 70, 30 + r * 70, 10 + r * 22, 0, 0, 7); ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, -20, 46, Math.PI * 0.85, Math.PI * 0.15); ctx.lineTo(0, 70); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.WINE; ctx.beginPath(); ctx.arc(0, -22, 18, 0, 7); ctx.fill();
  ctx.restore();
}
function sparkle(x, y, s, t, color) {
  const p = 0.5 + 0.5 * Math.sin(t * 4 + x);
  ctx.save(); ctx.translate(x, y); ctx.scale(s * p, s * p); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(4, -4, 30, 0); ctx.quadraticCurveTo(4, 4, 0, 30);
  ctx.quadraticCurveTo(-4, 4, -30, 0); ctx.quadraticCurveTo(-4, -4, 0, -30); ctx.fill(); ctx.restore();
}
function chipLine(items, y, t, at, size = 36) {
  const p = easeOut(prog(t, at, 0.35));
  ctx.save(); ctx.globalAlpha = p;
  const pad = 30, gap = 16;
  const ws = items.map((s) => measure(s, size) + pad * 2);
  let x = W / 2 - (ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1)) / 2;
  items.forEach((s, i) => {
    ctx.fillStyle = 'rgba(212,175,106,0.18)'; roundRect(x, y - 40, ws[i], 76, 38); ctx.fill();
    ctx.strokeStyle = C.GOLD; ctx.lineWidth = 2; roundRect(x, y - 40, ws[i], 76, 38); ctx.stroke();
    text(s, x + ws[i] / 2, y + 12, size, C.GOLD, { align: 'center' });
    x += ws[i] + gap;
  });
  ctx.restore();
}
function pill(str, cx, cy, size, bgc, fg, t, at) {
  const p = easeOutBack(prog(t, at, 0.32));
  if (p <= 0) return;
  const w = measure(str, size) + size * 1.4, h = size * 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p);
  ctx.fillStyle = bgc; roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.restore();
  text(str, cx, cy + size * 0.36, size, fg, { align: 'center', alpha: clamp(p) });
}
function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

// Silhueta de Goiânia (prédios + torre), com janelas acendendo
function skyline(t, baseY, color) {
  ctx.save(); ctx.fillStyle = color;
  const B = [[60, 180], [150, 300], [230, 230], [300, 420], [380, 340], [450, 520], [540, 380], [610, 460], [690, 300], [760, 560], [850, 360], [930, 280], [1010, 410]];
  B.forEach(([x, h], i) => { ctx.fillRect(x - 38, baseY - h, 76, h + 400); });
  // torre de TV
  ctx.fillRect(268, baseY - 640, 14, 240); ctx.beginPath(); ctx.moveTo(250, baseY - 420); ctx.lineTo(300, baseY - 420); ctx.lineTo(275, baseY - 470); ctx.fill();
  // janelas
  B.forEach(([x, h], i) => {
    for (let r = 0; r < Math.floor(h / 46); r++) for (let c = 0; c < 2; c++) {
      const on = rand(i * 31 + r * 7 + c) > 0.45 && Math.sin(t * 2 + i + r) > -0.6;
      if (!on) continue;
      ctx.fillStyle = 'rgba(255,220,150,0.75)'; ctx.fillRect(x - 24 + c * 30, baseY - h + 20 + r * 46, 16, 20);
    }
  });
  ctx.restore();
}

// Pele ilustrativa com manchas; uma esponja de base passa e cobre (a mancha volta)
function skinOrb(cx, cy, r, t, sponge = false) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#F3DCCB'); g.addColorStop(0.6, '#E2BFA8'); g.addColorStop(1, '#C99D85');
  ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  for (let i = 0; i < 160; i++) {
    const a = rand(i) * 7, d = Math.sqrt(rand(i + 3)) * r;
    ctx.fillStyle = 'rgba(150,100,80,0.10)'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + rand(i + 5) * 2, 0, 7); ctx.fill();
  }
  const cover = sponge ? Math.max(0, Math.sin(((t - 2.4) / 2.6) * Math.PI)) * 0.85 : 0;
  [[-0.25, -0.1, 0.32], [0.18, 0.05, 0.24], [-0.02, 0.3, 0.18]].forEach(([x, y, s], i) => {
    const mg = ctx.createRadialGradient(cx + x * r, cy + y * r, 0, cx + x * r, cy + y * r, s * r);
    mg.addColorStop(0, `rgba(140,85,60,${0.5 * (1 - cover)})`); mg.addColorStop(1, 'rgba(140,85,60,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(cx + x * r, cy + y * r, s * r * 1.2, s * r, 0.4 * i, 0, 7); ctx.fill();
  });
  ctx.restore();
  ctx.strokeStyle = C.GOLD; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, 7); ctx.stroke();
  if (sponge && t > 2.4) {
    const ph = ((t - 2.4) / 2.6) * Math.PI * 2;
    const sx = cx + Math.cos(ph) * r * 0.45, sy = cy + Math.sin(ph * 2) * r * 0.2;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.4);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(8, 12, 80, 56, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#E8C2A6'; ctx.beginPath(); ctx.ellipse(0, 0, 80, 56, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#D9AE8F'; ctx.beginPath(); ctx.ellipse(0, -10, 70, 36, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
}

// 1. ATENÇÃO — Goiânia (quadro 0 já é a capa)
function scene1(t) {
  bg(C.WINE);
  glow(W / 2, 700, 700, 'rgba(212,175,106,0.5)', 0.3);
  particles(t, C.GOLD, 40, 0.35);
  skyline(t, 1760, '#2A0F17');
  pin(W / 2, 420, 1.3, C.GOLD, t);
  const g = 1 + 0.07 * Math.sin(prog(t, 0.37, 0.35) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 740); ctx.scale(g, g);
  text('GOIÂNIA,', 0, 0, 150, C.WH, { align: 'center' });
  ctx.restore();
  const a = 1 + 0.08 * Math.sin(prog(t, 1.03, 0.35) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 900); ctx.scale(a, a);
  text('ATENÇÃO!', 0, 0, 150, C.GOLD, { align: 'center' });
  ctx.restore();
  chipLine(['DIA 19', 'SETOR MARISTA', 'SÓ 10 VAGAS'], 1060, t, -1);
}

// 2. DOR — a mancha que não sai com nada / escondida com maquiagem
function scene2(t) {
  bg(C.OW);
  serif('sabe aquela', W / 2, 330, 64, C.ROSE, { align: 'center', alpha: easeOut(prog(t, T.s2, 0.25)) });
  const m = easeOutBack(prog(t, 2.6, 0.32));
  ctx.save(); ctx.translate(W / 2, 455); ctx.scale(clamp(m), clamp(m));
  text('MANCHA QUE NÃO', 0, 0, 92, C.INK, { align: 'center' });
  text('SAI COM NADA?', 0, 100, 92, C.WINE2, { align: 'center' });
  ctx.restore();
  const o = easeOutBack(prog(t, T.s2 + 0.1, 0.45));
  ctx.save(); ctx.translate(W / 2, 980); ctx.scale(clamp(o), clamp(o)); ctx.translate(-W / 2, -980);
  skinOrb(W / 2, 980, 250, t, true);
  ctx.restore();
  text('imagem ilustrativa', W / 2, 1268, 26, C.G, { align: 'center', weight: 500 });
  const k = easeOutBack(prog(t, 5.75, 0.32));
  if (k > 0) {
    ctx.save(); ctx.translate(W / 2, 1375); ctx.scale(k, k); ctx.rotate(-0.02);
    ctx.fillStyle = C.WINE; roundRect(-420, -50, 840, 100, 50); ctx.fill();
    ctx.restore();
    text('E VOCÊ ESCONDE COM MAQUIAGEM', W / 2, 1390, 40, C.WH, { align: 'center', alpha: clamp(k) });
  }
}

// 3. EXPLICAÇÃO — isso tem nome: melasma
function scene3(t) {
  bg(C.WINE);
  particles(t, C.GOLD, 35, 0.3);
  text('ISSO TEM NOME:', W / 2, 560, 80, C.NUDE, { align: 'center', alpha: easeOut(prog(t, T.s3, 0.2)) });
  const m = easeOutBack(prog(t, 8.4, 0.32));
  ctx.save(); ctx.translate(W / 2, 760); ctx.scale(clamp(m), clamp(m));
  text('MELASMA', 0, 0, 160, C.GOLD, { align: 'center' });
  ctx.restore();
  burst(t, 8.48, W / 2, 700, C.GOLD, 30, 520);
  pill('☀  piora com o sol', W / 2, 980, 50, 'rgba(212,175,106,0.2)', C.WH, t, 8.75);
  pill('↺  volta sem o cuidado certo', W / 2, 1120, 50, 'rgba(212,175,106,0.2)', C.WH, t, 8.95);
}
