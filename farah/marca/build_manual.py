#!/usr/bin/env python3
"""Gera marca/manual.html: manual de identidade (7 páginas) + proposta comercial (6 páginas), 1920x1080.
Exportar:  node marca/shot.js marca/manual.html marca/saida/paginas   e depois  python3 marca/pdfs.py
"""
from pathlib import Path

from build_pecas import ICONES, END, INSTA, WHATS, ic, onda

ROOT = Path(__file__).resolve().parent
P = "saida/pecas/"


def logo(tipo, w, tema="escuro"):
    return f'<span data-logo="{tipo}" data-w="{w}" data-tema="{tema}"></span>'


def pg(nome, bg, corpo, titulo=None, sub=None, n=None, claro=False, tag="IDENTIDADE VISUAL"):
    cor = "var(--tinta)" if claro else "#fff"
    cor2 = "var(--coral2)" if claro else "var(--sol)"
    head = ""
    if titulo:
        head = (f'<div class="abs anton" style="left:90px;top:70px;font-size:76px;color:{cor}">{titulo}</div>'
                f'<div class="abs" style="left:92px;top:160px;font-weight:700;font-size:28px;color:{cor2}">{sub}</div>'
                f'<div class="abs anton" style="right:90px;top:74px;font-size:44px;color:var(--coral)">{n:02d}</div>'
                f'<div class="abs" style="right:90px;top:134px;font-weight:800;font-size:18px;letter-spacing:4px;color:{cor2}">FARAH TABACARIA · {tag}</div>'
                f'<div class="abs" style="left:90px;right:90px;top:208px;height:3px;background:{cor2};opacity:.5"></div>')
    return f'<div data-shot="{nome}" style="position:relative;width:1920px;height:1080px;overflow:hidden;background:{bg}">{head}{corpo}</div>'


def thumb(src, w, h=None, r=16, rot=0, extra=""):
    hh = f"height:{h}px;object-fit:cover;" if h else ""
    return (f'<img src="{src}" style="width:{w}px;{hh}border-radius:{r}px;box-shadow:0 18px 40px rgba(0,0,0,.35);'
            f'transform:rotate({rot}deg);{extra}">')


NAVY = "radial-gradient(ellipse at 50% 35%,#12304A 0%,#0D1B2A 70%)"
AREIA = "#FBF3E4"
pages = []

# ------------------------------------------------------------------ MANUAL ---
pages.append(pg("id_01_capa.jpg", NAVY, f'''
  {onda("var(--mar)", -40)}
  <div class="abs w100 c" style="top:110px">{logo("emblema", 520)}</div>
  <div class="abs w100 c" style="top:660px">{logo("slogan", 760)}</div>
  <div class="abs w100 c" style="top:950px;font-weight:800;font-size:30px;letter-spacing:12px;color:#fff">IDENTIDADE VISUAL</div>'''))

pages.append(pg("id_02_marca.jpg", AREIA, f'''
  <div class="abs" style="left:110px;top:290px">{logo("emblema", 520)}</div>
  <div class="abs" style="left:700px;top:300px;display:flex;gap:40px">{logo("emblema", 240, "coral")}{logo("emblema", 240, "claro")}</div>
  <div class="abs" style="left:700px;top:580px;font-weight:800;font-size:20px;letter-spacing:4px;color:var(--coral2)">SELO · VERSÕES ESCURA, CORAL E CLARA</div>
  <div class="abs" style="left:700px;top:660px;background:var(--tinta);border-radius:20px;padding:34px 40px">{logo("horizontal", 470, "escuro")}</div>
  <div class="abs" style="left:1260px;top:660px;border:2px solid #E3D6BD;border-radius:20px;padding:34px 40px;background:#fff">{logo("horizontal", 470, "claro")}</div>
  <div class="abs" style="left:700px;top:880px;font-weight:800;font-size:20px;letter-spacing:4px;color:var(--coral2)">ASSINATURA HORIZONTAL · RODAPÉS, ETIQUETAS, FACHADA</div>
  <div class="abs" style="left:1260px;top:300px;width:560px;font-weight:700;font-size:26px;line-height:1.5;color:var(--tinta)">
    <b style="color:var(--coral)">O conceito:</b> o coral vem do letreiro da loja; o mar, o sol e a onda vêm da orla de Ubatuba, a poucos passos da banca.
    O <b>FARAH</b> em serifa clássica traz a tradição de tabacaria; o <b>TABACARIA</b> em letra forte deixa claro, de longe, o que a loja é.</div>''',
                "A Marca", "Selo redondo para perfil e adesivos · assinatura horizontal para o dia a dia", 1, claro=True))

