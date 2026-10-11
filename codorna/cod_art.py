"""Artes em motion da Codorna do Heber: codorna assada ilustrada, ícones de preparo, logo."""
import math
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONTS = Path(__file__).resolve().parent / "fonts"
BG, BG2 = (42, 14, 8), (74, 24, 10)
GOLD, ORANGE, RED = (255, 194, 51), (255, 106, 19), (226, 38, 32)
CREAM, WHITE, INK, GREEN = (255, 243, 220), (255, 255, 255), (24, 8, 4), (93, 187, 78)
K = 3


@lru_cache(None)
def font(name, size):
    f = {"lil": "lilita-one-latin-400-normal.woff", "m6": "montserrat-latin-600-normal.woff",
         "m7": "montserrat-latin-700-normal.woff", "m8": "montserrat-latin-800-normal.woff",
         "m9": "montserrat-latin-900-normal.woff", "m9i": "montserrat-latin-900-italic.woff"}[name]
    return ImageFont.truetype(str(FONTS / f), size)


def _shaded_ellipse(w, h, light, dark, cx=.38, cy=.32, power=1.25):
    """Elipse com gradiente radial (luz em cima à esquerda) - dá volume de assado."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx, ny = (xx / w - .5) * 2, (yy / h - .5) * 2
    inside = (nx ** 2 + ny ** 2) <= 1
    r = np.sqrt(((xx / w) - cx) ** 2 + ((yy / h) - cy) ** 2) / .85
    t = np.clip(r, 0, 1) ** power
    col = np.array(light, np.float32) * (1 - t[..., None]) + np.array(dark, np.float32) * t[..., None]
    rng = np.random.default_rng(w + h)
    col += rng.normal(0, 7, (h, w, 1))                      # pele crocante
    a = (inside * 255).astype(np.float32)
    img = Image.fromarray(np.concatenate([np.clip(col, 0, 255), a[..., None]], -1).astype(np.uint8))
    return img


@lru_cache(None)
def roasted(size=800):
    """Codorna assada dourada, vista de cima, com coxinhas e brilho."""
    S = size * K // 2
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gl, gd = (255, 196, 96), (150, 52, 12)
    # coxas (atrás do corpo)
    for sgn in (-1, 1):
        leg = _shaded_ellipse(int(S * .30), int(S * .42), (252, 180, 84), (140, 46, 12), .4, .3, .85)
        leg = leg.rotate(sgn * 28, Image.BICUBIC, expand=True)
        img.alpha_composite(leg, (int(S / 2 - leg.width / 2 + sgn * S * .17), int(S * .50)))
        # ossinho
        d = ImageDraw.Draw(img)
        bx, by = S / 2 + sgn * S * .30, S * .90
        d.line((S / 2 + sgn * S * .24, S * .80, bx, by), fill=(236, 214, 180), width=int(S * .035))
        d.ellipse((bx - S * .03, by - S * .03, bx + S * .03, by + S * .03), fill=(246, 230, 204))
    body = _shaded_ellipse(int(S * .62), int(S * .74), gl, gd, power=.85)
    img.alpha_composite(body, (int(S * .19), int(S * .10)))
    # asinhas
    for sgn in (-1, 1):
        wing = _shaded_ellipse(int(S * .18), int(S * .36), (248, 170, 76), (130, 42, 10), .5, .3, .85)
        wing = wing.rotate(-sgn * 18, Image.BICUBIC, expand=True)
        img.alpha_composite(wing, (int(S / 2 - wing.width / 2 + sgn * S * .30), int(S * .22)))
    d = ImageDraw.Draw(img)
    # marcas de grelha + brilho
    lay = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    for i in range(0):
        y = S * (.26 + i * .13)
        ld.line((S * .30, y + S * .05, S * .70, y - S * .05), fill=(96, 30, 6, 150), width=int(S * .018))
    m = Image.new("L", (S, S), 0)
    m.paste(body.getchannel("A"), (int(S * .19), int(S * .10)))
    lay.putalpha(Image.fromarray(np.minimum(np.asarray(lay.getchannel("A")), np.asarray(m))))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(S * .002)))
    hl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hl)
    hd.ellipse((S * .32, S * .17, S * .46, S * .42), fill=(255, 236, 190, 120))
    img.alpha_composite(hl.filter(ImageFilter.GaussianBlur(S * .025)))
    hl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hl)
    hd.ellipse((S * .36, S * .21, S * .41, S * .30), fill=(255, 255, 255, 230))   # brilho do glaceado
    hd.ellipse((S * .43, S * .19, S * .455, S * .225), fill=(255, 255, 255, 210))
    hd.ellipse((S * .62, S * .58, S * .66, S * .64), fill=(255, 240, 210, 150))
    img.alpha_composite(hl.filter(ImageFilter.GaussianBlur(S * .004)))
    # gergelim/pimenta
    rng = np.random.default_rng(4)
    d = ImageDraw.Draw(img)
    for _ in range(70):                                     # ervas e pimenta do tempero
        x, y = rng.uniform(.25, .75) * S, rng.uniform(.14, .8) * S
        if ((x / S - .5) / .30) ** 2 + ((y / S - .47) / .36) ** 2 < 1:
            r = S * rng.uniform(.004, .009)
            col = (64, 120, 40, 230) if rng.random() < .6 else (60, 22, 8, 210)
            d.ellipse((x - r, y - r * .6, x + r, y + r * .6), fill=col)
    return img.resize((size, size), Image.LANCZOS)


@lru_cache(None)
def plate(size=900):
    S = size * K // 2
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((S * .02, S * .06, S * .98, S * .98), fill=(0, 0, 0, 90))
    img = img.filter(ImageFilter.GaussianBlur(S * .02))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, S - 1, S * .94), fill=(250, 248, 242, 255))
    d.ellipse((S * .1, S * .08, S * .9, S * .86), fill=(236, 232, 224, 255))
    d.ellipse((S * .12, S * .10, S * .88, S * .84), fill=(246, 243, 236, 255))
    return img.resize((size, size), Image.LANCZOS)


@lru_cache(None)
def herb(size=300, angle=0):
    """Raminho de alecrim."""
    S = size * K
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.line((S * .5, S * .95, S * .5, S * .05), fill=(70, 110, 40), width=int(S * .025))
    for i in range(14):
        y = S * (.12 + i * .058)
        for sgn in (-1, 1):
            ln = S * (.16 - i * .003)
            pts = [(S * .5, y), (S * .5 + sgn * ln, y - S * .06)]
            d.line(pts, fill=(84, 150, 60) if i % 2 else (64, 128, 48), width=int(S * .035))
    return img.rotate(angle, Image.BICUBIC, expand=True).resize((size, size), Image.LANCZOS)


@lru_cache(None)
def garlic(size=260):
    """Cabeça de alho: bulbo com gomos, ponta torcida e raízes."""
    S = size * K
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    line = (196, 176, 160)
    d.polygon([(S * .42, S * .36), (S * .47, S * .10), (S * .5, S * .03), (S * .53, S * .10), (S * .58, S * .36)],
              fill=(240, 230, 214))
    d.ellipse((S * .14, S * .30, S * .86, S * .86), fill=(252, 247, 238), outline=line, width=int(S * .012))
    for dx in (-.2, 0, .2):
        d.arc((S * (.5 + dx - .16), S * .32, S * (.5 + dx + .16), S * .86), 200, 340, fill=line, width=int(S * .01))
        d.line((S * (.5 + dx), S * .36, S * (.5 + dx * .8), S * .84), fill=(232, 214, 222), width=int(S * .012))
    for i in range(7):
        x = S * (.38 + i * .04)
        d.line((x, S * .85, x + S * (i - 3) * .012, S * .95), fill=(214, 196, 170), width=int(S * .01))
    return img.resize((size, size), Image.LANCZOS)


def flame(size, t=0.0):
    """Chama animada (3 camadas)."""
    S = size * 2
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for k, (col, sc) in enumerate(((RED, 1.0), (ORANGE, .74), (GOLD, .48))):
        wob = math.sin(t * 9 + k) * .05
        h, w = S * .92 * sc, S * .56 * sc
        bx, by = S / 2, S * .98
        pts = []
        for i in range(40):
            a = i / 39 * math.pi
            r = math.sin(a)
            y = by - h * (i / 39) if i < 20 else by - h * ((39 - i) / 39)
            pass
        pts = [(bx - w / 2, by - h * .3), (bx - w * .45, by - h * .6), (bx - w * .1 + wob * S, by - h),
               (bx + w * .2, by - h * .62), (bx + w * .32 + wob * S, by - h * .8), (bx + w / 2, by - h * .35)]
        d.polygon(pts, fill=col + (255,))
        d.ellipse((bx - w / 2, by - h * .55, bx + w / 2, by), fill=col + (255,))
    return img.filter(ImageFilter.GaussianBlur(1)).resize((size, size), Image.LANCZOS)


@lru_cache(None)
def quail_icon(size=400, color=CREAM):
    """Silhueta de codorna (corpo redondo + penacho) - símbolo da marca."""
    S = size * K
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = color + (255,)
    d.ellipse((S * .14, S * .36, S * .80, S * .86), fill=c)               # corpo
    d.polygon([(S * .16, S * .56), (S * .02, S * .50), (S * .18, S * .68)], fill=c)  # rabinho
    d.ellipse((S * .56, S * .20, S * .84, S * .48), fill=c)               # cabeça
    d.polygon([(S * .82, S * .30), (S * .94, S * .35), (S * .82, S * .38)], fill=c)  # bico
    # penacho característico
    d.line((S * .68, S * .22, S * .64, S * .10), fill=c, width=int(S * .03))
    d.ellipse((S * .58, S * .04, S * .70, S * .13), fill=c)
    # olho e asa recortados
    d.ellipse((S * .71, S * .29, S * .75, S * .33), fill=(0, 0, 0, 0))
    for i in range(3):  # pintinhas
        x = S * (.36 + i * .1)
        d.ellipse((x, S * .70, x + S * .035, S * .735), fill=(0, 0, 0, 0))
    d.line((S * .40, S * .86, S * .38, S * .95), fill=c, width=int(S * .025))
    d.line((S * .54, S * .86, S * .56, S * .95), fill=c, width=int(S * .025))
    return img.resize((size, size), Image.LANCZOS)


@lru_cache(None)
def logo(size=800):
    """Selo: círculo laranja, codorna, CODORNA DO HEBER."""
    S = size * 2
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, S - 1, S - 1), fill=BG + (255,))
    d.ellipse((S * .03, S * .03, S * .97, S * .97), fill=ORANGE + (255,))
    d.ellipse((S * .07, S * .07, S * .93, S * .93), outline=GOLD + (255,), width=int(S * .012))
    q = quail_icon(int(S * .40), CREAM)
    img.alpha_composite(q, (int(S / 2 - q.width / 2), int(S * .12)))
    f = font("lil", int(S * .17))
    d.text((S / 2 + S * .008, S * .63 + S * .012), "CODORNA", font=f, fill=BG + (255,), anchor="mm")
    d.text((S / 2, S * .63), "CODORNA", font=f, fill=WHITE, anchor="mm")
    f2 = font("lil", int(S * .09))
    tw = d.textlength("DO HEBER", font=f2)
    d.rounded_rectangle((S / 2 - tw / 2 - S * .04, S * .73, S / 2 + tw / 2 + S * .04, S * .84), int(S * .05),
                        fill=BG + (255,))
    d.text((S / 2, S * .785), "DO HEBER", font=f2, fill=GOLD, anchor="mm")
    return img.resize((size, size), Image.LANCZOS)
