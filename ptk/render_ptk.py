#!/usr/bin/env python3
"""Anúncio 9:16 de 30 s - PTK Fretes (Patrick, Strada) - Brasília e todo o DF.

Uso:  python3 render_ptk.py             -> saida/ptk_fretes_30s.mp4
      python3 render_ptk.py preview 1 5  -> quadros soltos em saida/preview/
"""
import math
import subprocess
import sys
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import ptk_art as A
from ptk_art import BLACK, INK, WHITE, YEL, YEL2, font

ROOT = Path(__file__).resolve().parent

# ----------------------------------------------------------------- CONFIG ---
W, H, FPS, DURATION = 1080, 1920, 30, 30.0
VOICE = ROOT / "audio/locucao_raw.wav"
OUT = ROOT / "saida/ptk_fretes_30s.mp4"
WHATS = "(61) 99851-3615"
GREEN = (37, 211, 102)

# Marcas (s) - início de cada frase/palavra da locução (Kokoro, gerada frase a frase)
M = dict(precisa=0.0, frete=0.85, fale=1.514, patrick=2.05, ptk=2.751,
         mudanca=4.10, moveis=5.09, eletro=5.55, caixas=6.60, entregas=7.12,
         rapido=7.766, seguro=9.295, justo=10.62, cuidado=11.647,
         strada=13.65, forca=14.55, atendemos=16.361, brasilia=16.95, df=17.85,
         peca=19.196, orcamento=19.95, whats=20.6, n61=21.37, final=24.379, cta=25.6)
DIGITS = [(22.10, "9"), (22.35, "9"), (22.60, "8"), (22.85, "5"), (23.10, "1"),
          (23.33, "-3"), (23.55, "6"), (23.80, "1"), (24.00, "5")]
CUTS = ["fale", "ptk", "mudanca", "rapido", "strada", "atendemos", "peca", "final"]
HITS = sorted(set([M[k] for k in CUTS] + [M[k] for k in (
    "precisa", "frete", "patrick", "moveis", "eletro", "caixas", "entregas", "seguro", "justo", "cuidado",
    "forca", "brasilia", "df", "orcamento", "n61")] + [d[0] for d in DIGITS[::3]]))
# ---------------------------------------------------------------------------


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, s, d):
    return clamp((t - s) / d)


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_back(x, c=2.2):
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


@lru_cache(None)
def txt(text, size, fill=WHITE, stroke=0, stroke_fill=BLACK, w="BlackItalic", shadow=True):
    f = font(size, w)
    box = ImageDraw.Draw(Image.new("RGBA", (1, 1))).textbbox((0, 0), text, font=f, stroke_width=stroke)
    pad = 34
    img = Image.new("RGBA", (int(box[2] - box[0]) + pad * 2, int(box[3] - box[1]) + pad * 2), (0, 0, 0, 0))
    pos = (pad - box[0], pad - box[1])
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((pos[0] + 8, pos[1] + 12), text, font=f, fill=(0, 0, 0, 160),
                                stroke_width=stroke, stroke_fill=(0, 0, 0, 160))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    ImageDraw.Draw(img).text(pos, text, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
    return img


@lru_cache(None)
def tag(text, size, bg=YEL, fg=BLACK, pad=(44, 18), w="BlackItalic", slant=True):
    t = txt(text, size, fg, w=w, shadow=False)
    iw, ih = t.width - 68 + pad[0] * 2, t.height - 68 + pad[1] * 2
    k = ih * 0.25 if slant else 0
    img = Image.new("RGBA", (int(iw + k * 2) + 40, ih + 40), (0, 0, 0, 0))
    poly = [(20 + k, 20), (20 + k + iw + k, 20), (20 + iw + k, 20 + ih), (20, 20 + ih)] if slant else None
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    if slant:
        sd.polygon([(x + 6, y + 10) for x, y in poly], fill=(0, 0, 0, 150))
    else:
        sd.rounded_rectangle((26, 30, iw + 26, ih + 30), ih // 2, fill=(0, 0, 0, 150))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(img)
    if slant:
        d.polygon(poly, fill=bg)
    else:
        d.rounded_rectangle((20, 20, iw + 20, ih + 20), ih // 2, fill=bg)
    img.alpha_composite(t, (int(20 + k + pad[0] - 34), 20 + pad[1] - 34))
    return img


def paste(base, img, cx, cy, alpha=1.0, scale=1.0, rot=0.0):
    if alpha <= 0.01 or scale <= 0.01:
        return
    if rot:
        img = img.rotate(rot, Image.BICUBIC, expand=True)
    if abs(scale - 1) > 1e-3:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.BILINEAR)
    if alpha < 1:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v: int(v * alpha)))
    x, y = int(cx - img.width / 2), int(cy - img.height / 2)
    if x >= 0 and y >= 0 and x + img.width <= W and y + img.height <= H:
        base.alpha_composite(img, (x, y))
    else:
        base.paste(img, (x, y), img)


