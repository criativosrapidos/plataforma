#!/usr/bin/env python3
"""Reels Benefiz v2 (voz masculina, copy na dor): monta anuncio_v2.html a partir do motor do anuncio.html
e das cenas abaixo, com os tempos vindos de audio/cues_v2.json (palavras da locução)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
src = (ROOT / "anuncio.html").read_text()
head = src[:src.index('<div id="stage">')]
script = src[src.index('<script src="marca/brand.js">'):]
c = json.load(open(ROOT / "audio/cues_v2.json"))
FIM = c["fim"] + 1.2

cenas = f'''<div id="stage">

  <!-- 1. Segunda, 8h: "Chefe, preciso conversar." -->
  <section class="scene" data-start="0" data-end="{c['seu'] - 0.15}">
    <div class="f-teal"></div><svg class="padrao" data-pad="rgba(255,255,255,.05)"></svg>
    <div class="el h" data-in="0.1" data-a="drop" style="top:260px;font-size:84px;color:#fff">Segunda-feira, 8h</div>
    <div class="el" data-in="{c['mensagem'] - 0.1}" data-a="pop" style="top:520px"><div style="display:inline-block;width:820px;background:#fff;border-radius:44px;padding:36px 44px;text-align:left;box-shadow:0 30px 70px rgba(0,0,0,.35)">
      <div style="display:flex;align-items:center;gap:22px"><div style="width:96px;height:96px;border-radius:50%;background:#D9E6E6;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 100 100" style="width:62px;color:var(--teal)"><use href="#i-grupo"/></svg></div>
        <div><div style="font-weight:800;font-size:40px;color:var(--tinta)">Seu melhor funcionário</div><div style="font-weight:600;font-size:28px;color:#7A8A8B">agora · WhatsApp</div></div></div>
      <div class="el-txt" style="margin-top:30px;background:#E7F6EC;border-radius:30px 30px 30px 8px;padding:30px 36px;font-weight:700;font-size:62px;color:var(--tinta)">Chefe, preciso conversar.</div></div></div>
    <div class="el" data-in="{c['chefe']}" data-a="pop" style="top:470px;left:860px;right:auto"><div class="h" style="width:150px;height:150px;border-radius:50%;background:#E5484D;color:#fff;font-size:90px;line-height:150px">1</div></div>
  </section>

  <!-- 2. Tá indo embora, por 200 reais -->
  <section class="scene" data-start="{c['seu'] - 0.15}" data-end="{c['lavai'] - 0.1}" data-shake="{c['embora']}">
    <div class="f-creme"></div>
    <div class="el" data-in="{c['seu'] - 0.1}" data-a="pop" style="top:260px"><svg viewBox="0 0 100 100" style="width:300px;height:300px;color:var(--laranja)"><use href="#i-porta"/></svg></div>
    <div class="el h" data-in="{c['seu']}" data-a="rise" style="top:640px;font-size:92px;color:var(--teal)">Seu melhor funcionário</div>
    <div class="el h" data-in="{c['embora']}" data-a="slam" style="top:760px;font-size:118px;color:var(--laranja);white-space:nowrap">TÁ INDO EMBORA.</div>
    <div class="el" data-in="{c['duzentos']}" data-a="pop" style="top:990px"><div class="h" style="display:inline-block;background:var(--tinta);color:#fff;font-size:76px;padding:22px 50px 30px;border-radius:26px">por <span style="color:var(--laranja)">R$ 200</span> a mais</div></div>
    <div class="el" data-in="{c['concorrencia']}" data-a="rise" style="top:1180px;font-weight:700;font-size:58px;color:var(--tinta)">...na concorrência.</div>
  </section>

  <!-- 3. Contratar, treinar, tudo de novo -->
  <section class="scene" data-start="{c['lavai'] - 0.1}" data-end="{c['agora'] - 0.1}">
    <div class="f-lar"></div><svg class="padrao" data-pad="rgba(255,255,255,.12)"></svg>
    <div class="el h" data-in="{c['lavai']}" data-a="drop" style="top:330px;font-size:84px;color:#fff">E lá vai você...</div>
    <div class="el" data-in="{c['contratar']}" data-a="slideR" style="top:560px"><div class="h" style="display:inline-block;background:#fff;color:var(--teal);font-size:100px;padding:26px 60px 36px;border-radius:30px">contratar</div></div>
    <div class="el" data-in="{c['treinar']}" data-a="slideL" style="top:790px"><div class="h" style="display:inline-block;background:#fff;color:var(--teal);font-size:100px;padding:26px 60px 36px;border-radius:30px">treinar</div></div>
    <div class="el" data-in="{c['denovo']}" data-a="slam" style="top:1030px"><div class="h" style="display:inline-block;background:var(--tinta);color:#fff;font-size:110px;padding:26px 60px 36px;border-radius:30px;transform:rotate(-3deg)">TUDO DE NOVO.</div></div>
  </section>

  <!-- 4. E se ele tivesse motivo pra ficar? + o que o Benefiz dá -->
  <section class="scene" data-start="{c['agora'] - 0.1}" data-end="{c['isso'] - 0.1}">
    <div class="f-teal"></div><svg class="padrao" data-pad="rgba(255,255,255,.06)"></svg>
    <div class="el h" data-in="{c['agora']}" data-a="drop" style="top:190px;font-size:80px;color:#fff">E se ele tivesse</div>
    <div class="el h" data-in="{c['motivo']}" data-a="slam" style="top:300px;font-size:104px;color:var(--laranja);white-space:nowrap">MOTIVO PRA FICAR?</div>
    <div class="el" data-in="{c['consulta']}" data-a="slideR" style="top:540px"><div class="card"><div class="ic" style="background:#FDE7D6"><svg viewBox="0 0 100 100" style="width:96px;color:var(--laranja)"><use href="#i-saude"/></svg></div><div class="t">CONSULTAS<small>e exames, de todas as especialidades</small></div></div></div>
    <div class="el" data-in="{c['dentista']}" data-a="slideL" style="top:770px"><div class="card"><div class="ic" style="background:#DCEBEB"><svg viewBox="0 0 100 100" style="width:96px;color:var(--teal)"><use href="#i-dente"/></svg></div><div class="t">DENTISTA<small>Tratamentos odontológicos</small></div></div></div>
    <div class="el" data-in="{c['farmacia']}" data-a="slideR" style="top:1000px"><div class="card"><div class="ic" style="background:#FDE7D6"><svg viewBox="0 0 100 100" style="width:100px;color:var(--laranja)"><use href="#i-remedio"/></svg></div><div class="t">FARMÁCIA<small>Desconto em medicamentos</small></div></div></div>
    <div class="el" data-in="{c['seguro']}" data-a="slideL" style="top:1230px"><div class="card"><div class="ic" style="background:#DCEBEB"><svg viewBox="0 0 100 100" style="width:96px;color:var(--teal)"><use href="#i-seg"/></svg></div><div class="t">SEGURO DE VIDA<small>e assistência pra família toda</small></div></div></div>
  </section>

  <!-- 5. Isso é Benefiz + prova -->
  <section class="scene" data-start="{c['isso'] - 0.1}" data-end="{c['cabe'] - 0.1}">
    <div class="f-lar"></div><svg class="padrao" data-pad="rgba(255,255,255,.14)"></svg>
    <div class="el h" data-in="{c['isso']}" data-a="drop" style="top:200px;font-size:84px;color:#fff">Isso é</div>
    <div class="el" data-in="{c['benefiz']}" data-a="pop" style="top:320px" id="logo5"></div>
    <div class="el h" data-in="{c['vinte']}" data-a="slam" id="vidas" style="top:700px;font-size:200px;color:#fff">+0</div>
    <div class="el h" data-in="{c['vidas']}" data-a="rise" style="top:920px;font-size:76px;color:#fff">vidas acolhidas</div>
    <div class="el" data-in="{c['cento']}" data-a="pop" style="top:1090px"><div class="h" style="display:inline-block;background:#fff;color:var(--teal);font-size:76px;padding:22px 50px 30px;border-radius:30px">120 empresas confiam</div></div>
  </section>

  <!-- 6. Preços -->
  <section class="scene" data-start="{c['cabe'] - 0.1}" data-end="{c['chama'] - 0.1}">
    <div class="f-creme"></div>
    <div class="el h" data-in="{c['cabe']}" data-a="drop" style="top:150px;font-size:96px;color:var(--teal)">E cabe no bolso</div>
    <div class="el" data-in="{c['apartir']}" data-a="rise" style="top:290px;font-weight:700;font-size:48px;color:var(--tinta)">planos a partir de <b style="color:var(--laranja)">R$ 209,90/mês</b></div>
    {''.join(f"""<div class="el" data-in="{c['apartir'] + 0.35 + i * 0.35:.2f}" data-a="slideR" style="top:{430 + i * 380}px"><div style="display:inline-flex;align-items:center;gap:30px;width:940px;background:#fff;border-radius:36px;padding:22px;text-align:left;box-shadow:0 20px 50px rgba(31,58,59,.15);{'border:6px solid var(--laranja);' if dest else ''}">
      <img src="assets/plano_{arq}.jpg" style="width:300px;height:300px;object-fit:cover;border-radius:26px;flex:none">
      <div><div class="h" style="font-size:58px;color:var(--teal)">{nome}</div><div style="font-weight:600;font-size:30px;color:var(--tinta);margin-top:6px">{sub}</div>
        <div style="margin-top:14px"><span style="font-weight:700;font-size:34px;color:#7A8A8B">R$ </span><span class="h" style="font-size:96px;color:var(--laranja)">{preco}</span><span style="font-weight:700;font-size:32px;color:#7A8A8B">/mês</span></div></div></div></div>"""
      for i, (arq, nome, sub, preco, dest) in enumerate([("individual", "Individual", "1 pessoa", "209,90", False), ("duplo", "Duplo", "2 pessoas", "239,90", False), ("quadruplo", "Quádruplo", "a família toda: 4 pessoas", "279,90", True)]))}
    <div class="el" data-in="{c['quadruplo']}" data-a="pop" style="top:1135px;left:560px;right:auto"><div class="h" style="display:inline-block;background:var(--laranja);color:#fff;font-size:38px;padding:12px 26px;border-radius:40px;transform:rotate(-4deg);white-space:nowrap;box-shadow:0 10px 24px rgba(0,0,0,.2)">menos de R$ 70 por pessoa</div></div>
  </section>

  <!-- 6. CTA -->
  <section class="scene" data-start="{c['chama'] - 0.1}" data-end="{FIM + 1}">
    <div class="f-creme"></div>
    <div class="el" data-in="{c['chama'] - 0.05}" data-a="pop" style="top:230px" id="logo7"></div>
    <div class="el" data-in="{c['chama'] + 0.2}" data-a="pop" style="top:620px"><div class="pill" style="background:#25D366;color:#fff;font-size:66px;box-shadow:0 20px 50px rgba(37,211,102,.35)"><svg viewBox="0 0 32 32" style="width:84px;height:84px;color:#fff"><use href="#i-whats"/></svg>CHAMA NO WHATS</div></div>
    <div class="el h" data-in="{c['escolhe']}" data-a="rise" style="top:830px;font-size:96px;color:var(--teal);padding:0 70px">e escolha o seu plano</div>
    <div class="el h" data-in="{c['escolhe'] + 0.4}" data-a="rise" style="top:1130px;font-size:72px;color:var(--laranja)">(61) 8199-0171</div>
    <div class="el" data-in="{c['escolhe'] + 0.7}" data-a="rise" style="top:1250px;font-weight:700;font-size:40px;color:var(--teal)">@benefiz.br · Cultivando bem-estar</div>
  </section>
</div>

'''
script = script.replace("eo(clamp((t - 22.68) / 1.8))", f"eo(clamp((t - {c['vinte']}) / 1.2))")
script = script.replace('BENEFIZ.logo(700, "branco")', 'BENEFIZ.logo(760, "branco")')
(ROOT / "anuncio_v2.html").write_text(head + cenas + script)
print("anuncio_v2.html · duração", round(FIM, 2))
