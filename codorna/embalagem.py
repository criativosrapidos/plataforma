#!/usr/bin/env python3
"""Mockup da bandeja (8 unidades) com a foto real das codornas, filme plástico e rótulo da marca.

Uso: python3 embalagem.py  -> saida/embalagem/
"""
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

import cod_art as A
from cod_art import BG, CREAM, GOLD, GREEN, ORANGE, RED, WHITE, font

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "saida/embalagem"


def _rounded_mask(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    return m


@lru_cache(None)
def rotulo(w=520, nome="ALECRIM"):
    h = int(w * .62)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), int(w * .06), fill=CREAM + (255,))
    d.rounded_rectangle((0, 0, w - 1, int(h * .2)), int(w * .06), fill=ORANGE + (255,))
    d.rectangle((0, int(h * .12), w - 1, int(h * .2)), fill=ORANGE + (255,))
    d.text((w / 2, h * .1), "CODORNA INTEIRA", font=font("lil", int(w * .075)), fill=WHITE, anchor="mm")
    lg = A.logo(int(h * .62), nome)
    img.alpha_composite(lg, (int(w * .05), int(h * .27)))
    x = w * .05 + lg.width + w * .04
    d.text((x, h * .36), "LIMPA E", font=font("lil", int(w * .06)), fill=BG, anchor="lm")
    d.text((x, h * .46), "PRONTA PRA", font=font("lil", int(w * .06)), fill=BG, anchor="lm")
    d.text((x, h * .56), "TEMPERAR", font=font("lil", int(w * .06)), fill=BG, anchor="lm")
    bx0, by0 = x, h * .66
    d.rounded_rectangle((bx0, by0, w * .95, h * .9), int(h * .06), fill=RED + (255,))
    d.text(((bx0 + w * .95) / 2, (by0 + h * .9) / 2), "8 UNIDADES", font=font("lil", int(w * .062)), fill=WHITE,
           anchor="mm")
    return img


@lru_cache(None)
def selo_fritar(size=220):
    import math
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    n = 18
    pts = [(size / 2 + (size / 2 if k % 2 == 0 else size * .43) * math.cos(k * math.pi / n),
            size / 2 + (size / 2 if k % 2 == 0 else size * .43) * math.sin(k * math.pi / n)) for k in range(2 * n)]
    d.polygon(pts, fill=GOLD + (255,))
    d.text((size / 2, size * .40), "IDEAL", font=font("lil", int(size * .17)), fill=BG, anchor="mm")
    d.text((size / 2, size * .60), "PRA FRITAR", font=font("lil", int(size * .13)), fill=RED, anchor="mm")
    return img


@lru_cache(None)
def bandeja(width=760, nome="ALECRIM"):
    """Bandeja preta vista de cima, com as 8 codornas da foto real, filme e rótulo."""
    w = width
    h = int(w * 1.62)
    img = Image.new("RGBA", (w + 80, h + 100), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((40, 64, w + 40, h + 64), int(w * .07), fill=(0, 0, 0, 180))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(w * .035)))
    tray = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    td = ImageDraw.Draw(tray)
    td.rounded_rectangle((0, 0, w - 1, h - 1), int(w * .07), fill=(34, 34, 36, 255))
    td.rounded_rectangle((w * .025, w * .025, w * .975, h - w * .025), int(w * .06), fill=(52, 52, 56, 255))
    iw, ih = int(w * .88), int(h - w * .12)
    src = Image.open(ROOT / "assets/raw/codornas_tabua.jpg").convert("RGB").crop((60, 130, 860, 1560))
    src = ImageEnhance.Color(src).enhance(1.15)
    src = ImageEnhance.Brightness(src).enhance(1.06)
    src = src.resize((iw, ih), Image.LANCZOS).convert("RGBA")
    yy, xx = np.mgrid[0:ih, 0:iw].astype(np.float32)
    vig = np.clip(1 - (np.abs(xx / iw - .5) * 2) ** 6 - (np.abs(yy / ih - .5) * 2) ** 8, .35, 1)
    arr = np.asarray(src).astype(np.float32)
    arr[..., :3] *= vig[..., None]
    src = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    src.putalpha(_rounded_mask(iw, ih, int(w * .05)))
    tray.alpha_composite(src, ((w - iw) // 2, (h - ih) // 2))
    # filme plástico: reflexos diagonais
    film = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(film)
    for x0, ww, a in ((-.2, .18, 70), (.25, .07, 55), (.55, .3, 35), (.9, .05, 60)):
        fd.polygon([(w * x0, h), (w * (x0 + ww), h), (w * (x0 + ww + .7), 0), (w * (x0 + .7), 0)],
                   fill=(255, 255, 255, a))
    film = film.filter(ImageFilter.GaussianBlur(w * .02))
    film.putalpha(Image.fromarray(np.minimum(np.asarray(film.getchannel("A")),
                                             np.asarray(_rounded_mask(w, h, int(w * .07))))))
    tray.alpha_composite(film)
    ImageDraw.Draw(tray).rounded_rectangle((w * .02, w * .02, w * .98, h - w * .02), int(w * .06),
                                           outline=(255, 255, 255, 70), width=max(2, w // 200))
    rt = rotulo(int(w * .78), nome).rotate(-3, Image.BICUBIC, expand=True)
    tray.alpha_composite(rt, (int(w / 2 - rt.width / 2), int(h * .64)))
    sf = selo_fritar(int(w * .3)).rotate(12, Image.BICUBIC, expand=True)
    tray.alpha_composite(sf, (int(w * .66), int(h * .03)))
    img.alpha_composite(tray, (40, 40))
    return img


def cena(nome="ALECRIM"):
    """Foto de produto 1080x1350: bandeja sobre mesa de madeira clara."""
    W, H = 1080, 1350
    rng = np.random.default_rng(3)
    y = np.linspace(0, 1, H)[:, None]
    x = np.linspace(0, 1, W)[None, :]
    grain = (np.sin(x * 90 + np.sin(y * 7) * 3) * 6 + rng.normal(0, 4, (H, W)))
    base = np.stack([196 + grain, 150 + grain * .8, 104 + grain * .6], -1)
    vig = np.clip(1.1 - np.sqrt((x - .5) ** 2 + (y - .5) ** 2) * .9, .6, 1)[..., None]
    bg = Image.fromarray((base * vig).clip(0, 255).astype(np.uint8)).convert("RGBA")
    b = bandeja(700, nome)
    s = 1240 / b.height
    b = b.resize((int(b.width * s), 1240), Image.LANCZOS).rotate(-4, Image.BICUBIC, expand=True)
    bg.alpha_composite(b, ((W - b.width) // 2, (H - b.height) // 2))
    return bg


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    cena().convert("RGB").save(OUT / "bandeja_codorna_do_alecrim.jpg", quality=94)
    bandeja(900).save(OUT / "bandeja_codorna_do_alecrim_recorte.png")
    A.logo(1200, "ALECRIM").save(OUT / "logo_codorna_do_alecrim.png")
    A.logo(1200, "EBER").save(OUT / "logo_codorna_do_eber.png")
    print("OK")


if __name__ == "__main__":
    main()
