#!/usr/bin/env python3
"""Gera o vídeo-modelo (9:16, 30 fps) da Casa do Cooktop - JK Shopping.

Motion graphics desenhados em código (PIL) + foto real da fachada + locução.
Para adaptar a outro cliente/produto, edite apenas o bloco CONFIG.

Uso:  python3 render_video.py   ->  saida/casadocooktop_30s.mp4
"""
import math
import random
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent

# ----------------------------------------------------------------- CONFIG ---
W, H, FPS = 1080, 1920, 30
TEMPO = 1.065                      # acelera a locução (31,2 s -> ~29,3 s)
DURATION = 30.0
VOICE = ROOT / "audio/locucao_take1.mp3"
OUT = ROOT / "saida/casadocooktop_30s.mp4"

RED, RED_DARK, RED_DEEP = (227, 30, 36), (170, 12, 18), (110, 6, 10)
WHITE, INK, GLASS = (255, 255, 255), (18, 18, 20), (14, 14, 16)

# Marcadores em segundos da locução ORIGINAL (detectados com silencedetect).
_T = dict(hook=0.0, brand=2.10, gas=4.35, induction=5.90, oven=7.35,
          design=9.35, location=12.25, perks=15.90, cta=19.70,
          whats=21.20, number=22.75, logo=27.55)
T = {k: v / TEMPO for k, v in _T.items()}

WHATSAPP = "(61) 98345-7770"
HOURS = ["SEG A SÁB  10H ÀS 22H", "DOMINGO  14H ÀS 20H"]
LOCATION = ["JK SHOPPING", "3º PISO · TAGUATINGA-DF"]
# ---------------------------------------------------------------------------

FONT_DIR = Path("/usr/share/fonts/opentype/inter")
_font_cache = {}


def font(size, weight="Black"):
    key = (size, weight)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(str(FONT_DIR / f"InterDisplay-{weight}.otf"), size)
    return _font_cache[key]


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, start, dur):
    return clamp((t - start) / dur)


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_back(x):
    c = 1.70158
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


_text_cache = {}


def text_img(text, size, fill=WHITE, weight="Black", spacing=8, align="center"):
    key = (text, size, fill, weight)
    if key in _text_cache:
        return _text_cache[key]
    f = font(size, weight)
    tmp = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    box = tmp.multiline_textbbox((0, 0), text, font=f, spacing=spacing, align=align)
    img = Image.new("RGBA", (int(box[2] - box[0]) + 4, int(box[3] - box[1]) + 4), (0, 0, 0, 0))
    ImageDraw.Draw(img).multiline_text((-box[0] + 2, -box[1] + 2), text, font=f, fill=fill,
                                       spacing=spacing, align=align)
    _text_cache[key] = img
    return img


def paste(base, img, cx, cy, alpha=1.0, scale=1.0):
    if alpha <= 0.01:
        return
    if scale != 1.0:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))),
                         Image.LANCZOS)
    if alpha < 1.0:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v: int(v * alpha)))
    base.paste(img, (int(cx - img.width / 2), int(cy - img.height / 2)), img)


