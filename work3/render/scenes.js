// Vídeo 3 (feed): "você manda uma foto, a gente transforma em vídeo". Tempos = take 1 + 0,25s.
const T = { s1: 0, s2: 3.95, s3: 5.75, s4: 10.6, s5: 13.95, s6: 19.55, s7: 24.05, end: 30 };

function phone(cx, cy, w, h, rot, inner, scale = 1) {
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(scale, scale); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(16, 26, w + 28, h + 28, 64); ctx.fill();
  ctx.fillStyle = '#2A2D35'; roundRect(-14, -14, w + 28, h + 28, 64); ctx.fill();
  ctx.save(); roundRect(0, 0, w, h, 50); ctx.clip();
  inner(0, 0, w, h);
  ctx.restore();
  ctx.fillStyle = '#2A2D35'; roundRect(w / 2 - 60, -2, 120, 26, 13); ctx.fill();
  ctx.restore();
}

function polaroid(cx, cy, w, rot, t) {
  const h = w * 1.18;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-w / 2 + 14, -h / 2 + 20, w, h);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-w / 2, -h / 2, w, h);
  const pad = w * 0.06;
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + pad, -h / 2 + pad, w - pad * 2, w - pad * 2); ctx.clip();
  rawPhoto(-w / 2 + pad, -h / 2 + pad, w - pad * 2, w - pad * 2, t);
  ctx.restore();
  text('foto_produto.jpg', 0, h / 2 - pad * 1.3, w * 0.07, '#6B6E76', { align: 'center', weight: 600 });
  ctx.restore();
}

// 1. Capa + gancho: "DE UMA FOTO / PRA UM VÍDEO PRONTO" (quadro 0 já é a capa)
function scene1(t) {
  bg(C.K);
  glow(W / 2, 1000, 640, 'rgba(255,212,0,0.5)', 0.3 + 0.08 * Math.sin(t * 3));
  particles(t, C.Y, 60, 0.45);
  text('DE UMA FOTO', W / 2, 400, 104, C.WH, { align: 'center' });
  const pv = 1 + 0.05 * Math.sin(prog(t, 2.17, 0.3) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 525); ctx.scale(pv, pv);
  text('PRA UM VÍDEO', 0, 0, 118, C.Y, { align: 'center', skew: -9 });
  ctx.restore();
  // polaroid caindo/flutuando; pulsa em "foto"
  const k = 1 + 0.08 * Math.sin(prog(t, 2.17, 0.35) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 1000); ctx.scale(k, k);
  polaroid(0, Math.sin(t * 2) * 10, 470, -0.07 + Math.sin(t * 1.4) * 0.03, t);
  ctx.restore();
  // seta "→ vídeo" piscando
  const a = 0.5 + 0.5 * Math.sin(t * 6);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.Y;
  ctx.beginPath(); ctx.moveTo(W / 2 - 34, 1365); ctx.lineTo(W / 2 + 34, 1365); ctx.lineTo(W / 2, 1405); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(W / 2, 1300); ctx.rotate(-0.03);
  ctx.fillStyle = C.Y; roundRect(-270, -44, 540, 88, 44); ctx.fill();
  ctx.restore();
  text('PRONTO EM ATÉ 24H*', W / 2, 1316, 44, C.K, { align: 'center' });
  // "você manda" — marcação na foto
  const m = easeOutBack(prog(t, 1.29, 0.3));
  if (m > 0) sticker('VOCÊ MANDA', 300, 730, 40, t, 1.29, { rot: -0.22, bgc: C.WH });
}

