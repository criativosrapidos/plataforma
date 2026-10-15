"""Gera as pecas do Instagram (grade de 9 posts + 6 carrosseis) em PNG 1080x1350.

Uso: python3 instagram.py   (precisa de node + playwright: PW=$(npm root -g)/playwright)
Escreve instagram/fonte/pecas.html e renderiza em instagram/grade e instagram/carrosseis.
"""
import json
import os
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FONTE = RAIZ / "instagram" / "fonte"

SIMBOLO = ('<svg class="sim" viewBox="0 0 120 112"><path d="M60 104 C20 78 6 58 6 38 C6 20 20 8 36 8 C47 8 55 14 60 22 '
           'C65 14 73 8 84 8 C100 8 114 20 114 38 C114 58 100 78 60 104 Z" fill="#FF4F79"/>'
           '<path d="M50 36 L50 72 L80 54 Z" fill="#FFF8F5"/></svg>')
CORACAO = ('<svg class="cor" viewBox="0 0 120 112"><path d="M60 104 C20 78 6 58 6 38 C6 20 20 8 36 8 C47 8 55 14 60 22 '
           'C65 14 73 8 84 8 C100 8 114 20 114 38 C114 58 100 78 60 104 Z" fill="currentColor"/></svg>')


def logo(cls=""):
    return f'<span class="logo {cls}">{SIMBOLO}<span>videosmimo</span></span>'


def bokeh(n=7, seed=1):
    import random
    r = random.Random(seed)
    out = []
    for _ in range(n):
        s = r.randint(90, 260)
        cor = r.choice(["var(--rosa)", "var(--manteiga)", "var(--rosa)"])
        out.append(f'<i class="bk" style="width:{s}px;height:{s}px;left:{r.randint(-80, 1000)}px;'
                   f'top:{r.randint(-80, 1250)}px;background:{cor};opacity:{r.uniform(.10, .26):.2f}"></i>')
    return "".join(out)


def celular(img, w=420):
    return f'<div class="celular" style="width:{w}px"><img src="img/{img}"></div>'


def peca(id_, tema, corpo, rodape=True, contador=None, deco=True, seed=1):
    cont = f'<span class="cont">{contador}</span>' if contador else ""
    rod = (f'<footer>{logo("pq")}<span class="arroba">@videosmimo</span>{cont}</footer>' if rodape else "")
    dec = bokeh(seed=seed) if deco else ""
    return f'<section class="peca {tema}" id="{id_}">{dec}<div class="conteudo">{corpo}</div>{rod}</section>'


def mimo_card(nome, preco, itens, destaque=False):
    lis = "".join(f"<li>{i}</li>" for i in itens)
    selo = '<span class="selo">mais pedido</span>' if destaque else ""
    return (f'<div class="mimo {"dest" if destaque else ""}">{selo}<span class="mao">Mimo</span><h3>{nome}</h3>'
            f'<div class="preco"><small>R$</small>{preco}</div><ul>{lis}</ul></div>')


