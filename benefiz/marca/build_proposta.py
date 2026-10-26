#!/usr/bin/env python3
"""Proposta Benefiz (páginas 1920x1080). Identidade do cliente mantida; foco em anúncios e conteúdo.
Exportar: node marca/shot.js marca/proposta.html marca/saida/paginas  e  python3 marca/pdf.py"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEAL = "linear-gradient(160deg,#3E7C7E,#2F6365)"
LAR = "linear-gradient(160deg,#F39A55,#E07A35)"
CREME = "#F7F4EF"
P = "../pecas/"
pages = []


def logo(w, tema="claro"):
    return f'<span data-logo="{tema}" data-w="{w}"></span>'


def pg(nome, bg, corpo, titulo=None, sub=None, n=None, claro=False):
    cor = "var(--teal)" if claro else "#fff"
    cor2 = "var(--laranja)" if claro else ("#fff" if "F39A55" in bg else "var(--laranja)")
    head = ""
    if titulo:
        head = (f'<div class="abs h" style="left:90px;top:62px;font-size:76px;color:{cor}">{titulo}</div>'
                f'<div class="abs" style="left:92px;top:152px;font-weight:600;font-size:28px;color:{cor2}">{sub}</div>'
                f'<div class="abs h" style="right:90px;top:66px;font-size:52px;color:{cor2}">{n:02d}</div>'
                f'<div class="abs" style="right:90px;top:132px;font-weight:700;font-size:17px;letter-spacing:4px;color:{cor};opacity:.6">BENEFIZ · PROPOSTA</div>'
                f'<div class="abs" style="left:90px;right:90px;top:204px;height:3px;background:{cor2};opacity:.45"></div>')
    return f'<div data-shot="{nome}" style="position:relative;width:1920px;height:1080px;overflow:hidden;background:{bg}">{head}{corpo}</div>'


def img(src, w, h=None, r=16, extra=""):
    hh = f"height:{h}px;object-fit:cover;object-position:top;" if h else ""
    return f'<img src="{src}" style="width:{w}px;{hh}border-radius:{r}px;box-shadow:0 18px 44px rgba(0,0,0,.25);{extra}">'


CR = '''<div style="display:inline-flex;align-items:center;gap:18px"><div style="width:74px;height:74px;border-radius:18px;background:#FF6A13">
  <svg viewBox="0 0 100 100" style="width:74px;height:74px"><path d="M58 12 26 56h22l-8 32 34-46H52z" fill="#fff"/></svg></div>
  <div style="text-align:left;font-family:Mont;font-weight:900;font-style:italic;font-size:34px;line-height:1"><span style="color:#fff">CRIATIVOS</span><br><span style="color:#1F3A3B">RÁPIDOS</span></div></div>'''

# 01 capa
pages.append(pg("pr_01_capa.jpg", LAR, f'''
  <div class="abs w100 c" style="top:170px">{logo(820, "branco")}</div>
  <div class="abs w100 c h" style="top:520px;font-size:104px;color:#fff">PROPOSTA DE ANÚNCIOS E CONTEÚDO</div>
  <div class="abs w100 c" style="top:650px;font-weight:600;font-size:32px;color:#FFF3E8">Anúncios · carrosséis · posts · reels com locução · stories</div>
  <div class="abs w100 c" style="top:790px;font-weight:700;font-size:20px;letter-spacing:6px;color:#fff">PREPARADO POR</div>
  <div class="abs w100 c" style="top:830px">{CR}</div>'''))


# 02 o que vimos
def ponto(cor, titulo, txt):
    return (f'<div style="display:flex;gap:18px;margin-bottom:24px"><div style="flex:none;width:18px;height:18px;border-radius:50%;background:{cor};margin-top:11px"></div>'
            f'<div><div style="font-weight:700;font-size:29px;color:var(--tinta)">{titulo}</div><div style="font-weight:500;font-size:22px;color:var(--cinza);margin-top:4px;line-height:1.4">{txt}</div></div></div>')


pages.append(pg("pr_02_diagnostico.jpg", CREME, f'''
  <div class="abs" style="left:90px;top:250px;display:flex;gap:22px">{img("../assets/ref_11.png", 250)}{img("../assets/ref_10.png", 250)}{img("../assets/ref_07.png", 250)}</div>
  <div class="abs" style="left:950px;top:250px;width:880px">
    {ponto("var(--teal)", "Marca forte e consistente: fica como está", "Laranja, verde-petróleo, a mãozinha e o padrão já são reconhecidos. Não mexemos na identidade: criamos tudo dentro dela.")}
    {ponto("var(--teal)", "O que já funciona", "Vídeos com empresários reais (padarias de Brasília) e a mensagem “a guerra agora é por funcionários”.")}
    {ponto("var(--laranja)", "Oportunidade: anúncio falando com o dono e o RH", "Transformar a dor da rotatividade em anúncios e reels com locução que levam direto para o WhatsApp.")}
    {ponto("var(--laranja)", "Destaques e stories parados desde 2024", "Benefícios e parceiros merecem conteúdo novo e frequente: carrosséis e stories que mostram o valor na prática.")}
  </div>''', "O Que Vimos Hoje", "Instagram @benefiz.br · 3.501 seguidores · 687 posts", 1, claro=True))

# 03 exemplos: anúncio, post, story e reels
quadros = "".join(img(f"../frames_v3/f_{int(t * 30):05d}.jpg", 150, r=12) for t in (1.5, 4.6, 12.4, 18.9, 22.7, 25.8, 29.5))
pages.append(pg("pr_03_exemplos.jpg", TEAL, f'''
  <div class="abs" style="left:90px;top:250px;text-align:center">{img(P + "anuncio_01.jpg", 330)}<div style="margin-top:14px;font-weight:700;font-size:24px;color:#fff">ANÚNCIO</div></div>
  <div class="abs" style="left:460px;top:250px;text-align:center">{img(P + "post_01.jpg", 330)}<div style="margin-top:14px;font-weight:700;font-size:24px;color:#fff">POST</div></div>
  <div class="abs" style="left:830px;top:250px;text-align:center">{img(P + "story_01.jpg", 260)}<div style="margin-top:14px;font-weight:700;font-size:24px;color:#fff">STORY</div></div>
  <div class="abs" style="left:1130px;top:250px;width:700px">
    <div style="display:flex;gap:10px;flex-wrap:wrap">{quadros}</div>
    <div style="margin-top:16px;font-weight:700;font-size:24px;color:#fff">REELS / ANÚNCIO EM VÍDEO · 30 s</div>
    <div style="margin-top:10px;font-weight:500;font-size:21px;color:#D3E7E7;line-height:1.4">“Empresário, atenção!” → dor (o melhor funcionário pediu as contas) → “mas calma”: os 4 pilares → “parece mentira, mas não é”: a partir de R$ 209,90 → WhatsApp.</div></div>''',
                "Exemplos de Cada Peça", "Feitos dentro da identidade Benefiz", 2))

# 04 carrossel
slides = "".join(img(P + n, 330, r=14) for n in ("carrossel_01_capa.jpg", "carrossel_02.jpg", "carrossel_03.jpg", "carrossel_04.jpg", "carrossel_05_cta.jpg"))
pages.append(pg("pr_04_carrossel.jpg", CREME, f'''
  <div class="abs" style="left:90px;top:280px;display:flex;gap:22px">{slides}</div>
  <div class="abs" style="left:90px;top:780px;width:1740px;font-weight:600;font-size:26px;color:var(--tinta);line-height:1.5">
    Carrossel de conteúdo: <b style="color:var(--teal)">“Seu melhor funcionário pode estar olhando outras vagas agora.”</b><br>
    Capa com gancho → “Salário atrai, benefício segura” → os 4 pilares → o que a empresa ganha → prova social e WhatsApp.</div>''',
                "Carrossel de Exemplo", "5 telas para quem decide: dono e RH", 3, claro=True))

# 05 pacotes (avulsos) e 06 planos (mensais)
def cartoes(lista, alto, fs=30, sufixo=""):
    out = ""
    for nome, preco, resumo, itens, hl in lista:
        li = "".join(f'<div style="display:flex;align-items:center;gap:14px;margin:{14 if fs < 30 else 13}px 0;font-weight:600;font-size:{fs}px;color:var(--tinta)">'
                     f'<span style="flex:none;width:28px;height:28px;border-radius:50%;background:var(--laranja);color:#fff;font-size:17px;font-weight:900;display:flex;align-items:center;justify-content:center">✓</span>{i}</div>' for i in itens)
        badge = ('<div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:var(--laranja);color:#fff;font-weight:800;font-size:20px;'
                 'letter-spacing:3px;padding:10px 26px;border-radius:30px;white-space:nowrap">MAIS ESCOLHIDO</div>') if hl else ""
        out += (f'<div style="position:relative;width:540px;height:{alto + 40 if hl else alto}px;background:{"#fff" if hl else CREME};border-radius:34px;padding:38px 46px;'
                f'border:{"6px solid var(--laranja)" if hl else "none"};box-shadow:0 24px 60px rgba(0,0,0,.3)">{badge}'
                f'<div class="h" style="text-align:center;font-size:54px;color:var(--teal)">{nome}</div>'
                f'<div style="text-align:center;margin:4px 0 0"><span style="font-weight:700;font-size:30px;color:var(--cinza);vertical-align:top;line-height:2.3">R$ </span>'
                f'<span class="h" style="font-size:110px;color:var(--tinta)">{preco}</span><span style="font-weight:700;font-size:28px;color:var(--cinza)">{sufixo}</span></div>'
                f'<div style="text-align:center;font-weight:700;font-size:25px;color:var(--laranja);margin-bottom:10px">{resumo}</div>{li}</div>')
    return out


pac = [("LARGADA", "247", "1 de cada · entrega única", ["1 anúncio", "1 carrossel", "1 post", "1 reels com locução", "1 story"], False),
       ("ACELERA", "497", "3 de cada · entrega única", ["3 anúncios", "3 carrosséis", "3 posts", "3 reels com locução", "3 stories"], True),
       ("TURBO", "997", "6 de cada · entrega única", ["6 anúncios", "6 carrosséis", "6 posts", "6 reels com locução", "6 stories"], False)]
pages.append(pg("pr_05_pacotes.jpg", TEAL, f'''
  <div class="abs w100 c h" style="top:58px;font-size:86px;color:#fff">PACOTES</div>
  <div class="abs w100 c" style="top:162px;font-weight:600;font-size:27px;color:#D3E7E7">Entrega única, sem mensalidade: ideal para testar, lançar uma campanha ou abastecer o perfil</div>
  <div class="abs" style="left:0;right:0;top:270px;display:flex;justify-content:center;align-items:flex-end;gap:40px">{cartoes(pac, 640)}</div>'''))

planos = [("PRESENÇA", "1.247", "16 publicações no feed · 4 por semana",
           ["2 anúncios em vídeo", "8 carrosséis", "4 posts", "4 reels com locução", "20 stories (5 por semana)", "Programação e postagem"], False),
          ("CRESCIMENTO", "1.497", "24 publicações no feed · 6 por semana",
           ["3 anúncios em vídeo", "10 carrosséis", "6 posts", "8 reels com locução", "30 stories (1 por dia)", "Programação e postagem"], True),
          ("AUTORIDADE", "1.997", "30 publicações · post todo dia",
           ["4 anúncios em vídeo", "12 carrosséis", "6 posts", "12 reels (4 com avatar IA do dono)", "60 stories (2 por dia)", "Postagem + relatório mensal"], False)]
pages.append(pg("pr_06_planos.jpg", LAR, f'''
  <div class="abs w100 c h" style="top:50px;font-size:86px;color:#fff">PLANOS MENSAIS</div>
  <div class="abs w100 c" style="top:152px;font-weight:600;font-size:27px;color:#FFF3E8">Social media completo: a gente cria, programa e posta. Você só aprova.</div>
  <div class="abs" style="left:0;right:0;top:250px;display:flex;justify-content:center;align-items:flex-end;gap:40px">{cartoes(planos, 690, fs=29, sufixo="/mês")}</div>
  <div class="abs w100 c" style="top:1010px;font-weight:600;font-size:21px;color:#FFF3E8">Não inclui resposta de mensagens/direct nem gestão de tráfego (a verba dos anúncios é investida direto pela empresa). Adicional: atendente com IA no WhatsApp e Direct, sob consulta.</div>'''))

# 07 próximos passos
passos = [("1", "Escolhe pacote ou plano", "avulso para testar, mensal para crescer"), ("2", "Alinhamos a mensagem", "público, ofertas e parceiros em destaque"),
          ("3", "Aprova os roteiros", "ajustamos o que precisar"), ("4", "Recebe tudo pronto", "para anunciar e postar")]
ps = "".join(f'<div style="width:400px;height:290px;background:#fff;border-radius:30px;padding:36px;box-shadow:0 18px 40px rgba(31,58,59,.1)">'
             f'<div class="h" style="width:84px;height:84px;border-radius:24px;background:var(--laranja);color:#fff;font-size:50px;display:flex;align-items:center;justify-content:center">{a}</div>'
             f'<div style="margin-top:30px;font-weight:700;font-size:31px;color:var(--tinta)">{b}</div><div style="margin-top:8px;font-weight:500;font-size:23px;color:var(--cinza)">{c}</div></div>'
             for a, b, c in passos)
pages.append(pg("pr_07_proximos.jpg", CREME, f'''
  <div class="abs" style="left:90px;top:265px;display:flex;gap:40px">{ps}</div>
  <div class="abs" style="left:90px;right:90px;top:640px;height:330px;border-radius:30px;background:{LAR};overflow:hidden">
    <div class="abs" style="left:80px;top:128px">{CR}</div>
    <div class="abs" style="left:640px;top:70px">{logo(640, "branco")}</div></div>''',
                "Próximos Passos", "Simples: escolher, aprovar e começar a anunciar", 5, claro=True))

html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Benefiz - proposta</title>
<link rel="stylesheet" href="base.css"></head><body>
{"".join(pages)}
<script src="brand.js"></script>
<script>document.querySelectorAll("[data-logo]").forEach(e => e.innerHTML = BENEFIZ.logo(+e.dataset.w, e.dataset.logo));</script>
</body></html>'''
(ROOT / "proposta.html").write_text(html)
print(len(pages), "páginas")
