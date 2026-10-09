// Montagem do anúncio Alessandra Mendes. Sem legenda.
const SCENES = [
  { at: T.s1, fn: scene1 },
  { at: T.s2, fn: scene2, zoom: true },
  { at: T.s3, fn: scene3, hardCut: true },
  { at: T.s4, fn: scene4, zoom: true },
  { at: T.s5, fn: scene5, zoom: true },
  { at: T.s6, fn: scene6, hardCut: true },
  { at: T.s7, fn: scene7, zoom: true },
];
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
  } else if (i > 0 && !cur.hardCut && w < 1) {
    SCENES[i - 1].fn(t);
    const e = easeOut(w), x = lerp(-400, W + 400, e);
    ctx.save(); ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(x + 300, 0); ctx.lineTo(x - 300, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
    cur.fn(t); ctx.restore();
    ctx.save(); ctx.fillStyle = C.GOLD;
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
  drawScenes(t);
  ctx.restore();
  if (window.SHOW_SAFE) {
    ctx.strokeStyle = 'red'; ctx.lineWidth = 3;
    ctx.strokeRect(SAFE.x0, SAFE.y0, SAFE.x1 - SAFE.x0, SAFE.y1 - SAFE.y0);
  }
};
