"""Criativos de trafego pago — publicos MULHER e FAMILIA.

  amiga  : amiga falando pra mandar o video pra melhor amiga (voz jovem)
  casada : mulher madura falando com a casada — casamento esfriou, medo de perder ele
  pais   : homem maduro, confissao — mora longe dos pais, nao diz "eu te amo" ha tempo

Uso: python3 ad_mulher.py amiga|casada|pais --demo ../exemplo/videomimo-demo.mp4 --voz voz.mp3 --musica trilha.wav --saida ad.mp4
Tempos das legendas vem da transcricao por palavra (ElevenLabs Scribe).
"""
import argparse
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

from ad_homem import NOITE, cartoes_mimos, chat
from promo_mimos import Leitor, pilula
from promo_namorados import F_BOLD, F_MAO, F_MED, fundo, marca, texto
from video import AMEIXA, BLUSH, FPS, H, LEITE, MANTEIGA, ROSA, W, ease, fonte

VOZ_ATRASO = 0.3
AQUI = Path(__file__).parent

ROTEIROS = {
    "amiga": dict(
        dur=23.6,
        legendas=[(0.1, 1.64, "Amiga, para tudo!"), (2.62, 3.62, "Sabe sua melhor amiga?"),
                  (3.86, 5.98, "Aquela que te aguentou chorando por macho,"),
                  (6.5, 8.42, "que tá em todas as fotos da sua galeria?"),
                  (9.06, 12.12, "Já pensou ela abrindo um vídeo com a história de vocês duas,"),
                  (12.52, 15.42, "com música e uma mensagem sua no final?"),
                  (16.18, 17.46, "Ela vai chorar, amiga."), (18.1, 18.94, "É o Vídeos Mimo."),
                  (19.24, 20.9, "A partir de R$ 39,90."), (21.18, 22.2, "Manda pra ela, vai!")],
        cenas=[(0.0, 2.7, "gancho"), (2.7, 6.6, "aguentou"), (6.6, 9.2, "galeria"), (9.2, 16.3, "video"),
               (16.3, 18.3, "reacao"), (18.3, 23.6, "fim_amiga")],
        com_legenda={"aguentou", "galeria", "video", "reacao"},
    ),
    "casada": dict(
        dur=34.6,
        legendas=[(0.14, 0.8, "Amiga..."), (1.34, 5.94, "Ele chega, janta, pega o celular e dorme."),
                  (6.8, 10.3, "Faz quanto tempo que ele não te olha como antes?"),
                  (11.56, 13.44, "A gente acha que é rotina,"), (14.14, 15.66, "mas é aí que mora o perigo,"),
                  (16.32, 19.32, "porque se você não lembrar ele do que vocês têm,"),
                  (19.82, 20.88, "alguém vai tentar."), (21.72, 22.64, "Lembra ele."),
                  (23.36, 26.82, "Um vídeo com as fotos de vocês desde o começo,"),
                  (27.32, 29.54, "com música e uma mensagem sua."),
                  (30.2, 33.8, "Vídeos Mimo. A partir de R$ 39,90.")],
        cenas=[(0.0, 6.7, "rotina"), (6.7, 11.7, "olhar"), (11.7, 16.4, "perigo"), (16.4, 22.0, "notificacao"),
               (22.0, 30.4, "lembra"), (30.4, 34.6, "fim_casada")],
        com_legenda={"notificacao", "lembra"},
    ),
    "pais": dict(
        dur=32.2,
        legendas=[(0.08, 3.72, "Quando foi a última vez que você disse \"eu te amo\" pro seu pai?"),
                  (5.6, 6.16, "Pra sua mãe?"), (7.34, 9.54, "A gente sai de casa, a vida corre"),
                  (10.08, 11.74, "e a ligação vira: \"tá tudo bem?\""), (12.26, 13.38, "\"tá... bença.\""),
                  (14.48, 16.2, "Mas eles não vão estar aqui pra sempre."),
                  (17.3, 20.24, "Junta as fotos de vocês, da infância até hoje,"),
                  (20.9, 23.1, "com música e uma mensagem sua."), (23.86, 25.94, "Eles vão assistir mil vezes."),
                  (26.82, 29.58, "Vídeos Mimo. A partir de R$ 39,90."), (29.96, 31.48, "Manda hoje, enquanto dá.")],
        cenas=[(0.0, 7.4, "pergunta"), (7.4, 14.6, "ligacao"), (14.6, 17.5, "sempre"), (17.5, 20.9, "galeria_familia"),
               (20.9, 26.9, "video_pais"), (26.9, 32.2, "fim_pais")],
        com_legenda={"ligacao", "galeria_familia", "video_pais"},
    ),
}


