#!/usr/bin/env python3
"""Gera marca/pecas.html: avatar, capas de destaque, 6 posts e 3 stories da Farah Tabacaria.
Depois exporte com:  node marca/shot.js marca/pecas.html marca/saida/pecas
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ICONES = re.search(r'<svg width="0" height="0".*?</svg>', (ROOT.parent / "anuncio.html").read_text(), re.S).group(0)
WHATS, INSTA, END = "(11) 99745-7700", "@banca_farah_ubatuba", "Av. Iperoig, 301 · Centro · Ubatuba-SP"


def ic(nome, s):
    return f'<svg viewBox="0 0 100 100" style="width:{s}px;height:{s}px"><use href="#{nome}"/></svg>'


def onda(cor, bottom=-30):
    return (f'<svg class="wave" style="bottom:{bottom}px" viewBox="0 0 1200 220" preserveAspectRatio="none">'
            f'<path d="M0 90 Q150 30 300 90 T600 90 T900 90 T1200 90 V220 H0Z" fill="{cor}"/></svg>')


def peca(nome, w, h, bg, corpo):
    return f'<div data-shot="{nome}" style="position:relative;width:{w}px;height:{h}px;overflow:hidden;background:{bg}">{corpo}</div>'


def rodape(cor="#fff", y=1260):
    return (f'<div class="abs w100 c" style="top:{y}px"><span data-logo="horizontal" data-w="380" data-tema="escuro"></span></div>'
            if cor == "#fff" else
            f'<div class="abs w100 c" style="top:{y}px"><span data-logo="horizontal" data-w="380" data-tema="claro"></span></div>')


pecas = []
# ---- avatar e destaques
pecas.append(peca("farah_foto_perfil.jpg", 1080, 1080, "var(--tinta)",
                  '<div class="abs w100 c" style="top:60px"><span data-logo="emblema" data-w="960" data-tema="escuro"></span></div>'))
for nome, icn, cor in (("bebidas", "i-gelada", "var(--coral)"), ("praia", "i-chinelo", "var(--mar)"),
                       ("tech", "i-carregador", "var(--tinta)"), ("geek", "i-card", "var(--sol)"),
                       ("onde_fica", "i-pin", "var(--coral2)")):
    pecas.append(peca(f"destaque_{nome}.jpg", 1080, 1080, cor,
                      f'<div class="abs" style="left:240px;top:240px;width:600px;height:600px;border-radius:50%;background:#fff;'
                      f'display:flex;align-items:center;justify-content:center;box-shadow:0 20px 50px rgba(0,0,0,.25)">{ic(icn, 380)}</div>'))

# ---- posts 1080x1350
pecas.append(peca("post_1_faltou.jpg", 1080, 1350, "var(--coral)", f'''
  {onda("var(--coral2)")}
  <div class="abs w100 c pac" style="top:120px;font-size:84px;color:var(--areia)">faltou alguma coisa?</div>
  <div class="abs w100 c" style="top:300px;display:flex;justify-content:center;gap:40px">
    <div class="ic" style="width:230px;height:230px">{ic("i-agua", 170)}</div>
    <div class="ic" style="width:230px;height:230px">{ic("i-bateria", 170)}</div>
    <div class="ic" style="width:230px;height:230px">{ic("i-chinelo-quebrado", 170)}</div></div>
  <div class="abs w100 c anton" style="top:620px;font-size:170px;color:#fff">PASSA NA</div>
  <div class="abs w100 c cinzel" style="top:800px;font-size:230px;color:var(--sol)">FARAH!</div>
  {rodape("#fff", 1160)}'''))

pecas.append(peca("post_2_slogan.jpg", 1080, 1350, "radial-gradient(ellipse at 50% 30%,#12304A 0%,#0D1B2A 70%)", f'''
  {onda("var(--mar)")}
  <div class="abs w100 c" style="top:90px"><span data-logo="emblema" data-w="520" data-tema="escuro"></span></div>
  <div class="abs w100 c pac" style="top:670px;font-size:84px;color:var(--areia)">Falou em Ubatuba,</div>
  <div class="abs w100 c anton" style="top:820px;font-size:104px;color:#fff">FALOU EM TABACARIA</div>
  <div class="abs w100 c cinzel" style="top:960px;font-size:180px;color:var(--coral)">FARAH.</div>'''))

itens = [("i-gelada", "Bebida gelada"), ("i-refri", "Refri"), ("i-energetico", "Energético"), ("i-doce", "Doces"),
         ("i-chinelo", "Chinelo"), ("i-bone", "Boné"), ("i-carregador", "Carregador"), ("i-card", "Card Pokémon")]
grid = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:12px"><div class="ic" style="width:190px;height:190px">'
               f'{ic(a, 140)}</div><div style="font-weight:800;font-size:28px;color:var(--tinta)">{b}</div></div>' for a, b in itens)
pecas.append(peca("post_3_tem_de_tudo.jpg", 1080, 1350, "linear-gradient(180deg,#FFC93C,#FFB020)", f'''
  <div class="abs w100 c" style="top:80px;font-weight:800;font-size:34px;letter-spacing:8px;color:var(--coral2)">NA TABACARIA FARAH</div>
  <div class="abs w100 c anton" style="top:140px;font-size:150px;color:var(--tinta)">TEM DE TUDO</div>
  <div class="abs w100 c pac" style="top:300px;font-size:64px;color:var(--coral2)">pertinho da praia</div>
  <div class="abs" style="left:70px;right:70px;top:450px;display:grid;grid-template-columns:repeat(4,1fr);row-gap:36px">{grid}</div>
  {rodape("#000", 1200)}'''))

pecas.append(peca("post_4_onde_fica.jpg", 1080, 1350, "linear-gradient(180deg,#0D1B2A,#0B2E45)", f'''
  <div class="abs w100 c anton" style="top:80px;font-size:120px;color:#fff">ONDE FICA?</div>
  <div class="abs w100 c" style="top:250px"><div class="foto" style="transform:rotate(-1.5deg)"><img src="../assets/fachada_hd.png" style="width:860px;height:560px;object-fit:cover"></div></div>
  <div class="abs w100 c" style="top:880px">{ic("i-pin", 110)}</div>
  <div class="abs w100 c anton" style="top:1000px;font-size:104px;color:#fff">AV. IPEROIG, 301</div>
  <div class="abs w100 c" style="top:1130px;font-weight:800;font-size:44px;color:var(--sol)">CENTRO · UBATUBA-SP · PERTINHO DA PRAIA</div>
  <div class="abs w100 c aviso18" style="top:1290px">REVISTARIA · TABACARIA · CONVENIÊNCIAS</div>'''))

pecas.append(peca("post_5_carregador.jpg", 1080, 1350, "linear-gradient(180deg,#0B6E99,#084C6B)", f'''
  {onda("var(--areia)")}
  <div class="abs w100 c anton" style="top:110px;font-size:130px;color:#fff">ESQUECEU O</div>
  <div class="abs w100 c anton" style="top:250px;font-size:150px;color:var(--sol)">CARREGADOR?</div>
  <div class="abs w100 c" style="top:460px"><div class="ic" style="width:380px;height:380px;border-radius:50%">{ic("i-carregador", 280)}</div></div>
  <div class="abs w100 c pac" style="top:900px;font-size:76px;color:var(--areia)">relaxa, a Farah tem.</div>
  {rodape("#000", 1210)}'''))

pecas.append(peca("post_6_tabacaria.jpg", 1080, 1350, "var(--tinta)", f'''
  <div class="abs w100 c" style="top:130px;font-weight:800;font-size:44px;letter-spacing:16px;padding-left:16px;color:var(--areia)">BANCA E</div>
  <div class="abs w100 c anton" style="top:200px;font-size:200px;color:#fff">TABACARIA</div>
  <div class="abs w100 c cinzel" style="top:420px;font-size:200px;color:var(--coral)">FARAH</div>
  <div class="abs" style="left:260px;right:260px;top:690px;height:6px;background:var(--sol);border-radius:3px"></div>
  <div class="abs w100 c pac" style="top:740px;font-size:70px;color:var(--areia)">a tabacaria pertinho da praia</div>
  <div class="abs w100 c" style="top:930px;font-weight:800;font-size:36px;letter-spacing:6px;color:#fff">REVISTARIA · TABACARIA · CONVENIÊNCIAS</div>
  <div class="abs w100 c" style="top:1000px;font-weight:700;font-size:34px;color:var(--sol)">{END}</div>
  <div class="abs w100 c aviso18" style="top:1270px">Venda de produtos de tabacaria proibida para menores de 18 anos.</div>'''))

# ---- stories 1080x1920
pecas.append(peca("story_1_passa_na_farah.jpg", 1080, 1920, "var(--coral)", f'''
  {onda("var(--coral2)")}
  <div class="abs w100 c" style="top:160px"><span data-logo="emblema" data-w="420" data-tema="coral"></span></div>
  <div class="abs w100 c pac" style="top:700px;font-size:90px;color:var(--areia)">faltou alguma coisa?</div>
  <div class="abs w100 c anton" style="top:870px;font-size:190px;color:#fff">PASSA NA</div>
  <div class="abs w100 c cinzel" style="top:1060px;font-size:240px;color:var(--sol)">FARAH!</div>
  <div class="abs w100 c" style="top:1420px"><div style="display:inline-flex;align-items:center;gap:22px;background:#fff;border-radius:22px;padding:22px 40px;font-weight:800;font-size:44px;color:var(--tinta)">{ic("i-whats", 70)} {WHATS}</div></div>
  <div class="abs w100 c" style="top:1580px;font-weight:800;font-size:42px;color:#fff">{INSTA}</div>'''))

pecas.append(peca("story_2_enquete.jpg", 1080, 1920, "linear-gradient(180deg,#0B6E99,#084C6B)", f'''
  {onda("var(--areia)")}
  <div class="abs w100 c" style="top:150px"><span data-logo="horizontal" data-w="560" data-tema="escuro"></span></div>
  <div class="abs w100 c anton" style="top:450px;font-size:120px;color:#fff">O QUE VOCÊ MAIS</div>
  <div class="abs w100 c anton" style="top:580px;font-size:120px;color:var(--sol)">ESQUECE NA PRAIA?</div>
  <div class="abs" style="left:150px;right:150px;top:820px;background:#fff;border-radius:40px;padding:40px;box-shadow:0 20px 50px rgba(0,0,0,.3)">
    {"".join(f'<div style="display:flex;align-items:center;gap:24px;background:#F1F3F5;border-radius:24px;padding:20px 30px;margin:14px 0;font-weight:800;font-size:46px;color:var(--tinta)">{ic(a, 80)}{b}</div>' for a, b in (("i-agua", "Água"), ("i-carregador", "Carregador"), ("i-chinelo", "Chinelo")))}
  </div>
  <div class="abs w100 c pac" style="top:1500px;font-size:66px;color:var(--areia)">seja o que for, a Farah tem.</div>'''))

pecas.append(peca("story_3_onde_fica.jpg", 1080, 1920, "linear-gradient(180deg,#0D1B2A,#0B2E45)", f'''
  <div class="abs w100 c anton" style="top:170px;font-size:130px;color:#fff">PERTINHO DA PRAIA</div>
  <div class="abs w100 c" style="top:400px"><div class="foto" style="transform:rotate(1.5deg)"><img src="../assets/fachada_hd.png" style="width:880px;height:640px;object-fit:cover"></div></div>
  <div class="abs w100 c" style="top:1130px">{ic("i-pin", 130)}</div>
  <div class="abs w100 c anton" style="top:1290px;font-size:120px;color:#fff">AV. IPEROIG, 301</div>
  <div class="abs w100 c" style="top:1430px;font-weight:800;font-size:50px;color:var(--sol)">CENTRO · UBATUBA-SP</div>
  <div class="abs w100 c" style="top:1600px"><span data-logo="horizontal" data-w="520" data-tema="escuro"></span></div>'''))

html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Farah Tabacaria - peças</title>
<link rel="stylesheet" href="base.css"></head><body>
{"".join(pecas)}
{ICONES}
<script src="brand.js"></script>
<script>
document.querySelectorAll("[data-logo]").forEach(e => {{
  const w = +e.dataset.w, t = e.dataset.tema;
  e.innerHTML = e.dataset.logo === "emblema" ? FARAH.emblema(w, t) : e.dataset.logo === "slogan" ? FARAH.slogan(w, t) : FARAH.horizontal(w, t);
}});
</script></body></html>'''
(ROOT / "pecas.html").write_text(html)
print(len(pecas), "peças")
