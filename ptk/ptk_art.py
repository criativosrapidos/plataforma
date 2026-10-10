"""Arte da PTK Fretes: picape (estilo Strada cabine simples), skyline de Brasília e logo."""
import math
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

YEL, YEL2, BLACK, INK, WHITE = (255, 196, 0), (240, 160, 0), (14, 14, 16), (28, 28, 32), (255, 255, 255)
FD = "/usr/share/fonts/opentype/inter/InterDisplay-{}.otf"
S = 2


@lru_cache(None)
def font(size, w="Black"):
    return ImageFont.truetype(FD.format(w), size)


def lin(w, h, c1, c2, vertical=True):
    a = np.linspace(0, 1, h if vertical else w)
    line = np.array(c1, np.float32)[None] * (1 - a[:, None]) + np.array(c2, np.float32)[None] * a[:, None]
    arr = np.repeat(line[:, None], w, 1) if vertical else np.repeat(line[None], h, 0)
    return Image.fromarray(arr.astype(np.uint8), "RGBA" if len(c1) == 4 else "RGB")


def down(img):
    return img.resize((img.width // S, img.height // S), Image.LANCZOS)


# ------------------------------------------------------------------ picape --
BODY = [(40, 300), (40, 196), (515, 196), (528, 178), (548, 84), (566, 70), (712, 70), (736, 80), (818, 172),
        (952, 192), (978, 214), (984, 262), (976, 300)]
WHEELS = [(215, 300), (812, 300)]


def _wheel(r, ang):
    s = int(r * 2)
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, s - 1, s - 1), fill=(22, 22, 24, 255))
    d.ellipse((s * .2, s * .2, s * .8, s * .8), fill=(190, 192, 198, 255))
    d.ellipse((s * .26, s * .26, s * .74, s * .74), fill=(150, 152, 160, 255))
    for i in range(5):
        a = ang + i * 2 * math.pi / 5
        d.line((s / 2, s / 2, s / 2 + math.cos(a) * s * .26, s / 2 + math.sin(a) * s * .26), fill=(90, 92, 100, 255),
               width=int(s * .07))
    d.ellipse((s * .43, s * .43, s * .57, s * .57), fill=(60, 60, 66, 255))
    return img


@lru_cache(None)
def _pickup_body(color, cargo):
    w, h = 1040 * S, 400 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    m = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(m)
    md.polygon([(x * S, y * S) for x, y in BODY], fill=255)
    for cx, cy in WHEELS:  # caixas de roda
        md.ellipse(((cx - 78) * S, (cy - 78) * S, (cx + 78) * S, (cy + 78) * S), fill=0)
    paint = lin(w, h, tuple(min(255, c + 40) for c in color) + (255,), tuple(int(c * 0.62) for c in color) + (255,))
    img.paste(paint, (0, 0), m)
    d = ImageDraw.Draw(img)
    # vidros
    d.polygon([(574 * S, 84 * S), (700 * S, 84 * S), (782 * S, 170 * S), (566 * S, 170 * S)], fill=(30, 40, 56, 255))
    d.polygon([(600 * S, 90 * S), (640 * S, 90 * S), (610 * S, 165 * S), (580 * S, 165 * S)], fill=(255, 255, 255, 60))
    d.line((672 * S, 84 * S, 672 * S, 170 * S), fill=tuple(int(c * .7) for c in color) + (255,), width=10 * S)
    # vincos, porta, maçaneta, faróis, para-choque
    d.line((60 * S, 236 * S, 960 * S, 236 * S), fill=(255, 255, 255, 70), width=4 * S)
    d.line((560 * S, 178 * S, 560 * S, 290 * S), fill=(0, 0, 0, 90), width=3 * S)
    d.line((800 * S, 178 * S, 806 * S, 290 * S), fill=(0, 0, 0, 90), width=3 * S)
    d.rounded_rectangle((590 * S, 196 * S, 630 * S, 206 * S), 4 * S, fill=(40, 40, 44, 255))
    d.polygon([(944 * S, 200 * S), (976 * S, 214 * S), (978 * S, 236 * S), (940 * S, 228 * S)], fill=(255, 240, 200, 255))
    d.rectangle((42 * S, 210 * S, 62 * S, 250 * S), fill=(200, 20, 20, 255))
    d.rounded_rectangle((900 * S, 262 * S, 990 * S, 300 * S), 8 * S, fill=(40, 40, 44, 255))
    d.rounded_rectangle((30 * S, 270 * S, 120 * S, 300 * S), 8 * S, fill=(40, 40, 44, 255))
    d.line((40 * S, 196 * S, 515 * S, 196 * S), fill=(30, 30, 34, 255), width=8 * S)  # borda da caçamba
    if cargo:
        c = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        cd = ImageDraw.Draw(c)
        boxes = [(70, 92, 210, 196, (196, 150, 96)), (215, 120, 330, 196, (210, 165, 110)),
                 (230, 60, 320, 120, (186, 140, 88)), (340, 30, 500, 196, (236, 236, 240))]
        for x0, y0, x1, y1, col in boxes:
            cd.rounded_rectangle((x0 * S, y0 * S, x1 * S, y1 * S), 6 * S, fill=col + (255,), outline=(0, 0, 0, 70),
                                 width=3 * S)
            if col[0] < 230:
                cd.line(((x0 + x1) / 2 * S, y0 * S, (x0 + x1) / 2 * S, y1 * S), fill=(150, 110, 60, 255), width=10 * S)
        cd.line((350 * S, 60 * S, 490 * S, 60 * S), fill=(200, 200, 206, 255), width=4 * S)  # colchão
        for x in (140, 420):  # cintas amarelas
            cd.line((x * S, 40 * S, x * S + 30 * S, 198 * S), fill=YEL + (255,), width=10 * S)
        img.alpha_composite(c)
        img.alpha_composite(_pickup_paint_front(color, w, h, m))
    return img


