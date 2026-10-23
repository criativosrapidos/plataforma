#!/usr/bin/env python3
"""Anúncio 9:16 (tráfego pago) - Academia Equilíbrio e Movimento, Sobradinho-DF.

Uso:  python3 render_academia.py             -> saida/equilibrio_anuncio_25s.mp4
      python3 render_academia.py preview 1 5  -> quadros soltos em saida/preview/
"""
import math
import subprocess
import sys
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import esportes as E

ROOT = Path(__file__).resolve().parent

# ----------------------------------------------------------------- CONFIG ---
W, H, FPS, DURATION = 1080, 1920, 30, 25.0
VOICE = ROOT / "audio/locucao.mp3"
OUT = ROOT / "saida/equilibrio_anuncio_25s.mp4"
BLUE, BLUE2, NAVY = (22, 101, 192), (12, 70, 160), (6, 24, 64)
ORANGE, ORANGE2, WHITE, YEL = (255, 122, 26), (232, 84, 10), (255, 255, 255), (255, 214, 0)
UNIDADES = [("SOBRADINHO 1", "INSTITUTO SÃO JOSÉ", "(61) 98134-3227"),
            ("SOBRADINHO 2", "COND. MINI CHÁCARAS", "(61) 98167-0442")]
FIXO = "(61) 3485-4723"

# início de cada palavra na locução (ElevenLabs Scribe)
M = dict(atencao=0.0, sobradinho=0.613, musc=1.44, cross=2.56, beach=3.6, natacao=4.72, idades=5.6,
         hidro=6.88, ballet=8.16, volei=8.96, futsal=9.36, tudo=10.72, academia=11.2, sao=13.28,
         unidades=13.84, sobr2=14.56, matriculas=15.44, abertas=16.08, chama=16.96, whats=17.28,
         faca=18.0, matricula=19.0, final=20.0)
CUTS = ["musc", "cross", "beach", "natacao", "hidro", "ballet", "volei", "tudo", "sao", "matriculas",
        "chama", "final"]
HITS = sorted(set([M[k] for k in CUTS] + [M[k] for k in (
    "atencao", "sobradinho", "idades", "futsal", "academia", "unidades", "abertas", "whats", "faca")]))
# ---------------------------------------------------------------------------

FD = "/usr/share/fonts/opentype/inter/InterDisplay-{}.otf"


@lru_cache(None)
def font(size, w="Black"):
    return ImageFont.truetype(FD.format(w), size)


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, s, d):
    return clamp((t - s) / d)


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_back(x, c=2.2):
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


