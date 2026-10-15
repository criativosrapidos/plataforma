"""Video de divulgacao Vídeos Mimo — Dia dos Namorados (vertical 1080x1920, ~34 s).

Uso: python3 promo_namorados.py --demo ../exemplo/videomimo-demo.mp4 --musica trilha.wav --saida promo.mp4
"""
import argparse
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from video import (AMEIXA, BLUSH, FPS, H, LEITE, MANTEIGA, ROSA, W, coracao, ease, fonte)

DUR = 34.0
F_BOLD = "Bricolage-ExtraBold.ttf"
F_MED = "Bricolage-Medium.ttf"
F_MAO = "Caveat-Bold.ttf"

# Roteiro: (inicio, fim, cena)
CENAS = [
    (0.0, 2.3, "flores"),
    (2.3, 4.6, "chocolate"),
    (4.6, 8.4, "milvezes"),
    (8.4, 15.4, "celular"),
    (15.4, 19.2, "marca"),
    (19.2, 24.6, "passos"),
    (24.6, 29.4, "preco"),
    (29.4, DUR, "cta"),
]


def sprite(txt, f, cor):
    """Texto renderizado uma vez numa camada transparente."""
    tmp = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    l, t, r, b = tmp.textbbox((0, 0), txt, font=f)
    im = Image.new("RGBA", (r - l + 20, b - t + 20), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((10 - l, 10 - t), txt, font=f, fill=cor)
    return im


_cache = {}


def texto(img, txt, tam, cor, y, t, t0, f=F_BOLD, x=None, dur=0.4):
    """Linha que entra subindo e aparecendo a partir de t0. y = centro vertical."""
    k = ease((t - t0) / dur)
    if k <= 0:
        return
    chave = (txt, tam, cor, f)
    if chave not in _cache:
        _cache[chave] = sprite(txt, fonte(f, tam), cor + (255,))
    s = _cache[chave]
    if k < 1:
        s = s.copy()
        s.putalpha(s.getchannel("A").point(lambda v: int(v * k)))
    px = int((W - s.width) / 2 if x is None else x)
    py = int(y - s.height / 2 + 50 * (1 - k))
    img.paste(s, (px, py), s)


def fundo_bokeh(seed, base, cores, n=34):
    rng = np.random.default_rng(seed)
    alt = int(H * 1.4)
    img = Image.new("RGB", (W, alt), base)
    luz = Image.new("RGBA", (W, alt), (0, 0, 0, 0))
    d = ImageDraw.Draw(luz)
    for _ in range(n):
        x, y, r = rng.uniform(0, W), rng.uniform(0, alt), rng.uniform(25, 110)
        cor = cores[rng.integers(0, len(cores))]
        if rng.random() < 0.35:
            coracao(d, x, y, r, cor + (int(rng.uniform(40, 90)),))
        else:
            d.ellipse((x - r, y - r, x + r, y + r), fill=cor + (int(rng.uniform(30, 80)),))
    luz = luz.filter(ImageFilter.GaussianBlur(16))
    img.paste(luz, (0, 0), luz)
    return img


FUNDO_ESCURO = fundo_bokeh(1, AMEIXA, [ROSA, MANTEIGA])
FUNDO_CLARO = fundo_bokeh(2, BLUSH, [ROSA, MANTEIGA, (255, 255, 255)], 26)


def fundo(escuro, t):
    src = FUNDO_ESCURO if escuro else FUNDO_CLARO
    off = int((t * 40) % (src.height - H))
    return src.crop((0, src.height - H - off, W, src.height - off))


_LOGOS = {}


def marca(img, cx, cy, tam, cor):
    """Cola a logo oficial (marca/logo-horizontal*.png). tam ~ altura das letras em px."""
    clara = sum(cor[:3]) > 600
    nome = "logo-horizontal-branca.png" if clara else "logo-horizontal.png"
    if nome not in _LOGOS:
        _LOGOS[nome] = Image.open(Path(__file__).parent.parent / "marca" / nome).convert("RGBA")
    logo = _LOGOS[nome]
    esc = tam / 195
    lg = logo.resize((int(logo.width * esc), int(logo.height * esc)), Image.LANCZOS)
    img.paste(lg, (int(cx - lg.width / 2), int(cy - lg.height / 2)), lg)


def riscar(img, y, larg, t, t0, cor):
    k = ease((t - t0) / 0.3)
    if k > 0:
        d = ImageDraw.Draw(img)
        x0 = W / 2 - larg / 2
        d.line((x0, y, x0 + larg * k, y), fill=cor, width=14)


def cena(nome, t, lt, demo):
    """t = tempo global, lt = tempo dentro da cena."""
    if nome == "flores":
        img = fundo(True, t)
        texto(img, "Flores", 190, LEITE, H * 0.44, lt, 0.1)
        texto(img, "murcham.", 190, LEITE, H * 0.55, lt, 0.35)
        riscar(img, H * 0.555, 860, lt, 1.4, ROSA)
    elif nome == "chocolate":
        img = fundo(True, t)
        texto(img, "Chocolate", 190, LEITE, H * 0.44, lt, 0.05)
        texto(img, "acaba.", 190, LEITE, H * 0.55, lt, 0.3)
        riscar(img, H * 0.555, 560, lt, 1.3, ROSA)
    elif nome == "milvezes":
        img = fundo(True, t)
        texto(img, "Mas esse presente", 76, MANTEIGA, H * 0.33, lt, 0.1, F_MED)
        texto(img, "seu amor vai", 120, LEITE, H * 0.42, lt, 0.5)
        texto(img, "assistir", 120, LEITE, H * 0.49, lt, 0.7)
        texto(img, "mil vezes.", 210, ROSA, H * 0.60, lt, 1.2)
    elif nome == "celular":
        img = fundo(False, t)
        texto(img, "as fotos de vocês", 74, AMEIXA, 250, lt, 0.2)
        texto(img, "a história de vocês", 74, AMEIXA, 350, lt, 1.6)
        texto(img, "uma música só de vocês", 74, ROSA, 450, lt, 3.0)
        # celular com o video de exemplo
        pw, ph = 600, 1180
        px, py = (W - pw) // 2, 600
        d = ImageDraw.Draw(img, "RGBA")
        d.rounded_rectangle((px + 10, py + 24, px + pw + 10, py + ph + 24), 70, fill=(58, 13, 46, 60))
        d.rounded_rectangle((px, py, px + pw, py + ph), 70, fill=(18, 3, 15))
        fr = demo[min(int(lt * FPS), len(demo) - 1)]
        mask = Image.new("L", fr.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, fr.width - 1, fr.height - 1), 54, fill=255)
        img.paste(fr, (px + 18, py + 18), mask)
        texto(img, "♥ seu amor vai chorar", 64, ROSA, 1830, lt, 4.6, F_MAO)
    elif nome == "marca":
        img = fundo(True, t)
        k = ease((lt - 0.1) / 0.5)
        if k > 0:
            camada = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            marca(camada, W / 2, H * 0.42, 130, LEITE)
            camada.putalpha(camada.getchannel("A").point(lambda v: int(v * k)))
            img.paste(camada, (0, 0), camada)
        texto(img, "O presente de", 78, LEITE, H * 0.53, lt, 0.9, F_MED)
        texto(img, "Dia dos Namorados", 96, MANTEIGA, H * 0.585, lt, 1.2)
        texto(img, "que ninguém esquece.", 78, LEITE, H * 0.64, lt, 1.5, F_MED)
    elif nome == "passos":
        img = fundo(False, t)
        texto(img, "É simples assim:", 96, AMEIXA, H * 0.24, lt, 0.1)
        itens = [("1", "Escolha o mimo"), ("2", "Mande as fotos"), ("3", "Receba em até 24h")]
        for i, (n, txt) in enumerate(itens):
            y = H * (0.38 + 0.14 * i)
            t0 = 0.6 + i * 1.1
            texto(img, n, 170, ROSA, y, lt, t0, x=150)
            texto(img, txt, 80, AMEIXA, y, lt, t0 + 0.15, x=300)
        texto(img, "pelo WhatsApp, sem complicação", 66, ROSA, H * 0.82, lt, 4.0, F_MAO)
    elif nome == "preco":
        img = fundo(True, t)
        texto(img, "Custa menos que", 84, LEITE, H * 0.33, lt, 0.1, F_MED)
        texto(img, "um buquê de rosas.", 104, LEITE, H * 0.39, lt, 0.4)
        texto(img, "a partir de", 80, MANTEIGA, H * 0.52, lt, 1.4, F_MAO)
        texto(img, "R$ 39,90", 250, MANTEIGA, H * 0.61, lt, 1.7)
        texto(img, "vídeos de 30 s a 2 min · até 30 fotos", 54, LEITE, H * 0.71, lt, 2.6, F_MED)
    else:  # cta
        img = fundo(False, t)
        texto(img, "12 de junho", 150, ROSA, H * 0.27, lt, 0.1)
        texto(img, "tá chegando.", 120, AMEIXA, H * 0.345, lt, 0.4)
        texto(img, "Garanta o seu antes", 76, AMEIXA, H * 0.45, lt, 1.0, F_MED)
        texto(img, "que a agenda lote.", 76, AMEIXA, H * 0.495, lt, 1.2, F_MED)
        k = ease((lt - 1.8) / 0.4)
        if k > 0:
            d = ImageDraw.Draw(img, "RGBA")
            pulso = 1 + 0.04 * math.sin(lt * 6)
            bw, bh = 760 * pulso, 170 * pulso
            cy = H * 0.63
            d.rounded_rectangle((W / 2 - bw / 2, cy - bh / 2, W / 2 + bw / 2, cy + bh / 2), int(bh / 2), fill=ROSA + (int(255 * k),))
            d.text((W / 2, cy), "Peça o seu agora", font=fonte(F_BOLD, 72), fill=LEITE + (int(255 * k),), anchor="mm")
        texto(img, "link na bio  ·  chama no WhatsApp", 56, AMEIXA, H * 0.725, lt, 2.4, F_MED)
        if lt > 2.8:
            marca(img, W / 2, H * 0.86, 64, AMEIXA)
    return img