// 2. Transformação: a foto entra no celular e vira anúncio animado
function scene2(t) {
  const lt = t - T.s2;
  bg(C.Y);
  rays(W / 2, 1000, 1200, t, C.WH, 0.25);
  const fly = easeIn(clamp(lt / 0.22));
  if (lt < 0.22) {
    ctx.save(); ctx.translate(W / 2, lerp(1000, 960, fly)); ctx.scale(lerp(1, 0.5, fly), lerp(1, 0.5, fly));
    polaroid(0, 0, 470, lerp(-0.07, 0.3, fly), t); ctx.restore();
  }
  const pin = easeOutBack(prog(lt, 0.12, 0.4));
  phone(W / 2, 1000 + Math.sin(t * 2.3) * 10, 460, 820, Math.sin(t * 1.6) * 0.05, adScreen('burger', Math.max(0, lt - 0.15)), lerp(0.6, 1, clamp(pin)));
  burst(t, 4.09, W / 2, 1000, C.K, 40, 640);
  // flash da transformação
  const f = 1 - prog(lt, 0.14, 0.3);
  if (lt > 0.14 && f > 0) { ctx.save(); ctx.globalAlpha = f * 0.9; ctx.fillStyle = C.WH; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const n = easeOutBack(prog(t, 4.68, 0.3));
  ctx.save(); ctx.translate(W / 2, 430); ctx.scale(n, n);
  text('NISSO AQUI!', 0, 0, 132, C.K, { align: 'center', skew: -9, alpha: clamp(n) });
  ctx.restore();
}

// 3. O que vem no vídeo — fundo claro, ícones e itens
function iconPlay(cx, cy, t) { ctx.fillStyle = C.Y; ctx.beginPath(); ctx.moveTo(cx - 18, cy - 26); ctx.lineTo(cx + 28, cy); ctx.lineTo(cx - 18, cy + 26); ctx.closePath(); ctx.fill(); }
function iconWave(cx, cy, t) {
  ctx.fillStyle = C.Y;
  for (let i = 0; i < 5; i++) { const h = 14 + 30 * Math.abs(Math.sin(t * 9 + i * 1.3)); roundRect(cx - 34 + i * 15, cy - h / 2, 9, h, 4); ctx.fill(); }
}
function iconSend(cx, cy, t) {
  ctx.fillStyle = C.Y; ctx.beginPath(); ctx.moveTo(cx - 28, cy - 4); ctx.lineTo(cx + 30, cy - 26); ctx.lineTo(cx + 10, cy + 28); ctx.lineTo(cx + 2, cy + 6); ctx.closePath(); ctx.fill();
}
const FEATS = [
  { l1: 'VÍDEO', l2: 'PROFISSIONAL', at: 5.93, icon: iconPlay },
  { l1: 'ANIMAÇÃO', l2: '+ LOCUÇÃO', at: 7.37, icon: iconWave },
  { l1: 'PRONTO PRA POSTAR', l2: 'E ANUNCIAR', at: 9.45, icon: iconSend },
];
function scene3(t) {
  bg(C.OW);
  const lt = t - T.s3;
  // celular do anúncio continua à direita, menor
  phone(700, 1230, 280, 500, 0.1 + Math.sin(t * 1.5) * 0.03, adScreen('burger', lt + 1.6), easeOut(prog(lt, 0, 0.35)));
  FEATS.forEach((f, i) => {
    const p = easeOutBack(prog(t, f.at - 0.05, 0.32));
    if (p <= 0) return;
    const y = 360 + i * 230, x = lerp(-400, 110, clamp(p));
    ctx.fillStyle = C.K; ctx.beginPath(); ctx.arc(x + 70, y, 70, 0, 7); ctx.fill();
    f.icon(x + 70, y, t);
    text(f.l1, x + 170, y - 6, 62, C.K);
    text(f.l2, x + 170, y + 58, 62, C.K);
  });
}

// 4. Sem gravar, sem editar, sem aparecer — preto, ícones riscados
function iconCam(t) { ctx.fillStyle = C.WH; roundRect(-70, -45, 110, 90, 18); ctx.fill(); ctx.beginPath(); ctx.moveTo(40, -10); ctx.lineTo(80, -35); ctx.lineTo(80, 35); ctx.lineTo(40, 10); ctx.fill(); }
function iconCut(t) {
  ctx.strokeStyle = C.WH; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-50, -50); ctx.lineTo(40, 30); ctx.moveTo(50, -50); ctx.lineTo(-40, 30); ctx.stroke();
  ctx.beginPath(); ctx.arc(-48, 48, 20, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(48, 48, 20, 0, 7); ctx.stroke();
}
function iconFace(t) { ctx.fillStyle = C.WH; ctx.beginPath(); ctx.arc(0, -28, 32, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 50, 62, 40, 0, Math.PI, 0); ctx.fill(); }
const NOS = [
  { w: 'GRAVAR', at: 10.85, icon: iconCam },
  { w: 'EDITAR', at: 11.8, icon: iconCut },
  { w: 'APARECER', at: 12.85, icon: iconFace },
];
function scene4(t) {
  bg(C.K);
  particles(t, C.Y, 40, 0.35);
  NOS.forEach((n, i) => {
    const p = easeOutBack(prog(t, n.at - 0.05, 0.28));
    if (p <= 0) return;
    const y = 520 + i * 320;
    ctx.save(); ctx.translate(230, y); ctx.scale(p, p); n.icon(t);
    const x = easeOut(prog(t, n.at + 0.25, 0.18));
    ctx.strokeStyle = C.Y; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-80, -80); ctx.lineTo(-80 + 160 * x, -80 + 160 * x); ctx.stroke();
    ctx.restore();
    text('SEM', 370, y - 14, 60, C.Y, { alpha: clamp(p) });
    ctx.save(); ctx.translate(370, y + 74); ctx.scale(p, p);
    text(n.w, 0, 0, 104, C.WH, { skew: -9 });
    ctx.restore();
    burst(t, n.at, 230, y, C.Y, 18, 240);
  });
}
