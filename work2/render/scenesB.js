// Vídeo 2. Cenas 5 a 7: pacotes, prazo e CTA
const PKGS = [
  { nome: 'START', qtd: '1 vídeo + 1 carrossel', preco: '150', on: 15.6, punch: 15.6 },
  { nome: 'PRO', qtd: '5 vídeos + 5 carrosséis', preco: '500', on: 15.68, punch: 19.02 },
  { nome: 'MAX', qtd: '10 vídeos + 10 carrosséis', preco: '750', on: 20.38, punch: 22.73, tag: 'MAIS VANTAJOSO' },
];

function pkgCard(p, i, t) {
  const enter = easeOutBack(prog(t, T.s5 + i * 0.12, 0.4));
  if (enter <= 0) return;
  // qual card está "aceso": Pro de 15,68 a 20,38, Max depois; Start no começo
  const active = i === 1 ? t >= 15.68 && t < 20.38 : i === 2 ? t >= 20.38 : t < 15.68;
  const a = active ? 1 : 0;
  const lift = easeOut(active ? prog(t, i === 2 ? 20.38 : 15.68, 0.3) : 1 - prog(t, 20.38, 0.3)) * (i === 0 ? 0 : 1);
  const x = 100, w = 820, h = 270, y = 300 + i * 320;
  const sc = 1 + 0.025 * (active ? 1 : 0);
  ctx.save();
  ctx.translate(x + w / 2 + (1 - clamp(enter)) * 900, y + h / 2);
  ctx.scale(sc * (0.9 + 0.1 * clamp(enter)), sc * (0.9 + 0.1 * clamp(enter)));
  ctx.translate(-w / 2, -h / 2);
  if (active) glow(w / 2, h / 2, 520, 'rgba(255,212,0,0.6)', 0.35);
  ctx.fillStyle = active ? C.Y : '#1E2128'; roundRect(0, 0, w, h, 36); ctx.fill();
  if (!active) { ctx.strokeStyle = '#3A3D45'; ctx.lineWidth = 3; roundRect(0, 0, w, h, 36); ctx.stroke(); }
  const fg = active ? C.K : C.WH, fg2 = active ? C.K : '#A8ABB3';
  text(`PACOTE ${p.nome}`, 44, 84, 56, fg, { skew: active ? -9 : 0 });
  text(p.qtd, 44, 146, 34, fg2, { weight: 700 });
  // preço com impacto quando é falado
  const k = 1 + 0.18 * Math.sin(prog(t, p.punch, 0.35) * Math.PI);
  ctx.save(); ctx.translate(w - 44, 228); ctx.scale(k, k);
  text(`R$${p.preco}`, 0, 0, 110, fg, { align: 'right', skew: -9 });
  ctx.restore();
  if (p.tag && t >= 22.73) {
    const g = easeOutBack(prog(t, 22.8, 0.3));
    ctx.save(); ctx.translate(w - 170, -10); ctx.rotate(0.06); ctx.scale(g, g);
    ctx.fillStyle = C.K; roundRect(-170, -32, 340, 64, 32); ctx.fill();
    ctx.restore();
    text(p.tag, w - 170, 4, 32, C.WH, { align: 'center', alpha: clamp(g) });
    text('R$37,50 por peça', 44, 222, 36, fg2, { weight: 700, alpha: easeOut(prog(t, 23.3, 0.3)) });
  }
  ctx.restore();
  if (active && i > 0) burst(t, p.punch, x + w - 160, y + 200, C.Y, 28, 360);
}

function sceneB5(t) {
  bg(C.K);
  particles(t, C.Y, 50, 0.4);
  const h = easeOut(prog(t, T.s5, 0.25));
  text('ESCOLHA SEU PACOTE', W / 2, 255, 52, C.WH, { align: 'center', alpha: h });
  PKGS.forEach((p, i) => pkgCard(p, i, t));
}

// 6. Prazo — relógio girando
function sceneB6(t) {
  bg(C.Y);
  const lt = t - T.s6;
  dottedRing(W / 2, 960, 330, 330, t, C.K, 0.2);
  const a = easeOut(prog(lt, 0, 0.25));
  text('CADA VÍDEO', W / 2, 380, 100, C.K, { align: 'center', alpha: a });
  text('PRONTO EM ATÉ', W / 2, 490, 84, C.K, { align: 'center', alpha: easeOut(prog(t, 25.3, 0.25)) });
  // relógio
  const cx = W / 2, cy = 860, r = 210;
  const c = easeOutBack(prog(lt, 0.1, 0.4));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(c, c);
  ctx.fillStyle = C.K; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.strokeStyle = C.Y; ctx.lineWidth = 10;
  for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(an) * (r - 40), Math.sin(an) * (r - 40)); ctx.lineTo(Math.cos(an) * (r - 18), Math.sin(an) * (r - 18)); ctx.stroke(); }
  const spin = easeOut(prog(t, 24.3, 2.2)) * Math.PI * 2 * 2;
  ctx.lineCap = 'round'; ctx.strokeStyle = C.WH;
  ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(spin / 12 - Math.PI / 2) * 110, Math.sin(spin / 12 - Math.PI / 2) * 110); ctx.stroke();
  ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(spin - Math.PI / 2) * 170, Math.sin(spin - Math.PI / 2) * 170); ctx.stroke();
  ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.fill();
  ctx.restore();
  const v = easeOutBack(prog(t, 26.0, 0.35));
  if (v > 0) {
    ctx.save(); ctx.translate(W / 2, 1250); ctx.scale(v, v);
    stripWord('24 HORAS*', 0, 0, 128, { align: 'center', stripColor: C.K, textColor: C.WH });
    ctx.restore();
  }
  text('*a partir do briefing completo', W / 2, 1335, 34, C.K, { align: 'center', weight: 600, alpha: prog(t, 26.4, 0.3) * 0.8 });
}

