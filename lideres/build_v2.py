#!/usr/bin/env python3
"""Líderes do Brasil - Encontro das Comunidades v2: visual cinematográfico/premium para empresários, sincronizado com audio/cues.json."""
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues.json"))
FIM = c["fim"] + 1.3
rnd = random.Random(7)

head = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Líderes - Encontro das Comunidades v2</title>
<style>
@font-face { font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }
@font-face { font-family: Mont; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: Mont; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: Mont; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
:root { --az:#3F5BFF; --az2:#6E8BFF; --royal:#3F4FA0; --ciano:#7FC4FF; --ouro:#F2C14E; --noite:#03061A; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--noite); }
#stage { position:relative; width:1080px; height:1920px; overflow:hidden; font-family:Mont, sans-serif; color:#fff; background:var(--noite); }
#bg, #fx { position:absolute; inset:0; }
.beam { position:absolute; left:50%; top:-300px; width:260px; height:2600px; margin-left:-130px; transform-origin:50% 0;
        background:linear-gradient(180deg,rgba(110,139,255,.0),rgba(110,139,255,.20) 30%,rgba(110,139,255,0) 85%); filter:blur(30px); }
.glow { position:absolute; border-radius:50%; filter:blur(120px); }
.pt { position:absolute; border-radius:50%; background:#BFD0FF; }
.grain { position:absolute; inset:0; opacity:.07; mix-blend-mode:overlay; }
.vin { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%,transparent 45%,rgba(0,0,0,.75) 100%); }
#flash { position:absolute; inset:0; background:radial-gradient(circle at 50% 45%,#fff,#8FB0FF 40%,transparent 75%); opacity:0; mix-blend-mode:screen; }
.scene { position:absolute; inset:0; opacity:0; }
.el { position:absolute; left:0; right:0; text-align:center; opacity:0; will-change:transform, opacity, filter; }
.A { font-family:Anton; text-transform:uppercase; line-height:.92; letter-spacing:.01em; }
.grad, .ouro { padding:.16em .03em; margin:-.16em -.03em; }
.grad { background:linear-gradient(180deg,#FFFFFF 35%,#A9BCFF 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.ouro { background:linear-gradient(180deg,#FFE7A6 10%,#F2C14E 55%,#C98F1E 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.out { color:transparent; -webkit-text-stroke:3px rgba(200,214,255,.9); }
.lab { font-family:Mont; font-weight:800; letter-spacing:.42em; text-transform:uppercase; }
.ch { display:inline-block; will-change:transform, opacity, filter; }
.vidro { display:inline-block; text-align:left; background:linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.04)); border:1.5px solid rgba(180,200,255,.35);
         border-radius:34px; box-shadow:0 30px 80px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.25); }
.risco { position:absolute; left:-20px; right:-20px; top:48%; height:14px; border-radius:7px; background:linear-gradient(90deg,#F2C14E,#FFE7A6); transform-origin:left; box-shadow:0 0 30px rgba(242,193,78,.8); }
.item { display:flex; align-items:center; gap:34px; padding:30px 44px; }
.item + .item { border-top:1.5px solid rgba(180,200,255,.18); }
.box { flex:none; width:84px; height:84px; border-radius:20px; border:3px solid rgba(200,214,255,.7); display:flex; align-items:center; justify-content:center; }
.item .t { font-family:Anton; font-size:84px; text-transform:uppercase; line-height:1; }
.sweep { position:absolute; inset:0; background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.65) 50%,transparent 65%); mix-blend-mode:overlay; }
</style></head><body>
<div id="stage">
<div id="bg"></div>
'''

# fundo persistente: feixes, brilhos e partículas
beams = "".join(f'<div class="beam" data-rot="{r}" data-sp="{s}"></div>' for r, s in ((-38, 1), (-12, -1), (16, 1), (40, -1)))
glows = ('<div class="glow" id="g1" style="width:900px;height:900px;left:-250px;top:-200px;background:rgba(63,91,255,.55)"></div>'
         '<div class="glow" id="g2" style="width:800px;height:800px;right:-300px;bottom:-150px;background:rgba(63,79,160,.6)"></div>')
pts = "".join(f'<div class="pt" data-x="{rnd.uniform(0, 1080):.0f}" data-y="{rnd.uniform(0, 1920):.0f}" data-v="{rnd.uniform(14, 60):.1f}" '
              f'data-ph="{rnd.uniform(0, 6.28):.2f}" style="width:{(s := rnd.choice([3, 4, 5, 8, 12]))}px;height:{s}px;opacity:{rnd.uniform(.15, .6):.2f};'
              f'filter:blur({0 if s < 6 else 3}px)"></div>' for _ in range(46))
GRAIN = ('<svg class="grain" viewBox="0 0 1080 1920"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/></filter>'
         '<rect width="1080" height="1920" filter="url(#n)"/></svg>')


def L(texto, t, cls="", st="", passo=0.035):
    """texto letra a letra (blur + subida)"""
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="letras" data-passo="{passo}" style="{st}">{texto}</div>'


def E(html, t, a="punch", st="", cls=""):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="{a}" style="{st}">{html}</div>'


CHECK = '<svg viewBox="0 0 100 100" style="width:62px;height:62px"><path class="ck" d="M18 54l20 20 44-46" fill="none" stroke="#F2C14E" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/></svg>'

itens = [("Avisa em casa", "avisa"), ("Desmarca a reunião", "desmarca"), ("Chama aquele sócio", "chama")]
lista = "".join(f'<div class="item" data-ck="{c[k] + 0.1:.2f}"><div class="box">{CHECK}</div><div class="t">{t}</div></div>' for t, k in itens)

# rede de conexões (pontos e linhas que se desenham)
nos = [(170, 260), (420, 120), (700, 230), (920, 110), (300, 470), (620, 520), (880, 430), (120, 640), (480, 720), (800, 700)]
arestas = [(0, 1), (1, 2), (2, 3), (0, 4), (4, 5), (5, 2), (5, 6), (6, 3), (4, 7), (7, 8), (8, 5), (8, 9), (9, 6), (1, 5)]
rede = ('<svg viewBox="0 0 1080 820" style="width:1080px;height:820px">' +
        "".join(f'<line class="ln" data-i="{i}" x1="{nos[a][0]}" y1="{nos[a][1]}" x2="{nos[b][0]}" y2="{nos[b][1]}" stroke="rgba(127,196,255,.55)" stroke-width="3" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/>' for i, (a, b) in enumerate(arestas)) +
        "".join(f'<circle class="no" data-i="{i}" cx="{x}" cy="{y}" r="13" fill="#fff" style="filter:drop-shadow(0 0 14px #7FC4FF)"/>' for i, (x, y) in enumerate(nos)) + '</svg>')

cenas = f'''
  <section class="scene" data-start="0" data-end="{c['sexta'] - 0.12:.2f}">
    {E('<div id="emb1" style="position:relative;display:inline-block"></div>', 0.0, "emb", "top:380px")}
    {L('FALA,', c['fala'], "A grad", "top:900px;font-size:200px", 0.05)}
    {L('LIDERANÇA!', c['lideranca'], "A ouro", "top:1090px;font-size:200px", 0.04)}
  </section>

  <section class="scene" data-start="{c['sexta'] - 0.12:.2f}" data-end="{c['dia'] - 0.1:.2f}">
    {L('SEXTA-FEIRA', c['sexta'], "A out", "top:430px;font-size:210px", 0.03)}
    {L('não é dia de ficar', c['naoe'], "", "top:720px;font-weight:800;font-size:62px;color:#C9D6FF", 0.02)}
    {E('<div style="position:relative;display:inline-block"><span class="A grad" style="font-size:122px;white-space:nowrap">PRESO NO ESCRITÓRIO</span><div class="risco" id="risco"></div></div>', c['preso'], "punch", "top:830px")}
    {E('<div class="lab" style="display:inline-block;padding:22px 46px;border:3px solid #F2C14E;border-radius:16px;font-size:58px;color:#F2C14E;transform:rotate(-5deg)">NÃO, HEIN.</div>', c['naohein'], "stamp", "top:1110px")}
  </section>

  <section class="scene" data-start="{c['dia'] - 0.1:.2f}" data-end="{c['ali'] - 0.1:.2f}">
    {E('<span class="A out" style="font-size:560px;-webkit-text-stroke:4px rgba(200,214,255,.55)">16</span>', c['dezesseis'] - 0.1, "zoomin", "top:120px")}
    {E('<span class="lab" style="font-size:44px;color:#7FC4FF">SEXTA · 16 DE OUTUBRO</span>', c['dezesseis'] + 0.2, "rise", "top:700px")}
    {E('<div class="lab" style="font-size:34px;color:#C9D6FF;margin-bottom:6px">— CONVITE —</div>', c['encontro'] - 0.1, "rise", "top:800px")}
    {L('ENCONTRO DAS', c['encontro'], "A grad", "top:880px;font-size:150px", 0.03)}
    {L('COMUNIDADES', c['comunidades'], "A grad", "top:1030px;font-size:170px;color:#fff", 0.03)}
    {E('<span class="A ouro" style="font-size:118px">LÍDERES DO BRASIL</span>', c['lideres'], "wipe", "top:1220px")}
  </section>

  <section class="scene" data-start="{c['ali'] - 0.1:.2f}" data-end="{c['quatro'] - 0.15:.2f}">
    {E(rede, c['ali'], "fade", "top:180px")}
    {L('É ALI QUE O NEGÓCIO', c['ali'], "A grad", "top:1000px;font-size:118px", 0.025)}
    {L('ACONTECE.', c['negocio'] + 0.3, "A ouro", "top:1120px;font-size:150px", 0.04)}
    {E('<span class="lab" style="font-size:40px;color:#fff">✦ CONEXÃO DE VERDADE</span>', c['conexao'], "rise", "top:1340px")}
    {E('<span class="lab" style="font-size:40px;color:#fff">✦ TROCA DE EXPERIÊNCIA</span>', c['troca'], "rise", "top:1420px")}
    {E('<span class="lab" style="font-size:32px;color:#7FC4FF;letter-spacing:.25em">COM QUEM ESTÁ NO MESMO JOGO QUE VOCÊ</span>', c['quem'], "rise", "top:1510px")}
  </section>

  <section class="scene" data-start="{c['quatro'] - 0.15:.2f}" data-end="{c['entao'] - 0.12:.2f}">
    {E('<span class="lab" style="font-size:40px;color:#7FC4FF">ANOTA NA AGENDA</span>', c['quatro'] - 0.1, "rise", "top:300px")}
    {E('<div class="vidro" style="padding:36px 56px;width:900px"><div class="lab" style="font-size:26px;color:#A9BCFF">HORÁRIO</div><div class="A grad" style="font-size:150px">16H <span class="ouro" style="font-size:96px">HAPPY HOUR</span></div></div>', c['quatro'], "glass", "top:400px")}
    {E('<div class="vidro" style="padding:36px 56px;width:900px"><div class="lab" style="font-size:26px;color:#A9BCFF">LOCAL</div><div class="A grad" style="font-size:130px">ESPAÇO RC</div><div style="font-weight:800;font-size:46px;color:#7FC4FF;margin-top:6px">Asa Sul · Brasília</div></div>', c['espaco'], "glass", "top:750px")}
    {E('<div class="vidro" style="padding:36px 56px;width:900px"><div class="lab" style="font-size:26px;color:#A9BCFF">ENDEREÇO</div><div class="A grad" style="font-size:96px">QUADRA 2</div><div style="font-weight:800;font-size:46px;color:#7FC4FF;margin-top:6px">Prédio do Hotel Bonaparte</div></div>', c['predio'], "glass", "top:1120px")}
  </section>

  <section class="scene" data-start="{c['entao'] - 0.12:.2f}" data-end="{c['quemelider'] - 0.18:.2f}">
    {L('CHECKLIST', c['checklist'], "A ouro", "top:330px;font-size:190px", 0.035)}
    {E('<span class="lab" style="font-size:40px;color:#C9D6FF">DO LÍDER PARA SEXTA</span>', c['checklist'] + 0.35, "rise", "top:530px")}
    {E(f'<div class="vidro" style="width:940px;padding:14px 0" id="lista">{lista}</div>', c['avisa'] - 0.35, "glass", "top:680px")}
  </section>

  <section class="scene" data-start="{c['quemelider'] - 0.18:.2f}" data-end="{c['bora'] - 0.1:.2f}" data-escuro="1">
    {L('QUEM É LÍDER,', c['quemelider'], "A", "top:720px;font-size:150px;color:#fff", 0.03)}
    {L('APARECE.', c['aparece'], "A ouro", "top:890px;font-size:230px", 0.06)}
  </section>

  <section class="scene" data-start="{c['bora'] - 0.1:.2f}" data-end="{FIM + 1}">
    {E('<div id="emb2" style="position:relative;display:inline-block"></div>', c['bora'], "emb", "top:230px")}
    {L('BORA FORTALECER', c['bora'], "A grad", "top:690px;font-size:132px", 0.022)}
    {L('O MOVIMENTO!', c['movimento'], "A ouro", "top:830px;font-size:170px", 0.035)}
    {E('<div class="vidro" style="padding:26px 50px;text-align:center"><div class="A grad" style="font-size:78px">SEXTA · 16/10 · 16H</div><div style="font-weight:800;font-size:34px;color:#7FC4FF;margin-top:8px;white-space:nowrap">Espaço RC – Asa Sul · Prédio Hotel Bonaparte</div></div>', c['tevejo'] - 0.25, "glass", "top:1080px")}
    {E('<span class="lab" style="font-size:52px;color:#fff">TE VEJO LÁ.</span>', c['tevejo'] + 0.25, "rise", "top:1390px")}
    {E('<span class="lab" style="font-size:26px;color:#7C8BC4">SERVIR · CONECTAR · FORTALECER</span>', c['tevejo'] + 0.6, "rise", "top:1500px")}
  </section>
'''

cortes = [c[k] - 0.1 for k in ("sexta", "dia", "ali", "quatro", "entao", "bora")]
fim_html = f'''<div id="fx">{GRAIN}<div class="vin"></div><div id="flash"></div></div>
</div>
<script src="emblema.js"></script>
<script>
const L = 0.15, C = {json.dumps(c)}, CORTES = {json.dumps(cortes)};
document.getElementById("bg").innerHTML = `{glows}{beams}{pts}`;
const embHTML = s => `<div style="position:absolute;inset:-60px;border-radius:50%;background:radial-gradient(circle,rgba(63,91,255,.65),transparent 70%);filter:blur(20px)"></div>`
  + `<div style="position:relative;width:${{s}}px;height:${{s}}px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px rgba(190,205,255,.35),0 30px 90px rgba(0,0,0,.6)">${{EMB(s, "#3F4FA0")}}<div class="sweep"></div></div>`;
emb1.innerHTML = embHTML(400); emb2.innerHTML = embHTML(330);
// quebra em letras
document.querySelectorAll('[data-a="letras"]').forEach(el => {{
  const cls = ["grad", "ouro", "out"].filter(k => el.classList.contains(k)); cls.forEach(k => el.classList.remove(k));
  el.innerHTML = [...el.textContent].map(ch => ch === " " ? " " : `<span class="ch ${{cls.join(" ")}}">${{ch}}</span>`).join("");
}});
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3);
const eo5 = x => 1 - Math.pow(1 - x, 5);
const back = (x, k = 1.6) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);
const XF = 0.16;
function anim(el, t) {{
  const t0 = parseFloat(el.dataset.in), a = el.dataset.a;
  if (a === "letras") {{
    const passo = parseFloat(el.dataset.passo); let vis = false;
    el.querySelectorAll(".ch").forEach((s, i) => {{
      const p = clamp((t - t0 - i * passo) / 0.38), pe = eo5(p);
      s.style.opacity = pe.toFixed(3);
      s.style.transform = `translateY(${{((1 - pe) * 70).toFixed(1)}}px) scale(${{(1 + (1 - pe) * .25).toFixed(3)}})`;
      s.style.filter = p < 1 ? `blur(${{((1 - pe) * 14).toFixed(1)}}px)` : "none";
      if (p > 0) vis = true;
    }});
    el.style.opacity = vis ? 1 : 0; el.style.visibility = vis ? "visible" : "hidden"; return;
  }}
  const d = {{punch: .45, stamp: .3, zoomin: .9, wipe: .6, rise: .5, glass: .6, emb: 1.0, fade: .8}}[a] || .5;
  const p = clamp((t - t0) / d), pe = eo5(p);
  let op = pe, tf = "", fl = "", cp = "";
  if (a === "punch") {{ tf = `scale(${{(1 + (1 - pe) * .35).toFixed(4)}})`; fl = p < 1 ? `blur(${{((1 - pe) * 16).toFixed(1)}}px)` : ""; }}
  if (a === "stamp") {{ op = clamp(p * 4); tf = `scale(${{(1 + (1 - eo(p)) * 1.6).toFixed(4)}})`; }}
  if (a === "zoomin") {{ tf = `scale(${{(1.5 - .5 * pe + .04 * clamp((t - t0) / 3)).toFixed(4)}})`; op = pe * .9; fl = p < 1 ? `blur(${{((1 - pe) * 20).toFixed(1)}}px)` : ""; }}
  if (a === "wipe") {{ op = clamp(p * 5); cp = `inset(-60px ${{((1 - pe) * 100).toFixed(1)}}% -60px -20px)`; }}
  if (a === "rise") tf = `translateY(${{((1 - pe) * 40).toFixed(1)}}px)`;
  if (a === "fade") op = pe;
  if (a === "glass") {{ tf = `translateY(${{((1 - pe) * 120).toFixed(1)}}px) rotateX(${{((1 - pe) * 35).toFixed(1)}}deg)`; fl = p < 1 ? `blur(${{((1 - pe) * 10).toFixed(1)}}px)` : ""; }}
  if (a === "emb") {{ tf = `scale(${{(0.6 + 0.4 * back(p)).toFixed(4)}}) rotate(${{((1 - pe) * -45).toFixed(1)}}deg)`; op = clamp(p * 2.5);
    const sw = el.querySelector(".sweep"); if (sw) sw.style.transform = `translateX(${{(-140 + 280 * clamp((t - t0 - .5) / .9)).toFixed(0)}}%)`; }}
  op = op < 0.003 ? 0 : op;
  el.style.opacity = op.toFixed(3); el.style.visibility = op > 0 ? "visible" : "hidden";
  el.style.transform = tf; el.style.filter = fl || "none"; el.style.clipPath = cp || "none";
}}
function render(tv) {{
  const t = tv - L;
  // fundo vivo
  document.querySelectorAll(".beam").forEach((b, i) => b.style.transform = `rotate(${{(parseFloat(b.dataset.rot) + Math.sin(t * .35 + i) * 9 * b.dataset.sp).toFixed(2)}}deg)`);
  g1.style.transform = `translate(${{(Math.sin(t * .3) * 120).toFixed(0)}}px,${{(Math.cos(t * .25) * 160).toFixed(0)}}px)`;
  g2.style.transform = `translate(${{(Math.cos(t * .28) * 140).toFixed(0)}}px,${{(Math.sin(t * .22) * 120).toFixed(0)}}px)`;
  document.querySelectorAll(".pt").forEach(p => {{
    const y = ((+p.dataset.y - t * +p.dataset.v) % 1920 + 1920) % 1920, x = +p.dataset.x + Math.sin(t * .6 + +p.dataset.ph) * 24;
    p.style.transform = `translate(${{x.toFixed(1)}}px,${{y.toFixed(1)}}px)`;
  }});
  let fo = 0; CORTES.forEach(k => {{ const q = t - k; if (q > -0.06 && q < 0.35) fo = Math.max(fo, q < 0 ? (q + .06) / .06 * .55 : .55 * (1 - q / .35)); }});
  flash.style.opacity = fo.toFixed(3);
  const escuro = document.querySelector('[data-escuro]'), ea = parseFloat(escuro.dataset.start), eb = parseFloat(escuro.dataset.end);
  bg.style.opacity = (t > ea && t < eb + .2) ? (.25).toString() : "1";
  document.querySelectorAll(".scene").forEach(s => {{
    const a = parseFloat(s.dataset.start), b = parseFloat(s.dataset.end);
    let op = 0;
    if (t >= a && t < b + XF) op = clamp((t - a) / XF) * (t > b ? 1 - clamp((t - b) / XF) : 1);
    if (a === 0) op = t < b ? 1 : op;
    s.style.opacity = op; s.style.visibility = op > 0 ? "visible" : "hidden"; s.style.zIndex = Math.round(a * 10 + 10);
    if (op <= 0) return;
    const sa = eo(clamp((t - a) / .6)), out = t > b ? clamp((t - b) / XF) : 0;
    s.style.transform = `scale(${{(1.08 - .08 * sa + .02 * clamp((t - a) / 6) + out * .12).toFixed(4)}})`;
    s.style.filter = out > 0 ? `blur(${{(out * 14).toFixed(1)}}px)` : "none";
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  }});
  const r = document.getElementById("risco"); if (r) r.style.transform = `scaleX(${{eo(clamp((t - C.naohein + .25) / .3)).toFixed(3)}})`;
  document.querySelectorAll(".ln").forEach(l => l.style.strokeDashoffset = (1 - eo(clamp((t - C.ali - .1 - l.dataset.i * .12) / .5))).toFixed(3));
  document.querySelectorAll(".no").forEach(n => {{ const p = eo(clamp((t - C.ali - n.dataset.i * .1) / .35)); n.setAttribute("r", (13 * p + 2 * Math.sin(t * 3 + +n.dataset.i) * p).toFixed(1)); }});
  document.querySelectorAll(".item").forEach(it => {{
    const p = eo(clamp((t - parseFloat(it.dataset.ck)) / .35));
    it.querySelector(".ck").style.strokeDashoffset = (1 - p).toFixed(3);
    it.querySelector(".box").style.borderColor = p > .1 ? "#F2C14E" : "rgba(200,214,255,.7)";
    it.querySelector(".box").style.boxShadow = p > .1 ? `0 0 ${{(30 * p).toFixed(0)}}px rgba(242,193,78,.7)` : "none";
    it.querySelector(".t").style.color = p > .1 ? "#fff" : "rgba(255,255,255,.45)";
  }});
}}
window.render = render;
render(0);
</script>
</body></html>'''
(ROOT / "anuncio_v2.html").write_text(head + cenas + fim_html)
print("anuncio_v2.html · duração", round(FIM, 2))
