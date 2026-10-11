"""Identidade da Fazendinha Self Service: selo, placa de madeira, casinha e tipografia."""
import math
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONTS = Path(__file__).resolve().parent / "fonts"
MAROON, MAROON2, MAROON3 = (54, 16, 18), (88, 28, 26), (34, 10, 11)
WOOD, WOOD_L, WOOD_D = (200, 142, 84), (226, 176, 114), (128, 80, 40)
CREAM, GOLD, INK = (247, 236, 216), (226, 180, 112), (38, 20, 14)
K = 3


@lru_cache(None)
def font(name, size):
    f = {"slab": "alfa-slab-one-latin-400-normal.woff", "script": "dancing-script-latin-700-normal.woff",
         "script6": "dancing-script-latin-600-normal.woff", "play": "playfair-display-latin-800-normal.woff",
         "play7": "playfair-display-latin-700-normal.woff", "playi": "playfair-display-latin-700-italic.woff",
         "playi5": "playfair-display-latin-500-italic.woff", "m4": "montserrat-latin-400-normal.woff",
         "m5": "montserrat-latin-500-normal.woff", "m6": "montserrat-latin-600-normal.woff",
         "m7": "montserrat-latin-700-normal.woff", "m8": "montserrat-latin-800-normal.woff"}[name]
    return ImageFont.truetype(str(FONTS / f), size)


def fit_text(text, name, max_w, start):
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    s = start
    while s > 8 and d.textlength(text, font=font(name, s)) > max_w:
        s -= 2
    return font(name, s)


