"""Identidade premium da JABS Engenharia (preto e branco) + desenho técnico da fachada."""
import math
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONTS = Path(__file__).resolve().parent / "fonts"
WHITE, BLACK, INK = (255, 255, 255), (10, 10, 11), (18, 18, 20)
K = 4  # supersampling


@lru_cache(None)
def font(name, size):
    files = {
        "cinzel": "cinzel-latin-500-normal.woff", "cinzel6": "cinzel-latin-600-normal.woff",
        "corm": "cormorant-garamond-latin-400-normal.woff", "cormi": "cormorant-garamond-latin-400-italic.woff",
        "cormi3": "cormorant-garamond-latin-300-italic.woff",
        "mont2": "montserrat-latin-200-normal.woff", "mont3": "montserrat-latin-300-normal.woff",
        "mont4": "montserrat-latin-400-normal.woff", "mont5": "montserrat-latin-500-normal.woff",
    }
    return ImageFont.truetype(str(FONTS / files[name]), size)


def tracked(d, x, y, text, f, fill, track, anchor_center=True):
    """Texto com espaçamento entre letras; x é o centro (anchor_center) ou a borda esquerda."""
    probe = d
    ws = [probe.textlength(c, font=f) for c in text]
    total = sum(ws) + track * (len(text) - 1)
    cx = x - total / 2 if anchor_center else x
    for c, w in zip(text, ws):
        d.text((cx, y), c, font=f, fill=fill, anchor="lm")
        cx += w + track
    return total


def text_width(text, f, track):
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    return sum(d.textlength(c, font=f) for c in text) + track * (len(text) - 1)


