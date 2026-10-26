// Peças visuais compartilhadas pelos 4 criativos (marca Criativos Rápidos)

// fundo com grade fina (como na proposta)
function grid(color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}
function darkBg(t) { bg(C.K); grid('#FFFFFF', 0.05); particles(t, C.Y, 40, 0.35); }
function lightBg() { bg(C.OW); grid('#101216', 0.05); }
function yellowBg() { bg(C.Y); grid('#101216', 0.06); }

// texto que entra com pulo (escala) — ancorado em (x, y)
function pop(str, x, y, size, color, t, at, opts = {}) {
  const p = easeOutBack(prog(t, at, opts.dur || 0.3));
  if (p <= 0) return 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(clamp(p, 0, 1.2), clamp(p, 0, 1.2));
  text(str, 0, 0, size, color, { align: opts.align || 'left', skew: opts.skew || 0, weight: opts.weight || 800 });
  ctx.restore();
  return p;
}
// texto que sobe com fade
function rise(str, x, y, size, color, t, at, opts = {}) {
  const r = easeOut(prog(t, at, 0.3));
  if (r <= 0) return 0;
  text(str, x, y + (1 - r) * 50, size, color, { ...opts, alpha: r * (opts.alpha ?? 1) });
  return r;
}
// risco vermelho por cima de uma palavra já desenhada
function strike(x, y, w, size, t, at, color = '#E0322C', align = 'left') {
  const s = easeOut(prog(t, at, 0.18));
  if (s <= 0) return;
  const x0 = align === 'center' ? x - w / 2 : x;
  ctx.save(); ctx.fillStyle = color; ctx.translate(x0 - 14, y - size * 0.37); ctx.rotate(-0.05);
  roundRect(0, -size * 0.07, (w + 28) * s, size * 0.14, size * 0.07); ctx.fill(); ctx.restore();
}

// fita de alerta (listras pretas e amarelas)
function hazard(y, t, rot, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(W / 2, y); ctx.rotate(rot);
  ctx.fillStyle = C.Y; ctx.fillRect(-900, -45, 1800, 90);
  ctx.beginPath(); ctx.rect(-900, -45, 1800, 90); ctx.clip();
  ctx.fillStyle = C.K; const off = (t * 220) % 120;
  for (let x = -1000; x < 1000; x += 120) {
    ctx.beginPath(); ctx.moveTo(x + off, -45); ctx.lineTo(x + off + 60, -45); ctx.lineTo(x + off + 10, 45); ctx.lineTo(x + off - 50, 45); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function heart(x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-26, -6, -14, -26, 0, -12); ctx.bezierCurveTo(14, -26, 26, -6, 0, 12);
  ctx.fill(); ctx.restore();
}

// cédula de dinheiro (verde) — para o "dinheiro indo embora"
function bill(x, y, s, rot, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#2E9E5B'; roundRect(-90, -45, 180, 90, 10); ctx.fill();
  ctx.strokeStyle = '#BFF0CF'; ctx.lineWidth = 4; roundRect(-78, -34, 156, 68, 8); ctx.stroke();
  ctx.fillStyle = '#BFF0CF'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fill();
  text('R$', 0, 9, 24, '#2E9E5B', { align: 'center' });
  ctx.restore();
}

// celular genérico: inner(w, h) desenha a tela
function phone(cx, cy, s, rot, inner) {
  const w = 440, h = 820;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; roundRect(14, 24, w + 24, h + 24, 60); ctx.fill();
  ctx.fillStyle = '#23262D'; roundRect(-12, -12, w + 24, h + 24, 60); ctx.fill();
  ctx.save(); roundRect(0, 0, w, h, 48); ctx.clip();
  ctx.fillStyle = C.WH; ctx.fillRect(0, 0, w, h);
  inner(w, h);
  ctx.restore();
  ctx.fillStyle = '#23262D'; roundRect(w / 2 - 56, -2, 112, 24, 12); ctx.fill();
  ctx.restore();
}

// tela de perfil do Instagram (grid 3x3); opts.tile(k, x, y, tw, t)
function profileScreen(w, t, opts) {
  ctx.fillStyle = opts.avatar; ctx.beginPath(); ctx.arc(70, 120, 46, 0, 7); ctx.fill();
  if (opts.avatarMark) logoMark(42, 98, 0.4, C.K);
  [['posts', opts.posts], ['seguidores', opts.followers], ['seguindo', '180']].forEach(([l, v], i) => {
    text(String(v), 190 + i * 90, 118, 30, C.K, { align: 'center' });
    text(l, 190 + i * 90, 146, 17, '#777', { align: 'center', weight: 500 });
  });
  text(opts.name, 30, 205, 26, C.K);
  text(opts.bio, 30, 236, 19, opts.bioColor || '#777', { weight: 500 });
  const g = 4, tw = (w - g * 2) / 3;
  for (let k = 0; k < 9; k++) opts.tile(k, (k % 3) * (tw + g), 270 + Math.floor(k / 3) * (tw + g), tw, t);
}

// post "bonito" da marca (para o sonho)
const POSTC = [C.K, C.WH, C.K, '#FFE873', C.K, C.WH, C.K, C.WH, C.K];
function brandTile(k, x, y, tw, t, at) {
  const a = easeOutBack(prog(t, at + k * 0.25, 0.28));
  ctx.fillStyle = '#EFEFF1'; ctx.fillRect(x, y, tw, tw);
  if (a <= 0) return;
  ctx.save(); ctx.translate(x + tw / 2, y + tw / 2); ctx.scale(a, a);
  ctx.fillStyle = POSTC[k]; ctx.fillRect(-tw / 2, -tw / 2, tw, tw);
  const fg = POSTC[k] === C.K ? C.Y : C.K;
  ctx.fillStyle = fg;
  if (k % 3 === 0) { ctx.beginPath(); ctx.moveTo(-20, -28); ctx.lineTo(30, 0); ctx.lineTo(-20, 28); ctx.closePath(); ctx.fill(); }
  else if (k % 3 === 1) { roundRect(-48, -26, 96, 18, 9); ctx.fill(); roundRect(-48, 4, 66, 18, 9); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill(); }
  ctx.restore();
}
// post apagado (perfil parado)
function deadTile(k, x, y, tw) {
  ctx.fillStyle = k < 3 ? '#C9CACE' : '#EFEFF1'; ctx.fillRect(x, y, tw, tw);
  if (k >= 3) { ctx.strokeStyle = '#D5D6DA'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]); ctx.strokeRect(x + 14, y + 14, tw - 28, tw - 28); ctx.setLineDash([]); }
}

