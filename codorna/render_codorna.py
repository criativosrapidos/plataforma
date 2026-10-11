#!/usr/bin/env python3
"""Vídeo 9:16 em motion - Codorna do Heber. Tudo sincronizado com a locução (timestamps do Scribe).

Uso:  python3 render_codorna.py              -> saida/codorna_heber.mp4
      python3 render_codorna.py preview 1 5  -> quadros soltos em saida/preview/
"""
import json
import math
import subprocess
import sys
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

import cod_art as A
from cod_art import BG, BG2, CREAM, GOLD, GREEN, INK, ORANGE, RED, WHITE, font

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / "ptk"))
from whatsapp_icon import wa_icon  # noqa: E402

W, H, FPS, DURATION = 1080, 1920, 30, 26.0
VOICE = ROOT / "audio/locucao.mp3"  # ElevenLabs "Nassif - Persuasive Sales & Ads", take 1
OUT = ROOT / "saida/codorna_heber.mp4"
DELAY = 0.30
WHATS = "(69) 99352-8816"
WA_GREEN = (37, 211, 102)

WORDS = [w for w in json.loads((ROOT / "audio/words.json").read_text())["words"] if w["type"] == "word"]
WT = [w["start"] + DELAY for w in WORDS]


def at(word, nth=0):
    hits = [i for i, w in enumerate(WORDS) if w["text"].strip(".,!?:").lower() == word]
    return WT[hits[nth]]


T = dict(voce=0.0, entao=at("então"), carne=at("carne"), suc=at("suculenta"), sabor=at("cheia"), rica=at("rica"),
         ferro=at("ferro"), frita=at("frita"), assada=at("assada"), brasa=at("brasa") - .1,
         vinte=at("em", 1), pronta=at("pronta"), bandeja=at("bandeja"), limpinhas=at("limpinhas"),
         prontas=at("prontas"), sai=at("sai"), onze=at("onze"), cada=at("cada"), codorna_do=at("codorna", 1),
         chama=at("chama"), garante=at("garante"))


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, s, d):
    return clamp((t - s) / d)


def ease(x):
    return 1 - (1 - x) ** 3


def back(x, c=2.2):
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


# ------------------------------------------------------------------ peças ---
@lru_cache(None)
def emoji(ch, size):
    f = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", 109)
    img = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((80, 80), ch, font=f, embedded_color=True, anchor="mm")
    img = img.crop(img.getbbox()).resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size + 40, size + 40), (0, 0, 0, 0))
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 150), (20, 30), img.getchannel("A"))
    out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    out.alpha_composite(img, (20, 20))
    return out


@lru_cache(None)
def txt(text, size, color=WHITE, fname="lil", stroke=10, stroke_col=INK, shadow=True):
    f = font(fname, size)
    bb = ImageDraw.Draw(Image.new("L", (1, 1))).textbbox((0, 0), text, font=f, stroke_width=stroke)
    pad = 40
    img = Image.new("RGBA", (bb[2] - bb[0] + pad * 2, bb[3] - bb[1] + pad * 2), (0, 0, 0, 0))
    pos = (pad - bb[0], pad - bb[1])
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((pos[0] + 6, pos[1] + 12), text, font=f, fill=(0, 0, 0, 170), stroke_width=stroke,
                                stroke_fill=(0, 0, 0, 170))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
    ImageDraw.Draw(img).text(pos, text, font=f, fill=color, stroke_width=stroke, stroke_fill=stroke_col)
    return img


def fit(text, size, maxw=980, **kw):
    im = txt(text, size, **kw)
    while im.width - 80 > maxw and size > 30:
        size -= 6
        im = txt(text, size, **kw)
    return im


