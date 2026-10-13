#!/usr/bin/env python3
"""Reels Benefiz v3 (30 s, fala com o empresário): base do 1º vídeo + preço no final, tempos de audio/cues_v3.json."""
import json
from pathlib import Path

from build_v2 import arte_plano  # noqa: E402  (arte vetorial dos planos)

ROOT = Path(__file__).resolve().parent
src = (ROOT / "anuncio.html").read_text()
head = src[:src.index('<div id="stage">')]
script = src[src.index('<script src="marca/brand.js">'):]
c = json.load(open(ROOT / "audio/cues_v3.json"))
FIM = c["fim"] + 1.3
WHATS = "(61) 98199-0171"

pilares = [("i-saude", "SAÚDE", "#FDE7D6", "var(--laranja)", "saude"), ("i-edu", "EDUCAÇÃO", "#DCEBEB", "var(--teal)", "educacao"),
           ("i-lazer", "LAZER", "#DCEBEB", "var(--teal)", "lazer"), ("i-seg", "SEGURANÇA<br>FINANCEIRA", "#FDE7D6", "var(--laranja)", "seguranca")]
tiles = "".join(
    f'<div class="el" data-in="{c[k]}" data-a="pop" style="top:{700 + (i // 2) * 420}px;left:{70 + (i % 2) * 480}px;right:auto;width:460px">'
    f'<div style="width:440px;height:390px;background:#fff;border-radius:40px;box-shadow:0 24px 50px rgba(0,0,0,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px">'
    f'<div style="width:170px;height:170px;border-radius:44px;background:{bg};display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 100 100" style="width:110px;color:{cor}"><use href="#{ic}"/></svg></div>'
    f'<div class="h" style="font-size:52px;color:var(--teal);text-align:center;line-height:1.05">{t}</div></div></div>'
    for i, (ic, t, bg, cor, k) in enumerate(pilares))

planos = [("Individual", 1, "linear-gradient(160deg,#F7C548,#F0A93E)", "209,90"), ("Duplo", 2, "linear-gradient(160deg,#E9E1D6,#D8CDBF)", "239,90"),
          ("Quádruplo", 4, "linear-gradient(160deg,#F3D9C4,#E8BFA0)", "279,90")]
mini_planos = "".join(
    f'<div class="el" data-in="{c["apartir"] + 0.5 + i * 0.25:.2f}" data-a="rise" style="top:1130px;left:{40 + i * 340}px;right:auto;width:320px">'
    f'<div style="width:320px;background:#fff;border-radius:30px;padding:14px;box-shadow:0 18px 40px rgba(0,0,0,.22);text-align:center">'
    f'<div style="transform:scale(.97);transform-origin:top center">{arte_plano(n, q, f)}</div>'
    f'<div class="h" style="font-size:40px;color:var(--teal);margin-top:10px">{n}</div>'
    f'<div class="h" style="font-size:54px;color:var(--laranja)"><span style="font-size:26px;color:#7A8A8B">R$</span>{p}</div></div></div>'
    for i, (n, q, f, p) in enumerate(planos))

