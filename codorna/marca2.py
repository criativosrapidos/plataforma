#!/usr/bin/env python3
"""Codorna do Alecrim - marca v2 (adulta/premium) e bandeja de isopor realista com filme e etiqueta.

Uso: python3 marca2.py  -> saida/marca_v2/
"""
import math
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
FONTS = ROOT / "fonts"
OUT = ROOT / "saida/marca_v2"
CHAR, CHAR2 = (24, 21, 19), (38, 33, 30)
AMBER, AMBER_D = (222, 164, 82), (176, 118, 48)
CREAM, WHITE = (244, 234, 214), (255, 255, 255)
HERB = (98, 132, 74)
K = 3


@lru_cache(None)
def font(name, size):
    f = {"anton": "anton-latin-400-normal.woff", "osw5": "oswald-latin-500-normal.woff",
         "osw6": "oswald-latin-600-normal.woff", "osw7": "oswald-latin-700-normal.woff",
         "play": "playfair-display-latin-700-italic.woff", "m6": "montserrat-latin-600-normal.woff",
         "m7": "montserrat-latin-700-normal.woff", "m8": "montserrat-latin-800-normal.woff",
         "m9": "montserrat-latin-900-normal.woff"}[name]
    return ImageFont.truetype(str(FONTS / f), size)


def tracked(d, cx, y, text, f, fill, track, anchor="mm"):
    ws = [d.textlength(c, font=f) for c in text]
    total = sum(ws) + track * (len(text) - 1)
    x = cx - total / 2
    for c, w in zip(text, ws):
        d.text((x + w / 2, y), c, font=f, fill=fill, anchor=anchor)
        x += w + track
    return total