@lru_cache(None)
def chip(text, size, fill=ORANGE, color=WHITE, rot=0):
    f = font("lil", size)
    tw = ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f)
    w, h = int(tw + size * 1.0), int(size * 1.5)
    img = Image.new("RGBA", (w + 40, h + 50), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((20, 34, w + 20, h + 34), int(h * .3), fill=(0, 0, 0, 160))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((20, 20, w + 20, h + 20), int(h * .3), fill=fill + (255,))
    d.text((20 + w / 2, 20 + h / 2 + size * .04), text, font=f, fill=color, anchor="mm")
    return img.rotate(rot, Image.BICUBIC, expand=True) if rot else img


def put(base, img, cx, cy, alpha=1.0, scale=1.0, rot=0.0):
    if alpha <= 0.01 or scale <= 0.01:
        return
    if rot:
        img = img.rotate(rot, Image.BICUBIC, expand=True)
    if abs(scale - 1) > 1e-3:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.BICUBIC)
    if alpha < 1:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v: int(v * alpha)))
    base.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


def pop(base, img, cx, cy, t, t0, dur=0.32, rot=0.0):
    p = prog(t, t0, dur)
    if p > 0:
        put(base, img, cx, cy, alpha=clamp(p * 4), scale=back(p), rot=rot)


def slam(base, img, cx, cy, t, t0, dur=0.22, rot=0.0):
    """Entra grande e 'bate' no lugar, com tremidinha."""
    p = prog(t, t0, dur)
    if p <= 0:
        return
    s = 2.4 - 1.4 * ease(p)
    shake = 14 * math.exp(-(t - t0 - dur) * 14) * math.sin((t - t0) * 70) if t > t0 + dur else 0
    put(base, img, cx + shake, cy, alpha=clamp(p * 3), scale=s, rot=rot)


def slide(base, img, cx, cy, t, t0, dur=0.3, frm=1):
    p = ease(prog(t, t0, dur))
    if p > 0:
        put(base, img, cx + frm * W * (1 - p), cy, alpha=clamp(p * 2))


# ------------------------------------------------------------------ fundos ---
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_ang = np.arctan2(_yy - H * .45, _xx - W / 2)
_rad = np.sqrt((_xx - W / 2) ** 2 + (_yy - H * .45) ** 2)


def rays(c1, c2, t, n=16, speed=.25):
    """Raios girando (energia de comercial)."""
    k = ((_ang + t * speed) * n / (2 * math.pi)) % 1 < .5
    vig = np.clip(1 - _rad / (H * .75), 0.25, 1)[..., None]
    col = np.where(k[..., None], np.array(c1, np.float32), np.array(c2, np.float32)) * vig
    return Image.fromarray(col.astype(np.uint8)).convert("RGBA")


@lru_cache(None)
def radial(c1, c2):
    g = np.clip(_rad / (H * .7), 0, 1)[..., None]
    col = np.array(c1, np.float32) * (1 - g) + np.array(c2, np.float32) * g
    return Image.fromarray(col.astype(np.uint8)).convert("RGBA")


def sparks(img, t, seed=1, n=26, col=GOLD):
    rng = np.random.default_rng(seed)
    d = ImageDraw.Draw(img)
    for i in range(n):
        x0, sp, ph, r = rng.uniform(0, W), rng.uniform(80, 220), rng.uniform(0, 10), rng.uniform(4, 10)
        y = H - ((t * sp + ph * 200) % (H + 200))
        x = x0 + 30 * math.sin(t * 2 + ph)
        d.ellipse((x - r, y - r, x + r, y + r), fill=col + (int(120 + 100 * math.sin(t * 4 + ph) ** 2),))


def steam(img, cx, cy, t, w=260):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for k in range(3):
        pts = []
        x0 = cx + (k - 1) * w * .35
        for j in range(30):
            yy = cy - j * 12
            pts.append((x0 + 22 * math.sin(j * .35 - t * 4 + k * 2), yy))
        a = int(110 * (0.6 + 0.4 * math.sin(t * 3 + k)))
        d.line(pts, fill=(255, 255, 255, a), width=14, joint="curve")
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(7)))


@lru_cache(None)
def hero(size=760):
    """Prato com a codorna assada e guarnição."""
    s = size
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    img.alpha_composite(A.plate(s))
    r = A.roasted(int(s * .78))
    img.alpha_composite(r, (int(s * .11), int(s * .06)))
    for ch, x, y, sz, rot in (("🌿", .08, .55, .26, 30), ("🍋", .70, .62, .22, -15), ("🌿", .72, .08, .2, -40),
                              ("🧄", .06, .16, .17, 10)):
        e = emoji(ch, int(s * sz)).rotate(rot, Image.BICUBIC, expand=True)
        img.alpha_composite(e, (int(s * x), int(s * y)))
    return img