def slam(base, img, cx, cy, t, at, rot=0.0, big=1.7, dur=0.22):
    p = prog(t, at, dur)
    if p > 0:
        paste(base, img, cx, cy, alpha=clamp(p * 3), scale=big + (1 - big) * ease_out(p), rot=rot)


def pop(base, img, cx, cy, t, at, rot=0.0, dur=0.3):
    p = prog(t, at, dur)
    if p > 0:
        paste(base, img, cx, cy, alpha=clamp(p * 3), scale=max(0.01, ease_back(p)), rot=rot)


def slide(base, img, cx, cy, t, at, dx=0, dy=0, dur=0.26):
    p = prog(t, at, dur)
    if p > 0:
        e = ease_out(p)
        paste(base, img, cx + dx * (1 - e), cy + dy * (1 - e), alpha=clamp(p * 2))


# ------------------------------------------------------------ backgrounds ---
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_ANG = np.arctan2(_yy - H * 0.5, _xx - W / 2)
_DIST = np.sqrt((_xx - W / 2) ** 2 + (_yy - H * 0.5) ** 2) / (H * 0.62)
_VIG = np.clip(1 - _DIST ** 1.6 * 0.6, 0.3, 1)[..., None]


def rays(t, c1, c2, speed=0.4, n=16):
    band = ((_ANG + t * speed) * n / (2 * math.pi)) % 1.0 < 0.5
    arr = np.where(band[..., None], np.array(c1, np.float32), np.array(c2, np.float32))
    center = np.clip(1 - _DIST * 1.6, 0, 1)[..., None] * 50
    return Image.fromarray(np.clip(arr * _VIG + center, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def speedlines(img, t, n=14, alpha=45, color=(255, 255, 255)):
    d = ImageDraw.Draw(img)
    for i in range(n):
        y = (i * 137 + t * 2600) % (H + 400) - 200
        x = (i * 263) % W
        d.line((x, y, x + 120, y + 380), fill=color + (alpha,), width=6 if i % 3 else 3)


HORIZON = 1180


@lru_cache(None)
def sky():
    """Céu de fim de tarde de Brasília (azul escuro -> dourado) + chão escuro."""
    top, mid, hor = np.array([10, 16, 40], np.float32), np.array([40, 52, 110], np.float32), np.array([255, 176, 40], np.float32)
    y = _yy[:, :1] / HORIZON
    col = np.where(y < 0.6, top + (mid - top) * (y / 0.6), mid + (hor - mid) * np.clip((y - 0.6) / 0.4, 0, 1))
    arr = np.repeat(col[:, None, :].reshape(H, 1, 3), W, 1)
    sun = np.clip(1 - np.sqrt(((_xx - W * 0.7) / 260) ** 2 + ((_yy - HORIZON + 40) / 200) ** 2), 0, 1)[..., None]
    arr = arr + sun * np.array([120, 90, 30], np.float32)
    ground = (_yy >= HORIZON)[..., None]
    arr = np.where(ground, np.array([24, 24, 28], np.float32), arr)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    return img


SKY_W = 1600
SKYLINE = A.skyline(SKY_W, 380, (12, 12, 20))


def road_scene(t, drive_x=None, scroll=True, truck_scale=0.95, truck_y=1330):
    f = sky().copy()
    off = int((t * 120) % SKY_W) if scroll else 200
    for k in (-1, 0, 1):
        f.alpha_composite(SKYLINE, (k * SKY_W - off, HORIZON - 375)) if 0 <= k * SKY_W - off + SKY_W and k * SKY_W - off < W else None
    d = ImageDraw.Draw(f)
    d.rectangle((0, HORIZON, W, HORIZON + 330), fill=(44, 44, 50))
    d.rectangle((0, HORIZON, W, HORIZON + 8), fill=(90, 90, 96))
    dash_off = (t * 1400) % 220 if scroll else 0
    for x in range(-220, W + 220, 220):
        d.rectangle((x - dash_off, HORIZON + 250, x - dash_off + 120, HORIZON + 266), fill=YEL)
    truck = A.pickup(t if scroll else 0)
    tw = int(truck.width * truck_scale)
    truck = truck.resize((tw, int(truck.height * truck_scale)), Image.BILINEAR)
    bob = 3 * math.sin(t * 24) if scroll else 0
    x = W / 2 if drive_x is None else drive_x
    paste(f, truck, x, truck_y - truck.height / 2 + 150 + bob)
    return f


def ticker(f, t):
    off = int(t * 260) % _tw
    f.alpha_composite(TICKER.crop((off, 0, off + W, 84)), (0, 1560))
    ImageDraw.Draw(f).rectangle((0, 1552, W, 1560), fill=BLACK)
    ImageDraw.Draw(f).rectangle((0, 1644, W, 1652), fill=BLACK)


TICK_TXT = "  FRETES EM BRASÍLIA E TODO O DF • WHATSAPP 61 99851-3615 • ATENDIMENTO RÁPIDO • PREÇO JUSTO •"
_tf = font(40, "BlackItalic")
_tw = int(ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(TICK_TXT, font=_tf))
TICKER = Image.new("RGBA", (_tw * 3, 84), YEL + (255,))
for _i in range(3):
    ImageDraw.Draw(TICKER).text((_i * _tw, 42), TICK_TXT, font=_tf, fill=BLACK, anchor="lm")

LOGO_H = A.logo_horizontal(True, 230)
LOGO_H_SM = A.logo_horizontal(True, 130)


def wa_icon(s=140):
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, s - 1, s - 1), fill=GREEN)
    d.ellipse((s * .2, s * .18, s * .8, s * .78), outline=WHITE, width=int(s * .075))
    d.polygon([(s * .17, s * .85), (s * .25, s * .62), (s * .4, s * .74)], fill=WHITE)
    d.rounded_rectangle((s * .38, s * .36, s * .5, s * .48), 6, fill=WHITE)
    d.rounded_rectangle((s * .5, s * .5, s * .62, s * .62), 6, fill=WHITE)
    return img


