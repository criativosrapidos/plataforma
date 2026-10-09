// Vídeo 2 (pacotes). Cenas 1 a 4. Tempos em segundos, alinhados ao take 2 acelerado.
const T = { s1: 0, s2: 3.85, s3: 7.55, s4: 11.0, s5: 15.55, s6: 24.15, s7: 27.35, end: 30 };

// Celular genérico com conteúdo desenhado por `inner(x, y, w, h)`
function phone(cx, cy, w, h, rot, inner) {
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(14, 22, w + 28, h + 28, 64); ctx.fill();
  ctx.fillStyle = '#2A2D35'; roundRect(-14, -14, w + 28, h + 28, 64); ctx.fill();
  ctx.save(); roundRect(0, 0, w, h, 50); ctx.clip();
  inner(0, 0, w, h);
  ctx.restore();
  ctx.fillStyle = '#2A2D35'; roundRect(w / 2 - 60, -2, 120, 26, 13); ctx.fill();
  ctx.restore();
}

// Conteúdo de um "vídeo de exemplo" por nicho
function nicheScreen(n, label, t) {
  return (x, y, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, n.bg2); g.addColorStop(1, n.bg);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    text(label, 30, 110, 54, C.WH);
    n.draw(w / 2, h * 0.52, w / 430, t);
    ctx.fillStyle = C.WH; roundRect(30, h - 130, 210, 56, 28); ctx.fill();
    text('VEM CONFERIR', 135, h - 92, 26, C.K, { align: 'center' });
  };
}

// Miniatura da capa (meta: o próprio anúncio dentro do celular)
function coverScreen(x, y, w, h) {
  ctx.fillStyle = C.K; ctx.fillRect(0, 0, w, h);
  text('VÍDEO PRO SEU', w / 2, h * 0.33, 40, C.WH, { align: 'center' });
  text('NEGÓCIO', w / 2, h * 0.42, 64, C.WH, { align: 'center' });
  text('R$150', w / 2, h * 0.58, 120, C.Y, { align: 'center', skew: -9 });
  ctx.fillStyle = C.Y; roundRect(w / 2 - 150, h * 0.64, 300, 50, 25); ctx.fill();
  text('PRONTO EM ATÉ 24H', w / 2, h * 0.64 + 34, 26, C.K, { align: 'center' });
}

// 1. Capa / gancho — quadro 0 já é a capa
function sceneA1(t) {
  bg(C.K);
  glow(W / 2, 980, 620, 'rgba(255,212,0,0.55)', 0.35 + 0.1 * Math.sin(t * 3));
  particles(t, C.Y, 70, 0.5);
  dottedRing(W / 2, 960, 470, 330, t, C.Y, 0.35);
  text('VÍDEO PRO SEU', W / 2, 560, 92, C.WH, { align: 'center' });
  text('NEGÓCIO', W / 2, 720, 170, C.WH, { align: 'center' });
  const p = easeOutBack(prog(t, 1.85, 0.3));
  text('POR APENAS', W / 2, 840, 64, C.Y, { align: 'center', alpha: 0.4 + 0.6 * clamp(p) });
  // preço gigante — visível desde o quadro 0 (capa), com impacto ao ser falado
  const k = 1 + 0.12 * Math.sin(prog(t, 2.4, 0.35) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 1110); ctx.scale(k, k);
  text('R$150', 0, 0, 290, C.Y, { align: 'center', skew: -9 });
  ctx.restore();
  burst(t, 2.4, W / 2, 1010, C.Y, 36, 560);
  // pílula
  ctx.save(); ctx.translate(W / 2, 1235); ctx.rotate(-0.05);
  ctx.fillStyle = C.WH; roundRect(-300, -46, 600, 92, 46); ctx.fill();
  ctx.restore();
  text('PRONTO EM ATÉ 24H*', W / 2, 1252, 46, C.K, { align: 'center' });
  text('*a partir do briefing completo', W / 2, 1335, 30, '#9A9DA5', { align: 'center', weight: 600 });
}

