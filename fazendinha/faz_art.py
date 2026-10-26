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


@lru_cache(None)
def original_logo(size=1000):
    """Logo ORIGINAL do cliente, ampliado com super-resolução (EDSR) e recortado no círculo."""
    root = Path(__file__).resolve().parent / "assets"
    hd = root / "hd/logo_original.png"
    src = Image.open(hd if hd.exists() else root / "raw/logo_original.png").convert("RGB")
    src = src.filter(ImageFilter.UnsharpMask(2, 50, 2))
    img = src.resize((size, size), Image.LANCZOS).convert("RGBA")
    k = 4
    m = Image.new("L", (size * k, size * k), 0)
    ImageDraw.Draw(m).ellipse((size * k * .012, size * k * .012, size * k * .988, size * k * .988), fill=255)
    img.putalpha(m.resize((size, size), Image.LANCZOS))
    return img


# ------------------------------------------------- LOGO ORIGINAL RECRIADO ---
@lru_cache(None)
def logo_recriado(size=1600):
    """Recriação fiel (vetorial) do logo original: mesmo desenho, nítido em qualquer tamanho."""
    S = size * 2
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    # fundo vinho com losangos sutis
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32) / S
    u, v = (xx + yy) * 3.2, (xx - yy) * 3.2
    chk = ((np.floor(u) + np.floor(v)) % 2)[..., None]
    c1, c2 = np.array([66, 22, 22], np.float32), np.array([56, 18, 18], np.float32)
    col = c1 * chk + c2 * (1 - chk)
    rad = np.sqrt((xx - .5) ** 2 + (yy - .42) ** 2)[..., None]
    col = col * np.clip(1.12 - rad * .55, .7, 1.1)
    bg = Image.fromarray(np.concatenate([col, np.full((S, S, 1), 255, np.float32)], -1).clip(0, 255).astype(np.uint8))
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).ellipse((0, 0, S - 1, S - 1), fill=255)
    img.paste(bg, (0, 0), m)
    d = ImageDraw.Draw(img)
    BLK, WHT, GRY = (16, 12, 12, 255), (250, 250, 248, 255), (214, 214, 214, 255)

    # casinha: traçado copiado do original (coordenadas do recorte 840x520 da região da casa)
    def M(pts):
        return [(S * (.312 + x / 840 * .42), S * (.08 + y / 520 * .26)) for x, y in pts]
    BLK, WHT = (14, 10, 10, 255), (252, 252, 250, 255)
    d.polygon(M([(28, 305), (155, 238), (262, 133), (300, 146), (392, 198), (392, 100), (484, 94), (490, 220),
                 (712, 352), (640, 364), (600, 354), (590, 404), (624, 420), (330, 446), (108, 426), (116, 322)]), fill=BLK)
    d.polygon(M([(16, 440), (330, 430), (706, 436), (770, 452), (330, 462), (24, 454)]), fill=BLK)       # chão
    d.polygon(M([(126, 332), (258, 178), (344, 262), (318, 272), (312, 402), (124, 404)]), fill=WHT)     # empena
    d.polygon(M([(296, 168), (392, 224), (488, 236), (664, 344), (470, 348), (378, 268), (338, 244)]), fill=WHT)  # telhado
    d.polygon(M([(410, 116), (442, 112), (444, 202), (412, 206)]), fill=WHT)                              # chaminé
    d.polygon(M([(470, 352), (588, 352), (584, 398), (470, 402)]), fill=WHT)                              # parede baixa
    d.polygon(M([(228, 272), (318, 272), (318, 420), (228, 420)]), fill=BLK)                              # porta
    d.polygon(M([(280, 284), (300, 284), (300, 420), (280, 420)]), fill=WHT)                              # batente
    d.polygon(M([(318, 384), (404, 374), (408, 412), (320, 418)]), fill=WHT)

    # placa de cobre/madeira
    px0, px1, py0, py1 = S * .012, S * .988, S * .325, S * .525
    ph = py1 - py0
    gx = np.linspace(0, 1, int(px1 - px0))[None, :]
    gy = np.linspace(0, 1, int(ph))[:, None]
    tone = 1 - (np.abs(gy - .42) * 1.1) ** 1.6 * .9 - (np.abs(gx - .5) * 1.0) ** 3 * .35
    light, dark = np.array([248, 200, 138], np.float32), np.array([210, 132, 64], np.float32)
    pcol = dark + (light - dark) * np.clip(tone, 0, 1)[..., None]
    plank = Image.fromarray(np.concatenate([pcol, np.full(pcol.shape[:2] + (1,), 255, np.float32)], -1).astype(np.uint8))
    pm = Image.new("L", plank.size, 0)
    ImageDraw.Draw(pm).rounded_rectangle((0, 0, plank.width - 1, plank.height - 1), int(ph * .45), fill=255)
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 170), (int(px0), int(py0 + S * .012)), pm)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S * .008)))
    img.paste(plank, (int(px0), int(py0)), pm)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((px0, py0, px1, py1), int(ph * .45), outline=(120, 70, 36, 255), width=int(S * .005))
    for rx in (S * .05, S * .95):
        r = S * .016
        d.ellipse((rx - r, (py0 + py1) / 2 - r, rx + r, (py0 + py1) / 2 + r), fill=(70, 46, 30, 255))
        d.ellipse((rx - r * .5, (py0 + py1) / 2 - r * .6, rx + r * .05, (py0 + py1) / 2 - r * .05), fill=(190, 160, 120, 255))
    # FAZENDINHA: Bevan comprimida na horizontal (letra alta e estreita como no original)
    f = ImageFont.truetype(str(FONTS / "bevan-latin-400-normal.woff"), int(S * .17))
    tb = ImageDraw.Draw(Image.new("L", (1, 1))).textbbox((0, 0), "FAZENDINHA", font=f)
    tw_, th_ = tb[2] - tb[0], tb[3] - tb[1]
    tl = Image.new("RGBA", (tw_ + 40, th_ + 40), (0, 0, 0, 0))
    ImageDraw.Draw(tl).text((20 - tb[0], 20 - tb[1]), "FAZENDINHA", font=f, fill=(14, 10, 8, 255))
    target_w, target_h = S * .87, ph * .86
    tl = tl.resize((int(target_w), int(target_h)), Image.LANCZOS)
    img.alpha_composite(tl, (int(S / 2 - tl.width / 2), int((py0 + py1) / 2 - tl.height / 2 + S * .004)))

    # Self Service
    d = ImageDraw.Draw(img)
    fs = ImageFont.truetype(str(FONTS / "lobster-latin-400-normal.woff"), int(S * .125))
    d.text((S * .515 + S * .004, S * .662 + S * .006), "Self Service", font=fs, fill=(20, 6, 6, 160), anchor="mm")
    d.text((S * .515, S * .662), "Self Service", font=fs, fill=(236, 214, 182, 255), anchor="mm")
    # pincelada: traço contínuo, fino à esquerda e grosso à direita, ponta arredondada
    top, bot = [], []
    n = 80
    for i in range(n + 1):
        u = i / n
        x = S * (.16 + .72 * u)
        y = S * (.828 - .032 * u - .012 * math.sin(u * math.pi))
        th = S * (.002 + .0135 * u ** .75)
        top.append((x, y - th))
        bot.append((x, y + th * .8))
    sw = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sw)
    cream = (230, 204, 164, 255)
    sd.polygon(top + bot[::-1], fill=cream)
    xe, ye = (top[-1][0] + bot[-1][0]) / 2, (top[-1][1] + bot[-1][1]) / 2
    re_ = (bot[-1][1] - top[-1][1]) / 2
    sd.ellipse((xe - re_ * 1.15, ye - re_, xe + re_ * 1.15, ye + re_), fill=cream)
    img.alpha_composite(sw)
    # borda escura sutil
    ImageDraw.Draw(img).ellipse((S * .004, S * .004, S * .996, S * .996), outline=(24, 6, 6, 255), width=int(S * .006))
    return img.resize((size, size), Image.LANCZOS)