WA = wa_icon()


def check_icon(s=110):
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, s - 1, s - 1), fill=BLACK)
    d.line((s * .27, s * .52, s * .44, s * .7, s * .75, s * .32), fill=YEL, width=int(s * .12), joint="curve")
    return img


CHECK = check_icon()


@lru_cache(None)
def pin(s=200):
    img = Image.new("RGBA", (s, int(s * 1.35)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, s - 1, s - 1), fill=YEL)
    d.polygon([(s * .12, s * .7), (s * .88, s * .7), (s * .5, s * 1.33)], fill=YEL)
    d.ellipse((s * .3, s * .3, s * .7, s * .7), fill=BLACK)
    return img


# --------------------------------------------------------------- cenas -----
def sc_hook(t):
    x = -500 + (W / 2 + 500) * ease_out(prog(t, 0.0, 1.2))
    f = road_scene(t, drive_x=x)
    slam(f, txt("PRECISA DE UM", 104, WHITE, 8, BLACK), W / 2, 470, t, M["precisa"], rot=-3)
    slam(f, txt("FRETE?", 250, YEL, 12, BLACK), W / 2, 680, t, M["frete"], rot=-3, big=2.2)
    return f


def sc_patrick(t):
    f = rays(t, YEL, YEL2, speed=1.0)
    speedlines(f, t, color=(0, 0, 0), alpha=40)
    slam(f, txt("FALE COM O", 120, BLACK, 0, BLACK, shadow=False), W / 2, 760, t, M["fale"], rot=-3)
    slam(f, txt("PATRICK!", 230, WHITE, 14, BLACK), W / 2, 980, t, M["patrick"], rot=-3, big=2.2)
    return f


