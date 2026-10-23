#!/usr/bin/env python3
"""MVM Ótica - criativo de lançamento (Ceilândia). Cenas sincronizadas com audio/cues.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues.json"))
FIM = c["fim"] + 1.3

head = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>MVM Ótica - lançamento</title>
<style>
@font-face { font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
:root { --verde:#14573A; --verde2:#0E3F2A; --rosa:#E23C5B; --laranja:#F0801E; --amarelo:#FDD20A; --ambar:#F2B33D; --terra:#E46F4F; --creme:#F7EEDC; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--amarelo); }
#stage { position:relative; width:1080px; height:1920px; overflow:hidden; font-family:M, sans-serif; }
.scene { position:absolute; inset:0; opacity:0; overflow:hidden; }
.el { position:absolute; left:50px; right:50px; text-align:center; opacity:0; will-change:transform, opacity; }
.A { font-family:Anton; line-height:.95; text-transform:uppercase; letter-spacing:.005em; }
.f-am { position:absolute; inset:0; background:radial-gradient(circle at 50% 40%,#FFE14D,#FDD20A 45%,#F2B33D 100%); }
.f-cr { position:absolute; inset:0; background:var(--creme); }
.f-vd { position:absolute; inset:0; background:radial-gradient(circle at 50% 35%,#1E7A50,#14573A 50%,#0B3524 100%); }
.f-rs { position:absolute; inset:0; background:radial-gradient(circle at 50% 40%,#F2566F,#E23C5B 50%,#B82543 100%); }
.sol { position:absolute; left:50%; top:50%; width:2600px; height:2600px; margin:-1300px 0 0 -1300px; }
.ladrilho { position:absolute; inset:0; opacity:.18; }
.tag { display:inline-block; font-family:Anton; text-transform:uppercase; padding:14px 46px 22px; border-radius:22px; line-height:1; }
.card { display:flex; align-items:center; gap:34px; background:#fff; border-radius:36px; padding:30px 40px; box-shadow:0 22px 50px rgba(14,63,42,.25); text-align:left; }
.card .ic { flex:none; width:130px; height:130px; border-radius:32px; display:flex; align-items:center; justify-content:center; }
.card .t { font-family:Anton; font-size:74px; line-height:1; color:var(--verde); text-transform:uppercase; }
.w { display:inline-block; overflow:hidden; vertical-align:top; padding:.08em .03em .12em; margin:-.08em -.03em -.12em; }
.w > span { display:inline-block; }
.risco { position:absolute; left:-14px; right:-14px; top:50%; height:14px; background:var(--rosa); border-radius:7px; transform-origin:left; }
</style></head><body><div id="stage">
'''


def W(texto, t, st="", cls="A", passo=0.06, a="palavras"):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="{a}" data-passo="{passo}" style="{st}">{texto}</div>'


def E(html, t, a="pop", st="", cls=""):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="{a}" style="{st}">{html}</div>'


SOL = '<svg class="sol" data-sol="{v}" viewBox="-100 -100 200 200">' + "".join(
    f'<path d="M0 0 L{120 * __import__("math").cos(i * 0.2618):.2f} {120 * __import__("math").sin(i * 0.2618):.2f} L{120 * __import__("math").cos(i * 0.2618 + .13):.2f} {120 * __import__("math").sin(i * 0.2618 + .13):.2f}Z" fill="{{cor}}"/>'
    for i in range(24)) + '</svg>'


def sol(cor, v=1):
    return SOL.replace("{v}", str(v)).replace("{cor}", cor)


LADRILHO = ('<svg class="ladrilho" viewBox="0 0 1080 1920"><defs><pattern id="lad" width="180" height="180" patternUnits="userSpaceOnUse">'
            '<rect width="180" height="180" fill="none"/><path d="M0 0h90v90H0z" fill="{a}"/><circle cx="135" cy="45" r="38" fill="{b}"/>'
            '<path d="M90 180 180 90v90z" fill="{b}"/><circle cx="45" cy="135" r="20" fill="{a}"/></pattern></defs><rect width="1080" height="1920" fill="url(#lad)"/></svg>')


def lad(a, b):
    return LADRILHO.replace("{a}", a).replace("{b}", b)


OCULOS = '''<svg viewBox="0 0 400 160" style="width:640px;height:256px"><g fill="none" stroke="#14573A" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">
  <path class="tr" pathLength="1" d="M20 50 Q22 140 100 140 Q170 140 172 70 Q172 40 140 38 L40 38 Q20 38 20 50Z"/>
  <path class="tr" pathLength="1" d="M380 50 Q378 140 300 140 Q230 140 228 70 Q228 40 260 38 L360 38 Q380 38 380 50Z"/>
  <path class="tr" pathLength="1" d="M172 62 Q200 44 228 62"/></g>
  <g fill="#F0801E"><circle cx="70" cy="80" r="10" opacity=".0" class="br"/></g></svg>'''

CEL = '''<div style="display:inline-block;width:500px;height:880px;border-radius:70px;background:#0B3524;padding:26px;box-shadow:0 40px 90px rgba(0,0,0,.35)">
  <div style="width:100%;height:100%;border-radius:50px;background:#F7EEDC;padding:60px 40px;text-align:left" id="tela">
    <div style="font-weight:800;font-size:34px;color:#14573A">Mensagens</div>
    <div style="margin-top:40px;background:#fff;border-radius:26px;padding:24px 28px;font-weight:600;font-size:32px;color:#333;line-height:1.35">Oi! A entrega do seu pedido chega amanhã entre 8h e 12h 😊</div>
    <div style="margin-top:26px;margin-left:80px;background:#FDD20A;border-radius:26px;padding:24px 28px;font-weight:600;font-size:32px;color:#333;line-height:1.35">Perfeito, obrigado! Qual o número do pedido?</div>
    <div style="margin-top:26px;background:#fff;border-radius:26px;padding:24px 28px;font-weight:600;font-size:32px;color:#333;line-height:1.35">Pedido nº 48.213 · confira no app</div>
  </div></div>'''

ETIQ = '''<svg viewBox="0 0 420 260" style="width:600px;height:372px"><g transform="translate(10 10)">
  <path d="M60 0h330a10 10 0 0 1 10 10v220a10 10 0 0 1-10 10H60L0 120z" fill="#E23C5B"/><circle cx="58" cy="120" r="18" fill="#FDD20A"/>
  <text x="235" y="110" text-anchor="middle" font-family="Anton" font-size="78" fill="#fff">R$ $$$$</text>
  <text x="235" y="185" text-anchor="middle" font-family="M" font-weight="800" font-size="34" fill="#FFE14D">CARO DEMAIS</text></g></svg>'''


def ic(path):
    return f'<svg viewBox="0 0 100 100" style="width:84px;height:84px" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">{path}</svg>'


I_ARM = '<path d="M8 40h84M18 40c0 22 8 30 22 30s20-10 20-20M82 40c0 22-8 30-22 30"/>'
I_LEN = '<circle cx="50" cy="50" r="34"/><path d="M34 44a18 18 0 0 1 16-14"/>'
I_BOL = '<path d="M20 34h60l-6 50H26z"/><path d="M36 34v-6a14 14 0 0 1 28 0v6"/><path d="M42 58h16M50 50v16"/>'
cards = [(I_ARM, "Armação de todo estilo", "var(--verde)", "armacao"), (I_LEN, "Lente de qualidade", "var(--rosa)", "lente"),
         (I_BOL, "Preço que cabe no bolso", "var(--laranja)", "preco")]
cards_html = "".join(
    f'<div class="el" data-in="{c[k]:.2f}" data-a="{"slideL" if i % 2 == 0 else "slideR"}" style="top:{760 + i * 250}px"><div class="card"><div class="ic" style="background:{cor}">{ic(p)}</div>'
    f'<div class="t" style="font-size:{80 if len(t) > 20 else 86}px">{t}</div></div></div>'
    for i, (p, t, cor, k) in enumerate(cards))

cenas = f'''
  <section class="scene" data-start="0" data-end="{c['chegou'] - 0.12:.2f}" data-shake="{c['ceilandia']:.2f}">
    <div class="f-am"></div>{sol("rgba(240,128,30,.22)")}
    {E('<img src="assets/logo_mvm.png" style="width:420px">', 0.0, "fade", "top:150px")}
    {W('ATENÇÃO,', c['atencao'], "top:620px;font-size:230px;color:var(--verde)", a="slam")}
    {W('CEILÂNDIA!', c['ceilandia'], "top:860px;font-size:230px;color:var(--rosa)", a="slam")}
  </section>

  <section class="scene" data-start="{c['chegou'] - 0.12:.2f}" data-end="{c['vista'] - 0.12:.2f}">
    <div class="f-cr"></div>{lad("#F2B33D", "#E46F4F")}
    {E(OCULOS, c['chegou'] - 0.05, "fade", "top:360px")}
    {W('Chegou ótica', c['chegou'], "top:720px;font-size:150px;color:var(--verde)", passo=0.1)}
    {W('nova', c['chegou'] + 0.5, "top:880px;font-size:230px;color:var(--rosa)")}
    {E('<div class="tag" style="background:var(--laranja);color:#fff;font-size:100px;transform:rotate(-4deg)">NO PEDAÇO!</div>', c['pedaco'], "slam", "top:1140px")}
  </section>

  <section class="scene" data-start="{c['vista'] - 0.12:.2f}" data-end="{c['oculos'] - 0.12:.2f}">
    <div class="f-vd"></div>{lad("#1E7A50", "#0E3F2A")}
    {W('Sabe aquela', c['vista'] - 0.25, "top:150px;font-size:70px;color:#FFE14D", "A", 0.08)}
    {W('VISTA CANSADA?', c['vista'], "top:240px;font-size:120px;color:#fff", "A", 0.08)}
    {E(CEL, c['vista'] + 0.2, "rise", "top:520px")}
    {E('<div class="tag" style="background:var(--rosa);color:#fff;font-size:72px;transform:rotate(-3deg)">LETRINHA EMBAÇANDO...</div>', c['letrinha'], "slam", "top:1500px")}
  </section>

  <section class="scene" data-start="{c['oculos'] - 0.12:.2f}" data-end="{c['pois'] - 0.12:.2f}">
    <div class="f-am"></div>{sol("rgba(226,60,91,.12)", -1)}
    {W('E o óculos que', c['oculos'], "top:300px;font-size:110px;color:var(--verde)", "A", 0.08)}
    {W('CUSTA OS OLHOS', c['olhos'], "top:440px;font-size:150px;color:var(--rosa)", "A", 0.08)}
    {W('DA CARA?', c['cara'], "top:600px;font-size:150px;color:var(--rosa)", a="slam")}
    {E(ETIQ, c['olhos'] - 0.1, "balanca", "top:900px")}
  </section>

  <section class="scene" data-start="{c['pois'] - 0.12:.2f}" data-end="{c['chegou2'] - 0.12:.2f}" data-shake="{c['acabou']:.2f}">
    <div class="f-rs"></div>{sol("rgba(255,255,255,.08)")}
    {W('Pois é...', c['pois'], "top:560px;font-size:110px;color:#FFE14D", "A", 0.12)}
    {E('<div class="tag" style="background:#fff;color:var(--rosa);font-size:230px;transform:rotate(-5deg);box-shadow:0 30px 70px rgba(0,0,0,.25)">ACABOU!</div>', c['acabou'], "slam", "top:760px")}
  </section>

  <section class="scene" data-start="{c['chegou2'] - 0.12:.2f}" data-end="{c['armacao'] - 0.12:.2f}">
    <div class="f-am"></div>{sol("rgba(240,128,30,.2)")}
    {W('Chegou a', c['chegou2'], "top:380px;font-size:90px;color:var(--verde)", "A", 0.1)}
    {E('<img src="assets/logo_mvm.png" style="width:960px">', c['mvm'] - 0.05, "pop", "top:540px")}
    {W('A brasilidade', c['brasilidade'], "top:1020px;font-size:150px;color:var(--verde)", "A", 0.08)}
    {W('em cada olhar', c['brasilidade'] + 0.6, "top:1180px;font-size:150px;color:var(--terra)", "A", 0.08)}
  </section>

  <section class="scene" data-start="{c['armacao'] - 0.12:.2f}" data-end="{c['porque'] - 0.12:.2f}">
    <div class="f-cr"></div>{lad("#F2B33D", "#14573A")}
    {E('<img src="assets/logo_mvm.png" style="width:440px">', c['armacao'] - 0.1, "fade", "top:330px")}
    {cards_html}
  </section>

  <section class="scene" data-start="{c['porque'] - 0.12:.2f}" data-end="{c['corre'] - 0.12:.2f}">
    <div class="f-vd"></div>
    {E('<div style="border-radius:40px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.4);border:8px solid #FDD20A"><img src="assets/pessoas.jpg" style="width:980px;display:block" class="kb"></div>', c['porque'] - 0.1, "rise", "top:200px")}
    {W('Óculos é pra', c['porque'], "top:900px;font-size:130px;color:#fff", "A", 0.08)}
    {W('TODO MUNDO!', c['todo'], "top:1060px;font-size:200px;color:#FDD20A", a="slam")}
  </section>

  <section class="scene" data-start="{c['corre'] - 0.12:.2f}" data-end="{FIM + 1}">
    <div class="f-am"></div>{sol("rgba(240,128,30,.18)")}
    {E('<div class="tag" style="background:var(--rosa);color:#fff;font-size:80px;transform:rotate(-3deg)">CORRE LÁ!</div>', c['corre'], "slam", "top:170px")}
    {E('<svg viewBox="0 0 100 100" style="width:150px;height:150px"><path d="M50 94S16 60 16 38a34 34 0 0 1 68 0c0 22-34 56-34 56z" fill="#14573A"/><circle cx="50" cy="38" r="13" fill="#FDD20A"/></svg>', c['shopping'] - 0.1, "pop", "top:340px")}
    {W('Shopping Popular', c['shopping'], "top:520px;font-size:110px;color:var(--verde)", "A", 0.08)}
    {W('da Ceilândia', c['ceilandia2'], "top:640px;font-size:110px;color:var(--verde)", "A", 0.08)}
    {E('<div class="tag" style="background:var(--verde);color:#FDD20A;font-size:150px">BOX 62 E 63</div>', c['box'], "slam", "top:800px")}
    {E('<div style="display:inline-flex;align-items:center;gap:22px;background:#fff;border-radius:60px;padding:18px 44px;font-weight:900;font-size:50px;color:var(--rosa);letter-spacing:.06em">★ INAUGURAÇÃO ★</div>', c['inauguracao'], "pop", "top:1050px")}
    {E('<img src="assets/logo_mvm.png" style="width:720px">', c['mvm2'] - 0.1, "pop", "top:1200px")}
    {W('Vem ver o mundo do seu jeito!', c['vemver'], "top:1520px;font-size:66px;color:var(--terra)", "A", 0.07)}
  </section>
'''

script = f'''
</div>
<script>
const L = 0.15, C = {json.dumps(c)};
document.querySelectorAll('[data-a="palavras"],[data-a="slam"]').forEach(el => {{
  if (el.dataset.a !== "palavras") return;
  el.innerHTML = el.textContent.split(/(\\s+)/).map(p => /^\\s+$/.test(p) ? " " : `<span class="w"><span>${{p}}</span></span>`).join("");
}});
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3), eo5 = x => 1 - Math.pow(1 - x, 5);
const back = (x, k = 1.8) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);
const XF = 0.14;
function anim(el, t) {{
  const t0 = parseFloat(el.dataset.in), a = el.dataset.a;
  if (a === "palavras") {{
    const passo = parseFloat(el.dataset.passo); let vis = false;
    el.querySelectorAll(".w > span").forEach((s, i) => {{
      const p = clamp((t - t0 - i * passo) / 0.4), pe = eo5(p);
      s.style.transform = `translateY(${{((1 - pe) * 110).toFixed(1)}}%) rotate(${{((1 - pe) * 6).toFixed(2)}}deg)`;
      if (p > 0) vis = true;
    }});
    el.style.opacity = vis ? 1 : 0; el.style.visibility = vis ? "visible" : "hidden"; return;
  }}
  const d = {{pop: .4, slam: .28, fade: .6, rise: .5, slideL: .45, slideR: .45, balanca: .5}}[a] || .5;
  const p = clamp((t - t0) / d), pe = eo(p);
  let op = (a === "pop" || a === "slam") ? clamp(p * 4) : pe, tf = "";
  if (a === "pop") tf = `scale(${{Math.max(.02, back(p)).toFixed(4)}})`;
  if (a === "slam") tf = `scale(${{(1 + (1 - pe) * 1.5).toFixed(4)}})`;
  if (a === "fade") tf = `scale(${{(1.08 - .08 * pe).toFixed(4)}})`;
  if (a === "rise") tf = `translateY(${{((1 - pe) * 120).toFixed(1)}}px)`;
  if (a === "slideL") tf = `translateX(${{(-(1 - pe) * 1100).toFixed(1)}}px)`;
  if (a === "slideR") tf = `translateX(${{((1 - pe) * 1100).toFixed(1)}}px)`;
  if (a === "balanca") {{ const q = Math.max(0, t - t0); tf = `translateY(${{((1 - pe) * -400).toFixed(1)}}px) rotate(${{(Math.sin(q * 5) * 14 * Math.exp(-q * 1.2)).toFixed(2)}}deg)`; el.style.transformOrigin = "50% 0"; }}
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
    s.style.transform = `scale(${{(1.06 - .06 * eo(clamp((t - a) / .45))).toFixed(4)}})${{sh}}`;
    s.querySelectorAll(".sol").forEach(o => o.style.transform = `rotate(${{(t * 10 * (+o.dataset.sol || 1)).toFixed(2)}}deg)`);
    s.querySelectorAll(".ladrilho").forEach(o => o.style.transform = `translate(${{((t * 20) % 180).toFixed(1)}}px,${{((t * 14) % 180).toFixed(1)}}px)`);
    s.querySelectorAll(".kb").forEach(o => o.style.transform = `scale(${{(1 + .06 * clamp((t - a) / 2.5)).toFixed(4)}})`);
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  }});
  document.querySelectorAll(".tr").forEach((p, i) => p.style.strokeDasharray = `${{eo(clamp((t - C.chegou + .05 - i * .15) / .7)).toFixed(3)}} 1`);
  const tela = document.getElementById("tela");
  if (tela) tela.style.filter = `blur(${{(Math.max(0, clamp((t - C.cansada) / 1.2)) * 7 + clamp((t - C.letrinha) / .6) * 5).toFixed(1)}}px)`;
}}
window.render = render;
render(0);
</script>
</body></html>'''
(ROOT / "anuncio.html").write_text(head + cenas + script)
print("anuncio.html · duração", round(FIM, 2))
