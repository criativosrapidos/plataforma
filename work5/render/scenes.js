// Anúncio Alessandra Mendes v3 — atenção → dor → explicação → sonho → solução → objeção → convite.
// Voz em velocidade natural (cortes: frase do sol e "presente"). Duração 34s.
window.DURATION = 34;
const T = { s1: 0, s2: 2.25, s3: 8.1, s4: 10.45, s5: 15.9, s6: 22.25, s7: 28.3, end: 34 };

const FOTO_PERFIL = new Image(); FOTO_PERFIL.src = 'foto-perfil.jpg';       // 1066x1600 — usada só na Solução
const FOTO_SENTADA = new Image(); FOTO_SENTADA.src = 'foto-alessandra.jpg'; // 828x1448 — usada só no Convite
function ready(im) { return im.complete && im.naturalWidth; }
function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

function photoCard(im, cx, cy, w, h, crop, r) {
  if (!ready(im)) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(cx - w / 2 + 16, cy - h / 2 + 24, w, h, r); ctx.fill();
  roundRect(cx - w / 2, cy - h / 2, w, h, r); ctx.clip();
  ctx.drawImage(im, crop[0], crop[1], crop[2], crop[3], cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
  ctx.strokeStyle = C.GOLD; ctx.lineWidth = 4; roundRect(cx - w / 2, cy - h / 2, w, h, r); ctx.stroke();
}
function sparkle(x, y, s, t, color) {
  const p = 0.5 + 0.5 * Math.sin(t * 4 + x);
  ctx.save(); ctx.translate(x, y); ctx.scale(s * p, s * p); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(4, -4, 30, 0); ctx.quadraticCurveTo(4, 4, 0, 30);
  ctx.quadraticCurveTo(-4, 4, -30, 0); ctx.quadraticCurveTo(-4, -4, 0, -30); ctx.fill(); ctx.restore();
}
function pill(str, cx, cy, size, bgc, fg, t, at, outline = null) {
  const p = easeOutBack(prog(t, at, 0.32));
  if (p <= 0) return;
  const w = measure(str, size) + size * 1.4, h = size * 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p);
  ctx.fillStyle = bgc; roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = 2; roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.stroke(); }
  ctx.restore();
  text(str, cx, cy + size * 0.36, size, fg, { align: 'center', alpha: clamp(p) });
}
// linha fina dourada que se desenha (detalhe premium)
function goldRule(cx, y, w, t, at) {
  const p = easeOut(prog(t, at, 0.5));
  ctx.fillStyle = C.GOLD; ctx.fillRect(cx - (w / 2) * p, y, w * p, 3);
}
// vazamento de luz quente (cinematográfico)
function lightLeak(t, alpha = 0.25) {
  const x = W * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.4)));
  const g = ctx.createRadialGradient(x, 300, 0, x, 300, 900);
  g.addColorStop(0, `rgba(227,192,141,${alpha})`); g.addColorStop(1, 'rgba(227,192,141,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// Silhueta de Goiânia em traço dourado
function skyline(t, baseY, a) {
  ctx.save(); ctx.globalAlpha = a;
  const B = [[60, 180], [150, 300], [230, 230], [300, 420], [380, 340], [450, 520], [540, 380], [610, 460], [690, 300], [760, 560], [850, 360], [930, 280], [1010, 410]];
  ctx.strokeStyle = C.GOLD; ctx.lineWidth = 3;
  const draw = easeOut(prog(t, -0.5, 1.6));
  ctx.beginPath(); ctx.moveTo(0, baseY);
  B.forEach(([x, h]) => { const hh = h * draw; ctx.lineTo(x - 38, baseY); ctx.lineTo(x - 38, baseY - hh); ctx.lineTo(x + 38, baseY - hh); ctx.lineTo(x + 38, baseY); });
  ctx.lineTo(W, baseY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(275, baseY - 420 * draw); ctx.lineTo(275, baseY - 640 * draw); ctx.stroke();
  B.forEach(([x, h], i) => {
    for (let r = 0; r < Math.floor(h * draw / 50); r++) for (let c = 0; c < 2; c++) {
      if (rand(i * 31 + r * 7 + c) < 0.5 || Math.sin(t * 2 + i + r) < -0.5) continue;
      ctx.fillStyle = 'rgba(227,192,141,0.55)'; ctx.fillRect(x - 22 + c * 28, baseY - h * draw + 22 + r * 50, 14, 18);
    }
  });
  ctx.restore();
}

// ===== Rosto ilustrado (imagem ilustrativa) =====
// melasma: manchas nas bochechas, testa e buço; `spots` 0..1 controla a intensidade
function faceIllustration(cx, cy, s, t, spots, opts = {}) {
  const { sponge = 0, glowSkin = 0, rings = 0 } = opts;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  // cabelo atrás
  ctx.fillStyle = '#3A2420';
  ctx.beginPath(); ctx.ellipse(0, -40, 250, 300, 0, Math.PI, 0); ctx.lineTo(250, 260); ctx.quadraticCurveTo(0, 330, -250, 260); ctx.closePath(); ctx.fill();
  // pescoço
  ctx.fillStyle = '#D9AE93'; roundRect(-70, 180, 140, 160, 40); ctx.fill();
  // rosto
  const skin = ctx.createRadialGradient(-60, -60, 40, 0, 0, 260);
  skin.addColorStop(0, '#F2D6C2'); skin.addColorStop(1, '#DDB49A');
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(0, 0, 190, 245, 0, 0, 7); ctx.fill();
  // manchas de melasma (padrão "máscara")
  const P = [[-105, 40, 70, 48, 0.3], [105, 40, 70, 48, -0.3], [0, -150, 95, 38, 0], [0, 115, 42, 16, 0], [-60, -95, 40, 26, 0.2], [60, -95, 40, 26, -0.2]];
  P.forEach(([x, y, rx, ry, rot], i) => {
    const k = spots * (0.85 + 0.15 * Math.sin(t * 2 + i));
    if (k <= 0.01) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, `rgba(135,82,58,${0.55 * k})`); g.addColorStop(0.6, `rgba(135,82,58,${0.32 * k})`); g.addColorStop(1, 'rgba(135,82,58,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 7); ctx.fill();
  });
  // brilho de pele uniforme
  if (glowSkin > 0) {
    ctx.save(); ctx.globalAlpha = glowSkin * 0.5;
    const gs = ctx.createRadialGradient(-40, -40, 10, 0, 0, 240);
    gs.addColorStop(0, 'rgba(255,240,228,0.9)'); gs.addColorStop(1, 'rgba(255,240,228,0)');
    ctx.fillStyle = gs; ctx.beginPath(); ctx.ellipse(0, 0, 190, 245, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  // olhos fechados, sobrancelhas, nariz, boca
  ctx.strokeStyle = '#5A3A30'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(-70, -20, 34, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(70, -20, 34, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-115, -70); ctx.quadraticCurveTo(-70, -95, -30, -78); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(115, -70); ctx.quadraticCurveTo(70, -95, 30, -78); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-18, 60, 8, 66); ctx.stroke();
  ctx.fillStyle = '#B9675E'; ctx.beginPath(); ctx.moveTo(-50, 140); ctx.quadraticCurveTo(0, 118, 50, 140); ctx.quadraticCurveTo(0, 172, -50, 140); ctx.fill();
  // franja / cabelo na frente
  ctx.fillStyle = '#3A2420';
  ctx.beginPath(); ctx.moveTo(-200, -60); ctx.quadraticCurveTo(-180, -270, 0, -265); ctx.quadraticCurveTo(160, -262, 200, -60);
  ctx.quadraticCurveTo(120, -200, -10, -200); ctx.quadraticCurveTo(-140, -195, -200, -60); ctx.fill();
  // anéis tracejados destacando as manchas
  if (rings > 0) {
    ctx.save(); ctx.globalAlpha = rings; ctx.strokeStyle = C.GOLD; ctx.lineWidth = 4; ctx.setLineDash([10, 10]); ctx.lineDashOffset = -t * 30;
    [[-105, 40, 95], [105, 40, 95], [0, -150, 110]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r * rings, 0, 7); ctx.stroke(); });
    ctx.restore();
  }
  // esponja de maquiagem batendo na bochecha
  if (sponge > 0) {
    const ph = t * 5;
    const sx = -105 + Math.sin(ph) * 30, sy = 40 + Math.abs(Math.cos(ph)) * -20;
    ctx.save(); ctx.globalAlpha = sponge; ctx.translate(sx - 70, sy - 10); ctx.rotate(-0.6);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(8, 12, 70, 52, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#E9B79B'; ctx.beginPath(); ctx.moveTo(0, -70); ctx.quadraticCurveTo(66, -10, 52, 40); ctx.quadraticCurveTo(0, 74, -52, 40); ctx.quadraticCurveTo(-66, -10, 0, -70); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// 1. ATENÇÃO — capa limpa: só "GOIÂNIA, ATENÇÃO!" (quadro 0 já é a capa)
function scene1(t) {
  bg(C.K);
  lightLeak(t, 0.22);
  particles(t, C.GOLD, 45, 0.35);
  skyline(t, 1520, 0.9);
  const g = 1 + 0.06 * Math.sin(prog(t, 0.38, 0.35) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 700); ctx.scale(g, g);
  text('GOIÂNIA,', 0, 0, 160, C.WH, { align: 'center' });
  ctx.restore();
  const a = 1 + 0.08 * Math.sin(prog(t, 1.1, 0.35) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 870); ctx.scale(a, a);
  text('ATENÇÃO!', 0, 0, 160, C.GOLD, { align: 'center' });
  ctx.restore();
  goldRule(W / 2, 930, 360, t, 0.2);
}

// 2. DOR — a mancha que não sai com nada; esconde com maquiagem
function scene2(t) {
  bg(C.K);
  lightLeak(t, 0.15);
  serif('sabe aquela mancha no rosto...', W / 2, 330, 60, C.NUDE, { align: 'center', alpha: easeOut(prog(t, T.s2, 0.3)) });
  const f = easeOutBack(prog(t, T.s2 + 0.1, 0.5));
  faceIllustration(W / 2, 870, 1.25 * lerp(0.9, 1, clamp(f)), t, 1, { sponge: easeOut(prog(t, 5.8, 0.3)) });
  text('imagem ilustrativa', W / 2, 1265, 26, C.G, { align: 'center', weight: 500 });
  const m = easeOutBack(prog(t, 3.9, 0.3));
  if (m > 0 && t < 5.8) {
    ctx.save(); ctx.translate(W / 2, 1385); ctx.scale(m, m);
    text('QUE NÃO SAI COM NADA', 0, 0, 66, C.WH, { align: 'center' });
    ctx.restore();
  }
  const k = easeOutBack(prog(t, 5.8, 0.3));
  if (k > 0) {
    ctx.save(); ctx.translate(W / 2, 1370); ctx.scale(k, k);
    text('E VOCÊ ESCONDE', 0, 0, 66, C.WH, { align: 'center' });
    text('COM MAQUIAGEM TODO DIA', 0, 72, 52, C.GOLD, { align: 'center' });
    ctx.restore();
  }
}

// 3. EXPLICAÇÃO — isso tem nome: melasma (zoom nas manchas)
function scene3(t) {
  bg(C.CREAM);
  const lt = t - T.s3;
  text('ISSO TEM NOME:', W / 2, 330, 64, C.INK, { align: 'center', alpha: easeOut(prog(lt, 0, 0.2)) });
  const m = easeOutBack(prog(t, 9.25, 0.32));
  ctx.save(); ctx.translate(W / 2, 485); ctx.scale(clamp(m), clamp(m));
  text('MELASMA', 0, 0, 150, C.INK, { align: 'center' });
  ctx.restore();
  ctx.save(); ctx.globalAlpha = clamp(m); ctx.fillStyle = C.ROSE; ctx.fillRect(W / 2 - 120, 520, 240 * clamp(m), 8); ctx.restore();
  faceIllustration(W / 2, 1000, 1.05 + 0.05 * prog(lt, 0, 2.3), t, 1, { rings: easeOut(prog(t, 9.4, 0.5)) });
  text('imagem ilustrativa', W / 2, 1330, 26, C.G, { align: 'center', weight: 500 });
  pill('☀ piora com o sol  ·  ↺ volta sem cuidado', W / 2, 1420, 34, C.INK, C.CREAM, t, 9.6);
}