def sc_logo(t):
    f = rays(t, (26, 26, 30), (12, 12, 14), speed=0.8)
    slam(f, LOGO_H, W / 2, 900, t, M["ptk"], big=2.2, dur=0.25)
    slide(f, tag("FORÇA E CONFIANÇA NO SEU FRETE", 46), W / 2, 1160, t, M["ptk"] + 0.5, dy=60)
    return f


def sc_itens(t):
    f = road_scene(t)
    items = [("MUDANÇA PEQUENA", "mudanca"), ("MÓVEIS", "moveis"), ("ELETRODOMÉSTICOS", "eletro"),
             ("CAIXAS", "caixas"), ("ENTREGAS", "entregas")]
    for i, (lab, k) in enumerate(items):
        slam(f, tag(lab, 68 if len(lab) < 12 else 60, YEL if i % 2 == 0 else WHITE, BLACK), W / 2 + (-60 if i % 2 else 60),
             300 + i * 140, t, M[k], rot=(-3, 2)[i % 2])
    return f


def sc_beneficios(t):
    f = rays(t, YEL, YEL2, speed=0.5)
    speedlines(f, t, color=(0, 0, 0), alpha=30)
    rows = [("ATENDIMENTO", "RÁPIDO", "rapido"), ("TRANSPORTE", "SEGURO", "seguro"), ("PREÇO", "JUSTO", "justo"),
            ("CUIDADO COM", "SUA CARGA", "cuidado")]
    for i, (a, b, k) in enumerate(rows):
        y = 420 + i * 270
        p = prog(t, M[k], 0.22)
        if p <= 0:
            continue
        row = Image.new("RGBA", (980, 250), (0, 0, 0, 0))
        row.alpha_composite(CHECK, (0, 70))
        ta = txt(a, 70, BLACK, 0, BLACK, shadow=False)
        tb = txt(b, 104, WHITE, 8, BLACK)
        row.alpha_composite(ta, (130 - 34, 20 - 34))
        row.alpha_composite(tb, (130 - 34, 92 - 34))
        paste(f, row, W / 2 + 40 + 700 * (1 - ease_out(p)), y, alpha=clamp(p * 3))
    return f


def sc_strada(t):
    f = rays(t, (26, 26, 30), (12, 12, 14), speed=0.3)
    lt = t - M["strada"]
    big = txt("STRADA", 260, (40, 40, 46), 0, BLACK, shadow=False)
    paste(f, big, W / 2 + 40 - lt * 30, 760)
    glow = A.pickup(0, shadow=True)
    slide(f, glow.resize((int(glow.width * 1.0), int(glow.height * 1.0))), W / 2, 1000, t, M["strada"], dx=-1100, dur=0.4)
    slam(f, txt("COM A STRADA,", 92, WHITE, 6, BLACK), W / 2, 420, t, M["strada"], rot=-3)
    slam(f, tag("FORÇA E CONFIANÇA", 80), W / 2, 1300, t, M["forca"], rot=-2)
    slam(f, txt("NO SEU FRETE!", 92, YEL, 6, BLACK), W / 2, 1440, t, M["forca"] + 0.5, rot=-2)
    return f


def sc_df(t):
    lt = t - M["atendemos"]
    f = road_scene(t, drive_x=-300 + (W + 600) * prog(lt, 0.3, 2.6), truck_scale=0.7, truck_y=1330)
    bounce = abs(math.sin(lt * 5)) * 30
    pop(f, pin(), W / 2, 330 - bounce, t, M["atendemos"])
    slam(f, txt("ATENDEMOS", 96, WHITE, 6, BLACK), W / 2, 560, t, M["atendemos"] + 0.1, rot=-3)
    slam(f, txt("BRASÍLIA", 200, YEL, 12, BLACK), W / 2, 730, t, M["brasilia"], rot=-3, big=2.0)
    slam(f, tag("E TODO O DF!", 96, WHITE, BLACK), W / 2, 920, t, M["df"], rot=2)
    return f