@lru_cache(None)
def foto_bandeja():
    src = Image.open(ROOT / "assets/raw/codornas_tabua.jpg").convert("RGB")
    src = src.crop((40, 120, 880, 1560))
    src = ImageEnhance.Color(src).enhance(1.25)
    src = ImageEnhance.Brightness(src).enhance(1.08)
    src = ImageEnhance.Contrast(src).enhance(1.1)
    arr = np.asarray(src).astype(np.float32)
    arr[..., 0] *= 1.06
    arr[..., 2] *= .9
    src = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).resize((560, 960), Image.LANCZOS)
    fr = Image.new("RGBA", (620, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(fr)
    d.rounded_rectangle((0, 0, 619, 1079), 26, fill=(255, 255, 255, 255))
    fr.paste(src, (30, 30))
    d.text((310, 1032), "8 CODORNAS · BANDEJA", font=font("lil", 40), fill=BG, anchor="mm")
    out = Image.new("RGBA", (700, 1160), (0, 0, 0, 0))
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 170), (40, 56), fr.getchannel("A"))
    out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    out.alpha_composite(fr, (40, 40))
    return out


# ------------------------------------------------------------------- cenas ---
def sc_hook(t):
    img = rays((255, 120, 30), (255, 96, 14), t)
    sparks(img, t, 1)
    p = ease(prog(t, 0.0, .6))
    put(img, hero(820), W / 2, H * .66 + 500 * (1 - p), rot=-20 * (1 - p) + 4 * math.sin(t * 2))
    slam(img, fit("VOCÊ JÁ COMEU", 110), W / 2, 330, t, WT[0])
    slam(img, fit("CODORNA?", 230, color=GOLD, stroke=14), W / 2, 560, t, WT[3] - .1, rot=-3)
    return img


def sc_perdendo(t):
    img = rays((226, 38, 32), (196, 24, 20), t, 12, -.4)
    sparks(img, t, 2, col=(255, 220, 120))
    slam(img, fit("ENTÃO VOCÊ", 120), W / 2, 640, t, T["entao"])
    slam(img, fit("TÁ PERDENDO!", 190, color=GOLD, stroke=14), W / 2, 880, t, at("perdendo") - .05, rot=-4)
    pop(img, emoji("😱", 300), W / 2, 1300, t, at("perdendo") + .1, rot=8 * math.sin(t * 6))
    return img


def sc_carne(t):
    img = radial((96, 32, 12), BG)
    sparks(img, t, 3)
    u = t - T["carne"]
    hs = 1.0 + 0.03 * u
    put(img, hero(900), W / 2, 1080, scale=hs, rot=u * 6)
    steam(img, W / 2, 760, t)
    pop(img, chip("MACIA", 92, ORANGE, rot=-6), 300, 360, t, at("macia") - .05)
    pop(img, chip("SUCULENTA", 92, RED, rot=4), 640, 520, t, T["suc"] - .05)
    pop(img, chip("CHEIA DE SABOR", 88, GOLD, INK, rot=-3), W / 2, 1700, t, T["sabor"] - .05)
    pop(img, emoji("🤤", 210), 900, 300, t, at("sabor"), rot=10 * math.sin(t * 5))
    return img


def sc_saude(t):
    img = rays((255, 206, 60), (255, 190, 40), t, 18, .3)
    slam(img, fit("RICA EM", 120, color=WHITE), W / 2, 420, t, T["rica"] - .05)
    pop(img, chip("PROTEÍNA", 130, BG, GOLD), W / 2, 720, t, at("proteína") - .1)
    pop(img, emoji("💪", 260), 830, 960, t, at("proteína") + .1, rot=-10)
    pop(img, chip("FERRO", 130, RED, WHITE), W / 2, 1230, t, T["ferro"] - .1)
    pop(img, emoji("⚡", 200), 230, 1460, t, T["ferro"] + .05, rot=12)
    return img