pages.append(pg("id_03_slogan.jpg", "var(--coral)", f'''
  {onda("var(--coral2)", -40)}
  <div class="abs w100 c" style="top:270px">{logo("slogan", 1150, "coral")}</div>
  <div class="abs w100 c" style="top:700px;font-weight:700;font-size:30px;color:var(--areia)">Fecha todo vídeo, post e story. Falado no fim dos anúncios, sempre com o selo.</div>
  <div class="abs w100 c" style="top:780px;font-weight:800;font-size:28px;letter-spacing:6px;color:#fff">CHAMADA DE APOIO: “FALTOU? PASSA NA FARAH!”</div>''',
                "Slogan", "A frase que liga a marca à cidade", 2))

cores = [("CORAL", "#E8473B", "letreiro da loja"), ("CORAL ESCURO", "#C9322A", "fundos e ondas"), ("MAR", "#0B6E99", "praia e orla"),
         ("MAR PROFUNDO", "#084C6B", "fundos"), ("SOL", "#FFC93C", "destaques"), ("AREIA", "#F7E6C4", "textos leves"),
         ("TINTA", "#0D1B2A", "base escura")]
sw = "".join(f'<div style="width:220px"><div style="height:220px;border-radius:24px;background:{h};border:2px solid rgba(0,0,0,.08)"></div>'
             f'<div style="margin-top:14px;font-weight:800;font-size:22px;color:var(--tinta)">{n}</div>'
             f'<div style="font-weight:700;font-size:20px;color:#7a6a55">{h} · {u}</div></div>' for n, h, u in cores)
tipos = [("TÍTULOS", '<span class="anton" style="font-size:96px">TABACARIA</span>', "Anton · títulos fortes"),
         ("NOME", '<span class="cinzel" style="font-size:96px;color:var(--coral)">FARAH</span>', "Cinzel · tradição de tabacaria"),
         ("TOM LEVE", '<span class="pac" style="font-size:50px;color:var(--mar)">pertinho da praia</span>', "Pacifico · frases de praia"),
         ("TEXTOS", '<span style="font-weight:800;font-size:46px">Av. Iperoig, 301</span>', "Montserrat · informações")]
tp = "".join(f'<div style="width:400px;height:250px;background:#fff;border-radius:24px;padding:26px;position:relative">'
             f'<div style="font-weight:800;font-size:18px;letter-spacing:4px;color:var(--coral2)">{a}</div>'
             f'<div style="margin-top:28px;color:var(--tinta);white-space:nowrap">{b}</div>'
             f'<div style="position:absolute;bottom:22px;font-weight:700;font-size:20px;color:#7a6a55">{c}</div></div>' for a, b, c in tipos)
pages.append(pg("id_04_cores_tipos.jpg", AREIA, f'''
  <div class="abs" style="left:90px;top:270px;display:flex;gap:26px">{sw}</div>
  <div class="abs" style="left:90px;top:680px;display:flex;gap:26px">{tp}</div>''',
                "Cores e Letras", "A paleta e as fontes do vídeo viram a regra da marca", 3, claro=True))

