#!/usr/bin/env python3
"""Gera marca/proposta.html (páginas 1920x1080) da proposta MultAgro.
Exportar:  node marca/shot.js marca/proposta.html marca/saida/paginas  e depois  python3 marca/pdf.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERDE = "radial-gradient(ellipse at 50% 30%,#2F7A3E 0%,#1E5A2E 55%,#14472A 100%)"
CREME = "#F4F1E6"
pages = []


def logo(w, tema="cor"):
    return f'<span data-logo="{tema}" data-w="{w}"></span>'


def ic(nome, w):
    return f'<svg viewBox="0 0 100 100" style="width:{w}px;height:{w}px"><use href="#{nome}"/></svg>'


def pg(nome, bg, corpo, titulo=None, sub=None, n=None, claro=False):
    cor = "var(--verde2)" if claro else "#fff"
    cor2 = "var(--laranja2)" if claro else "var(--laranja)"
    head = ""
    if titulo:
        head = (f'<div class="abs b" style="left:90px;top:60px;font-size:84px;color:{cor}">{titulo}</div>'
                f'<div class="abs" style="left:92px;top:150px;font-weight:600;font-size:28px;color:{cor2}">{sub}</div>'
                f'<div class="abs b" style="right:90px;top:62px;font-size:56px;color:{cor2}">{n:02d}</div>'
                f'<div class="abs" style="right:90px;top:132px;font-weight:700;font-size:17px;letter-spacing:4px;color:{cor};opacity:.6">MULTAGRO · PROPOSTA</div>'
                f'<div class="abs" style="left:90px;right:90px;top:204px;height:3px;background:{cor2};opacity:.45"></div>')
    return f'<div data-shot="{nome}" style="position:relative;width:1920px;height:1080px;overflow:hidden;background:{bg}">{head}{corpo}</div>'


def img(src, w, h=None, r=18, extra=""):
    hh = f"height:{h}px;object-fit:cover;object-position:top;" if h else ""
    return f'<img src="{src}" style="width:{w}px;{hh}border-radius:{r}px;box-shadow:0 18px 44px rgba(0,0,0,.3);{extra}">'


CR = '''<div style="display:inline-flex;align-items:center;gap:18px"><div style="width:74px;height:74px;border-radius:18px;background:#FF6A13">
  <svg viewBox="0 0 100 100" style="width:74px;height:74px"><path d="M58 12 26 56h22l-8 32 34-46H52z" fill="#fff"/></svg></div>
  <div style="text-align:left;font-family:Mont;font-weight:900;font-style:italic;font-size:34px;line-height:1"><span style="color:#fff">CRIATIVOS</span><br><span style="color:#FF6A13">RÁPIDOS</span></div></div>'''

# 01 capa
pages.append(pg("pr_01_capa.jpg", VERDE, f'''<div class="textura"></div>
  <div class="abs w100 c" style="top:70px">{logo(560, "badge")}</div>
  <div class="abs w100 c b" style="top:660px;font-size:110px;color:#fff">PROPOSTA DE MARKETING</div>
  <div class="abs w100 c" style="top:790px;font-weight:600;font-size:30px;color:var(--creme)">Logo recriada · vídeo de anúncio · carrosséis · posts · reels · stories</div>
  <div class="abs w100 c" style="top:880px;font-weight:700;font-size:20px;letter-spacing:6px;color:var(--laranja)">PREPARADO POR</div>
  <div class="abs w100 c" style="top:920px">{CR}</div>'''))


# 02 o que vimos
def ponto(cor, titulo, txt):
    return (f'<div style="display:flex;gap:18px;margin-bottom:24px"><div style="flex:none;width:18px;height:18px;border-radius:50%;background:{cor};margin-top:11px"></div>'
            f'<div><div style="font-weight:700;font-size:28px;color:var(--tinta)">{titulo}</div><div style="font-weight:500;font-size:22px;color:var(--cinza);margin-top:4px;line-height:1.4">{txt}</div></div></div>')


pages.append(pg("pr_02_diagnostico.jpg", CREME, f'''
  <div class="abs" style="left:90px;top:250px;display:flex;gap:22px">{img("../assets/insta_perfil.png", 250)}{img("../assets/insta_feed.png", 250)}{img("../assets/story_endereco.png", 250)}</div>
  <div class="abs" style="left:950px;top:250px;width:880px">
    {ponto("var(--laranja2)", "Cada post com uma cara", "Fontes, cores e estilos mudam a cada publicação. Falta um padrão que faça a MultAgro ser reconhecida de longe.")}
    {ponto("var(--laranja2)", "Contatos diferentes nas artes", "Aparecem (61) 2099-6668, (61) 99307-8394 e (61) 99921-5361. Quem vê não sabe qual chamar.")}
    {ponto("var(--laranja2)", "Logo usada em baixa qualidade", "Recortada e pixelada em várias peças. Recriamos em vetor, igual à original.")}
    {ponto("var(--verde)", "O que já funciona", "Vídeos na loja com a apresentadora, dicas de cuidado e muita variedade: pet, campo, jardim e piscina.")}
    {ponto("var(--verde)", "Oportunidade", "408 seguidores para uma loja tão completa na W3 Sul: com anúncio e constância, dá para crescer rápido no bairro.")}
  </div>''', "O Que Vimos Hoje", "Instagram @multagro.oficial", 1, claro=True))

# 03 logo recriada
cores = [("VERDE", "#2E8B3E", "#fff"), ("VERDE ESCURO", "#1E6F38", "#fff"), ("LARANJA", "#F2A531", "#14472A"), ("CREME", "#F4F1E6", "#14472A"), ("TERRA", "#5B3A1E", "#fff")]
paleta = "".join(f'<div style="width:170px;height:150px;border-radius:20px;background:{c};color:{t};padding:18px;box-shadow:0 10px 26px rgba(0,0,0,.12)">'
                 f'<div style="font-weight:700;font-size:15px;letter-spacing:2px">{n}</div><div style="margin-top:72px;font-weight:600;font-size:18px;opacity:.85">{c}</div></div>' for n, c, t in cores)
pages.append(pg("pr_03_logo.jpg", "#fff", f'''
  <div class="abs" style="left:90px;top:250px;width:520px;height:470px;border-radius:30px;background:{CREME};text-align:center;overflow:hidden">
    <div style="margin-top:22px;font-weight:700;font-size:18px;letter-spacing:4px;color:var(--cinza)">COMO ESTÁ (FOTO DO CELULAR)</div>
    <img src="../assets/logo_foto.jpg" style="width:420px;height:380px;object-fit:cover;object-position:50% 52%;margin-top:18px;border-radius:18px"></div>
  <div class="abs b" style="left:632px;top:420px;font-size:90px;color:var(--laranja2)">→</div>
  <div class="abs" style="left:730px;top:250px;width:1100px;height:470px;border-radius:30px;background:{CREME};text-align:center">
    <div style="margin-top:22px;font-weight:700;font-size:18px;letter-spacing:4px;color:var(--verde2)">RECRIADA EM VETOR · MESMA LOGO, NITIDEZ EM QUALQUER TAMANHO</div>
    <div style="display:flex;justify-content:center;align-items:center;gap:26px;margin-top:22px">
      <div>{logo(420, "cor")}</div>
      <div style="width:250px;height:250px;border-radius:24px;background:var(--verde2);display:flex;align-items:center;justify-content:center">{logo(220, "negativo")}</div>
      <div style="width:250px;height:250px;border-radius:24px;background:#3A7BD5;display:flex;align-items:center;justify-content:center">{logo(220, "branco")}</div></div></div>
  <div class="abs" style="left:90px;top:760px;display:flex;gap:20px">{paleta}</div>
  <div class="abs" style="left:1060px;top:760px;width:770px;height:150px;border-radius:20px;background:{CREME};padding:20px 28px">
    <div class="b" style="font-size:54px;color:var(--verde2)">Baloo · <span style="color:var(--laranja2)">Inter</span></div>
    <div style="font-weight:600;font-size:20px;color:var(--cinza);margin-top:8px">Títulos arredondados no mesmo estilo da logo; textos em Inter, fáceis de ler no celular.</div></div>
  <div class="abs" style="left:90px;top:950px;width:1740px;font-weight:600;font-size:22px;color:var(--cinza)">
    Arquivos entregues: <b style="color:var(--tinta)">SVG (vetor) e PNG transparente</b> nas versões colorida, selo, negativa e branca, prontos para fachada, sacola, adesivo e redes.</div>''',
                "Logo Recriada", "A mesma logo da MultAgro, agora em vetor e alta qualidade", 2, claro=True))

# 04 vídeo
quadros = "".join(img(f"../frames/f_{int(t * 30):05d}.jpg", 232, r=16) for t in (1.3, 7.1, 10.0, 14.3, 18.6, 23.4, 29.5))
pages.append(pg("pr_04_video.jpg", VERDE, f'''<div class="textura"></div>
  <div class="abs" style="left:90px;top:262px;display:flex;gap:22px">{quadros}</div>
  <div class="abs" style="left:90px;top:720px;display:grid;grid-template-columns:1fr 1fr;gap:16px 80px;font-weight:600;font-size:28px;color:#fff;width:1740px">
    <div><b style="color:var(--laranja)">●</b> Gancho: “Atenção, Brasília!”</div><div><b style="color:var(--laranja)">●</b> Todos os bichos e a horta, um por um</div>
    <div><b style="color:var(--laranja)">●</b> Ração, antipulgas, vermífugos, jardim e piscina</div><div><b style="color:var(--laranja)">●</b> Endereço, horário e WhatsApp com a logo</div></div>
  <div class="abs" style="left:90px;top:900px;font-weight:600;font-size:22px;color:var(--creme)">Arquivo enviado junto: multagro_anuncio_30s.mp4 · locução feminina profissional · 30 s · 1080x1920 · pronto para anúncio</div>''',
                "O Vídeo de Anúncio", "Reels / anúncio de 30 segundos, já pronto para rodar", 3))

# 05 exemplos no Instagram
post = f'''<div style="width:430px;height:430px;border-radius:20px;overflow:hidden;position:relative;background:{VERDE};box-shadow:0 18px 44px rgba(0,0,0,.3)">
  <div class="b" style="position:absolute;left:34px;top:40px;font-size:64px;color:#fff">Seu pet com<br><span style="color:var(--laranja)">pulga?</span></div>
  <div style="position:absolute;right:16px;top:150px">{ic("i-cao", 170)}</div>
  <div style="position:absolute;left:34px;bottom:110px;background:var(--laranja);color:var(--verde3);font-weight:700;font-size:22px;padding:12px 20px;border-radius:30px">Arraste para o lado →</div>
  <div style="position:absolute;left:28px;bottom:16px">{logo(120, "negativo")}</div></div>'''
post2 = f'''<div style="width:430px;height:430px;border-radius:20px;overflow:hidden;position:relative;background:{CREME};box-shadow:0 18px 44px rgba(0,0,0,.3)">
  <div style="position:absolute;left:34px;top:36px;font-weight:700;font-size:20px;letter-spacing:3px;color:var(--laranja2)">DICA DO CAMPO</div>
  <div class="b" style="position:absolute;left:34px;top:76px;font-size:58px;color:var(--verde2)">Vermifugação<br>do gado em<br>3 passos</div>
  <div style="position:absolute;left:34px;top:290px;display:flex;gap:12px">{"".join(f'<div class="b" style="width:80px;height:80px;border-radius:20px;background:var(--verde);color:#fff;font-size:46px;display:flex;align-items:center;justify-content:center;padding-top:8px">{k}</div>' for k in "123")}</div>
  <div style="position:absolute;right:14px;bottom:20px">{ic("i-boi", 112)}</div></div>'''
story = f'''<div style="width:290px;height:516px;border-radius:24px;overflow:hidden;position:relative;background:{VERDE};box-shadow:0 18px 44px rgba(0,0,0,.3);text-align:center">
  <div class="b" style="margin-top:50px;font-size:44px;color:#fff">CHEGOU<br><span style="color:var(--laranja)">NOVIDADE!</span></div>
  <div style="margin-top:20px">{ic("i-racao", 170)}</div>
  <div style="margin:18px auto 0;width:220px;background:#25D366;border-radius:30px;padding:14px;font-weight:700;font-size:19px;color:#fff">Chama no WhatsApp</div>
  <div style="position:absolute;left:0;right:0;bottom:20px">{logo(110, "negativo")}</div></div>'''
perfil = f'''<div style="text-align:center"><div style="width:230px;height:230px;border-radius:50%;background:{CREME};display:flex;align-items:center;justify-content:center;box-shadow:0 18px 44px rgba(0,0,0,.3)">{logo(200, "cor")}</div>
  <div style="margin-top:18px;font-weight:700;font-size:24px;color:#fff">@multagro.oficial</div>
  <div style="margin-top:20px;display:flex;gap:12px;justify-content:center">{"".join(f'<div style="width:64px;height:64px;border-radius:50%;background:var(--creme);border:4px solid var(--laranja);display:flex;align-items:center;justify-content:center">{ic(k, 42)}</div>' for k in ("i-cao", "i-boi", "i-horta", "i-pin"))}</div></div>'''
pages.append(pg("pr_05_instagram.jpg", VERDE, f'''<div class="textura"></div>
  <div class="abs" style="left:90px;top:290px;display:flex;gap:44px;align-items:flex-start">{perfil}{post}{post2}{story}</div>
  <div class="abs" style="left:90px;top:900px;font-weight:600;font-size:24px;color:var(--creme)">Perfil e destaques por categoria · carrossel com a dor do cliente · dica do campo · story de novidade com WhatsApp</div>''',
                "A Marca no Instagram", "Exemplos de como o feed fica com padrão e a logo nova", 4))

# 06 pacotes
pac = [("LARGADA", "247", ["1 anúncio", "3 carrosséis", "3 posts", "1 reels com locução", "3 stories"], False),
       ("ACELERA", "497", ["Identidade visual", "3 anúncios", "6 carrosséis", "9 posts", "3 reels com locução", "6 stories"], True),
       ("TURBO", "997", ["Página de vendas", "Identidade visual", "6 anúncios", "9 carrosséis", "12 posts", "6 reels com locução", "12 stories"], False)]
cards = ""
for nome, preco, itens, hl in pac:
    li = "".join(f'<div style="display:flex;align-items:center;gap:14px;margin:14px 0;font-weight:600;font-size:30px;color:var(--tinta)">'
                 f'<span style="flex:none;width:28px;height:28px;border-radius:50%;background:var(--verde);color:#fff;font-size:17px;font-weight:900;display:flex;align-items:center;justify-content:center">✓</span>{i}</div>' for i in itens)
    badge = ('<div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:var(--laranja);color:var(--verde3);font-weight:800;font-size:20px;'
             'letter-spacing:3px;padding:10px 26px;border-radius:30px;white-space:nowrap">MAIS ESCOLHIDO</div>') if hl else ""
    cards += (f'<div style="position:relative;width:520px;height:{700 if hl else 660}px;background:{"#fff" if hl else CREME};border-radius:34px;padding:44px;'
              f'border:{"6px solid var(--laranja)" if hl else "none"};box-shadow:0 24px 60px rgba(0,0,0,.35)">{badge}'
              f'<div class="b" style="text-align:center;font-size:60px;color:var(--verde2)">{nome}</div>'
              f'<div style="text-align:center;margin:4px 0 16px"><span style="font-weight:700;font-size:32px;color:var(--cinza);vertical-align:top;line-height:2.4">R$ </span>'
              f'<span class="b" style="font-size:124px;color:var(--tinta)">{preco}</span></div>{li}</div>')
pages.append(pg("pr_06_pacotes.jpg", VERDE, f'''<div class="textura"></div>
  <div class="abs w100 c b" style="top:62px;font-size:90px;color:#fff">ESCOLHA O SEU PACOTE</div>
  <div class="abs w100 c" style="top:170px;font-weight:600;font-size:26px;color:var(--creme)">Entregas na ordem: anúncios, carrosséis, posts, reels e stories</div>
  <div class="abs" style="left:0;right:0;top:270px;display:flex;justify-content:center;align-items:flex-end;gap:46px">{cards}</div>'''))

# 07 próximos passos
passos = [("1", "Escolhe o pacote", "Largada, Acelera ou Turbo"), ("2", "Manda fotos e novidades", "produtos, chegadas e promoções"),
          ("3", "Aprova os roteiros", "ajustamos o que precisar"), ("4", "Recebe tudo pronto", "é só postar e anunciar")]
ps = "".join(f'<div style="width:400px;height:290px;background:#fff;border-radius:30px;padding:36px;box-shadow:0 18px 40px rgba(0,0,0,.1)">'
             f'<div class="b" style="width:84px;height:84px;border-radius:50%;background:var(--laranja);color:var(--verde3);font-size:54px;display:flex;align-items:center;justify-content:center;padding-top:8px">{a}</div>'
             f'<div style="margin-top:30px;font-weight:700;font-size:31px;color:var(--tinta)">{b}</div><div style="margin-top:8px;font-weight:500;font-size:23px;color:var(--cinza)">{c}</div></div>'
             for a, b, c in passos)
pages.append(pg("pr_07_proximos.jpg", CREME, f'''
  <div class="abs" style="left:90px;top:265px;display:flex;gap:40px">{ps}</div>
  <div class="abs" style="left:90px;right:90px;top:620px;height:360px;border-radius:30px;background:{VERDE};overflow:hidden"><div class="textura"></div>
    <div class="abs" style="left:80px;top:140px">{CR}</div>
    <div class="abs" style="left:650px;top:30px">{logo(300, "badge")}</div>
    <div class="abs b" style="left:1080px;top:110px;font-size:64px;color:#fff;line-height:1.05">Do pet ao campo,<br><span style="color:var(--laranja)">tudo num lugar só.</span></div></div>''',
                "Próximos Passos", "Simples: escolher, mandar as fotos e começar", 5, claro=True))

html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>MultAgro - proposta</title>
<link rel="stylesheet" href="base.css"></head><body>
{"".join(pages)}
<script src="brand.js"></script><script src="icones.js"></script>
<script>
document.body.insertAdjacentHTML("afterbegin", ICONES);
let k = 0;
document.querySelectorAll("[data-logo]").forEach(e => e.innerHTML = MULTAGRO.emblema(+e.dataset.w, e.dataset.logo, "p" + (k++)));
</script></body></html>'''
(ROOT / "proposta.html").write_text(html)
print(len(pages), "páginas")
