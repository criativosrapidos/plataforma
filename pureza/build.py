#!/usr/bin/env python3
"""Pureza Multimarcas - iPhone 18 Pro / Pro Max (tráfego Brasília). Cenas sincronizadas com audio/cues.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues.json"))
c["bora"] = c["imagina"]
json.dump(c, open(ROOT / "audio/cues.json", "w"), indent=1)
FIM = c["fim"] + 2.4

head = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Pureza - iPhone 18</title>
<style>
@font-face { font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 500; src: url(fonts/montserrat-latin-500-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
:root { --lar:#FF7A1A; --lar2:#FFB15E; --preto:#080808; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--preto); }
#stage { position:relative; width:1080px; height:1920px; overflow:hidden; font-family:M, sans-serif; color:#fff; background:var(--preto); }
.scene { position:absolute; inset:0; opacity:0; overflow:hidden; }
.el { position:absolute; left:50px; right:50px; text-align:center; opacity:0; will-change:transform, opacity, filter; }
.A { font-family:Anton; line-height:.95; text-transform:uppercase; }
.T { font-weight:700; letter-spacing:.3em; text-transform:uppercase; }
.lar { background:linear-gradient(180deg,#FFC37A 0%,#FF8A1F 45%,#E8580A 100%); -webkit-background-clip:text; background-clip:text; color:transparent; padding:.1em .03em; margin:-.1em -.03em; }
.fundo { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 30%,#2A1609 0%,#0D0805 55%,#050505 100%); }
.fundo::before { content:""; position:absolute; left:-20%; right:-20%; top:58%; height:6px; background:linear-gradient(90deg,transparent,#FF7A1A,transparent); filter:blur(3px); opacity:.55; }
.fundo::after { content:""; position:absolute; inset:0; background:repeating-linear-gradient(90deg,rgba(255,122,26,.05) 0 2px,transparent 2px 120px); }
.ph { position:absolute; inset:-4%; background-size:cover; background-position:center; }
.foto { border-radius:30px; overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,.75), 0 0 0 3px rgba(255,122,26,.6), 0 0 60px rgba(255,122,26,.25); position:relative; margin:0 auto; }
.chip { display:inline-block; padding:18px 40px; border:3px solid var(--lar); border-radius:60px; background:rgba(10,6,3,.8); font-family:Anton; font-size:64px; text-transform:uppercase; }
.carimbo { display:inline-block; font-family:Anton; text-transform:uppercase; padding:8px 34px 14px; border:7px solid #E0302A; color:#E0302A; border-radius:12px; }
.preco { display:inline-flex; align-items:flex-start; gap:12px; font-family:Anton; line-height:.9; }
.w { display:inline-block; overflow:hidden; vertical-align:top; padding:.1em .03em .14em; margin:-.1em -.03em -.14em; }
.w > span { display:inline-block; }
.balao { display:inline-block; text-align:left; background:#1F2C34; color:#E9EDEF; border-radius:22px 22px 22px 6px; padding:22px 30px; font-size:40px; font-weight:600; max-width:820px; }
.balao small { display:block; text-align:right; font-size:26px; color:#8696A0; margin-top:8px; }
.dot { display:inline-block; width:70px; height:70px; border-radius:50%; border:4px solid rgba(255,255,255,.85); }
#flash { position:absolute; inset:0; background:radial-gradient(circle,#FFE2C2,#FF7A1A 55%,transparent 85%); opacity:0; z-index:600; mix-blend-mode:screen; }
.vin { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%,transparent 52%,rgba(0,0,0,.72) 100%); z-index:550; pointer-events:none; }
.logo { display:block; margin:0 auto; }
</style></head><body><div id="stage">
'''


def Wd(texto, t, st="", cls="A", passo=0.07):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="palavras" data-passo="{passo}" style="{st}">{texto}</div>'


def E(html, t, a="up", st="", cls=""):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="{a}" style="{st}">{html}</div>'


def foto(arq, w, h, pos="center", filtro=""):
    return f'<div class="foto" style="width:{w}px;height:{h}px"><div class="ph kb" style="background-image:url(assets/{arq});background-position:{pos};{filtro}"></div></div>'


def logo(w):
    return f'<img class="logo" src="assets/logo.png" style="width:{w}px">'


def preco(v, fs):
    return (f'<div class="preco"><span class="lar" style="font-size:{int(fs * .42)}px;margin-top:{int(fs * .12)}px">R$</span>'
            f'<span class="conta" data-v="{v}" style="font-size:{fs}px;color:#fff">0</span></div>')


cores = [("PRETO", "#151515", "preto"), ("SILVER", "#E6E6E3", "silver"), ("AZUL", "#8DB4E2", "azul"), ("BORDÔ", "#7B1E2E", "bordo")]
dots = "".join(f'<div class="el" data-in="{c[k]:.2f}" data-a="pop" style="left:{60 + i * 245}px;right:auto;width:230px;top:1380px">'
               f'<span class="dot" style="background:{h}"></span><div style="font-weight:800;font-size:36px;margin-top:14px;letter-spacing:.06em">{n}</div></div>'
               for i, (n, h, k) in enumerate(cores))

cenas = f'''
  <section class="scene" data-start="0" data-end="{c['quer'] - 0.15:.2f}">
    <div class="fundo"></div>
    {E('<div class="T" style="font-size:46px;color:var(--lar2)">Brasília,</div>', c['brasilia'], "up", "top:170px")}
    {Wd('o iPhone 18', c['iphone'], "top:250px;font-size:170px;color:#fff", "A", 0.09)}
    {Wd('<span class="lar">chegou!</span>', c['iphone'] + 0.55, "top:430px;font-size:150px", "A", 0.09)}
    {E(foto("linha_promax.jpg", 960, 680, "center 40%"), c['iphone'] + 0.2, "rise", "top:700px")}
    {E(logo(560), c['pureza'], "pop", "top:1480px")}
  </section>

  <section class="scene" data-start="{c['quer'] - 0.15:.2f}" data-end="{c['ninguem'] - 0.12:.2f}">
    <div class="fundo" style="filter:grayscale(.85) brightness(.8)"></div>
    {Wd('Quer trocar de celular, mas tem medo de...', c['quer'], "top:220px;font-size:72px;color:#D9D9D9", "A", 0.06)}
    {E('<span class="carimbo" style="font-size:130px;transform:rotate(-5deg)">PAGAR CARO?</span>', c['caro'] - 0.15, "slam", "top:470px")}
    {E('<div class="A" style="font-size:80px;color:#fff">OU CAIR NA MÃO DE QUEM</div>', c['cair'], "up", "top:780px")}
    {E('<div class="A" style="font-size:120px;color:#E0302A">SOME DEPOIS DA VENDA?</div>', c['some'], "slam", "top:880px")}
    {E('<div class="balao">Oi, tudo bem? O aparelho chegou com problema, pode me ajudar?<small>14:02 ✓✓</small></div>', c['some'] + 0.15, "rise", "top:1150px;text-align:left;left:70px")}
    {E('<div class="balao" style="opacity:.85">Alô?? Cadê você?<small>16:47 ✓✓</small></div>', c['some'] + 0.55, "rise", "top:1390px;text-align:left;left:70px")}
    {E('<div class="T" style="font-size:30px;color:#8696A0;letter-spacing:.12em">visto por último há 3 semanas</div>', c['some'] + 0.9, "fade", "top:1580px")}
  </section>

  <section class="scene" data-start="{c['ninguem'] - 0.12:.2f}" data-end="{c['imagina'] - 0.12:.2f}">
    <div class="fundo" style="filter:grayscale(1) brightness(.6)"></div>
    {E('<div class="A" style="font-size:170px;color:#fff">NINGUÉM</div><div class="A" style="font-size:170px;color:#fff">MERECE.</div>', c['ninguem'], "slam", "top:700px")}
  </section>

  <section class="scene" data-start="{c['imagina'] - 0.12:.2f}" data-end="{c['pro'] - 0.12:.2f}">
    <div class="ph kb" style="background-image:url(assets/dono_iphones.jpg);background-position:center 30%;filter:brightness(.55) saturate(1.1)"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,5,5,.85) 0%,transparent 30%,transparent 55%,rgba(5,5,5,.95) 85%)"></div>
    {Wd('Agora imagina sair hoje', c['imagina'], "top:150px;font-size:88px;color:#fff", "A", 0.07)}
    {Wd('com o seu <span class="lar">iPhone 18</span> na mão', c['imagina'] + 0.9, "top:260px;font-size:80px;color:#fff", "A", 0.07)}
    {E('<span class="chip"><span class="lar">✔ Segurança</span></span>', c['seguranca'], "slam", "top:1360px")}
    {E('<span class="chip"><span class="lar">✔ Preço justo</span></span>', c['preco'], "slam", "top:1520px")}
  </section>

  <section class="scene" data-start="{c['pro'] - 0.12:.2f}" data-end="{c['promax'] - 0.12:.2f}">
    <div class="fundo"></div>
    {E('<div class="A" style="font-size:150px;color:#fff">IPHONE 18 <span class="lar">PRO</span></div>', c['pro'], "slam", "top:140px")}
    {E('<span class="chip" style="font-size:56px">256GB</span>', c['256'], "pop", "top:330px")}
    {E(foto("azul_caixa.jpg", 560, 860, "center 40%"), c['pro'] + 0.1, "rise", "top:480px")}
    {E(preco(8700, 260), c['p8700'] - 0.1, "pop", "top:1400px")}
  </section>

  <section class="scene" data-start="{c['promax'] - 0.12:.2f}" data-end="{c['cores'] - 0.12:.2f}">
    <div class="fundo"></div>
    {E('<div class="A" style="font-size:136px;color:#fff">18 <span class="lar">PRO MAX</span></div>', c['promax'], "slam", "top:140px")}
    {E(foto("bordo.jpg", 540, 900, "center 40%"), c['promax'] + 0.1, "rise", "top:340px")}
    {E('<div class="T" style="font-size:40px;color:var(--lar2)">A partir de</div>', c['p9700'] - 0.4, "up", "top:1310px")}
    {E(preco(9700, 260), c['p9700'] - 0.1, "pop", "top:1370px")}
  </section>

  <section class="scene" data-start="{c['cores'] - 0.12:.2f}" data-end="{c['desde'] - 0.12:.2f}">
    <div class="fundo"></div>
    {E('<div class="A" style="font-size:120px;color:#fff">ESCOLHA A <span class="lar">SUA COR</span></div>', c['cores'], "slam", "top:200px")}
    {E(foto("linha_pro_caixas.jpg", 980, 840, "center 50%"), c['cores'] + 0.1, "rise", "top:420px")}
    {dots}
  </section>

  <section class="scene" data-start="{c['desde'] - 0.12:.2f}" data-end="{c['chama'] - 0.12:.2f}">
    <div class="fundo"></div>
    {E('<div class="T" style="font-size:46px;color:var(--lar2)">Desde</div>', c['desde'] - 0.05, "up", "top:280px")}
    {E('<div class="A lar" style="font-size:380px">2013</div>', c['desde'] + 0.1, "slam", "top:340px")}
    {E('<div class="T" style="font-size:34px;color:#ddd;letter-spacing:.2em">no mercado</div>', c['desde'] + 0.5, "up", "top:740px")}
    {E('<div style="font-size:150px;line-height:1">📍</div>', c['feira'] - 0.1, "pop", "top:880px")}
    {E('<div class="A" style="font-size:96px;color:#fff">FEIRA DOS IMPORTADOS</div>', c['feira'], "up", "top:1080px")}
    {E('<div style="font-weight:700;font-size:44px;color:#ccc">SIA Trecho 7</div>', c['feira'] + 0.3, "up", "top:1210px")}
    {E('<span class="chip"><span class="lar">BLOCO B · LOJA B180</span></span>', c['bloco'], "slam", "top:1310px")}
  </section>

  <section class="scene" data-start="{c['chama'] - 0.12:.2f}" data-end="{FIM + 1}">
    <div class="fundo"></div>
    {E(logo(720), c['chama'] - 0.05, "pop", "top:180px")}
    {Wd('Chama no WhatsApp', c['chama'] + 0.1, "top:560px;font-size:110px;color:#fff", "A", 0.07)}
    {Wd('<span class="lar">e garante o seu!</span>', c['garante'], "top:690px;font-size:110px", "A", 0.07)}
    {E('<div style="display:inline-flex;align-items:center;gap:30px;border:4px solid var(--lar);border-radius:90px;padding:26px 54px;background:rgba(15,8,3,.9);box-shadow:0 0 70px rgba(255,122,26,.45)">'
       '<svg viewBox="0 0 32 32" style="width:110px;height:110px"><circle cx="16" cy="16" r="15" fill="#25D366"/><path fill="#fff" d="M23.5 18.6c-.4-.2-2.3-1.1-2.6-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.3-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7-.1-.2-.9-2.1-1.2-2.9-.3-.8-.6-.6-.9-.7h-.7c-.3 0-.7.1-1 .5-.4.4-1.4 1.3-1.4 3.2s1.4 3.7 1.6 4c.2.3 2.7 4.2 6.6 5.8 3.9 1.6 3.9 1 4.6 1 .7-.1 2.3-.9 2.6-1.8.3-.9.3-1.7.2-1.8-.1-.2-.3-.3-.7-.5z"/></svg>'
       '<div style="text-align:left"><div class="T" style="font-size:28px;color:var(--lar2);letter-spacing:.2em">Fale com a gente</div>'
       '<div style="font-weight:900;font-size:80px;line-height:1;white-space:nowrap">(61) 99986-2628</div></div></div>', c['whats'], "pop", "top:960px")}
    {E('<div style="font-weight:700;font-size:38px;color:#ddd">📍 Feira dos Importados · Bloco B · Loja B180</div>', c['garante'] + 0.4, "up", "top:1260px")}
    {E('<div style="font-weight:700;font-size:38px;color:var(--lar2)">@purezamultimarcas</div>', c['garante'] + 0.7, "up", "top:1330px")}
    {E(foto("linha_promax.jpg", 820, 380, "center 45%"), c['garante'] + 0.2, "rise", "top:1440px")}
  </section>
'''

script = f'''
<div class="vin"></div><div id="flash"></div></div>
<script>
const L = 0.15, C = {json.dumps(c)};
const FL = [C.iphone + .55, C.imagina, C.pro, C.promax, C.chama];
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
const XF = 0.12;
function anim(el, t) {{
  const t0 = parseFloat(el.dataset.in), a = el.dataset.a;
  if (a === "palavras") {{
    const passo = parseFloat(el.dataset.passo); let vis = false;
    el.querySelectorAll(".w > span").forEach((s, i) => {{
      const p = clamp((t - t0 - i * passo) / 0.4), pe = eo5(p);
      s.style.transform = `translateY(${{((1 - pe) * 110).toFixed(1)}}%)`;
      if (p > 0) vis = true;
    }});
    el.style.opacity = vis ? 1 : 0; el.style.visibility = vis ? "visible" : "hidden"; return;
  }}
  const d = {{pop: .4, slam: .3, up: .45, fade: .7, rise: .7}}[a] || .5;
  const p = clamp((t - t0) / d), pe = eo(p);
  let op = (a === "pop" || a === "slam") ? clamp(p * 4) : pe, tf = "", fl = "";
  if (a === "pop") tf = `scale(${{Math.max(.02, back(p)).toFixed(4)}})`;
  if (a === "slam") {{ tf = `scale(${{(1 + (1 - pe) * 1.3).toFixed(4)}})`; fl = p < 1 ? `blur(${{((1 - pe) * 8).toFixed(1)}}px)` : ""; }}
  if (a === "up") tf = `translateY(${{((1 - pe) * 60).toFixed(1)}}px)`;
  if (a === "rise") tf = `translateY(${{((1 - eo5(p)) * 220).toFixed(1)}}px) scale(${{(.92 + .08 * eo5(p)).toFixed(4)}})`;
  op = op < 0.003 ? 0 : op;
  el.style.opacity = op.toFixed(3); el.style.visibility = op > 0 ? "visible" : "hidden"; el.style.transform = tf; el.style.filter = fl || "none";
  el.querySelectorAll(".conta").forEach(n => {{
    const v = +n.dataset.v, q = eo(clamp((t - t0) / .9));
    n.textContent = (Math.round(v * q / 100) * 100).toLocaleString("pt-BR");
  }});
}}
function render(tv) {{
  const t = tv - L;
  let fo = 0; FL.forEach(k => {{ const q = t - k; if (q > 0 && q < .3) fo = Math.max(fo, .4 * (1 - q / .3)); }});
  flash.style.opacity = fo.toFixed(3);
  document.querySelectorAll(".scene").forEach(s => {{
    const a = parseFloat(s.dataset.start), b = parseFloat(s.dataset.end);
    let op = 0;
    if (t >= a && t < b + XF) op = clamp((t - a) / XF) * (t > b ? 1 - clamp((t - b) / XF) : 1);
    if (a === 0) op = t < b ? 1 : op;
    s.style.opacity = op; s.style.visibility = op > 0 ? "visible" : "hidden"; s.style.zIndex = Math.round(a * 10 + 10);
    if (op <= 0) return;
    s.style.transform = `scale(${{(1.05 - .05 * eo(clamp((t - a) / .35))).toFixed(4)}})`;
    s.querySelectorAll(".kb").forEach(k => k.style.transform = `scale(${{(1.02 + .07 * clamp((t - a) / 5)).toFixed(4)}})`);
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  }});
}}
window.render = render;
render(0);
</script>
</body></html>'''
(ROOT / "anuncio.html").write_text(head + cenas + script)
print("anuncio.html · duração", round(FIM, 2))
