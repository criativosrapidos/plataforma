"""Produtos renderizados em "estúdio" (vidro, inox, brilho, reflexo) para os anúncios.

Tudo é desenhado em 2x e reduzido (anti-aliasing). As partes estáticas ficam em cache;
só chamas, brilhos e vapor são animados por quadro.
"""
import math
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT = "/usr/share/fonts/opentype/inter/InterDisplay-{}.otf"


def _f(size, w="Bold"):
    return ImageFont.truetype(FONT.format(w), size)


# ------------------------------------------------------------------ helpers --
def lin_grad(w, h, stops, vertical=True):
    """stops: [(pos 0..1, (r,g,b,a)), ...]"""
    n = h if vertical else w
    pos = np.linspace(0, 1, n)
    ps = [s[0] for s in stops]
    cols = np.array([s[1] for s in stops], np.float32)
    ch = [np.interp(pos, ps, cols[:, i]) for i in range(4)]
    line = np.stack(ch, -1)
    arr = np.repeat(line[:, None, :], w, 1) if vertical else np.repeat(line[None, :, :], h, 0)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def brushed(w, h, base, light, seed=1, vertical=False):
    """Inox escovado: degradê + riscos finos."""
    rng = np.random.default_rng(seed)
    g = lin_grad(w, h, [(0, light + (255,)), (0.35, base + (255,)), (0.7, light + (255,)), (1, base + (255,))],
                 vertical=not vertical)
    arr = np.asarray(g).astype(np.float32)
    streak = rng.normal(0, 7, (1, w) if vertical else (h, 1))
    streak = np.repeat(streak, h, 0) if vertical else np.repeat(streak, w, 1)
    arr[..., :3] += streak[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


def masked(img, mask):
    out = img.copy()
    out.putalpha(Image.fromarray(np.minimum(np.asarray(img.getchannel("A")), np.asarray(mask))))
    return out


def rr_mask(w, h, r, box=None):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle(box or (0, 0, w - 1, h - 1), r, fill=255)
    return m


def radial(w, h, color, alpha=255, falloff=1.0):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    a = np.clip(1 - d, 0, 1) ** falloff * alpha
    arr = np.zeros((h, w, 4), np.uint8)
    arr[..., :3] = color
    arr[..., 3] = a.astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def find_coeffs(pa, pb):
    m = []
    for p1, p2 in zip(pa, pb):
        m.append([p1[0], p1[1], 1, 0, 0, 0, -p2[0] * p1[0], -p2[0] * p1[1]])
        m.append([0, 0, 0, p1[0], p1[1], 1, -p2[1] * p1[0], -p2[1] * p1[1]])
    A = np.array(m, np.float64)
    B = np.array(pb, np.float64).reshape(8)
    return np.linalg.solve(A, B).tolist()


def tilt(img, top_inset=0.16, squash=0.62):
    """Põe uma imagem vista de cima em perspectiva (topo mais estreito)."""
    w, h = img.size
    nh = int(h * squash)
    dst = [(w * top_inset, 0), (w * (1 - top_inset), 0), (w, nh), (0, nh)]
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    return img.transform((w, nh), Image.PERSPECTIVE, find_coeffs(dst, src), Image.BICUBIC)


def with_floor(img, shadow=True, reflect=0.22):
    """Sombra de contato + reflexo no 'chão' do estúdio."""
    w, h = img.size
    out = Image.new("RGBA", (w + 80, int(h * 1.32) + 40), (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse((40, h - 10, w + 40, h + 50), fill=(0, 0, 0, 170))
        out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(22)))
    if reflect:
        r = img.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, w, int(h * 0.3)))
        fade = lin_grad(r.width, r.height, [(0, (0, 0, 0, int(255 * reflect))), (1, (0, 0, 0, 0))])
        r.putalpha(Image.fromarray((np.asarray(r.getchannel("A")).astype(np.float32) *
                                    np.asarray(fade.getchannel("A")) / 255).astype(np.uint8)))
        out.alpha_composite(r, (40, h + 6))
    out.alpha_composite(img, (40, 0))
    return out


