#!/usr/bin/env python3
"""3 carrosséis (5 páginas cada, 1080x1350) - Fazendinha Self Service, mesma linguagem do vídeo v2.

Uso: python3 render_carrosseis_v2.py  -> saida/carrossel_v2/c1..c3/
"""
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import faz_art as F
from faz_art import CREAM, MAROON3
from render_faz import clamp, photo
from render_faz_v2 import BLACK, INSTA, ORANGE, WHITE, YELLOW, emoji, fnt, price_card, price_value

ROOT = Path(__file__).resolve().parent
CW, CH = 1080, 1350
OUT = ROOT / "saida/carrossel_v2"
N = 5


def cover(name, cx=0.5, cy=0.5, zoom=1.0, blur=0):
    src = photo(name)
    s = max(CW / src.width, CH / src.height) * zoom
    w, h = CW / s, CH / s
    x0 = clamp(cx * src.width - w / 2, 0, src.width - w)
    y0 = clamp(cy * src.height - h / 2, 0, src.height - h)
    img = src.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((CW, CH), Image.LANCZOS)
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    return img.convert("RGBA")


@lru_cache(None)
def shade(start=0.42, strength=235):
    y = np.linspace(0, 1, CH)[:, None]
    a = np.clip((y - start) / (1 - start), 0, 1) ** 1.25 * strength + np.clip((.14 - y) / .14, 0, 1) ** 1.5 * 110
    img = Image.new("RGBA", (CW, CH), (14, 6, 4, 0))
    img.putalpha(Image.fromarray(np.repeat(np.clip(a, 0, 255), CW, 1).astype(np.uint8)))
    return img


def put(base, img, cx, cy, rot=0):
    if rot:
        img = img.rotate(rot, Image.BICUBIC, expand=True)
    base.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


def tw(text, f):
    return ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f)


def fit(text, weight, start, maxw):
    s = start
    while s > 20 and tw(text, fnt(weight, s)) > maxw:
        s -= 2
    return fnt(weight, s)


def line(img, text, cy, size=92, box=None, color=WHITE, maxw=960):
    """Linha de título: branca com contorno, ou dentro de uma tarja colorida (box). Devolve a caixa ocupada."""
    f = fit(text, 900, size, maxw - (60 if box else 0))
    w = tw(text, f)
    sz = f.size
    lay = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    sh = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    d, ds = ImageDraw.Draw(lay), ImageDraw.Draw(sh)
    x0, x1 = CW / 2 - w / 2, CW / 2 + w / 2
    if box:
        rect = (x0 - 30, cy - sz * .66, x1 + 30, cy + sz * .62)
        ds.rounded_rectangle((rect[0] + 4, rect[1] + 10, rect[2] + 4, rect[3] + 10), 26, fill=(0, 0, 0, 150))
        d.rounded_rectangle(rect, 26, fill=box + (255,))
        d.text((CW / 2, cy), text, font=f, fill=color, anchor="mm")
    else:
        ds.text((CW / 2 + 3, cy + 8), text, font=f, fill=(0, 0, 0, 170), anchor="mm", stroke_width=8,
                stroke_fill=(0, 0, 0, 170))
        d.text((CW / 2, cy), text, font=f, fill=color, anchor="mm", stroke_width=7, stroke_fill=BLACK)
        rect = (x0, cy - sz * .6, x1, cy + sz * .6)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    img.alpha_composite(lay)
    return rect


def body(img, text, y, size=40, color=CREAM):
    f = fnt(600, size)
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if tw(t, f) > CW - 200:
            lines.append(cur)
            cur = w
        else:
            cur = t
    lines.append(cur)
    d = ImageDraw.Draw(img)
    for i, ln in enumerate(lines):
        yy = y + i * size * 1.4
        d.text((CW / 2 + 2, yy + 3), ln, font=f, fill=(0, 0, 0, 200), anchor="mm")
        d.text((CW / 2, yy), ln, font=f, fill=color, anchor="mm")


MINI = F.logo_recriado(150)


def chrome(img, n, swipe=False):
    img.alpha_composite(MINI, (40, 36))
    d = ImageDraw.Draw(img)
    f = fnt(800, 30)
    lab = f"{n}/{N}"
    w = tw(lab, f)
    d.rounded_rectangle((CW - 70 - w, 76, CW - 40, 128), 26, fill=(0, 0, 0, 140))
    d.text((CW - 55 - w / 2, 102), lab, font=f, fill=WHITE, anchor="mm")
    f2 = fnt(700, 28)
    d.text((CW / 2, CH - 46), INSTA, font=f2, fill=CREAM + (230,), anchor="mm")
    if swipe:
        f3 = fnt(900, 34)
        t = "ARRASTA PRO LADO"
        w = tw(t, f3) + 50
        d.rounded_rectangle((CW / 2 - w / 2 - 34, CH - 150, CW / 2 + w / 2 + 34, CH - 90), 30, fill=WHITE + (255,))
        d.text((CW / 2 - w / 2, CH - 120), t, font=f3, fill=MAROON3, anchor="lm")
        ax = CW / 2 + w / 2 - 22
        d.polygon([(ax - 14, CH - 136), (ax + 14, CH - 120), (ax - 14, CH - 104)], fill=ORANGE + (255,))


