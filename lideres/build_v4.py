#!/usr/bin/env python3
"""Líderes do Brasil - Encontro das Comunidades v4: fotos reais do evento, tipografia Montserrat, locução v4 (audio/cues_v4.json)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues_v4.json"))
FIM = c["fim"] + 1.4


def foto(n):
    hd = ROOT / f"fotos/hd/f{n:02d}.png"
    return f"fotos/hd/f{n:02d}.png" if hd.exists() else f"fotos/f{n:02d}.jpg"


head = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Líderes - Encontro das Comunidades v4</title>
<style>
@font-face { font-family: M; font-weight: 300; src: url(fonts/montserrat-latin-300-normal.woff); }
@font-face { font-family: M; font-weight: 400; src: url(fonts/montserrat-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 500; src: url(fonts/montserrat-latin-500-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
:root { --az:#4F6BFF; --royal:#3F4FA0; --ciano:#8FC2FF; --ouro:#F2C14E; --noite:#040818; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--noite); }
#stage { position:relative; width:1080px; height:1920px; overflow:hidden; font-family:M, sans-serif; color:#fff; background:var(--noite); }
.scene { position:absolute; inset:0; opacity:0; overflow:hidden; }
.ph { position:absolute; inset:-4%; background-size:cover; background-position:center; will-change:transform; }
.grade { position:absolute; inset:0; background:linear-gradient(180deg,rgba(4,8,24,.55) 0%,rgba(4,8,24,.05) 30%,rgba(4,8,24,.25) 55%,rgba(4,8,24,.92) 100%); }
.tint { position:absolute; inset:0; background:#2B3FA8; mix-blend-mode:soft-light; opacity:.55; }
.banda { position:absolute; left:40px; right:40px; border-radius:28px; overflow:hidden; box-shadow:0 40px 100px rgba(0,0,0,.6), 0 0 0 1.5px rgba(170,190,255,.25); }
.banda .ph { inset:-6%; }
.blurbg { position:absolute; inset:-80px; background-size:cover; background-position:center; filter:blur(40px) brightness(.45) saturate(1.2); }
.el { position:absolute; left:70px; right:70px; opacity:0; will-change:transform, opacity; }
.c { text-align:center; }
.H { font-weight:900; text-transform:uppercase; letter-spacing:-.02em; line-height:.98; }
.T { font-weight:300; text-transform:uppercase; letter-spacing:.32em; }
.w { display:inline-block; overflow:hidden; vertical-align:top; padding:.06em .02em .1em; margin:-.06em -.02em -.1em; }
.w > span { display:inline-block; will-change:transform; }
.ouro { color:var(--ouro); }
.ciano { color:var(--ciano); }
.pill { display:inline-flex; align-items:center; gap:18px; padding:16px 34px; border-radius:60px; background:rgba(255,255,255,.1); border:1.5px solid rgba(255,255,255,.3); font-weight:600; letter-spacing:.18em; text-transform:uppercase; }
.vidro { background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.05)); border:1.5px solid rgba(200,215,255,.35); border-radius:30px; box-shadow:0 30px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.25); }
.linha { height:3px; background:linear-gradient(90deg,var(--ouro),rgba(242,193,78,0)); transform-origin:left; }
.grain { position:absolute; inset:0; opacity:.08; mix-blend-mode:overlay; pointer-events:none; }
.vin { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%,transparent 50%,rgba(0,0,0,.7) 100%); pointer-events:none; }
.leak { position:absolute; width:1400px; height:1400px; border-radius:50%; filter:blur(140px); mix-blend-mode:screen; pointer-events:none; }
#flash { position:absolute; inset:0; background:#fff; opacity:0; pointer-events:none; }
.row { display:flex; align-items:center; gap:24px; padding:22px 34px; border-bottom:1.5px solid rgba(200,215,255,.15); font-size:38px; font-weight:600; }
.row i { flex:none; width:44px; height:44px; border-radius:50%; background:rgba(143,194,255,.18); border:2px solid rgba(143,194,255,.6); }
.row b { display:block; height:18px; border-radius:9px; background:rgba(255,255,255,.22); }
.campo { margin:0 40px 22px; padding:22px 28px; border-radius:18px; background:rgba(255,255,255,.08); border:1.5px solid rgba(200,215,255,.3); font-size:34px; font-weight:500; text-align:left; color:rgba(255,255,255,.9); }
.campo small { display:block; font-size:22px; letter-spacing:.2em; color:var(--ciano); margin-bottom:6px; font-weight:600; }
.btn { margin:10px 40px 40px; padding:30px; border-radius:20px; background:linear-gradient(180deg,#F7D27A,#E0A82E); color:#1A1400; font-weight:900; font-size:40px; letter-spacing:.06em; text-transform:uppercase; text-align:center; box-shadow:0 18px 50px rgba(242,193,78,.45); }
</style></head><body><div id="stage">
'''


def P(n, pan="in", extra=""):
    """foto em tela cheia com grade + tint (Ken Burns via data-kb)"""
    return f'<div class="ph" data-kb="{pan}" style="background-image:url({foto(n)});{extra}"></div><div class="tint"></div><div class="grade"></div>'


def B(n, top, h, pan="in"):
    """foto horizontal em banda (com fundo desfocado da própria foto)"""
    return (f'<div class="blurbg" style="background-image:url({foto(n)})"></div>'
            f'<div class="banda" style="top:{top}px;height:{h}px"><div class="ph" data-kb="{pan}" style="background-image:url({foto(n)})"></div>'
            f'<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(4,8,24,.55))"></div></div>')


def W(texto, t, st="", cls="H c", passo=0.07):
    """texto palavra a palavra subindo de dentro de uma máscara"""
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="palavras" data-passo="{passo}" style="{st}">{texto}</div>'


def E(html, t, a="up", st="", cls=""):
    return f'<div class="el {cls}" data-in="{t:.2f}" data-a="{a}" style="{st}">{html}</div>'


LOGO = lambda s, fs: (f'<div style="display:inline-flex;align-items:center;gap:{int(s * .16)}px"><div class="emb" data-s="{s}"></div>'
                      f'<div style="font-weight:600;font-size:{fs}px;letter-spacing:.07em;line-height:1;padding-top:.06em">LÍDERES</div></div>')

linhas_lista = "".join(f'<div class="row"><i></i><b style="width:{w}px"></b></div>' for w in (420, 300, 380, 260))

cenas = f'''
  <section class="scene" data-start="0" data-end="{c['sexta'] - 0.25:.2f}">
    {P(5, "in", "background-position:center 20%")}
    {E(LOGO(74, 46), 0.0, "fade", "top:120px", "c")}
    {W('FALA,', c['fala'], "top:1160px;font-size:190px")}
    {W('<span class="ouro">LIDERANÇA!</span>', c['lideranca'], "top:1350px;font-size:136px;white-space:nowrap")}
  </section>

  <section class="scene" data-start="{c['sexta'] - 0.25:.2f}" data-end="{c['enquanto'] - 0.2:.2f}" data-cinza="1">
    {P(2, "out", "filter:grayscale(1) blur(6px) brightness(.45)")}
    {W('Sexta-feira', c['sexta'], "top:560px;font-size:124px;white-space:nowrap")}
    {W('você vai ficar no escritório...', c['escritorio'] - 0.4, "top:740px;font-size:58px;font-weight:500;text-transform:none;letter-spacing:0", "H c", 0.05)}
    {W('APAGANDO INCÊNDIO', c['apagando'], "top:900px;font-size:84px;color:#FF7A45;white-space:nowrap")}
    {W('SOZINHO?', c['sozinho'], "top:1010px;font-size:150px")}
  </section>

  <section class="scene" data-start="{c['enquanto'] - 0.2:.2f}" data-end="{c['trocando'] - 0.15:.2f}">
    {B(9, 640, 640, "right")}
    {W('Enquanto isso...', c['enquanto'], "top:260px;font-size:58px;font-weight:300;letter-spacing:.2em", "T c", 0.12)}
    {W('Os empresários que <span class="ouro">mais crescem</span> em Brasília', c['empresarios'], "top:370px;font-size:76px", "H c", 0.06)}
    {W('NA MESMA SALA.', c['sala'] - 0.15, "top:1340px;font-size:118px")}
  </section>

  <section class="scene" data-start="{c['trocando'] - 0.15:.2f}" data-end="{c['fechando'] - 0.12:.2f}">
    {P(15, "in", "background-position:center 30%")}
    {W('Trocando', c['trocando'], "top:1260px;font-size:120px")}
    {W('<span class="ciano">experiência.</span>', c['trocando'] + 0.3, "top:1390px;font-size:120px")}
  </section>

  <section class="scene" data-start="{c['fechando'] - 0.12:.2f}" data-end="{c['imagina'] - 0.15:.2f}">
    {P(14, "in", "background-position:18% 25%")}
    {W('Fechando', c['fechando'], "top:1260px;font-size:120px")}
    {W('<span class="ouro">negócio.</span>', c['fechando'] + 0.3, "top:1390px;font-size:120px")}
  </section>

  <section class="scene" data-start="{c['imagina'] - 0.15:.2f}" data-end="{c['ideia'] - 0.15:.2f}">
    {P(7, "in", "background-position:center 25%")}
    {W('Imagina sair de lá com', c['imagina'], "top:1190px;font-size:40px;font-weight:400;letter-spacing:.18em;white-space:nowrap", "T c", 0.08)}
    {W('O CONTATO <span class="ouro">CERTO.</span>', c['contato'], "top:1280px;font-size:118px")}
  </section>

  <section class="scene" data-start="{c['ideia'] - 0.15:.2f}" data-end="{c['brinde'] - 0.2:.2f}">
    {P(1, "right", "background-position:center 40%")}
    {W('A IDEIA <span class="ouro">CERTA.</span>', c['ideia'], "top:1280px;font-size:108px;white-space:nowrap")}
  </section>

  <section class="scene" data-start="{c['brinde'] - 0.2:.2f}" data-end="{c['encontro'] - 0.15:.2f}">
    {P(10, "in", "background-position:center 35%;filter:saturate(1.15)")}
    {W('E AQUELE <span class="ouro">BRINDE</span>', c['brinde'], "top:1180px;font-size:100px;white-space:nowrap")}
    {W('com quem joga no mesmo nível que você.', c['nivel'] - 0.3, "top:1320px;font-size:46px;font-weight:500;text-transform:none;letter-spacing:0", "H c", 0.05)}
  </section>

  <section class="scene" data-start="{c['encontro'] - 0.15:.2f}" data-end="{c['sexta2'] - 0.15:.2f}">
    {B(12, 860, 560, "in")}
    {E(LOGO(110, 74), c['encontro'] - 0.1, "fade", "top:250px", "c")}
    {W('Encontro das Comunidades', c['encontro'], "top:430px;font-size:88px", "H c", 0.08)}
    {E('<div class="linha" style="width:220px;margin:0 auto"></div>', c['lideres'], "line", "top:640px")}
    {W('Líderes do Brasil', c['lideres'], "top:680px;font-size:54px;font-weight:300;letter-spacing:.3em", "T c ouro", 0.1)}
  </section>

  <section class="scene" data-start="{c['sexta2'] - 0.15:.2f}" data-end="{c['atencao'] - 0.12:.2f}">
    {P(3, "in", "background-position:center 15%")}
    {E('<div class="pill" style="font-size:30px">Convite · Encontro das Comunidades</div>', c['sexta2'] - 0.1, "up", "top:150px", "c")}
    {E('<div class="vidro" style="padding:34px 44px"><div class="T ciano" style="font-size:26px;font-weight:600">Quando</div><div class="H" style="font-size:96px;margin-top:8px">SEXTA · 16/10</div></div>', c['sexta2'], "card", "top:1000px")}
    {E('<div class="vidro" style="padding:34px 44px;display:flex;justify-content:space-between;align-items:flex-end"><div><div class="T ciano" style="font-size:26px;font-weight:600">Horário</div><div class="H" style="font-size:96px;margin-top:8px">16H</div></div><div class="H ouro" style="font-size:54px">HAPPY HOUR</div></div>', c['quatro'], "card", "top:1240px")}
    {E('<div class="vidro" style="padding:34px 44px"><div class="T ciano" style="font-size:26px;font-weight:600">Onde</div><div class="H" style="font-size:80px;margin-top:8px">ESPAÇO RC</div><div style="font-size:36px;font-weight:500;margin-top:6px">Asa Sul · Prédio do Hotel Bonaparte</div></div>', c['espaco'], "card", "top:1480px")}
  </section>

  <section class="scene" data-start="{c['atencao'] - 0.12:.2f}" data-end="{c['preenche'] - 0.15:.2f}">
    {P(8, "out", "filter:blur(14px) brightness(.35) grayscale(.4)")}
    {W('Mas <span class="ouro">atenção:</span>', c['atencao'], "top:360px;font-size:110px")}
    {E(f'<div class="vidro" style="overflow:hidden"><div style="padding:26px 34px;display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid rgba(200,215,255,.25)"><div class="T" style="font-size:28px;font-weight:600">Lista de confirmados</div><div class="T ouro" style="font-size:24px;font-weight:700">16/10</div></div>{linhas_lista}</div>', c['atencao'] + 0.3, "card", "top:620px")}
    {W('Só entra quem', c['soentra'], "top:1270px;font-size:96px")}
    {W('<span class="ouro">está na lista.</span>', c['lista'] - 0.4, "top:1380px;font-size:96px")}
  </section>

  <section class="scene" data-start="{c['preenche'] - 0.15:.2f}" data-end="{c['bora'] - 0.12:.2f}">
    {P(13, "in", "filter:blur(14px) brightness(.35)")}
    {W('Preenche o formulário', c['preenche'], "top:250px;font-size:84px", "H c", 0.06)}
    {E('<div class="vidro" style="width:820px;margin:0 auto;padding-top:34px"><div class="T c" style="font-size:26px;font-weight:600;margin-bottom:26px">Confirmação de presença</div>'
       '<div class="campo"><small>NOME</small><span class="dig" data-txt="Seu nome completo" data-t="0"></span></div>'
       '<div class="campo"><small>EMPRESA</small><span class="dig" data-txt="Sua empresa" data-t="0.45"></span></div>'
       '<div class="btn" id="btn">Garantir minha vaga</div></div>', c['formulario'] - 0.2, "card", "top:500px")}
    {W('e garante a sua <span class="ouro">vaga.</span>', c['garante'], "top:1300px;font-size:84px", "H c", 0.06)}
  </section>

  <section class="scene" data-start="{c['bora'] - 0.12:.2f}" data-end="{FIM + 1}">
    {P(4, "in", "background-position:center 60%")}
    {E(LOGO(96, 64), c['bora'] - 0.05, "fade", "top:150px", "c")}
    {W('Bora fortalecer', c['bora'], "top:830px;font-size:86px;white-space:nowrap", "H c", 0.07)}
    {W('<span class="ouro">o movimento!</span>', c['movimento'], "top:945px;font-size:120px;white-space:nowrap", "H c", 0.07)}
    {E('<div class="vidro" style="padding:28px 40px;text-align:center"><div class="H" style="font-size:62px">SEXTA · 16/10 · 16H</div><div style="font-size:34px;font-weight:500;margin-top:10px">Espaço RC – Asa Sul · Prédio do Hotel Bonaparte</div></div>', c['movimento'] + 0.4, "card", "top:1220px")}
    {E('<div class="T c" style="font-size:28px;font-weight:600;color:var(--ouro)">Entrada somente com nome na lista</div>', c['movimento'] + 0.8, "up", "top:1470px", "c")}
  </section>
'''

cortes = [c[k] - 0.15 for k in ("enquanto", "imagina", "encontro", "bora")]
GRAIN = ('<svg class="grain" viewBox="0 0 1080 1920"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/></filter>'
         '<rect width="1080" height="1920" filter="url(#n)"/></svg>')

fim = f'''
<div class="leak" id="lk1" style="background:rgba(79,107,255,.35)"></div>
<div class="leak" id="lk2" style="width:900px;height:900px;background:rgba(242,193,78,.18)"></div>
{GRAIN}<div class="vin"></div><div id="flash"></div>
</div>
<script src="emblema.js"></script>
<script>
const L = 0.15, C = {json.dumps(c)}, CORTES = {json.dumps(cortes)};
document.querySelectorAll(".emb").forEach(e => {{ const s = +e.dataset.s;
  e.innerHTML = `<div style="width:${{s}}px;height:${{s}}px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px rgba(255,255,255,.35),0 10px 40px rgba(63,79,160,.6)">${{EMB(s, "#3F4FA0")}}</div>`; }});
document.querySelectorAll('[data-a="palavras"]').forEach(el => {{
  const tmp = document.createElement("div"); tmp.innerHTML = el.innerHTML; let out = "";
  const walk = (node, wrap) => node.childNodes.forEach(n => {{
    if (n.nodeType === 3) n.textContent.split(/(\\s+)/).forEach(p => {{ if (!p) return; out += /^\\s+$/.test(p) ? " " : `<span class="w"><span${{wrap ? ` class="${{wrap}}"` : ""}}>${{p}}</span></span>`; }});
    else walk(n, n.className || wrap);
  }});
  walk(tmp, ""); el.innerHTML = out;
}});
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3), eo5 = x => 1 - Math.pow(1 - x, 5);
const XF = 0.14;
function anim(el, t) {{
  const t0 = parseFloat(el.dataset.in), a = el.dataset.a;
  if (a === "palavras") {{
    const passo = parseFloat(el.dataset.passo); let vis = false;
    el.querySelectorAll(".w > span").forEach((s, i) => {{
      const p = clamp((t - t0 - i * passo) / 0.5), pe = eo5(p);
      s.style.transform = `translateY(${{((1 - pe) * 105).toFixed(1)}}%) rotate(${{((1 - pe) * 4).toFixed(2)}}deg)`;
      if (p > 0) vis = true;
    }});
    el.style.opacity = vis ? 1 : 0; el.style.visibility = vis ? "visible" : "hidden"; return;
  }}
  const d = {{fade: .8, up: .6, card: .7, line: .7}}[a] || .6;
  const p = clamp((t - t0) / d), pe = eo5(p);
  let op = pe, tf = "";
  if (a === "up") tf = `translateY(${{((1 - pe) * 40).toFixed(1)}}px)`;
  if (a === "fade") tf = `scale(${{(1.06 - .06 * pe).toFixed(4)}})`;
  if (a === "card") tf = `translateY(${{((1 - pe) * 90).toFixed(1)}}px) scale(${{(.96 + .04 * pe).toFixed(4)}})`;
  if (a === "line") {{ const l = el.querySelector(".linha"); l.style.transform = `scaleX(${{pe.toFixed(3)}})`; }}
  op = op < 0.003 ? 0 : op;
  el.style.opacity = op.toFixed(3); el.style.visibility = op > 0 ? "visible" : "hidden"; el.style.transform = tf;
}}
function render(tv) {{
  const t = tv - L;
  let fo = 0; CORTES.forEach(k => {{ const q = t - k; if (q > 0 && q < 0.3) fo = Math.max(fo, .45 * (1 - q / .3)); }});
  if (t < 0.25) fo = Math.max(fo, .9 * (1 - t / .25));
  flash.style.opacity = fo.toFixed(3);
  lk1.style.transform = `translate(${{(-500 + Math.sin(t * .35) * 500).toFixed(0)}}px,${{(-300 + Math.cos(t * .27) * 700).toFixed(0)}}px)`;
  lk2.style.transform = `translate(${{(300 + Math.cos(t * .3) * 300).toFixed(0)}}px,${{(900 + Math.sin(t * .4) * 400).toFixed(0)}}px)`;
  document.querySelectorAll(".scene").forEach(s => {{
    const a = parseFloat(s.dataset.start), b = parseFloat(s.dataset.end);
    let op = 0;
    if (t >= a && t < b + XF) op = clamp((t - a) / XF) * (t > b ? 1 - clamp((t - b) / XF) : 1);
    if (a === 0) op = t < b ? 1 : op;
    s.style.opacity = op; s.style.visibility = op > 0 ? "visible" : "hidden"; s.style.zIndex = Math.round(a * 10 + 10);
    if (op <= 0) return;
    const k = clamp((t - a) / (b - a + .5)), ent = eo(clamp((t - a) / .45));
    s.style.transform = `scale(${{(1.06 - .06 * ent).toFixed(4)}})`;
    s.querySelectorAll(".ph").forEach(p => {{
      const kb = p.dataset.kb, z = kb === "out" ? 1.16 - .1 * k : 1.04 + .12 * k;
      const x = kb === "right" ? -30 + 60 * k : kb === "left" ? 30 - 60 * k : 0;
      p.style.transform = `translateX(${{x.toFixed(1)}}px) scale(${{z.toFixed(4)}})`;
    }});
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  }});
  const t0 = C.formulario - .2 + .5;
  document.querySelectorAll(".dig").forEach(d => {{ const txt = d.dataset.txt, n = Math.floor(clamp((t - t0 - +d.dataset.t) / .45) * txt.length);
    d.textContent = txt.slice(0, n) + ((n < txt.length && t > t0 + +d.dataset.t) ? "|" : ""); }});
  const pb = clamp((t - C.garante - .1) / .35);
  btn.style.transform = `scale(${{(1 - .06 * Math.sin(pb * Math.PI)).toFixed(4)}})`;
  btn.style.boxShadow = `0 18px ${{(50 + 60 * pb).toFixed(0)}}px rgba(242,193,78,${{(.45 + .35 * pb).toFixed(2)}})`;
  btn.textContent = t > C.garante + .3 ? "✓ Vaga garantida" : "Garantir minha vaga";
}}
window.render = render;
render(0);
</script>
</body></html>'''
(ROOT / "anuncio_v4.html").write_text(head + cenas + fim)
print("anuncio_v4.html · duração", round(FIM, 2))