// 7. CTA — logo, botão e clique
const CLICK2 = 28.0;
function sceneB7(t) {
  bg(C.K);
  const lt = t - T.s7;
  glow(W / 2, 1000, 560, 'rgba(255,212,0,0.5)', 0.3);
  particles(t, C.Y, 50, 0.45);
  const l = easeOutBack(prog(lt, 0, 0.35));
  ctx.save(); ctx.globalAlpha = clamp(l * 1.5);
  const s = lerp(0.85, 1, l); ctx.translate(W / 2, 430); ctx.scale(s, s); ctx.translate(-W / 2, -430);
  drawLogo(W / 2, 430, 560, 1, C.WH);
  ctx.restore();
  text('CHAMA NO', W / 2, 720, 110, C.WH, { align: 'center', alpha: easeOut(prog(t, 27.45, 0.2)) });
  const d = easeOutBack(prog(t, 27.95, 0.3));
  ctx.save(); ctx.translate(W / 2, 860); ctx.scale(d, d);
  text('DIRECT', 0, 0, 170, C.Y, { align: 'center', skew: -9 });
  ctx.restore();
  // botão pulsando + mão clicando
  const b = easeOutBack(prog(t, 27.6, 0.35));
  if (b > 0) {
    const pulse = 1 + 0.05 * Math.sin((t - 27.6) * 2 * Math.PI * 1.8);
    const press = t >= CLICK2 && t < CLICK2 + 0.15 ? 0.92 : 1;
    const bw = 700, bh = 150, cy = 1080;
    const ring = ((t - 27.6) * 1.8) % 1;
    ctx.save(); ctx.translate(W / 2, cy); ctx.scale(b * pulse * press, b * pulse * press);
    ctx.strokeStyle = `rgba(255,212,0,${0.5 * (1 - ring)})`; ctx.lineWidth = 8;
    roundRect(-bw / 2 - ring * 50, -bh / 2 - ring * 50, bw + ring * 100, bh + ring * 100, 75 + ring * 50); ctx.stroke();
    ctx.fillStyle = C.Y; roundRect(-bw / 2, -bh / 2, bw, bh, 75); ctx.fill();
    text('FAZER MEU PEDIDO →', 0, 22, 58, C.K, { align: 'center' });
    ctx.restore();
    // mãozinha
    const hp = prog(t, 27.7, 0.3), hx = W / 2 + 300, hy = cy + 40 + (1 - easeOut(hp)) * 200 + (t >= CLICK2 && t < CLICK2 + 0.15 ? 12 : 0);
    if (hp > 0) {
      ctx.save(); ctx.globalAlpha = clamp(hp * 2); ctx.translate(hx, hy); ctx.rotate(-0.3);
      ctx.fillStyle = C.WH; ctx.strokeStyle = C.K; ctx.lineWidth = 6;
      roundRect(-18, -60, 36, 90, 18); ctx.fill(); ctx.stroke();
      roundRect(-40, 0, 92, 80, 26); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    burst(t, CLICK2, W / 2 + 290, cy, C.Y, 24, 300);
  }
  // recapitulação
  const r = easeOut(prog(t, 28.6, 0.3));
  ctx.save(); ctx.globalAlpha = r;
  ctx.fillStyle = C.WH; roundRect(W / 2 - 385, 1215, 370, 80, 40); ctx.fill();
  ctx.fillStyle = C.Y; roundRect(W / 2 + 15, 1215, 370, 80, 40); ctx.fill();
  ctx.restore();
  text('A PARTIR DE R$150', W / 2 - 200, 1267, 34, C.K, { align: 'center', alpha: r });
  text('PRONTO EM 24H*', W / 2 + 200, 1267, 34, C.K, { align: 'center', alpha: r });
  text('ANÚNCIO · REELS · STORIES · WHATSAPP', W / 2, 1350, 28, '#8A8D95', { align: 'center', weight: 600, alpha: r });
}
