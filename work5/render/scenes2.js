// Anúncio Alessandra Mendes v3 — cenas 4 a 7
// 4. SONHO — a mesma ilustração com a pele mais uniforme (manchas suavizando)
function scene4(t) {
  bg(C.K);
  lightLeak(t, 0.3);
  particles(t, C.GOLD, 40, 0.35);
  serif('imagina se olhar no espelho...', W / 2, 330, 62, C.NUDE, { align: 'center', alpha: easeOut(prog(t, T.s4, 0.35)) });
  const clear = easeInOut(prog(t, 12.2, 1.6));
  // espelho oval dourado
  ctx.save(); ctx.strokeStyle = C.GOLD; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.ellipse(W / 2, 860, 330, 420, 0, 0, 7); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W / 2, 860, 350, 440, 0, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(W / 2, 860, 326, 416, 0, 0, 7); ctx.clip();
  ctx.fillStyle = '#2A201D'; ctx.fillRect(0, 0, W, H);
  faceIllustration(W / 2, 900, 1.05, t, 1 - clear * 0.85, { glowSkin: clear });
  // reflexo do espelho passando
  const sx = lerp(-200, W + 200, prog(t, 12.4, 1.4));
  const sg = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.22)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (clear > 0.5) { sparkle(700, 620, 1.1, t, C.WH); sparkle(380, 1080, 0.8, t + 1, C.WH); }
  const a = easeOutBack(prog(t, 12.4, 0.32));
  ctx.save(); ctx.translate(W / 2, 1385); ctx.scale(clamp(a), clamp(a));
  text('PELE MAIS UNIFORME', 0, 0, 70, C.GOLD, { align: 'center' });
  ctx.restore();
  text('sem precisar esconder nada', W / 2, 1455, 42, C.WH, { align: 'center', weight: 600, alpha: easeOut(prog(t, 13.85, 0.3)) });
  text('imagem ilustrativa · resultados variam', W / 2, 1310, 26, C.G, { align: 'center', weight: 500 });
}

