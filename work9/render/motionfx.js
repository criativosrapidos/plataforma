// Camada de motion por cima do quadro pronto (pós-processamento no canvas).
// Cada vídeo liga com window.FX = { cuts, hits, glitch, confetti, leaks } (tempos em segundos).
const FXB = document.createElement('canvas'); FXB.width = W; FXB.height = H;
const fxb = FXB.getContext('2d');
const FXT = document.createElement('canvas'); FXT.width = W; FXT.height = H;
const fxt = FXT.getContext('2d');
// grão de filme: 4 texturas de ruído pré-calculadas
const GRAIN = [0, 1, 2, 3].map((s) => {
  const c = document.createElement('canvas'); c.width = 270; c.height = 480;
  const g = c.getContext('2d'), im = g.createImageData(270, 480);
  for (let i = 0; i < im.data.length; i += 4) { const v = rand(i * 0.37 + s * 999) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); return c;
});

function snap() { fxb.setTransform(1, 0, 0, 1, 0, 0); fxb.clearRect(0, 0, W, H); fxb.drawImage(cv, 0, 0); }
const near = (t, list, before, after) => { for (const a of list) { const d = t - a; if (d > -before && d < after) return d; } return null; };

// 1. chicote (whip pan): borrão direcional forte nos cortes
function whip(t, cuts) {
  const d = near(t, cuts, 0.12, 0.16);
  if (d === null) return;
  const k = 1 - Math.abs(d) / (d < 0 ? 0.12 : 0.16);
  snap();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 1; i <= 7; i++) { ctx.globalAlpha = 0.16 * k; ctx.drawImage(FXB, (i - 4) * 46 * k, (i - 4) * 10 * k); }
  // faixas de velocidade
  ctx.globalAlpha = 0.55 * k; ctx.fillStyle = C.Y;
  for (let i = 0; i < 9; i++) { const y = rand(i + Math.floor(t * 30)) * H; ctx.fillRect(0, y, W, 3 + rand(i + 7) * 10); }
  ctx.restore();
}

// 2. zoom blur + flash + onda de choque nas batidas fortes
function hitFx(t, hits) {
  const d = near(t, hits, 0, 0.5);
  if (d === null) return;
  const k = 1 - d / 0.5;
  if (d < 0.14) {
    snap();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const z = (0.14 - d) / 0.14;
    for (let i = 1; i <= 5; i++) { const s = 1 + 0.018 * i * z; ctx.globalAlpha = 0.14 * z;
      ctx.drawImage(FXB, W / 2 - W * s / 2, H / 2 - H * s / 2, W * s, H * s); }
    ctx.globalAlpha = 0.28 * z; ctx.fillStyle = C.WH; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const r = 80 + 1100 * easeOut(1 - k);
  ctx.globalAlpha = 0.5 * k * k; ctx.strokeStyle = C.WH; ctx.lineWidth = 18 * k + 2;
  ctx.beginPath(); ctx.arc(W / 2, H * 0.46, r, 0, 7); ctx.stroke();
  ctx.globalAlpha = 0.35 * k * k; ctx.strokeStyle = C.Y; ctx.lineWidth = 8 * k + 1;
  ctx.beginPath(); ctx.arc(W / 2, H * 0.46, r * 0.72, 0, 7); ctx.stroke();
  // raios de velocidade saindo do centro
  ctx.globalAlpha = 0.35 * k; ctx.strokeStyle = C.WH; ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const a = rand(i + 3.3) * 7, r0 = 420 + rand(i) * 200 + (1 - k) * 500, r1 = r0 + 160 + rand(i + 9) * 260;
    ctx.lineWidth = 3 + rand(i + 1) * 5; ctx.beginPath();
    ctx.moveTo(W / 2 + Math.cos(a) * r0, H * 0.46 + Math.sin(a) * r0); ctx.lineTo(W / 2 + Math.cos(a) * r1, H * 0.46 + Math.sin(a) * r1); ctx.stroke(); }
  ctx.restore();
}