icones = ["i-gelada", "i-refri", "i-energetico", "i-doce", "i-chinelo", "i-bone", "i-carregador", "i-card", "i-agua", "i-bateria", "i-pin", "i-whats"]
grid = "".join(f'<div class="ic" style="width:130px;height:130px">{ic(i, 96)}</div>' for i in icones)
pages.append(pg("id_05_elementos.jpg", NAVY, f'''
  <div class="abs" style="left:90px;top:280px;width:840px;display:grid;grid-template-columns:repeat(6,130px);gap:26px">{grid}</div>
  <div class="abs" style="left:90px;top:620px;font-weight:800;font-size:20px;letter-spacing:4px;color:var(--sol)">ÍCONES PRÓPRIOS · PRODUTOS DE CONVENIÊNCIA</div>
  <div class="abs" style="left:1040px;top:280px;width:790px;height:200px;border-radius:24px;overflow:hidden;background:var(--coral);position:absolute">{onda("var(--coral2)", -60)}<div class="abs w100 c pac" style="top:40px;font-size:60px;color:var(--areia)">a onda da orla</div></div>
  <div class="abs" style="left:1040px;top:520px"><span class="tag anton" style="background:var(--sol);color:var(--tinta);font-size:64px;transform:rotate(-3deg);display:inline-block">ATENÇÃO, UBATUBA!</span></div>
  <div class="abs" style="left:1040px;top:660px;font-weight:800;font-size:20px;letter-spacing:4px;color:var(--sol)">ONDA · TARJA · ETIQUETAS</div>
  <div class="abs" style="left:90px;top:720px;right:90px;border:2px solid rgba(255,255,255,.35);border-radius:24px;padding:30px 40px;color:#fff">
    <div style="font-weight:800;font-size:22px;letter-spacing:4px;color:var(--sol)">REGRA DE OURO DA TABACARIA NAS REDES</div>
    <div style="margin-top:12px;font-weight:700;font-size:25px;line-height:1.45">A palavra <b>TABACARIA</b> e o nome da loja aparecem sempre, mas <b>sem foto, preço ou promoção de cigarro, charuto, seda, narguilé ou acessórios</b>
    (Lei 9.294/96 e regras de anúncio da Meta). Peças da marca levam o aviso: “Venda de produtos de tabacaria proibida para menores de 18 anos.”</div></div>''',
                "Elementos", "O que se repete em todas as peças", 4))

# página do Instagram: celular com o perfil montado
grade = "".join(f'<img src="{P}{n}" style="width:100%;aspect-ratio:4/5;object-fit:cover;display:block">'
                for n in ("post_2_slogan.jpg", "post_1_faltou.jpg", "post_3_tem_de_tudo.jpg", "post_6_tabacaria.jpg",
                          "post_5_carregador.jpg", "post_4_onde_fica.jpg"))
dest = "".join(f'<div style="text-align:center"><img src="{P}destaque_{d}.jpg" style="width:82px;height:82px;border-radius:50%;border:3px solid #ddd;padding:3px;background:#fff"><div style="font-size:15px;font-weight:700;margin-top:6px">{t}</div></div>'
               for d, t in (("bebidas", "Bebidas"), ("praia", "Praia"), ("tech", "Tech"), ("geek", "Geek"), ("onde_fica", "Onde fica")))
celular = f'''<div style="width:470px;height:960px;border-radius:64px;background:#111;padding:16px;box-shadow:0 30px 70px rgba(0,0,0,.5)">
  <div style="width:100%;height:100%;border-radius:50px;background:#fff;overflow:hidden;padding:56px 0 0">
    <div style="display:flex;align-items:center;gap:22px;padding:0 22px">
      <img src="{P}farah_foto_perfil.jpg" style="width:120px;height:120px;border-radius:50%;border:4px solid var(--coral);padding:3px">
      <div style="font-size:15px;line-height:1.3"><b style="font-size:18px">banca_farah_ubatuba</b><br>
      <b>Farah Tabacaria</b> · Ubatuba-SP<br>Falou em Ubatuba, falou em Tabacaria Farah.<br>📍 {END}</div></div>
    <div style="display:flex;justify-content:space-between;padding:22px 22px 14px">{dest}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px">{grade}</div></div></div>'''
stories = "".join(f'<img src="{P}{s}" style="width:300px;border-radius:26px;box-shadow:0 20px 50px rgba(0,0,0,.45)">'
                  for s in ("story_1_passa_na_farah.jpg", "story_2_enquete.jpg", "story_3_onde_fica.jpg"))
pages.append(pg("id_06_instagram.jpg", "var(--mar2)", f'''
  <div class="abs" style="left:110px;top:240px;transform:scale(.82);transform-origin:top left">{celular}</div>
  <div class="abs" style="left:640px;top:290px;display:flex;gap:34px">{stories}</div>
  <div class="abs" style="left:640px;top:880px;font-weight:800;font-size:22px;letter-spacing:4px;color:var(--sol)">PERFIL · DESTAQUES · FEED · STORIES PRONTOS</div>''',
                "Instagram", "Perfil organizado com a mesma cara do vídeo", 5))

