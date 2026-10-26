// Montagem comum: cada vN.js define T, SCENES e PUNCHES. Sem legenda.
const WIPE = 0.22;
function sceneIndex(t) { let i = 0; SCENES.forEach((s, k) => { if (t >= s.at) i = k; }); return i; }

function drawScenes(t) {
  const i = sceneIndex(t), cur = SCENES[i];
  const w = (t - cur.at) / WIPE;
  if (i > 0 && cur.zoom && w < 1.4) {
    // atravessa a cena anterior com zoom + flash
    const e = clamp(w / 1.4);
    cur.fn(t);
    if (e < 0.5) {
      ctx.save(); ctx.globalAlpha = 1 - e * 2;
      ctx.translate(W / 2, H / 2); ctx.scale(1 + e * 3, 1 + e * 3); ctx.translate(-W / 2, -H / 2);
      SCENES[i - 1].fn(t); ctx.restore();
    }
    ctx.save(); ctx.globalAlpha = 0.55 * (1 - e); ctx.fillStyle = C.WH; ctx.fillRect(0, 0, W, H); ctx.restore();
  } else if (i > 0 && cur.wipe && w < 1) {
    // cortina diagonal com a faixa amarela da marca
    SCENES[i - 1].fn(t);
    const e = easeOut(w), x = lerp(-400, W + 400, e);
    ctx.save(); ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(x + 300, 0); ctx.lineTo(x - 300, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
    cur.fn(t); ctx.restore();
    ctx.save(); ctx.fillStyle = C.Y;
    ctx.beginPath(); ctx.moveTo(x + 300, 0); ctx.lineTo(x + 340, 0); ctx.lineTo(x - 260, H); ctx.lineTo(x - 300, H); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else {
    cur.fn(t);
  }
}

window.renderFrame = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.save(); applyCamera(t);
  // câmera "na mão": leve rotação contínua quando a camada de motion está ligada
  if (window.FX) { ctx.translate(W / 2, H / 2); ctx.rotate(0.006 * Math.sin(t * 1.7) + 0.004 * Math.sin(t * 3.1)); ctx.translate(-W / 2, -H / 2); }
  drawScenes(t);
  ctx.restore();
  if (window.FX && typeof applyFX === 'function') applyFX(t);
  if (window.SHOW_SAFE) {
    ctx.strokeStyle = 'red'; ctx.lineWidth = 3;
    ctx.strokeRect(SAFE.x0, SAFE.y0, SAFE.x1 - SAFE.x0, SAFE.y1 - SAFE.y0);
  }
};
