#!/usr/bin/env python3
"""JL Fitness - criativo de tráfego para condomínios de Águas Claras. Cenas sincronizadas com audio/cues.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues.json"))
c.setdefault("bora_fala", c.get("bora_fala", c["bora"]))
c["bora"] = c["imagina"]                            # a batida volta forte no "Agora imagina"
json.dump(c, open(ROOT / "audio/cues.json", "w"), indent=1)
FIM = c["fim"] + 1.9

AM, PR = "#FFE100", "#0B0B0B"

head = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>JL Fitness - Águas Claras</title>
<style>
@font-face { font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
:root { --am:#FFE100; --pr:#0B0B0B; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--pr); }
#stage { position:relative; width:1080px; height:1920px; overflow:hidden; font-family:M, sans-serif; color:#fff; background:var(--pr); }
.scene { position:absolute; inset:0; opacity:0; overflow:hidden; }
.el { position:absolute; left:60px; right:60px; text-align:center; opacity:0; will-change:transform, opacity, filter; }
.A { font-family:Anton; line-height:.95; text-transform:uppercase; }
.T { font-weight:800; letter-spacing:.3em; text-transform:uppercase; }
.amarelo { background:var(--am); }
.listras { position:absolute; inset:0; background:repeating-linear-gradient(-45deg, rgba(0,0,0,.06) 0 26px, transparent 26px 52px); }
.tag { display:inline-block; background:var(--pr); color:var(--am); font-family:Anton; text-transform:uppercase; padding:10px 34px 16px; transform:skewX(-10deg); }
.tag > span { display:inline-block; transform:skewX(10deg); }
.tagA { display:inline-block; background:var(--am); color:var(--pr); font-family:Anton; text-transform:uppercase; padding:10px 34px 16px; transform:skewX(-10deg); }
.tagA > span { display:inline-block; transform:skewX(10deg); }
.foto { position:relative; overflow:hidden; border:10px solid #fff; box-shadow:0 30px 70px rgba(0,0,0,.45); background:#222; }
.foto .ph { position:absolute; inset:-4%; background-size:cover; background-position:center; }
.w { display:inline-block; overflow:hidden; vertical-align:top; padding:.12em .03em .12em; margin:-.12em -.03em -.12em; }
.w > span { display:inline-block; }
#flash { position:absolute; inset:0; background:#fff; opacity:0; z-index:600; }
.grao { position:absolute; inset:0; z-index:550; pointer-events:none; background:radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.35) 100%); }
</style></head><body><div id="stage">
'''


def Wd(texto, t, st="", cls="A", passo=0.07):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="palavras" data-passo="{passo}" style="{st}">{texto}</div>'


def E(html, t, a="up", st="", cls=""):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="{a}" style="{st}">{html}</div>'


def foto(arq, w, h, pos="center", rot=0):
    return (f'<div class="foto" style="width:{w}px;height:{h}px;margin:0 auto;transform:rotate({rot}deg)">'
            f'<div class="ph kb" style="background-image:url(assets/{arq});background-position:{pos}"></div></div>')


def logo(esc=1.0, fundo=PR):
    """Logo JL Fitness redesenhado: selo amarelo com a silhueta + JL FITNESS em Anton + faixa inclinada."""
    s = esc
    return (f'<div style="display:inline-flex;align-items:stretch;transform:scale({s});transform-origin:center;border:5px solid {PR};border-radius:27px;box-shadow:0 18px 40px rgba(0,0,0,.35)">'
            f'<div style="width:190px;height:170px;background:{AM};border-radius:22px 0 0 22px;display:flex;align-items:center;justify-content:center">'
            f'<img src="assets/silhueta.png" style="width:160px"></div>'
            f'<div style="display:flex;flex-direction:column;justify-content:center;background:#fff;border-radius:0 22px 22px 0;padding:0 34px 0 26px">'
            f'<div class="A" style="font-size:104px;color:{PR};letter-spacing:.01em;line-height:1">JL FITNESS</div>'
            f'<div style="background:{PR};color:#fff;font-weight:800;font-size:25px;letter-spacing:.24em;padding:6px 16px;margin-top:4px;transform:skewX(-12deg)">'
            f'<span style="display:inline-block;transform:skewX(12deg)">ASSESSORIA ESPORTIVA</span></div></div></div>')


# skyline de Águas Claras: torres altas
torres = ""
x = -20
alt = [880, 1120, 760, 1300, 980, 1180, 820, 1240, 940, 700]
for i, h in enumerate(alt):
    w = 96 + (i * 37) % 60
    jan = "".join(f'<div style="position:absolute;left:{14 + (k % 3) * (w - 28) // 3}px;top:{30 + (k // 3) * 54}px;width:{(w - 40) // 3}px;height:26px;background:rgba(255,225,0,{0.55 if (k * 7 + i) % 5 else 0.0})"></div>'
                  for k in range(3 * (h // 54 - 1)))
    torres += f'<div class="torre" data-i="{i}" style="position:absolute;bottom:0;left:{x}px;width:{w}px;height:{h}px;background:#151515;border-top:6px solid #2a2a2a">{jan}</div>'
    x += w + 14

ACADEMIA = f'''<svg viewBox="0 0 900 620" style="width:900px">
  <rect x="0" y="0" width="900" height="620" rx="24" fill="#1d1d1d"/>
  <rect x="0" y="470" width="900" height="150" fill="#262626"/>
  <rect x="40" y="40" width="300" height="200" rx="8" fill="#2c2c2c" stroke="#3a3a3a" stroke-width="6"/>
  <line x1="40" y1="140" x2="340" y2="140" stroke="#3a3a3a" stroke-width="6"/><line x1="190" y1="40" x2="190" y2="240" stroke="#3a3a3a" stroke-width="6"/>
  <g stroke="#555" stroke-width="14" stroke-linecap="round" fill="none">
    <path d="M90 470 L150 330 L320 330"/><path d="M80 470 L360 470"/><path d="M300 330 L330 250 L380 250"/>
  </g>
  <g fill="#555"><rect x="520" y="380" width="260" height="22" rx="8"/><rect x="500" y="350" width="34" height="84" rx="8"/><rect x="766" y="350" width="34" height="84" rx="8"/>
    <rect x="600" y="402" width="20" height="70"/><rect x="680" y="402" width="20" height="70"/></g>
  <path d="M640 40 L640 110 M600 70 Q640 140 680 70" stroke="#4a4a4a" stroke-width="3" fill="none"/>
  <g stroke="#3d3d3d" stroke-width="2" fill="none"><path d="M820 20 L900 20 M840 20 L900 90 M860 20 L900 55 M820 20 Q860 50 900 40"/></g>
</svg>'''

ESTEIRA = f'''<svg viewBox="0 0 700 520" style="width:700px">
  <g stroke="#9a9a9a" stroke-width="16" stroke-linecap="round" fill="none"><path d="M120 440 L210 220 L470 220"/><path d="M80 440 L620 440"/><path d="M430 220 L470 120 L540 120"/></g>
  <rect x="60" y="430" width="580" height="40" rx="14" fill="#6f6f6f"/>
  <g id="roupa"><path d="M430 100 L470 60 L510 100" stroke="{AM}" stroke-width="8" fill="none"/>
   <path d="M380 120 L440 100 L470 120 L500 100 L560 120 L590 200 L550 215 L540 180 L540 330 L400 330 L400 180 L390 215 L350 200 Z" fill="#E8E8E8"/>
   <path d="M330 150 L400 140 L470 160 L520 150 L540 300 L320 300 Z" fill="#7a9cc6" opacity=".9"/></g>
</svg>'''

dor = [("FALTA TEMPO", "falta"), ("FALTA ÂNIMO", "animo")]
cenas = f'''
  <section class="scene" data-start="0" data-end="{c['paga'] - 0.15:.2f}">
    <div class="amarelo" style="position:absolute;inset:0"></div><div class="listras"></div>
    <div id="sky" style="position:absolute;left:0;right:0;bottom:0;height:1320px">{torres}</div>
    {E('<span class="tag" style="font-size:80px"><span>ATENÇÃO,</span></span>', c['atencao'], "slam", "top:150px")}
    {Wd('morador de', c['aguas'] - 0.35, f"top:320px;font-size:90px;color:{PR}", "A", 0.06)}
    {Wd('Águas Claras!', c['aguas'], f"top:420px;font-size:168px;color:{PR}", "A", 0.08)}
  </section>

  <section class="scene" data-start="{c['paga'] - 0.15:.2f}" data-end="{c['falta'] - 0.12:.2f}">
    <div style="position:absolute;inset:0;background:#141414"></div>
    {Wd('Você paga condomínio', c['paga'], "top:200px;font-size:96px;color:#fff", "A", 0.06)}
    {E('<span class="tagA" style="font-size:120px"><span>CARO</span></span>', c['caro'], "slam", "top:320px")}
    {Wd('tem academia no prédio...', c['academia'], "top:540px;font-size:76px;color:#cfcfcf", "A", 0.06)}
    {E(ACADEMIA, c['academia'] + 0.2, "rise", "top:700px")}
    {E('<div class="A" style="font-size:118px;color:#fff;white-space:nowrap">E ELA VIVE <span style="color:var(--am)">VAZIA?</span></div>', c['vazia'], "slam", "top:1380px")}
    {E('<div style="display:inline-flex;align-items:center;gap:18px;background:#000;border:3px solid #333;border-radius:60px;padding:12px 30px;font-weight:800;font-size:34px;color:#bbb">● AGORA NA ACADEMIA: <span style="color:#ff4d4d">0 PESSOAS</span></div>', c['vazia'] + 0.4, "pop", "top:1590px")}
  </section>

  <section class="scene" data-start="{c['falta'] - 0.12:.2f}" data-end="{c['imagina'] - 0.12:.2f}">
    <div style="position:absolute;inset:0;background:#141414"></div>
    {"".join(E(f'<span class="tagA" style="font-size:96px;transform:skewX(-10deg) rotate({-4 + 7 * i}deg)"><span>{t}</span></span>', c[k], "slam", f"top:{200 + i * 190}px") for i, (t, k) in enumerate(dor))}
    {E(ESTEIRA, c['esteira'], "rise", "top:640px")}
    {Wd('e a esteira virou', c['esteira'], "top:1240px;font-size:96px;color:#fff", "A", 0.06)}
    {E('<div class="A" style="font-size:200px;color:var(--am)">CABIDE.</div>', c['cabide'], "slam", "top:1350px")}
  </section>

  <section class="scene" data-start="{c['imagina'] - 0.12:.2f}" data-end="{c['jl'] - 0.12:.2f}">
    <div class="amarelo" style="position:absolute;inset:0"></div><div class="listras"></div>
    {Wd('Agora imagina', c['imagina'], f"top:120px;font-size:110px;color:{PR}", "A", 0.07)}
    {E(foto("f_grupo1.jpg", 820, 620, "center 40%", -3), c['imagina'] + 0.25, "rise", "top:300px")}
    {E('<span class="tag" style="font-size:66px"><span>SEM SAIR DO CONDOMÍNIO</span></span>', c['condominio'] - 0.4, "slam", "top:960px")}
    {E(foto("f_grupo2.jpg", 470, 560, "center 40%", 4), c['professor'] - 0.2, "rise", "top:1110px;left:500px;right:40px")}
    {E('<div class="A" style="font-size:78px;color:#0B0B0B;text-align:left;line-height:1.02">COM<br>PROFESSOR<br>DO SEU LADO</div>', c['professor'], "slideL", "top:1170px;left:70px;right:560px;text-align:left")}
    {E('<div class="A" style="font-size:78px;color:#0B0B0B;text-align:left;line-height:1.02">E A TURMA<br>DOS VIZINHOS<br>JUNTO</div>', c['vizinhos'], "slideL", "top:1470px;left:70px;right:560px;text-align:left")}
  </section>

  <section class="scene" data-start="{c['jl'] - 0.12:.2f}" data-end="{c['mostra'] - 0.12:.2f}">
    <div style="position:absolute;inset:0;background:#0B0B0B"></div>
    <div style="position:absolute;left:-200px;right:-200px;top:0;height:560px;background:var(--am);transform:skewY(-6deg);transform-origin:left"></div>
    {E(logo(0.98), c['jl'] - 0.05, "pop", "top:150px")}
    {E('<div class="T" style="font-size:34px;color:#0B0B0B;letter-spacing:.2em">leva pra dentro do seu prédio</div>', c['jl'] + 0.6, "up", "top:390px")}
    {E(foto("f_leques.jpg", 330, 440, "center 40%", -4), c['grupo'], "rise", "top:620px;left:40px;right:710px")}
    {E(foto("f_setembro.jpg", 330, 440, "center 0%", 2), c['danca'], "rise", "top:600px;left:375px;right:375px")}
    {E(foto("f_along.jpg", 330, 440, "center 50%", 5), c['along'], "rise", "top:630px;left:710px;right:40px")}
    {E('<span class="tagA" style="font-size:62px"><span>AULAS EM GRUPO</span></span>', c['grupo'], "slam", "top:1140px")}
    {E('<span class="tagA" style="font-size:62px"><span>DANÇA</span></span>', c['danca'], "slam", "top:1260px")}
    {E('<span class="tagA" style="font-size:62px"><span>ALONGAMENTO</span></span>', c['along'], "slam", "top:1380px")}
    {E('<div class="A" style="font-size:104px;color:#fff">PRA <span style="color:var(--am)">TODAS AS IDADES</span></div>', c['idades'] - 0.3, "slam", "top:1560px")}
  </section>

  <section class="scene" data-start="{c['mostra'] - 0.12:.2f}" data-end="{FIM + 1}">
    <div class="amarelo" style="position:absolute;inset:0"></div><div class="listras"></div>
    {Wd('Mostra esse vídeo', c['mostra'], f"top:150px;font-size:110px;color:{PR}", "A", 0.07)}
    {E('<span class="tag" style="font-size:120px"><span>PRO SEU SÍNDICO</span></span>', c['sindico'] - 0.1, "slam", "top:290px")}
    {E(foto("f_senhoras.jpg", 860, 560, "center 40%", -2), c['sindico'] + 0.2, "rise", "top:520px")}
    {E(logo(0.92), c['chama'], "pop", "top:1170px")}
    {E('<div style="display:inline-flex;align-items:center;gap:20px;background:#0B0B0B;border-radius:80px;padding:22px 44px">'
       '<svg viewBox="0 0 24 24" style="width:64px;height:64px;fill:none;stroke:#FFE100;stroke-width:2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="#FFE100"/></svg>'
       '<span style="font-weight:800;font-size:40px;color:#fff">@jlfitnessassessoriaesportiva</span></div>', c['insta'] - 0.2, "pop", "top:1420px")}
    {E('<div class="A" style="font-size:120px;color:#0B0B0B">BORA SE MOVIMENTAR!</div>', c['bora_fala'], "slam", "top:1600px")}
  </section>
'''

script = f'''
<div class="grao"></div><div id="flash"></div></div>
<script>
const L = 0.15, C = {json.dumps(c)};
const FL = [C.imagina, C.jl, C.mostra];
document.querySelectorAll('[data-a="palavras"]').forEach(el => {{
  const tmp = document.createElement("div"); tmp.innerHTML = el.innerHTML; let out = "";
  const walk = (node, cls) => node.childNodes.forEach(n => {{
    if (n.nodeType === 3) n.textContent.split(/(\\s+)/).forEach(p => {{ if (!p) return; out += /^\\s+$/.test(p) ? " " : `<span class="w"><span${{cls ? ` class="${{cls}}"` : ""}}>${{p}}</span></span>`; }});
    else walk(n, n.className || cls);
  }});
  walk(tmp, ""); el.innerHTML = out;
}});
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3), eo5 = x => 1 - Math.pow(1 - x, 5);
const back = (x, k = 1.7) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);
const XF = 0.12;
function anim(el, t) {{
  const t0 = parseFloat(el.dataset.in), a = el.dataset.a;
  if (a === "palavras") {{
    const passo = parseFloat(el.dataset.passo); let vis = false;
    el.querySelectorAll(".w > span").forEach((s, i) => {{
      const p = clamp((t - t0 - i * passo) / 0.38), pe = eo5(p);
      s.style.transform = `translateY(${{((1 - pe) * 115).toFixed(1)}}%)`;
      if (p > 0) vis = true;
    }});
    el.style.opacity = vis ? 1 : 0; el.style.visibility = vis ? "visible" : "hidden"; return;
  }}
  const d = {{pop: .38, slam: .26, up: .45, rise: .6, slideL: .45}}[a] || .5;
  const p = clamp((t - t0) / d), pe = eo(p);
  let op = (a === "pop" || a === "slam") ? clamp(p * 4) : pe, tf = "", fl = "";
  if (a === "pop") tf = `scale(${{Math.max(.02, back(p)).toFixed(4)}})`;
  if (a === "slam") {{ tf = `scale(${{(1 + (1 - pe) * 1.4).toFixed(4)}})`; fl = p < 1 ? `blur(${{((1 - pe) * 7).toFixed(1)}}px)` : ""; }}
  if (a === "up") tf = `translateY(${{((1 - pe) * 60).toFixed(1)}}px)`;
  if (a === "rise") tf = `translateY(${{((1 - eo5(p)) * 260).toFixed(1)}}px)`;
  if (a === "slideL") tf = `translateX(${{((1 - eo5(p)) * -200).toFixed(1)}}px)`;
  op = op < 0.003 ? 0 : op;
  el.style.opacity = op.toFixed(3); el.style.visibility = op > 0 ? "visible" : "hidden"; el.style.transform = tf; el.style.filter = fl || "none";
}}
function render(tv) {{
  const t = tv - L;
  let fo = 0; FL.forEach(k => {{ const q = t - k; if (q > 0 && q < .2) fo = Math.max(fo, .45 * (1 - q / .2)); }});
  flash.style.opacity = fo.toFixed(3);
  document.querySelectorAll(".scene").forEach(s => {{
    const a = parseFloat(s.dataset.start), b = parseFloat(s.dataset.end);
    let op = 0;
    if (t >= a && t < b + XF) op = clamp((t - a) / XF) * (t > b ? 1 - clamp((t - b) / XF) : 1);
    if (a === 0) op = t < b ? 1 : op;
    s.style.opacity = op; s.style.visibility = op > 0 ? "visible" : "hidden"; s.style.zIndex = Math.round(a * 10 + 10);
    if (op <= 0) return;
    s.style.transform = `scale(${{(1.06 - .06 * eo(clamp((t - a) / .35))).toFixed(4)}})`;
    s.querySelectorAll(".kb").forEach(k => k.style.transform = `scale(${{(1.03 + .07 * clamp((t - a) / 6)).toFixed(4)}})`);
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  }});
  document.querySelectorAll(".torre").forEach(tr => {{
    const i = +tr.dataset.i, p = eo5(clamp((t - .05 - i * .07) / .7));
    tr.style.transform = `translateY(${{((1 - p) * 110).toFixed(1)}}%)`;
  }});
  const r = document.getElementById("roupa");
  if (r) {{ const p = eo5(clamp((t - C.cabide + .1) / .5)); r.setAttribute("transform", `translate(0 ${{(-260 * (1 - p)).toFixed(1)}})`); r.style.opacity = p; }}
}}
window.render = render;
render(0);
</script>
</body></html>'''
(ROOT / "anuncio.html").write_text(head + cenas + script)
print("anuncio.html · duração", round(FIM, 2))
