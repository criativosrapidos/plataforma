// Anúncio Araujo Security — para quem já tem seguro. Tempos = take 1 + 0,30s.
const T = { s1: 0, s2: 2.95, s3: 5.95, s4: 12.75, s5: 14.35, s6: 18.4, s7: 23.15, end: 30 };

function shield(cx, cy, s, fill, check, checkP = 1) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.moveTo(0, -120); ctx.quadraticCurveTo(70, -95, 100, -95); ctx.quadraticCurveTo(110, 40, 0, 120);
  ctx.quadraticCurveTo(-110, 40, -100, -95); ctx.quadraticCurveTo(-70, -95, 0, -120); ctx.closePath(); ctx.fill();
  if (check && checkP > 0) {
    ctx.strokeStyle = check; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-42, 0);
    const p1 = clamp(checkP * 2), p2 = clamp(checkP * 2 - 1);
    ctx.lineTo(-42 + 30 * p1, 30 * p1);
    if (p2 > 0) ctx.lineTo(-12 + 62 * p2, 30 - 75 * p2);
    ctx.stroke();
  }
  ctx.restore();
}

// Apólice (documento) com linhas de cobertura
function policyDoc(cx, cy, w, rot, t, opts = {}) {
  const { rows = [], scanAt = null, stampAt = null } = opts;
  const h = w * 1.3;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; roundRect(-w / 2 + 12, -h / 2 + 18, w, h, 18); ctx.fill();
  ctx.fillStyle = C.WH; roundRect(-w / 2, -h / 2, w, h, 18); ctx.fill();
  ctx.fillStyle = C.CU; roundRect(-w / 2, -h / 2, w, 90, 18); ctx.fill(); ctx.fillRect(-w / 2, -h / 2 + 60, w, 30);
  text('APÓLICE DE SEGURO', -w / 2 + 34, -h / 2 + 60, 34, C.WH);
  rows.forEach((r, i) => {
    const y = -h / 2 + 160 + i * 92;
    const p = r.at === undefined ? 1 : easeOut(prog(t, r.at, 0.25));
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha = p;
    ctx.fillStyle = '#E9E1DA'; roundRect(-w / 2 + 34, y - 26, w - 68, 60, 12); ctx.fill();
    text(r.label, -w / 2 + 56, y + 14, 30, C.BR, { weight: 700 });
    if (r.ok === true) { ctx.strokeStyle = '#2E8B57'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w / 2 - 92, y + 2); ctx.lineTo(w / 2 - 80, y + 14); ctx.lineTo(w / 2 - 58, y - 10); ctx.stroke(); }
    if (r.ok === false) { ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w / 2 - 90, y - 12); ctx.lineTo(w / 2 - 62, y + 16); ctx.moveTo(w / 2 - 62, y - 12); ctx.lineTo(w / 2 - 90, y + 16); ctx.stroke(); }
    if (r.ok === null) { for (let k = 0; k < 3; k++) { ctx.fillStyle = '#B9ADA4'; ctx.beginPath(); ctx.arc(w / 2 - 96 + k * 18, y + 2, 5, 0, 7); ctx.fill(); } }
    ctx.restore();
  });
  // lupa varrendo
  if (scanAt !== null && t >= scanAt) {
    const sp = (t - scanAt) * 0.9;
    const lx = Math.sin(sp * 2.2) * w * 0.28, ly = -h / 2 + 200 + ((sp * 160) % (h - 260));
    ctx.save(); ctx.translate(lx + 40, ly);
    ctx.strokeStyle = C.K; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, 0, 54, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(184,105,42,0.18)'; ctx.beginPath(); ctx.arc(0, 0, 48, 0, 7); ctx.fill();
    ctx.lineCap = 'round'; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(86, 86); ctx.stroke();
    ctx.restore();
  }
  // carimbo "NÃO COBERTO"
  if (stampAt !== null && t >= stampAt) {
    const sp = easeOutBack(prog(t, stampAt, 0.25));
    ctx.save(); ctx.translate(0, h * 0.18); ctx.rotate(-0.22); ctx.scale(lerp(2.2, 1, clamp(sp)), lerp(2.2, 1, clamp(sp)));
    ctx.globalAlpha = clamp(sp * 1.5);
    ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 10; roundRect(-200, -56, 400, 112, 14); ctx.stroke();
    text('NÃO COBERTO', 0, 20, 56, '#C0392B', { align: 'center' });
    ctx.restore();
  }
  ctx.restore();
}

// 1. Gancho — creme, "VOCÊ JÁ TEM SEGURO?" (quadro 0 já é a capa)
function scene1(t) {
  bg(C.OW);
  glow(W / 2, 1100, 600, 'rgba(217,160,102,0.6)', 0.35);
  drawLogo(W / 2, 300, 300, 1, 'marrom');
  text('VOCÊ JÁ TEM', W / 2, 560, 112, C.BR, { align: 'center' });
  const k = 1 + 0.06 * Math.sin(prog(t, 1.06, 0.35) * Math.PI);
  ctx.save(); ctx.translate(W / 2, 700); ctx.scale(k, k);
  text('SEGURO?', 0, 0, 150, C.CU, { align: 'center' });
  ctx.restore();
  const f = Math.sin(t * 2) * 10;
  shield(W / 2, 1060 + f, 1.7, C.CU, C.WH, 1);
  // pontos de interrogação flutuando
  ['?', '?', '?'].forEach((q, i) => {
    const p = prog(t, 1.9 + i * 0.25, 0.4);
    if (p <= 0) return;
    const x = [300, 790, 820][i], y = [960, 920, 1210][i] + Math.sin(t * 3 + i) * 12;
    ctx.save(); ctx.globalAlpha = clamp(p * 2) * 0.9;
    text(q, x, y, 120, C.BR, { align: 'center', skew: -9 * (i % 2 ? -1 : 1) });
    ctx.restore();
  });
  text('Proteção financeira', W / 2, 1370, 40, C.G, { align: 'center', weight: 600 });
}