def pill(text, size, bg, fg, pad=(44, 22), weight="ExtraBold"):
    t = text_img(text, size, fg, weight)
    img = Image.new("RGBA", (t.width + pad[0] * 2, t.height + pad[1] * 2), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle((0, 0, img.width - 1, img.height - 1),
                                          radius=img.height // 2, fill=bg)
    img.paste(t, (pad[0], pad[1]), t)
    return img


def anim_in(base, img, cx, cy, t, start, dy=80, dur=0.45, pop=False):
    p = prog(t, start, dur)
    if p <= 0:
        return
    if pop:
        paste(base, img, cx, cy, alpha=clamp(p * 2), scale=0.6 + 0.4 * ease_back(p))
    else:
        paste(base, img, cx, cy + dy * (1 - ease_out(p)), alpha=ease_out(p))


# ------------------------------------------------------------ backgrounds ---
def radial_bg(inner, outer, cx=0.5, cy=0.42, r=1.0):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((x - W * cx) / W) ** 2 + ((y - H * cy) / H) ** 2 * 0.6) / (0.75 * r)
    d = np.clip(d, 0, 1)[..., None]
    arr = np.array(inner, np.float32) * (1 - d) + np.array(outer, np.float32) * d
    return Image.fromarray(arr.astype(np.uint8), "RGB")


BG_RED = radial_bg((235, 40, 44), RED_DEEP)
BG_DARK = radial_bg((44, 36, 38), (6, 6, 8))

# ------------------------------------------------------------ brand assets --
logo_src = Image.open(ROOT / "assets/logo.jpg").convert("RGB")
_lum = np.asarray(logo_src.convert("L"), np.float32)
_alpha = np.clip((_lum - 120) * 2.2, 0, 255).astype(np.uint8)
LOGO_WHITE = Image.new("RGBA", logo_src.size, WHITE + (0,))
LOGO_WHITE.putalpha(Image.fromarray(_alpha))
LOGO_WHITE = LOGO_WHITE.crop(LOGO_WHITE.getbbox())

story = Image.open(ROOT / "assets/loja_story.png").convert("RGB")
STORE = story.crop((0, 210, 828, 935)).resize((960, 841), Image.LANCZOS)
_m = Image.new("L", STORE.size, 0)
ImageDraw.Draw(_m).rounded_rectangle((0, 0, STORE.width - 1, STORE.height - 1), 48, fill=255)
STORE_MASK = _m


# ------------------------------------------------------------- cooktops ----
def glass_panel(w, h):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 36, fill=GLASS + (255,), outline=(70, 70, 76), width=4)
    # reflexo diagonal
    refl = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(refl).polygon([(w * 0.08, 0), (w * 0.34, 0), (w * 0.06, h), (-w * 0.2, h)],
                                 fill=(255, 255, 255, 18))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), 36, fill=255)
    img.paste(Image.alpha_composite(img, refl), (0, 0), mask)
    return img


GAS_W, GAS_H = 940, 640
GAS_BURNERS = [(240, 190, 78), (700, 190, 64), (240, 460, 64), (700, 460, 92), (470, 325, 48)]


def gas_base():
    img = glass_panel(GAS_W, GAS_H)
    d = ImageDraw.Draw(img)
    for x, y, r in GAS_BURNERS:
        d.ellipse((x - r - 34, y - r - 34, x + r + 34, y + r + 34), outline=(55, 55, 60), width=5)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(40, 40, 44))
        d.ellipse((x - r * 0.6, y - r * 0.6, x + r * 0.6, y + r * 0.6), fill=(24, 24, 26))
        for a in range(4):  # trempe
            ang = math.pi / 4 + a * math.pi / 2
            d.line((x + math.cos(ang) * (r + 8), y + math.sin(ang) * (r + 8),
                    x + math.cos(ang) * (r + 60), y + math.sin(ang) * (r + 60)),
                   fill=(85, 85, 92), width=12)
    for i in range(5):  # botões
        cx = 300 + i * 85
        d.ellipse((cx - 22, GAS_H - 70, cx + 22, GAS_H - 26), fill=(60, 60, 66), outline=(120, 120, 128), width=3)
    return img


GAS_BASE = gas_base()


def gas_frame(t, t0):
    img = GAS_BASE.copy()
    fl = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(fl)
    for bi, (x, y, r) in enumerate(GAS_BURNERS):
        ign = ease_out(prog(t, t0 + bi * 0.12, 0.35))
        if ign <= 0:
            continue
        n = 22
        for i in range(n):
            a = 2 * math.pi * i / n
            flick = 0.75 + 0.25 * math.sin(t * 23 + i * 1.7 + bi) + 0.1 * math.sin(t * 41 + i)
            L = (16 + 18 * flick) * ign
            bx, by = x + math.cos(a) * r * 0.62, y + math.sin(a) * r * 0.62
            tx, ty = x + math.cos(a) * (r * 0.62 + L), y + math.sin(a) * (r * 0.62 + L)
            px, py = -math.sin(a) * 7, math.cos(a) * 7
            d.polygon([(bx + px, by + py), (tx, ty), (bx - px, by - py)], fill=(70, 140, 255, 230))
            d.polygon([(bx + px * .5, by + py * .5), (bx + (tx - bx) * .55, by + (ty - by) * .55),
                       (bx - px * .5, by - py * .5)], fill=(200, 230, 255, 255))
    glow = fl.filter(ImageFilter.GaussianBlur(14))
    img.alpha_composite(glow)
    img.alpha_composite(glow)
    img.alpha_composite(fl)
    return img