cenas = f'''<div id="stage">

  <section class="scene" data-start="0" data-end="{c['seu'] - 0.1}" data-shake="{c['aten']}">
    <div class="f-lar"></div><svg class="padrao" data-pad="rgba(255,255,255,.14)"></svg>
    <div class="el h" data-in="{c['emp']}" data-a="slam" style="top:640px;font-size:150px;color:#fff">EMPRESÁRIO,</div>
    <div class="el" data-in="{c['aten']}" data-a="slam" style="top:840px"><div class="h" style="display:inline-block;background:var(--teal);color:#fff;font-size:180px;padding:20px 60px 30px;border-radius:30px">ATENÇÃO!</div></div>
  </section>

  <section class="scene" data-start="{c['seu'] - 0.1}" data-end="{c['calma'] - 0.1}" data-shake="{c['pediu']}">
    <div class="f-creme"></div>
    <div class="el" data-in="{c['seu'] - 0.05}" data-a="pop" style="top:220px"><svg viewBox="0 0 100 100" style="width:260px;height:260px;color:var(--laranja)"><use href="#i-porta"/></svg></div>
    <div class="el h" data-in="{c['seu']}" data-a="rise" style="top:540px;font-size:92px;color:var(--teal)">Seu melhor funcionário</div>
    <div class="el h" data-in="{c['pediu']}" data-a="slam" style="top:660px;font-size:112px;color:var(--laranja);white-space:nowrap">PEDIU AS CONTAS.</div>
    <div class="el" data-in="{c['duzentos']}" data-a="pop" style="top:860px"><div class="h" style="display:inline-block;background:var(--tinta);color:#fff;font-size:58px;line-height:1.15;padding:20px 44px 28px;border-radius:24px">foi pra concorrência<br>por <span style="color:var(--laranja)">R$ 200</span> a mais</div></div>
    <div class="el" data-in="{c['contratar']}" data-a="slideR" style="top:1120px;left:90px;right:auto;width:auto"><div class="h" style="display:inline-block;background:var(--teal);color:#fff;font-size:70px;padding:22px 44px 30px;border-radius:26px">contratar</div></div>
    <div class="el" data-in="{c['treinar']}" data-a="slideL" style="top:1120px;left:560px;right:auto;width:auto"><div class="h" style="display:inline-block;background:var(--teal);color:#fff;font-size:70px;padding:22px 44px 30px;border-radius:26px">treinar</div></div>
    <div class="el" data-in="{c['denovo']}" data-a="slam" style="top:1300px"><div class="h" style="display:inline-block;background:var(--laranja);color:#fff;font-size:96px;padding:22px 56px 32px;border-radius:28px;transform:rotate(-3deg)">TUDO DE NOVO.</div></div>
  </section>

  <section class="scene" data-start="{c['calma'] - 0.1}" data-end="{c['preco'] - 0.1}">
    <div class="f-teal"></div><svg class="padrao" data-pad="rgba(255,255,255,.06)"></svg>
    <div class="el h" data-in="{c['calma']}" data-a="drop" style="top:170px;font-size:100px;color:#fff">Mas calma.</div>
    <div class="el" data-in="{c['benefiz']}" data-a="pop" style="top:350px" id="logo5"></div>
    {tiles}
  </section>

  <section class="scene" data-start="{c['preco'] - 0.1}" data-end="{c['chama'] - 0.1}">
    <div class="f-lar"></div><svg class="padrao" data-pad="rgba(255,255,255,.14)"></svg>
    <div class="el h" data-in="{c['preco']}" data-a="drop" style="top:150px;font-size:96px;color:#fff">E o preço?</div>
    <div class="el h" data-in="{c['mentira']}" data-a="slam" style="top:290px;font-size:104px;color:var(--tinta);white-space:nowrap">PARECE MENTIRA...</div>
    <div class="el" data-in="{c['naoe']}" data-a="pop" style="top:440px"><div class="h" style="display:inline-block;background:#fff;color:var(--laranja);font-size:96px;padding:18px 54px 28px;border-radius:30px;transform:rotate(-3deg)">MAS NÃO É!</div></div>
    <div class="el h" data-in="{c['apartir']}" data-a="rise" style="top:690px;font-size:60px;color:#fff">a partir de</div>
    <div class="el h" data-in="{c['duzentos2']}" data-a="slam" style="top:780px;font-size:200px;color:#fff;white-space:nowrap"><span style="font-size:80px">R$</span>209,90<span style="font-size:60px">/mês</span></div>
    {mini_planos}
  </section>

  <section class="scene" data-start="{c['chama'] - 0.1}" data-end="{FIM + 1}">
    <div class="f-creme"></div>
    <div class="el" data-in="{c['chama'] - 0.05}" data-a="pop" style="top:240px" id="logo7"></div>
    <div class="el" data-in="{c['chama'] + 0.15}" data-a="pop" style="top:640px"><div class="pill" style="background:#25D366;color:#fff;font-size:70px;box-shadow:0 20px 50px rgba(37,211,102,.35)"><svg viewBox="0 0 32 32" style="width:88px;height:88px;color:#fff"><use href="#i-whats"/></svg>CHAMA NO WHATS</div></div>
    <div class="el h" data-in="{c['chama'] + 0.5}" data-a="rise" style="top:860px;font-size:92px;color:var(--laranja)">{WHATS}</div>
    <div class="el h" data-in="{c['conheca']}" data-a="rise" style="top:1010px;font-size:76px;color:var(--teal)">e conheça o Benefiz</div>
    <div class="el" data-in="{c['conheca'] + 0.4}" data-a="rise" style="top:1130px;font-weight:700;font-size:40px;color:var(--teal)">@benefiz.br · +20 mil vidas · 120 empresas</div>
  </section>
</div>

'''
script = script.replace('BENEFIZ.logo(700, "branco")', 'BENEFIZ.logo(760, "branco")')
script = script.replace('document.getElementById("vidas").textContent', '(document.getElementById("vidas") || {}).textContent')
(ROOT / "anuncio_v3.html").write_text(head + cenas + script)
print("anuncio_v3.html · duração", round(FIM, 2))
