#!/usr/bin/env python3
"""Monta anuncio2.html (roteiro v3, tudo falado) a partir do anuncio.html: mesmo estilo, cenas novas.
Versão escolhida na captura: anuncio2.html?v=sem  ou  anuncio2.html?v=tabaco"""
from pathlib import Path

src = Path("anuncio.html").read_text().split("\n")
head = "\n".join(src[:39]).replace("<title>Banca e Tabacaria Farah - Reels</title>", "<title>Farah Banca e Tabacaria - Reels v3</title>")
icones = "\n".join(src[163:182])
script = "\n".join(src[183:])
WA = '''<div style="display:inline-flex;align-items:center;gap:22px;background:var(--verde);border-radius:100px;padding:22px 48px;box-shadow:0 20px 50px rgba(0,0,0,.25)">
        <svg viewBox="0 0 100 100" style="width:80px;height:80px"><use href="#i-whats"/></svg><div class="anton" style="font-size:70px;color:#fff">(11) 99745-7700</div></div>'''
ONDA = lambda cor: f'<svg class="wave" style="bottom:-30px" viewBox="0 0 1200 220" preserveAspectRatio="none"><path d="M0 90 Q150 30 300 90 T600 90 T900 90 T1200 90 V220 H0Z" fill="{cor}"/></svg>'
AVISO18 = '<div class="el" data-in="{t}" data-a="fade" style="top:1850px;font-weight:700;font-size:25px;color:rgba(255,255,255,.8)">Venda de produtos de tabacaria proibida para menores de 18 anos.</div>'