// 5. SOLUÇÃO — retrato (foto de perfil), dia 19, de Brasília, Setor Marista
function scene5(t) {
  bg(C.K);
  lightLeak(t, 0.2);
  const lt = t - T.s5;
  // retrato grande à esquerda com zoom lento
  const f = easeOut(prog(lt, 0, 0.6));
  ctx.save(); ctx.globalAlpha = f; ctx.translate((1 - f) * -80, 0);
  const z = 1 - 0.08 * prog(lt, 0, 6);
  const cw = 900 * z, ch = 1300 * z;
  photoCard(FOTO_PERFIL, 330, 760, 460, 820, [560 - cw * 0.36 - 40, 640 - ch * 0.42, cw * 0.72, ch * 0.9], 28);
  ctx.restore();
  // coluna de informações à direita
  const d = easeOutBack(prog(t, 16.2, 0.35));
  ctx.save(); ctx.translate(770, 470); ctx.scale(clamp(d), clamp(d));
  text('DIA', 0, -95, 46, C.NUDE, { align: 'center' });
  text('19', 0, 60, 200, C.GOLD, { align: 'center' });
  ctx.restore();
  goldRule(770, 560, 220, t, 16.5);
  serif('direto de', 770, 660, 48, C.NUDE, { align: 'center', alpha: easeOut(prog(t, 18.4, 0.3)) });
  text('BRASÍLIA', 770, 730, 64, C.WH, { align: 'center', alpha: easeOut(prog(t, 18.45, 0.3)) });
  // rota mini
  const r = prog(t, 18.6, 1.0);
  if (r > 0) {
    ctx.save(); ctx.strokeStyle = C.GOLD; ctx.lineWidth = 4; ctx.setLineDash([3, 12]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(770, 760); ctx.lineTo(770, 760 + 120 * easeOut(r)); ctx.stroke(); ctx.restore();
    if (r > 0.8) { ctx.fillStyle = C.GOLD; ctx.beginPath(); ctx.arc(770, 880, 12, 0, 7); ctx.fill(); }
  }
  text('GOIÂNIA', 770, 945, 64, C.GOLD, { align: 'center', alpha: easeOut(prog(t, 19.2, 0.3)) });
  // nome
  const n = easeOut(prog(t, 17.0, 0.4));
  serif('Alessandra Mendes', W / 2, 1290 + (1 - n) * 30, 100, C.WH, { align: 'center', alpha: n });
  pill('TRATAMENTO DE MELASMA', W / 2, 1405, 40, C.GOLD, C.K, t, 19.65);
  text('Setor Marista', W / 2, 1490, 40, C.NUDE, { align: 'center', weight: 600, alpha: easeOut(prog(t, 21.0, 0.3)) });
}

// 6. OBJEÇÃO — preço: de R$697 por R$285 (o desconto é o presente)
function scene6(t) {
  bg(C.CREAM);
  serif('e não precisa pagar', W / 2, 380, 62, C.ROSE, { align: 'center', alpha: easeOut(prog(t, 22.3, 0.3)) });
  const d = easeOutBack(prog(t, 23.4, 0.3));
  if (d > 0) {
    ctx.save(); ctx.translate(W / 2, 555); ctx.scale(clamp(d), clamp(d));
    text('R$697', 0, 0, 160, C.G, { align: 'center' });
    const s = easeOut(prog(t, 25.15, 0.2));
    if (s > 0) { const w = measure('R$697', 160); ctx.fillStyle = C.ROSE; ctx.save(); ctx.rotate(-0.08); roundRect(-w / 2 - 20, -68, (w + 40) * s, 16, 8); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  text('NESSE DIA, SAI POR', W / 2, 760, 58, C.INK, { align: 'center', alpha: easeOut(prog(t, 25.15, 0.3)) });
  const p = easeOutBack(prog(t, 26.2, 0.35));
  if (p > 0) {
    ctx.save(); ctx.translate(W / 2, 1010); ctx.scale(p * (1 + 0.025 * Math.sin(t * 5)), p * (1 + 0.025 * Math.sin(t * 5)));
    ctx.fillStyle = C.K; roundRect(-380, -180, 760, 280, 44); ctx.fill();
    ctx.strokeStyle = C.GOLD; ctx.lineWidth = 3; roundRect(-366, -166, 732, 252, 36); ctx.stroke();
    text('R$285', 0, 45, 228, C.GOLD, { align: 'center' });
    ctx.restore();
  }
  burst(t, 26.28, W / 2, 960, C.GOLD2, 40, 600);
  const e = easeOutBack(prog(t, 27.2, 0.32));
  if (e > 0) {
    ctx.save(); ctx.translate(W / 2, 1290); ctx.rotate(-0.02); ctx.scale(e, e);
    ctx.fillStyle = C.ROSE; roundRect(-330, -46, 660, 92, 46); ctx.fill();
    ctx.restore();
    text('MAIS DE 50% OFF · SÓ DIA 19', W / 2, 1306, 40, C.WH, { align: 'center', alpha: clamp(e) });
  }
}

// 7. CONVITE com urgência — só 10 vagas + MELASMA no direct (foto sentada, única vez)
const CLICK7 = 31.17;
function scene7(t) {
  bg(C.K);
  lightLeak(t, 0.25);
  particles(t, C.GOLD, 45, 0.35);
  const s = easeOutBack(prog(t, 28.8, 0.3));
  ctx.save(); ctx.translate(W / 2, 400); ctx.scale(clamp(s) * (1 + 0.035 * Math.sin(t * 6)), clamp(s) * (1 + 0.035 * Math.sin(t * 6)));
  text('SÓ 10 VAGAS', 0, 0, 112, C.GOLD, { align: 'center' });
  ctx.restore();
  for (let i = 0; i < 10; i++) {
    const p = easeOutBack(prog(t, 29.1 + i * 0.05, 0.3));
    if (p <= 0) continue;
    ctx.save(); ctx.translate(184 + i * 79, 495); ctx.scale(p, p);
    ctx.strokeStyle = C.GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.stroke();
    ctx.fillStyle = C.GOLD; ctx.beginPath(); ctx.arc(0, -7, 9, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 16, 15, 10, 0, Math.PI, 0); ctx.fill();
    ctx.restore();
  }
  // foto sentada + nome
  const f = easeOut(prog(t, 28.5, 0.5));
  ctx.save(); ctx.globalAlpha = f;
  photoCard(FOTO_SENTADA, 270, 790, 300, 380, [110, 230, 640, 810], 24);
  ctx.restore();
  serif('Alessandra', 660, 740, 72, C.WH, { align: 'center', alpha: f });
  serif('Mendes', 660, 820, 72, C.WH, { align: 'center', alpha: f });
  text('@alessandramendes.x', 660, 890, 34, C.NUDE, { align: 'center', weight: 600, alpha: f });
  // botão
  const b = easeOutBack(prog(t, 30.35, 0.35));
  if (b > 0) {
    const pulse = 1 + 0.045 * Math.sin((t - 30.35) * 2 * Math.PI * 1.4) * (t > 31.4 ? 1 : 0);
    const press = t >= CLICK7 && t < CLICK7 + 0.15 ? 0.93 : 1;
    ctx.save(); ctx.translate(W / 2, 1115); ctx.scale(b * pulse * press, b * pulse * press);
    const gr = ctx.createLinearGradient(-390, 0, 390, 0);
    gr.addColorStop(0, '#F0D3A6'); gr.addColorStop(1, '#C9A06A');
    ctx.fillStyle = gr; roundRect(-390, -95, 780, 190, 95); ctx.fill();
    ctx.restore();
    text('MANDE "MELASMA"', W / 2, 1107, 58, C.K, { align: 'center', alpha: clamp(b) });
    text('NO DIRECT', W / 2, 1167, 42, '#5A4030', { align: 'center', alpha: clamp(b) });
  }
  const r = easeOut(prog(t, 32.0, 0.4));
  text('Tratamento de melasma  ·  de R$697 por R$285', W / 2, 1300, 36, C.GOLD, { align: 'center', weight: 700, alpha: r });
  text('Dia 19  ·  Setor Marista  ·  Goiânia', W / 2, 1360, 34, C.WH, { align: 'center', weight: 600, alpha: r });
}
