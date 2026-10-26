#!/usr/bin/env python3
"""Insert Coin - moedas e distintivos militares (tráfego Brasília). Cenas sincronizadas com audio/cues.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues.json"))
c["bora"] = c["insert"]
json.dump(c, open(ROOT / "audio/cues.json", "w"), indent=1)
FIM = c["fim"] + 1.6

head = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Insert Coin - anúncio</title>
<style>
@font-face { font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 300; src: url(fonts/montserrat-latin-300-normal.woff); }
@font-face { font-family: M; font-weight: 500; src: url(fonts/montserrat-latin-500-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
:root { --ouro:#D8B25A; --ouro2:#F6DE9A; --bronze:#9A6B32; --preto:#0B0A08; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--preto); }
#stage { position:relative; width:1080px; height:1920px; overflow:hidden; font-family:M, sans-serif; color:#fff; background:var(--preto); }
.scene { position:absolute; inset:0; opacity:0; overflow:hidden; }
.el { position:absolute; left:50px; right:50px; text-align:center; opacity:0; will-change:transform, opacity, filter; }
.A { font-family:Anton; line-height:.95; text-transform:uppercase; letter-spacing:.01em; }
.T { font-weight:600; letter-spacing:.38em; text-transform:uppercase; }
.ouro { background:linear-gradient(180deg,#FFF0C2 0%,#E7C36F 40%,#A87A35 75%,#E9C877 100%); -webkit-background-clip:text; background-clip:text; color:transparent; padding:.1em .03em; margin:-.1em -.03em; }
.prata { background:linear-gradient(180deg,#FFFFFF 0%,#C9CDD3 45%,#7D838C 70%,#E5E8EC 100%); -webkit-background-clip:text; background-clip:text; color:transparent; padding:.1em .03em; margin:-.1em -.03em; }
.couro { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 35%,#2A2118 0%,#120E0A 60%,#070605 100%); }
.couro::after { content:""; position:absolute; inset:0; opacity:.35; background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1.2px); background-size:7px 7px; }
.ph { position:absolute; inset:-5%; background-size:cover; background-position:center; }
.foto { border-radius:28px; overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,.7), 0 0 0 2px rgba(216,178,90,.45); }
.chip { display:inline-block; padding:22px 44px; border:2px solid rgba(216,178,90,.7); border-radius:16px; background:rgba(10,8,6,.75); font-family:Anton; font-size:76px; text-transform:uppercase; letter-spacing:.02em; }
.carimbo { display:inline-block; font-family:Anton; text-transform:uppercase; padding:10px 36px 16px; border:6px solid; border-radius:10px; }
.w { display:inline-block; overflow:hidden; vertical-align:top; padding:.1em .03em .14em; margin:-.1em -.03em -.14em; }
.w > span { display:inline-block; }
.brilho { position:absolute; inset:0; background:linear-gradient(105deg,transparent 40%,rgba(255,240,200,.55) 50%,transparent 60%); mix-blend-mode:overlay; }
#flash { position:absolute; inset:0; background:radial-gradient(circle,#FFF6DA,#D8B25A 50%,transparent 80%); opacity:0; z-index:600; mix-blend-mode:screen; }
.vin { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%,transparent 50%,rgba(0,0,0,.75) 100%); z-index:550; pointer-events:none; }
</style></head><body><div id="stage">
'''

LOGO = lambda fs: (f'<div style="display:inline-block;text-align:center;line-height:.86"><div class="A prata" style="font-size:{fs}px;letter-spacing:.04em">INSERT</div>'
                   f'<div class="A" style="font-size:{int(fs * 1.25)}px;display:flex;align-items:center;justify-content:center;gap:{int(fs * .03)}px">'
                   f'<span class="prata">C</span><span style="display:inline-block;width:{int(fs * .62)}px;height:{int(fs * .95)}px;border-radius:50%;'
                   f'background:radial-gradient(circle at 35% 30%,#FFF3C4,#E9C46A 35%,#B98A38 70%,#7A5520);box-shadow:inset -6px -8px 0 rgba(0,0,0,.25),0 0 30px rgba(233,196,106,.5)"></span>'
                   f'<span class="prata">IN</span></div></div>')


def moeda(s, extra=""):
    return (f'<div class="giro" style="display:inline-block;width:{s}px;height:{s}px;position:relative;border-radius:50%;overflow:hidden;{extra}">'
            f'<img src="assets/moeda_eng.png" style="width:{s}px;height:{s}px;border-radius:50%;display:block;box-shadow:0 0 0 6px #6E5328,0 30px 80px rgba(0,0,0,.8),0 0 120px rgba(216,178,90,.35)">'
            f'<div class="brilho" style="border-radius:50%"></div></div>')


def Wd(texto, t, st="", cls="A", passo=0.07):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="palavras" data-passo="{passo}" style="{st}">{texto}</div>'


def E(html, t, a="up", st="", cls=""):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="{a}" style="{st}">{html}</div>'


def foto(arq, w, h, pos="center"):
    return f'<div class="foto" style="width:{w}px;height:{h}px;position:relative;margin:0 auto"><div class="ph kb" style="background-image:url(assets/{arq});background-position:{pos}"></div></div>'


GAVETA = '''<svg viewBox="0 0 600 420" style="width:640px;height:448px">
  <rect x="20" y="40" width="560" height="360" rx="20" fill="#2B231B" stroke="#4A3B2C" stroke-width="6"/>
  <g id="gav"><rect x="50" y="90" width="500" height="260" rx="14" fill="#3A2F24" stroke="#5A4835" stroke-width="5"/>
  <rect x="250" y="200" width="100" height="22" rx="11" fill="#8C7B66"/>
  <g id="chaveiro"><circle cx="300" cy="140" r="34" fill="#8E9196"/><circle cx="300" cy="140" r="16" fill="#3A2F24"/><text x="300" y="235" text-anchor="middle" font-family="M" font-weight="800" font-size="30" fill="#BFC2C6">BRINDE</text></g></g></svg>'''

galeria = ["t00.jpg", "t01.jpg", "t11.jpg", "t12.jpg", "t21.jpg", "t30.jpg", "t31.jpg", "t02.jpg"]
gal_html = "".join(f'<div style="flex:none;width:470px;height:628px;border-radius:24px;overflow:hidden;box-shadow:0 0 0 2px rgba(216,178,90,.45),0 24px 60px rgba(0,0,0,.6)">'
                   f'<img src="assets/{g}" style="width:100%;height:100%;object-fit:cover"></div>' for g in galeria)

publico = [("TURMAS DE FORMAÇÃO", "turmas", "t00.jpg"), ("BATALHÕES", "batalhoes", "t11.jpg"), ("POLÍCIAS", "policias", "t31.jpg"), ("FORÇAS ARMADAS", "forcas", "t30.jpg")]
pub_bg = "".join(f'<div class="bgpub" data-in="{c[k] - 0.1:.2f}" style="position:absolute;inset:0;opacity:0"><div class="ph kb" style="background-image:url(assets/{img});filter:brightness(.42) saturate(1.1)"></div></div>'
                 for _, k, img in publico)
pub_chips = "".join(f'<div class="el" data-in="{c[k]:.2f}" data-a="slam" style="top:{760 + i * 200}px"><span class="chip"><span class="ouro">{t}</span></span></div>'
                    for i, (t, k, _) in enumerate(publico))

cenas = f'''
  <section class="scene" data-start="0" data-end="{c['turma'] - 0.12:.2f}">
    <div class="couro"></div>
    {E(moeda(300), 0.0, "fade", "top:330px")}
    {E('<div class="T" style="font-size:48px;color:var(--ouro2)">Atenção,</div>', c['atencao'], "up", "top:720px")}
    {E('<div class="A ouro" style="font-size:190px">BRASÍLIA!</div>', c['brasilia'], "slam", "top:820px")}
  </section>

  <section class="scene" data-start="{c['turma'] - 0.12:.2f}" data-end="{c['ganhar'] - 0.12:.2f}">
    <div class="couro"></div>
    {Wd('Sua turma', c['turma'], "top:330px;font-size:120px;color:#fff")}
    {E('<span class="carimbo" style="color:#E8DFC8;border-color:#E8DFC8;font-size:130px;transform:rotate(-4deg)">SUOU.</span>', c['suou'], "slam", "top:560px")}
    {E('<span class="carimbo" style="color:#D8B25A;border-color:#D8B25A;font-size:130px;transform:rotate(3deg)">RALOU.</span>', c['ralou'], "slam", "top:800px")}
    {E('<span class="carimbo" style="color:#fff;border-color:#fff;background:#7A1E1E;font-size:110px;transform:rotate(-2deg)">VENCEU O CURSO.</span>', c['venceu'], "slam", "top:1040px")}
  </section>

  <section class="scene" data-start="{c['ganhar'] - 0.12:.2f}" data-end="{c['naone'] - 0.12:.2f}">
    <div class="couro" style="filter:grayscale(.7)"></div>
    {Wd('E vai ganhar de lembrança', c['ganhar'], "top:300px;font-size:76px;color:#C9C3B6", "A", 0.06)}
    {Wd('UM BRINDE GENÉRICO', c['brinde'], "top:410px;font-size:120px;color:#fff", "A", 0.08)}
    {E(GAVETA, c['brinde'] + 0.2, "up", "top:720px")}
    {Wd('que vai parar no fundo da gaveta?', c['gaveta'] - 0.9, "top:1260px;font-size:70px;color:#C9C3B6", "A", 0.06)}
  </section>

  <section class="scene" data-start="{c['naone'] - 0.12:.2f}" data-end="{c['insert'] - 0.1:.2f}">
    <div class="couro"></div>
    {E('<div class="A" style="font-size:110px;color:#fff">NÃO, NÉ?</div>', c['naone'], "slam", "top:220px")}
    {Wd('Essa história merece uma', c['essa'], "top:420px;font-size:80px;color:#fff", "A", 0.07)}
    {E(moeda(560), c['moeda'] - 0.25, "giroin", "top:620px")}
    {E('<div class="A ouro" style="font-size:230px">MOEDA.</div>', c['moeda'], "slam", "top:1260px")}
  </section>

  <section class="scene" data-start="{c['insert'] - 0.1:.2f}" data-end="{c['turmas'] - 0.12:.2f}">
    <div class="couro"></div>
    {E(LOGO(150), c['insert'] - 0.05, "pop", "top:170px")}
    <div id="galeria" style="position:absolute;top:640px;left:0;display:flex;gap:30px">{gal_html}</div>
    {E('<div class="A" style="font-size:96px"><span class="ouro">MOEDAS</span> <span style="color:#fff">&amp;</span> <span class="prata">DISTINTIVOS</span></div>', c['moedas'], "up", "top:1330px")}
    {E('<div class="T" style="font-size:36px;color:var(--ouro2)">Militares · Personalizados</div>', c['personalizados'], "up", "top:1460px")}
    {E('<div style="display:inline-flex;align-items:center;gap:20px;border:2px solid var(--ouro);border-radius:60px;padding:14px 40px"><span class="A ouro" style="font-size:80px">3D</span><span class="T" style="font-size:30px">Alta definição</span></div>', c['3d'], "pop", "top:1540px")}
  </section>

  <section class="scene" data-start="{c['turmas'] - 0.12:.2f}" data-end="{c['arte'] - 0.12:.2f}">
    {pub_bg}<div class="vin" style="z-index:1"></div>
    {E('<div class="T" style="font-size:40px;color:var(--ouro2)">Feito para</div>', c['turmas'] - 0.1, "up", "top:600px")}
    {pub_chips}
  </section>

  <section class="scene" data-start="{c['arte'] - 0.12:.2f}" data-end="{c['insert2'] - 0.12:.2f}">
    <div class="couro"></div>
    {E(foto("t20.jpg", 760, 760, "center 55%"), c['arte'] - 0.1, "up", "top:150px")}
    {E('<div class="A" style="font-size:110px"><span class="ouro">ARTE</span> <span style="color:#fff">E</span> <span class="ouro">FRETE</span> <span style="color:#fff">GRÁTIS</span></div>', c['arte'], "slam", "top:990px")}
    {E('<div class="A" style="font-size:96px;color:#fff">A PARTIR DE <span class="ouro" style="font-size:130px">50</span> UNIDADES</div>', c['50'], "up", "top:1150px")}
    {E('<span class="carimbo" style="color:#111;background:var(--ouro);border-color:var(--ouro);font-size:80px">TEM PRONTA ENTREGA</span>', c['pronta'] + 0.3, "slam", "top:1360px")}
  </section>

  <section class="scene" data-start="{c['insert2'] - 0.12:.2f}" data-end="{FIM + 1}">
    <div class="couro"></div>
    {E(LOGO(140), c['insert2'] - 0.05, "pop", "top:140px")}
    {E(moeda(380), c['insert2'] + 0.2, "giroin", "top:560px")}
    {Wd('Sua história,', c['historia'], "top:1010px;font-size:100px;color:#fff", "A", 0.08)}
    {Wd('<span class="ouro">eternizada em metal.</span>', c['historia'] + 0.85, "top:1130px;font-size:100px", "A", 0.08)}
    {E('<div style="display:inline-block;background:linear-gradient(180deg,#F3D78E,#C79A44);color:#140F08;font-family:Anton;font-size:80px;padding:22px 64px 28px;border-radius:18px;box-shadow:0 18px 60px rgba(216,178,90,.45)">FAÇA SUA COTAÇÃO</div>', c['faca'], "pop", "top:1340px")}
    {E('<div style="font-weight:700;font-size:36px;color:#E9DFC8">@insertcoin.br · linktr.ee/insertcoinmd</div>', c['faca'] + 0.5, "up", "top:1540px")}
  </section>
'''

script = f'''
<div class="vin"></div><div id="flash"></div></div>
<script>
const L = 0.15, C = {json.dumps(c)};
const FL = [C.brasilia, C.moeda, C.insert, C.insert2];
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
  const d = {{pop: .4, slam: .3, up: .5, fade: .8, giroin: .9}}[a] || .5;
  const p = clamp((t - t0) / d), pe = eo(p);
  let op = (a === "pop" || a === "slam") ? clamp(p * 4) : pe, tf = "", fl = "";
  if (a === "pop") tf = `scale(${{Math.max(.02, back(p)).toFixed(4)}})`;
  if (a === "slam") {{ tf = `scale(${{(1 + (1 - pe) * 1.4).toFixed(4)}})`; fl = p < 1 ? `blur(${{((1 - pe) * 8).toFixed(1)}}px)` : ""; }}
  if (a === "up") tf = `translateY(${{((1 - pe) * 70).toFixed(1)}}px)`;
  if (a === "fade") tf = `scale(${{(1.15 - .15 * pe).toFixed(4)}})`;
  if (a === "giroin") tf = `scale(${{(.5 + .5 * eo5(p)).toFixed(4)}})`;
  op = op < 0.003 ? 0 : op;
  el.style.opacity = op.toFixed(3); el.style.visibility = op > 0 ? "visible" : "hidden"; el.style.transform = tf; el.style.filter = fl || "none";
  el.querySelectorAll(".giro").forEach(g => {{
    const q = Math.max(0, t - t0), spin = a === "giroin" ? (1 - eo(clamp(q / 1.6))) * 720 + Math.sin(q * 1.4) * 18 : Math.sin(q * 1.2) * 25;
    g.style.transform = `perspective(1200px) rotateY(${{spin.toFixed(1)}}deg)`;
    const b = g.querySelector(".brilho"); if (b) b.style.transform = `translateX(${{(-120 + 240 * ((q * .45) % 1)).toFixed(0)}}%)`;
  }});
}}
function render(tv) {{
  const t = tv - L;
  let fo = 0; FL.forEach(k => {{ const q = t - k; if (q > 0 && q < .35) fo = Math.max(fo, .32 * (1 - q / .35)); }});
  flash.style.opacity = fo.toFixed(3);
  document.querySelectorAll(".scene").forEach(s => {{
    const a = parseFloat(s.dataset.start), b = parseFloat(s.dataset.end);
    let op = 0;
    if (t >= a && t < b + XF) op = clamp((t - a) / XF) * (t > b ? 1 - clamp((t - b) / XF) : 1);
    if (a === 0) op = t < b ? 1 : op;
    s.style.opacity = op; s.style.visibility = op > 0 ? "visible" : "hidden"; s.style.zIndex = Math.round(a * 10 + 10);
    if (op <= 0) return;
    s.style.transform = `scale(${{(1.05 - .05 * eo(clamp((t - a) / .4))).toFixed(4)}})`;
    s.querySelectorAll(".kb").forEach(k => k.style.transform = `scale(${{(1.02 + .08 * clamp((t - a) / 6)).toFixed(4)}})`);
    s.querySelectorAll(".bgpub").forEach(bg => bg.style.opacity = clamp((t - parseFloat(bg.dataset.in)) / .25).toFixed(3));
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  }});
  const g = document.getElementById("galeria"); if (g) g.style.transform = `translateX(${{(80 - (t - C.insert) * 420).toFixed(0)}}px)`;
  const gav = document.getElementById("gav"); if (gav) {{
    const p = eo(clamp((t - C.gaveta + .6) / .7));
    gav.setAttribute("transform", `translate(0 ${{(-200 * (1 - p)).toFixed(1)}})`);
    document.getElementById("chaveiro").style.opacity = (1 - clamp((t - C.gaveta) / .5)).toFixed(2);
  }}
}}
window.render = render;
render(0);
</script>
</body></html>'''
(ROOT / "anuncio.html").write_text(head + cenas + script)
print("anuncio.html · duração", round(FIM, 2))