# ---------------------------------------------------------------- GRADE (9 posts)
GRADE = [
    ("g1", "escuro", f'<div class="centro">{logo("gr escuro")}<h1 class="xl">Suas fotos viram<br>um presente que<br><em>emociona.</em></h1></div>'),
    ("g2", "blush", f'<div class="lado"><div><span class="mao rosa xl2">assim fica</span><h2>Um vídeo com as fotos, o nome e a música de vocês.</h2></div>{celular("demo-3.0.jpg", 400)}</div>'),
    ("g3", "escuro", '<div class="centro"><span class="mao manteiga xl2">a partir de</span><div class="mega">R$ 39,90</div>'
                     '<p class="sub">pronto em até 24h · direto no seu WhatsApp</p></div>'),
    ("g4", "blush", '<div class="centro esq"><h1 class="xl riscado">Flores murcham.</h1><h1 class="xl riscado">Chocolate acaba.</h1>'
                    '<h1 class="xl"><em>Um vídeo fica pra sempre.</em></h1></div>'),
    ("g5", "rosa", f'<div class="centro">{SIMBOLO.replace("#FF4F79", "TMP").replace("#FFF8F5", "#FF4F79").replace("TMP", "#FFF8F5").replace("class=\"sim\"", "class=\"sim gigante\"")}'
                   '<h1 class="l branco">Você manda as fotos.<br>A gente faz o resto.</h1></div>'),
    ("g6", "leite", '<div class="centro"><span class="mao rosa xl2">pra quem é?</span><div class="chips">'
                    + "".join(f"<span>{o}</span>" for o in ["Aniversário", "Namorados", "Dia das Mães", "Dia dos Pais", "Melhor amiga",
                                                             "Casamento", "Bodas", "Formatura", "Chefe e equipe", "Natal", "Só porque sim"])
                    + "</div></div>"),
    ("g7", "escuro", '<div class="centro"><h1 class="l">Quando foi a última vez que você disse</h1>'
                     '<div class="mao rosa xxl">"eu te amo"</div><h1 class="l">pra quem mais importa?</h1></div>'),
    ("g8", "blush", '<div class="centro"><h2 class="titulo">Como funciona</h2><ol class="passos">'
                    '<li><b>1</b><div><h3>Escolha o mimo</h3><p>30 s, 1 min ou 2 min</p></div></li>'
                    '<li><b>2</b><div><h3>Mande as fotos</h3><p>pelo WhatsApp, com uma mensagem sua</p></div></li>'
                    '<li><b>3</b><div><h3>Receba e emocione</h3><p>vídeo pronto em até 24h</p></div></li></ol></div>'),
    ("g9", "escuro", f'<div class="centro"><h1 class="xl">Faça o seu<br><em>Vídeos Mimo.</em></h1>'
                     f'<div class="botao">Peça pelo link na bio</div><p class="sub">Carinho R$ 39,90 · Especial R$ 59,90 · Inesquecível R$ 79,90</p></div>'),
]

# ---------------------------------------------------------------- CARROSSEIS
def capa(titulo, sub, tema="escuro", extra=""):
    return f'<div class="centro"><h1 class="xl">{titulo}</h1><p class="sub grande">{sub}</p>{extra}<div class="arraste">arraste →</div></div>'


def slide_num(n, titulo, texto, extra=""):
    return f'<div class="centro esq"><div class="num">{n}</div><h2 class="xl">{titulo}</h2><p class="texto">{texto}</p>{extra}</div>'


def cta(titulo="Peça o seu Vídeos Mimo", sub="link na bio · pronto em até 24h"):
    return f'<div class="centro">{SIMBOLO.replace("class=\"sim\"", "class=\"sim medio\"")}<h1 class="xl">{titulo}</h1><div class="botao">{sub}</div></div>'


