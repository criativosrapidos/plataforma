// Globo e mapa do Brasil (contorno aproximado, lon/lat), urna e boleto
const BR = [[-51.6,4.2],[-50.0,1.8],[-48.5,-1.2],[-44.3,-2.5],[-41.8,-2.9],[-38.5,-3.7],[-35.2,-5.5],[-34.8,-7.5],[-35.3,-9.4],
  [-37.0,-11.0],[-38.5,-13.0],[-39.0,-15.5],[-39.3,-17.9],[-40.9,-21.5],[-42.0,-23.0],[-44.7,-23.4],[-46.8,-24.2],[-48.5,-26.0],
  [-48.6,-28.5],[-50.2,-30.5],[-52.5,-33.7],[-53.5,-33.2],[-57.6,-30.2],[-55.8,-28.0],[-53.6,-26.2],[-54.6,-25.6],[-55.7,-22.6],
  [-57.9,-22.1],[-58.2,-19.8],[-57.6,-18.0],[-60.2,-16.3],[-60.5,-13.8],[-62.9,-12.9],[-65.3,-11.0],[-66.6,-9.9],[-70.5,-11.0],
  [-72.9,-9.0],[-73.9,-7.4],[-72.9,-5.2],[-70.0,-4.3],[-69.4,-1.0],[-70.0,0.6],[-69.5,1.7],[-67.0,2.2],[-66.9,1.2],[-64.0,2.5],
  [-63.4,3.9],[-60.6,5.2],[-59.8,4.0],[-58.0,1.6],[-56.0,2.0],[-54.0,2.3],[-52.0,3.9]];
const BSB = [-47.9, -15.8];

// projeção ortográfica: centro (lon0, lat0), raio R em px, centro da tela (cx, cy)
function ortho(lon, lat, lon0, lat0, R, cx, cy) {
  const d = Math.PI / 180, l = (lon - lon0) * d, p = lat * d, p0 = lat0 * d;
  const x = Math.cos(p) * Math.sin(l);
  const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
  const vis = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l) > 0;
  return [cx + R * x, cy - R * y, vis];
}

function pointInPoly(lon, lat) {
  let inside = false;
  for (let i = 0, j = BR.length - 1; i < BR.length; j = i++) {
    const [xi, yi] = BR[i], [xj, yj] = BR[j];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// pontos do Brasil (grade de 1,2°), calculados uma vez
const BR_DOTS = [];
for (let lat = 6; lat > -35; lat -= 1.2) for (let lon = -75; lon < -33; lon += 1.2) if (pointInPoly(lon, lat)) BR_DOTS.push([lon, lat]);

// globo com grade e o Brasil em pontos amarelos; glowBr acende o país
function globe(t, lon0, lat0, R, cx, cy, glowBr = 0) {
  ctx.save();
  const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
  g.addColorStop(0, '#2A2F3A'); g.addColorStop(1, '#14171D');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2;
  for (let lon = -180; lon < 180; lon += 20) { ctx.beginPath(); let first = true;
    for (let lat = -90; lat <= 90; lat += 5) { const [x, y, v] = ortho(lon, lat, lon0, lat0, R, cx, cy); if (!v) { first = true; continue; } first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false; } ctx.stroke(); }
  for (let lat = -80; lat <= 80; lat += 20) { ctx.beginPath(); let first = true;
    for (let lon = -180; lon <= 180; lon += 5) { const [x, y, v] = ortho(lon, lat, lon0, lat0, R, cx, cy); if (!v) { first = true; continue; } first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false; } ctx.stroke(); }
  const ds = Math.max(2, R * 0.006);
  BR_DOTS.forEach(([lon, lat], i) => {
    const [x, y, v] = ortho(lon, lat, lon0, lat0, R, cx, cy);
    if (!v) return;
    ctx.globalAlpha = 0.55 + 0.45 * glowBr * (0.6 + 0.4 * Math.sin(t * 4 + i));
    ctx.fillStyle = C.Y; ctx.beginPath(); ctx.arc(x, y, ds, 0, 7); ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,212,0,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
  ctx.restore();
}

// contorno do Brasil num retângulo de tela (zoom de mapa), retorna função de projeção
function brMap(cx, cy, scale, alpha = 1, fillA = 0.12) {
  const P = ([lon, lat]) => [cx + (lon + 52) * scale, cy - (lat + 14) * scale * 1.04];
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath(); BR.forEach((p, i) => { const [x, y] = P(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
  ctx.fillStyle = `rgba(255,212,0,${fillA})`; ctx.fill();
  ctx.strokeStyle = C.Y; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
  return P;
}

// urna eletrônica estilizada (sem nenhum candidato)
function urna(cx, cy, s) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = '#D9DADE'; roundRect(-200, -120, 400, 240, 24); ctx.fill();
  ctx.fillStyle = '#23262D'; roundRect(-180, -100, 200, 140, 10); ctx.fill();
  ctx.fillStyle = '#3A3D44'; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { roundRect(50 + c * 44, -96 + r * 44, 36, 36, 6); ctx.fill(); }
  ctx.fillStyle = C.WH; roundRect(50, 84, 36, 26, 5); ctx.fill(); ctx.fillStyle = '#E0322C'; roundRect(94, 84, 36, 26, 5); ctx.fill();
  ctx.fillStyle = '#2E9E5B'; roundRect(138, 84, 40, 26, 5); ctx.fill();
  ctx.restore();
}

// boleto com código de barras e carimbo "VENCE DIA 10"
function boleto(cx, cy, s, rot, label, valor) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; roundRect(-292, -142, 600, 300, 18); ctx.fill();
  ctx.fillStyle = C.WH; roundRect(-300, -150, 600, 300, 18); ctx.fill();
  text(label, -260, -90, 34, C.K);
  text('R$ ' + valor, 260, -90, 40, C.K, { align: 'right' });
  ctx.fillStyle = '#C9CACE'; roundRect(-260, -60, 380, 14, 7); ctx.fill(); roundRect(-260, -32, 260, 14, 7); ctx.fill();
  ctx.fillStyle = C.K; for (let i = 0; i < 60; i++) { const w = (i * 7) % 3 + 2; ctx.fillRect(-260 + i * 8.6, 20, w, 90); }
  ctx.restore();
}
