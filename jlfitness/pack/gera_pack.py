#!/usr/bin/env python3
"""JL Fitness · Plano Presença (mês 1): 9 posts, 6 carrosséis (5 lâminas), 10 stories e 2 anúncios, na identidade nova.
Gera pack.html e exporta cada peça em PNG (feed 1080x1350, stories 1080x1920)."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "saida"
AM, PR = "#FFE100", "#0B0B0B"
IG = "@jlfitnessassessoriaesportiva"


def F(arq):
    return f"../assets/{arq}"


def logo_mini(cor_texto=PR, fundo=AM):
    return (f'<div style="display:inline-flex;align-items:center;gap:12px">'
            f'<div style="width:62px;height:56px;background:{fundo};border-radius:10px;display:flex;align-items:center;justify-content:center;border:3px solid {PR}">'
            f'<img src="{F("silhueta.png")}" style="width:50px"></div>'
            f'<div class="A" style="font-size:40px;color:{cor_texto}">JL FITNESS</div></div>')


def rodape(escuro=False):
    c = "#fff" if escuro else PR
    return (f'<div style="position:absolute;left:60px;right:60px;bottom:48px;display:flex;justify-content:space-between;align-items:center">'
            f'{logo_mini(c)}<div style="font-weight:700;font-size:24px;color:{c};opacity:.85">{IG}</div></div>')


def tag(txt, fs=54, inv=False):
    cls = "tagP" if inv else "tag"
    return f'<span class="{cls}" style="font-size:{fs}px"><span>{txt}</span></span>'


def foto(arq, w, h, pos="center", rot=0, borda=12):
    return (f'<div style="width:{w}px;height:{h}px;border:{borda}px solid #fff;box-shadow:0 26px 60px rgba(0,0,0,.35);transform:rotate({rot}deg);'
            f'background:url({F(arq)}) {pos}/cover"></div>')


LISTRAS = '<div style="position:absolute;inset:0;background:repeating-linear-gradient(-45deg,rgba(0,0,0,.055) 0 26px,transparent 26px 52px)"></div>'


def peca(id_, html, w=1080, h=1350, fundo=AM):
    return f'<div class="pc" id="{id_}" style="width:{w}px;height:{h}px;background:{fundo}">{html}</div>'


# ---------------------------------------------------------------- POSTS (9)
def post_foto(id_, arq, kicker, titulo, sub, pos="center 35%", escuro=False):
    fundo = PR if escuro else AM
    cor = "#fff" if escuro else PR
    return peca(id_, f'''{"" if escuro else LISTRAS}
      <div style="position:absolute;left:60px;top:70px">{tag(kicker, 34, inv=not escuro)}</div>
      <div class="A" style="position:absolute;left:60px;right:60px;top:150px;font-size:112px;color:{cor}">{titulo}</div>
      <div style="position:absolute;left:60px;right:60px;top:{430 if titulo.count("<br>") else 300}px">{foto(arq, 960, 620, pos, -1.5)}</div>
      <div style="position:absolute;left:60px;right:60px;top:1110px;font-weight:700;font-size:34px;line-height:1.3;color:{cor}">{sub}</div>
      {rodape(escuro)}''', fundo=fundo)


def post_frase(id_, linhas, sub, escuro=True):
    fundo = PR if escuro else AM
    cor = "#fff" if escuro else PR
    return peca(id_, f'''{"" if escuro else LISTRAS}
      <img src="{F("silhueta.png")}" style="position:absolute;right:-60px;top:120px;width:620px;opacity:{.10 if escuro else .12};{"filter:invert(1)" if escuro else ""}">
      <div class="A" style="position:absolute;left:70px;right:70px;top:260px;font-size:150px;line-height:.98;color:{cor}">{linhas}</div>
      <div style="position:absolute;left:70px;right:120px;top:1000px;font-weight:700;font-size:38px;line-height:1.3;color:{cor}">{sub}</div>
      {rodape(escuro)}''', fundo=fundo)


A_ = f'<span style="color:{AM}">'
posts = [
    post_frase("post01", f"A ACADEMIA<br>VAI ATÉ<br>{A_}VOCÊ.</span>",
               "A JL Fitness leva atividade física para dentro do seu condomínio e da sua empresa."),
    post_foto("post02", "f_grupo1.jpg", "Condomínios", "ACADEMIA DO PRÉDIO<br>VAZIA?", "A gente monta a turma, leva o professor e faz o espaço ganhar vida."),
    post_foto("post03", "f_senhoras.jpg", "Para todas as idades", "MOVIMENTO<br>NÃO TEM IDADE", "Aulas pensadas para cada turma, do jovem ao 60+.", "center 40%"),
    post_foto("post04", "f_leques.jpg", "Dança", "DANÇAR TAMBÉM<br>É TREINAR", "Coreografia, alegria e suor na medida certa.", "center 30%", escuro=True),
    post_foto("post05", "f_along.jpg", "Alongamento", "ALONGAR<br>FAZ PARTE", "Mais mobilidade e bem-estar para o dia a dia.", "center 50%"),
    post_foto("post06", "f_grupo2.jpg", "Acompanhamento", "PROFESSOR<br>DO SEU LADO", "Orientação de perto em cada aula, para treinar com segurança.", "center 35%", escuro=True),
    post_foto("post07", "f_turma_natal.jpg", "Em grupo", "TREINO EM TURMA<br>RENDE MAIS", "Os vizinhos viram parceiros de treino — e a motivação vem junto.", "center 40%"),
    post_frase("post08", f"SÍNDICO,<br>LEVE A JL<br>{A_}PRO SEU<br>PRÉDIO.</span>",
               "Aulas em grupo no salão, na academia ou na quadra do condomínio. Chama no direct.", escuro=True),
    peca("post09", f'''{LISTRAS}
      <div style="position:absolute;left:60px;top:70px">{tag("Onde estamos", 34, inv=True)}</div>
      <div class="A" style="position:absolute;left:60px;right:60px;top:160px;font-size:130px;color:{PR}">BRASÍLIA<br>E GOIÂNIA</div>
      <div style="position:absolute;left:60px;right:60px;top:460px;display:flex;flex-direction:column;gap:26px">
        {"".join(f'<div style="display:flex;align-items:center;gap:22px;background:{PR};color:#fff;border-radius:22px;padding:30px 36px"><div style="width:20px;height:20px;border-radius:50%;background:{AM}"></div><div style="font-weight:800;font-size:44px">{t}</div></div>' for t in ("Condomínios", "Empresas", "Na comodidade do seu lar"))}
      </div>
      <div style="position:absolute;left:60px;right:60px;top:1000px;font-weight:700;font-size:36px;line-height:1.3;color:{PR}">📍 Brasília/DF · Goiânia/GO<br>Levando atividade física até onde você está.</div>
      {rodape()}'''),
]

# ---------------------------------------------------------------- CARROSSÉIS (6 x 5 lâminas)
def capa(id_, titulo, sub, arq=None, escuro=False):
    fundo = PR if escuro else AM
    cor = "#fff" if escuro else PR
    img = f'<div style="position:absolute;right:60px;bottom:170px">{foto(arq, 520, 560, "center 35%", 3)}</div>' if arq else ""
    return peca(id_, f'''{"" if escuro else LISTRAS}{img}
      <div class="A" style="position:absolute;left:60px;right:{560 if arq else 60}px;top:120px;font-size:{120 if arq else 140}px;color:{cor}">{titulo}</div>
      <div style="position:absolute;left:60px;bottom:180px">{tag(sub, 36, inv=not escuro)}</div>
      {rodape(escuro)}''', fundo=fundo)


def lamina(id_, n, titulo, texto, escuro=False, arq=None):
    fundo = PR if escuro else "#fff"
    cor = "#fff" if escuro else PR
    img = f'<div style="position:absolute;left:60px;right:60px;top:760px">{foto(arq, 960, 380, "center 35%", 0, 10)}</div>' if arq else ""
    return peca(id_, f'''
      <div class="A" style="position:absolute;left:60px;top:70px;font-size:220px;color:{AM};-webkit-text-stroke:6px {PR};line-height:1">{n:02d}</div>
      <div class="A" style="position:absolute;left:60px;right:60px;top:330px;font-size:104px;color:{cor}">{titulo}</div>
      <div style="position:absolute;left:60px;right:60px;top:{560 if titulo.count("<br>") == 0 else 640}px;font-weight:600;font-size:40px;line-height:1.38;color:{cor}">{texto}</div>
      {img if arq else f'<img src="{F("silhueta.png")}" style="position:absolute;right:-40px;bottom:120px;width:560px;opacity:.08;{"filter:invert(1)" if escuro else ""}">'}{rodape(escuro)}''', fundo=fundo)


def cta(id_, titulo, sub):
    return peca(id_, f'''{LISTRAS}
      <div style="position:absolute;left:0;right:0;top:180px;text-align:center"><img src="{F("silhueta.png")}" style="width:380px"></div>
      <div class="A" style="position:absolute;left:60px;right:60px;top:520px;text-align:center;font-size:120px;color:{PR}">{titulo}</div>
      <div style="position:absolute;left:0;right:0;top:830px;text-align:center">{tag(sub, 46, inv=True)}</div>
      <div style="position:absolute;left:0;right:0;top:980px;text-align:center;font-weight:800;font-size:34px;color:{PR}">{IG}</div>
      {rodape()}''')


carrosseis = {
    "c1_motivos_condominio": [
        capa("c1_1", "5 MOTIVOS PRA TREINAR NO SEU CONDOMÍNIO", "Arrasta pro lado →", "f_grupo1.jpg"),
        lamina("c1_2", 1, "ZERO TRÂNSITO", "Desceu o elevador, chegou na aula. O tempo que você perderia no caminho vira treino."),
        lamina("c1_3", 2, "OS VIZINHOS VIRAM<br>PARCEIROS", "Treinar em turma com quem mora perto deixa tudo mais leve — e ninguém falta.", arq="f_grupo2.jpg"),
        lamina("c1_4", 3, "PROFESSOR DO SEU LADO", "Orientação de perto, aula pensada para o grupo e mais segurança em cada movimento.", escuro=True),
        cta("c1_5", "LEVE A JL<br>PRO SEU PRÉDIO", "Chama no direct"),
    ],
    "c2_sindico": [
        capa("c2_1", "SÍNDICO: COMO LEVAR AULAS PRO SEU PRÉDIO", "Passo a passo →", None, escuro=True),
        lamina("c2_2", 1, "OUÇA OS MORADORES", "Uma enquete rápida no grupo do prédio já mostra quem quer treinar e em qual horário."),
        lamina("c2_3", 2, "ESCOLHA O ESPAÇO", "Salão de festas, academia ou quadra: a JL Fitness se adapta ao espaço que o condomínio tem.", arq="f_quadra.jpg"),
        lamina("c2_4", 3, "CHAME A JL FITNESS", "A gente entende o perfil dos moradores e monta a proposta de aulas para o seu condomínio.", escuro=True),
        cta("c2_5", "BORA MOVIMENTAR<br>SEU CONDOMÍNIO?", "Fale com a gente"),
    ],
    "c3_alongamento": [
        capa("c3_1", "POR QUE ALONGAR TODO DIA?", "Arrasta pro lado →", "f_along.jpg"),
        lamina("c3_2", 1, "MAIS MOBILIDADE", "Alongar com regularidade ajuda o corpo a se mover com mais liberdade no dia a dia."),
        lamina("c3_3", 2, "MENOS TENSÃO", "Aquele peso no pescoço e nos ombros depois de um dia sentado? Alongar ajuda a soltar."),
        lamina("c3_4", 3, "MAIS BEM-ESTAR", "Poucos minutos de movimento já fazem diferença na disposição.", escuro=True),
        cta("c3_5", "ALONGAMENTO<br>NA JL FITNESS", "Chama no direct"),
    ],
    "c4_idades": [
        capa("c4_1", "MOVIMENTO EM TODAS AS IDADES", "Arrasta pro lado →", "f_senhoras.jpg"),
        lamina("c4_2", 1, "PRA QUEM ESTÁ<br>COMEÇANDO", "Ninguém precisa chegar pronto. A aula se adapta ao seu ritmo."),
        lamina("c4_3", 2, "PRA QUEM QUER<br>SE DIVERTIR", "Dança e aulas em grupo: treino que parece encontro de amigos.", arq="f_leques.jpg"),
        lamina("c4_4", 3, "PRA MELHOR IDADE", "Atividade orientada e com cuidado, respeitando o limite de cada um.", escuro=True),
        cta("c4_5", "TEM LUGAR<br>PRA VOCÊ", "Fale com a gente"),
    ],
    "c5_empresas": [
        capa("c5_1", "ATIVIDADE FÍSICA NA SUA EMPRESA", "Arrasta pro lado →", None, escuro=True),
        lamina("c5_2", 1, "PAUSA ATIVA", "Alguns minutos de movimento no meio do expediente renovam a energia da equipe."),
        lamina("c5_3", 2, "EQUIPE MAIS UNIDA", "Atividade em grupo aproxima as pessoas e melhora o clima no trabalho.", arq="f_turma_natal.jpg"),
        lamina("c5_4", 3, "SEM SAIR DO TRABALHO", "A JL Fitness vai até a empresa. Ninguém precisa se deslocar.", escuro=True),
        cta("c5_5", "LEVE A JL PRA<br>SUA EMPRESA", "Chama no direct"),
    ],
    "c6_como_funciona": [
        capa("c6_1", "COMO FUNCIONA A JL FITNESS", "Arrasta pro lado →", "f_grupo2.jpg"),
        lamina("c6_2", 1, "VOCÊ CHAMA", "Morador, síndico ou empresa: manda uma mensagem no direct contando o que precisa."),
        lamina("c6_3", 2, "A GENTE ENTENDE", "Conhecemos o espaço, o público e os horários para montar as aulas certas."),
        lamina("c6_4", 3, "O PROFESSOR VAI ATÉ VOCÊ", "Aulas em grupo, dança e alongamento no seu prédio ou na sua empresa.", escuro=True, arq="f_leques.jpg"),
        cta("c6_5", "BORA SE<br>MOVIMENTAR!", "Fale com a gente"),
    ],
}

# ---------------------------------------------------------------- STORIES (10)
def story(id_, html, fundo=AM):
    return peca(id_, html, 1080, 1920, fundo)


def enquete(p, a, b):
    return (f'<div style="background:#fff;border-radius:34px;padding:40px;box-shadow:0 20px 50px rgba(0,0,0,.25);width:820px;margin:0 auto">'
            f'<div style="font-weight:800;font-size:44px;color:{PR};text-align:center;margin-bottom:28px">{p}</div>'
            f'<div style="display:flex;gap:20px">{"".join(f"<div style=&quot;flex:1;border:3px solid #ddd;border-radius:20px;padding:26px;text-align:center;font-weight:900;font-size:44px;color:{PR}&quot;>{x}</div>" for x in (a, b))}</div></div>').replace("&quot;", '"')


def caixinha(p):
    return (f'<div style="background:#fff;border-radius:34px;overflow:hidden;width:820px;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,.25)">'
            f'<div style="background:{PR};color:#fff;font-weight:800;font-size:40px;padding:34px;text-align:center">{p}</div>'
            f'<div style="padding:34px;text-align:center;font-weight:600;font-size:34px;color:#999">Responda aqui…</div></div>')


S_TOP = 260
stories = [
    story("s01", f'''{LISTRAS}<div class="A" style="position:absolute;left:70px;right:70px;top:{S_TOP}px;font-size:150px;color:{PR}">BOM DIA!<br>JÁ SE<br>MOVIMENTOU<br>HOJE?</div>
        <div style="position:absolute;left:0;right:0;top:1200px">{enquete("Bora treinar hoje?", "BORA! 💪", "AMANHÃ 😅")}</div>{rodape()}'''),
    story("s02", f'''<div style="position:absolute;inset:0;background:url({F("f_grupo1.jpg")}) center 35%/cover"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.75))"></div>
        <div style="position:absolute;left:70px;right:70px;top:1180px">{tag("Bastidores", 40)}</div>
        <div class="A" style="position:absolute;left:70px;right:70px;top:1270px;font-size:120px;color:#fff">TURMA<br>REUNIDA!</div>{rodape(True)}''', PR),
    story("s03", f'''<div class="A" style="position:absolute;left:70px;right:70px;top:{S_TOP}px;font-size:140px;color:#fff">VOCÊ USA A<br>ACADEMIA DO<br>{A_}SEU PRÉDIO?</span></div>
        <div style="position:absolute;left:0;right:0;top:1150px">{enquete("Seja sincero 👀", "SEMPRE", "NUNCA")}</div>{rodape(True)}''', PR),
    story("s04", f'''{LISTRAS}<div class="A" style="position:absolute;left:70px;right:70px;top:{S_TOP}px;font-size:140px;color:{PR}">QUAL AULA<br>VOCÊ QUER<br>NO SEU<br>PRÉDIO?</div>
        <div style="position:absolute;left:0;right:0;top:1150px">{caixinha("Me conta aqui 👇")}</div>{rodape()}'''),
    story("s05", f'''<div style="position:absolute;left:0;right:0;top:220px;display:flex;justify-content:center">{foto("f_leques.jpg", 860, 900, "center 30%", -2)}</div>
        <div class="A" style="position:absolute;left:70px;right:70px;top:1210px;font-size:130px;color:{PR}">DANÇA É<br>TREINO!</div>
        <div style="position:absolute;left:70px;top:1500px">{tag("Manda pra quem dança com você", 34, inv=True)}</div>{rodape()}'''),
    story("s06", f'''<div class="A" style="position:absolute;left:70px;right:70px;top:{S_TOP}px;font-size:120px;color:#fff">DICA<br>{A_}RÁPIDA</span></div>
        <div style="position:absolute;left:70px;right:70px;top:620px;font-weight:700;font-size:50px;line-height:1.35;color:#fff">Passou o dia sentado?<br><br>Levante a cada hora, alongue pescoço e ombros por 1 minuto e caminhe um pouco.<br><br>Seu corpo agradece. 💛</div>{rodape(True)}''', PR),
    story("s07", f'''{LISTRAS}<div class="A" style="position:absolute;left:70px;right:70px;top:{S_TOP}px;font-size:130px;color:{PR}">SÍNDICO,<br>ESSA É<br>PRA VOCÊ</div>
        <div style="position:absolute;left:70px;right:70px;top:820px;font-weight:700;font-size:46px;line-height:1.35;color:{PR}">Aulas em grupo no salão, na academia ou na quadra do condomínio.</div>
        <div style="position:absolute;left:0;right:0;top:1180px;text-align:center">{tag("Chama no direct →", 56, inv=True)}</div>{rodape()}'''),
    story("s08", f'''<div style="position:absolute;inset:0;background:url({F("f_senhoras.jpg")}) center 40%/cover"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.75))"></div>
        <div class="A" style="position:absolute;left:70px;right:70px;top:1220px;font-size:120px;color:#fff">IDADE É SÓ<br>{A_}UM NÚMERO.</span></div>{rodape(True)}''', PR),
    story("s09", f'''<div class="A" style="position:absolute;left:70px;right:70px;top:{S_TOP}px;font-size:120px;color:#fff">VOCÊ PREFERE<br>TREINAR…</div>
        <div style="position:absolute;left:0;right:0;top:820px">{enquete("De manhã ou à noite?", "MANHÃ ☀️", "NOITE 🌙")}</div>{rodape(True)}''', PR),
    story("s10", f'''{LISTRAS}<div style="position:absolute;left:0;right:0;top:300px;text-align:center"><img src="{F("silhueta.png")}" style="width:520px"></div>
        <div class="A" style="position:absolute;left:60px;right:60px;top:760px;text-align:center;font-size:150px;color:{PR}">BORA SE<br>MOVIMENTAR!</div>
        <div style="position:absolute;left:0;right:0;top:1140px;text-align:center">{tag("Fale com a gente no direct", 46, inv=True)}</div>{rodape()}'''),
]

# ---------------------------------------------------------------- ANÚNCIOS (2)
anuncios = [
    peca("ad1_morador_aguas_claras", f'''{LISTRAS}
      <div style="position:absolute;left:60px;top:70px">{tag("Águas Claras", 40, inv=True)}</div>
      <div class="A" style="position:absolute;left:60px;right:60px;top:160px;font-size:118px;color:{PR}">ACADEMIA DO PRÉDIO<br>VIVE VAZIA?</div>
      <div style="position:absolute;left:60px;top:440px">{foto("f_grupo1.jpg", 960, 540, "center 35%", -1.5)}</div>
      <div class="A" style="position:absolute;left:60px;right:60px;top:1030px;font-size:72px;color:{PR}">AULAS EM GRUPO DENTRO DO SEU CONDOMÍNIO</div>
      <div style="position:absolute;left:60px;top:1190px">{tag("Mostre pro seu síndico →", 38, inv=True)}</div>'''),
    peca("ad2_sindico", f'''
      <div style="position:absolute;left:60px;top:70px">{tag("Para síndicos", 40)}</div>
      <div class="A" style="position:absolute;left:60px;right:60px;top:160px;font-size:124px;color:#fff">VALORIZE SEU<br>{A_}CONDOMÍNIO.</span></div>
      <div style="position:absolute;left:60px;top:450px">{foto("f_grupo2.jpg", 960, 520, "center 35%", 1.5)}</div>
      <div style="position:absolute;left:60px;right:60px;top:1010px;font-weight:700;font-size:40px;line-height:1.3;color:#fff">Aulas em grupo, dança e alongamento para os moradores — no espaço que o prédio já tem.</div>
      <div style="position:absolute;left:60px;top:1180px">{tag("Peça sua proposta →", 40)}</div>''', fundo=PR),
]

CSS = '''
@font-face { font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#333; font-family:M, sans-serif; }
.pc { position:relative; overflow:hidden; margin:20px; }
.A { font-family:Anton; text-transform:uppercase; line-height:.97; }
.tag, .tagP { display:inline-block; font-family:Anton; text-transform:uppercase; padding:8px 26px 12px; transform:skewX(-10deg); line-height:1; }
.tag { background:#FFE100; color:#0B0B0B; } .tagP { background:#0B0B0B; color:#FFE100; }
.tag > span, .tagP > span { display:inline-block; transform:skewX(10deg); }
'''

ids = [("posts", p.split('id="')[1].split('"')[0]) for p in posts]
for nome, lam in carrosseis.items():
    ids += [(f"carrosseis/{nome}", l.split('id="')[1].split('"')[0]) for l in lam]
ids += [("stories", s.split('id="')[1].split('"')[0]) for s in stories]
ids += [("anuncios", a.split('id="')[1].split('"')[0]) for a in anuncios]
corpo = "".join(posts) + "".join("".join(v) for v in carrosseis.values()) + "".join(stories) + "".join(anuncios)
(ROOT / "pack.html").write_text(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{corpo}</body></html>')

js = "const { chromium } = require('playwright'); const path = require('path');\n(async () => {\n" \
     " const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });\n" \
     " const p = await b.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 1 });\n" \
     " await p.goto('file://' + path.resolve('pack.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);\n" \
     f" const L = {[[d, i] for d, i in ids]};\n" \
     " for (const [d, i] of L) { await (await p.$('#' + i)).screenshot({ path: path.join('saida', d, i + '.png') }); }\n" \
     " await b.close();\n})();\n"
(ROOT / "shot_pack.js").write_text(js)
for d in {d for d, _ in ids}:
    (OUT / d).mkdir(parents=True, exist_ok=True)
subprocess.run(f"cd {ROOT} && NODE_PATH=$(npm root -g) node shot_pack.js", shell=True, check=True)
print(len(ids), "peças")
