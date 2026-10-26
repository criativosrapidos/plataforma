#!/usr/bin/env python3
"""Nanoz Consultoria · vídeo-prévia v2 (motion institucional, tom de banco). Cenas sincronizadas com audio/cues.json.
Gera video.html com render(t) determinístico (canvas para o globo + HTML para tipografia)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
c = json.load(open(ROOT / "audio/cues.json"))
L = 0.3
CARD = c["fim"] + 1.8            # cartão final da Criativos Rápidos (tempo da voz)
DUR = CARD + L + 2.3
BG, INK, CH, CH2, PRATA = "#070B14", "#0C1424", "#C8B183", "#E4D6B3", "#9AA3B5"
W, H = open(ROOT / "nz_path.txt").readline().split()
NZ_D = open(ROOT / "nz_path.txt").read().split("\n", 1)[1].strip()


def nz(w, cor=CH, cls=""):
    return f'<svg class="{cls}" viewBox="0 0 {W} {H}" style="width:{w}px;display:block;margin:0 auto"><path d="{NZ_D}" fill="{cor}"/></svg>'


def E(html, t, a="up", st=""):
    return f'<div class="el" data-in="{t:.2f}" data-a="{a}" style="{st}">{html}</div>'


def Wd(texto, t, st="", passo=0.06):
    return f'<div class="el" data-in="{t:.2f}" data-a="palavras" data-passo="{passo}" style="{st}">{texto}</div>'


def lbl(t):
    return f'<span class="lbl">{t}</span>'


it = lambda t: f'<span style="font-style:italic;color:{CH2}">{t}</span>'
CR_IC = ('<svg viewBox="0 0 40 40" style="width:{s}px"><g fill="#0B0B0B"><rect x="4" y="12" width="9" height="3.2" rx="1.6"/>'
         '<rect x="2" y="18.4" width="11" height="3.2" rx="1.6"/><rect x="4" y="24.8" width="9" height="3.2" rx="1.6"/><path d="M16 9 L35 20 L16 31 Z"/></g></svg>')


def cr_badge(esc=1.0):
    s = esc
    return (f'<div style="display:inline-flex;align-items:center;gap:{int(12 * s)}px">'
            f'<div style="width:{int(58 * s)}px;height:{int(58 * s)}px;background:#FFD400;border-radius:{int(13 * s)}px;display:flex;align-items:center;justify-content:center">{CR_IC.format(s=int(40 * s))}</div>'
            f'<div style="text-align:left;line-height:1.02;font-family:IN"><div style="font-weight:500;font-size:{int(27 * s)}px;color:#fff">criativos</div>'
            f'<div style="font-weight:700;font-style:italic;font-size:{int(29 * s)}px;color:#FFD400">rápidos</div></div></div>')


ICON = {
    "usd": '<circle cx="24" cy="24" r="17"/><path d="M30 17.5c-1.2-2-3.4-3-6-3-3.4 0-6 1.8-6 4.4 0 6 12 3.2 12 9.2 0 2.6-2.6 4.4-6 4.4-2.8 0-5.2-1.2-6.4-3.2M24 11v3.5M24 33.5V37"/>',
    "alav": '<path d="M6 36l12-12 8 8 16-16"/><path d="M30 16h12v12"/>',
    "casa": '<path d="M6 22L24 8l18 14"/><path d="M10 19v21h28V19"/><path d="M20 40V28h8v12"/>',
    "banco": '<path d="M6 18h36L24 7z"/><path d="M10 18v16M19 18v16M29 18v16M38 18v16M6 40h36"/>',
}


def produto(ic, nome, sub, t, i):
    return E(f'''<div class="prod"><svg viewBox="0 0 48 48" class="pic" fill="none" stroke="{CH}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICON[ic]}</svg>
      <div style="text-align:left"><div class="pn">{nome}</div><div class="ps">{sub}</div></div><div class="pk">0{i + 1}</div></div>''', t, "slideR", f"top:{560 + i * 240}px")


plano = "".join(f'<div class="pl"><span>{n}</span><div class="bar"><i class="fill" data-t="{c["planejamento"] + .3 + k * .35:.2f}"></i></div></div>'
                for k, n in enumerate(("Objetivos", "Perfil", "Patrimônio atual", "Estratégia")))

cenas = f'''
<section class="scene" data-start="0" data-end="{c['agora'] - .08:.2f}">
  {E(lbl("Para brasileiros no exterior"), c['voce'] + .1, "up", "top:230px")}
  {Wd(f"Você conquistou<br>{it('o mundo.')}", c['voce'], "top:1320px;font-size:118px", .09)}
</section>

<section class="scene" data-start="{c['agora'] - .08:.2f}" data-end="{c['nanoz'] - .1:.2f}">
  {Wd(f"Agora, o seu patrimônio<br>merece um {it('porto seguro')}<br>no Brasil.", c['agora'] + .1, "top:1280px;font-size:92px;line-height:1.08", .07)}
</section>

<section class="scene" data-start="{c['nanoz'] - .1:.2f}" data-end="{c['ha'] - .1:.2f}">
  <div class="el" data-in="{c['nanoz'] - .05:.2f}" data-a="nz" style="top:560px">{nz(560, CH, "nzlogo")}</div>
  {E('<div class="marca"><b>NANOZ</b><span>Consultoria</span></div>', c['nanoz'] + .5, "up", "top:880px")}
  {E('<div class="fio"></div>', c['especializada'] - .2, "line", "top:1110px")}
  {Wd(f"Especializada em brasileiros<br>que vivem {it('no exterior.')}", c['especializada'], "top:1170px;font-size:72px;line-height:1.12", .06)}
</section>

<section class="scene" data-start="{c['ha'] - .1:.2f}" data-end="{c['dolarizacao'] - .1:.2f}">
  {E(lbl("Há mais de"), c['ha'], "up", "top:300px")}
  {E(f'<div class="num"><span>+</span><b class="cont" data-v="10" data-t="{c["ha"] + .1:.2f}">0</b></div>', c['ha'], "fade", "top:360px")}
  {E(lbl("anos de consultoria"), c['dez'] + .3, "up", "top:760px")}
  {Wd(f"Protegendo e multiplicando<br>{it('patrimônios.')}", c['protegendo'], "top:900px;font-size:82px;line-height:1.1", .06)}
  {E(f'<div class="pills"><span>Segurança</span><span>Transparência</span></div>', c['seguranca'] - .1, "up", "top:1210px")}
  {E('<svg viewBox="0 0 120 140" style="width:130px"><path d="M60 8 L108 26 V66 C108 98 88 120 60 132 C32 120 12 98 12 66 V26 Z" fill="none" stroke="#C8B183" stroke-width="5"/><path class="chk" data-t="' + f'{c["seguranca"] + .1:.2f}' + '" d="M38 70 L54 86 L84 54" fill="none" stroke="#E4D6B3" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>', c['seguranca'] - .2, "pop", "top:1380px")}
</section>

<section class="scene" data-start="{c['dolarizacao'] - .1:.2f}" data-end="{c['um'] - .1:.2f}">
  {E(lbl("As melhores ferramentas de investimento"), c['dolarizacao'] - .05, "up", "top:400px")}
  {produto("usd", "Dolarização", "Proteção em moeda forte", c['dolarizacao'] - .05, 0)}
  {produto("alav", "Alavancagem patrimonial", "Crescimento com estratégia", c['alavancagem'] - .1, 1)}
  {produto("casa", "Home Equity", "Seu imóvel virando crédito", c['home'] - .1, 2)}
  {produto("banco", "Financiamento bancário", "As melhores taxas e condições", c['financiamento'] - .1, 3)}
</section>

<section class="scene" data-start="{c['um'] - .1:.2f}" data-end="{c['nanoz2'] - .1:.2f}">
  {Wd(f"Um planejamento<br>{it('completo,')}", c['um'], "top:250px;font-size:92px;line-height:1.05", .07)}
  {Wd("desenhado para a sua realidade.", c['desenhado'], "top:480px;font-size:60px;color:#C9CFDA", .05)}
  {E(f'<div class="app"><div class="apph">{nz(70)}<span>Seu plano Nanoz</span><em>sob medida</em></div>{plano}</div>', c['planejamento'] - .1, "rise", "top:690px")}
</section>

<section class="scene" data-start="{c['nanoz2'] - .1:.2f}" data-end="{c['fale'] - .1:.2f}">
  <div class="el" data-in="{c['nanoz2'] - .05:.2f}" data-a="nz" style="top:520px">{nz(500, CH, "nzlogo")}</div>
  {E('<div class="marca"><b>NANOZ</b><span>Consultoria</span></div>', c['nanoz2'] + .4, "up", "top:810px")}
  {Wd(f"O próximo nível dos<br>seus {it('investimentos.')}", c['proximo'], "top:1080px;font-size:88px;line-height:1.08", .07)}
</section>

<section class="scene" data-start="{c['fale'] - .1:.2f}" data-end="{CARD:.2f}">
  {nz(150).replace('style="', 'style="position:absolute;left:0;right:0;top:330px;', 1)}
  {Wd(f"Fale com o nosso<br>{it('especialista.')}", c['fale'], "top:560px;font-size:100px;line-height:1.06", .07)}
  {E('<div class="zap"><svg viewBox="0 0 24 24" fill="#fff" style="width:52px"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3z"/></svg><div><small>WhatsApp</small><b>+55 (61) 92002-3306</b></div></div>', c['especialista'] - .1, "pop", "top:930px")}
  {E('<div style="font-family:IN;font-weight:400;font-size:34px;letter-spacing:.12em;color:#C9CFDA">nanozconsultoria.com.br</div>', c['especialista'] + .4, "up", "top:1200px")}
</section>

<section class="scene fimcr" data-start="{CARD:.2f}" data-end="{DUR + 1:.2f}">
  {E(lbl("Prévia · proposta de conteúdo"), CARD + .15, "up", "top:600px")}
  {E(f'<div style="font-family:CG;font-weight:500;font-size:82px;line-height:1.1;color:#fff">Vídeo criado para a<br>{it("Nanoz Consultoria")}<br>pela</div>', CARD + .3, "up", "top:680px")}
  {E(cr_badge(2.0), CARD + .7, "pop", "top:1050px")}
  {E('<div style="font-family:IN;font-weight:400;font-size:32px;color:#AEB5C4;letter-spacing:.06em">criativosrapidos.com.br</div>', CARD + 1.0, "up", "top:1250px")}
</section>
'''

html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Nanoz · prévia v2</title><style>
@font-face {{ font-family: CG; font-weight: 500; src: url(fonts/eb-garamond-latin-500-normal.woff2); }}
@font-face {{ font-family: CG; font-weight: 600; src: url(fonts/eb-garamond-latin-600-normal.woff2); }}
@font-face {{ font-family: CG; font-weight: 500; font-style: italic; src: url(fonts/eb-garamond-latin-500-italic.woff2); }}
@font-face {{ font-family: IN; font-weight: 300; src: url(fonts/inter-latin-300-normal.woff2); }}
@font-face {{ font-family: IN; font-weight: 400; src: url(fonts/inter-latin-400-normal.woff2); }}
@font-face {{ font-family: IN; font-weight: 500; src: url(fonts/inter-latin-500-normal.woff2); }}
@font-face {{ font-family: IN; font-weight: 600; src: url(fonts/inter-latin-600-normal.woff2); }}
@font-face {{ font-family: IN; font-weight: 700; src: url(fonts/inter-latin-700-normal.woff2); }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:1080px; height:1920px; overflow:hidden; background:{BG}; }}
#stage {{ font-variant-numeric:lining-nums; position:relative; width:1080px; height:1920px; overflow:hidden; color:#fff; font-family:CG;
  background:radial-gradient(ellipse 90% 60% at 50% 38%, #111C33 0%, {BG} 70%); }}
#globo {{ position:absolute; left:0; top:0; z-index:5; }}
#linhas {{ position:absolute; inset:0; background-image:linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size:180px 100%; }}
.scene {{ position:absolute; inset:0; opacity:0; z-index:10; }}
.fimcr {{ background:#04060B; z-index:300; }}
.el {{ position:absolute; left:70px; right:70px; text-align:center; opacity:0; font-weight:500; line-height:1.04; }}
.w {{ display:inline-block; overflow:hidden; vertical-align:top; padding:.26em .03em .16em; margin:-.26em -.03em -.16em; }}
.w > span {{ display:inline-block; }}
.lbl {{ font-family:IN; font-weight:500; font-size:26px; letter-spacing:.36em; text-transform:uppercase; color:{CH}; padding-left:.36em; }}
.marca b {{ display:block; font-family:IN; font-weight:500; font-size:44px; letter-spacing:.5em; padding-left:.5em; color:{CH}; }}
.marca span {{ display:block; font-family:CG; font-size:58px; color:#fff; margin-top:4px; }}
.fio {{ width:220px; height:2px; margin:0 auto; background:linear-gradient(90deg, transparent, {CH}, transparent); }}
.num {{ font-family:CG; font-weight:500; font-size:380px; line-height:1; color:#fff; letter-spacing:-.02em; }}
.num span {{ color:{CH}; font-size:220px; vertical-align:top; position:relative; top:40px; margin-right:6px; }}
.pills {{ display:flex; justify-content:center; gap:20px; }}
.pills span {{ font-family:IN; font-size:30px; letter-spacing:.2em; text-transform:uppercase; border:1px solid rgba(200,177,131,.55); color:{CH2}; padding:16px 30px 16px 36px; }}
.prod {{ display:flex; align-items:center; gap:34px; background:linear-gradient(120deg, rgba(255,255,255,.08), rgba(255,255,255,.025)); border:1px solid rgba(255,255,255,.12);
  border-left:3px solid {CH}; padding:36px 40px; text-align:left; }}
.pic {{ width:84px; flex:none; }}
.pn {{ font-family:CG; font-weight:600; font-size:58px; line-height:1.05; color:#fff; }}
.ps {{ font-family:IN; font-weight:400; font-size:26px; color:{PRATA}; margin-top:6px; }}
.pk {{ margin-left:auto; font-family:IN; font-size:22px; letter-spacing:.2em; color:rgba(200,177,131,.7); }}
.app {{ margin:0 auto; width:860px; background:linear-gradient(160deg, rgba(255,255,255,.09), rgba(255,255,255,.02)); border:1px solid rgba(255,255,255,.14); padding:44px 50px; text-align:left;
  box-shadow:0 40px 90px rgba(0,0,0,.45); }}
.apph {{ display:flex; align-items:center; gap:22px; padding-bottom:28px; border-bottom:1px solid rgba(255,255,255,.12); margin-bottom:16px; }}
.apph svg {{ margin:0 !important; }}
.apph span {{ font-family:CG; font-weight:600; font-size:46px; }}
.apph em {{ margin-left:auto; font-family:IN; font-style:normal; font-size:20px; letter-spacing:.2em; text-transform:uppercase; color:{CH}; border:1px solid rgba(200,177,131,.5); padding:8px 14px; }}
.pl {{ padding:22px 0; }}
.pl span {{ font-family:IN; font-size:30px; color:#E3E7EE; }}
.bar {{ height:8px; background:rgba(255,255,255,.08); margin-top:14px; position:relative; overflow:hidden; }}
.fill {{ position:absolute; left:0; top:0; bottom:0; width:0; background:linear-gradient(90deg, {CH}, {CH2}); }}
.zap {{ display:inline-flex; align-items:center; gap:26px; background:#1FA855; padding:30px 50px 30px 40px; text-align:left; box-shadow:0 30px 70px rgba(0,0,0,.4); }}
.zap small {{ display:block; font-family:IN; font-size:22px; letter-spacing:.24em; text-transform:uppercase; color:rgba(255,255,255,.8); }}
.zap b {{ display:block; font-family:IN; font-weight:600; font-size:46px; color:#fff; }}
#wm {{ position:absolute; top:70px; right:56px; display:flex; align-items:center; gap:14px; z-index:900;
  background:rgba(4,6,11,.6); border:1px solid rgba(255,255,255,.14); border-radius:40px; padding:10px 22px 10px 12px; }}
#wm .pv {{ font-family:IN; font-weight:600; font-size:20px; letter-spacing:.24em; color:#FFD400; }}
#rodape {{ position:absolute; left:0; right:0; bottom:70px; text-align:center; z-index:900; font-family:IN; font-weight:500; font-size:21px; letter-spacing:.3em; color:rgba(255,255,255,.4); }}
#vinheta {{ position:absolute; inset:0; z-index:800; pointer-events:none; background:radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(0,0,0,.55) 100%); }}
</style></head><body><div id="stage"><div id="linhas"></div><canvas id="globo" width="1080" height="1920"></canvas>
{cenas}
<div id="vinheta"></div>
<div id="wm">{cr_badge(0.7)}<span class="pv">PRÉVIA</span></div>
<div id="rodape">PROPOSTA · CRIATIVOS RÁPIDOS</div>
</div>
<script>
const L = {L}, C = {json.dumps(c)}, CARD = {CARD:.3f};
document.querySelectorAll('[data-a="palavras"]').forEach(el => {{
  const tmp = document.createElement("div"); tmp.innerHTML = el.innerHTML; let out = "";
  const walk = (node, st) => node.childNodes.forEach(n => {{
    if (n.nodeType === 3) n.textContent.split(/(\\s+)/).forEach(p => {{ if (!p) return; out += /^\\s+$/.test(p) ? " " : `<span class="w"><span${{st ? ` style="${{st}}"` : ""}}>${{p}}</span></span>`; }});
    else if (n.nodeName === "BR") out += "<br>";
    else walk(n, n.getAttribute("style") || st);
  }});
  walk(tmp, ""); el.innerHTML = out;
}});
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3), e5 = x => 1 - Math.pow(1 - x, 5), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = (x, k = 1.2) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);
document.querySelectorAll(".nzlogo path, .chk").forEach(p => {{ const n = p.getTotalLength(); p.dataset.n = n; p.style.strokeDasharray = n; }});

/* ---------- globo pontilhado (projeção ortográfica) ---------- */
const g = document.getElementById("globo").getContext("2d");
const R0 = Math.PI / 180, PTS = [];
for (let la = -84; la <= 84; la += 4) {{ const n = Math.max(1, Math.round(90 * Math.cos(la * R0))); for (let k = 0; k < n; k++) PTS.push([la, -180 + 360 * k / n]); }}
const BR = [-15.8, -47.9], CID = [[38.7, -9.1], [40.7, -74.0], [51.5, -0.1], [25.8, -80.2], [48.9, 2.35], [-33.9, 151.2], [35.7, 139.7]];
function proj(la, lo, rotLo, rotLa, R, cx, cy) {{
  const p = la * R0, l = (lo - rotLo) * R0, t = rotLa * R0;
  const x = Math.cos(p) * Math.sin(l), y0 = Math.sin(p), z0 = Math.cos(p) * Math.cos(l);
  const y = y0 * Math.cos(t) - z0 * Math.sin(t), z = y0 * Math.sin(t) + z0 * Math.cos(t);
  return [cx + R * x, cy - R * y, z];
}}
function slerp(a, b, f) {{
  const v = q => [Math.cos(q[0] * R0) * Math.cos(q[1] * R0), Math.cos(q[0] * R0) * Math.sin(q[1] * R0), Math.sin(q[0] * R0)];
  const A = v(a), B = v(b), d = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])));
  const s = Math.sin(d) || 1, k1 = Math.sin((1 - f) * d) / s, k2 = Math.sin(f * d) / s;
  const P = [k1 * A[0] + k2 * B[0], k1 * A[1] + k2 * B[1], k1 * A[2] + k2 * B[2]];
  return [Math.asin(P[2]) / R0, Math.atan2(P[1], P[0]) / R0, d];
}}
function globo(t) {{
  g.clearRect(0, 0, 1080, 1920);
  const fimG = C.nanoz - .1;
  let op = cl(t / .6) * (1 - cl((t - fimG) / .4));
  if (op <= 0) return;
  const foco = eio(cl((t - C.agora) / 2.2));                       /* gira até o Brasil e aproxima */
  const rotLo = -10 + 60 * (t / 6) * (1 - foco) + (-47.9) * foco - 10 * (1 - foco);
  const rotLa = 18 * (1 - foco) + (-15.8) * foco;
  const R = 330 + 150 * foco, cx = 540, cy = 760 - 30 * foco;
  g.globalAlpha = op;
  const grd = g.createRadialGradient(cx - R * .3, cy - R * .4, R * .1, cx, cy, R * 1.05);
  grd.addColorStop(0, "rgba(40,60,100,.55)"); grd.addColorStop(1, "rgba(7,11,20,0)");
  g.fillStyle = grd; g.beginPath(); g.arc(cx, cy, R * 1.04, 0, 7); g.fill();
  g.strokeStyle = "rgba(200,177,131,.25)"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  for (const [la, lo] of PTS) {{
    const [x, y, z] = proj(la, lo, rotLo, rotLa, R, cx, cy);
    if (z <= 0) continue;
    g.fillStyle = `rgba(190,200,220,${{(.18 + .55 * z).toFixed(3)}})`; g.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
  }}
  /* rotas do mundo até o Brasil */
  CID.forEach((cd, i) => {{
    const t0 = .35 + i * .18, q = e5(cl((t - t0) / 1.4));
    if (q <= 0) return;
    g.beginPath(); let started = false;
    for (let s = 0; s <= 60 * q; s++) {{
      const f = s / 60, [la, lo, d] = slerp(cd, BR, f), alt = 1 + .22 * Math.sin(Math.PI * f) * Math.min(1, d);
      let [x, y, z] = proj(la, lo, rotLo, rotLa, R, cx, cy); x = cx + (x - cx) * alt; y = cy + (y - cy) * alt;
      if (z < -.15) {{ started = false; continue; }}
      started ? g.lineTo(x, y) : g.moveTo(x, y); started = true;
    }}
    g.strokeStyle = `rgba(228,214,179,${{(.75 * (1 - .6 * foco)).toFixed(3)}})`; g.lineWidth = 2.6; g.stroke();
  }});
  const [bx, by, bz] = proj(BR[0], BR[1], rotLo, rotLa, R, cx, cy);
  if (bz > 0) {{
    const pul = (t * 1.2) % 1;
    g.strokeStyle = `rgba(200,177,131,${{(1 - pul).toFixed(3)}})`; g.lineWidth = 3; g.beginPath(); g.arc(bx, by, 10 + 50 * pul, 0, 7); g.stroke();
    g.fillStyle = "#E4D6B3"; g.beginPath(); g.arc(bx, by, 11 + 5 * foco, 0, 7); g.fill();
    const rot = cl((t - C.porto) / .5);
    if (rot > 0) {{ g.globalAlpha = op * rot; g.font = "500 30px IN"; g.textAlign = "center"; g.fillStyle = "#E4D6B3"; g.fillText("BRASIL", bx, by - 40); }}
  }}
  g.globalAlpha = 1;
}}

function anim(el, t) {{
  const t0 = +el.dataset.in, a = el.dataset.a;
  if (a === "palavras") {{
    const passo = +el.dataset.passo; let vis = false;
    el.querySelectorAll(".w > span").forEach((s, i) => {{ const p = cl((t - t0 - i * passo) / .6); s.style.transform = `translateY(${{((1 - e5(p)) * 110).toFixed(1)}}%)`; s.style.opacity = cl(p * 2); if (p > 0) vis = true; }});
    el.style.opacity = vis ? 1 : 0; return;
  }}
  if (a === "nz") {{
    el.style.opacity = t >= t0 ? 1 : 0;
    el.querySelectorAll("path").forEach(p => {{
      const q = eio(cl((t - t0) / 1.1)), f = cl((t - t0 - .7) / .6);
      p.style.strokeDashoffset = (+p.dataset.n * (1 - q)).toFixed(1); p.style.stroke = "#C8B183"; p.style.strokeWidth = 2;
      p.style.fillOpacity = eo(f).toFixed(3);
    }});
    el.style.transform = `scale(${{(1.06 - .06 * eo(cl((t - t0) / 1.6))).toFixed(4)}})`; return;
  }}
  const d = {{ pop: .7, up: .7, fade: .8, slideR: .75, line: .9, rise: .9 }}[a] || .7, p = cl((t - t0) / d);
  let tf = "";
  if (a === "pop") tf = `scale(${{Math.max(.01, .8 + .2 * back(p)).toFixed(4)}})`;
  if (a === "up") tf = `translateY(${{((1 - e5(p)) * 40).toFixed(1)}}px)`;
  if (a === "slideR") tf = `translateX(${{((1 - e5(p)) * 300).toFixed(1)}}px)`;
  if (a === "rise") tf = `translateY(${{((1 - e5(p)) * 160).toFixed(1)}}px)`;
  if (a === "line") tf = `scaleX(${{e5(p).toFixed(4)}})`;
  el.style.opacity = (a === "line" ? (p > 0 ? 1 : 0) : eo(p)).toFixed(3); el.style.transform = tf;
}}
function render(tv) {{
  const t = tv - L;
  globo(t);
  document.querySelectorAll(".scene").forEach(s => {{
    const a = +s.dataset.start, b = +s.dataset.end, X = .3;
    let op = (t >= a - X && t < b + X) ? cl((t - a + X) / X) * (1 - cl((t - b) / X)) : 0;
    if (a === 0 && t < b) op = 1;
    s.style.opacity = op.toFixed(3);
    if (op <= 0) return;
    s.style.transform = `scale(${{(1 + .025 * cl((t - a) / 6)).toFixed(4)}})`;
    s.querySelectorAll(".el").forEach(el => anim(el, t));
  }});
  document.querySelectorAll(".cont").forEach(n => n.textContent = Math.round(+n.dataset.v * eo(cl((t - +n.dataset.t) / 1.2))));
  document.querySelectorAll(".fill").forEach(f => f.style.width = (e5(cl((t - +f.dataset.t) / 1.1)) * 100).toFixed(1) + "%");
  document.querySelectorAll(".chk").forEach(p => {{ const q = eo(cl((t - +p.dataset.t) / .5)); p.style.strokeDashoffset = (+p.dataset.n * (1 - q)).toFixed(1); }});
  document.getElementById("linhas").style.transform = `translateX(${{(-(t * 12) % 180).toFixed(1)}}px)`;
  const fq = cl((t - CARD) / .3);
  wm.style.opacity = (1 - fq).toFixed(3); rodape.style.opacity = (1 - fq).toFixed(3);
}}
window.render = render; render(0);
</script></body></html>'''
(ROOT / "video.html").write_text(html)
print("video.html · duração", round(DUR, 2))
