// Anúncio Araujo Security — cenas 5 a 7
const STEPS4 = [
  { n: '1', t1: 'ANALISA', t2: 'SUA APÓLICE', at: 14.4 },
  { n: '2', t1: 'COMPARA COM AS', t2: 'PRINCIPAIS SEGURADORAS', at: 15.78 },
  { n: '3', t1: 'MOSTRA COMO TER', t2: 'MAIS PROTEÇÃO', at: 18.5 },
];

// 5. Método — creme, passos 1 e 2 com comparação entre seguradoras
function scene5(t) {
  bg(C.OW);
  text('COMO A GENTE TRABALHA', W / 2, 330, 52, C.CU, { align: 'center', alpha: easeOut(prog(t, T.s5, 0.25)) });
  STEPS4.slice(0, 2).forEach((s, i) => {
    const p = easeOutBack(prog(t, s.at - 0.05, 0.35));
    if (p <= 0) return;
    const y = 470 + i * 200, x = lerp(-300, 110, clamp(p));
    ctx.fillStyle = C.CU; ctx.beginPath(); ctx.arc(x + 60, y + 30, 60, 0, 7); ctx.fill();
    text(s.n, x + 60, y + 58, 76, C.WH, { align: 'center' });
    text(s.t1, x + 150, y + 18, 50, C.BR);
    text(s.t2, x + 150, y + 76, 50, C.BR);
  });
  // cartões de seguradoras (genéricos, sem marcas) sendo comparados
  const cp = prog(t, 16.0, 0.4);
  if (cp > 0) {
    const names = ['Seguradora A', 'Seguradora B', 'Seguradora C'];
    const best = 1;
    names.forEach((nm, i) => {
      const pop = easeOutBack(prog(t, 16.0 + i * 0.12, 0.35));
      const x = 230 + i * 300, y = 1150;
      const hl = i === best ? easeOut(prog(t, 17.3, 0.3)) : 0;
      ctx.save(); ctx.translate(x, y - hl * 24); ctx.scale(pop * (1 + 0.06 * hl), pop * (1 + 0.06 * hl));
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; roundRect(-114, -158, 236, 330, 22); ctx.fill();
      ctx.fillStyle = hl > 0.5 ? C.CU : C.WH; roundRect(-118, -170, 236, 330, 22); ctx.fill();
      const fg = hl > 0.5 ? C.WH : C.BR;
      text(nm, 0, -110, 28, fg, { align: 'center' });
      // barras de cobertura (sem números)
      const lv = [[0.5, 0.6, 0.35], [0.9, 0.85, 0.95], [0.65, 0.4, 0.55]][i];
      lv.forEach((v, k) => {
        const bw = 180 * v * easeOut(prog(t, 16.3 + i * 0.12 + k * 0.08, 0.4));
        ctx.fillStyle = hl > 0.5 ? 'rgba(255,255,255,0.3)' : '#E9E1DA'; roundRect(-90, -60 + k * 60, 180, 26, 13); ctx.fill();
        ctx.fillStyle = hl > 0.5 ? C.WH : C.CU2; roundRect(-90, -60 + k * 60, bw, 26, 13); ctx.fill();
      });
      if (hl > 0.5) text('MELHOR PRA VOCÊ', 0, 140, 24, C.WH, { align: 'center' });
      ctx.restore();
    });
  }
}

// 6. Mais proteção, às vezes pagando menos — comparação antes/depois (sem números)
function scene6(t) {
  bg(C.OW);
  const s = STEPS4[2];
  const p = easeOutBack(prog(t, s.at - 0.05, 0.35));
  const x = lerp(-300, 110, clamp(p)), y = 330;
  ctx.fillStyle = C.CU; ctx.beginPath(); ctx.arc(x + 60, y + 30, 60, 0, 7); ctx.fill();
  text(s.n, x + 60, y + 58, 76, C.WH, { align: 'center' });
  text(s.t1, x + 150, y + 18, 50, C.BR);
  text(s.t2, x + 150, y + 76, 50, C.CU);
  const cols = [
    { title: 'HOJE', cov: 0.45, price: 0.8, at: 18.9, color: '#B9ADA4' },
    { title: 'COM A ARAUJO', cov: 0.95, price: 0.7, at: 19.5, color: C.CU },
  ];
  cols.forEach((c, i) => {
    const pop = easeOutBack(prog(t, c.at, 0.35));
    if (pop <= 0) return;
    const cx = 310 + i * 440, cy = 920;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
    ctx.fillStyle = i ? C.K : C.WH; roundRect(-180, -300, 360, 600, 30); ctx.fill();
    const fg = i ? C.WH : C.BR;
    text(c.title, 0, -230, 36, i ? C.CU2 : C.G, { align: 'center' });
    shield(0, -95, 0.62, i ? C.CU : '#D8CEC6', i ? C.WH : null);
    text('Proteção', -150, 50, 32, fg, { weight: 700 });
    ctx.fillStyle = i ? '#3D3029' : '#EFE8E2'; roundRect(-150, 70, 300, 30, 15); ctx.fill();
    ctx.fillStyle = c.color; roundRect(-150, 70, 300 * c.cov * easeOut(prog(t, c.at + 0.2, 0.6)), 30, 15); ctx.fill();
    text('Mensalidade', -150, 170, 32, fg, { weight: 700 });
    // às vezes menor: a barra do lado Araujo encolhe em "pagando menos"
    const pm = i ? lerp(0.8, c.price, easeOut(prog(t, 21.9, 0.5))) : c.price;
    ctx.fillStyle = i ? '#3D3029' : '#EFE8E2'; roundRect(-150, 190, 300, 30, 15); ctx.fill();
    ctx.fillStyle = i ? C.CU2 : '#B9ADA4'; roundRect(-150, 190, 300 * pm * easeOut(prog(t, c.at + 0.2, 0.6)), 30, 15); ctx.fill();
    ctx.restore();
  });
  const m = easeOutBack(prog(t, 20.8, 0.35));
  if (m > 0) {
    ctx.save(); ctx.translate(W / 2, 1335); ctx.scale(m, m); ctx.rotate(-0.02);
    ctx.fillStyle = C.CU; roundRect(-370, -52, 740, 104, 52); ctx.fill();
    ctx.restore();
    text('ÀS VEZES ATÉ PAGANDO MENOS', W / 2, 1352, 44, C.WH, { align: 'center', alpha: clamp(m) });
  }
}

