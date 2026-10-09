// Vídeo 3. Cenas 5 a 7: nichos, oferta e CTA
const NICHE3 = [
  { at: 13.95, key: 'burger', name: 'HAMBURGUERIA' },
  { at: 15.55, key: 'salon', name: 'SALÃO' },
  { at: 16.45, key: 'shop', name: 'LOJA' },
  { at: 17.1, key: 'pet', name: 'PET SHOP' },
];

// 5. Nichos — amarelo, carrossel de celulares; fecha em "QUALQUER NEGÓCIO"
function scene5(t) {
  bg(C.Y);
  dottedRing(W / 2, 1020, 420, 520, t, C.K, 0.15);
  const fan = t >= 18.1;
  if (!fan) {
    let i = 0; NICHE3.forEach((n, k) => { if (t >= n.at) i = k; });
    const n = NICHE3[i];
    const sw = easeOut(prog(t, Math.max(n.at, T.s5 + 0.01), 0.25));
    // título
    ctx.save(); ctx.translate(W / 2, 410); const ts = lerp(0.7, 1, easeOutBack(sw)); ctx.scale(ts, ts);
    const fs = Math.min(112, 112 * 760 / measure(n.name, 112));
    text(n.name, 0, 0, fs, C.K, { align: 'center', skew: -9, alpha: sw });
    ctx.restore();
    // celular anterior saindo pela esquerda, atual entrando pela direita (carrossel)
    if (i > 0 && sw < 1) {
      const pv = NICHE3[i - 1];
      phone(W / 2 - sw * 620, 1040, 440, 780, -0.15 * sw, adScreen(pv.key, t - pv.at), lerp(1, 0.75, sw));
    }
    phone(W / 2 + (1 - sw) * 620, 1040 + Math.sin(t * 2.2) * 10, 440, 780, 0.15 * (1 - sw) + Math.sin(t * 1.6) * 0.03,
      adScreen(n.key, t - n.at), lerp(0.75, 1, sw));
  } else {
    const g = easeOutBack(prog(t, 18.1, 0.3));
    ctx.save(); ctx.translate(W / 2, 380); ctx.scale(g, g);
    text('QUALQUER', 0, 0, 118, C.K, { align: 'center', alpha: clamp(g) });
    ctx.restore();
    const g2 = easeOutBack(prog(t, 18.65, 0.3));
    ctx.save(); ctx.translate(W / 2, 520); ctx.scale(g2, g2);
    stripWord('NEGÓCIO', 0, 0, 118, { align: 'center', stripColor: C.K, textColor: C.WH });
    ctx.restore();
    // leque com os 4 celulares
    const keys = ['pet', 'shop', 'salon', 'burger'];
    keys.forEach((k, i) => {
      const p = easeOutBack(prog(t, 18.1 + i * 0.07, 0.4));
      const ang = (i - 1.5) * 0.22 * clamp(p);
      const cx = W / 2 + (i - 1.5) * 150 * clamp(p);
      phone(cx, 1080 + Math.abs(i - 1.5) * 40, 300, 534, ang, adScreen(k, t - 18 + i), 0.8);
    });
  }
}

// 6. Oferta — preto, R$150 com explosão e 24h
function scene6(t) {
  bg(C.K);
  const lt = t - T.s6;
  glow(W / 2, 760, 600, 'rgba(255,212,0,0.6)', 0.35);
  particles(t, C.Y, 70, 0.5);
  dottedRing(W / 2, 760, 430, 300, t, C.Y, 0.3);
  const a = easeOut(prog(lt, 0, 0.2));
  text('A PARTIR DE', W / 2, 480, 84, C.WH, { align: 'center', alpha: a });
  const p = easeOutBack(prog(t, 20.45, 0.35));
  if (p > 0) {
    const k = p * (1 + 0.06 * Math.sin(t * 5) * prog(t, 21, 0.5));
    ctx.save(); ctx.translate(W / 2, 800); ctx.scale(k, k);
    text('R$150', 0, 0, 250, C.Y, { align: 'center', skew: -9 });
    ctx.restore();
  }
  burst(t, 20.53, W / 2, 700, C.Y, 44, 620);
  const q = easeOutBack(prog(t, 21.8, 0.3));
  if (q > 0) {
    ctx.save(); ctx.translate(W / 2, 1010); ctx.scale(q, q); ctx.rotate(-0.03);
    ctx.fillStyle = C.WH; roundRect(-330, -60, 660, 120, 60); ctx.fill();
    // relógio mini girando
    ctx.translate(-275, 0);
    ctx.strokeStyle = C.K; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 36, 0, 7); ctx.stroke();
    const sp = t * 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sp) * 24, Math.sin(sp) * 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke();
    ctx.restore();
    text('PRONTO EM ATÉ 24H*', W / 2 + 45, 1027, 48, C.K, { align: 'center', alpha: clamp(q) });
  }
  text('*a partir do briefing completo', W / 2, 1120, 32, '#8A8D95', { align: 'center', weight: 600, alpha: prog(t, 22.4, 0.3) });
  // riscos de velocidade passando
  const sp = prog(t, 22.6, 0.9);
  if (sp > 0 && sp < 1) speedLines(lerp(-900, W + 200, sp), 1240, 760, 30, C.Y, 62);
}