def legenda(img, t, legendas):
    tv = t - VOZ_ATRASO
    for ini, fim, txt in legendas:
        if ini - 0.05 <= tv < fim + 0.25:
            d = ImageDraw.Draw(img)
            f = fonte(F_BOLD, 60)
            linhas, atual = [], ""
            for p in txt.split():
                teste = (atual + " " + p).strip()
                if d.textlength(teste, font=f) > W - 180 and atual:
                    linhas.append(atual)
                    atual = p
                else:
                    atual = teste
            linhas.append(atual)
            for i, l in enumerate(linhas):
                d.text((W / 2, H * 0.80 + i * 72), l, font=f, fill=(255, 255, 255), anchor="mm",
                       stroke_width=7, stroke_fill=(20, 4, 16))
            return


def celular(img, demo, mascara, lt, t0, topo=300, esc_fim=None):
    pw, ph = mascara.size
    k = ease((lt - t0) / 0.5)
    if k <= 0:
        return
    esc = 1.0 if esc_fim is None or lt < esc_fim else 1 - 0.3 * ease((lt - esc_fim) / 0.6)
    cw, ch = int((pw + 36) * esc), int((ph + 36) * esc)
    px, py = (W - cw) // 2, topo + int(60 * (1 - k))
    ImageDraw.Draw(img).rounded_rectangle((px, py, px + cw, py + ch), int(66 * esc), fill=(18, 3, 15))
    fr = demo.get(int((lt - t0) * FPS)).resize((int(pw * esc), int(ph * esc)))
    img.paste(fr, (px + int(18 * esc), py + int(18 * esc)), mascara.resize(fr.size))


def galeria(img, lt, fotos, titulo="Galeria", sub="Vocês duas · 1.284"):
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, 200), fill=(250, 250, 250))
    d.text((60, 120), titulo, font=fonte(F_BOLD, 64), fill=(30, 30, 30), anchor="lm")
    d.text((W - 60, 120), sub, font=fonte(F_MED, 38), fill=(120, 120, 120), anchor="rm")
    tam, gap = 354, 9
    desl = int(lt * 260)
    for i in range(24):
        col, lin = i % 3, i // 3
        x = col * (tam + gap)
        y = 210 + lin * (tam + gap) - desl
        if -tam < y < H:
            img.paste(fotos[i % len(fotos)], (x, y))
    d.rectangle((0, 0, W, 200), fill=(250, 250, 250))
    d.text((60, 120), titulo, font=fonte(F_BOLD, 64), fill=(30, 30, 30), anchor="lm")
    d.text((W - 60, 120), sub, font=fonte(F_MED, 38), fill=(120, 120, 120), anchor="rm")