IND_ZONES = [(250, 210, 120), (700, 210, 95), (250, 470, 95), (690, 455, 130)]


def induction_frame(t, t0):
    img = glass_panel(GAS_W, GAS_H)
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow)
    d = ImageDraw.Draw(img)
    for zi, (x, y, r) in enumerate(IND_ZONES):
        on = ease_out(prog(t, t0 + 0.15 + zi * 0.15, 0.4))
        pulse = 0.8 + 0.2 * math.sin(t * 5 + zi)
        if on > 0:
            for k in range(3):
                rr = r * (0.45 + 0.27 * k)
                dg.ellipse((x - rr, y - rr, x + rr, y + rr), outline=(255, 70 + 40 * k, 20, int(230 * on * pulse)), width=14)
        d.ellipse((x - r, y - r, x + r, y + r), outline=(150, 150, 158), width=3)
        for c in (0.25, 0.5):
            d.line((x - r * c, y - r - 10, x + r * c, y - r - 10), fill=(150, 150, 158), width=3)
    # painel touch
    d.rounded_rectangle((300, GAS_H - 78, 640, GAS_H - 28), 14, outline=(110, 110, 118), width=2)
    lvl = int(clamp((t - t0) * 6, 0, 9))
    num = text_img(str(lvl), 34, (255, 80, 40), "Bold")
    img.paste(num, (455, GAS_H - 74), num)
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(16)))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(4)))
    return img


def oven_icon(t, t0):
    w, h = 470, 560
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 30, fill=(205, 208, 214), outline=(240, 240, 244), width=4)
    d.rounded_rectangle((0, 0, w - 1, 110), 30, fill=(28, 28, 32))
    d.rectangle((0, 80, w - 1, 110), fill=(28, 28, 32))
    for i in range(3):
        d.ellipse((60 + i * 70, 35, 100 + i * 70, 75), fill=(80, 80, 88))
    disp = text_img("200°", 36, (255, 120, 40), "Bold")
    img.paste(disp, (300, 36), disp)
    d.rounded_rectangle((70, 135, w - 70, 175), 18, fill=(150, 152, 160))  # puxador
    heat = 0.6 + 0.4 * ease_out(prog(t, t0, 0.8)) * (0.85 + 0.15 * math.sin(t * 4))
    win = (45, 210, w - 45, h - 45)
    d.rounded_rectangle(win, 22, fill=(int(60 * heat + 20), int(25 * heat), 10))
    g = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse((90, 260, w - 90, h - 80), fill=(255, 140, 40, int(170 * heat)))
    img.alpha_composite(g.filter(ImageFilter.GaussianBlur(40)))
    d = ImageDraw.Draw(img)
    for gy in (300, 380):
        d.line((70, gy, w - 70, gy), fill=(120, 70, 40), width=5)
    return img


def hood_icon(t, t0):
    w, h = 470, 560
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle((165, 0, 305, 250), fill=(190, 193, 200), outline=(240, 240, 244), width=4)
    d.polygon([(165, 250), (305, 250), (450, 400), (20, 400)], fill=(205, 208, 214), outline=(240, 240, 244))
    d.rounded_rectangle((10, 395, 460, 440), 10, fill=(150, 152, 160))
    for i in range(3):
        d.rounded_rectangle((150 + i * 60, 405, 180 + i * 60, 428), 6, fill=(40, 40, 46))
    on = ease_out(prog(t, t0 + 0.3, 0.5))
    light = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(light).polygon([(110, 440), (360, 440), (440, 560), (30, 560)],
                                  fill=(255, 240, 200, int(110 * on)))
    img.alpha_composite(light.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(img)
    for i in range(3):  # vapor subindo
        ph = (t * 0.9 + i / 3) % 1
        y = 560 - ph * 140
        x = 150 + i * 85 + 14 * math.sin(t * 3 + i)
        a = int(200 * math.sin(ph * math.pi) * on)
        d.arc((x - 22, y - 22, x + 22, y + 22), 200, 340, fill=(255, 255, 255, a), width=6)
    return img


# ------------------------------------------------------------ transitions --
def wipe(base, t, at, color=RED):
    p = prog(t, at - 0.25, 0.5)
    if 0 < p < 1:
        x = -W * 1.4 + p * W * 2.8
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).polygon([(x, 0), (x + W * 0.9, 0), (x + W * 0.5, H), (x - W * 0.4, H)],
                                      fill=color + (255,))
        base.paste(layer, (0, 0), layer)


