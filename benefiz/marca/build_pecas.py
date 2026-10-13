#!/usr/bin/env python3
"""Peças de exemplo Benefiz (identidade do cliente mantida): anúncio, carrossel (5), post e story.
Exportar: node marca/shot.js marca/pecas.html pecas"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WHATS = "(61) 8199-0171"
pecas = []


def peca(nome, w, h, bg, corpo):
    pecas.append(f'<div data-shot="{nome}" style="position:relative;width:{w}px;height:{h}px;overflow:hidden;background:{bg}">{corpo}</div>')


def logo(w, tema="claro"):
    return f'<span data-logo="{tema}" data-w="{w}"></span>'


def ic(nome, w, cor):
    return f'<svg viewBox="0 0 100 100" style="width:{w}px;height:{w}px;color:{cor};display:block"><use href="#{nome}"/></svg>'


def padrao(cor="rgba(255,255,255,.22)", x=0, y=0, cols=4, rows=9, step=150):
    """Padrão de mãozinhas Benefiz: alterna ícone cheio e contornado, como nas peças deles."""
    out = []
    for r in range(rows):
        for c in range(cols):
            cheio = (r + c) % 3 == 0
            st = f'fill="{cor}"' if cheio else f'fill="none" stroke="{cor}" stroke-width="22"'
            out.append(f'<g transform="translate({x + c * step} {y + r * step}) scale(.105)"><path data-icpath {st}/></g>')
    return f'<svg class="abs" style="left:0;top:0;width:100%;height:100%" viewBox="0 0 1080 1920" preserveAspectRatio="xMinYMin slice">{"".join(out)}</svg>'


PILARES = [("i-saude", "Saúde", "Convênio médico e odontológico + desconto em remédios"),
           ("i-edu", "Educação", "Até 60% de desconto em cursos e escolas"),
           ("i-lazer", "Lazer", "Clubes, parques, cinemas e hotel fazenda"),
           ("i-seg", "Segurança financeira", "Seguro de vida, assistências e sorteios mensais")]


def pilares(cor_ic, cor_t, cor_s, w=420, gap=26, fs=40):
    return "".join(f'<div style="width:{w}px;display:flex;gap:20px;align-items:flex-start;margin-bottom:{gap}px">'
                   f'<div style="flex:none;width:96px;height:96px;border-radius:26px;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center">{ic(i, 60, cor_ic)}</div>'
                   f'<div><div class="h" style="font-size:{fs}px;color:{cor_t}">{t}</div><div style="font-weight:500;font-size:{int(fs * .62)}px;color:{cor_s};margin-top:6px;line-height:1.25">{s}</div></div></div>'
                   for i, t, s in PILARES)


# 1. ANÚNCIO (1080x1350)
peca("anuncio_01.jpg", 1080, 1350, "linear-gradient(160deg,#3E7C7E,#2F6365)", f'''
  {padrao("rgba(255,255,255,.07)")}
  <div class="abs" style="left:80px;top:70px">{logo(380, "branco")}</div>
  <div class="abs h" style="left:80px;top:250px;width:920px;font-size:96px;color:#fff">Toda empresa disputa cliente.<br><span style="color:var(--laranja)">A guerra agora é por funcionários.</span></div>
  <div class="abs" style="left:80px;top:690px;width:920px;font-weight:500;font-size:36px;color:#E3F0F0;line-height:1.35">Ofereça convênio médico e odontológico + multibenefícios e segure os melhores talentos da sua equipe.</div>
  <div class="abs" style="left:80px;top:880px;display:flex;gap:22px">{"".join(f'<div style="width:205px;height:170px;border-radius:26px;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">{ic(i, 64, "#fff")}<div style="font-weight:700;font-size:24px;color:#fff;text-align:center;line-height:1.1">{t}</div></div>' for i, t, _ in PILARES)}</div>
  <div class="abs" style="left:80px;top:1130px;display:inline-flex;align-items:center;gap:18px;background:var(--laranja);border-radius:60px;padding:24px 44px;font-weight:800;font-size:40px;color:#fff;box-shadow:0 16px 40px rgba(0,0,0,.25)">
    <svg viewBox="0 0 32 32" style="width:52px;height:52px;color:#fff"><use href="#i-whats"/></svg>Monte o pacote da sua empresa</div>''')

# 2. CARROSSEL (5 x 1080x1350)
C = [
    ("carrossel_01_capa.jpg", "var(--laranja)", f'''{padrao("rgba(255,255,255,.18)", x=560)}
      <div class="abs" style="left:80px;top:80px">{logo(320, "branco")}</div>
      <div class="abs h" style="left:80px;top:330px;width:780px;font-size:104px;color:#fff">Seu melhor funcionário pode estar olhando outras vagas agora.</div>
      <div class="abs" style="left:80px;top:1090px;display:inline-block;background:#fff;color:var(--teal);font-weight:800;font-size:38px;padding:20px 40px;border-radius:50px">Arraste para o lado →</div>'''),
    ("carrossel_02.jpg", "var(--creme)", f'''
      <div class="abs" style="left:80px;top:90px;font-weight:700;font-size:30px;letter-spacing:6px;color:var(--laranja)">A VERDADE</div>
      <div class="abs h" style="left:80px;top:160px;width:960px;font-size:100px;color:var(--teal)">Salário atrai.<br><span style="color:var(--laranja)">Benefício segura.</span></div>
      <div class="abs" style="left:80px;top:470px;width:880px;font-weight:500;font-size:42px;color:var(--tinta);line-height:1.4">Quando duas empresas pagam parecido, quem decide é o que vem junto: <b>saúde para a família, estudo, lazer e tranquilidade.</b></div>
      <div class="abs" style="left:80px;top:930px;display:flex;align-items:center;gap:30px">{ic("i-porta", 150, "#F08A3E")}<div class="h" style="font-size:52px;color:var(--teal);width:700px">Trocar de funcionário custa tempo, treinamento e dinheiro.</div></div>'''),
    ("carrossel_03.jpg", "linear-gradient(160deg,#3E7C7E,#2F6365)", f'''{padrao("rgba(255,255,255,.06)")}
      <div class="abs" style="left:80px;top:90px;font-weight:700;font-size:30px;letter-spacing:6px;color:var(--laranja)">COM O BENEFIZ</div>
      <div class="abs h" style="left:80px;top:150px;width:920px;font-size:86px;color:#fff">Sua equipe ganha 4 pilares de bem-estar</div>
      <div class="abs" style="left:80px;top:440px">{pilares("#3E7C7E", "#fff", "#D3E7E7", w=920, gap=70, fs=54)}</div>'''),
    ("carrossel_04.jpg", "var(--creme)", f'''
      <div class="abs" style="left:80px;top:90px;font-weight:700;font-size:30px;letter-spacing:6px;color:var(--laranja)">E A SUA EMPRESA?</div>
      <div class="abs h" style="left:80px;top:150px;width:920px;font-size:96px;color:var(--teal)">Ganha uma equipe que quer ficar.</div>
      {"".join(f'<div class="abs" style="left:80px;top:{470 + k * 175}px;width:920px;height:145px;border-radius:30px;background:#fff;box-shadow:0 10px 30px rgba(31,58,59,.08);display:flex;align-items:center;gap:30px;padding:0 40px"><div class="h" style="flex:none;width:80px;height:80px;border-radius:50%;background:var(--laranja);color:#fff;font-size:44px;display:flex;align-items:center;justify-content:center">✓</div><div style="font-weight:700;font-size:40px;color:var(--tinta)">{t}</div></div>' for k, t in enumerate(["Menos rotatividade e menos recontratação", "Equipe mais presente e motivada", "Marca forte para atrair talentos", "Benefício completo, fácil de implementar"]))}'''),
    ("carrossel_05_cta.jpg", "var(--laranja)", f'''{padrao("rgba(255,255,255,.18)", x=560)}
      <div class="abs" style="left:80px;top:90px">{logo(360, "branco")}</div>
      <div class="abs h" style="left:80px;top:330px;width:900px;font-size:150px;color:#fff">+20 mil</div>
      <div class="abs h" style="left:80px;top:490px;width:900px;font-size:54px;color:#fff">vidas acolhidas e 120 empresas que já cuidam da sua equipe com o Benefiz.</div>
      <div class="abs" style="left:80px;top:890px;display:inline-flex;align-items:center;gap:18px;background:#fff;border-radius:60px;padding:26px 46px;font-weight:800;font-size:42px;color:var(--teal)">
        <svg viewBox="0 0 32 32" style="width:56px;height:56px;color:#25D366"><use href="#i-whats"/></svg>Chama no WhatsApp</div>
      <div class="abs" style="left:84px;top:1040px;font-weight:700;font-size:36px;color:#fff">{WHATS} · @benefiz.br</div>'''),
]
for nome, bg, corpo in C:
    peca(nome, 1080, 1350, bg, corpo)

# 3. POST (1080x1350)
peca("post_01.jpg", 1080, 1350, "var(--creme)", f'''
  <div class="abs" style="right:0;top:0;width:360px;height:1350px;background:var(--laranja);overflow:hidden">{padrao("rgba(255,255,255,.3)", x=-40, cols=3)}</div>
  <div class="abs" style="left:80px;top:80px">{logo(360)}</div>
  <div class="abs h" style="left:80px;top:300px;width:620px;font-size:100px;color:var(--teal)">Bem-estar não é luxo.</div>
  <div class="abs h" style="left:80px;top:530px;width:620px;font-size:90px;color:var(--laranja)">É estratégia.</div>
  <div class="abs" style="left:80px;top:700px;width:600px;font-weight:500;font-size:34px;color:var(--tinta);line-height:1.4">Funcionário cuidado falta menos, rende mais e veste a camisa da empresa.</div>
  <div class="abs" style="left:80px;top:950px;display:flex;gap:18px">{"".join(f'<div style="width:130px;height:130px;border-radius:32px;background:#fff;box-shadow:0 10px 26px rgba(31,58,59,.12);display:flex;align-items:center;justify-content:center">{ic(i, 72, "#3E7C7E")}</div>' for i, _, _ in PILARES)}</div>
  <div class="abs" style="left:80px;top:1140px;width:600px;font-weight:700;font-size:32px;color:var(--teal);line-height:1.35">Saúde · Educação · Lazer ·<br>Segurança financeira</div>''')

# 4. STORY (1080x1920)
peca("story_01.jpg", 1080, 1920, "linear-gradient(170deg,#3E7C7E,#2F6365)", f'''{padrao("rgba(255,255,255,.06)")}
  <div class="abs w100 c" style="top:180px">{logo(460, "branco")}</div>
  <div class="abs w100 c h" style="top:470px;font-size:110px;color:#fff;padding:0 70px">Sua empresa já oferece benefícios?</div>
  <div class="abs w100 c" style="top:860px"><div style="display:inline-flex;gap:0;border-radius:40px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.3)">
    <div class="h" style="width:380px;padding:46px 0;background:#fff;color:var(--teal);font-size:62px">SIM</div>
    <div class="h" style="width:380px;padding:46px 0;background:var(--laranja);color:#fff;font-size:62px">AINDA NÃO</div></div></div>
  <div class="abs w100 c" style="top:1150px;font-weight:500;font-size:44px;color:#E3F0F0;padding:0 110px;line-height:1.35">Convênio médico e odontológico + multibenefícios para a sua equipe.</div>
  <div class="abs w100 c" style="top:1400px"><div style="display:inline-flex;align-items:center;gap:18px;background:var(--laranja);border-radius:60px;padding:28px 52px;font-weight:800;font-size:44px;color:#fff">Toque no link e fale com a gente ↗</div></div>''')

html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Benefiz - peças de exemplo</title>
<link rel="stylesheet" href="base.css"></head><body>
{"".join(pecas)}
<script src="brand.js"></script><script src="icones.js"></script>
<script>
document.body.insertAdjacentHTML("afterbegin", ICONES);
document.querySelectorAll("[data-logo]").forEach(e => e.innerHTML = BENEFIZ.logo(+e.dataset.w, e.dataset.logo));
document.querySelectorAll("[data-icpath]").forEach(p => p.setAttribute("d", BENEFIZ.D));
</script></body></html>'''
(ROOT / "pecas.html").write_text(html)
print(len(pecas), "peças")
