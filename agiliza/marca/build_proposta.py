#!/usr/bin/env python3
"""Gera marca/proposta.html (páginas 1920x1080) da proposta Agiliza Nota.
Exportar:  node marca/shot.js marca/proposta.html marca/saida/paginas  e depois  python3 marca/pdf.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NOITE = "radial-gradient(ellipse at 50% 30%,#14307A 0%,#0A1633 70%)"
AZUL = "linear-gradient(160deg,#1660F5 0%,#0B3FB8 60%,#0A1633 100%)"
GELO = "#F3F6FB"
pages = []


def logo(tipo, w, tema="claro", simb="cor"):
    return f'<span data-logo="{tipo}" data-w="{w}" data-tema="{tema}" data-simb="{simb}"></span>'


def pg(nome, bg, corpo, titulo=None, sub=None, n=None, claro=False):
    cor = "var(--noite)" if claro else "#fff"
    cor2 = "var(--azul)" if claro else "var(--verde)"
    head = ""
    if titulo:
        head = (f'<div class="abs disp" style="left:90px;top:66px;font-size:72px;color:{cor}">{titulo}</div>'
                f'<div class="abs" style="left:92px;top:150px;font-weight:600;font-size:28px;color:{cor2}">{sub}</div>'
                f'<div class="abs disp" style="right:90px;top:70px;font-size:46px;color:{cor2}">{n:02d}</div>'
                f'<div class="abs" style="right:90px;top:132px;font-weight:700;font-size:17px;letter-spacing:4px;color:{cor};opacity:.6">AGILIZA NOTA · PROPOSTA</div>'
                f'<div class="abs" style="left:90px;right:90px;top:204px;height:3px;background:{cor2};opacity:.4"></div>')
    return f'<div data-shot="{nome}" style="position:relative;width:1920px;height:1080px;overflow:hidden;background:{bg}">{head}{corpo}</div>'


def img(src, w, h=None, r=18, extra=""):
    hh = f"height:{h}px;object-fit:cover;object-position:top;" if h else ""
    return f'<img src="{src}" style="width:{w}px;{hh}border-radius:{r}px;box-shadow:0 18px 44px rgba(0,0,0,.35);{extra}">'


CR = '''<div style="display:inline-flex;align-items:center;gap:18px"><div style="width:74px;height:74px;border-radius:18px;background:#FF6A13">
  <svg viewBox="0 0 100 100" style="width:74px;height:74px"><path d="M58 12 26 56h22l-8 32 34-46H52z" fill="#fff"/></svg></div>
  <div style="text-align:left;font-family:Mont;font-weight:900;font-style:italic;font-size:34px;line-height:1"><span style="color:#fff">CRIATIVOS</span><br><span style="color:#FF6A13">RÁPIDOS</span></div></div>'''

# 01 capa
pages.append(pg("pr_01_capa.jpg", AZUL, f'''
  <div class="grid"></div>
  <div class="abs w100 c" style="top:210px">{logo("horizontal", 980, "escuro", "branco")}</div>
  <div class="abs w100 c disp" style="top:520px;font-size:104px;color:#fff">PROPOSTA DE MARKETING</div>
  <div class="abs w100 c" style="top:650px;font-weight:600;font-size:32px;color:#D4E0FF">Anúncios · carrosséis · posts · reels · stories · identidade visual · landing page</div>
  <div class="abs w100 c" style="top:790px;font-weight:700;font-size:20px;letter-spacing:6px;color:var(--verde)">PREPARADO POR</div>
  <div class="abs w100 c" style="top:830px">{CR}</div>'''))

# 02 diagnóstico
def ponto(cor, titulo, txt):
    return (f'<div style="display:flex;gap:18px;margin-bottom:26px"><div style="flex:none;width:16px;height:16px;border-radius:50%;background:{cor};margin-top:12px"></div>'
            f'<div><div style="font-weight:700;font-size:28px;color:var(--noite)">{titulo}</div><div style="font-weight:500;font-size:22px;color:var(--cinza);margin-top:4px;line-height:1.4">{txt}</div></div></div>')


pages.append(pg("pr_02_diagnostico.jpg", GELO, f'''
  <div class="abs" style="left:90px;top:250px;display:flex;gap:26px">{img("../assets/site_planos_1.png", 300)}{img("../assets/insta_atual.png", 300)}</div>
  <div class="abs" style="left:780px;top:250px;width:1050px">
    {ponto("var(--erro)", "Preços confusos no site", "Trimestral aparece como “R$ 139/mês” e anual como “R$ 529/mês”: parece mais caro do que o mensal, quando na verdade é mais barato.")}
    {ponto("var(--erro)", "Sem uma frase que venda", "Quem chega no site vê botões e preços antes de entender o benefício. Não há promessa, prova nem passo a passo.")}
    {ponto("var(--erro)", "Topo com 4 botões disputando atenção", "Entrar, Certificado, Cadastre-se e Baixe o App. O visitante não sabe por onde começar.")}
    {ponto("var(--verde)", "A dor funciona: 25,1 mil visualizações", "O reels “Passando raiva para emitir suas notas?” teve 50x mais alcance que os outros. O público responde à dor.")}
    {ponto("var(--azul)", "Oportunidade", "Padronizar a marca, transformar a dor em anúncios e levar o tráfego para uma página que converte.")}
  </div>''', "O Que Vimos Hoje", "Instagram @agilizanotaoficial e site agilizanota.com.br", 1, claro=True))

# 03 vídeo
quadros = "".join(img(f"../frames/f_{int(t * 30):05d}.jpg", 232, r=16) for t in (1.6, 4.4, 7.0, 10.6, 14.4, 19.6, 22.9))
pages.append(pg("pr_03_video.jpg", NOITE, f'''
  <div class="abs" style="left:90px;top:262px;display:flex;gap:22px">{quadros}</div>
  <div class="abs" style="left:90px;top:720px;display:grid;grid-template-columns:1fr 1fr;gap:18px 80px;font-weight:600;font-size:29px;color:#fff;width:1740px">
    <div><b style="color:var(--erro)">●</b> Gancho na dor: cliente cobrando a nota</div><div><b style="color:var(--erro)">●</b> Portal travado, senha, sistema fora do ar</div>
    <div><b style="color:var(--verde)">●</b> Virada: “Chega de passar raiva!”</div><div><b style="color:var(--verde)">●</b> App emitindo em segundos, R$ 49, 5 dias grátis</div></div>
  <div class="abs" style="left:90px;top:900px;font-weight:600;font-size:22px;color:#B8C6E6">Arquivo enviado junto: agiliza_nota_anuncio_30s.mp4 · locução masculina profissional · 30 s · 1080x1920 · pronto para anúncio</div>''',
                "O Vídeo de Anúncio", "Reels / anúncio de 30 segundos, já pronto para rodar", 2))

# 04 identidade: antes e depois + cores e letras
cores = [("AZUL AGILIZA", "#1660F5", "#fff"), ("AZUL NOITE", "#0A1633", "#fff"), ("CIANO", "#19C3FF", "#0A1633"),
         ("VERDE EMITIDA", "#22D38A", "#fff"), ("GELO", "#F3F6FB", "#0A1633")]
paleta = "".join(f'<div style="width:196px;height:200px;border-radius:22px;background:{c};color:{t};padding:22px;box-shadow:0 10px 30px rgba(10,22,51,.12)">'
                 f'<div style="font-weight:700;font-size:17px;letter-spacing:2px">{n}</div><div style="margin-top:98px;font-weight:600;font-size:20px;opacity:.85">{c}</div></div>'
                 for n, c, t in cores)
pages.append(pg("pr_04_identidade.jpg", "#fff", f'''
  <div class="abs" style="left:90px;top:260px;width:520px;height:330px;border-radius:30px;background:{GELO};text-align:center">
    <div style="margin-top:26px;font-weight:700;font-size:18px;letter-spacing:4px;color:var(--cinza)">HOJE</div>
    <div style="margin:22px auto 0;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle at 40% 30%,#3D8BFF,#0B3FB8);display:flex;align-items:center;justify-content:center">
      <svg viewBox="0 0 220 160" width="150"><path d="M58 140a40 40 0 0 1-6-79 58 58 0 0 1 110 8 38 38 0 0 1 2 71z" fill="none" stroke="#fff" stroke-width="12"/><text x="110" y="122" text-anchor="middle" font-family="Inter" font-weight="700" font-size="80" fill="#fff">a</text></svg></div></div>
  <div class="abs disp" style="left:640px;top:390px;font-size:80px;color:var(--azul)">→</div>
  <div class="abs" style="left:760px;top:260px;width:1070px;height:330px;border-radius:30px;background:var(--noite);text-align:center">
    <div style="margin-top:26px;font-weight:700;font-size:18px;letter-spacing:4px;color:var(--verde)">PRÉVIA REMODELADA</div>
    <div style="margin-top:36px">{logo("horizontal", 760, "escuro")}</div>
    <div style="margin-top:6px">{logo("slogan", 640, "escuro")}</div></div>
  <div class="abs" style="left:90px;top:640px;display:flex;gap:22px">{paleta}</div>
  <div class="abs" style="left:1240px;top:640px;width:590px;height:200px;border-radius:22px;background:{GELO};padding:24px 30px">
    <div class="disp" style="font-size:58px;color:var(--noite)">Inter Display</div>
    <div style="font-weight:600;font-size:22px;color:var(--cinza);margin-top:12px">Títulos fortes e modernos. Textos em Inter: leitura fácil no celular.</div></div>
  <div class="abs" style="left:90px;top:880px;width:1740px;font-weight:600;font-size:24px;color:var(--cinza);line-height:1.5">
    Mantivemos o que o cliente já reconhece (a nuvem, o “a” e o azul) e modernizamos: símbolo cheio, selo verde de <b style="color:var(--noite)">nota emitida</b>,
    tipografia nova e o slogan <b style="color:var(--azul)">“Nota fiscal sem dor de cabeça.”</b> Prévia para aprovação; a identidade completa vem no plano.</div>''',
                "Identidade Visual", "Prévia da remodelação: logo, slogan, cores e letras", 3, claro=True))

# 05 aplicações (perfil, post, story)
post = f'''<div style="width:440px;height:440px;border-radius:20px;overflow:hidden;position:relative;background:linear-gradient(160deg,#FF3B4E,#C81E33);box-shadow:0 18px 44px rgba(0,0,0,.35)">
  <div class="disp" style="position:absolute;left:34px;top:40px;font-size:62px;color:#fff;line-height:1">Passando<br>raiva para<br>emitir nota?</div>
  <div style="position:absolute;left:34px;bottom:110px;background:#fff;color:var(--noite);font-weight:700;font-size:22px;padding:12px 20px;border-radius:30px">Arraste para o lado →</div>
  <div style="position:absolute;left:34px;bottom:34px">{logo("horizontal", 220, "escuro", "branco")}</div></div>'''
post2 = f'''<div style="width:440px;height:440px;border-radius:20px;overflow:hidden;position:relative;background:{AZUL};box-shadow:0 18px 44px rgba(0,0,0,.35)">
  <div style="position:absolute;left:34px;top:40px;font-weight:700;font-size:20px;letter-spacing:3px;color:var(--verde)">PASSO A PASSO</div>
  <div class="disp" style="position:absolute;left:34px;top:84px;font-size:56px;color:#fff;line-height:1">Nota emitida<br>em 3 toques</div>
  <div style="position:absolute;left:34px;top:240px;display:flex;gap:12px">{"".join(f'<div class="disp" style="width:110px;height:110px;border-radius:24px;background:#fff;color:var(--azul);font-size:56px;display:flex;align-items:center;justify-content:center">{k}</div>' for k in "123")}</div>
  <div style="position:absolute;left:34px;bottom:34px">{logo("horizontal", 220, "escuro", "branco")}</div></div>'''
story = f'''<div style="width:300px;height:533px;border-radius:24px;overflow:hidden;position:relative;background:linear-gradient(170deg,#22D38A,#12A86B);box-shadow:0 18px 44px rgba(0,0,0,.35);text-align:center">
  <div class="disp" style="margin-top:60px;font-size:40px;color:var(--noite)">TESTE<br>GRÁTIS</div>
  <div style="margin:26px auto 0;width:170px;height:170px;border-radius:50%;background:var(--noite)"><div class="disp" style="font-size:100px;color:var(--verde);padding-top:18px">5</div><div class="disp" style="font-size:28px;color:#fff;margin-top:-6px">DIAS</div></div>
  <div style="margin:36px auto 0;width:220px;background:#fff;border-radius:30px;padding:14px;font-weight:700;font-size:19px;color:var(--noite)">Toque no link ↗</div>
  <div style="position:absolute;left:0;right:0;bottom:26px">{logo("horizontal", 180, "claro", "branco")}</div></div>'''
avatar = f'''<div style="text-align:center"><div style="width:240px;height:240px;border-radius:50%;background:{AZUL};display:flex;align-items:center;justify-content:center;box-shadow:0 18px 44px rgba(0,0,0,.3)">{logo("simbolo", 170, "branco")}</div>
  <div style="margin-top:20px;font-weight:700;font-size:24px;color:#fff">@agilizanotaoficial</div>
  <div style="margin-top:22px;display:flex;gap:14px;justify-content:center">{"".join(f'<div style="width:62px;height:62px;border-radius:50%;background:#fff;border:4px solid var(--verde);display:flex;align-items:center;justify-content:center;font-family:Inter Display;font-weight:900;font-size:24px;color:var(--azul)">{k}</div>' for k in ("R$", "?", "▶"))}</div></div>'''
pages.append(pg("pr_05_aplicacoes.jpg", NOITE, f'''
  <div class="abs" style="left:90px;top:300px;display:flex;gap:44px;align-items:flex-start">{avatar}{post}{post2}{story}</div>
  <div class="abs" style="left:90px;top:900px;font-weight:600;font-size:24px;color:#B8C6E6">Perfil e destaques · carrossel na dor · post educativo · story com chamada para o teste grátis</div>''',
                "A Marca no Instagram", "Exemplos de como o feed fica com a identidade nova", 4))

# 06 landing page
pages.append(pg("pr_06_landing.jpg", GELO, f'''
  <div class="abs" style="left:90px;top:250px;width:1180px;height:760px;border-radius:24px;overflow:hidden;background:#fff;box-shadow:0 24px 60px rgba(10,22,51,.2)">
    <div style="height:44px;background:#E6EAF0;display:flex;align-items:center;gap:10px;padding:0 18px"><i style="width:14px;height:14px;border-radius:50%;background:#FF5F57"></i><i style="width:14px;height:14px;border-radius:50%;background:#FEBC2E"></i><i style="width:14px;height:14px;border-radius:50%;background:#28C840"></i>
      <div style="margin-left:16px;flex:1;height:28px;border-radius:14px;background:#fff;font-size:15px;color:#8592A6;padding:5px 16px">agilizanota.com.br</div></div>
    <img src="../landing/saida/lp_desktop.jpg" style="width:1180px;display:block"></div>
  <div class="abs" style="left:1330px;top:250px;width:300px;height:620px;border-radius:40px;background:#0B0F1A;padding:10px;box-shadow:0 24px 60px rgba(10,22,51,.3)">
    <div style="width:100%;height:100%;border-radius:32px;overflow:hidden"><img src="../landing/saida/lp_celular.jpg" style="width:280px;display:block"></div></div>
  <div class="abs" style="left:1330px;top:900px;width:500px;font-weight:600;font-size:21px;color:var(--cinza);line-height:1.45">
    Frase que vende no topo, um botão principal (teste grátis), dor x solução, 3 passos, recursos, <b style="color:var(--noite)">preços por mês corrigidos</b>, dúvidas e WhatsApp.</div>''',
                "Landing Page de Vendas", "Exemplo de como fica o site remodelado (computador e celular)", 5, claro=True))

# 07 planos
pac = [("LARGADA", "247", ["Identidade visual remodelada", "2 anúncios", "2 carrosséis", "4 posts", "2 reels com locução", "4 stories", "Roteiros e legendas"], False),
       ("ACELERA", "497", ["Identidade visual + manual da marca", "4 anúncios (teste A/B)", "4 carrosséis", "8 posts", "4 reels com locução", "8 stories", "Roteiros, legendas e calendário"], True),
       ("TURBO", "997", ["Landing page de vendas", "Identidade visual + manual da marca", "6 anúncios (teste A/B)", "6 carrosséis", "12 posts", "6 reels com locução", "12 stories", "Prioridade + relatório mensal"], False)]
cards = ""
for nome, preco, itens, hl in pac:
    li = "".join(f'<div style="display:flex;align-items:center;gap:14px;margin:13px 0;font-weight:600;font-size:26px;color:var(--noite)">'
                 f'<span style="flex:none;width:26px;height:26px;border-radius:50%;background:var(--verde);color:#fff;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center">✓</span>{i}</div>' for i in itens)
    badge = ('<div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:var(--verde);color:#fff;font-weight:800;font-size:20px;'
             'letter-spacing:3px;padding:10px 26px;border-radius:30px;white-space:nowrap">MAIS ESCOLHIDO</div>') if hl else ""
    cards += (f'<div style="position:relative;width:520px;height:{720 if hl else 680}px;background:{"#fff" if hl else GELO};border-radius:34px;padding:44px 44px;'
              f'border:{"6px solid var(--verde)" if hl else "none"};box-shadow:0 24px 60px rgba(0,0,0,.35)">{badge}'
              f'<div class="disp" style="text-align:center;font-size:54px;color:var(--azul);letter-spacing:.02em">{nome}</div>'
              f'<div style="text-align:center;margin:6px 0 18px"><span style="font-weight:700;font-size:32px;color:var(--cinza);vertical-align:top;line-height:2.4">R$ </span>'
              f'<span class="disp" style="font-size:118px;color:var(--noite)">{preco}</span><span style="font-weight:700;font-size:28px;color:var(--cinza)">/mês</span></div>{li}</div>')
pages.append(pg("pr_07_planos.jpg", NOITE, f'''
  <div class="abs w100 c disp" style="top:70px;font-size:78px;color:#fff">ESCOLHA O SEU PLANO</div>
  <div class="abs w100 c" style="top:170px;font-weight:600;font-size:26px;color:#B8C6E6">Entregas por mês, nesta ordem de prioridade: anúncios, carrosséis, posts, reels e stories</div>
  <div class="abs" style="left:0;right:0;top:265px;display:flex;justify-content:center;align-items:flex-end;gap:46px">{cards}</div>'''))

# 08 próximos passos
passos = [("1", "Escolhe o plano", "Largada, Acelera ou Turbo"), ("2", "Aprova a identidade", "ajustamos a prévia com você"),
          ("3", "Liga os anúncios", "o vídeo já está pronto"), ("4", "Recebe tudo no mês", "é só aprovar e postar")]
ps = "".join(f'<div style="width:400px;height:290px;background:#fff;border-radius:30px;padding:36px;box-shadow:0 18px 40px rgba(10,22,51,.12)">'
             f'<div class="disp" style="width:80px;height:80px;border-radius:22px;background:var(--azul);color:#fff;font-size:46px;display:flex;align-items:center;justify-content:center">{a}</div>'
             f'<div style="margin-top:30px;font-weight:700;font-size:31px;color:var(--noite)">{b}</div><div style="margin-top:8px;font-weight:500;font-size:23px;color:var(--cinza)">{c}</div></div>'
             for a, b, c in passos)
pages.append(pg("pr_08_proximos.jpg", GELO, f'''
  <div class="abs" style="left:90px;top:265px;display:flex;gap:40px">{ps}</div>
  <div class="abs" style="left:90px;right:90px;top:640px;height:330px;border-radius:30px;background:var(--noite);overflow:hidden">
    <div class="abs" style="left:80px;top:124px">{CR}</div>
    <div class="abs" style="left:560px;top:84px">{logo("horizontal", 720, "escuro")}</div>
    <div class="abs" style="left:620px;top:250px">{logo("slogan", 640, "escuro")}</div></div>''',
                "Próximos Passos", "Simples: escolher, aprovar e começar a vender mais", 6, claro=True))

html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Agiliza Nota - proposta</title>
<link rel="stylesheet" href="base.css">
<style>@font-face {{ font-family: Mont; font-weight: 900; src: url(../fonts/montserrat-latin-900-normal.woff); }}
.grid {{ position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.06) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.06) 2px,transparent 2px); background-size:80px 80px; }}</style>
</head><body>
{"".join(pages)}
<script src="brand.js"></script>
<script>
let k = 0;
document.querySelectorAll("[data-logo]").forEach(e => {{
  const w = +e.dataset.w, t = e.dataset.tema, s = e.dataset.simb;
  e.innerHTML = e.dataset.logo === "simbolo" ? AGILIZA.simbolo(w, t, "p" + (k++)) : e.dataset.logo === "slogan" ? AGILIZA.slogan(w, t) : AGILIZA.horizontal(w, t, s);
}});
</script></body></html>'''
(ROOT / "proposta.html").write_text(html)
print(len(pages), "páginas")