def brand_tag(base, alpha=1.0):
    paste(base, LOGO_WHITE, W / 2, 150, alpha=alpha, scale=0.62)


# ----------------------------------------------------------------- scenes --
def scene_hook(t):
    f = BG_DARK.copy()
    zoom = 1.0 + 0.05 * t
    paste(f, gas_frame(t, 0.15), W / 2, 1250, scale=zoom)
    paste(f, text_img("SUA COZINHA", 104), W / 2, 470 + 60 * (1 - ease_out(prog(t, 0.05, 0.4))),
          alpha=ease_out(prog(t, 0.05, 0.4)))
    paste(f, text_img("MERECE UM", 104), W / 2, 590 + 60 * (1 - ease_out(prog(t, 0.35, 0.4))),
          alpha=ease_out(prog(t, 0.35, 0.4)))
    anim_in(f, pill("UPGRADE?", 120, RED, WHITE, pad=(56, 18), weight="Black"), W / 2, 740, t, 0.75, pop=True)
    return f


def scene_brand(t):
    f = BG_RED.copy()
    lt = t - T["brand"]
    p = prog(lt, 0.1, 0.6)
    paste(f, text_img("ENTÃO VEM PRA", 64, (255, 220, 220), "ExtraBold"), W / 2, 700, alpha=ease_out(prog(lt, 0, 0.4)))
    paste(f, LOGO_WHITE, W / 2, 960, alpha=clamp(p * 2), scale=(1.55 + 0.04 * lt) * (0.7 + 0.3 * ease_back(p)))
    anim_in(f, text_img("ELETROS · MÓVEIS · UTENSÍLIOS", 40, WHITE, "SemiBold"), W / 2, 1200, lt, 0.5)
    return f


def product_scene(t, title, subtitle, art, t0):
    f = BG_DARK.copy()
    brand_tag(f)
    lt = t - t0
    paste(f, art, W / 2, 1110, alpha=ease_out(prog(lt, 0, 0.3)), scale=1.0 + 0.02 * lt)
    anim_in(f, text_img(title, 96), W / 2, 420, lt, 0.05)
    anim_in(f, pill(subtitle, 44, RED, WHITE), W / 2, 560, lt, 0.2, pop=True)
    return f


def scene_oven(t):
    f = BG_DARK.copy()
    brand_tag(f)
    lt = t - T["oven"]
    anim_in(f, oven_icon(t, T["oven"]), 290, 1030, lt, 0.0, dy=160)
    anim_in(f, hood_icon(t, T["oven"]), 790, 1030, lt, 0.15, dy=160)
    anim_in(f, text_img("FORNOS", 70), 290, 1390, lt, 0.2)
    anim_in(f, text_img("COIFAS", 70), 790, 1390, lt, 0.35)
    title_a = 1 - prog(t, T["design"] - 0.1, 0.25)
    paste(f, text_img("FORNOS DE EMBUTIR\nE COIFAS", 82, spacing=14), W / 2, 450,
          alpha=ease_out(prog(lt, 0.0, 0.4)) * title_a)
    if t >= T["design"] - 0.1:
        dl = t - T["design"]
        anim_in(f, text_img("DESIGN MODERNO", 88), W / 2, 400, dl, 0.0)
        anim_in(f, text_img("PRA TODO ESTILO DE COZINHA", 46, (255, 200, 200), "Bold"), W / 2, 500, dl, 0.15)
        anim_in(f, pill("COOKTOPS · FORNOS · COIFAS · ELETROS", 36, WHITE, RED_DARK), W / 2, 1590, dl, 0.4, pop=True)
    return f


PIN = Image.new("RGBA", (90, 120), (0, 0, 0, 0))
_d = ImageDraw.Draw(PIN)
_d.ellipse((5, 0, 85, 80), fill=WHITE)
_d.polygon([(14, 58), (76, 58), (45, 118)], fill=WHITE)
_d.ellipse((28, 22, 62, 56), fill=RED)


