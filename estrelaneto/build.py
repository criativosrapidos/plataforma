#!/usr/bin/env python3
"""Vídeo Estrela Neto Advogados (30 s), linguagem sóbria da marca: petróleo/ardósia, Jost fino, círculos de traço."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues.json"))
FIM = c["fim"] + 1.0

head = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Estrela Neto - vídeo</title>
<style>
@font-face { font-family: Jost; font-weight: 200; src: url(fonts/jost-latin-200-normal.woff); }
@font-face { font-family: Jost; font-weight: 300; src: url(fonts/jost-latin-300-normal.woff); }
@font-face { font-family: Jost; font-weight: 400; src: url(fonts/jost-latin-400-normal.woff); }
@font-face { font-family: Jost; font-weight: 500; src: url(fonts/jost-latin-500-normal.woff); }
@font-face { font-family: Jost; font-weight: 600; src: url(fonts/jost-latin-600-normal.woff); }
:root { --pet:#163543; --ard:#3F5866; --aco:#6E7F86; --nev:#8A9497; --gelo:#EEF0F1; --ouro:#C9B48A; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:#0C1F28; }
#stage { position:relative; width:1080px; height:1920px; overflow:hidden; font-family:Jost, sans-serif; color:#fff; }
.scene { position:absolute; inset:0; opacity:0; }
.el { position:absolute; left:0; right:0; text-align:center; opacity:0; will-change:transform, opacity; }
.f-esc { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 35%,#24485A 0%,#10293A 55%,#0A1C26 100%); }
.f-ard { position:absolute; inset:0; background:linear-gradient(160deg,#3F5866 0%,#5D7079 55%,#8A9497 100%); }
.f-gelo { position:absolute; inset:0; background:linear-gradient(180deg,#F4F5F6,#E3E7E9); }
.vid { position:absolute; inset:-100px; background:repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 2px,transparent 2px 180px); }
.vid.esc { background:repeating-linear-gradient(90deg,rgba(22,53,67,.05) 0 2px,transparent 2px 180px); }
.t1 { font-weight:300; letter-spacing:.01em; line-height:1.12; }
.cap { font-weight:400; letter-spacing:.32em; text-transform:uppercase; }
.linha { height:2px; background:currentColor; margin:0 auto; transform-origin:center; }
.q { display:inline-flex; align-items:center; gap:34px; width:880px; padding:38px 46px; border:1.6px solid rgba(255,255,255,.45); border-radius:120px; text-align:left; }
.q .n { flex:none; width:96px; height:96px; border-radius:50%; border:1.6px solid rgba(255,255,255,.7); display:flex; align-items:center; justify-content:center; font-weight:300; font-size:44px; }
.q .tx { font-weight:300; font-size:54px; line-height:1.15; }
.area { display:flex; align-items:center; justify-content:space-between; width:820px; margin:0 auto; padding:30px 6px; border-bottom:1.6px solid rgba(22,53,67,.3); font-weight:400; font-size:62px; color:var(--pet); }
.area span { font-weight:300; font-size:34px; color:var(--aco); letter-spacing:.2em; }
</style></head><body>
'''

areas = [("Empresarial", "empresarial"), ("Societário", "societario"), ("LGPD", "lgpd"), ("Trabalhista", "trabalhista")]
areas_html = "".join(f'<div class="el" data-in="{c[k] - 0.1:.2f}" data-a="fade" style="top:{700 + i * 150}px"><div class="area">{t}<span>0{i + 1}</span></div></div>'
                     for i, (t, k) in enumerate(areas))

cenas = f'''<div id="stage">

  <section class="scene" data-start="0" data-end="{c['socio'] - 0.2:.2f}">
    <div class="f-esc"></div><div class="vid"></div>
    <div class="el" data-in="0.05" data-a="ring" style="top:360px"><svg viewBox="0 0 600 600" style="width:880px;height:880px"><circle cx="300" cy="300" r="296" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.6"/></svg></div>
    <div class="el t1" data-in="{c['sua']}" data-a="fade" style="top:560px;font-size:64px;color:var(--nev)">Sua empresa usa</div>
    <div class="el t1" data-in="{c['ia']}" data-a="fade" style="top:670px;font-size:104px;font-weight:400">inteligência<br>artificial</div>
    <div class="el" data-in="{c['sem'] - 0.1:.2f}" data-a="line" style="top:935px;color:var(--ouro)"><div class="linha" style="width:300px"></div></div>
    <div class="el t1" data-in="{c['sem']}" data-a="fade" style="top:990px;font-size:76px;color:var(--ouro)">sem nenhuma regra?</div>
  </section>

  <section class="scene" data-start="{c['socio'] - 0.2:.2f}" data-end="{c['mundo'] - 0.2:.2f}">
    <div class="f-esc"></div><div class="vid"></div>
    <div class="el" data-in="{c['socio']}" data-a="fade" style="top:640px"><div class="q"><div class="n">01</div><div class="tx">Sócio novo entrando<br><b style="font-weight:500">sem contrato?</b></div></div></div>
    <div class="el" data-in="{c['dados']}" data-a="fade" style="top:960px"><div class="q"><div class="n">02</div><div class="tx">Dados de clientes<br><b style="font-weight:500">sem proteção?</b></div></div></div>
  </section>

  <section class="scene" data-start="{c['mundo'] - 0.2:.2f}" data-end="{c['na'] - 0.2:.2f}">
    <div class="f-ard"></div><div class="vid"></div>
    <div class="el cap" data-in="{c['mundo']}" data-a="fade" style="top:430px;font-size:34px;color:rgba(255,255,255,.8)">No mundo dos negócios</div>
    <div class="el t1" data-in="{c['decisao']}" data-a="fade" style="top:560px;font-size:68px">uma decisão <i style="font-weight:300">pequena</i></div>
    <div class="el" data-in="{c['pequena']}" data-a="grow" data-to="{c['grande']}" style="top:720px"><svg viewBox="0 0 400 400" style="width:400px;height:400px"><circle cx="200" cy="200" r="190" fill="none" stroke="#fff" stroke-width="2"/><circle cx="200" cy="200" r="190" fill="rgba(255,255,255,.08)"/></svg></div>
    <div class="el t1" data-in="{c['grande']}" data-a="fade" style="top:1180px;font-size:68px">pode virar um</div>
    <div class="el t1" data-in="{c['problema']}" data-a="fade" style="top:1270px;font-size:104px;font-weight:500">grande problema<br>jurídico.</div>
  </section>

  <section class="scene" data-start="{c['na'] - 0.2:.2f}" data-end="{c['empresarial'] - 0.25:.2f}">
    <div class="f-esc"></div><div class="vid"></div>
    <div class="el" data-in="{c['na']}" data-a="ring" style="top:330px" id="mono3"></div>
    <div class="el" data-in="{c['estrela']}" data-a="fade" style="top:780px" id="logo3"></div>
    <div class="el" data-in="{c['complex'] - 0.15:.2f}" data-a="line" style="top:1110px;color:rgba(255,255,255,.5)"><div class="linha" style="width:120px"></div></div>
    <div class="el t1" data-in="{c['complex']}" data-a="fade" style="top:1170px;font-size:84px">A complexidade</div>
    <div class="el t1" data-in="{c['motiva']}" data-a="fade" style="top:1275px;font-size:84px;font-weight:500">nos motiva.</div>
  </section>

  <section class="scene" data-start="{c['empresarial'] - 0.25:.2f}" data-end="{c['antes'] - 0.2:.2f}">
    <div class="f-gelo"></div><div class="vid esc"></div>
    <div class="el cap" data-in="{c['empresarial'] - 0.2:.2f}" data-a="fade" style="top:520px;font-size:34px;color:var(--aco)">Direito para empresas</div>
    {areas_html}
    <div class="el t1" data-in="{c['estrategia']}" data-a="fade" style="top:1380px;font-size:62px;color:var(--pet)">com <b style="font-weight:500">estratégia</b><br>para cada desafio.</div>
  </section>

  <section class="scene" data-start="{c['antes'] - 0.2:.2f}" data-end="{FIM + 1}">
    <div class="f-esc"></div><div class="vid"></div>
    <div class="el t1" data-in="{c['antes']}" data-a="fade" style="top:330px;font-size:70px;color:var(--nev)">Antes de decidir,</div>
    <div class="el t1" data-in="{c['converse']}" data-a="fade" style="top:425px;font-size:78px">converse com quem entende.</div>
    <div class="el" data-in="{c['estrela2'] - 0.1:.2f}" data-a="ring" style="top:640px" id="mono6"></div>
    <div class="el" data-in="{c['estrela2'] + 0.2:.2f}" data-a="fade" style="top:960px" id="logo6"></div>
    <div class="el" data-in="{c['direito2'] - 0.1:.2f}" data-a="line" style="top:1230px;color:var(--ouro)"><div class="linha" style="width:160px"></div></div>
    <div class="el t1" data-in="{c['direito2']}" data-a="fade" style="top:1280px;font-size:52px;line-height:1.3;color:#DCE2E5">Direito para empresas<br>e desafios complexos.</div>
    <div class="el cap" data-in="{c['complexos']}" data-a="fade" style="top:1500px;font-size:28px;color:var(--nev)">estrelaneto.com.br &nbsp;·&nbsp; @estrelaneto.adv</div>
  </section>
</div>
'''

script = '''<script src="marca/brand.js"></script>
<script>
const L = 0.15;
mono3.innerHTML = EN.mono(380, "#fff");
logo3.innerHTML = EN.logo(860, "#fff");
mono6.innerHTML = EN.mono(260, "#fff");
logo6.innerHTML = EN.logo(820, "#fff");
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const XF = 0.45;
function anim(el, t) {
  const t0 = parseFloat(el.dataset.in), a = el.dataset.a;
  const d = a === "line" ? 0.8 : a === "ring" ? 1.1 : 0.75;
  const p = clamp((t - t0) / d), pe = eo(p);
  let op = pe, tf = "";
  if (a === "fade") tf = `translateY(${((1 - pe) * 36).toFixed(1)}px)`;
  if (a === "ring") tf = `scale(${(0.86 + 0.14 * pe).toFixed(4)})`;
  if (a === "line") { tf = `scaleX(${Math.max(0.01, pe).toFixed(4)})`; op = clamp(p * 3); }
  if (a === "grow") { const q = eio(clamp((t - parseFloat(el.dataset.to)) / 0.9)); tf = `scale(${(0.05 + 0.07 * pe + 0.88 * q).toFixed(4)})`; }
  op = op < 0.003 ? 0 : op;
  el.style.opacity = op.toFixed(3);
  el.style.visibility = op > 0 ? "visible" : "hidden";
  el.style.transform = tf;
}
function render(tv) {
  const t = tv - L;
  document.querySelectorAll(".scene").forEach(s => {
    const a = parseFloat(s.dataset.start), b = parseFloat(s.dataset.end);
    let op = 0;
    if (t >= a && t < b + XF) op = clamp((t - a) / XF) * (t > b ? 1 - clamp((t - b) / XF) : 1);
    if (a === 0) op = t < b ? 1 : op;
    s.style.opacity = op;
    s.style.visibility = op > 0 ? "visible" : "hidden";
    s.style.zIndex = Math.round(a * 10 + 10);
    if (op <= 0) return;
    s.style.transform = `scale(${(1.04 - 0.04 * clamp((t - a) / (b - a + XF))).toFixed(4)})`;
    s.querySelectorAll(".vid").forEach(v => v.style.transform = `translateX(${(-(t * 9) % 180).toFixed(1)}px)`);
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  });
}
window.render = render;
render(0);
</script>
</body></html>'''
(ROOT / "anuncio.html").write_text(head + cenas + script)
print("anuncio.html · duração", round(FIM, 2))