@lru_cache(None)
def prep_card(label, ch, col):
    w, h = 900, 300
    img = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((30, 46, w + 30, h + 46), 50, fill=(0, 0, 0, 170))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((30, 30, w + 30, h + 30), 50, fill=CREAM + (255,))
    d.rounded_rectangle((30, 30, 330, h + 30), 50, fill=col + (255,))
    d.rectangle((280, 30, 330, h + 30), fill=col + (255,))
    e = emoji(ch, 190)
    img.alpha_composite(e, (180 - e.width // 2, 180 - e.height // 2))
    lines = label.split("\n")
    for i, ln in enumerate(lines):
        y = 180 + (i - (len(lines) - 1) / 2) * 92
        d.text((370, y), ln, font=font("lil", 84 if i == 0 else 70), fill=BG if i == 0 else (180, 60, 20), anchor="lm")
    return img


def sc_preparo(t):
    img = radial((120, 36, 10), BG)
    sparks(img, t, 4)
    slam(img, fit("COMO FAZER?", 110, color=GOLD), W / 2, 260, t, T["frita"] - .2)
    cards = [("FRITA\nNO ALHO", "🧄", ORANGE, T["frita"], 560), ("ASSADA\nCOM ERVAS", "🌿", GREEN, T["assada"], 940),
             ("NA BRASA", "🔥", RED, T["brasa"], 1320)]
    for i, (lab, ch, col, t0, y) in enumerate(cards):
        slide(img, prep_card(lab, ch, col), W / 2, y + 6 * math.sin(t * 3 + i), t, t0 - .08, .28, 1 if i % 2 == 0 else -1)
    p = prog(t, T["brasa"], .3)
    if p > 0:
        put(img, A.flame(240, t), 160, 1650, alpha=p)
        put(img, A.flame(200, t + 1), 930, 1680, alpha=p)
    return img


def sc_tempo(t):
    img = rays((255, 120, 30), (240, 96, 14), t, 14, .5)
    t0 = T["vinte"]
    cx, cy, r = W / 2, 820, 330
    d = ImageDraw.Draw(img)
    d.ellipse((cx - r - 30, cy - r - 30, cx + r + 30, cy + r + 30), fill=CREAM + (255,))
    p = ease(prog(t, t0, 1.0))
    d.pieslice((cx - r, cy - r, cx + r, cy + r), -90, -90 + 360 * p, fill=GOLD + (255,))
    d.ellipse((cx - r * .78, cy - r * .78, cx + r * .78, cy + r * .78), fill=CREAM + (255,))
    n = int(round(20 * p))
    put(img, txt(f"{n}", 260, color=BG, stroke=0, shadow=False), cx, cy - 40)
    put(img, txt("MIN", 90, color=ORANGE, stroke=0, shadow=False), cx, cy + 130)
    pop(img, emoji("⏱️", 210), cx + 300, cy - 300, t, t0, rot=-12)
    slam(img, fit("TÁ PRONTA!", 180, color=GOLD, stroke=14), W / 2, 1420, t, T["pronta"] - .05, rot=-3)
    return img


def sc_bandeja(t):
    img = radial((110, 30, 10), BG)
    sparks(img, t, 5)
    u = t - T["bandeja"]
    p = ease(prog(t, T["bandeja"], .45))
    put(img, foto_bandeja(), W / 2, 900 + 300 * (1 - p), alpha=p, scale=.84 + .02 * u, rot=-4 + 2 * math.sin(u))
    slam(img, fit("BANDEJA COM 8", 120, color=GOLD), W / 2, 230, t, T["bandeja"])
    pop(img, chip("LIMPINHAS", 70, GREEN), 330, 1560, t, T["limpinhas"] - .05, rot=-4)
    pop(img, chip("PRONTAS PRA TEMPERAR", 62, ORANGE), W / 2, 1720, t, T["prontas"] - .05, rot=2)
    pop(img, emoji("✅", 110), 640, 1545, t, T["limpinhas"] + .05)
    return img


def sc_preco(t):
    img = rays((255, 206, 60), (255, 184, 30), t, 20, -.6)
    sparks(img, t, 6, col=WHITE)
    slam(img, fit("SAI POR", 130, color=WHITE), W / 2, 560, t, T["sai"] - .05)
    p = prog(t, T["onze"] - .1, .25)
    if p > 0:
        card = Image.new("RGBA", (980, 420), (0, 0, 0, 0))
        d = ImageDraw.Draw(card)
        d.rounded_rectangle((20, 20, 960, 400), 60, fill=RED + (255,))
        d.text((150, 230), "R$", font=font("lil", 110), fill=GOLD, anchor="lm")
        d.text((320, 225), "11,25", font=font("lil", 250), fill=WHITE, anchor="lm")
        s = 2.2 - 1.2 * ease(p)
        shake = 12 * math.exp(-(t - T["onze"]) * 10) * math.sin(t * 70) if t > T["onze"] + .15 else 0
        put(img, card, W / 2 + shake, 860, alpha=clamp(p * 3), scale=s, rot=-3)
    pop(img, chip("CADA", 110, BG, GOLD, rot=4), W / 2, 1180, t, T["cada"] - .05)
    pop(img, emoji("🤑", 220), 860, 1430, t, T["cada"] + .1, rot=10 * math.sin(t * 5))
    pa = ease(prog(t, T["cada"] + .3, .3))
    if pa > 0:
        put(img, txt("Bandeja com 8 unidades", 52, color=BG, stroke=0, shadow=False), W / 2, 1600, alpha=pa)
    return img


@lru_cache(None)
def wa_button():
    w, h = 920, 190
    img = Image.new("RGBA", (w + 40, h + 50), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((20, 34, w + 20, h + 34), h // 2, fill=(0, 0, 0, 170))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((20, 20, w + 20, h + 20), h // 2, fill=WA_GREEN + (255,))
    ic = wa_icon(130, bg=False)
    img.alpha_composite(ic, (70, 20 + (h - 130) // 2))
    d.text((230, 20 + h / 2 - 34), "CHAMA NO WHATSAPP", font=font("lil", 64), fill=WHITE, anchor="lm")
    d.text((232, 20 + h / 2 + 38), WHATS, font=font("m9", 54), fill=WHITE, anchor="lm")
    return img


def sc_final(t):
    img = rays((255, 120, 30), (240, 98, 16), t, 16, .2)
    sparks(img, t, 7)
    pop(img, A.logo(620), W / 2, 560 + 10 * math.sin(t * 2.4), t, T["codorna_do"] - .1, .45)
    pb = prog(t, T["chama"] - .1, .35)
    if pb > 0:
        pulse = 1 + .035 * math.sin(max(0, t - T["chama"]) * 7)
        put(img, wa_button(), W / 2, 1150, alpha=clamp(pb * 3), scale=back(pb) * pulse)
    pg = ease(prog(t, T["garante"] - .1, .35))
    if pg > 0:
        put(img, fit("GARANTE A SUA!", 130, color=GOLD, stroke=12), W / 2, 1420 + 40 * (1 - pg), alpha=pg, rot=-2)
        put(img, emoji("😋", 170), W / 2, 1650, alpha=pg, rot=10 * math.sin(t * 4))
    return img


SCENES = [(0.0, sc_hook), (T["entao"] - .08, sc_perdendo), (T["carne"] - .08, sc_carne), (T["rica"] - .1, sc_saude),
          (T["frita"] - .2, sc_preparo), (T["vinte"] - .1, sc_tempo), (T["bandeja"] - .1, sc_bandeja),
          (T["sai"] - .12, sc_preco), (T["codorna_do"] - .12, sc_final)]


def frame(t):
    idx = max(i for i, (s, _) in enumerate(SCENES) if s <= t)
    s0 = SCENES[idx][0]
    img = SCENES[idx][1](t)
    u = t - s0
    if idx > 0 and u < .16:               # zoom-punch + flash no corte
        z = 1 + .12 * (1 - u / .16)
        cw, ch = W / z, H / z
        img = img.crop((int((W - cw) / 2), int((H - ch) / 2), int((W + cw) / 2), int((H + ch) / 2))).resize((W, H))
        if u < .05:
            img = Image.blend(img.convert("RGB"), Image.new("RGB", (W, H), (255, 255, 255)), .55 * (1 - u / .05))
    rgb = img.convert("RGB")
    if t > DURATION - .4:
        rgb = Image.blend(rgb, Image.new("RGB", (W, H)), (t - (DURATION - .4)) / .4)
    return rgb


# ------------------------------------------------------------------ áudio ---
def trilha(path):
    """Batida animada 124 bpm (bumbo 4x4, palma, chimbal, baixo) + 'whoosh' nas trocas de cena."""
    sr = 44100
    n = int(sr * DURATION)
    out = np.zeros(n)
    rng = np.random.default_rng(11)
    beat = 60 / 124
    k = np.arange(int(.25 * sr)) / sr
    kick = np.sin(2 * np.pi * (48 + 110 * np.exp(-k * 35)) * k) * np.exp(-k * 9)
    clap = rng.standard_normal(len(k)) * np.exp(-k * 30) * .5
    hat = rng.standard_normal(int(.05 * sr)) * np.exp(-np.arange(int(.05 * sr)) / sr * 90) * .18
    bassn = [40, 40, 43, 45]

    def add(sig, s, g=1.0):
        if s < n:
            e = min(n, s + len(sig))
            out[s:e] += sig[:e - s] * g

    for b in range(int(DURATION / beat) + 1):
        s = int(b * beat * sr)
        add(kick, s, .9)
        if b % 2 == 1:
            add(clap, s, .6)
        add(hat, s + int(beat / 2 * sr), 1.0)
        note = bassn[(b // 4) % 4]
        f = 440 * 2 ** ((note - 69) / 12)
        bl = np.arange(int(beat * .9 * sr)) / sr
        bass = np.sign(np.sin(2 * np.pi * f * bl)) * .22 * np.exp(-bl * 3)
        add(bass, s + int(beat / 2 * sr), 1.0)
    for s0, _ in SCENES[1:]:
        L = int(.35 * sr)
        x = np.arange(L) / L
        wh = rng.standard_normal(L) * np.sin(np.pi * x) ** 2 * .35
        wh = np.convolve(wh, np.ones(12) / 12, "same")
        add(wh, int((s0 - .2) * sr))
    tt = np.arange(n) / sr
    out *= np.minimum(1, tt / .3) * np.minimum(1, (DURATION - tt) / 1.2)
    out = np.tanh(out * 1.3)
    out = (out / np.abs(out).max() * .85 * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(out.tobytes())


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    silent = OUT.with_suffix(".video.mp4")
    music = ROOT / "audio/trilha.wav"
    trilha(music)
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
         "-pix_fmt", "yuv420p", str(silent)], stdin=subprocess.PIPE)
    total = int(DURATION * FPS)
    for i in range(total):
        proc.stdin.write(frame(i / FPS).tobytes())
        if i % 150 == 0:
            print(f"frame {i}/{total}", flush=True)
    proc.stdin.close()
    proc.wait()
    dl = int(DELAY * 1000)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(silent), "-i", str(VOICE), "-i", str(music),
         "-filter_complex",
         f"[1:a]adelay={dl}|{dl},aresample=44100,highpass=f=80,"
         f"acompressor=threshold=-20dB:ratio=3:attack=5:release=90,volume=2.0,apad,atrim=0:{DURATION},asplit=2[v1][v2];"
         "[2:a]volume=0.14[m];[m][v1]sidechaincompress=threshold=0.03:ratio=6:release=300[md];"
         f"[md][v2]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.0,apad,atrim=0:{DURATION}[a]",
         "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-movflags", "+faststart", str(OUT)], check=True)
    silent.unlink()
    print("OK ->", OUT)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        d = ROOT / "saida/preview"
        d.mkdir(parents=True, exist_ok=True)
        for s in map(float, sys.argv[2:]):
            frame(s).save(d / f"c_{s:05.2f}.jpg", quality=88)
    else:
        main()
