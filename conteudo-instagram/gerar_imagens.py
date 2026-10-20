"""Gera as imagens do Instagram da Criativos Rápidos (PNG).

- destaques/capas: capas de destaque (1080x1920, ícone centralizado)
- destaques/<nome>: stories que vão dentro de cada destaque (1080x1920)
- carrosseis/<nome>: slides de carrossel (1080x1350)

Uso: python3 gerar_imagens.py   (precisa do Playwright/Chromium)
"""
import base64, html, json, os, subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
ICONE = base64.b64encode(open(os.path.join(AQUI, '..', 'propostas', 'proposta-generica', 'assets', 'logo-icone.png'), 'rb').read()).decode()
e = html.escape

# Preços dos vídeos com motion (ajuste aqui)
PRECOS = [
    ('Essencial', '29,90', ['Vídeo de até 15 s', '1 produto', 'Texto animado + logo']),
    ('Completo', '39,90', ['Vídeo de até 30 s', 'Até 3 produtos', 'Texto animado + logo', 'Música']),
    ('Premium', '49,90', ['Vídeo de até 30 s', 'Até 5 produtos', 'Texto animado + logo', 'Música', 'Locução profissional']),
]

CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #101216; font-family: "Inter", sans-serif; color: #fff; }
.art { position: relative; overflow: hidden; display: flex; flex-direction: column; }
.story { width: 1080px; height: 1920px; padding: 260px 90px 220px; }
.slide { width: 1080px; height: 1350px; padding: 110px 90px 120px; }
.dark { background: #101216; color: #fff; }
.yel { background: #FFD400; color: #101216; }
.light { background: #F6F5F0; color: #101216; }
h1, h2, .mont { font-family: "Montserrat", sans-serif; font-weight: 900; letter-spacing: -.02em; }
h1 { font-size: 118px; line-height: .98; }
h2 { font-size: 88px; line-height: 1.02; }
em { font-style: italic; color: #FFD400; }
.yel em, .light em { color: #101216; background: #FFD400; padding: 0 .12em; border-radius: .1em; font-style: italic; }
.yel em { background: #101216; color: #FFD400; }
.lead { font-size: 46px; line-height: 1.35; font-weight: 600; margin-top: 40px; color: #D7D8DD; }
.yel .lead, .light .lead { color: #2A2C31; }
.brand { position: absolute; left: 90px; display: flex; align-items: center; gap: 20px; }
.story .brand { top: 110px; }
.slide .brand { bottom: 60px; }
.brand img { width: 74px; height: 74px; }
.brand div { font-size: 32px; line-height: 1.02; letter-spacing: -.02em; }
.brand b { display: block; font-weight: 500; }
.brand b + b { font-weight: 800; font-style: italic; }
.yel .brand img { display: none; }
.pager { position: absolute; right: 90px; bottom: 74px; font-family: "Montserrat"; font-weight: 900; font-size: 30px; color: #FFD400; }
.yel .pager, .light .pager { color: #101216; }
.swipe { position: absolute; right: 90px; bottom: 66px; font-size: 30px; font-weight: 800; display: flex; align-items: center; gap: 14px; }
.chip { display: inline-block; align-self: flex-start; background: #FFD400; color: #101216; font-weight: 800; font-size: 30px; letter-spacing: .14em; text-transform: uppercase; padding: 14px 26px; border-radius: 99px; margin-bottom: 44px; }
.yel .chip { background: #101216; color: #FFD400; }
.center { justify-content: center; }
.mid { margin-top: auto; margin-bottom: auto; }
.cardw { background: #fff; color: #101216; border-radius: 40px; padding: 46px 50px; }
.dark .cardk, .cardk { background: #1B1E24; border: 2px solid rgba(255,255,255,.08); border-radius: 40px; padding: 46px 50px; color: #fff; }
.price { font-family: "Montserrat"; font-weight: 900; font-size: 190px; line-height: .9; letter-spacing: -.04em; }
.price small { font-size: 64px; margin-right: 10px; letter-spacing: 0; }
.list { display: grid; gap: 22px; margin-top: 40px; }
.li { display: flex; align-items: center; gap: 26px; font-size: 46px; font-weight: 700; }
.li i { flex: none; width: 60px; height: 60px; border-radius: 50%; background: #FFD400; display: grid; place-items: center; }
.li i::after { content: ""; width: 24px; height: 13px; border-left: 7px solid #101216; border-bottom: 7px solid #101216; transform: rotate(-45deg) translate(2px, -3px); }
.yel .li i { background: #101216; } .yel .li i::after { border-color: #FFD400; }
.li.x i { background: #3A3D45; } .li.x i::after { content: "✕"; border: 0; transform: none; color: #fff; font-size: 34px; width: auto; height: auto; font-weight: 900; }
.step { display: flex; gap: 36px; align-items: flex-start; }
.step .k { flex: none; width: 150px; height: 150px; border-radius: 40px; background: #FFD400; color: #101216; display: grid; place-items: center; font-family: "Montserrat"; font-weight: 900; font-size: 90px; }
.cta { align-self: flex-start; margin-top: 60px; background: #101216; color: #FFD400; font-family: "Montserrat"; font-weight: 900; font-size: 52px; padding: 30px 52px; border-radius: 99px; }
.dark .cta { background: #FFD400; color: #101216; }
.ph { border: 5px dashed rgba(16,18,22,.35); border-radius: 40px; display: grid; place-items: center; text-align: center; font-size: 40px; font-weight: 700; color: rgba(16,18,22,.55); padding: 40px; }
.dark .ph { border-color: rgba(255,255,255,.3); color: rgba(255,255,255,.55); }
.big-n { font-family: "Montserrat"; font-weight: 900; font-size: 300px; line-height: .8; color: #FFD400; letter-spacing: -.05em; }
.yel .big-n { color: #101216; }
.vs { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 60px; }
.vs > div { border-radius: 36px; padding: 40px; min-height: 480px; display: flex; flex-direction: column; justify-content: space-between; }
.vs .a { background: #2A2D34; color: #A9ABB3; }
.vs .b { background: #FFD400; color: #101216; }
.vs b { font-family: "Montserrat"; font-weight: 900; font-size: 50px; line-height: 1.05; }
.vs span { font-size: 34px; font-weight: 700; }
/* capa de destaque */
.cover { width: 1080px; height: 1920px; background: #101216; display: grid; place-items: center; }
.cover .ring { width: 760px; height: 760px; border-radius: 50%; background: #FFD400; display: grid; place-items: center; }
.cover svg { width: 360px; height: 360px; }
"""

HEAD = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,800;0,900;1,900&family=Inter:ital,wght@0,500;0,600;0,700;0,800;1,800&display=swap" rel="stylesheet"><style>' + CSS + '</style></head><body>'


def brand():
    return f'<div class="brand"><img src="data:image/png;base64,{ICONE}" alt=""><div><b>criativos</b><b>rápidos</b></div></div>'


def li(t, x=False):
    return f'<div class="li{" x" if x else ""}"><i></i><span>{t}</span></div>'


ICONS = {
    'como-funciona': '<svg viewBox="0 0 24 24" fill="none" stroke="#101216" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    'clientes': '<svg viewBox="0 0 24 24" fill="none" stroke="#101216" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.8 5.8 21 7 14.1 2 9.3l7-1L12 2l3 6.3 7 1-5 4.8 1.2 6.9z"/></svg>',
    'valores': '<svg viewBox="0 0 24 24" fill="none" stroke="#101216" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5" fill="#101216"/></svg>',
    'videos': '<svg viewBox="0 0 24 24" fill="none" stroke="#101216" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="14" height="14" rx="3"/><path d="m16 10 6-3v10l-6-3"/></svg>',
    'contato': '<svg viewBox="0 0 24 24" fill="none" stroke="#101216" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.5 8.5 0 1 1 21 11.5z"/></svg>',
}


def capa(nome):
    return f'<div class="cover art" id="a"><div class="ring">{ICONS[nome]}</div></div>'


def story(cls, body, pager=''):
    return f'<div class="art story {cls}" id="a">{brand()}{body}{f"<div class=pager>{pager}</div>" if pager else ""}</div>'


def slide(cls, body, n, tot):
    sw = '<div class="swipe">arrasta <span style="font-size:44px">→</span></div>' if n < tot else f'<div class="pager">{n}/{tot}</div>'
    return f'<div class="art slide {cls}" id="a">{brand()}{body}{sw}</div>'


def pecas():
    out = {}
    # ---------- capas de destaque
    for nome in ICONS:
        out[f'destaques/capas/{nome}'] = capa(nome)
    # ---------- destaque: como funciona
    out['destaques/como-funciona/01'] = story('yel center', '<span class="chip">Como funciona</span><h1>Vídeo com <em>motion</em> pra sua loja em 3 passos.</h1><p class="lead">Simples, rápido e sem complicação.</p>', '1/5')
    passos = [
        ('1', 'Escolhe o seu vídeo', 'Essencial, Completo ou Premium. Veja no destaque <b>Valores</b>.'),
        ('2', 'Manda o material', 'Fotos dos produtos, logo, preços e o que você quer destacar.'),
        ('3', 'Recebe pronto', 'Seu vídeo animado, no formato certo pra Reels, Stories e status.'),
    ]
    for i, (k, t, d) in enumerate(passos, 2):
        out[f'destaques/como-funciona/0{i}'] = story('dark center', f'<div class="step"><span class="k">{k}</span><div><h2>{t}</h2><p class="lead" style="margin-top:24px">{d}</p></div></div>', f'{i}/5')
    out['destaques/como-funciona/05'] = story('dark center', '<h2>Você aprova antes de postar.</h2><div class="list">' + li('Ajuste incluso') + li('Arquivo em alta qualidade') + li('Pagamento facilitado') + '</div><div class="cta">Chama no WhatsApp</div>', '5/5')
    # ---------- destaque: valores
    out['destaques/valores/01'] = story('yel center', '<span class="chip">Valores</span><h1>Vídeos com motion a partir de</h1><div class="price" style="margin-top:30px"><small>R$</small>29,90</div><p class="lead">Arrasta pra ver as opções →</p>', '1/5')
    for i, (nome, preco, itens) in enumerate(PRECOS, 2):
        destaque = '<span class="chip">Mais escolhido</span>' if nome == 'Completo' else ''
        out[f'destaques/valores/0{i}'] = story('dark center', f'{destaque}<h2>{nome}</h2><div class="price" style="margin-top:20px;color:#FFD400"><small style="color:#fff">R$</small>{preco}</div><div class="list" style="margin-top:60px">' + ''.join(li(x) for x in itens) + '</div>', f'{i}/5')
    resumo = ''.join(f'<div class="cardw" style="display:flex;justify-content:space-between;align-items:center"><span class="mont" style="font-size:58px">{n}</span><span class="mont" style="font-size:76px">R$ {p}</span></div>' for n, p, _ in PRECOS)
    out['destaques/valores/05'] = story('dark center', f'<h2>Escolhe o seu:</h2><div style="display:grid;gap:26px;margin-top:50px">{resumo}</div><div class="cta">Pedir pelo WhatsApp</div>', '5/5')
    # ---------- destaque: clientes (modelos para colar depoimentos reais)
    out['destaques/clientes/01'] = story('yel center', '<span class="chip">Clientes</span><h1>Quem já tem vídeo com a gente.</h1><p class="lead">Arrasta e vê o que eles acharam →</p>')
    out['destaques/clientes/02-modelo-depoimento'] = story('dark', '<span class="chip">Depoimento</span><div class="ph" style="flex:1">Cole aqui o print da mensagem do cliente</div><p class="lead" style="margin-top:36px"><b>@lojadocliente</b> · cidade</p>')
    out['destaques/clientes/03-modelo-antes-depois'] = story('dark', '<span class="chip">Antes × depois</span><div style="flex:1;display:grid;grid-template-rows:1fr 1fr;gap:30px"><div class="ph">Antes: foto parada do produto</div><div class="ph">Depois: print do vídeo com motion</div></div>')
    out['destaques/clientes/04'] = story('yel center', '<h1>Agora é a vez da sua loja.</h1><p class="lead">Vídeos com motion a partir de R$ 29,90.</p><div class="cta">Quero o meu</div>')

    # ---------- carrossel 1: por que vídeo vende
    c, T = 'carrosseis/por-que-video-vende', 6
    out[f'{c}/01'] = slide('dark center', '<span class="chip">Pra sua loja</span><h1>Foto parada não para <em>ninguém</em> no feed.</h1><p class="lead">Veja por que o vídeo com motion vende mais.</p>', 1, T)
    out[f'{c}/02'] = slide('light center', '<h2>Qual desses te faz parar?</h2><div class="vs"><div class="a"><span>Foto parada</span><b>Mais um post no meio de tantos</b></div><div class="b"><span>Vídeo com motion</span><b>Movimento chama o olho na hora</b></div></div>', 2, T)
    out[f'{c}/03'] = slide('dark center', '<div class="big-n">1</div><h2 style="margin-top:30px">Mostra o produto <em>em ação</em></h2><p class="lead">Preço, detalhe e oferta aparecendo um de cada vez. O cliente entende sem precisar ler a legenda.</p>', 3, T)
    out[f'{c}/04'] = slide('dark center', '<div class="big-n">2</div><h2 style="margin-top:30px">Chega em quem <em>não te segue</em></h2><p class="lead">Vídeo vai pro Reels, e o Reels é onde o Instagram mostra seu conteúdo pra gente nova.</p>', 4, T)
    out[f'{c}/05'] = slide('dark center', '<div class="big-n">3</div><h2 style="margin-top:30px">Sua loja parece <em>maior</em></h2><p class="lead">Vídeo animado com a sua marca passa confiança. Cliente confia, cliente compra.</p>', 5, T)
    out[f'{c}/06'] = slide('yel center', '<h2>Vídeo com motion pra sua loja a partir de</h2><div class="price" style="margin-top:20px"><small>R$</small>29,90</div><div class="cta">Chama no direct</div>', 6, T)

    # ---------- carrossel 2: como funciona
    c, T = 'carrosseis/como-funciona', 5
    out[f'{c}/01'] = slide('yel center', '<span class="chip">Passo a passo</span><h1>Como ter um vídeo com <em>motion</em> na sua loja.</h1>', 1, T)
    for i, (k, t, d) in enumerate(passos, 2):
        out[f'{c}/0{i}'] = slide('dark center', f'<div class="step"><span class="k">{k}</span><div><h2>{t}</h2><p class="lead" style="margin-top:24px">{d}</p></div></div>', i, T)
    resumo2 = ''.join(f'<div class="cardk" style="display:flex;justify-content:space-between;align-items:center;padding:34px 44px"><span class="mont" style="font-size:52px">{n}</span><span class="mont" style="font-size:66px;color:#FFD400">R$ {p}</span></div>' for n, p, _ in PRECOS)
    out[f'{c}/05'] = slide('dark center', f'<h2>Escolhe o seu</h2><div style="display:grid;gap:22px;margin-top:44px">{resumo2}</div><div class="cta">Chama no direct</div>', 5, T)

    # ---------- carrossel 3: erros que deixam a loja invisível
    c, T = 'carrosseis/erros-loja-invisivel', 7
    out[f'{c}/01'] = slide('dark center', '<span class="chip">Salva esse post</span><h1>5 erros que deixam sua loja <em>invisível</em> no Instagram.</h1>', 1, T)
    erros = [
        ('Só postar foto parada', 'Ninguém para de rolar o feed por uma foto igual às outras. Use movimento.'),
        ('Esconder o preço', '"Chama no direct" sem preço afasta. Mostre pelo menos o "a partir de".'),
        ('Visual diferente em cada post', 'Cores e fontes padronizadas fazem o cliente lembrar da sua loja.'),
        ('Ficar dias sem postar', 'Perfil parado parece loja fechada. Constância vale mais que perfeição.'),
        ('Não dizer o que fazer', 'Todo post precisa de uma chamada: "chama no WhatsApp", "garanta o seu".'),
    ]
    for i, (t, d) in enumerate(erros, 2):
        out[f'{c}/0{i}'] = slide('dark center', f'<div class="big-n">{i-1}</div><h2 style="margin-top:30px">{t}</h2><p class="lead">{d}</p>', i, T)
    out[f'{c}/07'] = slide('yel center', '<h2>Quer resolver o erro nº 1 hoje?</h2><p class="lead">Vídeo com motion pra sua loja a partir de R$ 29,90.</p><div class="cta">Chama no direct</div>', 7, T)
    return out


RENDER = r"""
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const jobs = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const j of jobs) {
    await p.setContent(j.html, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.locator('#a').screenshot({ path: j.png });
  }
  await b.close();
})();
"""

if __name__ == '__main__':
    jobs = []
    for rel, body in pecas().items():
        png = os.path.join(AQUI, rel + '.png')
        os.makedirs(os.path.dirname(png), exist_ok=True)
        jobs.append({'html': HEAD + body + '</body></html>', 'png': png})
    jf = os.path.join(AQUI, '.jobs.json'); open(jf, 'w').write(json.dumps(jobs))
    js = os.path.join(AQUI, '.render.cjs'); open(js, 'w').write(RENDER)
    subprocess.run(['node', js, jf], check=True)
    os.remove(js); os.remove(jf)
    print(len(jobs), 'imagens')