// 3. glitch: separação RGB + fatias deslocadas
function glitch(t, list) {
  const d = near(t, list, 0, 0.45);
  if (d === null) return;
  const on = (Math.floor(d * 30) % 3) !== 2;
  if (!on) return;
  const k = 1 - d / 0.45;
  snap();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const ch = [['#FF0000', -18 * k, 0], ['#00FF00', 0, 0], ['#0000FF', 18 * k, 4 * k]];
  for (const [col, dx, dy] of ch) {
    fxt.globalCompositeOperation = 'source-over'; fxt.clearRect(0, 0, W, H); fxt.drawImage(FXB, 0, 0);
    fxt.globalCompositeOperation = 'multiply'; fxt.fillStyle = col; fxt.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(FXT, dx, dy);
  }
  ctx.globalCompositeOperation = 'source-over';
  const seed = Math.floor(t * 30);
  for (let i = 0; i < 7; i++) {
    const y = rand(seed + i) * H, h = 20 + rand(seed + i + 50) * 120, dx = (rand(seed + i + 90) - 0.5) * 160 * k;
    ctx.drawImage(cv, 0, y, W, h, dx, y, W, h);
  }
  ctx.globalAlpha = 0.12; ctx.fillStyle = C.WH;
  for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 2);
  ctx.restore();
}

// 4. confete amarelo/preto/branco caindo (comemoração)
function confetti(t, list) {
  for (const at of list) {
    const d = t - at; if (d < 0 || d > 2.4) continue;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 90; i++) {
      const vx = (rand(i + at) - 0.5) * 1400, vy = -900 - rand(i + 2 + at) * 900, g = 1900;
      const x = W / 2 + vx * d, y = H * 0.34 + vy * d + 0.5 * g * d * d;
      if (y > H + 40) continue;
      ctx.globalAlpha = clamp(1.4 - d * 0.6);
      ctx.translate(x, y); ctx.rotate(d * 8 + i); ctx.fillStyle = [C.Y, C.K, C.WH, '#2E9E5B'][i % 4];
      ctx.fillRect(-9, -5, 18, 10); ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
  }
}

// 5. vazamento de luz quente varrendo a tela
function leaks(t, list) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen';
  for (const [at, dur] of list) {
    const p = (t - at) / dur; if (p < 0 || p > 1) continue;
    const a = Math.sin(p * Math.PI) * 0.55, x = lerp(-300, W + 300, p), y = lerp(H * 0.2, H * 0.7, p);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 700);
    g.addColorStop(0, `rgba(255,212,0,${a})`); g.addColorStop(0.5, `rgba(255,140,40,${a * 0.4})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

// 6. persianas diagonais (shutter) cruzando nos cortes principais
function shutter(t, list) {
  const d = near(t, list, 0.18, 0.18);
  if (d === null) return;
  const p = (d + 0.18) / 0.36;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(W / 2, H / 2); ctx.rotate(-0.35);
  for (let i = -6; i <= 6; i++) {
    const w = 230 * Math.sin(p * Math.PI);
    ctx.fillStyle = i % 2 ? C.Y : C.K;
    ctx.fillRect(i * 240 - w / 2 + (p - 0.5) * 900 * (i % 2 ? 1 : -1), -1400, w, 2800);
  }
  ctx.restore();
}

// 7. acabamento: vinheta + grão + leve aberração nas bordas
function finish(t) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.09;
  ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0, W, H);
  ctx.restore();
}

function applyFX(t) {
  const F = window.FX; if (!F) return;
  whip(t, F.cuts || []);
  hitFx(t, F.hits || []);
  glitch(t, F.glitch || []);
  shutter(t, F.shutters || []);
  confetti(t, F.confetti || []);
  leaks(t, F.leaks || []);
  finish(t);
}