def _pickup_paint_front(color, w, h, m):
    """Repinta a lateral da caçamba por cima da carga (a carga fica 'dentro')."""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bed = Image.new("L", (w, h), 0)
    ImageDraw.Draw(bed).rectangle((40 * S, 196 * S, 515 * S, 300 * S), fill=255)
    bed = Image.fromarray(np.minimum(np.asarray(bed), np.asarray(m)))
    paint = lin(w, h, tuple(min(255, c + 40) for c in color) + (255,), tuple(int(c * 0.62) for c in color) + (255,))
    img.paste(paint, (0, 0), bed)
    d = ImageDraw.Draw(img)
    d.line((40 * S, 196 * S, 515 * S, 196 * S), fill=(30, 30, 34, 255), width=8 * S)
    d.line((60 * S, 236 * S, 510 * S, 236 * S), fill=(255, 255, 255, 70), width=4 * S)
    d.rectangle((42 * S, 210 * S, 62 * S, 250 * S), fill=(200, 20, 20, 255))
    d.rounded_rectangle((30 * S, 270 * S, 120 * S, 300 * S), 8 * S, fill=(40, 40, 44, 255))
    return img


def pickup(t=0.0, color=(214, 216, 222), cargo=True, shadow=True):
    body = _pickup_body(color, cargo).copy()
    for cx, cy in WHEELS:
        wh = _wheel(70 * S, -t * 14)
        body.alpha_composite(wh, ((cx - 70) * S, (cy - 70) * S))
    img = down(body)
    if shadow:
        out = Image.new("RGBA", (img.width, img.height + 30), (0, 0, 0, 0))
        sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse((30, img.height - 50, img.width - 20, img.height + 20), fill=(0, 0, 0, 150))
        out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
        out.alpha_composite(img)
        return out
    return img


@lru_cache(None)
def pickup_silhouette(color=BLACK):
    w, h = 1040 * S, 400 * S
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    d.polygon([(x * S, y * S) for x, y in BODY], fill=255)
    for cx, cy in WHEELS:
        d.ellipse(((cx - 80) * S, (cy - 80) * S, (cx + 80) * S, (cy + 80) * S), fill=0)
        d.ellipse(((cx - 64) * S, (cy - 64) * S, (cx + 64) * S, (cy + 64) * S), fill=255)
        d.ellipse(((cx - 26) * S, (cy - 26) * S, (cx + 26) * S, (cy + 26) * S), fill=0)
    d.polygon([(574 * S, 86 * S), (700 * S, 86 * S), (778 * S, 166 * S), (570 * S, 166 * S)], fill=0)
    img = Image.new("RGBA", (w, h), color + (0,))
    img.putalpha(m)
    return down(img)


# ----------------------------------------------------------------- skyline --
@lru_cache(None)
def skyline(w, h, color=(0, 0, 0), alpha=255):
    """Silhueta: Catedral, Congresso (torres + cúpulas) e Esplanada."""
    img = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = color + (alpha,)
    base = h * S
    # Catedral: colunas curvas, cintura estreita e coroa aberta
    cx, cw, ch = w * 0.22 * S, 120 * S, 200 * S
    n = 16
    for i in range(n):
        a = i / (n - 1) * 2 - 1
        pts = []
        for k in range(13):
            v = k / 12
            width = cw * (1 - 0.82 * math.sin(v * math.pi * 0.62)) if v < 0.8 else cw * (0.25 + (v - 0.8) * 1.9)
            pts.append((cx + a * width, base - v * ch))
        d.line(pts, fill=c, width=7 * S, joint="curve")
    d.chord((cx - cw * 1.02, base - 40 * S, cx + cw * 1.02, base + 40 * S), 180, 360, fill=c)
    d.line((cx, base - ch, cx, base - ch - 44 * S), fill=c, width=5 * S)
    d.line((cx - 14 * S, base - ch - 28 * S, cx + 14 * S, base - ch - 28 * S), fill=c, width=5 * S)
    # Congresso: torres gêmeas
    tx = w * 0.66 * S
    for dx in (-34, 6):
        d.rectangle((tx + dx * S, base - 330 * S, tx + (dx + 28) * S, base), fill=c)
    d.rectangle((tx - 34 * S, base - 250 * S, tx + 34 * S, base - 236 * S), fill=c)
    d.rectangle((w * 0.44 * S, base - 60 * S, w * 0.92 * S, base - 44 * S), fill=c)  # laje
    d.chord((w * 0.48 * S, base - 100 * S, w * 0.58 * S, base - 30 * S), 180, 360, fill=c)  # cúpula
    d.chord((w * 0.76 * S, base - 120 * S, w * 0.90 * S, base - 10 * S), 0, 180, fill=c)  # cuia (Câmara)
    d.rectangle((w * 0.82 * S, base - 60 * S, w * 0.84 * S, base), fill=c)
    # prédios da Esplanada
    for i in range(6):
        x = (w * 0.02 + i * 26) * S
        d.rectangle((x, base - 70 * S, x + 18 * S, base), fill=c)
    d.rectangle((0, base - 8 * S, w * S, base), fill=c)
    return down(img)


