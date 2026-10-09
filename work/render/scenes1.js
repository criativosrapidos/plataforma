// Cenas 1 a 3. Tempos em segundos, alinhados às palavras do take A.
const T = { s1: 0, s2: 2.85, s3: 8.0, s4: 10.4, s5: 15.4, s6: 21.4, s7: 24.4, end: 30 };

// 1. Gancho — quadro 0 já é a capa (todo o texto visível em t=0)
function scene1(t) {
  bg(C.K);
  const punch = 1 + 0.04 * Math.sin(clamp(t / 0.5) * Math.PI) + 0.03 * prog(t, 1.32, 1.4);
  ctx.save();
  ctx.translate(W / 2, 860); ctx.scale(punch, punch); ctx.translate(-W / 2, -860);
  text('Seu negócio', 110, 700, 104, C.WH);
  text('precisa de', 110, 815, 104, C.WH);
  const v = easeOutBack(prog(t, 1.25, 0.35));
  ctx.save();
  ctx.translate(110, 1010); ctx.scale(lerp(1, 1.05, v * (1 - prog(t, 1.6, 0.4))), lerp(1, 1.05, v * (1 - prog(t, 1.6, 0.4))));
  text('VÍDEOS?', 0, 0, 172, C.Y, { skew: -9 });
  ctx.restore();
  ctx.restore();
  // riscos de velocidade sutis ao lado
  speedLines(110, 1090, 220 + 80 * Math.sin(t * 3), 16, C.Y, 34);
}

// 2. Dor — palavras entram uma por fala e são riscadas
const PAIN = [
  { w: 'GRAVAR', at: 3.04, strike: 3.62 },
  { w: 'EDITAR', at: 4.0, strike: 4.58 },
  { w: 'POSTAR', at: 4.96, strike: 5.6 },
];
function scene2(t) {
  bg(C.OW);
  const lt = t;
  const shift = easeOut(prog(lt, 6.05, 0.35));
  PAIN.forEach((p, i) => {
    const a = easeOutBack(prog(lt, p.at - 0.06, 0.3));
    if (a <= 0) return;
    const y = 470 + i * 175 - shift * 90;
    const x = lerp(-500, 110, a);
    const size = 140;
    ctx.save(); ctx.globalAlpha = lerp(1, 0.35, shift);
    text(p.w, x, y, size, C.K);
    const s = easeOut(prog(lt, p.strike, 0.18));
    if (s > 0) {
      const w = measure(p.w, size);
      ctx.fillStyle = C.K;
      ctx.save(); ctx.translate(x - 16, y - size * 0.36); ctx.rotate(-0.05);
      roundRect(0, -9, (w + 32) * s, 18, 9); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  });
  // "Não cabe na sua rotina."
  const r = prog(lt, 6.12, 0.3);
  if (r > 0) {
    const yb = 1060;
    text('Não cabe na', 110, yb + (1 - easeOut(r)) * 60, 108, C.K, { alpha: r });
    text('sua', 110, yb + 140 + (1 - easeOut(r)) * 60, 108, C.K, { alpha: r });
    const sx = 110 + measure('sua ', 108);
    stripWord('ROTINA.', sx, yb + 140, 108, { reveal: easeOut(prog(lt, 7.15, 0.25)) });
  }
}

// 3. Virada — corte seco para o amarelo, riscos da logo atravessando a tela
function scene3(t) {
  const lt = t - T.s3;
  bg(C.Y);
  // riscos atravessando (passagens rápidas)
  for (let k = 0; k < 3; k++) {
    const p = prog(lt, k * 0.55, 0.9);
    if (p <= 0 || p >= 1) continue;
    const x = lerp(-900, W + 200, easeIn(p) * 0.6 + p * 0.4);
    speedLines(x, 330 + k * 410, 700, 30, C.K, 64);
  }
  const a = easeOut(prog(lt, 0.0, 0.25));
  text('A gente cria', 110, 840 + (1 - a) * 50, 120, C.K, { alpha: a });
  const b = easeOutBack(prog(t, 8.95, 0.3));
  ctx.save();
  ctx.translate(110, 1040);
  const sc = lerp(0.6, 1, b); ctx.scale(sc, sc);
  text('PRA VOCÊ.', 0, 0, 150, C.K, { skew: -9, alpha: clamp(b * 2) });
  ctx.restore();
}