def carregar_demo(path, ini=3.2, dur=7.2, tam=(564, 1144)):
    cmd = ["ffmpeg", "-loglevel", "error", "-ss", str(ini), "-t", str(dur), "-i", path,
           "-vf", f"scale={tam[0]}:{tam[1]}:force_original_aspect_ratio=increase,crop={tam[0]}:{tam[1]}",
           "-r", str(FPS), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    n = len(raw) // (tam[0] * tam[1] * 3)
    arr = np.frombuffer(raw, np.uint8)[: n * tam[0] * tam[1] * 3].reshape(n, tam[1], tam[0], 3)
    return [Image.fromarray(a) for a in arr]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", required=True)
    ap.add_argument("--musica", required=True)
    ap.add_argument("--saida", default="promo-namorados.mp4")
    a = ap.parse_args()
    demo = carregar_demo(a.demo)
    ff = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
        "-i", "-", "-i", a.musica, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", a.saida,
    ], stdin=subprocess.PIPE)
    X = 0.22  # transicao curta entre cenas
    for n in range(int(DUR * FPS)):
        t = n / FPS
        i = next(k for k, (s, e, _) in enumerate(CENAS) if s <= t < e or k == len(CENAS) - 1)
        s, e, nome = CENAS[i]
        fr = cena(nome, t, t - s, demo)
        if i + 1 < len(CENAS) and t > e - X:
            s2, _, nome2 = CENAS[i + 1]
            fr = Image.blend(fr, cena(nome2, t, 0, demo), ease((t - (e - X)) / X))
        ff.stdin.write(fr.convert("RGB").tobytes())
    ff.stdin.close()
    ff.wait()
    print("ok", a.saida)


if __name__ == "__main__":
    main()