CARROSSEIS = {
    "c1-como-funciona": [
        ("escuro", capa("Como funciona o<br><em>Vídeos Mimo</em>", "3 passos e um presente que ninguém esquece")),
        ("blush", slide_num("1", "Escolha o seu mimo", "Carinho, Especial ou Inesquecível. Muda o tempo do vídeo e quantas fotos cabem.",
                            '<div class="mini3"><span>30 s · R$ 39,90</span><span class="d">1 min · R$ 59,90</span><span>2 min · R$ 79,90</span></div>')),
        ("leite", slide_num("2", "Mande as fotos", "Direto do celular, pelo WhatsApp. Se quiser, mande uma frase pra cada foto e a mensagem do final.",
                            '<div class="tiras"><img src="img/foto_01.jpg"><img src="img/foto_02.jpg"><img src="img/foto_03.jpg"><img src="img/foto_04.jpg"></div>')),
        ("blush", slide_num("3", "A gente cria", "Abertura com o nome da pessoa, fotos com movimento, legendas e uma música original feita só pro seu vídeo.")),
        ("escuro", f'<div class="lado"><div><div class="num">4</div><h2 class="l">Receba em até 24h</h2><p class="texto">Pronto pra mandar no WhatsApp ou postar nos Stories.</p></div>{celular("demo-9.0.jpg", 380)}</div>'),
        ("rosa", cta()),
    ],
    "c2-qual-mimo": [
        ("escuro", capa("Qual mimo<br>combina com <em>você</em>?", "os 3 tamanhos de carinho")),
        ("blush", '<div class="centro">' + mimo_card("Carinho", "39,90", ["até 10 fotos", "vídeo de 30 segundos", "nome e ocasião na abertura",
                                                                         "trilha da nossa biblioteca", "entrega em até 24h"]) +
         '<p class="nota">Pra quem quer surpreender rápido.</p></div>'),
        ("blush", '<div class="centro">' + mimo_card("Especial", "59,90", ["até 20 fotos", "vídeo de 1 minuto", "legenda em cada foto",
                                                                          "mensagem final sua", "você escolhe a música", "1 ajuste grátis"], True) +
         '<p class="nota">O favorito. Conta a história inteira.</p></div>'),
        ("blush", '<div class="centro">' + mimo_card("Inesquecível", "79,90", ["até 30 fotos", "vídeo de até 2 minutos", "trilha exclusiva",
                                                                              "versão Stories + feed", "2 ajustes grátis", "prioridade: até 6h"]) +
         '<p class="nota">Pra data que não pode passar em branco.</p></div>'),
        ("leite", '<div class="centro"><h2 class="titulo">Na dúvida?</h2><table class="tab"><tr><th></th><th>Carinho</th><th class="d">Especial</th><th>Inesquecível</th></tr>'
                  '<tr><td>Fotos</td><td>10</td><td class="d">20</td><td>30</td></tr><tr><td>Duração</td><td>30 s</td><td class="d">1 min</td><td>2 min</td></tr>'
                  '<tr><td>Legendas</td><td>–</td><td class="d">✓</td><td>✓</td></tr><tr><td>Ajustes</td><td>–</td><td class="d">1</td><td>2</td></tr>'
                  '<tr><td>Entrega</td><td>24h</td><td class="d">24h</td><td>6h</td></tr><tr class="pr"><td>Preço</td><td>39,90</td><td class="d">59,90</td><td>79,90</td></tr></table></div>'),
        ("rosa", cta("Escolheu?", "manda as fotos · link na bio")),
    ],
    "c3-ocasioes": [
        ("escuro", capa("5 ocasiões que<br>pedem um <em>Vídeos Mimo</em>", "salva pra não esquecer")),
        ("blush", slide_num("1", "Aniversário", "Um ano inteiro de lembranças em 1 minuto. Abre com o nome da pessoa e termina com a sua mensagem.")),
        ("leite", slide_num("2", "Namoro e casamento", "Do primeiro encontro até hoje. Ela vai assistir mil vezes.")),
        ("blush", slide_num("3", "Pai e mãe, mesmo de longe", "Quando a saudade aperta e a ligação não basta. Fotos da infância até hoje.")),
        ("leite", slide_num("4", "Melhor amiga", "Aquela que está em todas as fotos da sua galeria. Ela vai chorar, amiga.")),
        ("rosa", cta("E a 5ª: só porque sim", "nem precisa de data · link na bio")),
    ],
    "c4-dicas-fotos": [
        ("escuro", capa("Como escolher as<br>fotos <em>certas</em>", "4 dicas pra deixar o vídeo ainda mais emocionante")),
        ("blush", slide_num("1", "Conte em ordem", "Comece pela foto mais antiga e termine na mais recente. A emoção vai crescendo junto.")),
        ("leite", slide_num("2", "Misture os momentos", "Foto posada, foto espontânea, careta, viagem, dia comum. O dia comum é o que mais emociona.",
                            '<div class="tiras"><img src="img/foto_05.jpg"><img src="img/foto_06.jpg"><img src="img/foto_07.jpg"><img src="img/foto_08.jpg"></div>')),
        ("blush", slide_num("3", "Foto antiga vale ouro", "Não tem a foto digital? Tira foto da foto impressa, com boa luz. A gente ajusta pro vídeo.")),
        ("leite", slide_num("4", "Legenda curta", "Uma frase por foto é suficiente: \"nossa primeira viagem\", \"o dia que você nasceu\".")),
        ("rosa", cta("Separou as fotos?", "manda pra gente · link na bio")),
    ],
    "c5-por-que-video": [
        ("escuro", '<div class="centro esq"><h1 class="xl riscado">Flores murcham.</h1><h1 class="xl riscado">Chocolate acaba.</h1>'
                   '<h1 class="xl"><em>E o vídeo?</em></h1><div class="arraste">arraste →</div></div>'),
        ("blush", slide_num("1", "Fica pra sempre", "Fica no celular, no WhatsApp, na nuvem. Daqui a 10 anos ainda dá pra assistir.")),
        ("leite", slide_num("2", "Dá pra rever mil vezes", "Presente comum a gente usa uma vez. Vídeo a gente assiste de novo quando bate a saudade.")),
        ("blush", slide_num("3", "Ninguém tem igual", "São as fotos de vocês, o nome dela, a sua mensagem e uma música feita só pra esse vídeo.")),
        ("leite", slide_num("4", "Chega em qualquer lugar", "Mora longe? Chega no mesmo segundo, pelo WhatsApp. Sem frete e sem atraso.")),
        ("rosa", cta("Presente que fica", "a partir de R$ 39,90 · link na bio")),
    ],
    "c6-mensagens": [
        ("escuro", capa("Mensagens prontas<br>pro <em>final do vídeo</em>", "salva e usa a sua")),
        ("blush", '<div class="centro"><span class="mao rosa xl2">pra mãe</span><blockquote>"Tudo o que eu sou começou com você. Obrigado por cada dia, mãe."</blockquote></div>'),
        ("leite", '<div class="centro"><span class="mao rosa xl2">pro amor</span><blockquote>"De todas as fotos da minha vida, as melhores têm você."</blockquote></div>'),
        ("blush", '<div class="centro"><span class="mao rosa xl2">pra melhor amiga</span><blockquote>"Você esteve em todos os capítulos. Que venham os próximos, juntas."</blockquote></div>'),
        ("leite", '<div class="centro"><span class="mao rosa xl2">pro pai</span><blockquote>"Eu nem sempre digo, mas você é o meu maior exemplo. Te amo, pai."</blockquote></div>'),
        ("rosa", cta("Escolheu a sua?", "a gente coloca no vídeo · link na bio")),
    ],
}

