// Logo Criativos Rápidos (como na proposta): play com três riscos + "criativos" regular / "rápidos" itálico extra negrito.
// Desenhada sempre na proporção original, sem esticar nem inclinar.
function logoMark(x, y, s, color) {
  // caixa de 140 x 120 unidades: riscos à esquerda, triângulo arredondado à direita
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  roundRect(0, 26, 34, 14, 7); ctx.fill();
  roundRect(-12, 53, 46, 14, 7); ctx.fill();
  roundRect(6, 80, 28, 14, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(52, 8); ctx.lineTo(138, 60); ctx.lineTo(52, 112); ctx.closePath();
  ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = color; ctx.stroke(); ctx.fill();
  ctx.restore();
}
function drawLogo(cx, cy, w, alpha = 1, color = C.K) {
  const s = w / 520;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(cx - 260 * s, cy - 60 * s); ctx.scale(s, s);
  logoMark(12, 0, 1, color);
  ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.font = '400 66px Inter'; ctx.letterSpacing = '-1px'; ctx.fillText('criativos', 190, 52);
  ctx.font = 'italic 800 70px Inter'; ctx.letterSpacing = '-2px'; ctx.fillText('rápidos', 186, 116);
  ctx.restore();
}