// 2. Objeção — preço e prazo de mercado riscados
const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
function sceneA2(t) {
  bg(C.K);
  particles(t, C.Y, 40, 0.35);
  const lt = t - T.s2;
  // celular com a capa ao fundo, flutuando
  const pe = easeOutBack(prog(lt, 0, 0.45));
  ctx.save(); ctx.globalAlpha = 0.95;
  phone(W / 2, 1010 + (1 - pe) * 400 + Math.sin(t * 2) * 10, 380, 680, Math.sin(t * 1.5) * 0.04, coverScreen);
  ctx.restore();
  dottedRing(W / 2, 1010, 300, 420, t, C.Y, 0.25);
  const first = t < 6.1;
  if (first) {
    text('NÃO PRECISA CUSTAR', W / 2, 400, 74, C.WH, { align: 'center' });
    const m = easeOutBack(prog(t, 4.95, 0.3));
    ctx.save(); ctx.translate(W / 2, 510); ctx.scale(m, m);
    text('MAIS DE R$1.000', 0, 0, 104, C.Y, { align: 'center', skew: -9 });
    if (t > 5.9) {
      const s = easeOut(prog(t, 5.9, 0.18)); const w = measure('MAIS DE R$1.000', 104);
      ctx.fillStyle = C.WH; roundRect(-w / 2 - 10, -46, (w + 20) * s, 14, 7); ctx.fill();
    }
    ctx.restore();
    sticker('R$1.000+', 760, 760, 56, t, 5.26, { rot: 0.2, struck: 5.9 });
  } else {
    text('NEM DEMORAR', W / 2, 400, 84, C.WH, { align: 'center' });
    const m = easeOutBack(prog(t, 6.75, 0.3));
    ctx.save(); ctx.translate(W / 2, 520); ctx.scale(m, m);
    text('1 SEMANA', 0, 0, 130, C.Y, { align: 'center', skew: -9 });
    if (t > 7.2) {
      const s = easeOut(prog(t, 7.2, 0.18)); const w = measure('1 SEMANA', 130);
      ctx.fillStyle = C.WH; roundRect(-w / 2 - 10, -56, (w + 20) * s, 16, 8); ctx.fill();
    }
    ctx.restore();
    // calendário passando os dias
    const di = Math.min(5, Math.floor(prog(t, 6.3, 0.85) * 6));
    const cp = easeOutBack(prog(t, 6.2, 0.3));
    if (cp > 0) {
      ctx.save(); ctx.translate(300, 800); ctx.rotate(-0.16); ctx.scale(cp, cp);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(-118, -98, 248, 220, 22); ctx.fill();
      ctx.fillStyle = C.WH; roundRect(-124, -110, 248, 220, 22); ctx.fill();
      ctx.fillStyle = C.Y; roundRect(-124, -110, 248, 62, 22); ctx.fill(); ctx.fillRect(-124, -70, 248, 22);
      text('1 SEMANA', 0, -66, 34, C.K, { align: 'center' });
      text(DAYS[di], 0, 70, 96, C.K, { align: 'center' });
      if (t > 7.2) { ctx.strokeStyle = C.K; ctx.lineWidth = 14; ctx.lineCap = 'round'; const s = easeOut(prog(t, 7.2, 0.2));
        ctx.beginPath(); ctx.moveTo(-90, -40); ctx.lineTo(-90 + 180 * s, -40 + 150 * s); ctx.stroke(); }
      ctx.restore();
    }
  }
}