// 7. CTA — amarelo, logo oficial, botão com clique
const CLICK3 = 25.37;
function scene7(t) {
  bg(C.Y);
  const lt = t - T.s7;
  rays(W / 2, 1000, 1300, t * 0.5, C.WH, 0.18);
  const l = easeOutBack(prog(lt, 0, 0.35));
  ctx.save(); ctx.globalAlpha = clamp(l * 1.5);
  const s = lerp(0.85, 1, l); ctx.translate(W / 2, 420); ctx.scale(s, s); ctx.translate(-W / 2, -420);
  drawLogo(W / 2, 420, 600, 1, C.K);
  ctx.restore();
  text('CHAMA NO', W / 2, 720, 116, C.K, { align: 'center', alpha: easeOut(prog(t, 24.2, 0.2)) });
  const d = easeOutBack(prog(t, 24.75, 0.3));
  if (d > 0) {
    ctx.save(); ctx.translate(W / 2, 880); ctx.scale(d, d);
    stripWord('DIRECT', 0, 0, 160, { align: 'center', stripColor: C.K, textColor: C.WH });
    ctx.restore();
  }
  const b = easeOutBack(prog(t, 25.0, 0.3));
  if (b > 0) {
    const pulse = 1 + 0.05 * Math.sin((t - 25) * 2 * Math.PI * 1.6);
    const press = t >= CLICK3 && t < CLICK3 + 0.15 ? 0.92 : 1;
    const bw = 680, bh = 150, cy = 1110;
    const ring = ((t - 25) * 1.6) % 1;
    ctx.save(); ctx.translate(W / 2, cy); ctx.scale(b * pulse * press, b * pulse * press);
    ctx.strokeStyle = `rgba(16,18,22,${0.45 * (1 - ring)})`; ctx.lineWidth = 8;
    roundRect(-bw / 2 - ring * 50, -bh / 2 - ring * 50, bw + ring * 100, bh + ring * 100, 75 + ring * 50); ctx.stroke();
    ctx.fillStyle = C.K; roundRect(-bw / 2, -bh / 2, bw, bh, 75); ctx.fill();
    text('PEDIR MEU VÍDEO →', 0, 22, 58, C.WH, { align: 'center' });
    ctx.restore();
    const hp = prog(t, 25.05, 0.3), hx = W / 2 + 290, hy = cy + 40 + (1 - easeOut(hp)) * 220 + (t >= CLICK3 && t < CLICK3 + 0.15 ? 12 : 0);
    if (hp > 0) {
      ctx.save(); ctx.globalAlpha = clamp(hp * 2); ctx.translate(hx, hy); ctx.rotate(-0.3);
      ctx.fillStyle = C.WH; ctx.strokeStyle = C.K; ctx.lineWidth = 6;
      roundRect(-18, -60, 36, 90, 18); ctx.fill(); ctx.stroke();
      roundRect(-40, 0, 92, 80, 26); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    burst(t, CLICK3, W / 2 + 280, cy, C.K, 22, 280);
  }
  const r = easeOut(prog(t, 26.0, 0.35));
  text('A partir de R$150 · pronto em até 24h*', W / 2, 1270, 40, C.K, { align: 'center', weight: 700, alpha: r });
  text('*a partir do briefing completo', W / 2, 1330, 30, C.K, { align: 'center', weight: 600, alpha: r * 0.7 });
}
