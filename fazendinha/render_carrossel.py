#!/usr/bin/env python3
"""Carrossel (6 páginas, 1080x1350) - Fazendinha Self Service.  Uso: python3 render_carrossel.py"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import faz_art as F
from faz_art import CREAM, GOLD, MAROON3, font
from render_faz import INSTA, bandeirinhas, chip, photo, price_tag, ttext

ROOT = Path(__file__).resolve().parent
CW, CH = 1080, 1350
OUT = ROOT / "saida/carrossel"


def cover(name, cx=0.5, cy=0.5, zoom=1.0):
    src = photo(name)
    s = max(CW / src.width, CH / src.height) * zoom
    w, h = CW / s, CH / s
    x0 = min(max(cx * src.width - w / 2, 0), src.width - w)
    y0 = min(max(cy * src.height - h / 2, 0), src.height - h)
    return src.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((CW, CH), Image.LANCZOS).convert("RGBA")


def shade(start=0.5, strength=235, top=0.0):
    y = np.linspace(0, 1, CH)[:, None]
    a = np.clip((y - start) / (1 - start), 0, 1) ** 1.2 * strength
    if top:
        a = np.maximum(a, np.clip((top - y) / top, 0, 1) ** 1.5 * strength * 0.85)
    img = Image.new("RGBA", (CW, CH), (20, 8, 6, 0))
    img.putalpha(Image.fromarray(np.repeat(a, CW, 1).astype(np.uint8)))
    return img


def put(base, img, cx, cy):
    base.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


def footer(img, n):
    d = ImageDraw.Draw(img)
    d.text((70, CH - 60), INSTA, font=font("m6", 26), fill=CREAM + (220,), anchor="lm")
    d.text((CW - 70, CH - 60), f"{n}/6", font=font("m6", 26), fill=CREAM + (220,), anchor="rm")


def wrap(text, f, maxw):
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) > maxw:
            lines.append(cur)
            cur = w
        else:
            cur = t
    return lines + [cur]


def body(img, text, y, size=40):
    f = font("m5", size)
    d = ImageDraw.Draw(img)
    for i, ln in enumerate(wrap(text, f, CW - 180)):
        d.text((CW / 2 + 2, y + i * (size * 1.4) + 3), ln, font=f, fill=(20, 6, 4, 180), anchor="mm")
        d.text((CW / 2, y + i * (size * 1.4)), ln, font=f, fill=CREAM, anchor="mm")


def slides():
    out = []
    # 1 capa
    s = cover("piscina", 0.5, 0.55)
    s.alpha_composite(shade(0.42, 240, top=0.22))
    s.alpha_composite(F.original_logo(190), (CW // 2 - 95, 60))
    put(s, ttext("Seu domingo", "script", 150), CW / 2, 860)
    put(s, ttext("dos sonhos", "script", 150, GOLD), CW / 2, 1000)
    put(s, ttext("TEM ENDEREÇO", "m8", 50), CW / 2, 1130)
    put(s, chip("ARRASTA PRO LADO  >", 30), CW / 2, 1240)
    out.append(s)
    # 2-4 conteúdo
    pages = [("picanha", 0.5, 0.45, "Comida caseira", "NO FOGÃO A LENHA",
              "Churrasco, peixe assado e aquele tempero de casa de vó."),
             ("saladas", 0.5, 0.6, "À vontade", "SELF-SERVICE",
              "Saladas fresquinhas, petiscos, frutas e sobremesas. Você monta o prato do seu jeito."),
             ("rede", 0.45, 0.55, "Pra curtir o dia", "REDE · PISCINA · MÚSICA AO VIVO",
              "Almoço sem pressa, com espaço pra família inteira descansar.")]
    for i, (name, cx, cy, title, kicker, text) in enumerate(pages, 2):
        s = cover(name, cx, cy)
        s.alpha_composite(shade(0.45, 245))
        put(s, chip(kicker, 30), CW / 2, 860)
        put(s, ttext(title, "script", 130, CREAM), CW / 2, 990)
        body(s, text, 1130, 36)
        footer(s, i)
        out.append(s)
    # 5 preços
    s = cover("saladas", 0.5, 0.5, 1.3).filter(ImageFilter.GaussianBlur(10))
    s = Image.blend(s, Image.new("RGBA", (CW, CH), MAROON3 + (255,)), 0.6)
    bandeirinhas(s, 1.0)
    put(s, ttext("Quanto custa?", "script", 120, CREAM), CW / 2, 330)
    put(s, price_tag("DURANTE A SEMANA", "39,90", 3).rotate(-2, Image.BICUBIC, expand=True), CW / 2, 600)
    put(s, price_tag("FIM DE SEMANA", "49,90", 5).rotate(2, Image.BICUBIC, expand=True), CW / 2, 950)
    put(s, ttext("SELF-SERVICE À VONTADE", "m8", 40, GOLD), CW / 2, 1185)
    footer(s, 5)
    out.append(s)
    # 6 CTA
    s = cover("mural", 0.5, 0.6, 1.2).filter(ImageFilter.GaussianBlur(9))
    s = Image.blend(s, Image.new("RGBA", (CW, CH), MAROON3 + (255,)), 0.6)
    bandeirinhas(s, 2.0)
    s.alpha_composite(F.original_logo(520), (CW // 2 - 260, 230))
    put(s, ttext("Setor de Mansões de Taguatinga", "playi5", 46), CW / 2, 860)
    put(s, ttext("Traz a família!", "script", 140, GOLD), CW / 2, 1010)
    put(s, chip("SALVA ESSE POST E MARCA QUEM VEM", 30), CW / 2, 1160)
    footer(s, 6)
    out.append(s)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for i, s in enumerate(slides(), 1):
        s.convert("RGB").save(OUT / f"fazendinha_carrossel_{i}.jpg", quality=94)
    lg = ROOT / "saida/logo"
    lg.mkdir(parents=True, exist_ok=True)
    F.original_logo(1600).save(lg / "fazendinha_logo_original_HD.png")
    print("OK")


if __name__ == "__main__":
    main()
