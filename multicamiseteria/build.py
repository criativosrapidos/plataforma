#!/usr/bin/env python3
"""Multi Camiseteria - vídeo de divulgação (brinde Criativos Rápidos). Cenas sincronizadas com audio/cues.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues.json"))
FIM = c["fim"] + 1.6

head = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Multi Camiseteria - divulgação</title>
<style>
@font-face { font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
:root { --verm:#C8161D; --verm2:#8E0E12; --preto:#140A0A; --creme:#F4E9D8; --ouro:#E0A93F; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--preto); }
#stage { position:relative; width:1080px; height:1920px; overflow:hidden; font-family:M, sans-serif; }
.scene { position:absolute; inset:0; opacity:0; overflow:hidden; }
.el { position:absolute; left:40px; right:40px; text-align:center; opacity:0; will-change:transform, opacity; }
.A { font-family:Anton; line-height:.95; text-transform:uppercase; }
.it { display:inline-block; transform:skewX(-9deg); }
.f-vm { position:absolute; inset:0; background:radial-gradient(circle at 50% 35%,#E3262D,#C8161D 45%,#7A0B0F 100%); }
.f-pt { position:absolute; inset:0; background:radial-gradient(circle at 50% 40%,#2A1414,#140A0A 70%); }
.f-cr { position:absolute; inset:0; background:var(--creme); }
.pincel { position:absolute; left:-80px; right:-80px; height:300px; background:var(--preto); clip-path:polygon(2% 18%,30% 6%,62% 14%,98% 2%,100% 80%,70% 94%,35% 84%,0 98%); }
.tag { display:inline-block; font-family:Anton; text-transform:uppercase; padding:12px 44px 20px; line-height:1; transform:skewX(-9deg); }
.rasgo { position:absolute; inset:0; opacity:.12; background:repeating-linear-gradient(115deg,#000 0 8px,transparent 8px 40px); }
.card { display:flex; align-items:center; gap:30px; background:#fff; border-radius:26px; padding:26px 36px; box-shadow:0 22px 50px rgba(0,0,0,.35); text-align:left; border-left:16px solid var(--verm); }
.card .ic { flex:none; width:120px; height:120px; border-radius:24px; background:var(--verm); display:flex; align-items:center; justify-content:center; }
.card .t { font-family:Anton; font-size:70px; line-height:1; color:var(--preto); text-transform:uppercase; }
.lbl { display:inline-block; background:var(--verm); color:#fff; font-weight:900; font-size:30px; letter-spacing:.06em; padding:10px 24px; border-radius:40px; margin-top:12px; }
.w { display:inline-block; overflow:hidden; vertical-align:top; padding:.08em .04em .12em; margin:-.08em -.04em -.12em; }
.w > span { display:inline-block; }
</style></head><body><div id="stage">
'''

LOGO_SVG = '''<svg viewBox="0 0 200 200" style="width:{s}px;height:{s}px"><circle cx="100" cy="100" r="88" fill="none" stroke="{cor}" stroke-width="9"/>
  <path d="M62 52 80 44q20 14 40 0l18 8 24 22-14 18-12-8v62H62V84l-12 8-14-18z" fill="none" stroke="{cor}" stroke-width="8" stroke-linejoin="round"/>
  <path d="M82 92v44h34" fill="none" stroke="{cor}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>'''


def logo(s=200, cor="#E0A93F"):
    return LOGO_SVG.replace("{s}", str(s)).replace("{cor}", cor)


def lockup(s, cor="#fff", sub="#E0A93F"):
    return (f'<div style="display:inline-flex;align-items:center;gap:{int(s * .12)}px">{logo(s, sub)}<div style="text-align:left">'
            f'<div style="font-weight:800;font-size:{int(s * .42)}px;color:{cor};line-height:1;letter-spacing:-.01em">Multi Camiseteria</div>'
            f'<div style="font-weight:600;font-size:{int(s * .12)}px;color:{sub};letter-spacing:.32em;margin-top:{int(s * .06)}px">SUA IDEIA, NOSSA ESTAMPA</div></div></div>')


CAMISA = "M60 20 80 12q20 16 40 0l20 8 45 30-20 35-17-10v110H52V75L35 85 15 50z"
estilos = {
    "time": '<rect width="200" height="200" fill="#140A0A"/><path d="M0 120 200 20v40L0 160z" fill="#C8161D"/><path d="M0 150 200 70v14L0 164z" fill="#E0A93F"/><text x="100" y="140" text-anchor="middle" font-family="Anton" font-size="56" fill="#fff">10</text>',
    "escola": '<rect width="200" height="200" fill="#1E4FB8"/><rect y="0" width="200" height="60" fill="#fff"/><path d="M40 90h120v10H40z" fill="#fff"/><text x="100" y="150" text-anchor="middle" font-family="Anton" font-size="34" fill="#fff">3ºA</text>',
    "igreja": '<rect width="200" height="200" fill="#1F7A3A"/><path d="M95 70h10v80H95zM75 92h50v10H75z" fill="#fff"/>',
    "evento": '<rect width="200" height="200" fill="#F7A8C4"/><path d="M100 70c-18-22-40 2-20 24l20 22 20-22c20-22-2-46-20-24z" fill="#E23C7B"/>',
    "empresa": '<rect width="200" height="200" fill="#2A2A2A"/><path d="M0 0 200 0 200 50Q100 90 0 50z" fill="#C8161D"/><rect x="74" y="92" width="52" height="34" rx="6" fill="#fff"/><text x="100" y="116" text-anchor="middle" font-family="M" font-weight="900" font-size="17" fill="#2A2A2A">LOGO</text>',
    "roxo": '<rect width="200" height="200" fill="#5B1FA8"/><path d="M-10 60 210 20v18L-10 90zM-10 130 210 80v22L-10 160z" fill="#8A4BE0"/><text x="100" y="125" text-anchor="middle" font-family="Anton" font-size="34" fill="#fff">INTER</text>',
    "pesca": '<rect width="200" height="200" fill="#DDEFF7"/><path d="M0 140q50-30 100 0t100 0v60H0z" fill="#3A8FB7"/><path d="M60 110q40-30 80 0-40 30-80 0z" fill="#2F6E3E"/><circle cx="125" cy="108" r="4" fill="#fff"/>',
}


def camisa(est, w=200, ident=""):
    return (f'<svg viewBox="0 0 200 200" style="width:{w}px;height:{w}px;filter:drop-shadow(0 18px 30px rgba(0,0,0,.45))"><defs><clipPath id="cp{ident}"><path d="{CAMISA}"/></clipPath></defs>'
            f'<g clip-path="url(#cp{ident})">{estilos[est]}<g class="print"></g></g><path d="{CAMISA}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>'
            f'<path d="M80 12q20 16 40 0" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="5"/></svg>')


CAMISA_DESCASCA = (f'<svg viewBox="0 0 200 200" style="width:620px;height:620px;filter:drop-shadow(0 30px 50px rgba(0,0,0,.5))"><defs><clipPath id="cpd"><path d="{CAMISA}"/></clipPath>'
                   '<mask id="mk"><rect width="200" height="200" fill="#fff"/><g id="rach" stroke="#000" stroke-width="3.2" fill="none" stroke-linecap="round"></g></mask></defs>'
                   f'<g clip-path="url(#cpd)"><rect width="200" height="200" fill="#F4F4F4"/><g mask="url(#mk)" id="estampa"><circle cx="100" cy="100" r="40" fill="#C8161D"/>'
                   '<text x="100" y="112" text-anchor="middle" font-family="Anton" font-size="34" fill="#fff">TIME</text></g></g>'
                   f'<path d="{CAMISA}" fill="none" stroke="#bbb" stroke-width="2"/></svg>')


def ic(path):
    return f'<svg viewBox="0 0 100 100" style="width:76px;height:76px" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">{path}</svg>'


def W(texto, t, st="", cls="A", passo=0.06, a="palavras"):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="{a}" data-passo="{passo}" style="{st}">{texto}</div>'


def E(html, t, a="pop", st="", cls=""):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="{a}" style="{st}">{html}</div>'


servicos = [("SUBLIMAÇÃO TOTAL", "sublimacao", "roxo"), ("BORDADO", "bordado", "empresa"), ("SERIGRAFIA", "serigrafia", "time"), ("DTF", "dtf", "pesca")]
serv_html = "".join(
    f'<div class="el" data-in="{c[k] - 0.05:.2f}" data-a="pop" style="top:{560 + (i // 2) * 560}px;left:{60 + (i % 2) * 500}px;right:auto;width:460px">'
    f'{camisa(est, 340, f"s{i}")}<div><span class="tag" style="background:var(--verm);color:#fff;font-size:{48 if len(t) > 10 else 66}px;white-space:nowrap">{t}</span></div></div>'
    for i, (t, k, est) in enumerate(servicos))

segs = [("EMPRESA", "empresa", "empresa"), ("ESCOLA", "escola", "escola"), ("TIME", "time", "time"), ("IGREJA", "igreja", "igreja"), ("EVENTO", "evento", "evento")]
pos = [(60, 520), (560, 520), (60, 1000), (560, 1000), (310, 1440)]
seg_html = "".join(
    f'<div class="el" data-in="{c[k] - 0.05:.2f}" data-a="drop" style="top:{y}px;left:{x}px;right:auto;width:460px">{camisa(est, 330, f"g{i}")}<div><span class="lbl">{t}</span></div></div>'
    for i, ((t, k, est), (x, y)) in enumerate(zip(segs, pos)))

I_LAY = '<rect x="14" y="18" width="72" height="56" rx="6"/><path d="M14 30h72M30 86h40M50 74v12M30 46l14 12 24-20"/>'
I_QTD = '<circle cx="30" cy="34" r="12"/><circle cx="70" cy="34" r="12"/><path d="M8 82c0-14 10-24 22-24s22 10 22 24M48 82c0-14 10-24 22-24s22 10 22 24"/>'
I_ENT = '<path d="M8 30h54v40H8zM62 44h18l12 14v12H62z"/><circle cx="26" cy="74" r="8"/><circle cx="76" cy="74" r="8"/>'
ben = [(I_LAY, "Layout gratuito", "layout"), (I_QTD, "Pequenas ou grandes quantidades", "pequenas"), (I_ENT, "Entrega rápida", "entrega")]
ben_html = "".join(
    f'<div class="el" data-in="{c[k]:.2f}" data-a="{"slideL" if i % 2 == 0 else "slideR"}" style="top:{640 + i * 290}px"><div class="card"><div class="ic">{ic(p)}</div>'
    f'<div class="t" style="font-size:{56 if len(t) > 20 else 74}px">{t}</div></div></div>'
    for i, (p, t, k) in enumerate(ben))

CR_WM = '''<div style="display:inline-flex;align-items:center;gap:14px;background:rgba(0,0,0,.55);border-radius:40px;padding:10px 24px 10px 12px">
  <div style="width:60px;height:60px;border-radius:15px;background:#FF6A13"><svg viewBox="0 0 100 100" style="width:60px;height:60px"><path d="M58 12 26 56h22l-8 32 34-46H52z" fill="#fff"/></svg></div>
  <div style="font-weight:700;font-size:32px;color:#fff;letter-spacing:.02em">Vídeo criado por <b style="font-weight:900;font-style:italic;color:#FFB15C">CRIATIVOS RÁPIDOS</b></div></div>'''

cenas = f'''
  <section class="scene" data-start="0" data-end="{c['ja'] - 0.12:.2f}">
    <div class="f-vm"></div><div class="rasgo"></div>
    {E('<span class="tag" style="background:#fff;color:var(--verm);font-size:120px">Ô EMPRESÁRIO,</span>', c['empresario'] - 0.1, "slam", "top:520px")}
    {E('<span class="tag" style="background:var(--preto);color:#fff;font-size:120px">PROFESSOR,</span>', c['professor'], "slam", "top:740px")}
    {E('<span class="tag" style="background:var(--ouro);color:var(--preto);font-size:110px">TÉCNICO DO TIME...</span>', c['tecnico'], "slam", "top:960px")}
  </section>

  <section class="scene" data-start="{c['ja'] - 0.12:.2f}" data-end="{c['pior'] - 0.12:.2f}" data-shake="{c['atrasada']:.2f}">
    <div class="f-pt"></div>
    {W('Já encomendou camiseta', c['ja'], "top:380px;font-size:84px;color:#fff;white-space:nowrap", passo=0.08)}
    {W('e ela chegou...', c['camiseta'] + 0.3, "top:510px;font-size:80px;color:var(--ouro)", passo=0.08)}
    {E('<svg viewBox="0 0 100 100" style="width:320px;height:320px" fill="none" stroke="#fff" stroke-width="5"><circle cx="50" cy="50" r="40"/><path id="pont" d="M50 50V22" stroke-width="7" stroke-linecap="round"/><path d="M50 50l16 10" stroke-width="7" stroke-linecap="round"/></svg>', c['camiseta'], "pop", "top:700px")}
    {E('<span class="tag" style="background:var(--verm);color:#fff;font-size:190px">ATRASADA?</span>', c['atrasada'], "slam", "top:1120px")}
  </section>

  <section class="scene" data-start="{c['pior'] - 0.12:.2f}" data-end="{c['ai'] - 0.12:.2f}">
    <div class="f-pt"></div>
    {W('Ou pior:', c['pior'], "top:220px;font-size:100px;color:var(--ouro)")}
    {W('na primeira lavada...', c['lavada'], "top:340px;font-size:90px;color:#fff", passo=0.07)}
    {E(CAMISA_DESCASCA, c['lavada'] - 0.1, "pop", "top:560px")}
    {E('<span class="tag" style="background:var(--verm);color:#fff;font-size:120px">A ESTAMPA DESCASCOU!</span>', c['descascou'], "slam", "top:1300px")}
  </section>

  <section class="scene" data-start="{c['ai'] - 0.12:.2f}" data-end="{c['multi'] - 0.1:.2f}" data-shake="{c['ai'] + 0.1:.2f}">
    <div class="f-vm"></div><div class="rasgo"></div>
    {E('<div class="A it" style="font-size:250px;color:#fff;text-shadow:0 14px 0 rgba(0,0,0,.25)">AÍ NÃO DÁ,<br>NÉ?</div>', c['ai'], "slam", "top:640px")}
  </section>

  <section class="scene" data-start="{c['multi'] - 0.1:.2f}" data-end="{c['sublimacao'] - 0.12:.2f}">
    <div class="f-pt"></div>
    {E(logo(420), c['multi'] - 0.05, "pop", "top:380px")}
    {E('<div style="font-weight:800;font-size:92px;color:#fff;letter-spacing:-.01em;white-space:nowrap">Multi Camiseteria</div>', c['multi'] + 0.15, "rise", "top:860px")}
    {E('<span class="tag" style="background:var(--verm);color:#fff;font-size:120px">É DIFERENTE!</span>', c['diferente'], "slam", "top:1060px")}
  </section>

  <section class="scene" data-start="{c['sublimacao'] - 0.12:.2f}" data-end="{c['uniforme'] - 0.12:.2f}">
    <div class="f-vm"></div><div class="rasgo"></div>
    {W('A gente faz:', c['sublimacao'] - 0.3, "top:280px;font-size:110px;color:#fff")}
    {serv_html}
  </section>

  <section class="scene" data-start="{c['uniforme'] - 0.12:.2f}" data-end="{c['layout'] - 0.12:.2f}">
    <div class="f-cr"></div>
    {W('Uniforme pra', c['uniforme'], "top:200px;font-size:120px;color:var(--verm)")}
    {seg_html}
  </section>

  <section class="scene" data-start="{c['layout'] - 0.12:.2f}" data-end="{c['sua'] - 0.12:.2f}">
    <div class="f-pt"></div>
    {E(lockup(150), c['layout'] - 0.2, "rise", "top:340px")}
    {ben_html}
  </section>

  <section class="scene" data-start="{c['sua'] - 0.12:.2f}" data-end="{c['chama'] - 0.12:.2f}">
    <div class="f-vm"></div><div class="rasgo"></div>
    {E('<div class="A it" style="font-size:210px;color:#fff">SUA IDEIA,</div>', c['sua'], "slam", "top:600px")}
    {E('<div class="A it" style="font-size:210px;color:var(--preto)">NOSSA ESTAMPA!</div>', c['nossa'], "slam", "top:820px")}
  </section>

  <section class="scene" data-start="{c['chama'] - 0.12:.2f}" data-end="{FIM + 1}">
    <div class="f-pt"></div><div class="rasgo" style="opacity:.06"></div>
    {E(lockup(170), c['chama'] - 0.1, "rise", "top:260px")}
    {E('<div style="display:inline-flex;align-items:center;gap:22px;background:#25D366;color:#fff;font-weight:900;font-size:58px;padding:26px 56px;border-radius:80px;box-shadow:0 20px 50px rgba(37,211,102,.35)"><svg viewBox="0 0 32 32" style="width:76px;height:76px"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.8 5 2.1.9 3 1 4 .8.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.4-.2z"/></svg>CHAMA NO WHATS</div>', c['chama'], "pop", "top:640px")}
    {E('<div class="A" style="font-size:130px;color:#fff">(61) 98463-6750</div>', c['numero'], "rise", "top:860px")}
    {E('<div style="display:inline-block;background:var(--verm);color:#fff;border-radius:26px;padding:26px 40px;font-weight:800;font-size:44px;line-height:1.3">📍 QSE 14 · Lote 1 · Loja 3<br><span style="color:#FFD9A0">Taguatinga Sul</span></div>', c['loja'], "pop", "top:1080px")}
    {E('<div style="font-weight:700;font-size:34px;color:rgba(255,255,255,.75)">@multi_camiseteria</div>', c['multi2'], "rise", "top:1340px")}
    {E(CR_WM, c['multi2'] + 0.4, "rise", "top:1700px")}
  </section>
'''

script = f'''
</div>
<script>
const L = 0.15, C = {json.dumps(c)};
document.querySelectorAll('[data-a="palavras"]').forEach(el => {{
  el.innerHTML = el.textContent.split(/(\\s+)/).map(p => /^\\s+$/.test(p) ? " " : `<span class="w"><span>${{p}}</span></span>`).join("");
}});
// rachaduras da estampa
(() => {{ const g = document.getElementById("rach"); let h = ""; let s = 7;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 16; i++) {{ let x = 60 + r() * 80, y = 60 + r() * 80, d = `M${{x.toFixed(1)}} ${{y.toFixed(1)}}`;
    for (let j = 0; j < 4; j++) {{ x += (r() - .5) * 30; y += (r() - .5) * 30; d += ` L${{x.toFixed(1)}} ${{y.toFixed(1)}}`; }}
    h += `<path d="${{d}}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1" data-i="${{i}}"/>`; }}
  g.innerHTML = h; }})();
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3), eo5 = x => 1 - Math.pow(1 - x, 5);
const back = (x, k = 1.8) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);
const XF = 0.12;
function anim(el, t) {{
  const t0 = parseFloat(el.dataset.in), a = el.dataset.a;
  if (a === "palavras") {{
    const passo = parseFloat(el.dataset.passo); let vis = false;
    el.querySelectorAll(".w > span").forEach((s, i) => {{
      const p = clamp((t - t0 - i * passo) / 0.35), pe = eo5(p);
      s.style.transform = `translateY(${{((1 - pe) * 110).toFixed(1)}}%)`;
      if (p > 0) vis = true;
    }});
    el.style.opacity = vis ? 1 : 0; el.style.visibility = vis ? "visible" : "hidden"; return;
  }}
  const d = {{pop: .36, slam: .26, rise: .45, slideL: .4, slideR: .4, drop: .45}}[a] || .45;
  const p = clamp((t - t0) / d), pe = eo(p);
  let op = (a === "pop" || a === "slam" || a === "drop") ? clamp(p * 4) : pe, tf = "";
  if (a === "pop") tf = `scale(${{Math.max(.02, back(p)).toFixed(4)}})`;
  if (a === "slam") tf = `scale(${{(1 + (1 - pe) * 1.5).toFixed(4)}}) rotate(${{((1 - pe) * -6).toFixed(2)}}deg)`;
  if (a === "rise") tf = `translateY(${{((1 - pe) * 90).toFixed(1)}}px)`;
  if (a === "drop") tf = `translateY(${{(-(1 - Math.min(1, back(p, 1.2))) * 500).toFixed(1)}}px)`;
  if (a === "slideL") tf = `translateX(${{(-(1 - pe) * 1100).toFixed(1)}}px)`;
  if (a === "slideR") tf = `translateX(${{((1 - pe) * 1100).toFixed(1)}}px)`;
  op = op < 0.003 ? 0 : op;
  el.style.opacity = op.toFixed(3); el.style.visibility = op > 0 ? "visible" : "hidden"; el.style.transform = tf;
}}
function render(tv) {{
  const t = tv - L;
  document.querySelectorAll(".scene").forEach(s => {{
    const a = parseFloat(s.dataset.start), b = parseFloat(s.dataset.end);
    let op = 0;
    if (t >= a && t < b + XF) op = clamp((t - a) / XF) * (t > b ? 1 - clamp((t - b) / XF) : 1);
    if (a === 0) op = t < b ? 1 : op;
    s.style.opacity = op; s.style.visibility = op > 0 ? "visible" : "hidden"; s.style.zIndex = Math.round(a * 10 + 10);
    if (op <= 0) return;
    let sh = "";
    (s.dataset.shake || "").split(",").filter(Boolean).map(Number).forEach(k => {{
      const q = t - k; if (q > 0 && q < .35) {{ const amp = 16 * (1 - q / .35); sh = ` translate(${{(Math.sin(q * 90) * amp).toFixed(1)}}px,${{(Math.cos(q * 70) * amp).toFixed(1)}}px)`; }}
    }});
    s.style.transform = `scale(${{(1.06 - .06 * eo(clamp((t - a) / .4))).toFixed(4)}})${{sh}}`;
    s.querySelectorAll(".rasgo").forEach(r => r.style.transform = `translateX(${{((t * 30) % 40).toFixed(1)}}px)`);
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  }});
  const pont = document.getElementById("pont"); if (pont) pont.setAttribute("transform", `rotate(${{(t * 400).toFixed(1)}} 50 50)`);
  document.querySelectorAll("#rach path").forEach(p => p.style.strokeDashoffset = (1 - eo(clamp((t - C.estampa - p.dataset.i * .04) / .5))).toFixed(3));
  const est = document.getElementById("estampa"); if (est) est.style.opacity = (1 - .45 * clamp((t - C.descascou) / .8)).toFixed(3);
}}
window.render = render;
render(0);
</script>
</body></html>'''
(ROOT / "anuncio.html").write_text(head + cenas + script)
print("anuncio.html · duração", round(FIM, 2))