// pílula (fundo + texto centralizado)
function pill(str, cx, cy, size, bgc, fg, t, at, rot = 0) {
  const p = easeOutBack(prog(t, at, 0.3));
  if (p <= 0) return;
  const w = measure(str, size) + size * 1.4, h = size * 1.9;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(p, p);
  ctx.fillStyle = bgc; roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  text(str, 0, size * 0.36, size, fg, { align: 'center' });
  ctx.restore();
}

// notificação escura com bolinha amarela
function toast(l1, l2, cx, cy, t, at, rot = -0.03) {
  const n = easeOutBack(prog(t, at, 0.35));
  if (n <= 0) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(n, n); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; roundRect(-330, -50, 680, 112, 28); ctx.fill();
  ctx.fillStyle = C.K; roundRect(-340, -60, 680, 112, 28); ctx.fill();
  ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(-282, -4, 22, 0, 7); ctx.fill();
  text(l1, -240, -14, 30, '#B9BBC1', { weight: 600 });
  text(l2, -240, 26, 36, C.WH);
  ctx.restore();
}

// carimbo com borda (entra grande e bate)
function stamp(str, y, t, at, rot, color = C.WH, size = 80) {
  const p = prog(t, at, 0.22);
  if (p <= 0) return;
  const e = easeOut(p);
  ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); ctx.scale(lerp(2.4, 1, e), lerp(2.4, 1, e)); ctx.globalAlpha = clamp(p * 2);
  const w = measure(str, size) + 80;
  ctx.strokeStyle = color; ctx.lineWidth = 8; roundRect(-w / 2, -size * 0.88, w, size * 1.5, 18); ctx.stroke();
  text(str, 0, size * 0.22, size, color, { align: 'center' });
  ctx.restore();
}

// relógio que enche até 24H (fundo escuro)
function clock24(cx, cy, r, t, at, fillDur, popAt) {
  const c = easeOutBack(prog(t, at, 0.35));
  if (c <= 0) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(clamp(c), clamp(c));
  ctx.fillStyle = C.K; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  const x = prog(t, at + 0.1, fillDur);
  const sweep = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  ctx.strokeStyle = C.Y; ctx.lineWidth = r * 0.1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.86, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sweep); ctx.stroke();
  const pop = 1 + 0.12 * Math.sin(prog(t, popAt, 0.3) * Math.PI);
  ctx.scale(pop, pop);
  text('EM ATÉ', 0, -r * 0.3, r * 0.14, '#B9BBC1', { align: 'center', weight: 700 });
  text(Math.round(24 * sweep) + 'H', 0, r * 0.24, r * 0.66, C.Y, { align: 'center' });
  ctx.restore();
  burst(t, popAt, cx, cy, C.Y, 40, r * 2.1);
}

