"""Criativo de trafego pago — publico HOMEM, angulo relacionamento (voz de senhor aconselhando).

Uso: python3 ad_homem.py --demo ../exemplo/videomimo-demo.mp4 --voz voz.wav --musica trilha.wav --saida ad.mp4
Os tempos de LEGENDAS seguem as pausas da narracao (ffmpeg silencedetect) + VOZ_ATRASO.
"""
import argparse
import subprocess

from PIL import Image, ImageDraw

from promo_mimos import Leitor, pilula
from promo_namorados import F_BOLD, F_MAO, F_MED, fundo, marca, riscar, texto
from video import AMEIXA, FPS, H, LEITE, MANTEIGA, ROSA, W, coracao, ease, fonte

VOZ_ATRASO = 0.3
DUR = 35.6

LEGENDAS = [  # tempos da narracao (sem atraso)
    (0.0, 0.9, "Ô, meu filho..."),
    (1.36, 2.79, "Ela anda distante, né?"),
    (3.25, 4.33, "Responde seco..."),
    (4.73, 6.37, "vira pro lado na cama..."),
    (6.82, 9.39, "E você aí, achando que é cansaço."),
    (9.81, 10.28, "Não é, não."),
    (10.72, 11.89, "É falta de mimo."),
    (12.33, 14.36, "No meu tempo, a gente mandava flor."),
    (14.78, 15.35, "Hoje..."),
    (15.78, 17.18, "você manda isso aqui:"),
    (17.64, 20.14, "um vídeo com as fotos de vocês dois"),
    (20.58, 22.64, "e uma música só de vocês."),
    (23.03, 25.01, "Ela vai assistir chorando..."),
    (25.46, 28.28, "e vai te olhar diferente o fim de semana inteiro."),
    (29.14, 30.44, "Vídeos Mimo."),
    (30.89, 32.92, "A partir de R$ 39,90."),
    (33.24, 34.67, "Faz isso hoje, meu filho."),
]

CENAS = [(0.0, 7.1, "chat_frio"), (7.1, 11.0, "cansaco"), (11.0, 12.6, "mimo"), (12.6, 15.1, "flor"),
         (15.1, 23.3, "hoje"), (23.3, 29.4, "chat_quente"), (29.4, DUR, "fim")]

NOITE = (24, 8, 21)
BOLHA_ELE = (122, 32, 84)
BOLHA_ELA = (52, 30, 48)


def legenda(img, t):
    tv = t - VOZ_ATRASO
    for ini, fim, txt in LEGENDAS:
        if ini - 0.05 <= tv < fim + 0.25:
            d = ImageDraw.Draw(img)
            f = fonte(F_BOLD, 62)
            palavras, linhas, atual = txt.split(), [], ""
            for p in palavras:
                teste = (atual + " " + p).strip()
                if d.textlength(teste, font=f) > W - 180 and atual:
                    linhas.append(atual)
                    atual = p
                else:
                    atual = teste
            linhas.append(atual)
            y = H * 0.775
            for i, l in enumerate(linhas):
                d.text((W / 2, y + i * 74), l, font=f, fill=(255, 255, 255), anchor="mm", stroke_width=7, stroke_fill=(20, 4, 16))
            return