// 7. CTA — marrom, "mande sua apólice no WhatsApp"
function scene7(t) {
  bg(C.K);
  const lt = t - T.s7;
  glow(W / 2, 900, 600, 'rgba(184,105,42,0.6)', 0.35);
  particles(t, C.CU2, 30, 0.25);
  text('MANDE SUA APÓLICE', W / 2, 330, 80, C.WH, { align: 'center', alpha: easeOut(prog(lt, 0, 0.25)) });
  const w = easeOutBack(prog(t, 24.15, 0.3));
  ctx.save(); ctx.translate(W / 2, 445); ctx.scale(clamp(w), clamp(w));
  text('NO WHATSAPP', 0, 0, 92, C.CU2, { align: 'center' });
  ctx.restore();
  // conversa: arquivo da apólice sendo enviado
  const b1 = easeOutBack(prog(t, 23.6, 0.35));
  if (b1 > 0) {
    ctx.save(); ctx.translate(640, 680); ctx.scale(b1, b1);
    ctx.fillStyle = '#5A4234'; roundRect(-260, -80, 520, 160, 28); ctx.fill();
    ctx.fillStyle = C.WH; roundRect(-230, -52, 80, 104, 10); ctx.fill();
    ctx.fillStyle = C.CU; roundRect(-230, -52, 80, 30, 10); ctx.fill();
    text('apolice.pdf', -120, -8, 38, C.WH, { weight: 700 });
    text('Enviado', -120, 40, 28, '#CDBDB2', { weight: 600 });
    const ck = prog(t, 24.6, 0.3);
    ctx.strokeStyle = '#7FD1F0'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    if (ck > 0) { ctx.beginPath(); ctx.moveTo(180, 40); ctx.lineTo(192, 52); ctx.lineTo(214, 28); ctx.stroke(); }
    if (ck > 0.5) { ctx.beginPath(); ctx.moveTo(198, 40); ctx.lineTo(210, 52); ctx.lineTo(232, 28); ctx.stroke(); }
    ctx.restore();
  }
  const b2 = easeOutBack(prog(t, 25.4, 0.35));
  if (b2 > 0) {
    ctx.save(); ctx.translate(430, 880); ctx.scale(b2, b2);
    ctx.fillStyle = C.WH; roundRect(-270, -70, 540, 140, 28); ctx.fill();
    text('Recebi! Já vou analisar 😊', -235, 12, 34, C.BR, { weight: 700 });
    ctx.restore();
  }
  // botão com telefone
  const bt = easeOutBack(prog(t, 25.9, 0.35));
  if (bt > 0) {
    const pulse = 1 + 0.04 * Math.sin((t - 25.9) * 2 * Math.PI * 1.4);
    ctx.save(); ctx.translate(W / 2, 1110); ctx.scale(bt * pulse, bt * pulse);
    ctx.fillStyle = '#25A35A'; roundRect(-380, -78, 760, 156, 78); ctx.fill();
    // ícone de telefone
    ctx.translate(-290, 0); ctx.fillStyle = C.WH; ctx.beginPath(); ctx.arc(0, 0, 44, 0, 7); ctx.fill();
    ctx.fillStyle = '#25A35A'; ctx.rotate(-0.6); roundRect(-10, -26, 20, 52, 9); ctx.fill(); roundRect(-18, -30, 36, 14, 6); ctx.fill(); roundRect(-18, 16, 36, 14, 6); ctx.fill();
    ctx.restore();
    text('+55 61 8358-5578', W / 2 + 50, 1132, 60, C.WH, { align: 'center', alpha: clamp(bt) });
  }
  const r = easeOut(prog(t, 26.4, 0.4));
  text('Análise com Taynah Araujo', W / 2, 1255, 42, C.WH, { align: 'center', weight: 700, alpha: r });
  text('Vida  ·  Saúde  ·  Empresarial  ·  Consórcio', W / 2, 1320, 34, C.CU2, { align: 'center', weight: 600, alpha: r });
  drawLogo(W / 2, 1420, 260, r, 'branca');
}