CSS = """
@font-face { font-family: "Bricolage Grotesque"; font-weight: 800; src: url("../../gerador/fontes/Bricolage-ExtraBold.ttf"); }
@font-face { font-family: "Bricolage Grotesque"; font-weight: 500; src: url("../../gerador/fontes/Bricolage-Medium.ttf"); }
@font-face { font-family: "Caveat"; font-weight: 700; src: url("../../gerador/fontes/Caveat-Bold.ttf"); }
@font-face { font-family: "Figtree"; font-weight: 400; src: url("../../gerador/fontes/Figtree-400.ttf"); }
@font-face { font-family: "Figtree"; font-weight: 600; src: url("../../gerador/fontes/Figtree-600.ttf"); }
@font-face { font-family: "Figtree"; font-weight: 700; src: url("../../gerador/fontes/Figtree-700.ttf"); }
:root { --ameixa:#3A0D2E; --rosa:#FF4F79; --manteiga:#FFC857; --blush:#FFE9EE; --leite:#FFF8F5;
  --fd:"Bricolage Grotesque",sans-serif; --fm:"Caveat",cursive; --ft:"Figtree",sans-serif; }
* { box-sizing:border-box; margin:0; padding:0; }
body { background:#888; font-family:var(--ft); }
.peca { width:1080px; height:1350px; position:relative; overflow:hidden; display:flex; flex-direction:column; margin-bottom:20px; }
.escuro { background:var(--ameixa); color:var(--leite); } .blush { background:var(--blush); color:var(--ameixa); }
.leite { background:var(--leite); color:var(--ameixa); } .rosa { background:var(--rosa); color:var(--leite); }
.bk { position:absolute; border-radius:50%; filter:blur(28px); }
.leite .bk, .blush .bk { opacity:.18 !important; } .rosa .bk { background:var(--leite) !important; opacity:.14 !important; }
.conteudo { position:relative; flex:1; display:flex; padding:110px 96px 40px; }
.centro { margin:auto; text-align:center; display:flex; flex-direction:column; align-items:center; gap:34px; width:100%; }
.centro.esq { text-align:left; align-items:flex-start; }
.lado { margin:auto; display:flex; align-items:center; gap:56px; width:100%; }
.lado > div:first-child { flex:1; display:flex; flex-direction:column; gap:28px; }
h1, h2, h3 { font-family:var(--fd); font-weight:800; letter-spacing:-0.03em; line-height:1.02; }
.xl { font-size:104px; } .l { font-size:78px; } h2 { font-size:64px; } .titulo { font-size:84px; }
em { font-style:normal; color:var(--rosa); } .rosa em { color:var(--manteiga); }
.mao { font-family:var(--fm); font-weight:700; line-height:1; } .xl2 { font-size:96px; } .xxl { font-size:150px; }
.mao.rosa { color:var(--rosa); background:none; } .mao.manteiga { color:var(--manteiga); } .branco { color:var(--leite); }
.mega { font-family:var(--fd); font-weight:800; font-size:220px; letter-spacing:-0.05em; color:var(--manteiga); line-height:.9; }
.sub { font-size:40px; opacity:.85; max-width:820px; line-height:1.3; } .sub.grande { font-size:46px; }
.texto { font-size:56px; line-height:1.32; max-width:880px; opacity:.9; }
.riscado { text-decoration:line-through; text-decoration-color:var(--rosa); text-decoration-thickness:12px; opacity:.9; }
.escuro .riscado { color:var(--leite); }
.logo { display:inline-flex; align-items:center; gap:.18em; font-family:var(--fd); font-weight:800; letter-spacing:-.035em; line-height:1; }
.logo .sim { height:.95em; width:auto; transform:translateY(.04em); }
.logo.gr { font-size:76px; } .logo.pq { font-size:34px; }
.sim.gigante { width:300px; height:auto; } .sim.medio { width:220px; height:auto; }
.rosa .sim.medio path:first-child { fill:var(--leite); } .rosa .sim.medio path:last-child { fill:var(--rosa); }
footer { position:relative; display:flex; align-items:center; gap:24px; padding:0 96px 64px; font-size:30px; }
.arroba { opacity:.7; font-weight:600; } .cont { margin-left:auto; font-weight:700; opacity:.7; }
.escuro .logo, .rosa .logo { color:var(--leite); } .blush .logo, .leite .logo { color:var(--ameixa); }
.rosa .logo .sim path:first-child { fill:var(--leite); } .rosa .logo .sim path:last-child { fill:var(--rosa); }
.celular { flex:none; background:#12030F; border-radius:56px; padding:16px; box-shadow:0 30px 60px -20px rgba(58,13,46,.5); transform:rotate(3deg); }
.celular img { display:block; width:100%; border-radius:42px; }
.chips { display:flex; flex-wrap:wrap; justify-content:center; gap:20px; max-width:880px; }
.chips span { font-family:var(--fd); font-weight:800; font-size:44px; padding:18px 34px; border-radius:999px; border:4px solid var(--ameixa); }
.chips span:nth-child(3n+1) { background:var(--rosa); border-color:var(--rosa); color:var(--leite); }
.passos { list-style:none; display:flex; flex-direction:column; gap:40px; text-align:left; width:100%; }
.passos li { display:flex; gap:36px; align-items:center; }
.passos b { font-family:var(--fd); font-size:150px; color:var(--rosa); line-height:.8; width:110px; }
.passos h3 { font-size:60px; } .passos p { font-size:40px; opacity:.8; margin-top:8px; }
.botao { background:var(--rosa); color:var(--leite); font-family:var(--fd); font-weight:800; font-size:50px; padding:30px 60px; border-radius:999px; }
.rosa .botao { background:var(--ameixa); }
.num { font-family:var(--fd); font-weight:800; font-size:280px; color:var(--rosa); line-height:.8; }
.escuro .num { color:var(--manteiga); }
.arraste { font-family:var(--fm); font-size:64px; color:var(--manteiga); margin-top:20px; }
.blush .arraste, .leite .arraste { color:var(--rosa); }
.mini3 { display:flex; gap:18px; flex-wrap:wrap; }
.mini3 span { font-weight:700; font-size:36px; padding:16px 26px; border-radius:20px; background:var(--leite); }
.mini3 .d { background:var(--rosa); color:var(--leite); }
.tiras { display:flex; gap:16px; } .tiras img { width:205px; height:290px; object-fit:cover; border-radius:20px; }
.mimo { background:#fff; border-radius:44px; padding:56px 64px; width:760px; text-align:left; position:relative; box-shadow:0 30px 60px -30px rgba(58,13,46,.35); }
.mimo.dest { border:6px solid var(--rosa); }
.mimo .mao { font-size:64px; color:var(--rosa); } .mimo h3 { font-size:96px; margin-bottom:16px; }
.preco { font-family:var(--fd); font-weight:800; font-size:130px; letter-spacing:-.04em; line-height:1; margin-bottom:28px; }
.preco small { font-size:50px; vertical-align:58px; margin-right:6px; }
.mimo ul { list-style:none; display:flex; flex-direction:column; gap:14px; font-size:40px; }
.mimo li::before { content:"♥"; color:var(--rosa); margin-right:16px; }
.selo { position:absolute; top:-30px; right:50px; background:var(--manteiga); font-weight:700; font-size:30px; letter-spacing:.06em; text-transform:uppercase; padding:12px 26px; border-radius:999px; }
.nota { font-size:42px; font-weight:600; }
.tab { border-collapse:collapse; font-size:40px; width:100%; }
.tab th, .tab td { padding:22px 10px; text-align:center; border-bottom:3px solid rgba(58,13,46,.12); }
.tab th { font-family:var(--fd); font-size:42px; } .tab td:first-child { text-align:left; font-weight:700; }
.tab .d { background:var(--rosa); color:var(--leite); } .tab .pr td { font-family:var(--fd); font-weight:800; font-size:46px; }
blockquote { font-family:var(--fd); font-weight:800; font-size:82px; letter-spacing:-.03em; line-height:1.08; max-width:880px; }
"""