// 2. "Você sabe exatamente o que ele cobre?" — marrom, apólice com lupa
function scene2(t) {
  bg(C.K);
  particles(t, C.CU2, 30, 0.25);
  const lt = t - T.s2;
  text('VOCÊ SABE EXATAMENTE', W / 2, 360, 66, C.WH, { align: 'center', alpha: easeOut(prog(lt, 0, 0.25)) });
  const q = easeOutBack(prog(t, 5.2, 0.3));
  ctx.save(); ctx.translate(W / 2, 480); ctx.scale(lerp(0.8, 1, clamp(q)), lerp(0.8, 1, clamp(q)));
  text('O QUE ELE COBRE?', 0, 0, 96, C.CU2, { align: 'center', alpha: clamp(q * 2) });
  ctx.restore();
  const e = easeOutBack(prog(lt, 0.05, 0.45));
  policyDoc(W / 2, 1000 + (1 - e) * 600, 560, -0.04 + Math.sin(t * 1.4) * 0.02, t, {
    rows: [{ label: 'Cobertura básica', ok: null }, { label: 'Assistências', ok: null }, { label: 'Doenças graves', ok: null }, { label: 'Invalidez', ok: null }],
    scanAt: 3.3,
  });
}

// 3. Dor — paga todo mês e só descobre na hora que precisa
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
function scene3(t) {
  bg(C.K);
  const lt = t - T.s3;
  particles(t, C.CU2, 25, 0.2);
  if (t < 8.5) {
    text('MUITA GENTE', W / 2, 380, 84, C.WH, { align: 'center', alpha: easeOut(prog(lt, 0, 0.25)) });
    const p = easeOutBack(prog(t, 7.0, 0.3));
    ctx.save(); ctx.translate(W / 2, 500); ctx.scale(clamp(p), clamp(p));
    text('PAGA TODO MÊS', 0, 0, 92, C.CU2, { align: 'center' });
    ctx.restore();
    // calendário: meses marcados como pagos
    const n = Math.floor(prog(t, 6.6, 1.7) * 12);
    for (let i = 0; i < 12; i++) {
      const r = Math.floor(i / 4), c = i % 4;
      const x = 210 + c * 200, y = 760 + r * 210;
      const pop = easeOutBack(prog(t, 6.3 + i * 0.03, 0.3));
      ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
      ctx.fillStyle = i < n ? C.CU : '#3D3029'; roundRect(-85, -80, 170, 160, 20); ctx.fill();
      text(MONTHS[i], 0, -22, 40, C.WH, { align: 'center' });
      if (i < n) { ctx.strokeStyle = C.WH; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-22, 30); ctx.lineTo(-6, 46); ctx.lineTo(24, 14); ctx.stroke(); }
      else text('R$ ···', 0, 40, 34, '#8C7B70', { align: 'center' });
      ctx.restore();
    }
  } else {
    text('...E SÓ DESCOBRE', W / 2, 360, 82, C.WH, { align: 'center', alpha: easeOut(prog(t, 8.55, 0.25)) });
    const h = easeOutBack(prog(t, 10.82, 0.3));
    ctx.save(); ctx.translate(W / 2, 480); ctx.scale(clamp(h), clamp(h));
    text('NA HORA QUE PRECISA', 0, 0, 78, C.CU2, { align: 'center' });
    ctx.restore();
    const e = easeOutBack(prog(t, 8.55, 0.4));
    ctx.save(); ctx.translate(W / 2, 1010); ctx.scale(lerp(0.8, 1, clamp(e)), lerp(0.8, 1, clamp(e)));
    policyDoc(0, 0, 580, 0.03, t, {
      rows: [
        { label: 'Cobertura básica', ok: true, at: 8.8 },
        { label: 'Assistências', ok: true, at: 9.05 },
        { label: 'Doenças graves', ok: false, at: 9.5 },
        { label: 'Invalidez', ok: false, at: 9.75 },
      ],
      stampAt: 9.98,
    });
    ctx.restore();
    // tremor vermelho sutil no carimbo
    const fl = 1 - prog(t, 9.98, 0.4);
    if (t > 9.98 && fl > 0) { ctx.save(); ctx.globalAlpha = fl * 0.18; ctx.fillStyle = '#C0392B'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
}

// 4. Marca — cobre com logo grande
function scene4(t) {
  const lt = t - T.s4;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#B8692A'); g.addColorStop(0.5, '#D49A5E'); g.addColorStop(1, '#B8692A');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // brilho passando
  const sx = lerp(-600, W + 600, prog(lt, 0.1, 1.2));
  const sg = ctx.createLinearGradient(sx - 200, 0, sx + 200, 0);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.25)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
  const p = easeOutBack(prog(lt, 0, 0.45));
  ctx.save(); ctx.translate(W / 2, 880); ctx.scale(lerp(0.85, 1, clamp(p)), lerp(0.85, 1, clamp(p)));
  drawLogo(0, 0, 700, clamp(p * 1.5), 'branca');
  ctx.restore();
  text('Taynah Araujo  |  Proteção financeira', W / 2, 1090, 42, C.WH, { align: 'center', weight: 600, alpha: easeOut(prog(lt, 0.35, 0.3)) });
}
