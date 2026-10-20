// Stories dos destaques: ?s=<id> escolhe o story; cada um define dur, punches e fn(t)
const ID = new URLSearchParams(location.search).get('s');
const STORY = STORIES[ID];
PUNCHES = STORY.punches || [];
window.DURATION = STORY.dur;
// quadros de vídeo de cliente (pré-extraídos em clips/) para tocar dentro do celular
const CLIPS = {};
function loadClip(name, n) {
  CLIPS[name] = [];
  for (let i = 1; i <= n; i++) { const im = new Image(); im.src = `clips/${name}_${String(i).padStart(3, '0')}.jpg`; CLIPS[name].push(im); }
}
function clipFrame(name, t) { const a = CLIPS[name]; return a[Math.min(a.length - 1, Math.max(0, Math.floor(t * 30)))]; }
if (STORY.clip) loadClip(STORY.clip, 210);
window.ready = () => Promise.all((CLIPS[STORY.clip] || []).map((im) => im.complete ? 1 : new Promise((r) => { im.onload = r; im.onerror = r; })));

window.renderFrame = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.save(); applyCamera(t);
  STORY.fn(t);
  ctx.restore();
  if (window.SHOW_SAFE) {
    ctx.strokeStyle = 'red'; ctx.lineWidth = 3;
    ctx.strokeRect(SAFE.x0, SAFE.y0, SAFE.x1 - SAFE.x0, SAFE.y1 - SAFE.y0);
  }
};
