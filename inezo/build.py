#!/usr/bin/env python3
"""Reels Inezo (30 s): cenas sincronizadas com audio/cues.json -> anuncio.html"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues.json"))
FIM = c["fim"] + 0.9
WHATS = "(61) 98458-3818"

head = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Inezo - reels de exemplo</title>
<style>
@font-face { font-family: Mont; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: Mont; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: Mont; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
@font-face { font-family: Inter; font-weight: 700; src: url(fonts/Inter-Bold.otf); }
@font-face { font-family: Inter; font-weight: 600; src: url(fonts/Inter-SemiBold.otf); }
:root { --marinho:#0E2A47; --marinho2:#081B30; --azul:#1F5C99; --laranja:#F28C28; --laranja2:#D9701A; --gelo:#EEF3F8; --tinta:#0B1F33; --cinza:#5B6B7C; --verm:#E5484D; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--marinho2); }
#stage { position:relative; width:1080px; height:1920px; overflow:hidden; font-family:Inter, sans-serif; }
.scene { position:absolute; inset:0; opacity:0; }
.el { position:absolute; left:0; right:0; text-align:center; opacity:0; will-change:transform, opacity; }
.h { font-family:Mont; font-weight:900; line-height:1; letter-spacing:-.01em; }
.f-mar { position:absolute; inset:0; background:radial-gradient(circle at 50% 30%,#163A60,#081B30 75%); }
.f-azul { position:absolute; inset:0; background:linear-gradient(165deg,#1F5C99,#0E2A47); }
.f-lar { position:absolute; inset:0; background:linear-gradient(165deg,#F6A04A,#D9701A); }
.f-gelo { position:absolute; inset:0; background:var(--gelo); }
.grade { position:absolute; inset:-200px; background-image:linear-gradient(var(--gc) 2px,transparent 2px),linear-gradient(90deg,var(--gc) 2px,transparent 2px); background-size:90px 90px; }
.tag { display:inline-block; font-family:Mont; font-weight:900; color:#fff; padding:20px 46px 24px; border-radius:22px; }
.chip { display:inline-flex; align-items:center; gap:26px; background:#fff; border-radius:30px; padding:22px 40px 22px 26px; box-shadow:0 20px 50px rgba(0,0,0,.25); }
.chip .ic { width:110px; height:110px; border-radius:26px; background:var(--laranja); color:#fff; display:flex; align-items:center; justify-content:center; }
.chip .tx { font-family:Mont; font-weight:900; font-size:62px; color:var(--marinho); }
.tile { width:450px; height:300px; background:#fff; border-radius:36px; box-shadow:0 18px 44px rgba(14,42,71,.18); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; border-bottom:10px solid var(--laranja); }
.tile .tx { font-family:Mont; font-weight:900; font-size:44px; color:var(--marinho); line-height:1.05; text-align:center; }
.pill { display:inline-flex; align-items:center; gap:22px; font-family:Mont; font-weight:900; padding:30px 56px; border-radius:80px; }
</style></head><body>
'''


def ic(nome, w=110, cor="currentColor"):
    return f'<svg viewBox="0 0 100 100" style="width:{w}px;height:{w}px;color:{cor}"><use href="#{nome}"/></svg>'


chips = [("i-projeto", "Projeto", "projeto"), ("i-prazo", "Prazo", "prazo"), ("i-acomp", "Acompanhamento", "acomp")]
chips_html = "".join(
    f'<div class="el" data-in="{c[k]}" data-a="slideR" style="top:{1010 + i * 190}px"><div class="chip" style="width:860px">'
    f'<div class="ic">{ic(n, 76)}</div><div class="tx">{t}</div>'
    f'<svg viewBox="0 0 100 100" style="width:70px;height:70px;margin-left:auto;color:#2EAD5B"><path d="M20 52l20 20 40-42" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>'
    for i, (n, t, k) in enumerate(chips))

servicos = [("i-tijolo", "Construção", "construcao"), ("i-rolo", "Reforma", "reforma"), ("i-doc", "Regularização", "regular"),
            ("i-chave", "Habite-se", "habite"), ("i-lupa", "Laudos e<br>perícias", "laudos"), ("i-ferramenta", "Manutenção<br>predial", "manut")]
tiles = "".join(
    f'<div class="el" data-in="{c[k] - 0.05:.2f}" data-a="pop" style="top:{720 + (i // 2) * 335}px;left:{70 + (i % 2) * 490}px;right:auto;width:450px">'
    f'<div class="tile">{ic(n, 120, "var(--azul)")}<div class="tx">{t}</div></div></div>'
    for i, (n, t, k) in enumerate(servicos))

cenas = f'''<div id="stage">

  <section class="scene" data-start="0" data-end="{c['quem'] - 0.15}" data-shake="{c['parada']},{c['aumenta']}">
    <div class="f-mar"></div><div class="grade" style="--gc:rgba(255,255,255,.05)"></div>
    <div class="el h" data-in="{c['obra']}" data-a="slam" style="top:300px;font-size:190px;color:#fff">OBRA</div>
    <div class="el" data-in="{c['parada']}" data-a="slam" style="top:500px"><div class="tag" style="background:var(--laranja);font-size:150px;transform:rotate(-3deg)">PARADA</div></div>
    <div class="el" data-in="{c['pedreiro']}" data-a="slideL" style="top:830px"><div class="chip"><div class="ic" style="background:var(--marinho)">{ic("i-sumiu", 80)}</div><div class="tx">pedreiro que sumiu...</div></div></div>
    <div class="el" data-in="{c['orcamento']}" data-a="slideR" style="top:1060px"><div class="chip"><div class="ic" style="background:var(--verm)">{ic("i-sobe", 80)}</div><div class="tx">orçamento <span style="color:var(--verm)">só sobe</span></div></div></div>
    <div class="el h" data-in="{c['aumenta']}" data-a="pop" style="top:1330px;font-size:84px;color:var(--verm)">R$ <span style="font-size:120px">+ + +</span></div>
  </section>

  <section class="scene" data-start="{c['quem'] - 0.15}" data-end="{c['agora'] - 0.15}" data-shake="{c['dor']}">
    <div class="f-gelo"></div><div class="grade" style="--gc:rgba(14,42,71,.06)"></div>
    <div class="el h" data-in="{c['quem']}" data-a="rise" style="top:420px;font-size:84px;color:var(--marinho)">Quem já reformou<br>sabe:</div>
    <div class="el h" data-in="{c['dor']}" data-a="slam" style="top:720px;font-size:170px;color:var(--laranja2);line-height:.95">DOR DE<br>CABEÇA</div>
    <div class="el" data-in="{c['comeco']}" data-a="pop" style="top:1110px"><div class="tag" style="background:var(--marinho);font-size:70px">do começo ao fim.</div></div>
  </section>

  <section class="scene" data-start="{c['agora'] - 0.15}" data-end="{c['na'] - 0.15}">
    <div class="f-azul"></div><div class="grade" style="--gc:rgba(255,255,255,.07)"></div>
    <div class="el h" data-in="{c['agora']}" data-a="drop" style="top:220px;font-size:80px;color:#fff">Agora imagina<br>a sua obra com</div>
    <div class="el" data-in="{c['engenheiro'] - 0.1:.2f}" data-a="pop" style="top:470px">{ic("i-capacete", 180, "var(--laranja)")}</div>
    <div class="el h" data-in="{c['engenheiro']}" data-a="slam" style="top:680px;font-size:104px;color:#fff;line-height:1">ENGENHEIRO<br><span style="color:var(--laranja)">DE VERDADE</span></div>
    {chips_html}
  </section>

  <section class="scene" data-start="{c['na'] - 0.15}" data-end="{c['tudo'] - 0.15}">
    <div class="f-gelo"></div><div class="grade" style="--gc:rgba(14,42,71,.06)"></div>
    <div class="el" data-in="{c['na']}" data-a="pop" style="top:170px" id="logo4"></div>
    <div class="el h" data-in="{c['inezo'] + 0.45:.2f}" data-a="slam" style="top:520px;font-size:96px;color:var(--laranja2)">é assim!</div>
    {tiles}
  </section>

  <section class="scene" data-start="{c['tudo'] - 0.15}" data-end="{c['chama'] - 0.15}">
    <div class="f-lar"></div><div class="grade" style="--gc:rgba(255,255,255,.1)"></div>
    <div class="el h" data-in="{c['tudo']}" data-a="slam" style="top:440px;font-size:150px;color:#fff;line-height:.95">TUDO NUM<br>LUGAR SÓ</div>
    <div class="el" data-in="{c['aqui'] - 0.2:.2f}" data-a="pop" style="top:860px">{ic("i-pin", 170, "var(--marinho)")}</div>
    <div class="el h" data-in="{c['aqui']}" data-a="rise" style="top:1060px;font-size:110px;color:var(--marinho)">em Brasília</div>
    <div class="el" data-in="{c['aqui'] + 0.4:.2f}" data-a="rise" style="top:1210px;font-family:Inter;font-weight:700;font-size:42px;color:#fff">SCLN 208 · Bloco B · Loja 25 · Asa Norte</div>
  </section>

  <section class="scene" data-start="{c['chama'] - 0.15}" data-end="{FIM + 1}">
    <div class="f-mar"></div><div class="grade" style="--gc:rgba(255,255,255,.05)"></div>
    <div class="el" data-in="{c['chama'] - 0.05:.2f}" data-a="pop" style="top:260px" id="logo6"></div>
    <div class="el" data-in="{c['whats']}" data-a="pop" style="top:700px"><div class="pill" style="background:#25D366;color:#fff;font-size:66px;box-shadow:0 20px 50px rgba(37,211,102,.35)"><svg viewBox="0 0 32 32" style="width:86px;height:86px;color:#fff"><use href="#i-whats"/></svg>CHAMA NO WHATS</div></div>
    <div class="el h" data-in="{c['whats'] + 0.35:.2f}" data-a="rise" style="top:920px;font-size:96px;color:#fff">{WHATS}</div>
    <div class="el" data-in="{c['pede']}" data-a="pop" style="top:1070px"><div class="tag" style="background:var(--laranja);font-size:62px">peça seu orçamento</div></div>
    <div class="el h" data-in="{c['construindo']}" data-a="rise" style="top:1330px;font-family:Mont;font-weight:800;font-size:54px;color:#fff;line-height:1.2">Construindo seu sonho<br>com <span style="color:var(--laranja)">segurança</span> e qualidade.</div>
    <div class="el" data-in="{c['seguranca']}" data-a="rise" style="top:1540px;font-family:Inter;font-weight:700;font-size:40px;color:rgba(255,255,255,.75)">@inezo_reformas</div>
  </section>
</div>
'''

script = '''<script src="marca/brand.js"></script>
<script src="marca/icones.js"></script>
<script>
document.body.insertAdjacentHTML("afterbegin", ICONES);
const L = 0.15;
document.getElementById("logo4").innerHTML = INEZO.logo(820, "cor");
document.getElementById("logo6").innerHTML = INEZO.logo(860, "branco");
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3);
const back = (x, c = 1.8) => 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
const XF = 0.22;
function anim(el, t) {
  const t0 = parseFloat(el.dataset.in), a = el.dataset.a;
  const d = a === "pop" ? 0.36 : a === "slam" ? 0.3 : 0.42;
  const p = clamp((t - t0) / d), pe = eo(p);
  let op = a === "pop" || a === "slam" ? clamp(p * 4) : pe, tf = "";
  if (a === "rise") tf = `translateY(${((1 - pe) * 70).toFixed(1)}px)`;
  if (a === "drop") tf = `translateY(${(-(1 - pe) * 90).toFixed(1)}px)`;
  if (a === "pop") tf = `scale(${Math.max(0.02, back(p)).toFixed(4)})`;
  if (a === "slam") tf = `scale(${(1 + (1 - pe) * 1.4).toFixed(4)})`;
  if (a === "slideL") tf = `translateX(${(-(1 - pe) * 1100).toFixed(1)}px)`;
  if (a === "slideR") tf = `translateX(${((1 - pe) * 1100).toFixed(1)}px)`;
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
    let sh = "";
    (s.dataset.shake || "").split(",").filter(Boolean).map(Number).forEach(k => {
      const q = t - k; if (q > 0 && q < 0.35) { const amp = 14 * (1 - q / 0.35); sh = ` translate(${(Math.sin(q * 90) * amp).toFixed(1)}px,${(Math.cos(q * 70) * amp).toFixed(1)}px)`; }
    });
    s.style.transform = `scale(${(1 + 0.05 * (1 - eo(clamp((t - a) / 0.5)))).toFixed(4)})${sh}`;
    s.querySelectorAll(".grade").forEach(g => g.style.transform = `translate(${((t * 14) % 90).toFixed(1)}px,${((t * 20) % 90).toFixed(1)}px)`);
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  });
}
window.render = render;
render(0);
</script>
</body></html>'''
(ROOT / "anuncio.html").write_text(head + cenas + script)
print("anuncio.html · duração", round(FIM, 2))