def down(img):
    return img.resize((img.width // 2, img.height // 2), Image.LANCZOS)


# ------------------------------------------------------------ COOKTOP GÁS --
S = 2
CW, CH = 1000 * S, 640 * S
GAS_B = [(250, 190, 80), (750, 190, 66), (250, 450, 66), (750, 450, 96), (500, 320, 52)]


def glass_top(w, h, r):
    g = lin_grad(w, h, [(0, (40, 40, 46, 255)), (0.5, (10, 10, 12, 255)), (1, (22, 22, 26, 255))])
    d = ImageDraw.Draw(g)
    refl = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(refl).polygon([(w * .05, 0), (w * .30, 0), (w * .10, h), (-w * .15, h)], fill=(255, 255, 255, 26))
    ImageDraw.Draw(refl).polygon([(w * .36, 0), (w * .40, 0), (w * .20, h), (w * .16, h)], fill=(255, 255, 255, 16))
    g.alpha_composite(refl)
    d.rounded_rectangle((2, 2, w - 3, h - 3), r, outline=(150, 150, 160, 255), width=6)
    d.rounded_rectangle((10, 10, w - 11, h - 11), r - 6, outline=(60, 60, 66, 255), width=2)
    return masked(g, rr_mask(w, h, r))


@lru_cache(None)
def _gas_static():
    img = glass_top(CW, CH, 40 * S)
    for x, y, r in GAS_B:
        x, y, r = x * S, y * S, r * S
        # grelha de ferro fundido
        d = ImageDraw.Draw(img)
        for a in range(4):
            ang = math.pi / 4 + a * math.pi / 2
            x1, y1 = x + math.cos(ang) * (r + 14), y + math.sin(ang) * (r + 14)
            x2, y2 = x + math.cos(ang) * (r + 92 * S / 2 + 30), y + math.sin(ang) * (r + 92 * S / 2 + 30)
            d.line((x1, y1, x2, y2), fill=(30, 30, 33, 255), width=26)
            d.line((x1, y1 - 4, x2, y2 - 4), fill=(95, 95, 102, 255), width=6)
        ring = radial(int(r * 2.3), int(r * 2.3), (0, 0, 0), 200, 0.6)
        img.alpha_composite(ring, (int(x - r * 1.15), int(y - r * 1.15)))
        cap = Image.new("RGBA", (int(r * 2), int(r * 2)), (0, 0, 0, 0))
        cg = lin_grad(cap.width, cap.height, [(0, (190, 190, 196, 255)), (0.5, (70, 70, 76, 255)), (1, (30, 30, 34, 255))])
        m = Image.new("L", cap.size, 0)
        ImageDraw.Draw(m).ellipse((0, 0, cap.width - 1, cap.height - 1), fill=255)
        cap = masked(cg, m)
        ImageDraw.Draw(cap).ellipse((cap.width * .3, cap.height * .3, cap.width * .7, cap.height * .7), fill=(25, 25, 28, 255))
        ImageDraw.Draw(cap).ellipse((cap.width * .36, cap.height * .33, cap.width * .52, cap.height * .42), fill=(255, 255, 255, 60))
        img.alpha_composite(cap, (int(x - r), int(y - r)))
    d = ImageDraw.Draw(img)
    for i in range(5):  # botões
        cx, cy = (330 + i * 85) * S, (CH // S - 44) * S
        knob = radial(56 * S, 56 * S, (200, 200, 208), 255, 0.15)
        img.alpha_composite(knob, (cx - 28 * S, cy - 28 * S))
        d.line((cx, cy - 18 * S, cx, cy - 4 * S), fill=(30, 30, 30, 255), width=6)
    return img


def gas(t, t_on=0.0, tilted=True):
    img = _gas_static().copy()
    fl = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(fl)
    for bi, (x, y, r) in enumerate(GAS_B):
        x, y, r = x * S, y * S, r * S
        ign = min(1, max(0, (t - t_on - bi * 0.08) / 0.25))
        if ign <= 0:
            continue
        n = 26
        for i in range(n):
            a = 2 * math.pi * i / n
            fk = 0.75 + 0.25 * math.sin(t * 27 + i * 1.9 + bi) + 0.1 * math.sin(t * 45 + i * 3)
            L = (26 + 26 * fk) * S * ign
            b = r * 1.0
            bx, by = x + math.cos(a) * b, y + math.sin(a) * b
            tx, ty = x + math.cos(a) * (b + L), y + math.sin(a) * (b + L)
            px, py = -math.sin(a) * 9 * S, math.cos(a) * 9 * S
            d.polygon([(bx + px, by + py), (tx, ty), (bx - px, by - py)], fill=(40, 110, 255, 210))
            mx, my = bx + (tx - bx) * .5, by + (ty - by) * .5
            d.polygon([(bx + px * .5, by + py * .5), (mx, my), (bx - px * .5, by - py * .5)], fill=(190, 225, 255, 255))
    small = fl.resize((fl.width // 4, fl.height // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(6))
    glow = small.resize(fl.size, Image.BILINEAR)
    img.alpha_composite(glow)
    img.alpha_composite(glow)
    img.alpha_composite(fl)
    if tilted:
        img = tilt(img)
    return down(img)


# ------------------------------------------------------------- INDUÇÃO ----
IND = [(270, 220, 130), (740, 200, 100), (270, 480, 100), (730, 450, 140)]


@lru_cache(None)
def _ind_static():
    img = glass_top(CW, CH, 40 * S)
    d = ImageDraw.Draw(img)
    for x, y, r in IND:
        x, y, r = x * S, y * S, r * S
        d.ellipse((x - r, y - r, x + r, y + r), outline=(170, 170, 180, 255), width=5)
        for k in (-1, 1):
            d.line((x + k * r * .8, y - 6, x + k * r * 1.05, y - 6), fill=(170, 170, 180, 255), width=4)
    d.rounded_rectangle((340 * S, (CH // S - 70) * S, 660 * S, (CH // S - 26) * S), 14 * S, outline=(120, 120, 130, 255), width=4)
    for i in range(7):
        cx = (370 + i * 44) * S
        d.ellipse((cx - 7 * S, (CH // S - 54) * S, cx + 7 * S, (CH // S - 40) * S), outline=(150, 150, 160, 255), width=3)
    return img


def induction(t, t_on=0.0, tilted=True):
    img = _ind_static().copy()
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    for zi, (x, y, r) in enumerate(IND):
        x, y, r = x * S, y * S, r * S
        on = min(1, max(0, (t - t_on - zi * 0.1) / 0.3))
        if on <= 0:
            continue
        pulse = 0.85 + 0.15 * math.sin(t * 6 + zi)
        for k in range(4):
            rr = r * (0.3 + 0.22 * k)
            d.ellipse((x - rr, y - rr, x + rr, y + rr), outline=(255, 60 + 35 * k, 10, int(255 * on * pulse)), width=10 * S)
    small = glow.resize((glow.width // 4, glow.height // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(7))
    img.alpha_composite(small.resize(glow.size, Image.BILINEAR))
    img.alpha_composite(small.resize(glow.size, Image.BILINEAR))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(3)))
    lvl = int(min(9, max(0, (t - t_on) * 10)))
    ImageDraw.Draw(img).text((485 * S, (CH // S - 66) * S), str(lvl), font=_f(30 * S), fill=(255, 90, 40, 255))
    if tilted:
        img = tilt(img)
    return down(img)


# ---------------------------------------------------------------- FORNO ----
@lru_cache(None)
def _oven_static():
    w, h = 760 * S, 760 * S
    img = brushed(w, h, (150, 153, 160), (225, 228, 234), seed=3)
    img = masked(img, rr_mask(w, h, 26 * S))
    d = ImageDraw.Draw(img)
    # painel superior preto
    panel = lin_grad(w - 40 * S, 120 * S, [(0, (40, 40, 44, 255)), (1, (12, 12, 14, 255))])
    img.alpha_composite(panel, (20 * S, 20 * S))
    for i in range(2):
        kx = (90 + i * 520) * S
        img.alpha_composite(radial(84 * S, 84 * S, (205, 205, 212), 255, 0.12), (kx, 38 * S))
    d.rounded_rectangle((300 * S, 50 * S, 460 * S, 110 * S), 10 * S, fill=(8, 8, 10, 255))
    d.text((318 * S, 52 * S), "200°", font=_f(46 * S), fill=(255, 120, 40, 255))
    # puxador
    hb = brushed(620 * S, 34 * S, (170, 172, 178), (245, 245, 250), seed=4, vertical=True)
    img.alpha_composite(masked(hb, rr_mask(hb.width, hb.height, 17 * S)), (70 * S, 170 * S))
    return img


def oven(t, t_on=0.0):
    img = _oven_static().copy()
    w, h = img.size
    win = (60 * S, 230 * S, w - 60 * S, h - 50 * S)
    ww, wh = win[2] - win[0], win[3] - win[1]
    heat = min(1, max(0.25, (t - t_on) / 0.5)) * (0.9 + 0.1 * math.sin(t * 5))
    door = lin_grad(ww, wh, [(0, (int(40 + 60 * heat), int(18 + 20 * heat), 8, 255)), (1, (12, 8, 6, 255))])
    door.alpha_composite(radial(ww, wh, (255, 150, 50), int(220 * heat), 1.3))
    dd = ImageDraw.Draw(door)
    for gy in (0.35, 0.65):
        dd.line((20 * S, wh * gy, ww - 20 * S, wh * gy), fill=(90, 50, 25, 255), width=5 * S)
    refl = Image.new("RGBA", door.size, (0, 0, 0, 0))
    ImageDraw.Draw(refl).polygon([(ww * .55, 0), (ww * .8, 0), (ww * .45, wh), (ww * .2, wh)], fill=(255, 255, 255, 30))
    door.alpha_composite(refl)
    img.alpha_composite(masked(door, rr_mask(ww, wh, 18 * S)), (win[0], win[1]))
    return down(img)


# ---------------------------------------------------------------- COIFA ----
@lru_cache(None)
def _hood_static():
    w, h = 820 * S, 760 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ch = brushed(220 * S, 380 * S, (150, 153, 160), (232, 235, 240), seed=5)
    img.alpha_composite(ch, (300 * S, 0))
    body = brushed(w, 260 * S, (140, 143, 150), (235, 238, 244), seed=6)
    m = Image.new("L", body.size, 0)
    ImageDraw.Draw(m).polygon([(280 * S, 0), (540 * S, 0), (w - 10 * S, 250 * S), (10 * S, 250 * S)], fill=255)
    img.alpha_composite(masked(body, m), (0, 370 * S))
    bar = lin_grad(w, 60 * S, [(0, (60, 60, 66, 255)), (1, (20, 20, 24, 255))])
    img.alpha_composite(masked(bar, rr_mask(w, 60 * S, 12 * S)), (0, 615 * S))
    d = ImageDraw.Draw(img)
    for i in range(4):
        d.rounded_rectangle(((290 + i * 70) * S, 632 * S, (330 + i * 70) * S, 658 * S), 6 * S, fill=(140, 140, 150, 255))
    return img


def hood(t, t_on=0.0):
    img = _hood_static().copy()
    w, h = img.size
    on = min(1, max(0, (t - t_on) / 0.3))
    beam = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(beam).polygon([(160 * S, 675 * S), (660 * S, 675 * S), (780 * S, h), (40 * S, h)],
                                 fill=(255, 244, 210, int(90 * on)))
    img.alpha_composite(beam.filter(ImageFilter.GaussianBlur(14 * S)))
    for lx in (230, 590):
        img.alpha_composite(radial(70 * S, 40 * S, (255, 250, 220), int(255 * on), 0.5), ((lx - 35) * S, 660 * S))
    d = ImageDraw.Draw(img)
    for i in range(4):  # fumaça sendo sugada
        ph = (t * 1.1 + i / 4) % 1
        y = h - ph * 120 * S
        x = (260 + i * 100) * S + 18 * S * math.sin(t * 4 + i)
        a = int(170 * math.sin(ph * math.pi) * on)
        d.arc((x - 30 * S, y - 30 * S, x + 30 * S, y + 30 * S), 200, 340, fill=(255, 255, 255, a), width=7 * S)
    return down(img)


# ------------------------------------------------------------ AIR FRYER ----
@lru_cache(None)
def airfryer():
    w, h = 560 * S, 640 * S
    body = lin_grad(w, h, [(0, (58, 58, 64, 255)), (0.5, (22, 22, 26, 255)), (1, (8, 8, 10, 255))], vertical=False)
    img = masked(body, rr_mask(w, h, 90 * S))
    d = ImageDraw.Draw(img)
    hl = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(hl).rounded_rectangle((40 * S, 30 * S, 120 * S, h - 60 * S), 40 * S, fill=(255, 255, 255, 34))
    img.alpha_composite(hl.filter(ImageFilter.GaussianBlur(10 * S)))
    d.rounded_rectangle((110 * S, 60 * S, w - 110 * S, 230 * S), 30 * S, fill=(6, 6, 8, 255), outline=(80, 80, 88, 255), width=3 * S)
    d.text((200 * S, 92 * S), "200°", font=_f(84 * S), fill=(255, 70, 40, 255))
    for i in range(4):
        d.ellipse(((150 + i * 75) * S, 200 * S, (165 + i * 75) * S, 215 * S), fill=(120, 200, 255, 255))
    # gaveta
    d.rounded_rectangle((40 * S, 300 * S, w - 40 * S, h - 30 * S), 50 * S, fill=(18, 18, 22, 255), outline=(70, 70, 78, 255), width=3 * S)
    hb = brushed(300 * S, 60 * S, (150, 152, 160), (240, 240, 246), seed=8, vertical=True)
    img.alpha_composite(masked(hb, rr_mask(hb.width, hb.height, 28 * S)), (130 * S, 400 * S))
    return down(img)


# --------------------------------------------------------------- PANELAS ----
@lru_cache(None)
def panelas():
    w, h = 760 * S, 560 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    def pot(x, y, pw, ph, red=False):
        base, light = ((150, 20, 26), (240, 70, 70)) if red else ((120, 122, 130), (238, 240, 246))
        body = brushed(pw, ph, base, light, seed=9 + int(red))
        m = Image.new("L", (pw, ph), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, pw - 1, ph - 1), 30 * S, fill=255)
        img.alpha_composite(masked(body, m), (x, y))
        d = ImageDraw.Draw(img)
        d.ellipse((x - 4 * S, y - 34 * S, x + pw + 4 * S, y + 34 * S), fill=(200, 202, 210, 255) if not red else (200, 40, 40, 255))
        d.ellipse((x + 12 * S, y - 24 * S, x + pw - 12 * S, y + 22 * S), fill=(235, 238, 244, 160))
        d.ellipse((x + pw / 2 - 30 * S, y - 60 * S, x + pw / 2 + 30 * S, y - 26 * S), fill=(30, 30, 34, 255))
        for side in (-1, 1):
            hx = x - 50 * S if side < 0 else x + pw + 6 * S
            d.rounded_rectangle((hx, y + 30 * S, hx + 44 * S, y + 56 * S), 12 * S, fill=(30, 30, 34, 255))

    pot(60 * S, 230 * S, 330 * S, 300 * S, red=True)
    pot(420 * S, 300 * S, 290 * S, 230 * S)
    return down(img)


# ------------------------------------------------------ ELETROPORTÁTEIS ----
@lru_cache(None)
def liquidificador():
    w, h = 420 * S, 720 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    jar = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(jar).polygon([(60 * S, 40 * S), (360 * S, 40 * S), (320 * S, 470 * S), (100 * S, 470 * S)],
                                fill=(200, 230, 255, 70), outline=(230, 245, 255, 220))
    ImageDraw.Draw(jar).polygon([(120 * S, 240 * S), (300 * S, 240 * S), (318 * S, 470 * S), (102 * S, 470 * S)],
                                fill=(230, 60, 80, 200))
    ImageDraw.Draw(jar).polygon([(80 * S, 60 * S), (110 * S, 60 * S), (135 * S, 450 * S), (118 * S, 450 * S)], fill=(255, 255, 255, 90))
    img.alpha_composite(jar)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((40 * S, 20 * S, 380 * S, 60 * S), 14 * S, fill=(25, 25, 28, 255))
    base = lin_grad(300 * S, 230 * S, [(0, (60, 60, 66, 255)), (1, (10, 10, 12, 255))])
    img.alpha_composite(masked(base, rr_mask(base.width, base.height, 40 * S)), (60 * S, 470 * S))
    img.alpha_composite(radial(90 * S, 90 * S, (210, 210, 218), 255, 0.15), (165 * S, 560 * S))
    return down(img)


# ---------------------------------------------------------------- MÓVEIS ----
@lru_cache(None)
def cadeira():
    """Cadeira estilo Eames (concha + pés de madeira com travas)."""
    w, h = 520 * S, 700 * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    wood = (196, 150, 98, 255)
    legs = [((150, 340), (60, 680)), ((370, 340), (460, 680)), ((210, 350), (180, 690)), ((310, 350), (340, 690))]
    for (x1, y1), (x2, y2) in legs:
        d.line((x1 * S, y1 * S, x2 * S, y2 * S), fill=wood, width=22 * S)
        d.line((x1 * S - 5 * S, y1 * S, x2 * S - 5 * S, y2 * S), fill=(230, 190, 140, 255), width=5 * S)
    for a, b in (((105, 520), (400, 520)), ((150, 600), (350, 470)), ((350, 600), (150, 470))):
        d.line((a[0] * S, a[1] * S, b[0] * S, b[1] * S), fill=(40, 40, 44, 255), width=7 * S)
    shell = lin_grad(w, 380 * S, [(0, (245, 245, 248, 255)), (0.6, (210, 212, 218, 255)), (1, (160, 162, 170, 255))], vertical=False)
    m = Image.new("L", shell.size, 0)
    ImageDraw.Draw(m).polygon([(60 * S, 20 * S), (460 * S, 20 * S), (500 * S, 120 * S), (470 * S, 300 * S),
                               (380 * S, 370 * S), (140 * S, 370 * S), (50 * S, 300 * S), (20 * S, 120 * S)], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(10 * S)).point(lambda v: 255 if v > 128 else 0)
    img.alpha_composite(masked(shell, m), (0, 0))
    hl = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse((110 * S, 60 * S, 250 * S, 300 * S), fill=(255, 255, 255, 70))
    img.alpha_composite(hl.filter(ImageFilter.GaussianBlur(20 * S)))
    return down(img)


def cooktop_edge(img):
    """Espessura do vidro: faixa escura sob o tampo inclinado."""
    w, h = img.size
    out = Image.new("RGBA", (w, h + 14), (0, 0, 0, 0))
    ImageDraw.Draw(out).rounded_rectangle((2, h - 30, w - 3, h + 12), 18, fill=(70, 70, 78, 255))
    out.alpha_composite(img, (0, 0))
    return out