def wa_card(num):
    card = Image.new("RGBA", (1000, 300), (0, 0, 0, 0))
    sh = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((20, 34, 980, 290), 50, fill=(0, 0, 0, 130))
    card.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    ImageDraw.Draw(card).rounded_rectangle((10, 10, 990, 270), 50, fill=WHITE)
    card.alpha_composite(WA.resize((120, 120)), (50, 80))
    n = txt(num, 104, (12, 120, 56), w="Black", shadow=False)
    card.alpha_composite(n, (575 - n.width // 2, 140 - n.height // 2))
    return card


def sc_whats(t):
    f = rays(t, (20, 160, 80), (14, 130, 64), speed=0.4)
    speedlines(f, t, alpha=25)
    slam(f, txt("PEÇA SEU", 110, WHITE, 7, (0, 60, 30)), W / 2, 420, t, M["peca"])
    slam(f, txt("ORÇAMENTO", 150, YEL, 9, (0, 60, 30)), W / 2, 570, t, M["orcamento"], rot=-3, big=2.0)
    slam(f, txt("PELO WHATSAPP", 90, WHITE, 6, (0, 60, 30)), W / 2, 720, t, M["whats"])
    if t >= M["n61"]:
        num = "(61) " + "".join(d for at, d in DIGITS if t >= at)
        last = max([M["n61"]] + [at for at, _ in DIGITS if t >= at])
        bump = 1 + 0.06 * (1 - prog(t, last, 0.15))
        pp = prog(t, M["n61"], 0.25)
        paste(f, wa_card(num), W / 2, 1000, alpha=clamp(pp * 3), scale=bump * (0.6 + 0.4 * ease_back(pp)))
    return f


def sc_final(t):
    f = rays(t, (26, 26, 30), (12, 12, 14), speed=0.4)
    f.alpha_composite(A.skyline(W, 300, (40, 40, 48)), (0, 1240))
    lt = t - M["final"]
    slam(f, LOGO_H, W / 2, 420, t,
         M["final"], big=2.0, dur=0.25)
    slide(f, tag("FORÇA E CONFIANÇA NO SEU FRETE", 44), W / 2, 640, t, M["final"] + 0.3, dy=60)
    slide(f, wa_card(WHATS), W / 2, 860, t, M["final"] + 0.5, dx=-1100)
    slide(f, txt("BRASÍLIA E TODO O DF", 64, WHITE), W / 2, 1060, t, M["final"] + 0.8, dy=50)
    slide(f, txt("ATENDIMENTO RÁPIDO • PREÇO JUSTO", 42, YEL, w="Black"), W / 2, 1150, t, M["final"] + 1.0, dy=40)
    truck = A.pickup(t, shadow=True)
    truck = truck.resize((int(truck.width * .62), int(truck.height * .62)), Image.BILINEAR)
    paste(f, truck, -300 + (W + 600) * prog(lt, 0.6, 4.5), 1430 + 2 * math.sin(t * 24))
    pulse = 1 + 0.05 * math.sin(max(0, t - M["cta"]) * 7)
    p = prog(t, M["cta"], 0.3)
    if p > 0:
        paste(f, tag("CHAMA NO WHATSAPP!", 72, YEL, BLACK), W / 2, 1590, alpha=clamp(p * 3), scale=ease_back(p) * pulse,
              rot=-2)
    return f


def frame(t):
    if t < M["fale"]:
        f = sc_hook(t)
    elif t < M["ptk"]:
        f = sc_patrick(t)
    elif t < M["mudanca"]:
        f = sc_logo(t)
    elif t < M["rapido"]:
        f = sc_itens(t)
    elif t < M["strada"]:
        f = sc_beneficios(t)
    elif t < M["atendemos"]:
        f = sc_strada(t)
    elif t < M["peca"]:
        f = sc_df(t)
    elif t < M["final"]:
        f = sc_whats(t)
    else:
        f = sc_final(t)
    if M["ptk"] <= t < M["final"]:
        ticker(f, t)
    last_hit = max([h for h in HITS if h <= t], default=-9)
    k = 1 - prog(t, last_hit, 0.16)
    if k > 0:
        amp = 16 * k
        dx, dy = int(amp * math.sin(t * 190)), int(amp * math.cos(t * 160))
        f = f.resize((W + 40, H + 70), Image.BILINEAR).crop((20 + dx, 35 + dy, 20 + dx + W, 35 + dy + H))
    last_cut = max([M[c] for c in CUTS if M[c] <= t], default=-9)
    fl = 1 - prog(t, last_cut, 0.12)
    if fl > 0:
        f = Image.blend(f.convert("RGB"), Image.new("RGB", (W, H), WHITE), 0.7 * fl)
    return f.convert("RGB")


# ------------------------------------------------------------------ áudio ---
def trilha(path):
    """Beat 126 BPM + motor/whoosh/impacto."""
    sr, bpm = 44100, 126
    n = int(sr * DURATION)
    out = np.zeros(n)
    rng = np.random.default_rng(9)
    beat = 60 / bpm

    def add(s, sig):
        s = int(s * sr)
        if 0 <= s < n:
            e = min(n, s + len(sig))
            out[s:e] += sig[:e - s]

    k = np.arange(int(0.3 * sr)) / sr
    kick = np.sin(2 * np.pi * (44 + 125 * np.exp(-k * 36)) * k) * np.exp(-k * 8)
    c = np.arange(int(0.18 * sr)) / sr
    clap = 0.4 * rng.standard_normal(len(c)) * np.exp(-c * 26)
    hh = np.arange(int(0.04 * sr)) / sr
    hat = 0.13 * rng.standard_normal(len(hh)) * np.exp(-hh * 110)
    roots = [49.0, 49.0, 41.2, 43.65]  # Sol, Sol, Mi, Fá
    for b in range(int(DURATION / beat) + 1):
        tb = b * beat
        add(tb, kick)
        add(tb + beat / 2, hat)
        if b % 2 == 1:
            add(tb, clap)
        r = roots[(b // 4) % 4]
        bb = np.arange(int(beat / 2 * sr)) / sr
        add(tb + beat / 2, 0.34 * np.sign(np.sin(2 * np.pi * r * 2 * bb)) * np.exp(-bb * 7))
        if b % 8 in (0, 3, 6):
            st = np.arange(int(0.2 * sr)) / sr
            add(tb, sum(np.sin(2 * np.pi * r * m * st) for m in (4, 5, 6)) * 0.06 * np.exp(-st * 12))
    # ronco do motor na abertura (picape chegando)
    mt = np.arange(int(1.4 * sr)) / sr
    freq = 38 + 30 * np.minimum(1, mt / 0.9)
    motor = 0.25 * np.sign(np.sin(2 * np.pi * np.cumsum(freq) / sr)) * np.minimum(1, mt * 3) * np.exp(-np.maximum(0, mt - 1.0) * 6)
    add(0.0, np.convolve(motor, np.ones(30) / 30, mode="same"))
    w_ = np.arange(int(0.22 * sr)) / sr
    whoosh = np.convolve(rng.standard_normal(len(w_)) * (w_ / w_[-1]) ** 2 * 0.25, np.ones(20) / 20, mode="same")
    i_ = np.arange(int(0.5 * sr)) / sr
    boom = 0.8 * np.sin(2 * np.pi * (36 + 60 * np.exp(-i_ * 20)) * i_) * np.exp(-i_ * 6)
    for h in HITS:
        if any(abs(h - M[cc]) < 1e-6 for cc in CUTS):
            add(h - 0.22, whoosh)
            add(h, boom)
        else:
            add(h, boom * 0.35)
    tt = np.arange(n) / sr
    out *= np.minimum(1, (DURATION - tt) / 1.5)
    out = np.tanh(out * 1.4)
    out = (out / np.abs(out).max() * 0.92 * 32767).astype(np.int16)
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
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(silent), "-i", str(VOICE), "-i", str(music),
         "-filter_complex",
         "[1:a]aresample=44100,highpass=f=90,equalizer=f=3500:t=q:w=1.2:g=4,equalizer=f=180:t=q:w=1:g=2,"
         "acompressor=threshold=-22dB:ratio=4:attack=5:release=80,volume=2.2,asplit=2[v1][v2];"
         "[2:a]volume=0.30[m];[m][v1]sidechaincompress=threshold=0.04:ratio=5:release=250[md];"
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
            frame(s).save(d / f"a_{s:05.2f}.jpg", quality=85)
    else:
        main()
