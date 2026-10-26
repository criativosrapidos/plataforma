#!/usr/bin/env python3
"""Nanoz Consultoria · vídeo-prévia (proposta da Criativos Rápidos). Cenas sincronizadas com audio/cues.json.
Gera video.html (render(t) determinístico) para captura quadro a quadro."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues.json"))
L = 0.3                                    # a voz entra 0,3 s depois do início
FIM_VOZ = c["fim"]
CARD = FIM_VOZ + 0.5                       # cartão "prévia criada pela Criativos Rápidos"
DUR = CARD + 3.2
NAVY, NAVY2, OURO, OURO2 = "#16274D", "#0E1A36", "#BEA876", "#E3D3A6"
W, H = open(ROOT / "assets/nz_path.txt").readline().split()
NZ_D = open(ROOT / "assets/nz_path.txt").read().split("\n", 1)[1]


def nz(w, cor=OURO):
    return f'<svg viewBox="0 0 {W} {H}" style="width:{w}px;display:block;margin:0 auto"><path d="{NZ_D}" fill="{cor}"/></svg>'


def logo(w=520, cor_txt="#fff"):
    return (f'<div style="display:flex;flex-direction:column;align-items:center">{nz(w)}'
            f'<div style="margin-top:{int(w * .16)}px;font-weight:600;letter-spacing:.42em;padding-left:.42em;font-size:{int(w * .135)}px;color:{OURO}">NANOZ</div>'
            f'<div style="font-weight:400;letter-spacing:.08em;font-size:{int(w * .15)}px;color:{cor_txt};margin-top:2px">Consultoria</div></div>')


def E(html, t, a="up", st=""):
    return f'<div class="el" data-in="{t:.2f}" data-a="{a}" style="{st}">{html}</div>'


def Wd(texto, t, st="", passo=0.07):
    return f'<div class="el" data-in="{t:.2f}" data-a="palavras" data-passo="{passo}" style="{st}">{texto}</div>'


CR_IC = ('<svg viewBox="0 0 40 40" style="width:{s}px"><g fill="#0B0B0B"><rect x="4" y="12" width="9" height="3.2" rx="1.6"/>'
         '<rect x="2" y="18.4" width="11" height="3.2" rx="1.6"/><rect x="4" y="24.8" width="9" height="3.2" rx="1.6"/><path d="M16 9 L35 20 L16 31 Z"/></g></svg>')


def cr_badge(esc=1.0, cor="#fff"):
    s = esc
    return (f'<div style="display:inline-flex;align-items:center;gap:{int(12 * s)}px">'
            f'<div style="width:{int(58 * s)}px;height:{int(58 * s)}px;background:#FFD400;border-radius:{int(13 * s)}px;display:flex;align-items:center;justify-content:center">{CR_IC.format(s=int(40 * s))}</div>'
            f'<div style="text-align:left;line-height:1.02"><div style="font-weight:500;font-size:{int(27 * s)}px;color:{cor}">criativos</div>'
            f'<div style="font-weight:800;font-style:italic;font-size:{int(29 * s)}px;color:#FFD400">rápidos</div></div></div>')


# gráfico: linha parada (cena 1) e linha que sobe (cena 2)
PTS_PARADO = [(0, 300), (120, 304), (240, 298), (360, 312), (480, 318), (600, 330), (720, 342), (840, 356)]
PTS_SOBE = [(0, 330), (120, 300), (240, 310), (360, 250), (480, 220), (600, 160), (720, 110), (840, 40)]
poly = lambda pts: " ".join(f"{x},{y}" for x, y in pts)

GRAF1 = f'''<svg viewBox="-20 0 880 400" style="width:900px">
  <g stroke="rgba(190,168,118,.16)" stroke-width="2">{"".join(f'<line x1="0" x2="840" y1="{y}" y2="{y}"/>' for y in (60, 160, 260, 360))}</g>
  <polyline class="linha" data-t="{c['nao'] - .2:.2f}" points="{poly(PTS_PARADO)}" fill="none" stroke="#8C96AD" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

barras = "".join(f'<rect class="barra" data-t="{c["multiplicar"] - .3 + i * .09:.2f}" data-h="{h}" x="{30 + i * 120}" y="380" width="70" height="0" rx="10" fill="{OURO if i == 6 else "rgba(190,168,118,.45)"}"/>'
                 for i, h in enumerate((70, 95, 120, 160, 205, 260, 330)))
GRAF2 = f'''<svg viewBox="0 0 880 400" style="width:900px">
  {barras}
  <polyline class="linha" data-t="{c['multiplicar'] + .1:.2f}" points="{poly(PTS_SOBE)}" fill="none" stroke="{OURO2}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <circle class="ponto" data-t="{c['multiplicar'] + 1.0:.2f}" cx="840" cy="40" r="18" fill="{OURO2}"/>
</svg>'''

# prédios (imóveis que geram renda)
predios = ""
for i, (x, w_, h_) in enumerate(((40, 200, 520), (270, 230, 700), (530, 180, 450), (740, 220, 600))):
    jan = "".join(f'<rect class="jan" data-t="{c["renda"] + ((k * 7 + i * 3) % 11) * .06:.2f}" x="{x + 26 + (k % 3) * (w_ - 52) // 3}" y="{900 - h_ + 40 + (k // 3) * 70}" width="{(w_ - 52) // 3 - 16}" height="38" rx="4" fill="{OURO}" opacity="0"/>'
                  for k in range(3 * ((h_ - 80) // 70)))
    predios += f'<g class="predio" data-i="{i}"><rect x="{x}" y="{900 - h_}" width="{w_}" height="{h_}" rx="10" fill="#22365F"/>{jan}</g>'
PREDIOS = f'<svg viewBox="0 0 1000 900" style="width:960px">{predios}<rect x="0" y="896" width="1000" height="8" fill="{OURO}" opacity=".6"/></svg>'

# BR & exterior: dois cartões com pin
def pin():
    return (f'<svg viewBox="0 0 60 80" style="width:70px"><path d="M30 78 C12 52 4 40 4 28 A26 26 0 0 1 56 28 C56 40 48 52 30 78 Z" fill="{OURO}"/>'
            f'<circle cx="30" cy="28" r="10" fill="{NAVY}"/></svg>')


def cartao(tit, sub):
    return (f'<div style="display:flex;align-items:center;gap:30px;background:rgba(255,255,255,.06);border:2px solid rgba(190,168,118,.45);border-radius:30px;padding:34px 44px;text-align:left">'
            f'{pin()}<div><div style="font-weight:700;font-size:58px;color:#fff">{tit}</div><div style="font-weight:400;font-size:34px;color:{OURO2};margin-top:6px">{sub}</div></div></div>')


CAL = f'''<svg viewBox="0 0 300 300" style="width:300px">
  <rect x="20" y="40" width="260" height="240" rx="28" fill="none" stroke="{OURO}" stroke-width="12"/>
  <rect x="20" y="40" width="260" height="70" rx="28" fill="{OURO}"/><rect x="20" y="80" width="260" height="30" fill="{OURO}"/>
  <rect x="80" y="14" width="18" height="56" rx="9" fill="{OURO2}"/><rect x="202" y="14" width="18" height="56" rx="9" fill="{OURO2}"/>
  <path class="check" data-t="{c['gratuita'] - .3:.2f}" d="M90 190 L135 235 L215 150" fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

ser = lambda t: f'<span style="font-family:PF;font-style:italic;font-weight:700;color:{OURO2};text-transform:none">{t}</span>'

cenas = f'''
<section class="scene" data-start="0" data-end="{c['na'] - .05:.2f}">
  {Wd("Dinheiro parado...", c['dinheiro'], "top:330px;font-size:120px;font-weight:800;color:#fff", .1)}
  {E(GRAF1, c['nao'] - .3, "fade", "top:720px")}
  {Wd(f"não {ser('trabalha')} por você.", c['nao'], "top:1260px;font-size:96px;font-weight:700;color:#fff", .09)}
</section>

<section class="scene" data-start="{c['na'] - .05:.2f}" data-end="{c['estrategia'] - .1:.2f}">
  {E(logo(560), c['nanoz'] - .15, "pop", "top:600px")}
</section>

<section class="scene" data-start="{c['estrategia'] - .1:.2f}" data-end="{c['imoveis'] - .1:.2f}">
  {E(f'<span class="tag">ESTRATÉGIA</span>', c['estrategia'], "pop", "top:260px")}
  {Wd(f"pra multiplicar o seu {ser('patrimônio')}", c['multiplicar'] - .25, "top:420px;font-size:104px;font-weight:800;color:#fff;line-height:1.08", .08)}
  {E(GRAF2, c['multiplicar'] - .4, "fade", "top:930px")}
</section>

<section class="scene" data-start="{c['imoveis'] - .1:.2f}" data-end="{c['atendimento'] - .1:.2f}">
  {Wd("Imóveis que geram", c['imoveis'], "top:240px;font-size:86px;font-weight:800;color:#fff", .08)}
  {Wd(ser("renda passiva"), c['renda'] - .1, "top:370px;font-size:150px", .1)}
  {E(PREDIOS, c['imoveis'] + .05, "fade", "top:760px")}
</section>

<section class="scene" data-start="{c['atendimento'] - .1:.2f}" data-end="{c['agende'] - .1:.2f}">
  {Wd(f"Atendimento {ser('BR & expat')}", c['atendimento'], "top:300px;font-size:104px;font-weight:800;color:#fff;line-height:1.1", .09)}
  {E(cartao("No Brasil", "estratégia pro seu patrimônio aqui"), c['brasil'] - .35, "slideL", "top:820px")}
  {E(cartao("Mora fora?", "a gente cuida dos seus investimentos no Brasil"), c['fora'] - .5, "slideL", "top:1110px")}
</section>

<section class="scene" data-start="{c['agende'] - .1:.2f}" data-end="{c['nanoz2'] - .1:.2f}">
  {E(CAL, c['agende'] - .1, "pop", "top:330px")}
  {Wd("Agende a sua", c['agende'], "top:760px;font-size:104px;font-weight:800;color:#fff", .08)}
  {Wd(ser("consultoria gratuita"), c['gratuita'] - .45, "top:890px;font-size:112px;line-height:1.1", .1)}
  {E(f'<span class="cta">Agendar pelo link da bio</span>', c['gratuita'] + .1, "up", "top:1250px")}
</section>

<section class="scene" data-start="{c['nanoz2'] - .1:.2f}" data-end="{CARD - L:.2f}">
  {E(logo(500), c['nanoz2'] - .1, "pop", "top:520px")}
  {E(f'<div style="font-weight:600;font-size:40px;color:#fff;letter-spacing:.04em">@nanozconsultoria</div>', c['nanoz2'] + .5, "up", "top:1130px")}
</section>

<section class="scene fimcr" data-start="{CARD - L:.2f}" data-end="{DUR + 1:.2f}">
  {E('<div style="font-weight:600;letter-spacing:.32em;font-size:30px;color:#8C96AD">PRÉVIA · PROPOSTA DE CONTEÚDO</div>', CARD - L + .15, "up", "top:560px")}
  {E(f'<div style="font-weight:800;font-size:76px;color:#fff;line-height:1.12">Vídeo criado para a<br>{ser("Nanoz Consultoria")}<br>pela</div>', CARD - L + .3, "up", "top:660px")}
  {E(cr_badge(2.0), CARD - L + .7, "pop", "top:1020px")}
  {E('<div style="font-weight:500;font-size:34px;color:#C9CED9">criativosrapidos.com.br</div>', CARD - L + 1.1, "up", "top:1220px")}
</section>
'''

html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Nanoz · prévia</title><style>
@font-face {{ font-family: M; font-weight: 400; src: url(fonts/montserrat-latin-400-normal.woff); }}
@font-face {{ font-family: M; font-weight: 500; src: url(fonts/montserrat-latin-500-normal.woff); }}
@font-face {{ font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }}
@font-face {{ font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }}
@font-face {{ font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }}
@font-face {{ font-family: PF; font-weight: 700; font-style: italic; src: url(fonts/playfair-display-latin-700-italic.woff); }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:1080px; height:1920px; overflow:hidden; background:{NAVY2}; }}
#stage {{ position:relative; width:1080px; height:1920px; overflow:hidden; font-family:M; color:#fff;
  background:radial-gradient(ellipse 120% 80% at 50% 30%, {NAVY} 0%, {NAVY2} 75%); }}
#grade {{ position:absolute; inset:0; background-image:linear-gradient(rgba(190,168,118,.05) 2px, transparent 2px), linear-gradient(90deg, rgba(190,168,118,.05) 2px, transparent 2px);
  background-size:90px 90px; }}
.scene {{ position:absolute; inset:0; opacity:0; }}
.fimcr {{ background:#0B0F1C; }}
.el {{ position:absolute; left:70px; right:70px; text-align:center; opacity:0; }}
.w {{ display:inline-block; overflow:hidden; vertical-align:top; padding:.14em .04em .16em; margin:-.14em -.04em -.16em; }}
.w > span {{ display:inline-block; }}
.tag {{ display:inline-block; border:3px solid {OURO}; color:{OURO}; font-weight:700; letter-spacing:.3em; padding:16px 26px 16px 38px; font-size:40px; border-radius:60px; }}
.cta {{ display:inline-block; background:{OURO}; color:{NAVY2}; font-weight:800; font-size:44px; padding:30px 56px; border-radius:80px; box-shadow:0 20px 50px rgba(0,0,0,.35); }}
/* marca d'água Criativos Rápidos */
#wm {{ position:absolute; top:70px; right:56px; display:flex; align-items:center; gap:14px; opacity:.85; z-index:900;
  background:rgba(11,15,28,.55); border:1px solid rgba(255,255,255,.14); border-radius:40px; padding:10px 22px 10px 12px; }}
#wm .pv {{ font-weight:700; font-size:20px; letter-spacing:.24em; color:#FFD400; }}
#rodape {{ position:absolute; left:0; right:0; bottom:70px; text-align:center; z-index:900; font-weight:600; font-size:22px; letter-spacing:.28em; color:rgba(255,255,255,.42); }}
#fios {{ position:absolute; inset:0; z-index:880; pointer-events:none; background-image:repeating-linear-gradient(-30deg, transparent 0 260px, rgba(255,255,255,.035) 260px 262px); }}
#flash {{ position:absolute; inset:0; background:{OURO2}; opacity:0; z-index:950; }}
</style></head><body><div id="stage"><div id="grade"></div>
{cenas}
<div id="wm">{cr_badge(0.7)}<span class="pv">PRÉVIA</span></div>
<div id="rodape">PROPOSTA · CRIATIVOS RÁPIDOS</div>
<div id="flash"></div></div>
<script>
const L = {L}, C = {json.dumps(c)}, CARD = {CARD - L:.3f};
document.querySelectorAll('[data-a="palavras"]').forEach(el => {{
  const tmp = document.createElement("div"); tmp.innerHTML = el.innerHTML; let out = "";
  const walk = (node, st) => node.childNodes.forEach(n => {{
    if (n.nodeType === 3) n.textContent.split(/(\\s+)/).forEach(p => {{ if (!p) return; out += /^\\s+$/.test(p) ? " " : `<span class="w"><span${{st ? ` style="${{st}}"` : ""}}>${{p}}</span></span>`; }});
    else walk(n, n.getAttribute("style") || st);
  }});
  walk(tmp, ""); el.innerHTML = out;
}});
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3), e5 = x => 1 - Math.pow(1 - x, 5);
const back = (x, k = 1.4) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);
document.querySelectorAll(".linha").forEach(p => {{ const n = p.getTotalLength(); p.dataset.n = n; p.style.strokeDasharray = n; }});
document.querySelectorAll(".check").forEach(p => {{ const n = p.getTotalLength(); p.dataset.n = n; p.style.strokeDasharray = n; }});
function anim(el, t) {{
  const t0 = +el.dataset.in, a = el.dataset.a;
  if (a === "palavras") {{
    const passo = +el.dataset.passo; let vis = false;
    el.querySelectorAll(".w > span").forEach((s, i) => {{ const p = cl((t - t0 - i * passo) / .45); s.style.transform = `translateY(${{((1 - e5(p)) * 118).toFixed(1)}}%)`; if (p > 0) vis = true; }});
    el.style.opacity = vis ? 1 : 0; return;
  }}
  const d = {{ pop: .55, up: .5, fade: .6, slideL: .55 }}[a] || .5, p = cl((t - t0) / d);
  let tf = "";
  if (a === "pop") tf = `scale(${{Math.max(.01, .6 + .4 * back(p)).toFixed(4)}})`;
  if (a === "up") tf = `translateY(${{((1 - eo(p)) * 50).toFixed(1)}}px)`;
  if (a === "slideL") tf = `translateX(${{((1 - e5(p)) * -260).toFixed(1)}}px)`;
  el.style.opacity = (a === "pop" ? cl(p * 3) : eo(p)).toFixed(3); el.style.transform = tf;
}}
function render(tv) {{
  const t = tv - L;
  document.querySelectorAll(".scene").forEach(s => {{
    const a = +s.dataset.start, b = +s.dataset.end, X = .2;
    let op = (t >= a - X && t < b + X) ? cl((t - a + X) / X) * (1 - cl((t - b) / X)) : 0;
    if (a === 0 && t < b) op = 1;
    s.style.opacity = op.toFixed(3); s.style.zIndex = Math.round(a * 10 + 10);
    if (op <= 0) return;
    s.style.transform = `scale(${{(1.04 - .04 * eo(cl((t - a) / .6)) + .012 * cl((t - a) / 5)).toFixed(4)}})`;
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  }});
  document.querySelectorAll(".linha").forEach(p => {{ const q = e5(cl((t - +p.dataset.t) / 1.3)); p.style.strokeDashoffset = (+p.dataset.n * (1 - q)).toFixed(1); }});
  document.querySelectorAll(".check").forEach(p => {{ const q = eo(cl((t - +p.dataset.t) / .45)); p.style.strokeDashoffset = (+p.dataset.n * (1 - q)).toFixed(1); }});
  document.querySelectorAll(".barra").forEach(r => {{ const q = e5(cl((t - +r.dataset.t) / .7)), h = +r.dataset.h * q; r.setAttribute("height", h.toFixed(1)); r.setAttribute("y", (380 - h).toFixed(1)); }});
  document.querySelectorAll(".ponto").forEach(r => {{ const q = cl((t - +r.dataset.t) / .4); r.setAttribute("r", (18 * back(q) + 6 * Math.sin(Math.max(0, t - +r.dataset.t) * 6) * q).toFixed(1)); r.style.opacity = q; }});
  document.querySelectorAll(".predio").forEach(g => {{ const q = e5(cl((t - C.imoveis - +g.dataset.i * .1) / .8)); g.style.transform = `translateY(${{((1 - q) * 900).toFixed(1)}}px)`; }});
  document.querySelectorAll(".jan").forEach(r => r.setAttribute("opacity", cl((t - +r.dataset.t) / .2).toFixed(2)));
  let f = 0; [C.nanoz - .15, C.estrategia - .1, C.imoveis - .1, C.atendimento - .1, C.agende - .1, C.nanoz2 - .1].forEach(k => {{ const q = t - k; if (q > 0 && q < .18) f = Math.max(f, .22 * (1 - q / .18)); }});
  flash.style.opacity = f.toFixed(3);
  const fimq = cl((t - CARD) / .3);
  wm.style.opacity = (.85 * (1 - fimq)).toFixed(3); rodape.style.opacity = (1 - fimq).toFixed(3);
}}
window.render = render; render(0);
</script></body></html>'''
(ROOT / "video.html").write_text(html)
print("video.html · duração", round(DUR, 2))
