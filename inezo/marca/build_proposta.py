#!/usr/bin/env python3
"""Proposta Inezo (páginas 1920x1080) com a identidade renovada.
Exportar: node marca/shot.js marca/proposta.html marca/saida/paginas  e  python3 marca/pdf.py"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MAR = "radial-gradient(circle at 30% 20%,#163A60,#081B30 80%)"
AZUL = "linear-gradient(160deg,#1F5C99,#0E2A47)"
LAR = "linear-gradient(160deg,#F6A04A,#D9701A)"
GELO = "#EEF3F8"
GRADE = '<div class="grade"></div>'
pages = []


def logo(w, tema="cor"):
    return f'<span data-logo="{tema}" data-w="{w}"></span>'


def simb(w, tema="cor"):
    return f'<span data-simb="{tema}" data-w="{w}"></span>'


def ic(nome, w, cor):
    return f'<svg viewBox="0 0 100 100" style="width:{w}px;height:{w}px;color:{cor}"><use href="#{nome}"/></svg>'


def pg(nome, bg, corpo, titulo=None, sub=None, n=None, claro=False, grade=True):
    cor = "var(--marinho)" if claro else "#fff"
    cor2 = "var(--laranja2)" if claro else ("#fff" if "F6A04A" in bg else "var(--laranja)")
    gd = f'<div class="grade" style="--gc:{"rgba(14,42,71,.05)" if claro else "rgba(255,255,255,.05)"}"></div>' if grade else ""
    head = ""
    if titulo:
        head = (f'<div class="abs h" style="left:90px;top:62px;font-size:72px;color:{cor}">{titulo}</div>'
                f'<div class="abs" style="left:92px;top:150px;font-weight:600;font-size:28px;color:{cor2}">{sub}</div>'
                f'<div class="abs h" style="right:90px;top:66px;font-size:52px;color:{cor2}">{n:02d}</div>'
                f'<div class="abs" style="right:90px;top:132px;font-weight:700;font-size:17px;letter-spacing:4px;color:{cor};opacity:.6">INEZO · PROPOSTA</div>'
                f'<div class="abs" style="left:90px;right:90px;top:204px;height:3px;background:{cor2};opacity:.45"></div>')
    return f'<div data-shot="{nome}" style="position:relative;width:1920px;height:1080px;overflow:hidden;background:{bg}">{gd}{head}{corpo}</div>'


def img(src, w, h=None, r=16, extra=""):
    hh = f"height:{h}px;object-fit:cover;object-position:top;" if h else ""
    return f'<img src="{src}" style="width:{w}px;{hh}border-radius:{r}px;box-shadow:0 18px 44px rgba(0,0,0,.25);{extra}">'


CR = '''<div style="display:inline-flex;align-items:center;gap:18px"><div style="width:74px;height:74px;border-radius:18px;background:#FF6A13">
  <svg viewBox="0 0 100 100" style="width:74px;height:74px"><path d="M58 12 26 56h22l-8 32 34-46H52z" fill="#fff"/></svg></div>
  <div style="text-align:left;font-family:Mont;font-weight:900;font-style:italic;font-size:34px;line-height:1"><span style="color:#fff">CRIATIVOS</span><br><span style="color:#F6A04A">RÁPIDOS</span></div></div>'''

# 01 capa
pages.append(pg("pr_01_capa.jpg", MAR, f'''
  <div class="abs w100 c" style="top:170px">{logo(900, "branco")}</div>
  <div class="abs w100 c h" style="top:540px;font-size:76px;color:#fff;white-space:nowrap">PROPOSTA DE MARCA, VÍDEOS E CONTEÚDO</div>
  <div class="abs w100 c" style="top:660px;font-weight:600;font-size:32px;color:#C9D8E8">Identidade renovada · anúncios em vídeo com locução · página de vendas · social media</div>
  <div class="abs w100 c" style="top:800px;font-weight:700;font-size:20px;letter-spacing:6px;color:#fff">PREPARADO POR</div>
  <div class="abs w100 c" style="top:840px">{CR}</div>'''))


# 02 o que vimos
def ponto(cor, titulo, txt):
    return (f'<div style="display:flex;gap:18px;margin-bottom:26px"><div style="flex:none;width:18px;height:18px;border-radius:50%;background:{cor};margin-top:11px"></div>'
            f'<div><div style="font-weight:700;font-size:30px;color:var(--tinta)">{titulo}</div><div style="font-weight:500;font-size:23px;color:var(--cinza);margin-top:4px;line-height:1.4">{txt}</div></div></div>')


pages.append(pg("pr_02_diagnostico.jpg", GELO, f'''
  <div class="abs" style="left:90px;top:250px;display:flex;gap:26px">{img("../assets/insta.png", 340, 736)}{img("../assets/flyer.jpg", 410, 736)}</div>
  <div class="abs" style="left:950px;top:255px;width:880px">
    {ponto("var(--azul)", "Serviço completo, com engenheiro", "Construção, reforma, regularização, habite-se, laudos e manutenção predial: um diferencial forte que hoje quase não aparece.")}
    {ponto("var(--laranja)", "Foto de perfil é um ícone genérico", "O “play” vermelho não tem nada da marca. Quem chega no perfil não reconhece a Inezo nem confia de primeira.")}
    {ponto("var(--laranja)", "Visual sem padrão entre as peças", "Cores, fontes e o logo mudam de post para post; o logo atual perde leitura em tamanho pequeno.")}
    {ponto("var(--laranja)", "734 seguidores: espaço enorme para crescer", "Brasília reforma o tempo todo. Com vídeo de anúncio e conteúdo constante, o WhatsApp vira canal de orçamento.")}
  </div>''', "O Que Vimos Hoje", "Instagram @inezo_reformas · 734 seguidores · 59 posts", 1, claro=True))

# 03 identidade renovada
cores = [("#0E2A47", "Azul-marinho", "#fff"), ("#1F5C99", "Azul obra", "#fff"), ("#F28C28", "Laranja", "#fff"), ("#EEF3F8", "Gelo", "#0E2A47"), ("#9AA7B4", "Concreto", "#fff")]
pal = "".join(f'<div style="width:150px;height:150px;border-radius:24px;background:{h};display:flex;flex-direction:column;justify-content:flex-end;padding:16px;color:{t};box-shadow:0 10px 26px rgba(14,42,71,.15)">'
              f'<div style="font-weight:700;font-size:19px">{n}</div><div style="font-weight:500;font-size:16px;opacity:.8">{h}</div></div>' for h, n, t in cores)
dest = [("i-tijolo", "Obras"), ("i-rolo", "Reformas"), ("i-doc", "Habite-se"), ("i-lupa", "Laudos")]
dests = "".join(f'<div style="text-align:center"><div style="width:120px;height:120px;border-radius:50%;background:var(--marinho);border:5px solid var(--laranja);display:flex;align-items:center;justify-content:center">{ic(i, 64, "#fff")}</div>'
                f'<div style="margin-top:10px;font-weight:700;font-size:20px;color:var(--tinta)">{t}</div></div>' for i, t in dest)
pages.append(pg("pr_03_identidade.jpg", "#fff", f'''
  <div class="abs" style="left:90px;top:255px;width:520px;text-align:center">
    <div style="font-weight:700;font-size:20px;letter-spacing:4px;color:var(--cinza)">ANTES</div>
    <div style="margin-top:18px;border-radius:24px;overflow:hidden;box-shadow:0 18px 44px rgba(0,0,0,.2)"><img src="../assets/logo_crop.png" style="width:520px;display:block"></div></div>
  <div class="abs h" style="left:640px;top:390px;font-size:80px;color:var(--laranja)">→</div>
  <div class="abs" style="left:760px;top:255px;width:1070px;text-align:center">
    <div style="font-weight:700;font-size:20px;letter-spacing:4px;color:var(--laranja2)">DEPOIS · PRÉVIA</div>
    <div style="display:flex;gap:24px;margin-top:18px">
      <div style="flex:1;background:var(--gelo);border-radius:24px;padding:40px 30px">{logo(470)}</div>
      <div style="flex:1;background:var(--marinho);border-radius:24px;padding:40px 30px">{logo(470, "branco")}</div></div></div>
  <div class="abs" style="left:90px;top:620px;">
    <div style="font-weight:700;font-size:20px;letter-spacing:4px;color:var(--cinza);margin-bottom:16px">PALETA</div><div style="display:flex;gap:16px">{pal}</div></div>
  <div class="abs" style="left:1000px;top:620px;display:flex;gap:40px;align-items:flex-start">
    <div style="text-align:center"><div style="font-weight:700;font-size:20px;letter-spacing:4px;color:var(--cinza);margin-bottom:16px">PERFIL</div>
      <div style="width:170px;height:170px;border-radius:50%;background:#fff;box-shadow:0 0 0 6px var(--laranja),0 14px 30px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center">{simb(130)}</div></div>
    <div><div style="font-weight:700;font-size:20px;letter-spacing:4px;color:var(--cinza);margin-bottom:16px">DESTAQUES</div><div style="display:flex;gap:22px">{dests}</div></div></div>
  <div class="abs" style="left:90px;right:90px;top:900px;font-weight:600;font-size:24px;color:var(--tinta);line-height:1.5">
    Mantemos o que já é da Inezo (o nome, a casinha dentro do “O”, o azul e o laranja) e redesenhamos com traço limpo: legível no perfil, na fachada, no uniforme e na placa de obra.
    Entrega: logo em versões (cor, branca, símbolo), paleta, fontes, foto de perfil e capas de destaque.</div>''',
                "Identidade Visual Renovada", "Mesma marca, mais profissional e reconhecível", 2, claro=True, grade=False))

# 04 vídeo de exemplo
tempos = (1.6, 4.6, 7.9, 13.6, 18.0, 23.6, 29.6)
quadros = "".join(img(f"../frames/f_{int(t * 30):05d}.jpg", 222, r=14) for t in tempos)
pages.append(pg("pr_04_video.jpg", AZUL, f'''
  <div class="abs" style="left:90px;top:262px;display:flex;gap:28px">{quadros}</div>
  <div class="abs" style="left:90px;top:700px;width:1740px">
    <div style="font-weight:800;font-size:30px;color:#fff">ANÚNCIO EM VÍDEO · 30 s · LOCUÇÃO PROFISSIONAL COM EMOÇÃO</div>
    <div style="margin-top:16px;font-weight:500;font-size:25px;color:#C9D8E8;line-height:1.55">
      <b style="color:var(--laranja)">Dor:</b> “Obra parada, pedreiro que sumiu e o orçamento que só aumenta?” →
      <b style="color:var(--laranja)">Sonho:</b> “imagina a sua obra com engenheiro de verdade: projeto, prazo e acompanhamento” →
      <b style="color:var(--laranja)">Solução:</b> todos os serviços da Inezo, num lugar só, em Brasília →
      <b style="color:var(--laranja)">Chamado:</b> WhatsApp para orçamento.<br>
      Pronto para Reels, Stories e anúncio patrocinado no Instagram e Facebook.</div></div>''',
                "Vídeo de Exemplo", "Feito com a identidade renovada · arquivo enviado junto com esta proposta", 3))


# 05 pacotes e 06 planos
def cartoes(lista, alto, fs=30, sufixo="", fundo=GELO):
    out = ""
    for nome, preco, resumo, itens, hl in lista:
        li = "".join(f'<div style="display:flex;align-items:center;gap:14px;margin:13px 0;font-weight:600;font-size:{fs}px;color:var(--tinta)">'
                     f'<span style="flex:none;width:30px;height:30px;border-radius:50%;background:var(--laranja);color:#fff;font-size:17px;font-weight:900;display:flex;align-items:center;justify-content:center">✓</span>{i}</div>' for i in itens)
        badge = ('<div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:var(--laranja);color:#fff;font-weight:800;font-size:20px;'
                 'letter-spacing:3px;padding:10px 26px;border-radius:30px;white-space:nowrap">MAIS ESCOLHIDO</div>') if hl else ""
        out += (f'<div style="position:relative;width:540px;height:{alto + 40 if hl else alto}px;background:{"#fff" if hl else fundo};border-radius:34px;padding:38px 46px;'
                f'border:{"6px solid var(--laranja)" if hl else "none"};box-shadow:0 24px 60px rgba(0,0,0,.3)">{badge}'
                f'<div class="h" style="text-align:center;font-size:52px;color:var(--marinho)">{nome}</div>'
                f'<div style="text-align:center;margin:4px 0 0"><span style="font-weight:700;font-size:30px;color:var(--cinza);vertical-align:top;line-height:2.3">R$ </span>'
                f'<span class="h" style="font-size:110px;color:var(--tinta)">{preco}</span><span style="font-weight:700;font-size:28px;color:var(--cinza)">{sufixo}</span></div>'
                f'<div style="text-align:center;font-weight:700;font-size:24px;color:var(--laranja2);margin-bottom:10px">{resumo}</div>{li}</div>')
    return out


pac = [("LARGADA", "97", "para começar a anunciar", ["1 vídeo de anúncio 30 s", "Roteiro + locução profissional", "Formato Reels/Stories", "1 rodada de ajustes"], False),
       ("ACELERA", "297", "marca nova + vídeo", ["Identidade visual renovada", "Logo, paleta e fontes", "Foto de perfil e destaques", "1 vídeo de anúncio 30 s"], True),
       ("TURBO", "497", "marca + vídeos + página", ["Identidade visual renovada", "2 vídeos de anúncio 30 s", "Página de vendas com WhatsApp", "Pronta para receber anúncios"], False)]
pages.append(pg("pr_05_pacotes.jpg", AZUL, f'''
  <div class="abs w100 c h" style="top:58px;font-size:86px;color:#fff">PACOTES</div>
  <div class="abs w100 c" style="top:162px;font-weight:600;font-size:27px;color:#C9D8E8">Entrega única, sem mensalidade: para testar, lançar ou dar a cara nova da Inezo</div>
  <div class="abs" style="left:0;right:0;top:280px;display:flex;justify-content:center;align-items:flex-end;gap:40px">{cartoes(pac, 600)}</div>'''))

planos = [("PRESENÇA", "597", "perfil ativo toda semana",
           ["2 reels com locução", "4 carrosséis", "4 posts", "12 stories", "Programação e postagem"], False),
          ("CRESCIMENTO", "797", "mais vídeo, mais alcance",
           ["1 arte de anúncio", "3 reels com locução", "6 carrosséis", "4 posts", "20 stories", "Programação e postagem"], True),
          ("AUTORIDADE", "997", "a Inezo em todo lugar",
           ["2 artes de anúncio", "4 reels com locução", "8 carrosséis", "4 posts", "30 stories", "Postagem + relatório mensal"], False)]
pages.append(pg("pr_06_planos.jpg", LAR, f'''
  <div class="abs w100 c h" style="top:50px;font-size:86px;color:#fff">PLANOS MENSAIS</div>
  <div class="abs w100 c" style="top:152px;font-weight:600;font-size:27px;color:#FFF3E8">A gente cria, programa e posta. Você só aprova.</div>
  <div class="abs" style="left:0;right:0;top:250px;display:flex;justify-content:center;align-items:flex-end;gap:40px">{cartoes(planos, 680, fs=29, sufixo="/mês")}</div>
  <div class="abs w100 c" style="top:1010px;font-weight:600;font-size:21px;color:#FFF3E8">Valores a partir de. Não inclui resposta de mensagens nem gestão de tráfego (a verba dos anúncios é investida direto pela empresa).</div>'''))

# 07 próximos passos
passos = [("1", "Escolhe pacote ou plano", "avulso para começar, mensal para crescer"), ("2", "Aprova a nova marca", "ajustamos a prévia com vocês"),
          ("3", "Aprova os roteiros", "obras, serviços e diferenciais"), ("4", "Recebe tudo pronto", "para anunciar e postar")]
ps = "".join(f'<div style="width:400px;height:290px;background:#fff;border-radius:30px;padding:36px;box-shadow:0 18px 40px rgba(14,42,71,.1)">'
             f'<div class="h" style="width:84px;height:84px;border-radius:24px;background:var(--laranja);color:#fff;font-size:50px;display:flex;align-items:center;justify-content:center">{a}</div>'
             f'<div style="margin-top:30px;font-weight:700;font-size:31px;color:var(--tinta)">{b}</div><div style="margin-top:8px;font-weight:500;font-size:23px;color:var(--cinza)">{c}</div></div>'
             for a, b, c in passos)
pages.append(pg("pr_07_proximos.jpg", GELO, f'''
  <div class="abs" style="left:90px;top:265px;display:flex;gap:40px">{ps}</div>
  <div class="abs" style="left:90px;right:90px;top:640px;height:330px;border-radius:30px;background:{MAR};overflow:hidden">
    <div class="abs" style="left:80px;top:128px">{CR}</div>
    <div class="abs" style="left:700px;top:60px">{logo(700, "branco")}</div></div>''',
                "Próximos Passos", "Simples: escolher, aprovar e começar a anunciar", 4, claro=True))

html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Inezo - proposta</title>
<link rel="stylesheet" href="base.css"><style>body{{padding:0;gap:0;background:#fff}} .grade{{background-image:linear-gradient(var(--gc) 2px,transparent 2px),linear-gradient(90deg,var(--gc) 2px,transparent 2px)}}</style></head><body>
{"".join(pages)}
<script src="brand.js"></script><script src="icones.js"></script>
<script>document.body.insertAdjacentHTML("afterbegin", ICONES);
document.querySelectorAll("[data-logo]").forEach(e => e.innerHTML = INEZO.logo(+e.dataset.w, e.dataset.logo));
document.querySelectorAll("[data-simb]").forEach(e => e.innerHTML = INEZO.simbolo(+e.dataset.w, e.dataset.simb));</script>
</body></html>'''
(ROOT / "proposta.html").write_text(html)
print(len(pages), "páginas")