def chat(img, lt, msgs, titulo="Amor"):
    """Tela de conversa generica. msgs: (tempo, de_quem, texto)."""
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle((0, 0, W, 230), fill=(36, 12, 32))
    d.ellipse((60, 90, 160, 190), fill=ROSA)
    d.text((110, 140), titulo[0], font=fonte(F_BOLD, 52), fill=LEITE, anchor="mm")
    d.text((190, 120), titulo, font=fonte(F_BOLD, 50), fill=LEITE, anchor="lm")
    coracao(d, 190 + d.textlength(titulo, font=fonte(F_BOLD, 50)) + 36, 120, 18, ROSA + (255,))
    d.text((190, 172), "online", font=fonte(F_MED, 34), fill=(200, 170, 190), anchor="lm")
    y = 330
    f = fonte(F_MED, 60)
    for t0, quem, txt in msgs:
        k = ease((lt - t0) / 0.25)
        if k <= 0:
            continue
        if quem == "info":
            d.text((W / 2, y + 20), txt, font=fonte(F_MED, 36), fill=(180, 150, 170, int(255 * k)), anchor="mm")
            y += 90
            continue
        larg = d.textlength(txt, font=f) + 70
        x0 = W - 60 - larg if quem == "ele" else 60
        cor = BOLHA_ELE if quem == "ele" else BOLHA_ELA
        oy = 30 * (1 - k)
        d.rounded_rectangle((x0, y + oy, x0 + larg, y + 124 + oy), 46, fill=cor + (int(255 * k),))
        d.text((x0 + 35, y + 62 + oy), txt, font=f, fill=LEITE + (int(255 * k),), anchor="lm")
        if txt.endswith("casa"):
            coracao(d, x0 + larg + 50, y + 55 + oy, 30 * k, ROSA + (255,))
        y += 160