aplic = f'''
  <div class="abs" style="left:110px;top:300px;width:420px;height:520px">
    <div style="position:absolute;left:60px;top:0;width:300px;height:90px;border:16px solid #b98b5a;border-bottom:none;border-radius:150px 150px 0 0"></div>
    <div style="position:absolute;left:0;top:70px;width:420px;height:450px;background:#E3C597;border-radius:8px;box-shadow:0 20px 40px rgba(0,0,0,.3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px">
      {logo("emblema", 230, "escuro")}<div class="pac" style="font-size:34px;color:var(--tinta)">pertinho da praia</div></div></div>
  <div class="abs" style="left:620px;top:330px;width:330px;height:470px;background:var(--coral);clip-path:polygon(20% 0,80% 0,100% 100%,0 100%);display:flex;flex-direction:column;align-items:center;padding-top:60px;box-shadow:0 20px 40px rgba(0,0,0,.3)">
    <div class="pac" style="font-size:34px;color:var(--areia)">faltou?</div><div class="anton" style="font-size:54px;color:#fff;margin-top:10px">PASSA NA</div><div class="cinzel" style="font-size:52px;color:var(--sol)">FARAH!</div>
    <div style="margin-top:24px;font-weight:800;font-size:20px;color:#fff">Av. Iperoig, 301</div></div>
  <div class="abs" style="left:1040px;top:320px;width:300px;height:300px;border-radius:50%;box-shadow:0 20px 40px rgba(0,0,0,.35)">{logo("emblema", 300, "coral")}</div>
  <div class="abs" style="left:1420px;top:320px;width:380px;height:240px;border-radius:26px;background:var(--mar);box-shadow:0 20px 40px rgba(0,0,0,.35);overflow:hidden">{onda("var(--mar2)", -110)}
    <div class="abs w100 c pac" style="top:40px;font-size:42px;color:var(--areia)">lembrança de</div><div class="abs w100 c anton" style="top:100px;font-size:84px;color:#fff">UBATUBA</div><div class="abs w100 c" style="top:200px;font-size:0">{logo("horizontal", 200, "escuro")}</div></div>
  <div class="abs" style="left:1420px;top:600px;width:380px;height:240px;border-radius:26px;background:var(--tinta);display:flex;align-items:center;justify-content:center;box-shadow:0 20px 40px rgba(0,0,0,.35)">{logo("horizontal", 320, "escuro")}</div>
  <div class="abs" style="left:110px;top:870px;right:110px;display:flex;justify-content:space-between;font-weight:800;font-size:20px;letter-spacing:3px;color:var(--coral2)">
    <span style="width:420px;text-align:center">SACOLA KRAFT</span><span style="width:330px;text-align:center;margin-left:-60px">CAVALETE DA CALÇADA</span>
    <span style="width:300px;text-align:center">ADESIVO</span><span style="width:380px;text-align:center">ÍMÃ · PLACA DO BALCÃO</span></div>'''
pages.append(pg("id_07_aplicacoes.jpg", AREIA, aplic, "Aplicações", "A marca na rua, no balcão e na mão do cliente", 6, claro=True))

# ----------------------------------------------------------------- PROPOSTA ---
CR = '''<div style="display:inline-flex;align-items:center;gap:18px"><div style="width:74px;height:74px;border-radius:18px;background:#FF6A13;position:relative">
  <svg viewBox="0 0 100 100" style="width:74px;height:74px"><path d="M58 12 26 56h22l-8 32 34-46H52z" fill="#fff"/></svg></div>
  <div style="text-align:left;font-family:Mont;font-weight:900;font-style:italic;font-size:34px;line-height:1"><span style="color:#fff">CRIATIVOS</span><br><span style="color:#FF6A13">RÁPIDOS</span></div></div>'''