# -------------------------------------------------------------------- logo --
def speed_lines(d, x, y, n=3, length=150, gap=34, width=16, color=YEL):
    for i in range(n):
        L = length - i * 34
        d.rounded_rectangle((x - L - i * 18, y + i * gap, x - i * 18, y + i * gap + width), width // 2, fill=color)


def _wordmark(color_ptk, color_bar, color_bar_txt, scale=1.0):
    """PTK reto (Black) + faixa FRETES com a MESMA largura e alinhada nas duas bordas."""
    f = font(int(300 * S * scale), "Black")
    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    bb = probe.textbbox((0, 0), "PTK", font=f)
    wp, hp = bb[2] - bb[0], bb[3] - bb[1]
    gap, barh = int(hp * 0.12), int(hp * 0.42)
    img = Image.new("RGBA", (wp, hp + gap + barh), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.text((-bb[0], -bb[1]), "PTK", font=f, fill=color_ptk)
    top = hp + gap
    d.rectangle((0, top, wp, top + barh), fill=color_bar)
    ff = font(int(barh * 0.60), "Black")
    letters = "FRETES"
    boxes = [probe.textbbox((0, 0), c, font=ff) for c in letters]
    widths = [b[2] - b[0] for b in boxes]
    margin = barh * 0.42
    track = (wp - 2 * margin - sum(widths)) / (len(letters) - 1)
    x = margin
    for c, b, cw in zip(letters, boxes, widths):
        d.text((x - b[0], top + barh / 2), c, font=ff, fill=color_bar_txt, anchor="lm")
        x += cw + track
    return img


@lru_cache(None)
def logo_icon(size=1000):
    """Ícone redondo (foto de perfil): picape em cima, PTK + FRETES embaixo, centralizados."""
    s = size * S
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, s - 1, s - 1), fill=BLACK + (255,))
    d.ellipse((s * .045, s * .045, s * .955, s * .955), fill=YEL + (255,))
    d.ellipse((s * .085, s * .085, s * .915, s * .915), outline=BLACK + (255,), width=int(s * .012))
    wm = _wordmark(BLACK, BLACK, YEL)
    ww = int(s * .52)
    wm = wm.resize((ww, int(wm.height * ww / wm.width)), Image.LANCZOS)
    sil = pickup_silhouette(BLACK)
    tw = int(s * .40)
    sil = sil.resize((tw, int(tw * sil.height / sil.width)), Image.LANCZOS)
    lines_w, lgap = int(s * .09), int(s * .02)
    gap = int(s * .05)
    total_h = sil.height + gap + wm.height
    y0 = (s - total_h) // 2
    gx = (s - (lines_w + lgap + tw)) // 2
    img.alpha_composite(sil, (gx + lines_w + lgap, y0))
    lw = int(s * .017)
    speed_lines(d, gx + lines_w, y0 + int(sil.height * .40) - int(lw * 2.2), n=3, length=lines_w, gap=int(lw * 1.9),
                width=lw, color=BLACK)
    img.alpha_composite(wm, ((s - wm.width) // 2, y0 + sil.height + gap))
    return img.resize((size, size), Image.LANCZOS)


@lru_cache(None)
def logo_horizontal(dark_bg=True, height=360):
    """Picape (centralizada na altura do bloco) | PTK reto com faixa FRETES da mesma largura."""
    fg = WHITE if dark_bg else BLACK
    wm = _wordmark(fg, YEL, BLACK)
    sil = pickup_silhouette(YEL)
    th = int(wm.height * 0.62)
    sil = sil.resize((int(sil.width * th / sil.height), th), Image.LANCZOS)
    lines_w = int(th * 0.50)
    lgap = int(th * 0.06)
    gap = int(wm.height * 0.12)
    W_ = lines_w + lgap + sil.width + gap + wm.width
    H_ = wm.height
    img = Image.new("RGBA", (W_, H_), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ty = (H_ - sil.height) // 2
    img.alpha_composite(sil, (lines_w + lgap, ty))
    lw = max(4, int(th * 0.07))
    speed_lines(d, lines_w, ty + int(sil.height * 0.40) - int(lw * 2.2), n=3, length=lines_w, gap=int(lw * 1.9), width=lw)
    img.alpha_composite(wm, (W_ - wm.width, 0))
    img = img.crop(img.getbbox())
    return img.resize((int(img.width * height / img.height), height), Image.LANCZOS)