// "a partir de R$97" grande (amarelo sobre escuro)
function price(cx, cy, t, at, label, value = '97') {
  rise(label, cx, cy - 270, 60, '#B9BBC1', t, at - 0.7, { align: 'center', weight: 700 });
  const p = easeOutBack(prog(t, at, 0.35));
  if (p <= 0) return;
  glow(cx, cy - 70, 520, 'rgba(255,212,0,0.6)', 0.4 * clamp(p));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(p * (1 + 0.02 * Math.sin(t * 6)), p * (1 + 0.02 * Math.sin(t * 6)));
  const vw = measure(value, 330);
  text('R$', -vw / 2 - 20, -120, 80, C.Y, { align: 'right' });
  text(value, 0, 0, 330, C.Y, { align: 'center' });
  ctx.restore();
  burst(t, at + 0.05, cx, cy - 90, C.Y, 46, 620);
}

// botão preto de CTA com logo, pulsando, clique e cursor
function ctaButton(l1, l2, cy, t, at, click) {
  const b = easeOutBack(prog(t, at, 0.35));
  if (b <= 0) return;
  const pulse = 1 + 0.04 * Math.sin((t - at) * 2 * Math.PI * 1.4) * (t > at + 0.8 ? 1 : 0);
  const press = t >= click && t < click + 0.15 ? 0.92 : 1;
  ctx.save(); ctx.translate(W / 2, cy); ctx.scale(b * pulse * press, b * pulse * press);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; roundRect(-405, -85, 820, 180, 90); ctx.fill();
  ctx.fillStyle = C.K; roundRect(-410, -95, 820, 180, 90); ctx.fill();
  // só o texto no botão (a logo ficava por cima das letras)
  if (l2) { text(l1, 0, -12, 54, C.Y, { align: 'center' }); text(l2, 0, 50, 54, C.Y, { align: 'center' }); }
  else text(l1, 0, 20, 60, C.Y, { align: 'center' });
  ctx.restore();
  const hp = prog(t, click - 0.45, 0.45);
  if (hp > 0) {
    const hx = lerp(980, 860, easeOut(hp)), hy = lerp(cy + 340, cy + 90, easeOut(hp)) + (t >= click && t < click + 0.15 ? 10 : 0);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.3);
    ctx.fillStyle = C.WH; ctx.strokeStyle = C.K; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 90); ctx.lineTo(22, 70); ctx.lineTo(38, 104); ctx.lineTo(52, 97); ctx.lineTo(36, 64); ctx.lineTo(64, 64); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
  if (t >= click) { const r = prog(t, click, 0.5); ctx.save(); ctx.globalAlpha = 1 - r; ctx.strokeStyle = C.K; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(860, cy + 90, 30 + r * 90, 0, 7); ctx.stroke(); ctx.restore(); }
}

// fechamento amarelo padrão: logo + título + botão + rodapé
function endCard(t, at, title, b1, b2, btnAt, click, foot1, foot2) {
  yellowBg();
  for (let k = 0; k < 3; k++) {
    const p = ((t - at) * 0.9 + k * 0.33) % 1;
    speedLines(lerp(-500, W + 100, p), [300, 1540, 1660][k], 360, 18, C.K, 34);
  }
  const lg = easeOutBack(prog(t, at + 0.1, 0.4));
  ctx.save(); ctx.translate(W / 2, 520); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2));
  drawLogo(0, 0, 640, 1, C.K);
  ctx.restore();
  title.forEach((l, i) => rise(l, W / 2, 790 + i * 100, 88, C.K, t, at + 0.15 + i * 0.12, { align: 'center' }));
  ctaButton(b1, b2, 1120, t, btnAt, click);
  const r = easeOut(prog(t, btnAt + 0.5, 0.4));
  text(foot1, W / 2, 1330, 42, C.K, { align: 'center', alpha: r });
  text(foot2, W / 2, 1390, 32, C.K, { align: 'center', weight: 600, alpha: r });
}