stage = f'''<div id="stage">

  <!-- 1. GANCHO (rápido): Atenção, Ubatuba! -->
  <div class="scene" id="s1" data-start="0" data-end="1.7">
    <div class="bg" data-kb="1.12,1.04" style="background-image:url(assets/orla_hd.png)"></div>
    <div class="shade" style="background:radial-gradient(ellipse at 50% 45%, rgba(13,27,42,.55) 0%, rgba(13,27,42,.2) 70%)"></div>
    <div class="el" data-in="0.25" data-a="pop" style="top:640px"><span class="tag anton" style="background:var(--sol);color:var(--tinta);font-size:150px;transform:rotate(-3deg)">ATENÇÃO,</span></div>
    <div class="el anton sombra" data-in="0.8" data-a="pop" style="top:860px;font-size:240px;color:#fff">UBATUBA!</div>
  </div>

  <!-- 2. DOR: tá na praia e faltou alguma coisa? -->
  <div class="scene" id="s2" data-start="1.7" data-end="3.95">
    <div class="bg" data-kb="1.08,1.16" style="background-image:url(assets/orla_hd.png);background-position:60% center;filter:blur(5px) saturate(.7)"></div>
    <div class="shade" style="background:rgba(13,27,42,.55)"></div>
    <div class="el pac sombra" data-in="1.75" data-a="rise" style="top:330px;font-size:86px;color:var(--areia)">tá na praia e...</div>
    <div class="el anton sombra" data-in="2.5" data-a="pop" style="top:500px;font-size:190px;color:var(--sol)">FALTOU</div>
    <div class="el anton sombra" data-in="2.9" data-a="pop" style="top:700px;font-size:140px;color:#fff">ALGUMA COISA?</div>
    <div class="el" data-in="3.0" data-a="rise" style="top:1000px;display:flex;justify-content:center;gap:40px">
      {"".join(f'<div style="background:#fff;border-radius:30px;padding:26px;box-shadow:0 14px 34px rgba(0,0,0,.3)"><svg viewBox="0 0 100 100" style="width:170px;height:170px"><use href="#{i}"/></svg></div>' for i in ("i-agua", "i-bateria", "i-chinelo-quebrado"))}
    </div>
  </div>

  <!-- 3. MARCA falada: Corre na Farah, Banca e Tabacaria! -->
  <div class="scene" id="s3" data-start="3.95" data-end="6.4">
    <div class="shade" style="background:var(--coral)"></div>
    {ONDA("var(--coral2)")}
    <div class="el anton" data-in="4.0" data-a="pop" style="top:190px;font-size:120px;color:#fff">CORRE NA</div>
    <div class="el" data-in="4.75" data-a="pop" style="top:330px;font-family:Cinzel;font-size:240px;color:var(--sol);letter-spacing:12px">FARAH</div>
    <div class="el anton" data-in="5.25" data-a="rise" style="top:620px;font-size:100px;color:#fff">BANCA E</div>
    <div class="el anton" data-in="5.65" data-a="pop" style="top:730px;font-size:200px;color:#fff">TABACARIA</div>
    <div class="el" data-in="4.3" data-a="rise" style="top:1030px"><div class="foto" style="transform:rotate(-2deg)"><img src="assets/fachada_hd.png" style="width:860px;height:600px;object-fit:cover"></div></div>
  </div>

  <!-- 4. TEM DE TUDO + TABACARIA COMPLETA (versão com tabaco mostra a ilustração) -->
  <div class="scene" id="s4" data-start="6.4" data-end="10.1">
    <div class="shade" style="background:radial-gradient(ellipse at 50% 40%, #1A3550 0%, #0D1B2A 75%)"></div>
    <div class="el pac" data-in="6.45" data-a="rise" style="top:120px;font-size:76px;color:var(--areia)">pertinho da praia,</div>
    <div class="el anton" data-in="7.7" data-a="pop" style="top:290px;font-size:150px;color:var(--sol)">TEM DE TUDO:</div>
    <div class="el anton" data-in="8.85" data-a="pop" style="top:490px;font-size:200px;color:#fff">TABACARIA</div>
    <div class="el anton" data-in="9.35" data-a="rise" style="top:705px;font-size:120px;color:var(--coral)">COMPLETA</div>
    <div class="el so-tabaco" data-in="8.9" data-a="rise" style="top:820px" id="tab"></div>
    <div class="el so-tabaco" data-in="8.9" data-a="fade" style="top:1660px" id="tabaviso"></div>
    <div class="el sem-tabaco" data-in="9.0" data-a="pop" style="top:960px">
      <div style="display:inline-block;width:520px;height:520px;border-radius:50%;background:var(--coral);border:14px solid var(--sol);box-shadow:0 30px 70px rgba(0,0,0,.45)">
        <div class="anton" style="font-size:230px;color:#fff;margin-top:110px">18+</div></div></div>
    <div class="el sem-tabaco" data-in="9.2" data-a="fade" style="top:1560px;font-weight:800;font-size:40px;color:var(--areia)">só para maiores de 18 anos</div>
  </div>

  <!-- 5. PRODUTOS no ritmo da voz -->
  <div class="scene" id="s5" data-start="10.1" data-end="16.85">
    <div class="shade" style="background:linear-gradient(180deg,#FFC93C 0%,#FFB020 100%)"></div>
    <div class="el" data-in="10.1" data-a="fade" style="top:110px;font-family:Mont;font-weight:800;font-size:40px;letter-spacing:8px;color:var(--coral2)">NA FARAH BANCA E TABACARIA</div>
    <div class="el anton" data-in="10.1" data-a="fade" style="top:180px;font-size:84px;color:var(--tinta)">TEM DE TUDO:</div>
    <div id="prod"></div>
    <div class="el" data-in="16.2" data-a="rise" style="top:1540px;padding:0 60px">
      <span class="chip" style="background:var(--tinta);border-color:var(--tinta)">vinhos</span>
      <span class="chip" style="background:var(--tinta);border-color:var(--tinta)">mangás</span>
      <span class="chip" style="background:var(--tinta);border-color:var(--tinta)">ímãs de Ubatuba</span>
      <span class="chip" style="background:var(--coral);border-color:var(--coral)">e muito mais</span>
    </div>
  </div>

  <!-- 6. DELIVERY E iFOOD: pediu, a Farah leva! -->
  <div class="scene" id="s6" data-start="16.85" data-end="20.6">
    <div class="shade" style="background:linear-gradient(180deg,#FFC93C 0%,#FFB020 100%)"></div>
    {ONDA("var(--mar)")}
    <div class="el anton" data-in="16.95" data-a="pop" style="top:170px;font-size:110px;color:var(--coral2)">E TEM</div>
    <div class="el anton" data-in="17.35" data-a="pop" style="top:290px;font-size:250px;color:var(--tinta)">DELIVERY</div>
    <div class="el" data-in="17.5" data-a="slideR" style="top:570px"><svg viewBox="0 0 100 100" style="width:400px;height:400px"><use href="#i-delivery"/></svg></div>
    <div class="el" data-in="18.1" data-a="pop" style="top:990px">
      <span style="display:inline-block;background:#EA1D2C;color:#fff;border-radius:40px;padding:20px 60px 28px;box-shadow:0 16px 40px rgba(0,0,0,.25);transform:rotate(-2deg)">
        <span class="anton" style="font-size:66px;vertical-align:middle">E NO </span><span style="font-family:Mont;font-weight:900;font-size:92px;vertical-align:middle;letter-spacing:-2px">iFood</span></span></div>
    <div class="el anton" data-in="19.0" data-a="rise" style="top:1210px;font-size:110px;color:var(--tinta)">PEDIU, A FARAH LEVA!</div>
    <div class="el" data-in="19.3" data-a="rise" style="top:1400px">{WA}</div>
  </div>

  <!-- 7. ENDEREÇO falado: Farah, Banca e Tabacaria: Av. Iperoig, 301, no Centro -->
  <div class="scene" id="s7" data-start="20.6" data-end="26.3">
    <div class="shade" style="background:linear-gradient(180deg,#0D1B2A 0%,#0B2E45 100%)"></div>
    <div class="el" data-in="20.65" data-a="pop" style="top:120px;font-family:Cinzel;font-size:210px;color:var(--coral);letter-spacing:10px">FARAH</div>
    <div class="el anton" data-in="21.45" data-a="rise" style="top:370px;font-size:104px;color:#fff">BANCA E TABACARIA</div>
    <div class="el" data-in="21.0" data-a="rise" style="top:560px"><div class="foto" style="transform:rotate(1.5deg)"><img src="assets/fachada_hd.png" style="width:860px;height:580px;object-fit:cover"></div></div>
    <div class="el" data-in="22.9" data-a="pop" style="top:1230px"><svg viewBox="0 0 100 100" style="width:120px;height:120px"><use href="#i-pin"/></svg></div>
    <div class="el anton" data-in="22.95" data-a="rise" style="top:1370px;font-size:120px;color:#fff">AV. IPEROIG, 301</div>
    <div class="el" data-in="25.5" data-a="rise" style="top:1520px;font-weight:800;font-size:54px;color:var(--sol)">CENTRO · UBATUBA-SP</div>
    <div class="el pac" data-in="25.7" data-a="fade" style="top:1610px;font-size:52px;color:var(--areia)">pertinho da praia</div>
    {AVISO18.format(t=20.65)}
  </div>

  <!-- 8. SLOGAN falado: Pensou em Ubatuba? Pensou em Tabacaria Farah! -->
  <div class="scene" id="s8" data-start="26.3" data-end="31">
    <div class="shade" style="background:radial-gradient(ellipse at 50% 30%, #12304A 0%, #0D1B2A 70%)"></div>
    {ONDA("var(--mar)")}
    <div class="el" data-in="26.35" data-a="pop" style="top:130px" id="s8logo"></div>
    <div class="el pac" data-in="26.7" data-a="rise" style="top:760px;font-size:96px;color:var(--areia)">Pensou em Ubatuba?</div>
    <div class="el anton" data-in="27.95" data-a="rise" style="top:930px;font-size:110px;color:#fff">PENSOU EM TABACARIA</div>
    <div class="el" data-in="29.0" data-a="pop" style="top:1090px;font-family:Cinzel;font-size:210px;color:var(--coral);letter-spacing:12px">FARAH!</div>
    <div class="el" data-in="28.6" data-a="fade" style="top:1420px;font-weight:800;font-size:44px;color:#fff">Delivery e iFood · (11) 99745-7700</div>
    <div class="el" data-in="28.6" data-a="fade" style="top:1490px;font-weight:800;font-size:40px;color:var(--sol)">@banca_farah_ubatuba</div>
    {AVISO18.format(t=26.35)}
  </div>

</div>'''