def bezier(p0, p1, p2, p3, n=24):
    return [((1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t * t * p2[0] + t ** 3 * p3[0],
             (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3 * p3[1])
            for t in np.linspace(0, 1, n)]


@lru_cache(None)
def quail(size=400, color=CREAM):
    """Silhueta elegante de codorna (curvas de Bézier), com o penacho característico."""
    S = size * K
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = S / 100
    P = lambda x, y: (x * u, y * u)
    body = []
    body += bezier(P(8, 58), P(14, 40), P(36, 36), P(52, 42))        # dorso
    body += bezier(P(52, 42), P(58, 30), P(64, 22), P(74, 24))       # nuca
    body += bezier(P(74, 24), P(82, 25), P(86, 30), P(86, 34))       # cabeça
    body += [P(93, 37), P(86, 39)]                                    # bico
    body += bezier(P(86, 39), P(84, 46), P(80, 50), P(80, 56))       # papo
    body += bezier(P(80, 56), P(82, 74), P(66, 86), P(46, 86))       # peito
    body += bezier(P(46, 86), P(28, 86), P(16, 78), P(12, 68))       # barriga
    body += [P(2, 64)]                                                # cauda
    d.polygon(body, fill=color + (255,))
    crest = bezier(P(70, 25), P(66, 14), P(70, 8), P(78, 9), 20) + bezier(P(78, 9), P(74, 12), P(73, 18), P(75, 24), 20)
    d.polygon(crest, fill=color + (255,))
    d.ellipse((76 * u, 27 * u, 79.5 * u, 30.5 * u), fill=(0, 0, 0, 0))   # olho vazado
    wing = bezier(P(30, 58), P(42, 50), P(58, 52), P(66, 62), 20) + bezier(P(66, 62), P(56, 60), P(42, 62), P(30, 58), 20)
    for i in range(4):
        x = (36 + i * 8) * u
        d.ellipse((x, 70 * u, x + 2.2 * u, 72.2 * u), fill=(0, 0, 0, 0))
    return img.resize((size, size), Image.LANCZOS)


@lru_cache(None)
def sprig(width=400, color=HERB):
    """Raminho de alecrim em traço fino."""
    S = width * K
    h = S // 4
    img = Image.new("RGBA", (S, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pts = [(S * .05 + i * S * .9 / 40, h * .55 - math.sin(i / 40 * math.pi) * h * .15) for i in range(41)]
    d.line(pts, fill=color + (255,), width=max(2, S // 140))
    for i in range(3, 39, 2):
        x, y = pts[i]
        ln = S * .045 * (1 - abs(i - 20) / 40)
        for sgn in (-1, 1):
            d.line((x, y, x + ln * .6, y + sgn * ln), fill=color + (255,), width=max(2, S // 170))
    return img.resize((width, width // 4), Image.LANCZOS)


@lru_cache(None)
def emblema(size=900, dark=True):
    """Selo redondo: fundo grafite, anéis âmbar, codorna, CODORNA / do Alecrim, raminho."""
    S = size * 2
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    bg = CHAR if dark else CREAM
    fg = CREAM if dark else CHAR
    d.ellipse((0, 0, S - 1, S - 1), fill=bg + (255,))
    d.ellipse((S * .035, S * .035, S * .965, S * .965), outline=AMBER + (255,), width=int(S * .008))
    d.ellipse((S * .055, S * .055, S * .945, S * .945), outline=AMBER + (160,), width=int(S * .003))
    q = quail(int(S * .40), AMBER)
    img.alpha_composite(q, (int(S / 2 - q.width / 2), int(S * .13)))
    tracked(d, S / 2, S * .605, "CODORNA", font("anton", int(S * .155)), fg, S * .012)
    d.text((S / 2, S * .745), "do Alecrim", font=font("play", int(S * .085)), fill=AMBER, anchor="mm")
    sp = sprig(int(S * .42), HERB if dark else (80, 112, 60))
    img.alpha_composite(sp, (int(S / 2 - sp.width / 2), int(S * .80)))
    for a in (-1, 1):  # estrelinhas laterais
        x = S / 2 + a * S * .36
        d.regular_polygon((x, S * .605, S * .012), 4, fill=AMBER)
    return img.resize((size, size), Image.LANCZOS)


@lru_cache(None)
def horizontal(height=200, dark=True):
    """Assinatura horizontal: codorna + CODORNA do Alecrim."""
    h = height * 2
    fg = CREAM if dark else CHAR
    f1, f2 = font("anton", int(h * .52)), font("play", int(h * .30))
    probe = ImageDraw.Draw(Image.new("L", (1, 1)))
    w1 = probe.textlength("CODORNA", font=f1) + 6 * h * .03
    w = int(h * 1.1 + max(w1, probe.textlength("do Alecrim", font=f2)) + h * .2)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    q = quail(int(h * .95), AMBER)
    img.alpha_composite(q, (0, int(h * .02)))
    x0 = h * 1.05
    tracked(d, x0 + w1 / 2, h * .36, "CODORNA", f1, fg, h * .03)
    d.text((x0 + 4, h * .80), "do Alecrim", font=f2, fill=AMBER, anchor="lm")
    return img.resize((w // 2, height), Image.LANCZOS)


# --------------------------------------------------------------- bandeja ---
def _noise(w, h, amp, seed, blur=0):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, amp, (h, w)).astype(np.float32)
    if blur:
        n = np.asarray(Image.fromarray(np.clip(n + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
                       ).astype(np.float32) - 128
    return n


def _rmask(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    return m


@lru_cache(None)
def barcode(w=300, h=90):
    img = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(7)
    x = 8
    while x < w - 8:
        bw = int(rng.choice([2, 2, 3, 4, 5]))
        if rng.random() < .55:
            d.rectangle((x, 4, x + bw - 1, h - 22), fill=(20, 20, 20, 255))
        x += bw
    d.text((w / 2, h - 10), "7 891234 567890", font=font("m6", 14), fill=(20, 20, 20), anchor="mm")
    return img


@lru_cache(None)
def etiqueta(w=520):
    """Etiqueta de balança/produto, como as de supermercado."""
    h = int(w * .74)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), int(w * .025), fill=(252, 251, 247, 255))
    d.rounded_rectangle((0, 0, w - 1, int(h * .27)), int(w * .025), fill=CHAR + (255,))
    d.rectangle((0, int(h * .2), w - 1, int(h * .27)), fill=CHAR + (255,))
    hz = horizontal(int(h * .19), True)
    img.alpha_composite(hz, (int(w * .04), int(h * .04)))
    d.text((w * .05, h * .37), "CODORNA INTEIRA", font=font("osw7", int(w * .068)), fill=CHAR, anchor="lm")
    d.text((w * .05, h * .47), "Limpa e pronta para temperar", font=font("m6", int(w * .036)), fill=(90, 80, 70),
           anchor="lm")
    d.rounded_rectangle((w * .64, h * .31, w * .95, h * .52), int(w * .02), fill=AMBER + (255,))
    d.text((w * .795, h * .375), "8", font=font("anton", int(w * .1)), fill=CHAR, anchor="mm")
    d.text((w * .795, h * .47), "UNIDADES", font=font("osw6", int(w * .036)), fill=CHAR, anchor="mm")
    d.line((w * .05, h * .57, w * .95, h * .57), fill=(210, 204, 194), width=2)
    rows = [("PESO LÍQ.", "______ kg"), ("EMBALADO", "___/___/____"), ("VALIDADE", "___/___/____")]
    for i, (k, v) in enumerate(rows):
        y = h * (.64 + i * .09)
        d.text((w * .05, y), k, font=font("osw6", int(w * .036)), fill=(90, 80, 70), anchor="lm")
        d.text((w * .27, y), v, font=font("m6", int(w * .034)), fill=(140, 130, 120), anchor="lm")
    bc = barcode(int(w * .36), int(h * .25))
    img.alpha_composite(bc, (int(w * .6), int(h * .6)))
    return img


@lru_cache(None)
def bandeja(width=800):
    """Bandeja de isopor branca, codornas recortadas da foto real, filme plástico e etiqueta."""
    w = width
    h = int(w * 1.55)
    pad = int(w * .08)
    out = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    # sombra no balcão
    sh = Image.new("L", out.size, 0)
    ImageDraw.Draw(sh).rounded_rectangle((pad, pad + w * .03, pad + w, pad + h + w * .03), int(w * .08), fill=190)
    out.putalpha(sh.filter(ImageFilter.GaussianBlur(w * .035)))
    out = Image.composite(Image.new("RGBA", out.size, (0, 0, 0, 255)), Image.new("RGBA", out.size, (0, 0, 0, 0)),
                          out.getchannel("A"))
    # isopor: aba externa clara + parede interna sombreada + fundo
    foam = np.full((h, w, 3), 236, np.float32) + _noise(w, h, 3.2, 1, 0.6)[..., None]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    rim = w * .07
    dx = np.minimum(xx, w - 1 - xx)
    dy = np.minimum(yy, h - 1 - yy)
    dist = np.minimum(dx, dy)
    wall = np.clip((dist - rim * .55) / (rim * .9), 0, 1)        # 0 na aba, 1 no fundo
    light = 1 - .10 * (1 - wall) * (xx / w) - .06 * wall          # luz de cima-esquerda
    inner_shadow = np.where((dist > rim * .5) & (dist < rim * 1.5), np.exp(-((dist - rim * .7) / (rim * .35)) ** 2) * .14, 0)
    foam = foam * (light - inner_shadow)[..., None]
    lip = np.exp(-((dist - rim * .5) / (rim * .07)) ** 2) * 14       # quina da aba
    foam += lip[..., None]
    tray = Image.fromarray(np.clip(foam, 0, 255).astype(np.uint8)).convert("RGBA")
    tray.putalpha(_rmask(w, h, int(w * .08)))
    # codornas recortadas (foto real) sobre o fundo da bandeja
    cod = Image.open(ROOT / "assets/codornas_recorte.png")
    iw = int(w * .90)
    ih = int(cod.height * iw / cod.width)
    if ih > h * .88:
        ih = int(h * .88)
        iw = int(cod.width * ih / cod.height)
    cod = cod.resize((iw, ih), Image.LANCZOS)
    cx, cy = (w - iw) // 2, (h - ih) // 2
    csh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    csh.paste((60, 40, 30, 120), (cx + int(w * .008), cy + int(w * .014)), cod.getchannel("A"))
    tray.alpha_composite(csh.filter(ImageFilter.GaussianBlur(w * .01)))
    tray.alpha_composite(cod, (cx, cy))
    # filme plástico: brilho difuso + reflexos finos + rugas na borda
    film = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(film)
    for x0, ww, a in ((-.35, .30, 46), (.12, .06, 70), (.30, .02, 110), (.62, .22, 30), (.95, .04, 80)):
        fd.polygon([(w * x0, h), (w * (x0 + ww), h), (w * (x0 + ww + .55), 0), (w * (x0 + .55), 0)],
                   fill=(255, 255, 255, a))
    film = film.filter(ImageFilter.GaussianBlur(w * .012))
    fd = ImageDraw.Draw(film)
    rng = np.random.default_rng(5)
    for _ in range(26):   # rugas do filme perto das bordas
        side = rng.integers(4)
        t0 = rng.uniform(.1, .9)
        L = rng.uniform(.03, .08)
        if side == 0:
            p = [(w * t0, rim * .6), (w * (t0 + L * .3), rim * (1.4 + rng.uniform(0, .8)))]
        elif side == 1:
            p = [(w * t0, h - rim * .6), (w * (t0 - L * .3), h - rim * (1.4 + rng.uniform(0, .8)))]
        elif side == 2:
            p = [(rim * .6, h * t0), (rim * (1.4 + rng.uniform(0, .8)), h * (t0 + L * .2))]
        else:
            p = [(w - rim * .6, h * t0), (w - rim * (1.4 + rng.uniform(0, .8)), h * (t0 - L * .2))]
        fd.line(p, fill=(255, 255, 255, int(rng.uniform(60, 130))), width=max(1, w // 400))
    film.putalpha(Image.fromarray(np.minimum(np.asarray(film.getchannel("A")), np.asarray(_rmask(w, h, int(w * .08))))))
    tray.alpha_composite(film)
    # etiqueta colada sobre o filme
    et = etiqueta(int(w * .58)).rotate(2.5, Image.BICUBIC, expand=True)
    esh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ex, ey = int(w * .38), int(h * .70)
    esh.paste((0, 0, 0, 70), (ex + 3, ey + 6), et.getchannel("A"))
    tray.alpha_composite(esh.filter(ImageFilter.GaussianBlur(4)))
    tray.alpha_composite(et, (ex, ey))
    out.alpha_composite(tray, (pad, pad))
    return out


def cena_produto(W=1080, H=1350):
    """Foto de produto: bandeja sobre bancada de granito escuro, luz suave de cima."""
    y = np.linspace(0, 1, H)[:, None]
    x = np.linspace(0, 1, W)[None, :]
    base = 46 - 22 * np.sqrt((x - .5) ** 2 + (y - .35) ** 2)
    stone = base + _noise(W, H, 6, 3, 1.2) + _noise(W, H, 3, 4)
    col = np.stack([stone * 1.02, stone, stone * .96], -1)
    bg = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).convert("RGBA")
    b = bandeja(720)
    s = 1260 / b.height
    b = b.resize((int(b.width * s), 1260), Image.LANCZOS).rotate(-6, Image.BICUBIC, expand=True)
    bg.alpha_composite(b, ((W - b.width) // 2, (H - b.height) // 2 + 10))
    return bg


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    cena_produto().convert("RGB").save(OUT / "bandeja_codorna_do_alecrim.jpg", quality=95)
    bandeja(900).save(OUT / "bandeja_recorte.png")
    emblema(1200).save(OUT / "logo_codorna_do_alecrim.png")
    emblema(1200, False).save(OUT / "logo_codorna_do_alecrim_claro.png")
    horizontal(240).save(OUT / "logo_horizontal.png")
    print("OK")


if __name__ == "__main__":
    main()