def scene_location(t):
    f = BG_RED.copy()
    lt = t - T["location"]
    z = 1.0 + 0.08 * prog(lt, 0, 7.5)
    zw, zh = int(STORE.width * z), int(STORE.height * z)
    zoomed = STORE.resize((zw, zh), Image.BILINEAR).crop(
        ((zw - STORE.width) // 2, (zh - STORE.height) // 2,
         (zw - STORE.width) // 2 + STORE.width, (zh - STORE.height) // 2 + STORE.height))
    p = ease_out(prog(lt, 0, 0.5))
    shadow = Image.new("RGBA", (STORE.width + 80, STORE.height + 80), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((40, 50, STORE.width + 40, STORE.height + 40), 48, fill=(0, 0, 0, 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    y0 = 260 + int(120 * (1 - p))
    f.paste(shadow, (60 - 40, y0 - 40), shadow)
    f.paste(zoomed, (60, y0), STORE_MASK)
    anim_in(f, PIN, W / 2, 1255, lt, 0.3, pop=True)
    anim_in(f, text_img(LOCATION[0], 104), W / 2, 1385, lt, 0.4)
    anim_in(f, text_img(LOCATION[1], 50, WHITE, "Bold"), W / 2, 1480, lt, 0.6)
    pt = t - T["perks"]
    anim_in(f, pill("✓ ATENDIMENTO ESPECIALIZADO", 40, WHITE, RED_DARK), W / 2, 1620, pt, 0.0, pop=True)
    anim_in(f, pill("✓ CONDIÇÕES QUE CABEM NO BOLSO", 40, WHITE, RED_DARK), W / 2, 1740, pt, 1.6, pop=True)
    return f


WA_GREEN = (37, 211, 102)


def wa_icon(size=120):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, size - 1, size - 1), fill=WA_GREEN)
    s = size
    d.ellipse((s * .22, s * .2, s * .78, s * .76), outline=WHITE, width=int(s * .07))
    d.polygon([(s * .2, s * .82), (s * .28, s * .62), (s * .4, s * .72)], fill=WHITE)
    d.ellipse((s * .38, s * .36, s * .62, s * .6), fill=WHITE)
    return img


WA = wa_icon()


def scene_cta(t):
    f = BG_RED.copy()
    lt = t - T["cta"]
    anim_in(f, text_img("VEM CONHECER", 64, (255, 215, 215), "ExtraBold"), W / 2, 330, lt, 0.0)
    anim_in(f, text_img("A NOSSA LOJA!", 112), W / 2, 450, lt, 0.12)
    anim_in(f, pill(HOURS[0], 40, RED_DEEP, WHITE), W / 2, 600, lt, 0.4)
    anim_in(f, pill(HOURS[1], 40, RED_DEEP, WHITE), W / 2, 700, lt, 0.55)
    wt = t - T["whats"]
    card = Image.new("RGBA", (920, 330), (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle((0, 0, 919, 329), 40, fill=WHITE)
    card.paste(WA, (60, 50), WA)
    lab = text_img("CHAMA NO WHATSAPP", 48, INK, "ExtraBold")
    card.paste(lab, (205, 85), lab)
    num_p = prog(t, T["number"], 0.5)
    digits = WHATSAPP[: max(0, int(len(WHATSAPP) * clamp(num_p * 1.0) + 0.5))]
    if digits:
        nimg = text_img(digits, 92, (20, 140, 70), "Black")
        card.paste(nimg, (460 - nimg.width // 2, 205), nimg)
    pulse = 1.0 + 0.025 * math.sin(max(0, t - T["number"]) * 6) * (num_p >= 1)
    if wt > 0:
        p = prog(wt, 0, 0.45)
        paste(f, card, W / 2, 1040, alpha=clamp(p * 2), scale=(0.7 + 0.3 * ease_back(p)) * pulse)
    gt = t - T["logo"]
    if gt > -0.2:
        paste(f, LOGO_WHITE, W / 2, 1450, alpha=ease_out(prog(gt, 0, 0.4)), scale=1.1)
        anim_in(f, text_img("ELETROS · MÓVEIS · UTENSÍLIOS", 40, WHITE, "SemiBold"), W / 2, 1600, gt, 0.5)
    else:
        anim_in(f, text_img("JK SHOPPING · 3º PISO", 54, WHITE, "ExtraBold"), W / 2, 1450, lt, 0.7)
    return f


def frame(t):
    if t < T["brand"]:
        f = scene_hook(t)
    elif t < T["gas"]:
        f = scene_brand(t)
    elif t < T["induction"]:
        f = product_scene(t, "COOKTOP A GÁS", "CHAMA FORTE E PRECISA", gas_frame(t, T["gas"]), T["gas"])
    elif t < T["oven"]:
        f = product_scene(t, "INDUÇÃO", "RÁPIDO · SEGURO · ECONÔMICO", induction_frame(t, T["induction"]), T["induction"])
    elif t < T["location"]:
        f = scene_oven(t)
    elif t < T["cta"]:
        f = scene_location(t)
    else:
        f = scene_cta(t)
    for key in ("brand", "gas", "oven", "location", "cta"):
        wipe(f, t, T[key], RED if key != "brand" else WHITE)
    if t > DURATION - 0.4:  # fade final
        f = Image.blend(f, Image.new("RGB", (W, H), RED_DEEP), prog(t, DURATION - 0.4, 0.4) * 0.6)
    return f


# ------------------------------------------------------------------ audio --
def music_bed(path):
    """Trilha simples sintetizada (beat pop 112 bpm) só para o modelo."""
    sr, bpm = 44100, 112
    n = int(sr * DURATION)
    tt = np.arange(n) / sr
    out = np.zeros(n)
    beat = 60 / bpm
    rng = np.random.default_rng(7)
    chords = [[220.0, 277.18, 329.63], [196.0, 246.94, 293.66], [174.61, 220.0, 261.63], [196.0, 246.94, 329.63]]
    for b in range(int(DURATION / beat) + 1):
        s = int(b * beat * sr)
        k = np.arange(min(int(0.25 * sr), n - s)) / sr
        if len(k) == 0:
            continue
        out[s:s + len(k)] += 0.55 * np.sin(2 * np.pi * (50 + 90 * np.exp(-k * 30)) * k) * np.exp(-k * 12)
        hs = int((b + 0.5) * beat * sr)
        hk = np.arange(min(int(0.05 * sr), max(0, n - hs))) / sr
        out[hs:hs + len(hk)] += 0.12 * rng.standard_normal(len(hk)) * np.exp(-hk * 90)
    bar = beat * 4
    for i in range(int(DURATION / bar) + 1):
        s, e = int(i * bar * sr), min(n, int((i + 1) * bar * sr))
        k = np.arange(e - s) / sr
        env = np.minimum(1, k * 4) * np.exp(-k * 0.35)
        for fq in chords[i % 4]:
            out[s:e] += 0.07 * np.sin(2 * np.pi * fq * k) * env
        out[s:e] += 0.18 * np.sin(2 * np.pi * chords[i % 4][0] / 2 * k) * env
    out *= np.minimum(1, tt / 0.5) * np.minimum(1, (DURATION - tt) / 1.0)
    out = (out / np.abs(out).max() * 0.9 * 32767).astype(np.int16)
    import wave
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(out.tobytes())


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    silent = OUT.with_suffix(".video.mp4")
    music = ROOT / "audio/trilha_modelo.wav"
    music_bed(music)
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
         "-crf", "19", "-pix_fmt", "yuv420p", str(silent)], stdin=subprocess.PIPE)
    total = int(DURATION * FPS)
    for i in range(total):
        proc.stdin.write(frame(i / FPS).tobytes())
        if i % 90 == 0:
            print(f"frame {i}/{total}", flush=True)
    proc.stdin.close()
    proc.wait()
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(silent), "-i", str(VOICE), "-i", str(music),
         "-filter_complex",
         f"[1:a]atempo={TEMPO},adelay=150|150,highpass=f=80,acompressor=threshold=-18dB:ratio=3,volume=1.6,asplit=2[v1][v2];"
         "[2:a]volume=0.16[m];[m][v1]sidechaincompress=threshold=0.05:ratio=4:release=300[md];"
         f"[md][v2]amix=inputs=2:duration=longest:normalize=0,atrim=0:{DURATION},loudnorm=I=-14:TP=-1.5,apad,atrim=0:{DURATION}[a]",
         "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-movflags", "+faststart", str(OUT)], check=True)
    silent.unlink()
    print("OK ->", OUT)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        Path(ROOT / "saida/preview").mkdir(parents=True, exist_ok=True)
        for s in map(float, sys.argv[2:]):
            frame(s).save(ROOT / f"saida/preview/f_{s:05.2f}.jpg", quality=85)
    else:
        main()
