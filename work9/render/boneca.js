// "Bonequinha" da Alessandra: ilustração com cabelo ruivo e roupa verde.
// cheer (0..1) levanta o braço com o celular; t anima respiração e piscada.
const SKIN = '#F3C9A8', HAIR = '#C4441C', HAIR2 = '#E0622E', GREEN = '#1F8A5B', GREEN2 = '#176B46';
function boneca(cx, cy, s, t, cheer = 0) {
  const bob = Math.sin(t * 2.2) * 4;
  ctx.save(); ctx.translate(cx, cy + bob); ctx.scale(s, s);
  // cabelo de trás (longo, até os ombros)
  ctx.fillStyle = HAIR;
  ctx.beginPath(); ctx.moveTo(-150, -150); ctx.quadraticCurveTo(-190, 60, -150, 170); ctx.lineTo(150, 170);
  ctx.quadraticCurveTo(190, 60, 150, -150); ctx.quadraticCurveTo(0, -300, -150, -150); ctx.fill();
  // corpo: blusa verde
  ctx.fillStyle = GREEN;
  ctx.beginPath(); ctx.moveTo(-230, 420); ctx.quadraticCurveTo(-230, 190, -90, 160); ctx.lineTo(90, 160);
  ctx.quadraticCurveTo(230, 190, 230, 420); ctx.closePath(); ctx.fill();
  // decote em V e pescoço
  ctx.fillStyle = SKIN; ctx.fillRect(-38, 90, 76, 90);
  ctx.beginPath(); ctx.moveTo(-60, 160); ctx.lineTo(0, 250); ctx.lineTo(60, 160); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = GREEN2; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-64, 158); ctx.lineTo(0, 254); ctx.lineTo(64, 158); ctx.stroke();
  // colar dourado
  ctx.strokeStyle = '#E3B04B'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 150, 46, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
  // braço direito (da tela) levantando o celular na comemoração
  const a = lerp(0.15, -2.3, easeOutBack(clamp(cheer)));
  if (cheer > 0.01) {
  ctx.save(); ctx.translate(180, 230); ctx.rotate(a);
  ctx.fillStyle = GREEN; roundRect(-34, -10, 68, 190, 34); ctx.fill();
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, 200, 34, 0, 7); ctx.fill();
  if (cheer > 0.05) { ctx.save(); ctx.translate(0, 230); ctx.rotate(Math.PI);
    ctx.fillStyle = C.K; roundRect(-36, -10, 72, 130, 14); ctx.fill();
    ctx.fillStyle = C.Y; roundRect(-28, 0, 56, 110, 8); ctx.fill();
    text('$', 0, 74, 54, C.K, { align: 'center' }); ctx.restore(); }
  ctx.restore();
  }
  // cabeça
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.ellipse(0, -40, 120, 140, 0, 0, 7); ctx.fill();
  // orelhas + brincos
  ctx.beginPath(); ctx.ellipse(-118, -30, 18, 28, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(118, -30, 18, 28, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#E3B04B'; ctx.beginPath(); ctx.arc(-120, 4, 9, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(120, 4, 9, 0, 7); ctx.fill();
  // franja e mechas da frente
  ctx.fillStyle = HAIR;
  ctx.beginPath(); ctx.moveTo(-128, -40); ctx.quadraticCurveTo(-140, -190, 0, -195); ctx.quadraticCurveTo(140, -190, 128, -40);
  ctx.quadraticCurveTo(110, -120, 30, -140); ctx.quadraticCurveTo(-40, -95, -128, -40); ctx.fill();
  ctx.fillStyle = HAIR2; ctx.beginPath(); ctx.moveTo(-20, -170); ctx.quadraticCurveTo(50, -160, 90, -110); ctx.quadraticCurveTo(40, -140, -20, -150); ctx.fill();
  // olhos (piscam)
  const blink = (t % 3.1) < 0.12 ? 0.15 : 1;
  ctx.fillStyle = '#2A1A14';
  ctx.beginPath(); ctx.ellipse(-44, -30, 13, 17 * blink, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(44, -30, 13, 17 * blink, 0, 0, 7); ctx.fill();
  ctx.fillStyle = C.WH; ctx.beginPath(); ctx.arc(-40, -36, 4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(48, -36, 4, 0, 7); ctx.fill();
  // sobrancelhas
  ctx.strokeStyle = '#8E3216'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-66, -66 - cheer * 6); ctx.quadraticCurveTo(-44, -76 - cheer * 6, -22, -66 - cheer * 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(22, -66 - cheer * 6); ctx.quadraticCurveTo(44, -76 - cheer * 6, 66, -66 - cheer * 6); ctx.stroke();
  // bochechas e sorriso (abre mais na comemoração)
  ctx.fillStyle = 'rgba(232,120,110,0.35)'; ctx.beginPath(); ctx.ellipse(-70, 10, 22, 14, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(70, 10, 22, 14, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#B0433A'; ctx.beginPath(); ctx.moveTo(-36, 30); ctx.quadraticCurveTo(0, 62 + cheer * 22, 36, 30); ctx.quadraticCurveTo(0, 44, -36, 30); ctx.fill();
  if (cheer > 0.3) { ctx.fillStyle = C.WH; ctx.beginPath(); ctx.moveTo(-26, 34); ctx.quadraticCurveTo(0, 44, 26, 34); ctx.quadraticCurveTo(0, 50, -26, 34); ctx.fill(); }
  ctx.restore();
}