pages.append(pg("pr_01_capa.jpg", NAVY, f'''
  {onda("var(--mar)", -40)}
  <div class="abs w100 c" style="top:90px">{logo("emblema", 440)}</div>
  <div class="abs w100 c anton" style="top:580px;font-size:96px;color:#fff">PROPOSTA DE CONTEÚDO</div>
  <div class="abs w100 c" style="top:700px;font-weight:700;font-size:32px;color:var(--areia)">Vídeo com locução · identidade visual · posts e stories · Instagram</div>
  <div class="abs w100 c" style="top:790px;font-weight:800;font-size:20px;letter-spacing:6px;color:var(--sol)">PREPARADO POR</div>
  <div class="abs w100 c" style="top:830px">{CR}</div>'''))

frames = "".join(f'<img src="img/v_{t}.jpg" style="width:250px;border-radius:18px;box-shadow:0 18px 40px rgba(0,0,0,.4)">'
                 for t in ("1.6", "7.2", "10.5", "16.0", "24.8", "32.8"))
pages.append(pg("pr_02_video.jpg", NAVY, f'''
  <div class="abs" style="left:90px;top:270px;display:flex;gap:40px">{frames}</div>
  <div class="abs" style="left:90px;top:760px;display:grid;grid-template-columns:1fr 1fr;gap:18px 80px;font-weight:700;font-size:30px;color:#fff">
    <div>● Gancho: “Atenção, Ubatuba!” + TABACARIA FARAH grande</div><div>● Dor de quem mora aqui: faltou algo na praia</div>
    <div>● Produtos passando no ritmo da voz</div><div>● Fecha com o slogan falado e o WhatsApp</div></div>
  <div class="abs" style="left:90px;top:960px;font-weight:700;font-size:22px;color:var(--areia)">Vídeo enviado junto: farah_reels.mp4 · locução feminina profissional · 34 s · 1080x1920</div>''',
                "O Vídeo", "Reels vertical com locução, já pronto para postar", 1, tag="PROPOSTA"))

pages.append(pg("pr_03_identidade.jpg", AREIA, f'''
  <div class="abs" style="left:270px;top:250px;display:grid;grid-template-columns:660px 660px;gap:30px 60px;left:270px">
    {"".join(thumb(f"saida/paginas/{n}", 660) for n in ("id_02_marca.jpg", "id_03_slogan.jpg", "id_04_cores_tipos.jpg", "id_07_aplicacoes.jpg"))}</div>
  <div class="abs w100 c" style="top:1030px;font-weight:700;font-size:20px;color:#7a6a55">Manual completo enviado junto: farah_identidade_visual.pdf</div>''',
                "Identidade Visual", "Logo, slogan, cores, letras, elementos e aplicações", 2, claro=True, tag="PROPOSTA"))

posts = "".join(f'<img src="{P}{n}" style="width:250px;border-radius:14px;box-shadow:0 14px 34px rgba(0,0,0,.4)">'
                for n in ("post_1_faltou.jpg", "post_2_slogan.jpg", "post_3_tem_de_tudo.jpg", "post_4_onde_fica.jpg", "post_5_carregador.jpg", "post_6_tabacaria.jpg"))
pages.append(pg("pr_04_instagram.jpg", "var(--mar2)", f'''
  <div class="abs" style="left:90px;top:300px;display:flex;gap:28px">{posts}</div>
  <div class="abs" style="left:90px;top:680px;display:flex;gap:24px">{"".join(f'<img src="{P}destaque_{d}.jpg" style="width:120px;height:120px;border-radius:50%;border:5px solid #fff">' for d in ("bebidas", "praia", "tech", "geek", "onde_fica"))}</div>
  <div class="abs" style="left:800px;top:690px;font-weight:700;font-size:30px;line-height:1.5;color:#fff">6 posts · 3 stories · 5 capas de destaque · foto de perfil<br><span style="color:var(--sol)">tudo na identidade nova, pronto para publicar</span></div>''',
                "Feed e Stories", "Exemplos de conteúdo para o perfil", 3, tag="PROPOSTA"))

pac = [("START", "247", ["3 vídeos com locução", "3 carrosséis", "Roteiro e legendas", "Ajustes inclusos"], False),
       ("PRO", "497", ["Identidade visual completa", "6 vídeos com locução", "6 carrosséis", "Roteiro e legendas", "Ajustes inclusos"], True),
       ("MAX", "997", ["Identidade visual completa", "Landing page profissional", "9 vídeos com locução", "9 carrosséis", "Roteiro e legendas", "Prioridade nas entregas"], False)]