def photo_slide(n, name, cx, cy, zoom, top, hl, emo, text=None, swipe=False, hl_color=ORANGE):
    img = cover(name, cx, cy, zoom)
    img.alpha_composite(shade())
    y = 830 if text else 900
    line(img, top, y)
    r = line(img, hl, y + 118, box=hl_color)
    if emo:
        put(img, emoji(emo, 140), CW / 2, y - 140, rot=-8)
    if text:
        body(img, text, y + 250)
    chrome(img, n, swipe)
    return img


def maroon_bg(name, cx=.5, cy=.6):
    img = cover(name, cx, cy, 1.25, blur=12)
    img.alpha_composite(Image.new("RGBA", (CW, CH), MAROON3 + (190,)))
    return img


def prices_slide(n, title, sub=None, emo="😋"):
    img = maroon_bg("petiscos")
    line(img, title, 240, 80, color=YELLOW)
    if sub:
        line(img, sub, 335, 46)
    for label, val, y, rot, col in (("DIA DE SEMANA", "39,90", 640, -2, ORANGE),
                                    ("FINAL DE SEMANA", "49,90", 1030, 2, (110, 30, 28))):
        card = price_card(label, 0, col).copy()
        card.alpha_composite(price_value(val), (80, 150))
        put(img, card, CW / 2, y, rot)
    if emo:
        put(img, emoji(emo, 140), CW - 120, 1200, rot=10)
    chrome(img, n)
    return img


def cta_slide(n, l1, l2, l3, emo, bg="piscina"):
    img = maroon_bg(bg)
    logo = F.logo_recriado(470)
    put(img, logo, CW / 2, 420)
    line(img, l1, 760, 84)
    line(img, l2, 880, 84, box=ORANGE)
    put(img, emoji(emo, 140), CW / 2 + 245, 250, rot=12)
    if l3:
        line(img, l3, 1020, 40, color=CREAM)
    f = fnt(800, 34)
    d = ImageDraw.Draw(img)
    t = "📍"
    put(img, emoji(t, 56), CW / 2 - tw("SETOR DE MANSÕES DE TAGUATINGA", f) / 2 - 40, 1130)
    d.text((CW / 2 + 10, 1130), "SETOR DE MANSÕES DE TAGUATINGA", font=f, fill=WHITE, anchor="mm")
    chrome(img, n)
    return img


# ------------------------------------------------------------- carrosséis ---
def c1():  # comida
    return [
        photo_slide(1, "picanha", .5, .5, 1.05, "AQUI O ALMOÇO", "É À VONTADE", "😋", swipe=True),
        photo_slide(2, "picanha", .45, .6, 1.3, "CHURRASCO", "SAINDO NA HORA", "🔥",
                    "Carne no ponto, direto do espeto pro seu prato."),
        photo_slide(3, "peixe", .62, .5, 1.0, "PEIXE", "ASSADO", "🐟",
                    "Douradinho por fora, suculento por dentro."),
        photo_slide(4, "saladas", .6, .74, 1.1, "COMIDA CASEIRA", "NO FOGÃO A LENHA", "🍲",
                    "Saladas, frutas, petiscos e aquele tempero de casa de vó."),
        prices_slide(5, "E O MELHOR:", "COMA À VONTADE"),
    ]


def c2():  # lazer
    return [
        photo_slide(1, "piscina", .5, .6, 1.0, "SEU DOMINGO", "SEM PRESSA", "☀️", swipe=True),
        photo_slide(2, "rede", .4, .6, 1.0, "ALMOÇOU?", "AGORA É REDE", "🌴",
                    "Deita, relaxa e deixa a preguiça bater."),
        photo_slide(3, "piscina", .35, .65, 1.15, "PISCINA", "PRA REFRESCAR", "💦",
                    "Sol de Brasília e água geladinha. Precisa de mais?"),
        photo_slide(4, "mural", .62, .55, 1.3, "MÚSICA", "AO VIVO", "🎶",
                    "Som ao vivo pra deixar o almoço ainda mais gostoso."),
        cta_slide(5, "TRAZ A", "FAMÍLIA TODA", "Almoço, rede, piscina e música num lugar só.", "🤠"),
    ]


def c3():  # preço e localização
    return [
        photo_slide(1, "saladas", .55, .62, 1.0, "COMER À VONTADE", "POR R$ 39,90?", "🤔", swipe=True),
        prices_slide(2, "É SÉRIO!", "SELF-SERVICE À VONTADE", "🤑"),
        photo_slide(3, "rede", .55, .5, 1.1, "E AINDA TEM", "REDE · PISCINA", "🌴",
                    "E música ao vivo pra curtir o dia todo."),
        photo_slide(4, "mural", .45, .52, 1.0, "ONDE FICA?", "MANSÕES DE TAGUATINGA", "📍",
                    "Setor de Mansões de Taguatinga. Vem com fome!"),
        cta_slide(5, "MARCA AQUI QUEM", "VAI COM VOCÊ", "Salva esse post pro próximo domingo.", "😂", bg="mural"),
    ]


def main():
    for k, fn in (("c1_comida", c1), ("c2_lazer", c2), ("c3_preco", c3)):
        d = OUT / k
        d.mkdir(parents=True, exist_ok=True)
        for i, s in enumerate(fn(), 1):
            s.convert("RGB").save(d / f"fazendinha_{k}_{i}.jpg", quality=94)
    print("OK")


if __name__ == "__main__":
    main()