def tela_bloqueio(img, lt):
    d = ImageDraw.Draw(img, "RGBA")
    d.text((W / 2, 420), "23:47", font=fonte(F_MED, 230), fill=(240, 230, 240), anchor="mm")
    d.text((W / 2, 580), "sexta-feira", font=fonte(F_MED, 46), fill=(210, 190, 210), anchor="mm")
    k = ease((lt - 3.6) / 0.35)
    if k > 0:
        y = 760 + 80 * (1 - k)
        d.rounded_rectangle((60, y, W - 60, y + 230), 44, fill=(70, 50, 70, int(235 * k)))
        d.text((110, y + 60), "Mensagem  ·  agora", font=fonte(F_MED, 38), fill=(220, 200, 220, int(255 * k)), anchor="lm")
        d.text((110, y + 125), "Número desconhecido", font=fonte(F_BOLD, 50), fill=(255, 255, 255, int(255 * k)), anchor="lm")
        d.text((110, y + 185), "oi, sumido... tava pensando em você", font=fonte(F_MED, 46), fill=(240, 225, 240, int(255 * k)), anchor="lm")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("roteiro", choices=ROTEIROS)
    ap.add_argument("--demo", required=True)
    ap.add_argument("--voz", required=True)
    ap.add_argument("--musica", required=True)
    ap.add_argument("--saida", required=True)
    a = ap.parse_args()
    R = ROTEIROS[a.roteiro]
    DUR = R["dur"]
    pw, ph = 560, 996
    demo = Leitor(a.demo, (pw, ph), ini=1.2)
    mascara = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, pw - 1, ph - 1), 50, fill=255)
    pasta_fotos = AQUI.parent / "exemplo" / "fotos"
    fotos = [ImageOps.fit(Image.open(p).convert("RGB"), (354, 354)) for p in sorted(pasta_fotos.glob("*.jpg"))]

    def cena(nome, t, lt):
        if nome == "gancho":
            img = fundo(False, t)
            pulso = 1 + 0.05 * math.sin(lt * 14) * max(0, 1 - lt)
            texto(img, "Amiga,", int(210 * pulso), ROSA, H * 0.40, lt, 0.0)
            texto(img, "PARA TUDO!", int(160 * pulso), AMEIXA, H * 0.51, lt, 0.5)
        elif nome == "aguentou":
            img = Image.new("RGB", (W, H), NOITE)
            chat(img, lt, [(0.0, "info", "2 anos atrás"), (0.2, "ele", "AMIGA ele me bloqueou"),
                           (0.9, "ela", "tô indo aí"), (1.6, "ela", "levando chocolate e vinho"),
                           (2.6, "ele", "o que seria de mim sem você")], titulo="Melhor amiga")
        elif nome == "galeria":
            img = Image.new("RGB", (W, H), (250, 250, 250))
            galeria(img, lt, fotos)
        elif nome == "video":
            img = fundo(False, t)
            texto(img, "Já pensou ela abrindo isso?", 70, AMEIXA, 200, lt, 0.0)
            celular(img, demo, mascara, lt, 0.3)
        elif nome == "reacao":
            img = Image.new("RGB", (W, H), NOITE)
            chat(img, lt, [(0.0, "ela", "AMIGAAAAA"), (0.5, "ela", "tô chorando no trabalho"),
                           (1.1, "ela", "te amo muito, sério")], titulo="Melhor amiga")
        elif nome == "fim_amiga":
            img = fundo(False, t)
            marca(img, W / 2, H * 0.17, 110, AMEIXA)
            texto(img, "o presente que ela nunca vai esquecer", 62, ROSA, H * 0.24, lt, 0.2, F_MAO)
            texto(img, "a partir de R$ 39,90", 84, AMEIXA, H * 0.33, lt, 0.8)
            cartoes_mimos(img, lt, 1.0)
            pilula(img, "Manda pra ela", H * 0.82, lt, 2.8, ROSA, LEITE, 72, 44)
        elif nome == "rotina":
            img = fundo(True, t)
            texto(img, "amiga...", 90, MANTEIGA, H * 0.24, lt, 0.2, F_MAO)
            for i, (w, t0) in enumerate([("ele chega.", 1.6), ("janta.", 2.9), ("pega o celular.", 3.9), ("e dorme.", 5.7)]):
                texto(img, w, 110 if i < 3 else 150, LEITE if i < 3 else ROSA, H * (0.36 + 0.1 * i), lt, t0)
        elif nome == "olhar":
            img = fundo(True, t)
            texto(img, "Faz quanto tempo", 100, LEITE, H * 0.38, lt, 0.3)
            texto(img, "que ele não te olha", 100, LEITE, H * 0.46, lt, 1.4)
            texto(img, "como antes?", 150, ROSA, H * 0.56, lt, 2.6)
        elif nome == "perigo":
            img = fundo(True, t)
            texto(img, "\"é só rotina\"", 110, LEITE, H * 0.38, lt, 0.1, F_MAO)
            texto(img, "É aí que mora", 110, LEITE, H * 0.50, lt, 2.7)
            texto(img, "o perigo.", 170, ROSA, H * 0.59, lt, 3.1)
        elif nome == "notificacao":
            img = Image.new("RGB", (W, H), (28, 14, 30))
            tela_bloqueio(img, lt)
        elif nome == "lembra":
            img = fundo(False, t)
            texto(img, "Lembra ele.", 120, ROSA, 200, lt, 0.0)
            celular(img, demo, mascara, lt, 1.3, esc_fim=4.0)
            cartoes_mimos(img, lt, 4.4)
        elif nome == "pergunta":
            img = fundo(True, t)
            texto(img, "Quando foi a última vez", 86, LEITE, H * 0.30, lt, 0.2)
            texto(img, "que você disse", 86, LEITE, H * 0.37, lt, 1.7)
            texto(img, "\"eu te amo\"", 170, ROSA, H * 0.47, lt, 2.6, F_MAO)
            texto(img, "pro seu pai?", 110, LEITE, H * 0.57, lt, 3.4)
            texto(img, "pra sua mãe?", 110, MANTEIGA, H * 0.66, lt, 5.8)
        elif nome == "ligacao":
            img = Image.new("RGB", (W, H), NOITE)
            chat(img, lt, [(0.4, "info", "última visita: há 8 meses"), (1.4, "info", "chamada de voz · 1 min"),
                           (4.0, "ela", "tá tudo bem, filho?"), (5.1, "ele", "tá"), (5.9, "ela", "Deus te abençoe")],
                 titulo="Mãe")
        elif nome == "sempre":
            img = Image.new("RGB", (W, H), (14, 6, 12))
            texto(img, "Eles não vão", 120, LEITE, H * 0.42, lt, 0.1, dur=0.8)
            texto(img, "estar aqui", 120, LEITE, H * 0.49, lt, 0.5, dur=0.8)
            texto(img, "pra sempre.", 150, ROSA, H * 0.58, lt, 1.0, dur=0.8)
        elif nome == "galeria_familia":
            img = Image.new("RGB", (W, H), (250, 250, 250))
            galeria(img, lt, fotos, "Família", "1998 – 2026")
        elif nome == "video_pais":
            img = fundo(False, t)
            texto(img, "Eles vão assistir mil vezes.", 66, AMEIXA, 200, lt, 3.2)
            celular(img, demo, mascara, lt, 0.0)
        elif nome == "fim_pais":
            img = fundo(True, t)
            marca(img, W / 2, H * 0.17, 110, LEITE)
            texto(img, "diga o que você sente, mesmo de longe", 60, MANTEIGA, H * 0.24, lt, 0.2, F_MAO)
            texto(img, "a partir de R$ 39,90", 84, LEITE, H * 0.33, lt, 0.8)
            cartoes_mimos(img, lt, 1.0)
            pilula(img, "Manda hoje", H * 0.82, lt, 3.0, ROSA, LEITE, 72, 44)
        else:  # fim_casada
            img = fundo(True, t)
            marca(img, W / 2, H * 0.32, 120, LEITE)
            texto(img, "lembre ele do que vocês têm", 66, MANTEIGA, H * 0.39, lt, 0.3, F_MAO)
            texto(img, "a partir de", 60, LEITE, H * 0.48, lt, 0.9, F_MED)
            texto(img, "R$ 39,90", 170, MANTEIGA, H * 0.55, lt, 1.1)
            pilula(img, "Faça o seu hoje", H * 0.66, lt, 2.2, ROSA, LEITE, 70, 44)
        if nome in R["com_legenda"]:
            legenda(img, t, R["legendas"])
        return img

    ff = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
        "-i", "-", "-i", a.voz, "-i", a.musica, "-filter_complex",
        f"[1:a]adelay={int(VOZ_ATRASO * 1000)}|{int(VOZ_ATRASO * 1000)},volume=1.5[v];[2:a]volume=0.2[m];"
        "[v][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[a]",
        "-map", "0:v", "-map", "[a]", "-t", str(DUR), "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", a.saida,
    ], stdin=subprocess.PIPE)
    CENAS, X = R["cenas"], 0.2
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