# ------------------------------------------------------------------ casinha --
def house(w, color=CREAM, accent=MAROON):
    """Casinha de fazenda: telhado em duas águas, chaminé, porta e janela."""
    s = w * K
    h = int(s * 0.62)
    img = Image.new("RGBA", (s, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = color + (255,)
    # chaminé + fumaça
    d.rectangle((s * .66, h * .08, s * .74, h * .38), fill=c)
    for i, (x, y, r) in enumerate(((.72, .02, .035), (.77, -.04, .028))):
        pass
    # telhado
    d.polygon([(s * .06, h * .52), (s * .5, h * .04), (s * .94, h * .52), (s * .86, h * .52), (s * .5, h * .16),
               (s * .14, h * .52)], fill=c)
    # paredes
    d.rectangle((s * .2, h * .5, s * .8, h * .97), fill=c)
    # porta (celeiro, com X)
    d.rectangle((s * .41, h * .62, s * .59, h * .97), fill=accent + (255,))
    lw = max(2, int(s * .012))
    d.line((s * .41, h * .62, s * .59, h * .97), fill=c, width=lw)
    d.line((s * .59, h * .62, s * .41, h * .97), fill=c, width=lw)
    d.rectangle((s * .41, h * .62, s * .59, h * .97), outline=c, width=lw)
    # janelas
    for x0 in (.25, .66):
        d.rectangle((s * x0, h * .62, s * (x0 + .09), h * .76), fill=accent + (255,))
        d.line((s * (x0 + .045), h * .62, s * (x0 + .045), h * .76), fill=c, width=lw)
    # chão
    d.rectangle((s * .02, h * .965, s * .98, h * 1.0), fill=c)
    return img.resize((w, int(h / K)), Image.LANCZOS)


# --------------------------------------------------------------- madeira ----
def wood_plank(w, h, seed=2):
    """Placa de madeira com veios, pontas arredondadas e pregos."""
    rng = np.random.default_rng(seed)
    y = np.linspace(0, 1, h)[:, None]
    x = np.linspace(0, 1, w)[None, :]
    grain = (np.sin((y * 38 + np.sin(x * 9 + rng.random() * 6) * 0.9 + np.sin(x * 23) * 0.15) * math.pi) * 0.5 + 0.5)
    noise = rng.normal(0, 0.05, (h, w))
    t = np.clip(grain * 0.55 + noise + y * 0.25, 0, 1)
    base = np.array(WOOD_L, np.float32) * (1 - t[..., None]) + np.array(WOOD, np.float32) * t[..., None]
    edge = np.clip(1 - np.minimum(y, 1 - y) * 9, 0, 1)[..., None]
    base = base * (1 - edge * 0.35)
    arr = np.concatenate([base, np.full((h, w, 1), 255, np.float32)], -1).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(arr, "RGBA")
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), h // 2, fill=255)
    img.putalpha(m)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((2, 2, w - 3, h - 3), h // 2, outline=WOOD_D + (255,), width=max(2, h // 22))
    for cx in (h * 0.42, w - h * 0.42):
        r = h * 0.075
        d.ellipse((cx - r, h / 2 - r, cx + r, h / 2 + r), fill=(90, 60, 36, 255))
        d.ellipse((cx - r * .45, h / 2 - r * .6, cx + r * .1, h / 2 - r * .1), fill=(200, 170, 130, 255))
    return img


def plank_text(text, w, h, color=INK, fname="slab", seed=2):
    p = wood_plank(w, h, seed)
    d = ImageDraw.Draw(p)
    f = fit_text(text, fname, w - h * 1.3, int(h * 0.72))
    d.text((w / 2 + 2, h / 2 + 4), text, font=f, fill=(255, 230, 190, 140), anchor="mm")
    d.text((w / 2, h / 2 + 2), text, font=f, fill=color, anchor="mm")
    return p


# ------------------------------------------------------------------- selo ---
@lru_cache(None)
def badge(size=1000):
    s = size
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    dist = np.sqrt((xx - s / 2) ** 2 + (yy - s * .42) ** 2) / (s * .62)
    t = np.clip(dist, 0, 1)[..., None]
    col = np.array(MAROON2, np.float32) * (1 - t) + np.array(MAROON3, np.float32) * t
    disk = Image.fromarray(np.concatenate([col, np.full((s, s, 1), 255, np.float32)], -1).astype(np.uint8), "RGBA")
    m = Image.new("L", (s * 2, s * 2), 0)
    ImageDraw.Draw(m).ellipse((0, 0, s * 2 - 1, s * 2 - 1), fill=255)
    img.paste(disk, (0, 0), m.resize((s, s), Image.LANCZOS))
    d = ImageDraw.Draw(img)
    d.ellipse((s * .035, s * .035, s * .965, s * .965), outline=GOLD + (200,), width=max(2, s // 220))
    d.ellipse((s * .055, s * .055, s * .945, s * .945), outline=GOLD + (90,), width=max(1, s // 500))
    hs = house(int(s * .30))
    img.alpha_composite(hs, ((s - hs.width) // 2, int(s * .17)))
    pl = plank_text("FAZENDINHA", int(s * .86), int(s * .17))
    sh = Image.new("RGBA", (pl.width + 40, pl.height + 40), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 150), (20, 30), pl.getchannel("A"))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)), ((s - pl.width) // 2 - 20, int(s * .38) - 20))
    img.alpha_composite(pl, ((s - pl.width) // 2, int(s * .38)))
    f = font("script", int(s * .13))
    d.text((s / 2, s * .66), "Self Service", font=f, fill=CREAM, anchor="mm")
    d.arc((s * .24, s * .60, s * .76, s * .775), 22, 158, fill=GOLD + (255,), width=max(3, s // 120))
    tf = font("m6", int(s * .034))
    txt = "TAGUATINGA  ·  DF"
    tr = s * .012
    ws = [d.textlength(ch, font=tf) for ch in txt]
    x = s / 2 - (sum(ws) + tr * (len(txt) - 1)) / 2
    for ch, w_ in zip(txt, ws):
        d.text((x, s * .865), ch, font=tf, fill=GOLD, anchor="lm")
        x += w_ + tr
    return img


@lru_cache(None)
def wordmark(width=900, color=CREAM):
    """Versão sem disco (para usar sobre foto): casinha + FAZENDINHA + Self Service."""
    w = width
    f = fit_text("FAZENDINHA", "slab", w * .96, int(w * .2))
    d0 = ImageDraw.Draw(Image.new("L", (1, 1)))
    bb = d0.textbbox((0, 0), "FAZENDINHA", font=f)
    th = bb[3] - bb[1]
    hs = house(int(w * .22), color, MAROON)
    fs = font("script", int(th * .95))
    H = hs.height + int(th * .25) + th + int(th * 1.25)
    img = Image.new("RGBA", (w, H + 20), (0, 0, 0, 0))
    img.alpha_composite(hs, ((w - hs.width) // 2, 0))
    d = ImageDraw.Draw(img)
    y = hs.height + int(th * .25)
    d.text((w / 2, y - bb[1]), "FAZENDINHA", font=f, fill=color, anchor="ma")
    d.text((w / 2, y + th * 1.55), "Self Service", font=fs, fill=GOLD, anchor="mm")
    return img.crop(img.getbbox())