@lru_cache(None)
def txt(text, size, fill=WHITE, stroke=0, stroke_fill=NAVY, w="Black", shadow=True):
    f = font(size, w)
    box = ImageDraw.Draw(Image.new("RGBA", (1, 1))).textbbox((0, 0), text, font=f, stroke_width=stroke)
    pad = 34
    img = Image.new("RGBA", (int(box[2] - box[0]) + pad * 2, int(box[3] - box[1]) + pad * 2), (0, 0, 0, 0))
    pos = (pad - box[0], pad - box[1])
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((pos[0] + 8, pos[1] + 12), text, font=f, fill=(0, 0, 0, 150),
                                stroke_width=stroke, stroke_fill=(0, 0, 0, 150))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    ImageDraw.Draw(img).text(pos, text, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
    return img


@lru_cache(None)
def tag(text, size, bg=ORANGE, fg=WHITE, pad=(44, 18), r=None, w="BlackItalic"):
    t = txt(text, size, fg, w=w, shadow=False)
    iw, ih = t.width - 68 + pad[0] * 2, t.height - 68 + pad[1] * 2
    rad = ih // 2 if r is None else r
    img = Image.new("RGBA", (iw + 40, ih + 40), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((26, 30, iw + 26, ih + 30), rad, fill=(0, 0, 0, 140))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    ImageDraw.Draw(img).rounded_rectangle((20, 20, iw + 20, ih + 20), rad, fill=bg)
    img.alpha_composite(t, (20 + pad[0] - 34, 20 + pad[1] - 34))
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
    center = np.clip(1 - _DIST * 1.6, 0, 1)[..., None] * 55
    return Image.fromarray(np.clip(arr * _VIG + center, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


@lru_cache(None)
def split_bg(flip=False):
    """Diagonal azul / laranja (cores da marca) com brilho no centro."""
    d = (_yy - H * 0.58) + (_xx - W / 2) * (0.45 if not flip else -0.45)
    a = np.clip(d / 6 + 0.5, 0, 1)[..., None]
    arr = np.array(NAVY, np.float32) * (1 - a) + np.array(ORANGE2, np.float32) * a
    glow = np.clip(1 - np.sqrt(((_xx - W / 2) / 650) ** 2 + ((_yy - 1100) / 560) ** 2), 0, 1) ** 1.5
    arr = arr + glow[..., None] * np.array([40, 90, 160], np.float32)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def speedlines(img, t, n=14, alpha=45):
    d = ImageDraw.Draw(img)
    for i in range(n):
        y = (i * 137 + t * 2600) % (H + 400) - 200
        x = (i * 263) % W
        d.line((x, y, x + 120, y + 380), fill=(255, 255, 255, alpha), width=6 if i % 3 else 3)


# ------------------------------------------------------------------ brand ---
LOGO = Image.open(ROOT / "assets/logo_pill.png").convert("RGBA")
_ls = Image.new("RGBA", (LOGO.width + 80, LOGO.height + 80), (0, 0, 0, 0))
_ls.paste((0, 0, 0, 150), (48, 56), LOGO)
LOGO_SH = _ls.filter(ImageFilter.GaussianBlur(14))
LOGO_SH.alpha_composite(LOGO, (40, 40))


def logo(scale):
    return LOGO_SH.resize((int(LOGO_SH.width * scale), int(LOGO_SH.height * scale)), Image.LANCZOS)


LOGO_BIG, LOGO_MED, LOGO_SM = logo(0.95), logo(0.8), logo(0.42)


def wa_icon(s=140):
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, s - 1, s - 1), fill=(37, 211, 102))
    d.ellipse((s * .2, s * .18, s * .8, s * .78), outline=WHITE, width=int(s * .075))
    d.polygon([(s * .17, s * .85), (s * .25, s * .62), (s * .4, s * .74)], fill=WHITE)
    d.rounded_rectangle((s * .38, s * .36, s * .5, s * .48), 6, fill=WHITE)
    d.rounded_rectangle((s * .5, s * .5, s * .62, s * .62), 6, fill=WHITE)
    return img


WA = wa_icon()
TICK_TXT = "  MATRÍCULAS ABERTAS • SOBRADINHO 1 E 2 • MUSCULAÇÃO • NATAÇÃO • BEACH TENNIS • CROSSTRAINING •"
_tf = font(40, "BlackItalic")
_tw = int(ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(TICK_TXT, font=_tf))
TICKER = Image.new("RGBA", (_tw * 3, 84), ORANGE + (255,))
for _i in range(3):
    ImageDraw.Draw(TICKER).text((_i * _tw, 42), TICK_TXT, font=_tf, fill=WHITE, anchor="lm")


def ticker(f, t):
    off = int(t * 260) % _tw
    f.alpha_composite(TICKER.crop((off, 0, off + W, 84)), (0, 1560))
    ImageDraw.Draw(f).rectangle((0, 1552, W, 1560), fill=NAVY)
    ImageDraw.Draw(f).rectangle((0, 1644, W, 1652), fill=NAVY)


def bug(f):
    paste(f, LOGO_SM, W / 2, 300)


# --------------------------------------------------------------- cenas -----
def sc_hook(t):
    f = rays(t, BLUE, BLUE2, speed=1.2)
    speedlines(f, t)
    slam(f, txt("ATENÇÃO,", 170, ORANGE, 10, NAVY, "BlackItalic"), W / 2, 800, t, M["atencao"], rot=4)
    slam(f, txt("SOBRADINHO!", 150, WHITE, 10, NAVY, "BlackItalic"), W / 2, 990, t, M["sobradinho"], rot=-3)
    return f


def sc_modalidade(t, at, word, art, sub=None, sub_at=None, flip=False, size=150, art_y=1120, extra=None):
    f = split_bg(flip).copy()
    speedlines(f, t, alpha=30)
    if extra:
        extra(f, t)
    bug(f)
    dx = -900 if flip else 900
    slide(f, art, W / 2, art_y, t, at, dx=dx, dur=0.2)
    slam(f, txt(word, size, WHITE, 9, NAVY, "BlackItalic"), W / 2, 560, t, at, rot=-3)
    if sub:
        slam(f, tag(sub, 64), W / 2, 720, t, sub_at if sub_at is not None else at + 0.25, rot=2)
    return f


def agua(f, t):
    f.alpha_composite(E.ondas(t, W, 620), (0, 1000))


def sc_natacao(t):
    f = sc_modalidade(t, M["natacao"], "NATAÇÃO", E.oculos(), extra=agua, art_y=980)
    slam(f, tag("PRA TODAS AS IDADES!", 60, YEL, NAVY), W / 2, 720, t, M["idades"], rot=2)
    for i, (lab, at) in enumerate((("BEBÊS", M["idades"] + 0.2), ("KIDS", M["idades"] + 0.4), ("ADULTOS", M["idades"] + 0.6))):
        pop(f, tag(lab, 50, WHITE, BLUE2), 220 + i * 320, 1300, t, at, rot=(-3, 2, -2)[i])
    return f


def sc_hidro(t):
    def ext(f, tt):
        agua(f, tt)
    f = sc_modalidade(t, M["hidro"], "HIDROGINÁSTICA", E.halter_aqua(), flip=True, size=112, extra=ext, art_y=1000)
    slam(f, tag("SAÚDE EM TODA IDADE", 56), W / 2, 720, t, M["hidro"] + 0.35, rot=2)
    return f


def sc_kids(t):
    f = split_bg(False).copy()
    speedlines(f, t, alpha=30)
    bug(f)
    slam(f, txt("VÔLEI", 170, WHITE, 9, NAVY, "BlackItalic"), W / 2 - 150, 520, t, M["volei"], rot=-3)
    slam(f, txt("& FUTSAL", 150, ORANGE, 9, NAVY, "BlackItalic"), W / 2 + 60, 680, t, M["futsal"], rot=-3)
    slam(f, tag("INFANTIL", 90, YEL, NAVY), W / 2, 850, t, M["futsal"] + 0.3, rot=3)
    bounce = abs(math.sin((t - M["volei"]) * 7)) * 60
    slide(f, E.bola_volei(), 300, 1220 - bounce, t, M["volei"], dx=-700)
    slide(f, E.bola_futsal(), 790, 1250 - abs(math.sin((t - M["futsal"]) * 7 + 1)) * 60, t, M["futsal"], dx=700)
    return f


def sc_tudo(t):
    f = rays(t, WHITE, (230, 238, 250), speed=0.8)
    slam(f, txt("TUDO NA", 120, BLUE2, 0, NAVY, "BlackItalic", shadow=False), W / 2, 640, t, M["tudo"], rot=-3)
    slam(f, LOGO_BIG, W / 2, 900, t, M["academia"], big=2.2, dur=0.25)
    pop(f, tag("UM LUGAR SÓ PRA FAMÍLIA INTEIRA", 50, ORANGE, WHITE), W / 2, 1160, t, M["academia"] + 0.9)
    return f


def unit_card(name, place, phone, wa=False):
    h = 300 if wa else 220
    c = Image.new("RGBA", (900, h + 20), (0, 0, 0, 0))
    sh = Image.new("RGBA", c.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((18, 26, 890, h + 14), 36, fill=(0, 0, 0, 130))
    c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    ImageDraw.Draw(c).rounded_rectangle((10, 10, 880, h), 36, fill=WHITE)
    ImageDraw.Draw(c).rounded_rectangle((10, 10, 40, h), 15, fill=ORANGE)
    a = txt(name, 62, BLUE2, w="BlackItalic", shadow=False)
    b = txt(place, 40, NAVY, w="Bold", shadow=False)
    c.alpha_composite(a, (66 - 34, 30 - 34))
    c.alpha_composite(b, (68 - 34, 112 - 34))
    if wa:
        c.alpha_composite(WA.resize((76, 76)), (64, 186))
        p = txt(phone, 64, (12, 120, 56), w="Black", shadow=False)
        c.alpha_composite(p, (160 - 34, 224 - p.height // 2))
    return c


CARDS = [unit_card(*u) for u in UNIDADES]
CARDS_WA = [unit_card(*u, wa=True) for u in UNIDADES]


def sc_unidades(t):
    f = rays(t, BLUE, BLUE2, speed=0.5)
    speedlines(f, t, alpha=30)
    bug(f)
    slam(f, txt("2", 360, ORANGE, 12, NAVY, "BlackItalic"), 215, 640, t, M["sao"] + 0.1, rot=-4, big=2.2)
    slam(f, txt("UNIDADES", 110, WHITE, 8, NAVY, "BlackItalic"), 670, 590, t, M["unidades"], rot=-3)
    slam(f, txt("EM SOBRADINHO!", 78, YEL, 6, NAVY, "BlackItalic"), 670, 720, t, M["sobr2"], rot=-3)
    slide(f, CARDS[0], W / 2, 1050, t, M["unidades"] + 0.1, dx=-1000)
    slide(f, CARDS[1], W / 2, 1310, t, M["sobr2"], dx=1000)
    return f


def sc_matriculas(t):
    f = rays(t, ORANGE, ORANGE2, speed=1.0)
    speedlines(f, t)
    slam(f, txt("MATRÍCULAS", 150, WHITE, 10, NAVY, "BlackItalic"), W / 2, 820, t, M["matriculas"], rot=-4, big=2.0)
    slam(f, tag("ABERTAS!", 150, NAVY, YEL, pad=(60, 20)), W / 2, 1040, t, M["abertas"], rot=3, big=2.2)
    return f


def sc_whats(t):
    f = rays(t, (20, 160, 80), (14, 130, 64), speed=0.4)
    speedlines(f, t, alpha=25)
    slam(f, txt("CHAMA NO", 100, WHITE, 7, (0, 60, 30), "BlackItalic"), W / 2, 420, t, M["chama"])
    p = prog(t, M["whats"], 0.25)
    if p > 0:
        row = Image.new("RGBA", (1000, 200), (0, 0, 0, 0))
        row.alpha_composite(WA, (0, 30))
        tw = txt("WHATSAPP", 112, WHITE, 8, (0, 60, 30), "BlackItalic")
        row.alpha_composite(tw, (150, 100 - tw.height // 2))
        paste(f, row, W / 2 + 10, 580, alpha=clamp(p * 3), scale=1.6 - 0.6 * ease_out(p))
    slide(f, CARDS_WA[0], W / 2, 870, t, M["whats"] + 0.2, dx=-1000)
    slide(f, CARDS_WA[1], W / 2, 1195, t, M["whats"] + 0.4, dx=1000)
    pulse = 1 + 0.05 * math.sin(max(0, t - M["faca"]) * 8)
    p2 = prog(t, M["faca"], 0.3)
    if p2 > 0:
        paste(f, tag("FAÇA JÁ SUA MATRÍCULA!", 70, ORANGE, WHITE), W / 2, 1430, alpha=clamp(p2 * 3),
              scale=ease_back(p2) * pulse, rot=-2)
    return f


def sc_final(t):
    f = split_bg(False).copy()
    lt = t - M["final"]
    slam(f, LOGO_MED, W / 2, 420, t, M["final"], big=2.0, dur=0.25)
    slide(f, tag("MATRÍCULAS ABERTAS", 74, ORANGE, WHITE), W / 2, 640, t, M["final"] + 0.3, dy=60)
    slide(f, CARDS_WA[0], W / 2, 880, t, M["final"] + 0.5, dx=-1000)
    slide(f, CARDS_WA[1], W / 2, 1200, t, M["final"] + 0.7, dx=1000)
    slide(f, txt(f"FIXO {FIXO}", 48, WHITE, w="Bold"), W / 2, 1395, t, M["final"] + 0.9, dy=40)
    pulse = 1 + 0.05 * math.sin(max(0, lt - 1.2) * 7)
    p = prog(t, M["final"] + 1.2, 0.3)
    if p > 0:
        paste(f, tag("VEM TREINAR COM A GENTE!", 64, YEL, NAVY), W / 2, 1510, alpha=clamp(p * 3),
              scale=ease_back(p) * pulse, rot=-2)
    return f


def frame(t):
    if t < M["musc"]:
        f = sc_hook(t)
    elif t < M["cross"]:
        f = sc_modalidade(t, M["musc"], "MUSCULAÇÃO", E.halter(), "TREINO COM ORIENTAÇÃO", size=136)
    elif t < M["beach"]:
        f = sc_modalidade(t, M["cross"], "CROSSTRAINING", E.kettlebell(), "ALTA INTENSIDADE", flip=True, size=118)
    elif t < M["natacao"]:
        f = sc_modalidade(t, M["beach"], "BEACH TENNIS", E.raquete(), "ARENA BEACH", size=140, art_y=1150)
    elif t < M["hidro"]:
        f = sc_natacao(t)
    elif t < M["ballet"]:
        f = sc_hidro(t)
    elif t < M["volei"]:
        f = sc_modalidade(t, M["ballet"], "BALLET", E.sapatilhas(), "DANÇA E DISCIPLINA", size=190, art_y=1150)
    elif t < M["tudo"]:
        f = sc_kids(t)
    elif t < M["sao"]:
        f = sc_tudo(t)
    elif t < M["matriculas"]:
        f = sc_unidades(t)
    elif t < M["chama"]:
        f = sc_matriculas(t)
    elif t < M["final"]:
        f = sc_whats(t)
    else:
        f = sc_final(t)
    if M["musc"] <= t < M["final"]:
        ticker(f, t)
    last_hit = max([h for h in HITS if h <= t], default=-9)
    k = 1 - prog(t, last_hit, 0.16)
    if k > 0:
        amp = 18 * k
        dx, dy = int(amp * math.sin(t * 190)), int(amp * math.cos(t * 160))
        f = f.resize((W + 40, H + 70), Image.BILINEAR).crop((20 + dx, 35 + dy, 20 + dx + W, 35 + dy + H))
    last_cut = max([M[c] for c in CUTS if M[c] <= t], default=-9)
    fl = 1 - prog(t, last_cut, 0.12)
    if fl > 0:
        f = Image.blend(f.convert("RGB"), Image.new("RGB", (W, H), WHITE), 0.7 * fl)
    return f.convert("RGB")


# ------------------------------------------------------------------ áudio ---
def trilha(path):
    """Beat de academia 132 BPM (kick forte, clap, baixo pulsando) + whoosh/impacto nos cortes."""
    sr, bpm = 44100, 132
    n = int(sr * DURATION)
    out = np.zeros(n)
    rng = np.random.default_rng(5)
    beat = 60 / bpm

    def add(s, sig):
        s = int(s * sr)
        if 0 <= s < n:
            e = min(n, s + len(sig))
            out[s:e] += sig[:e - s]

    k = np.arange(int(0.3 * sr)) / sr
    kick = 1.0 * np.sin(2 * np.pi * (42 + 130 * np.exp(-k * 38)) * k) * np.exp(-k * 8)
    c = np.arange(int(0.18 * sr)) / sr
    clap = 0.4 * rng.standard_normal(len(c)) * np.exp(-c * 26)
    hh = np.arange(int(0.04 * sr)) / sr
    hat = 0.13 * rng.standard_normal(len(hh)) * np.exp(-hh * 110)
    roots = [41.2, 41.2, 49.0, 36.7]  # Mi, Mi, Sol, Ré
    for b in range(int(DURATION / beat) + 1):
        tb = b * beat
        add(tb, kick)
        add(tb + beat / 2, hat)
        add(tb + beat / 4 * 3, hat * 0.5)
        if b % 2 == 1:
            add(tb, clap)
        r = roots[(b // 4) % 4]
        bb = np.arange(int(beat / 2 * sr)) / sr
        add(tb + beat / 2, 0.34 * np.sign(np.sin(2 * np.pi * r * 2 * bb)) * np.exp(-bb * 7))
        if b % 8 in (0, 3, 6):
            st = np.arange(int(0.2 * sr)) / sr
            add(tb, sum(np.sin(2 * np.pi * r * m * st) for m in (4, 6, 8)) * 0.06 * np.exp(-st * 12))
    w_ = np.arange(int(0.22 * sr)) / sr
    whoosh = np.convolve(rng.standard_normal(len(w_)) * (w_ / w_[-1]) ** 2 * 0.25, np.ones(20) / 20, mode="same")
    i_ = np.arange(int(0.5 * sr)) / sr
    boom = 0.8 * np.sin(2 * np.pi * (36 + 60 * np.exp(-i_ * 20)) * i_) * np.exp(-i_ * 6)
    for h in HITS:
        if any(abs(h - M[c]) < 1e-6 for c in CUTS):
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
         "[1:a]highpass=f=90,acompressor=threshold=-20dB:ratio=4:attack=5:release=80,volume=2.0,"
         "asplit=2[v1][v2];[2:a]volume=0.30[m];"
         "[m][v1]sidechaincompress=threshold=0.04:ratio=5:release=250[md];"
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
