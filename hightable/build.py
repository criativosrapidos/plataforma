#!/usr/bin/env python3
"""High Table - Líderes do Brasil + Chopp Brasília (convite). Cenas sincronizadas com audio/cues.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FOT = "../lideres/fotos/hd"
c = json.load(open(ROOT / "audio/cues.json"))
c["bora"] = c["chegou"]
json.dump(c, open(ROOT / "audio/cues.json", "w"), indent=1)
FIM = c["fim"] + 2.2

head = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>High Table - convite</title>
<style>
@font-face { font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 500; src: url(fonts/montserrat-latin-500-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
:root { --ouro:#E2B65C; --ouro2:#F7DC98; --preto:#070605; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--preto); }
#stage { position:relative; width:1080px; height:1920px; overflow:hidden; font-family:M, sans-serif; color:#fff; background:var(--preto); }
.scene { position:absolute; inset:0; opacity:0; overflow:hidden; }
.el { position:absolute; left:50px; right:50px; text-align:center; opacity:0; will-change:transform, opacity, filter; }
.A { font-family:Anton; line-height:.95; text-transform:uppercase; }
.T { font-weight:600; letter-spacing:.38em; text-transform:uppercase; }
.ouro { background:linear-gradient(180deg,#FFF1C4 0%,#EBC46C 40%,#A97A2E 75%,#F0CF7E 100%); -webkit-background-clip:text; background-clip:text; color:transparent; padding:.1em .03em; margin:-.1em -.03em; }
.fundo { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 35%,#2A1D0C 0%,#0E0A06 60%,#050404 100%); }
.ph { position:absolute; inset:-4%; background-size:cover; background-position:center; }
.foto { border-radius:26px; overflow:hidden; position:relative; margin:0 auto; box-shadow:0 30px 80px rgba(0,0,0,.75), 0 0 0 2px rgba(226,182,92,.55); }
.linha { display:flex; align-items:center; gap:34px; text-align:left; }
.ic { flex:none; width:150px; height:150px; border-radius:50%; border:4px solid var(--ouro); display:flex; align-items:center; justify-content:center; background:rgba(10,8,5,.75); }
.ic svg { width:76px; height:76px; stroke:var(--ouro); fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.rot { font-weight:600; letter-spacing:.3em; font-size:30px; color:#E8E2D4; text-transform:uppercase; }
.val { font-weight:800; font-size:92px; line-height:1.05; }
.txt { font-weight:600; font-size:46px; line-height:1.2; }
.fio { height:2px; background:linear-gradient(90deg,transparent,var(--ouro),transparent); }
.w { display:inline-block; overflow:hidden; vertical-align:top; padding:.1em .03em .14em; margin:-.1em -.03em -.14em; }
.w > span { display:inline-block; }
#flash { position:absolute; inset:0; background:radial-gradient(circle,#FFF3D6,#E2B65C 55%,transparent 85%); opacity:0; z-index:600; mix-blend-mode:screen; }
.vin { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%,transparent 50%,rgba(0,0,0,.75) 100%); z-index:550; pointer-events:none; }
.bokeh { position:absolute; border-radius:50%; background:radial-gradient(circle,rgba(255,200,120,.55),transparent 70%); }
</style></head><body><div id="stage">
'''

IC = {
    "cal": '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2"/></svg>',
    "pin": '<svg viewBox="0 0 24 24"><path d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    "rel": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    "van": '<svg viewBox="0 0 24 24"><path d="M2 16V8a2 2 0 0 1 2-2h11l4 4h1.5A1.5 1.5 0 0 1 22 11.5V16h-2M2 16h2m4 0h8M2 10h17"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></svg>',
    "chopp": '<svg viewBox="0 0 24 24"><path d="M5 7h10v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM15 10h2.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H15M5 7a2.5 2.5 0 0 1 2-4 3 3 0 0 1 5 0 2.5 2.5 0 0 1 3 4M8 11v6M12 11v6"/></svg>',
}


def Wd(texto, t, st="", cls="A", passo=0.07):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="palavras" data-passo="{passo}" style="{st}">{texto}</div>'


def E(html, t, a="up", st="", cls=""):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="{a}" style="{st}">{html}</div>'


def bg(arq, filtro="brightness(.45)", pos="center"):
    return f'<div class="ph kb" style="background-image:url({arq});background-position:{pos};filter:{filtro}"></div>'


def item(ic, rot, val, cls="val"):
    return f'<div class="linha"><div class="ic">{IC[ic]}</div><div><div class="rot">{rot}</div><div class="{cls} {"ouro" if cls == "val" else ""}">{val}</div></div></div>'


def img(arq, w, st=""):
    return f'<img src="assets/{arq}" style="width:{w}px;display:block;margin:0 auto;{st}">'


HIGH = (f'{img("high.jpg", 900, "mix-blend-mode:screen")}'
        '<div style="display:flex;align-items:center;gap:30px;justify-content:center;margin-top:6px"><div class="fio" style="width:150px"></div>'
        '<div style="font-weight:800;font-size:110px;letter-spacing:.32em;margin-right:-.32em">TABLE</div><div class="fio" style="width:150px"></div></div>')

bokeh = "".join(f'<div class="bokeh" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;opacity:{o}"></div>'
                for x, y, s, o in [(80, 180, 160, .5), (820, 120, 220, .4), (900, 640, 120, .5), (40, 900, 200, .3), (700, 1500, 260, .35), (180, 1650, 140, .45)])

cenas = f'''
  <section class="scene" data-start="0" data-end="{c['sabe'] - 0.15:.2f}" data-shake="1">
    {bg(FOT + "/f11.png", "brightness(.4) saturate(1.1)", "center 30%")}
    {E(img("lideres_logo.png", 520, "mix-blend-mode:screen"), 0.0, "fade", "top:260px")}
    {E('<div class="A" style="font-size:200px;color:#fff">FAAALA,</div>', c['fala'], "slam", "top:640px")}
    {E('<div class="A ouro" style="font-size:190px">LIDERANÇA!</div>', c['fala'] + 0.45, "slam", "top:850px")}
  </section>

  <section class="scene" data-start="{c['sabe'] - 0.15:.2f}" data-end="{c['mesa'] - 0.12:.2f}">
    {bg(FOT + "/f01.png", "grayscale(1) brightness(.32)")}
    {Wd('Sabe aquele', c['sabe'], "top:380px;font-size:96px;color:#cfcfcf", "A", 0.07)}
    {Wd('NEGÓCIO GRANDE...', c['negocio'], "top:500px;font-size:140px;color:#fff", "A", 0.08)}
    {Wd('que nunca sai numa', c['nunca'], "top:900px;font-size:80px;color:#bdbdbd", "A", 0.06)}
    {E('<div class="A" style="font-size:96px;white-space:nowrap;color:#fff;text-decoration:line-through;text-decoration-color:#C0392B;text-decoration-thickness:12px">REUNIÃO DE ESCRITÓRIO?</div>', c['escritorio'] - 0.2, "slam", "top:1010px")}
  </section>

  <section class="scene" data-start="{c['mesa'] - 0.12:.2f}" data-end="{c['chegou'] - 0.12:.2f}">
    {bg(FOT + "/f10.png", "brightness(.55) saturate(1.2)", "center 40%")}
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.7),transparent 40%,transparent 60%,rgba(0,0,0,.8))"></div>
    {Wd('Ele sai numa', c['mesa'], "top:260px;font-size:110px;color:#fff", "A", 0.07)}
    {Wd('<span class="ouro">mesa como essa.</span>', c['mesa'] + 0.45, "top:390px;font-size:150px", "A", 0.08)}
  </section>

  <section class="scene" data-start="{c['chegou'] - 0.12:.2f}" data-end="{c['dia'] - 0.12:.2f}">
    {bg("assets/bar_dir.jpg", "brightness(.42) blur(2px)", "center 30%")}{bokeh}
    {E('<div class="T" style="font-size:40px;color:var(--ouro2)">Chegou o</div>', c['chegou'], "up", "top:420px")}
    {E(HIGH, c['high'], "slam", "top:500px")}
    {E('<div class="T" style="font-size:38px;line-height:1.6;color:#F2EBDD;letter-spacing:.24em">Conexões que geram<br>grandes oportunidades.</div>', c['conexoes'], "up", "top:960px")}
    {E(img("chopp.jpg", 520, "border-radius:24px;box-shadow:0 0 0 2px rgba(226,182,92,.5),0 30px 80px rgba(0,0,0,.7)"), c['conexoes'] + 0.3, "rise", "top:1170px")}
  </section>

  <section class="scene" data-start="{c['dia'] - 0.12:.2f}" data-end="{c['carro'] - 0.12:.2f}">
    <div class="fundo"></div>{bokeh}
    {E('<div class="T" style="font-size:36px;color:var(--ouro2)">Anota aí</div>', c['dia'] - 0.1, "up", "top:250px")}
    {E(item("cal", "Data", "23/10"), c['dia'], "slideL", "top:360px;left:110px")}
    {E(item("rel", "Horário", "15:00"), c['tres'], "slideL", "top:600px;left:110px")}
    {E(item("pin", "Local de encontro", "Estacionamento em frente<br>ao edifício <b>Lá Quartier</b>,<br>Asa Norte.", "txt"), c['estacionamento'], "slideL", "top:840px;left:110px")}
    {E('<div class="fio"></div>', c['estacionamento'] + 0.2, "fade", "top:1160px;left:110px;right:110px")}
  </section>

  <section class="scene" data-start="{c['carro'] - 0.12:.2f}" data-end="{c['realizacao'] - 0.12:.2f}">
    {bg("assets/bar_dir.jpg", "brightness(.18) blur(6px)", "center 60%")}
    {E(item("van", "Transporte", "Deixa o carro ali e<br>partimos de <b>van</b>.", "txt"), c['carro'], "slideL", "top:250px;left:110px")}
    <div class="el" id="van" data-in="{c['van']:.2f}" data-a="fade" style="top:560px;left:0;right:0;height:120px">
      <div id="vanbox" style="position:absolute;left:0;top:0;width:180px">{IC['van'].replace('<svg ', '<svg style="width:170px;height:120px;stroke:#E2B65C;fill:none;stroke-width:1.6" ')}</div>
      <div style="position:absolute;left:60px;right:60px;top:110px;border-top:4px dashed rgba(226,182,92,.5)"></div></div>
    {E(item("chopp", "Destino", "Cervejaria Brasília", "val"), c['cervejaria'], "slideL", "top:760px;left:110px;font-size:0")}
    {E(item("rel", "Retorno", "20:00"), c['retorno'], "slideL", "top:1030px;left:110px")}
    {E(img("chopp.jpg", 430, "border-radius:22px;box-shadow:0 0 0 2px rgba(226,182,92,.5)"), c['cervejaria'] + 0.2, "rise", "top:1300px")}
  </section>

  <section class="scene" data-start="{c['realizacao'] - 0.12:.2f}" data-end="{c['confirma'] - 0.12:.2f}">
    <div class="fundo"></div>{bokeh}
    {E('<div style="display:flex;align-items:center;gap:30px;justify-content:center"><div class="fio" style="width:160px"></div><div class="T" style="font-size:40px;color:var(--ouro)">Realização</div><div class="fio" style="width:160px"></div></div>', c['realizacao'], "up", "top:520px")}
    {E(img("lideres_logo.png", 700, "mix-blend-mode:screen"), c['lideres'], "pop", "top:680px")}
    {E(img("chopp_logo.png", 480, "mix-blend-mode:screen;border-radius:50%"), c['chopp'], "pop", "top:1000px")}
  </section>

  <section class="scene" data-start="{c['confirma'] - 0.12:.2f}" data-end="{FIM + 1}">
    {bg(FOT + "/f14.png", "brightness(.35) saturate(1.1)", "center 30%")}
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.6),rgba(0,0,0,.2) 40%,rgba(0,0,0,.85))"></div>
    {E(HIGH.replace('900px', '760px').replace('font-size:110px', 'font-size:92px'), c['confirma'] - 0.1, "pop", "top:180px")}
    {Wd('Confirma tua presença', c['confirma'] + 0.1, "top:640px;font-size:104px;color:#fff", "A", 0.07)}
    {Wd('<span class="ouro">e vem fortalecer o movimento!</span>', c['fortalecer'] - 0.3, "top:770px;font-size:84px", "A", 0.06)}
    {E('<div style="display:inline-flex;gap:26px;align-items:center;border:3px solid var(--ouro);border-radius:80px;padding:22px 50px;background:rgba(8,6,4,.8)"><span class="ouro" style="font-weight:900;font-size:64px">23/10</span><span style="width:3px;height:56px;background:var(--ouro)"></span><span style="font-weight:800;font-size:64px">15H</span><span style="width:3px;height:56px;background:var(--ouro)"></span><span style="font-weight:700;font-size:40px;text-align:left;line-height:1.1">Saída: Lá Quartier<br>Asa Norte</span></div>', c['fortalecer'] + 0.4, "pop", "top:1080px")}
    {E('<div style="display:flex;align-items:center;justify-content:center;gap:40px">' + img("lideres_logo.png", 420, "mix-blend-mode:screen;margin:0") + '<div style="width:2px;height:120px;background:var(--ouro)"></div>' + img("chopp_logo.png", 230, "mix-blend-mode:screen;margin:0;border-radius:50%") + '</div>', c['fortalecer'] + 0.8, "up", "top:1420px")}
  </section>
'''

script = f'''
<div class="vin"></div><div id="flash"></div></div>
<script>
const L = 0.15, C = {json.dumps(c)};
const FL = [C.fala, C.high, C.dia, C.confirma];
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
const back = (x, k = 1.6) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);
const XF = 0.14;
function anim(el, t) {{
  const t0 = parseFloat(el.dataset.in), a = el.dataset.a;
  if (a === "palavras") {{
    const passo = parseFloat(el.dataset.passo); let vis = false;
    el.querySelectorAll(".w > span").forEach((s, i) => {{
      const p = clamp((t - t0 - i * passo) / 0.42), pe = eo5(p);
      s.style.transform = `translateY(${{((1 - pe) * 110).toFixed(1)}}%)`;
      if (p > 0) vis = true;
    }});
    el.style.opacity = vis ? 1 : 0; el.style.visibility = vis ? "visible" : "hidden"; return;
  }}
  const d = {{pop: .4, slam: .3, up: .5, fade: .7, rise: .7, slideL: .5}}[a] || .5;
  const p = clamp((t - t0) / d), pe = eo(p);
  let op = (a === "pop" || a === "slam") ? clamp(p * 4) : pe, tf = "", fl = "";
  if (a === "pop") tf = `scale(${{Math.max(.02, back(p)).toFixed(4)}})`;
  if (a === "slam") {{ tf = `scale(${{(1 + (1 - pe) * 1.3).toFixed(4)}})`; fl = p < 1 ? `blur(${{((1 - pe) * 8).toFixed(1)}}px)` : ""; }}
  if (a === "up") tf = `translateY(${{((1 - pe) * 60).toFixed(1)}}px)`;
  if (a === "rise") tf = `translateY(${{((1 - eo5(p)) * 200).toFixed(1)}}px)`;
  if (a === "slideL") tf = `translateX(${{((1 - eo5(p)) * -160).toFixed(1)}}px)`;
  op = op < 0.003 ? 0 : op;
  el.style.opacity = op.toFixed(3); el.style.visibility = op > 0 ? "visible" : "hidden"; el.style.transform = tf; el.style.filter = fl || "none";
}}
function render(tv) {{
  const t = tv - L;
  let fo = 0; FL.forEach(k => {{ const q = t - k; if (q > 0 && q < .32) fo = Math.max(fo, .4 * (1 - q / .32)); }});
  flash.style.opacity = fo.toFixed(3);
  document.querySelectorAll(".scene").forEach(s => {{
    const a = parseFloat(s.dataset.start), b = parseFloat(s.dataset.end);
    let op = 0;
    if (t >= a && t < b + XF) op = clamp((t - a) / XF) * (t > b ? 1 - clamp((t - b) / XF) : 1);
    if (a === 0) op = t < b ? 1 : op;
    s.style.opacity = op; s.style.visibility = op > 0 ? "visible" : "hidden"; s.style.zIndex = Math.round(a * 10 + 10);
    if (op <= 0) return;
    let sh = "";
    if (s.dataset.shake) {{ const q = t - C.fala; if (q > 0 && q < .5) {{ const k = (1 - q / .5) * 14; sh = ` translate(${{(Math.sin(t * 90) * k).toFixed(1)}}px,${{(Math.cos(t * 77) * k).toFixed(1)}}px)`; }} }}
    s.style.transform = `scale(${{(1.05 - .05 * eo(clamp((t - a) / .4))).toFixed(4)}})` + sh;
    s.querySelectorAll(".kb").forEach(k => k.style.transform = `scale(${{(1.02 + .08 * clamp((t - a) / 6)).toFixed(4)}})`);
    s.querySelectorAll(".bokeh").forEach((b, i) => b.style.transform = `translateY(${{(Math.sin(t * .8 + i) * 30).toFixed(1)}}px)`);
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  }});
  const vb = document.getElementById("vanbox");
  if (vb) vb.style.transform = `translateX(${{(60 + 780 * eo(clamp((t - C.van) / 1.6))).toFixed(0)}}px)`;
}}
window.render = render;
render(0);
</script>
</body></html>'''
(ROOT / "anuncio.html").write_text(head + cenas + script)
print("anuncio.html · duração", round(FIM, 2))
