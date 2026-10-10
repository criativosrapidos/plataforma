"""Ícones de modalidades renderizados (2x + redução) para o anúncio da academia."""
import math
import sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "casadocooktop"))
from produtos3d import brushed, lin_grad, masked, radial, rr_mask  # noqa: E402

S = 2
ORANGE, BLUE, NAVY = (255, 122, 26), (22, 101, 192), (8, 30, 78)


def down(img):
    return img.resize((img.width // S, img.height // S), Image.LANCZOS)


def circle_mask(w, h):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).ellipse((0, 0, w - 1, h - 1), fill=255)
    return m


def shine(img, box, alpha=70, blur=18):
    hl = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse(box, fill=(255, 255, 255, alpha))
    img.alpha_composite(hl.filter(ImageFilter.GaussianBlur(blur * S)))


@lru_cache(None)
def halter():
    w, h = 900 * S, 420 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bar = brushed(640 * S, 46 * S, (150, 152, 160), (245, 246, 250), seed=11, vertical=True)
    img.alpha_composite(masked(bar, rr_mask(bar.width, bar.height, 20 * S)), (130 * S, 187 * S))
    grip = Image.new("RGBA", (220 * S, 54 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(grip)
    for i in range(0, 220 * S, 10 * S):
        d.line((i, 0, i + 8 * S, 54 * S), fill=(90, 92, 100, 255), width=3 * S)
    img.alpha_composite(masked(grip, rr_mask(grip.width, grip.height, 22 * S)), (340 * S, 183 * S))
    for side in (0, 1):
        for k, (pw, ph) in enumerate(((80, 400), (70, 320), (50, 240))):
            x = (60 + k * 82) * S if side == 0 else w - (60 + k * 82 + pw) * S
            plate = lin_grad(pw * S, ph * S, [(0, (60, 60, 66, 255)), (0.45, (25, 25, 28, 255)), (1, (8, 8, 10, 255))],
                             vertical=False)
            plate = masked(plate, rr_mask(pw * S, ph * S, 22 * S))
            ImageDraw.Draw(plate).rectangle((10 * S, 20 * S, 16 * S, ph * S - 20 * S), fill=(110, 110, 120, 255))
            img.alpha_composite(plate, (x, (h - ph * S) // 2))
        cx = 330 * S if side == 0 else w - 330 * S - 24 * S
        ImageDraw.Draw(img).rounded_rectangle((cx, 165 * S, cx + 24 * S, 255 * S), 6 * S, fill=ORANGE + (255,))
    return down(img)


@lru_cache(None)
def kettlebell():
    w, h = 560 * S, 640 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((110 * S, 20 * S, 450 * S, 330 * S), 150 * S, outline=(30, 30, 34, 255), width=70 * S)
    d.arc((120 * S, 30 * S, 440 * S, 320 * S), 200, 320, fill=(110, 110, 120, 255), width=10 * S)
    body = lin_grad(w, 430 * S, [(0, (70, 70, 78, 255)), (0.5, (26, 26, 30, 255)), (1, (6, 6, 8, 255))], vertical=False)
    body = masked(body, circle_mask(w, 430 * S))
    img.alpha_composite(body, (0, 205 * S))
    shine(img, (110 * S, 260 * S, 230 * S, 470 * S), 80, 14)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((180 * S, 380 * S, 380 * S, 470 * S), 20 * S, fill=ORANGE + (255,))
    d.text((280 * S, 425 * S), "24KG", fill=(255, 255, 255, 255), anchor="mm",
           font=__import__("PIL.ImageFont", fromlist=["x"]).truetype(
               "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf", 54 * S))
    return down(img)


@lru_cache(None)
def raquete():
    w, h = 640 * S, 820 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    face = lin_grad(460 * S, 520 * S, [(0, (40, 130, 230, 255)), (1, (10, 50, 130, 255))], vertical=False)
    face = masked(face, circle_mask(460 * S, 520 * S))
    d = ImageDraw.Draw(face)
    for r in range(6):
        for c in range(5):
            cx, cy = (95 + c * 68 + (34 if r % 2 else 0)) * S, (90 + r * 64) * S
            if (cx - 230 * S) ** 2 / (210 * S) ** 2 + (cy - 260 * S) ** 2 / (240 * S) ** 2 < 0.85:
                d.ellipse((cx - 13 * S, cy - 13 * S, cx + 13 * S, cy + 13 * S), fill=(6, 22, 60, 255))
    d.ellipse((0, 0, 460 * S - 1, 520 * S - 1), outline=ORANGE + (255,), width=14 * S)
    shine(face, (60 * S, 40 * S, 200 * S, 260 * S), 60, 16)
    img.alpha_composite(face.rotate(18, Image.BICUBIC, expand=False), (40 * S, 0))
    hd = ImageDraw.Draw(img)
    hd.line((250 * S, 500 * S, 170 * S, 790 * S), fill=(25, 25, 30, 255), width=64 * S)
    for i in range(6):
        y = (560 + i * 40) * S
        hd.line((228 * S - i * 11 * S - 28 * S, y, 228 * S - i * 11 * S + 28 * S, y + 14 * S), fill=(70, 70, 80, 255), width=6 * S)
    ball = radial(170 * S, 170 * S, (255, 230, 40), 255, 0.05)
    ball = masked(lin_grad(170 * S, 170 * S, [(0, (255, 240, 90, 255)), (1, (240, 150, 10, 255))]), circle_mask(170 * S, 170 * S))
    ImageDraw.Draw(ball).arc((-60 * S, 20 * S, 110 * S, 190 * S), 280, 80, fill=(255, 255, 255, 230), width=7 * S)
    img.alpha_composite(ball, (450 * S, 560 * S))
    return down(img)


@lru_cache(None)
def bola_volei():
    """Bola de vôlei em espiral (gomos azul / branco / laranja)."""
    s = 520 * S
    y, x = np.mgrid[0:s, 0:s].astype(np.float32)
    dx, dy = (x - s / 2) / (s / 2), (y - s / 2) / (s / 2)
    r = np.sqrt(dx ** 2 + dy ** 2)
    th = np.arctan2(dy, dx)
    band = ((th + 1.5 * r) % (2 * np.pi / 3)) / (2 * np.pi / 3)
    cols = np.where(band[..., None] < 0.34, np.array(BLUE, np.float32),
                    np.where(band[..., None] < 0.67, np.array((250, 250, 252), np.float32), np.array(ORANGE, np.float32)))
    edge = np.minimum(np.abs(band - 0.34), np.minimum(np.abs(band - 0.67), np.minimum(band, 1 - band)))
    cols = np.where(edge[..., None] < 0.012, np.array((30, 40, 70), np.float32), cols)
    shade = np.clip(1.05 - 0.35 * np.clip(dx * 0.5 + dy * 0.6 + 0.4, 0, 1.5), 0.55, 1.05)[..., None]
    arr = np.zeros((s, s, 4), np.uint8)
    arr[..., :3] = np.clip(cols * shade, 0, 255)
    arr[..., 3] = np.where(r <= 1, 255, 0)
    img = Image.fromarray(arr, "RGBA")
    shine(img, (90 * S, 70 * S, 250 * S, 220 * S), 110, 20)
    ImageDraw.Draw(img).ellipse((2, 2, s - 3, s - 3), outline=(30, 40, 70, 255), width=6 * S)
    return down(img)


@lru_cache(None)
def bola_futsal():
    s = 520 * S
    base = masked(lin_grad(s, s, [(0, (255, 255, 255, 255)), (1, (190, 196, 206, 255))]), circle_mask(s, s))
    d = ImageDraw.Draw(base)
    c = s / 2

    def pent(cx, cy, r, rot):
        return [(cx + r * math.cos(rot + i * 2 * math.pi / 5), cy + r * math.sin(rot + i * 2 * math.pi / 5)) for i in range(5)]

    d.polygon(pent(c, c, 95 * S, -math.pi / 2), fill=(20, 20, 24, 255))
    for i in range(5):
        a = -math.pi / 2 + i * 2 * math.pi / 5 + math.pi / 5
        px, py = c + math.cos(a) * 225 * S, c + math.sin(a) * 225 * S
        d.polygon(pent(px, py, 80 * S, a + math.pi), fill=(20, 20, 24, 255))
        vx, vy = c + math.cos(a - math.pi / 5) * 95 * S, c + math.sin(a - math.pi / 5) * 95 * S
        d.line((vx, vy, c + math.cos(a - math.pi / 5) * 170 * S, c + math.sin(a - math.pi / 5) * 170 * S),
               fill=(60, 60, 66, 255), width=5 * S)
    base = masked(base, circle_mask(s, s))
    shine(base, (90 * S, 70 * S, 250 * S, 220 * S), 90, 20)
    ImageDraw.Draw(base).ellipse((2, 2, s - 3, s - 3), outline=(30, 30, 36, 255), width=6 * S)
    return down(base)


@lru_cache(None)
def sapatilhas():
    """Par de sapatilhas de ponta (ballet)."""
    w, h = 640 * S, 700 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    def shoe(x, rot):
        sh = Image.new("RGBA", (260 * S, 620 * S), (0, 0, 0, 0))
        g = lin_grad(260 * S, 620 * S, [(0, (255, 214, 214, 255)), (0.5, (246, 176, 184, 255)), (1, (220, 130, 150, 255))],
                     vertical=False)
        m = Image.new("L", g.size, 0)
        ImageDraw.Draw(m).rounded_rectangle((20 * S, 0, 240 * S, 610 * S), 110 * S, fill=255)
        sh.alpha_composite(masked(g, m))
        d = ImageDraw.Draw(sh)
        d.ellipse((60 * S, 220 * S, 200 * S, 520 * S), fill=(150, 70, 90, 255))
        d.ellipse((72 * S, 232 * S, 188 * S, 508 * S), fill=(120, 50, 70, 255))
        d.rounded_rectangle((95 * S, 0, 165 * S, 50 * S), 20 * S, fill=(255, 235, 235, 255))
        shine(sh, (40 * S, 20 * S, 110 * S, 200 * S), 90, 10)
        sh = sh.rotate(rot, Image.BICUBIC, expand=True)
        img.alpha_composite(sh, (x, 20 * S))

    shoe(30 * S, 12)
    shoe(280 * S, -12)
    d = ImageDraw.Draw(img)
    for x0, sgn in ((200, 1), (430, -1)):  # fitas de cetim
        pts = [((x0 + sgn * k * 18) * S, (420 + k * 40 + 20 * math.sin(k)) * S) for k in range(7)]
        d.line(pts, fill=(255, 190, 200, 255), width=22 * S, joint="curve")
    return down(img)


def ondas(t, w=1080, h=520, cor1=(30, 140, 230), cor2=(10, 70, 170)):
    """Água animada (natação / hidro)."""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for layer, (amp, k, sp, col, y0) in enumerate((
            (26, 0.010, 2.2, cor1 + (230,), 60), (34, 0.008, -1.6, cor2 + (255,), 150))):
        pts = [(x, y0 + amp * math.sin(x * k + t * sp + layer)) for x in range(0, w + 20, 20)]
        d.polygon(pts + [(w, h), (0, h)], fill=col)
        d.line(pts, fill=(255, 255, 255, 120 if layer == 0 else 60), width=6)
    for i in range(14):  # bolhas
        ph = (t * 0.6 + i * 0.137) % 1
        x = (i * 173) % w + 10 * math.sin(t * 3 + i)
        y = h - ph * (h - 120)
        r = 6 + (i % 4) * 4
        d.ellipse((x - r, y - r, x + r, y + r), outline=(255, 255, 255, int(200 * (1 - ph))), width=3)
    return img


@lru_cache(None)
def oculos():
    w, h = 620 * S, 260 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.line((0, 130 * S, w, 130 * S), fill=(20, 20, 26, 255), width=24 * S)
    for cx in (175, 445):
        lens = masked(lin_grad(220 * S, 170 * S, [(0, (120, 200, 255, 255)), (1, (20, 80, 200, 255))]),
                      rr_mask(220 * S, 170 * S, 80 * S))
        img.alpha_composite(lens, ((cx - 110) * S, 45 * S))
        d.rounded_rectangle(((cx - 110) * S, 45 * S, (cx + 110) * S, 215 * S), 80 * S, outline=ORANGE + (255,), width=16 * S)
    d.rounded_rectangle((285 * S, 110 * S, 335 * S, 150 * S), 14 * S, fill=ORANGE + (255,))
    shine(img, (120 * S, 60 * S, 200 * S, 120 * S), 120, 8)
    shine(img, (390 * S, 60 * S, 470 * S, 120 * S), 120, 8)
    return down(img)


@lru_cache(None)
def halter_aqua():
    w, h = 700 * S, 300 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle((180 * S, 125 * S, 520 * S, 175 * S), 24 * S, fill=(240, 240, 245, 255))
    for x in (40, 480):
        foam = masked(lin_grad(180 * S, 300 * S, [(0, (255, 170, 80, 255)), (1, (230, 90, 10, 255))], vertical=False),
                      rr_mask(180 * S, 300 * S, 80 * S))
        img.alpha_composite(foam, (x * S, 0))
    shine(img, (70 * S, 30 * S, 130 * S, 150 * S), 90, 10)
    shine(img, (510 * S, 30 * S, 570 * S, 150 * S), 90, 10)
    return down(img)