# ------------------------------------------------------------------ monograma --
def _icon_layer(size, color, line=1.0, prog=1.0):
    """Símbolo: portal em arco (linha dupla fina) + J serifado + linha de base. prog anima o traço."""
    s = size * K
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = color + (255,)
    lw = max(2, int(s * .010 * line))
    w = s * .56
    x0, top, bot = (s - w) / 2, s * .07, s * .89
    r = w / 2
    p1 = min(1, prog / 0.55)                # contorno externo
    p2 = max(0, min(1, (prog - 0.25) / 0.5))  # contorno interno
    pj = max(0, min(1, (prog - 0.5) / 0.4))   # letra

    def portal(inset, width, p):
        if p <= 0:
            return
        leg = (bot - (top + r)) * min(1, p * 2)
        d.line((x0 + inset, bot, x0 + inset, bot - leg), fill=c, width=width)
        d.line((x0 + w - inset, bot, x0 + w - inset, bot - leg), fill=c, width=width)
        if p > 0.5:
            span = 90 * (p - 0.5) * 2
            box = (x0 + inset, top + inset, x0 + w - inset, top + w - inset)
            d.arc(box, 180, 180 + span, fill=c, width=width)
            d.arc(box, 360 - span, 360, fill=c, width=width)

    portal(0, lw, p1)
    portal(s * .03, max(1, lw // 3), p2)
    bl = min(1, prog * 1.4)
    half = (w / 2 + s * .10) * bl
    d.line((s / 2 - half, bot, s / 2 + half, bot), fill=c, width=lw)
    if pj > 0:
        jl = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        f = font("cinzel", int(s * .54))
        ImageDraw.Draw(jl).text((s / 2 + s * .012, top + r + (bot - top - r) * .40), "J", font=f, fill=c, anchor="mm")
        if pj < 1:
            jl.putalpha(jl.getchannel("A").point(lambda v: int(v * pj)))
        img.alpha_composite(jl)
    return img


@lru_cache(None)
def icon(size=600, color=WHITE):
    return _icon_layer(size, color).resize((size, size), Image.LANCZOS)


def icon_anim(size, prog, color=WHITE):
    return _icon_layer(size, color, prog=prog).resize((size, size), Image.LANCZOS)


@lru_cache(None)
def wordmark(width=900, color=WHITE, sub="ENGENHARIA"):
    """JABS (Cinzel, espaçado) + filete - ENGENHARIA - filete."""
    w = width * K
    f = font("cinzel", int(w * 0.24))
    track = w * 0.055
    tw = text_width("JABS", f, track)
    scale = (w * 0.92) / tw
    f = font("cinzel", int(w * 0.24 * scale))
    track *= scale
    fs = font("mont3", int(w * 0.052))
    probe = ImageDraw.Draw(Image.new("L", (1, 1)))
    jb = probe.textbbox((0, 0), "JABS", font=f)
    jh = jb[3] - jb[1]
    h = int(jh * 1.75)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    tracked(d, w / 2, jh * 0.5, "JABS", f, color, track)
    sw = text_width(sub, fs, w * 0.03)
    y = jh * 1.42
    tracked(d, w / 2, y, sub, fs, color, w * 0.03)
    lw = max(1, int(w * 0.003))
    gap = w * 0.03
    d.line((w * 0.04, y, w / 2 - sw / 2 - gap, y), fill=color, width=lw)
    d.line((w / 2 + sw / 2 + gap, y, w * 0.96, y), fill=color, width=lw)
    img = img.crop(img.getbbox())
    return img.resize((img.width // K, img.height // K), Image.LANCZOS)


@lru_cache(None)
def lockup(width=800, color=WHITE):
    """Logo completo vertical: monograma em cima, JABS + ENGENHARIA embaixo."""
    ic = icon(int(width * 0.62), color)
    ic = ic.crop(ic.getbbox())
    wm = wordmark(width, color)
    gap = int(width * 0.07)
    out = Image.new("RGBA", (width, ic.height + gap + wm.height), (0, 0, 0, 0))
    out.alpha_composite(ic, ((width - ic.width) // 2, 0))
    out.alpha_composite(wm, ((width - wm.width) // 2, ic.height + gap))
    return out


@lru_cache(None)
def avatar(size=1080, dark=True):
    """Foto de perfil redonda."""
    bg, fg = (BLACK, WHITE) if dark else (WHITE, BLACK)
    s = size
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    m = Image.new("L", (s, s), 0)
    ImageDraw.Draw(m).ellipse((0, 0, s - 1, s - 1), fill=255)
    base = Image.new("RGBA", (s, s), bg + (255,))
    if dark:  # leve luz central
        y, x = np.mgrid[0:s, 0:s].astype(np.float32)
        g = np.clip(1 - np.sqrt((x - s / 2) ** 2 + (y - s * .4) ** 2) / (s * .7), 0, 1) * 26
        arr = np.asarray(base).astype(np.float32)
        arr[..., :3] += g[..., None]
        base = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
    img.paste(base, (0, 0), m)
    lk = lockup(int(s * 0.58), fg)
    img.alpha_composite(lk, ((s - lk.width) // 2, (s - lk.height) // 2))
    ImageDraw.Draw(img).ellipse((s * .035, s * .035, s * .965, s * .965), outline=fg + (90,), width=max(1, s // 400))
    return img


# -------------------------------------------------------------- desenho técnico --
def facade_lines():
    """Fachada em elevação (inspirada na Obra JL), coordenadas 0..1000 x 0..760."""
    L = []

    def rect(x0, y0, x1, y1):
        L.extend([((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))])

    L.append(((0, 640), (1000, 640)))          # terreno
    rect(80, 110, 480, 170)                    # platibanda
    rect(60, 170, 800, 240)                    # laje superior em balanço
    rect(110, 240, 330, 640)                   # bloco ripado
    for y in range(275, 640, 34):
        L.append(((110, y), (330, y)))
    rect(330, 240, 420, 640)                   # pedra
    rect(420, 240, 760, 640)                   # bloco claro
    rect(400, 420, 800, 452)                   # laje intermediária
    rect(150, 280, 270, 345)                   # janelas
    rect(470, 280, 650, 375)
    L.append(((560, 280), (560, 375)))
    rect(470, 488, 650, 585)
    L.append(((560, 488), (560, 585)))
    rect(682, 470, 742, 640)                   # porta de correr
    L.append(((712, 470), (712, 640)))
    return L


DIMS = [((110, 700), (760, 700), "12,40"), ((62, 240), (62, 640), "6,20")]


def draw_blueprint(w, h, prog, color=(235, 235, 240), alpha=255):
    """Revela a fachada traço a traço (prog 0..1) + cotas."""
    k = 2
    img = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    sx, sy = w * k / 1000, w * k / 1000
    oy = (h * k - 760 * sy) / 2
    lines = facade_lines()
    lens = [math.dist(a, b) for a, b in lines]
    total = sum(lens)
    budget = total * prog
    lw = max(1, int(1.6 * k))
    for (a, b), ln in zip(lines, lens):
        if budget <= 0:
            break
        f = min(1, budget / ln)
        e = (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)
        d.line((a[0] * sx, a[1] * sy + oy, e[0] * sx, e[1] * sy + oy), fill=color + (alpha,), width=lw)
        budget -= ln
    dp = max(0, (prog - 0.55) / 0.45)
    if dp > 0:
        fd = font("mont3", int(22 * k * w / 1080))
        for (a, b, lab) in DIMS:
            col = color + (int(alpha * 0.6 * dp),)
            d.line((a[0] * sx, a[1] * sy + oy, b[0] * sx, b[1] * sy + oy), fill=col, width=max(1, lw // 2))
            for p in (a, b):
                d.line((p[0] * sx - 8 * k, p[1] * sy + oy + 8 * k, p[0] * sx + 8 * k, p[1] * sy + oy - 8 * k), fill=col,
                       width=max(1, lw // 2))
            mx, my = (a[0] + b[0]) / 2 * sx, (a[1] + b[1]) / 2 * sy + oy
            d.text((mx, my - 16 * k) if a[1] == b[1] else (mx - 16 * k, my), lab, font=fd, fill=col, anchor="mm")
    return img.resize((w, h), Image.LANCZOS)