PROD = '''const PRODUTOS = [
  ["i-gelada", "BEBIDA<br>GELADA", 10.15], ["i-energetico", "ENERGÉTICO", 11.27], ["i-doce", "DOCES", 12.33],
  ["i-chinelo", "CHINELO", 12.86], ["i-bone", "BONÉ", 13.61], ["i-carregador", "CARREGADOR", 14.29],
  ["i-card", "CARD<br>POKÉMON", 15.69],
];'''
a = script.index("const PRODUTOS = ["); b = script.index("];", a) + 2
script = script[:a] + PROD + script[b:]
script = script.replace(": 22.6;", ": 16.95;")
script = script.replace('document.getElementById("s8logo").innerHTML = FARAH.emblema(560, "escuro");',
    '''document.getElementById("s8logo").innerHTML = FARAH.emblema(560, "escuro");
const VERSAO = new URLSearchParams(location.search).get("v") || "sem";
document.querySelectorAll(VERSAO === "tabaco" ? ".sem-tabaco" : ".so-tabaco").forEach(e => e.remove());
if (VERSAO === "tabaco") document.getElementById("tabaviso").innerHTML = TABACO.aviso(980);''')
script = script.replace("function render(t) {", '''function render(t) {
  const tab = document.getElementById("tab");
  if (tab) tab.innerHTML = TABACO.cena(820, t);''')
html = head + "\n" + stage + "\n" + icones + '\n<script src="marca/brand.js"></script>\n<script src="marca/tabaco.js"></script>\n' + script
Path("anuncio2.html").write_text(html)
print("ok")