def cartoes_mimos(img, lt, t0):
    itens = [("Carinho", "30 s", "R$ 39,90"), ("Especial", "1 min", "R$ 59,90"), ("Inesquecível", "2 min", "R$ 79,90")]
    d = ImageDraw.Draw(img, "RGBA")
    cw, gap = 310, 22
    x0 = (W - (3 * cw + 2 * gap)) / 2
    for i, (nome, dur, preco) in enumerate(itens):
        k = ease((lt - t0 - i * 0.25) / 0.35)
        if k <= 0:
            continue
        x = x0 + i * (cw + gap)
        y = H * 0.565 + 60 * (1 - k)
        destaque = i == 1
        d.rounded_rectangle((x, y, x + cw, y + 250), 32, fill=(LEITE if not destaque else ROSA) + (int(250 * k),))
        cor = AMEIXA if not destaque else LEITE
        d.text((x + cw / 2, y + 52), "Mimo", font=fonte(F_MAO, 44), fill=cor + (int(255 * k),), anchor="mm")
        d.text((x + cw / 2, y + 102), nome, font=fonte(F_BOLD, 44 if len(nome) < 10 else 38), fill=cor + (int(255 * k),), anchor="mm")
        d.text((x + cw / 2, y + 152), dur, font=fonte(F_MED, 40), fill=cor + (int(255 * k),), anchor="mm")
        d.text((x + cw / 2, y + 208), preco, font=fonte(F_BOLD, 50), fill=cor + (int(255 * k),), anchor="mm")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", required=True)
    ap.add_argument("--voz", required=True)
    ap.add_argument("--musica", required=True)
    ap.add_argument("--saida", default="ad-homem.mp4")
    a = ap.parse_args()
    pw, ph = 560, 996
    demo = Leitor(a.demo, (pw, ph), ini=1.2)
    mascara = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, pw - 1, ph - 1), 50, fill=255)

    def cena(nome, t, lt):
        if nome == "chat_frio":
            img = Image.new("RGB", (W, H), NOITE)
            chat(img, lt, [(0.0, "ele", "amor, bora sair sábado?"), (1.5, "ela", "tô cansada"),
                           (2.7, "ele", "tá tudo bem com a gente?"), (3.7, "ela", "aham"),
                           (4.9, "info", "visualizado às 23:47")])
        elif nome == "cansaco":
            img = fundo(True, t)
            texto(img, "Achando que", 110, LEITE, H * 0.36, lt, 0.05)
            texto(img, "é cansaço?", 150, LEITE, H * 0.44, lt, 0.3)
            texto(img, "Não é.", 170, ROSA, H * 0.58, lt, 3.0)
        elif nome == "mimo":
            img = fundo(True, t)
            texto(img, "É falta de", 110, LEITE, H * 0.40, lt, 0.0)
            texto(img, "MIMO.", 260, ROSA, H * 0.52, lt, 0.15)
        elif nome == "flor":
            img = fundo(True, t)
            texto(img, "no meu tempo...", 110, MANTEIGA, H * 0.38, lt, 0.05, F_MAO)
            texto(img, "a gente mandava", 90, LEITE, H * 0.47, lt, 0.4, F_MED)
            texto(img, "flores.", 190, LEITE, H * 0.56, lt, 0.8)
        elif nome == "hoje":
            img = fundo(False, t)
            texto(img, "Hoje:", 120, AMEIXA, 190, lt, 0.0)
            k = ease((lt - 0.5) / 0.5)
            if k > 0:
                esc = 1.0 if lt < 2.9 else 1 - 0.3 * ease((lt - 2.9) / 0.6)
                cw2, ch2 = int((pw + 36) * esc), int((ph + 36) * esc)
                px, py = (W - cw2) // 2, 300 + int(60 * (1 - k))
                d = ImageDraw.Draw(img)
                d.rounded_rectangle((px, py, px + cw2, py + ch2), int(66 * esc), fill=(18, 3, 15))
                fr = demo.get(int((lt - 0.5) * FPS)).resize((int(pw * esc), int(ph * esc)))
                m = mascara.resize(fr.size)
                img.paste(fr, (px + int(18 * esc), py + int(18 * esc)), m)
            cartoes_mimos(img, lt, 3.3)
        elif nome == "chat_quente":
            img = Image.new("RGB", (W, H), NOITE)
            chat(img, lt, [(0.0, "info", "Amor enviou 4 mensagens"), (0.3, "ela", "amor..."),
                           (1.2, "ela", "eu tô chorando aqui"), (2.4, "ela", "foi a coisa mais linda"),
                           (3.9, "ela", "vem logo pra casa")])
        else:
            img = fundo(True, t)
            k = ease(lt / 0.5)
            camada = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            marca(camada, W / 2, H * 0.30, 120, LEITE)
            camada.putalpha(camada.getchannel("A").point(lambda v: int(v * k)))
            img.paste(camada, (0, 0), camada)
            texto(img, "o presente que ela não esquece", 66, MANTEIGA, H * 0.37, lt, 0.4, F_MAO)
            texto(img, "a partir de", 60, LEITE, H * 0.46, lt, 1.4, F_MED)
            texto(img, "R$ 39,90", 170, MANTEIGA, H * 0.53, lt, 1.6)
            pilula(img, "Faça o seu hoje", H * 0.64, lt, 3.6, ROSA, LEITE, 70, 44)
        if nome in ("chat_frio", "hoje", "chat_quente"):
            legenda(img, t)
        return img

    ff = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
        "-i", "-", "-i", a.voz, "-i", a.musica, "-filter_complex",
        f"[1:a]adelay={int(VOZ_ATRASO * 1000)}|{int(VOZ_ATRASO * 1000)},volume=1.5[v];[2:a]volume=0.2[m];"
        "[v][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[a]",
        "-map", "0:v", "-map", "[a]", "-t", str(DUR), "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", a.saida,
    ], stdin=subprocess.PIPE)
    X = 0.2
    for n in range(int(DUR * FPS)):
        t = n / FPS
        i = next(k for k, (s, e, _) in enumerate(CENAS) if s <= t < e or k == len(CENAS) - 1)
        s, e, nome = CENAS[i]
        fr = cena(nome, t, t - s)
        if i + 1 < len(CENAS) and t > e - X:
            fr = Image.blend(fr, cena(CENAS[i + 1][2], t, 0), ease((t - (e - X)) / X))
        ff.stdin.write(fr.convert("RGB").tobytes())
    ff.stdin.close()
    ff.wait()
    print("ok", a.saida)


if __name__ == "__main__":
    main()
