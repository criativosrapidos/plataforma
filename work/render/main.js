// Montagem: cenas, transições e legendas palavra por palavra
const SCENES = [
  { at: T.s1, fn: scene1, dark: true },
  { at: T.s2, fn: scene2, dark: false },
  { at: T.s3, fn: scene3, dark: false, hardCut: true },
  { at: T.s4, fn: scene4, dark: true },
  { at: T.s5, fn: scene5, dark: false },
  { at: T.s6, fn: scene6, dark: true },
  { at: T.s7, fn: scene7, dark: false },
];
const WIPE = 0.2;

function sceneIndex(t) { let i = 0; SCENES.forEach((s, k) => { if (t >= s.at) i = k; }); return i; }

function drawScenes(t) {
  const i = sceneIndex(t), cur = SCENES[i];
  const w = (t - cur.at) / WIPE;
  if (i > 0 && !cur.hardCut && w < 1) {
    SCENES[i - 1].fn(t);
    // cortina diagonal rápida revelando a próxima cena
    const e = easeOut(w);
    ctx.save();
    ctx.beginPath();
    const x = lerp(-400, W + 400, e);
    ctx.moveTo(0, 0); ctx.lineTo(x + 300, 0); ctx.lineTo(x - 300, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.clip();
    cur.fn(t);
    ctx.restore();
    // borda amarela/preta da cortina
    ctx.save(); ctx.fillStyle = cur.dark ? C.Y : C.K;
    ctx.beginPath(); ctx.moveTo(x + 300, 0); ctx.lineTo(x + 340, 0); ctx.lineTo(x - 260, H); ctx.lineTo(x - 300, H); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else {
    cur.fn(t);
  }
  return cur;
}

function currentWord(t) {
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i], next = WORDS[i + 1];
    const until = next && next.s - w.e < 0.45 ? next.s : w.e + 0.2;
    if (t >= w.s - 0.03 && t < until) return { w, i };
  }
  return null;
}

function subtitles(t, dark) {
  const cw = currentWord(t);
  if (!cw) return;
  const str = cw.w.w.toUpperCase();
  const size = 58, y = 1430;
  const pop = easeOutBack(prog(t, cw.w.s - 0.03, 0.12));
  const w = measure(str, size) + 56, h = 86;
  ctx.save(); ctx.translate(W / 2 - 45, y); ctx.scale(lerp(0.85, 1, pop), lerp(0.85, 1, pop));
  ctx.fillStyle = dark ? C.Y : C.K; roundRect(-w / 2, -h / 2, w, h, 18); ctx.fill();
  ctx.restore();
  text(str, W / 2 - 45, y + 20, size, dark ? C.K : C.WH, { align: 'center' });
}

window.renderFrame = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  const cur = drawScenes(t);
  subtitles(t, cur.dark);
  if (window.SHOW_SAFE) {
    ctx.strokeStyle = 'red'; ctx.lineWidth = 3;
    ctx.strokeRect(SAFE.x0, SAFE.y0, SAFE.x1 - SAFE.x0, SAFE.y1 - SAFE.y0);
  }
};

// Checagem da área segura: largura dos títulos principais
window.checkSafe = () => {
  const r = {};
  [['VÍDEOS?', 172, 1.05], ['PRA VOCÊ.', 150, 1], ['VENDENDO', 140, 1], ['GRAVAR', 140, 1], ['Seu vídeo pronto', 92, 1]].forEach(([s, z, k]) => {
    r[s] = Math.round(measure(s, z) * k + Math.tan(9 * Math.PI / 180) * z * 0.7);
  });
  return r;
};