def montar():
    html = [f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>']
    alvos = []
    for i, (id_, tema, corpo) in enumerate(GRADE):
        html.append(peca(id_, tema, corpo, seed=i + 3))
        alvos.append(f"{id_}:grade/post-{i + 1:02d}.png")
    for nome, slides in CARROSSEIS.items():
        os.makedirs(RAIZ / "instagram" / "carrosseis" / nome, exist_ok=True)
        for j, (tema, corpo) in enumerate(slides):
            id_ = f"{nome}-{j + 1}"
            html.append(peca(id_, tema, corpo, contador=f"{j + 1}/{len(slides)}", seed=j + 11))
            alvos.append(f"{id_}:carrosseis/{nome}/{j + 1:02d}.png")
    html.append("</body></html>")
    (FONTE / "pecas.html").write_text("".join(html), encoding="utf-8")
    os.makedirs(RAIZ / "instagram" / "grade", exist_ok=True)
    pw = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip() + "/playwright"
    subprocess.run(["node", str(RAIZ / "marca" / "fonte" / "render.js"), str(FONTE / "pecas.html"),
                    str(RAIZ / "instagram")] + alvos, check=True, env={**os.environ, "PW": pw})
    print(len(alvos), "pecas")


if __name__ == "__main__":
    montar()