cards = ""
for nome, preco, itens_, hl in pac:
    li = "".join(f'<div style="display:flex;align-items:center;gap:16px;margin:12px 0;font-weight:700;font-size:25px;color:var(--tinta)"><span style="width:28px;height:28px;border-radius:50%;background:var(--coral);display:inline-block;flex:none"></span>{i}</div>' for i in itens_)
    badge = '<div style="position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:var(--sol);color:var(--tinta);font-weight:900;font-size:22px;letter-spacing:3px;padding:10px 26px;border-radius:30px;white-space:nowrap">MAIS ESCOLHIDO</div>' if hl else ""
    cards += (f'<div style="position:relative;width:500px;height:{660 if hl else 620}px;background:{"#fff" if hl else AREIA};border-radius:34px;padding:50px 46px;'
              f'border:{"6px solid var(--sol)" if hl else "none"};box-shadow:0 24px 60px rgba(0,0,0,.35)">{badge}'
              f'<div class="cinzel" style="text-align:center;font-size:62px;color:var(--coral)">{nome}</div>'
              f'<div style="text-align:center;margin:10px 0 26px"><span style="font-weight:800;font-size:34px;color:#7a6a55;vertical-align:top">R$ </span><span class="anton" style="font-size:120px;color:var(--tinta)">{preco}</span></div>{li}</div>')
pages.append(pg("pr_05_pacotes.jpg", NAVY, f'''
  <div class="abs w100 c anton" style="top:80px;font-size:80px;color:#fff">ESCOLHA O SEU PACOTE</div>
  <div class="abs" style="left:0;right:0;top:250px;display:flex;justify-content:center;align-items:flex-end;gap:50px">{cards}</div>
  <div class="abs w100 c" style="top:1000px;font-weight:700;font-size:22px;color:var(--areia)">Valores por pacote. Locução com voz profissional; fotos e informações fornecidas pela Farah.</div>'''))

passos = [("1", "Escolhe o pacote", "START, PRO ou MAX"), ("2", "Manda fotos e novidades", "produtos, chegadas, horários"),
          ("3", "Aprova os roteiros", "ajustamos o que precisar"), ("4", "Recebe tudo pronto", "é só postar")]
ps = "".join(f'<div style="width:400px;height:300px;background:#fff;border-radius:30px;padding:36px;box-shadow:0 18px 40px rgba(0,0,0,.2)">'
             f'<div class="anton" style="width:84px;height:84px;border-radius:50%;background:var(--coral);color:#fff;font-size:56px;display:flex;align-items:center;justify-content:center">{a}</div>'
             f'<div style="margin-top:34px;font-weight:900;font-size:32px;color:var(--tinta)">{b}</div><div style="margin-top:8px;font-weight:700;font-size:24px;color:#7a6a55">{c}</div></div>'
             for a, b, c in passos)
pages.append(pg("pr_06_proximos.jpg", AREIA, f'''
  <div class="abs" style="left:90px;top:270px;display:flex;gap:40px">{ps}</div>
  <div class="abs" style="left:90px;right:90px;top:660px;height:300px;border-radius:30px;background:var(--tinta);overflow:hidden">{onda("var(--mar)", -150)}
    <div class="abs" style="left:80px;top:96px">{CR}</div>
    <div class="abs" style="left:560px;top:70px">{logo("slogan", 640)}</div></div>''',
                "Próximos Passos", "Simples: escolher, mandar as fotos e postar", 4, claro=True, tag="PROPOSTA"))

html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Farah Tabacaria - manual e proposta</title>
<link rel="stylesheet" href="base.css"></head><body>
{"".join(pages)}
{ICONES}
<script src="brand.js"></script>
<script>
document.querySelectorAll("[data-logo]").forEach(e => {{
  const w = +e.dataset.w, t = e.dataset.tema;
  e.innerHTML = e.dataset.logo === "emblema" ? FARAH.emblema(w, t) : e.dataset.logo === "slogan" ? FARAH.slogan(w, t) : FARAH.horizontal(w, t);
}});
</script></body></html>'''
(ROOT / "manual.html").write_text(html)
print(len(pages), "páginas")