// 3. Usos — fundo amarelo, celular girando e chips empilhando
function sceneA3(t) {
  bg(C.Y);
  const lt = t - T.s3;
  dottedRing(W / 2, 1060, 360, 470, t, C.K, 0.18);
  // riscos da marca passando no fundo
  for (let k = 0; k < 2; k++) {
    const p = prog(lt, 0.2 + k * 1.4, 1.1);
    if (p > 0 && p < 1) speedLines(lerp(-800, W + 100, p), 1440 + k * 0, 600, 24, 'rgba(16,18,22,0.25)', 50);
  }
  const pe = easeOutBack(prog(lt, 0, 0.4));
  phone(W / 2, 1060 + (1 - pe) * 500 + Math.sin(t * 2.2) * 12, 400, 700, Math.sin(t * 1.7) * 0.06 + (1 - pe) * 0.4,
    nicheScreen(NICHES[2], 'COLEÇÃO NOVA', lt));
  chip('USAR COMO ANÚNCIO', W / 2, 330, t, 8.1);
  chip('POSTAR NO INSTAGRAM', W / 2, 440, t, 9.35);
  chip('MANDAR NO WHATSAPP', W / 2, 550, t, 10.45);
  // corações subindo
  for (let i = 0; i < 6; i++) {
    const p = prog(lt, 0.8 + i * 0.45, 1.4);
    if (p <= 0 || p >= 1) continue;
    ctx.save(); ctx.globalAlpha = 1 - p; ctx.fillStyle = C.WH;
    const x = 780 + Math.sin(i * 2 + p * 6) * 30, y = 1150 - p * 420;
    ctx.translate(x, y); ctx.scale(1.4, 1.4);
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.bezierCurveTo(-24, -8, -12, -26, 0, -12); ctx.bezierCurveTo(12, -26, 24, -8, 0, 10); ctx.fill();
    ctx.restore();
  }
}

// 4. Nichos — fundo claro, títulos trocando e grade final
const NICHE_SEQ = [
  { at: 11.0, title: 'LOJA DE ROUPA', n: 2, label: 'COLEÇÃO NOVA' },
  { at: 12.05, title: 'HAMBURGUERIA', n: 0, label: 'COMBO DO DIA' },
  { at: 13.0, title: 'SALÃO DE BELEZA', n: 1, label: 'ESCOVA +' },
];
function sceneA4(t) {
  bg(C.OW);
  const grid = t >= 14.15;
  if (!grid) {
    let i = 0; NICHE_SEQ.forEach((s, k) => { if (t >= s.at) i = k; });
    const s = NICHE_SEQ[i];
    const sw = easeOut(prog(t, s.at, 0.28));
    text(s.title, W / 2 + (1 - sw) * 300, 420, 92, C.K, { align: 'center', alpha: sw });
    ctx.fillStyle = C.K; roundRect(W / 2 - 70, 450, 140 * sw, 12, 6); ctx.fill();
    if (i > 0 && sw < 1) {
      const pv = NICHE_SEQ[i - 1];
      phone(W / 2 - sw * 900, 1000, 400, 700, -0.1 * sw, nicheScreen(NICHES[pv.n], pv.label, t));
    }
    phone(W / 2 + (1 - sw) * 900, 1000 + Math.sin(t * 2) * 10, 400, 700, 0.1 * (1 - sw) + Math.sin(t * 1.6) * 0.04,
      nicheScreen(NICHES[s.n], s.label, t - s.at));
  } else {
    const g = easeOut(prog(t, 14.15, 0.3));
    text('QUALQUER', W / 2, 400, 110, C.K, { align: 'center', alpha: g });
    stripWord('NEGÓCIO', W / 2, 525, 110, { align: 'center', reveal: easeOut(prog(t, 14.85, 0.25)) });
    const labels = ['PIZZA', 'BANHO & TOSA', 'PLANO NOVO', 'COLEÇÃO', 'ESCOVA', 'BOLO DE POTE', 'TÊNIS', 'COMBO', 'AÇAÍ'];
    const cols = ['#2E7D4F', '#4BA3D9', '#2A2D35', '#D9779A', '#E8B4A4', '#F2B5C8', '#E8572A', '#6B1F2A', '#6A3FA0'];
    for (let i = 0; i < 9; i++) {
      const r = Math.floor(i / 3), c = i % 3;
      const p = easeOutBack(prog(t, 14.25 + i * 0.05, 0.35));
      if (p <= 0) continue;
      const cx = 290 + c * 250, cy = 790 + r * 250;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p); ctx.rotate(Math.sin(t * 2 + i) * 0.04);
      ctx.fillStyle = '#2A2D35'; roundRect(-82, -112, 164, 224, 22); ctx.fill();
      ctx.fillStyle = cols[i]; roundRect(-74, -104, 148, 208, 16); ctx.fill();
      text(labels[i], 0, -50, 22, C.WH, { align: 'center' });
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(0, 20, 30, 0, 7); ctx.fill();
      ctx.restore();
    }
  }
}
