#!/usr/bin/env python3
"""Anúncio 9:16 de tráfego pago - Casa do Cooktop (JK Shopping), pegada "varejão de TV".

Cortes secos, flash, tremida e texto batendo na palavra exata da locução.
Produtos: renderizados em produtos3d.py (nada de foto do Instagram).

Uso:  python3 render_anuncio.py            -> saida/casadocooktop_anuncio_30s.mp4
      python3 render_anuncio.py preview 1 5 -> quadros soltos em saida/preview/
"""
import math
import subprocess
import sys
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import produtos3d as P

ROOT = Path(__file__).resolve().parent

# ----------------------------------------------------------------- CONFIG ---
W, H, FPS, DURATION = 1080, 1920, 30, 30.0
VOICE = ROOT / "audio/locucao_anuncio.wav"
OUT = ROOT / "saida/casadocooktop_anuncio_30s.mp4"
WHATSAPP = "(61) 98345-7770"
RED, RED2, DEEP = (228, 28, 36), (196, 14, 22), (90, 4, 8)
YEL, WHITE, INK, GREEN = (255, 214, 0), (255, 255, 255), (20, 20, 22), (37, 211, 102)

# Marcas (s) = início de cada palavra na locução (transcrição ElevenLabs Scribe).
M = dict(atencao=0.0, brasilia=0.693, sua=1.52, cozinha=1.76, nova=2.16, ta=2.48,
         logo=3.44, gas=4.72, gas2=5.44, ind=6.04, ind2=6.80, forno=7.60, forno2=8.32,
         coifa=9.08, mais=10.0, airfryer=11.4, panelas=12.32, eletro=12.84, moveis=14.12,
         corre=15.16, jk=15.64, piso=16.64, tagua=17.48, chama=18.40, whats=19.12,
         n61=19.64, end=24.36, slogan=25.72, info=26.6)
DIGITS = [(20.60, "9"), (21.08, "8"), (21.36, "3"), (21.60, "4"), (21.96, "5"),
          (22.48, "-7"), (22.84, "7"), (23.36, "7"), (23.80, "0")]
CUTS = ["sua", "logo", "gas", "ind", "forno", "coifa", "mais", "corre", "chama", "end"]
HITS = sorted(set([M[k] for k in CUTS] + [M[k] for k in (
    "atencao", "brasilia", "nova", "gas2", "ind2", "forno2", "airfryer", "panelas", "eletro",
    "moveis", "jk", "piso", "whats")] + [d[0] for d in DIGITS]))
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
def txt(text, size, fill=WHITE, stroke=0, stroke_fill=INK, w="Black", shadow=True):
    f = font(size, w)
    box = ImageDraw.Draw(Image.new("RGBA", (1, 1))).textbbox((0, 0), text, font=f, stroke_width=stroke)
    pad = 30
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
def tag(text, size, bg=YEL, fg=RED2, pad=(46, 20), r=None, w="Black"):
    t = txt(text, size, fg, w=w, shadow=False)
    iw, ih = t.width - 60 + pad[0] * 2, t.height - 60 + pad[1] * 2
    img = Image.new("RGBA", (iw + 40, ih + 40), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((26, 30, iw + 26, ih + 30), r if r is not None else ih // 2, fill=(0, 0, 0, 140))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    ImageDraw.Draw(img).rounded_rectangle((20, 20, iw + 20, ih + 20), r if r is not None else ih // 2, fill=bg)
    img.alpha_composite(t, (20 + pad[0] - 30, 20 + pad[1] - 30))
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
    base.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2))) if (
        cx - img.width / 2 >= 0 and cy - img.height / 2 >= 0 and cx + img.width / 2 <= W and cy + img.height / 2 <= H
    ) else base.paste(img, (int(cx - img.width / 2), int(cy - img.height / 2)), img)


def slam(base, img, cx, cy, t, at, rot=0.0, big=1.6, dur=0.22):
    """Entra grande e 'bate' no lugar (estilo varejão)."""
    p = prog(t, at, dur)
    if p <= 0:
        return
    s = big + (1 - big) * ease_out(p)
    paste(base, img, cx, cy, alpha=clamp(p * 3), scale=s, rot=rot)


def pop(base, img, cx, cy, t, at, rot=0.0, dur=0.3):
    p = prog(t, at, dur)
    if p > 0:
        paste(base, img, cx, cy, alpha=clamp(p * 3), scale=max(0.01, ease_back(p)), rot=rot)


def slide(base, img, cx, cy, t, at, dx=0, dy=0, dur=0.28):
    p = prog(t, at, dur)
    if p > 0:
        e = ease_out(p)
        paste(base, img, cx + dx * (1 - e), cy + dy * (1 - e), alpha=clamp(p * 2))


# ------------------------------------------------------------ backgrounds ---
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_ANG = np.arctan2(_yy - H * 0.47, _xx - W / 2)
_DIST = np.sqrt((_xx - W / 2) ** 2 + (_yy - H * 0.47) ** 2) / (H * 0.62)
_VIG = np.clip(1 - _DIST ** 1.6 * 0.55, 0.35, 1)[..., None]


def rays(t, c1, c2, speed=0.35, n=18):
    band = ((_ANG + t * speed) * n / (2 * math.pi)) % 1.0 < 0.5
    arr = np.where(band[..., None], np.array(c1, np.float32), np.array(c2, np.float32))
    center = np.clip(1 - _DIST * 1.6, 0, 1)[..., None] * 60
    return Image.fromarray(np.clip(arr * _VIG + center, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


@lru_cache(None)
def studio():
    """Fundo escuro de estúdio com luz vermelha atrás do produto."""
    arr = np.zeros((H, W, 3), np.float32) + 12
    glow = np.clip(1 - np.sqrt(((_xx - W / 2) / 700) ** 2 + ((_yy - 1180) / 520) ** 2), 0, 1) ** 1.4
    arr += glow[..., None] * np.array([210, 20, 28], np.float32)
    floor = (_yy > 1380).astype(np.float32)[..., None] * 10
    return Image.fromarray(np.clip(arr + floor, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def speedlines(img, t, color=(255, 255, 255), n=14, alpha=60):
    d = ImageDraw.Draw(img)
    for i in range(n):
        y = (i * 137 + t * 2600) % (H + 400) - 200
        x = (i * 263) % W
        d.line((x, y, x - 120, y + 380), fill=color + (alpha,), width=6 if i % 3 else 3)


# ------------------------------------------------------------------ brand ---
_logo = Image.open(ROOT / "assets/logo.jpg").convert("L")
_a = np.clip((np.asarray(_logo, np.float32) - 120) * 2.2, 0, 255).astype(np.uint8)
LOGO = Image.new("RGBA", _logo.size, WHITE + (0,))
LOGO.putalpha(Image.fromarray(_a))
LOGO = LOGO.crop(LOGO.getbbox())
_sh = Image.new("RGBA", (LOGO.width + 60, LOGO.height + 60), (0, 0, 0, 0))
_sh.paste((0, 0, 0, 140), (38, 42), LOGO)
LOGO_SH = _sh.filter(ImageFilter.GaussianBlur(8))
LOGO_SH.alpha_composite(LOGO, (30, 30))
LOGO_BIG = LOGO_SH.resize((int(LOGO_SH.width * 1.8), int(LOGO_SH.height * 1.8)), Image.LANCZOS)

_story = Image.open(ROOT / "assets/loja_story.png").convert("RGB")
STORE = _story.crop((0, 210, 828, 935))
STORE_BG = STORE.resize((int(STORE.width * H / STORE.height), H), Image.BILINEAR).filter(
    ImageFilter.GaussianBlur(18)).crop((0, 0, W, H)).convert("RGBA")
STORE_BG.alpha_composite(Image.new("RGBA", (W, H), (60, 0, 4, 150)))
_card = STORE.resize((900, 788), Image.LANCZOS).convert("RGBA")
_card.putalpha(P.rr_mask(900, 788, 40))
STORE_CARD = Image.new("RGBA", (940, 840), (0, 0, 0, 0))
ImageDraw.Draw(STORE_CARD).rounded_rectangle((10, 14, 930, 822), 48, fill=WHITE)
STORE_CARD.alpha_composite(_card, (20, 24))


def wa_icon(s=150):
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, s - 1, s - 1), fill=GREEN)
    d.ellipse((s * .2, s * .18, s * .8, s * .78), outline=WHITE, width=int(s * .075))
    d.polygon([(s * .17, s * .85), (s * .25, s * .62), (s * .4, s * .74)], fill=WHITE)
    d.rounded_rectangle((s * .38, s * .36, s * .5, s * .48), 6, fill=WHITE)
    d.rounded_rectangle((s * .5, s * .5, s * .62, s * .62), 6, fill=WHITE)
    return img


WA = wa_icon()
TICK_TXT = "  JK SHOPPING • 3º PISO • TAGUATINGA-DF • WHATSAPP (61) 98345-7770 •"
_tf = font(40)
_tw = int(ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(TICK_TXT, font=_tf))
TICKER = Image.new("RGBA", (_tw * 3, 84), YEL + (255,))
for i in range(3):
    ImageDraw.Draw(TICKER).text((i * _tw, 42), TICK_TXT, font=_tf, fill=RED2, anchor="lm")


def ticker(f, t):
    off = int(t * 260) % _tw
    f.alpha_composite(TICKER.crop((off, 0, off + W, 84)), (0, 1560))
    ImageDraw.Draw(f).rectangle((0, 1552, W, 1560), fill=RED2)
    ImageDraw.Draw(f).rectangle((0, 1644, W, 1652), fill=RED2)


def bug(f):
    paste(f, LOGO, W / 2, 300, scale=0.5)


# ------------------------------------------------------------- produtos -----
def product_card(img, label):
    c = Image.new("RGBA", (470, 470), (0, 0, 0, 0))  # card 440px
    sh = Image.new("RGBA", c.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((18, 24, 452, 456), 36, fill=(0, 0, 0, 120))
    c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    ImageDraw.Draw(c).rounded_rectangle((10, 10, 450, 450), 36, fill=WHITE)
    s = min(360 / img.width, 300 / img.height)
    im = img.resize((int(img.width * s), int(img.height * s)), Image.LANCZOS)
    c.alpha_composite(im, (230 - im.width // 2, 190 - im.height // 2))
    lab = txt(label, 44 if len(label) < 12 else 34, RED2, shadow=False)
    c.alpha_composite(lab, (230 - lab.width // 2, 395 - lab.height // 2))
    return c


@lru_cache(None)
def cards():
    return {k: v.resize((400, 400), Image.LANCZOS) for k, v in _cards().items()}


def _cards():
    return {
        "airfryer": product_card(P.airfryer(), "AIR FRYER"),
        "panelas": product_card(P.panelas(), "PANELAS"),
        "eletro": product_card(P.liquidificador(), "ELETROPORTÁTEIS"),
        "moveis": product_card(P.cadeira(), "MÓVEIS"),
    }


# --------------------------------------------------------------- cenas -----
def sc_atencao(t):
    f = rays(t, RED, RED2, speed=1.2)
    speedlines(f, t)
    slam(f, txt("ATENÇÃO,", 170, YEL, 10, DEEP), W / 2, 760, t, M["atencao"], rot=4)
    slam(f, txt("BRASÍLIA!", 196, WHITE, 10, DEEP), W / 2, 960, t, M["brasilia"], rot=-3)
    return f


def sc_cozinha(t):
    f = studio().copy()
    speedlines(f, t, alpha=25)
    lt = t - M["sua"]
    art = P.cooktop_edge(P.gas(t, M["sua"] + 0.25))
    slide(f, P.with_floor(art), W / 2, 1220, t, M["sua"], dy=500)
    slam(f, txt("SUA", 110, WHITE, 6, DEEP), 235, 520, t, M["sua"])
    slam(f, txt("COZINHA", 110, WHITE, 6, DEEP), 665, 520, t, M["cozinha"])
    slam(f, txt("NOVA", 230, YEL, 10, DEEP), W / 2, 700, t, M["nova"], rot=-3, big=2.0)
    slam(f, tag("TÁ AQUI!", 90, RED, WHITE), W / 2, 880, t, M["ta"], rot=2)
    return f


def sc_logo(t):
    f = rays(t, RED, RED2, speed=0.8)
    lt = t - M["logo"]
    slam(f, LOGO_BIG, W / 2, 860, t, M["logo"], big=2.0, dur=0.25)
    slide(f, tag("ELETROS · MÓVEIS · UTENSÍLIOS", 42, WHITE, RED2), W / 2, 1110, t, M["logo"] + 0.35, dy=60)
    return f


def sc_produto(t, at, at2, l1, l2, art, from_left):
    f = studio().copy()
    speedlines(f, t, alpha=22)
    bug(f)
    dx = -900 if from_left else 900
    slide(f, art, W / 2, 1120, t, at, dx=dx, dur=0.22)
    slam(f, txt("É", 100, WHITE, 6, DEEP), W / 2, 450, t, at)
    slam(f, txt(l1, 150 if len(l1) < 8 else 130, WHITE, 8, DEEP), W / 2, 580, t, at + 0.08)
    if l2:
        slam(f, tag(l2, 92), W / 2, 760, t, at2, rot=-2)
    return f


def sc_mais(t):
    f = rays(t, YEL, (255, 190, 0), speed=0.6)
    slam(f, txt("E NÃO PARA", 128, RED2, 10, WHITE), W / 2, 450, t, M["mais"], rot=-3)
    slam(f, txt("POR AÍ!", 160, RED2, 10, WHITE), W / 2, 610, t, M["mais"] + 0.4, rot=-3)
    c = cards()
    pop(f, c["airfryer"], 300, 915, t, M["airfryer"], rot=-3)
    pop(f, c["panelas"], 780, 915, t, M["panelas"], rot=3)
    pop(f, c["eletro"], 300, 1335, t, M["eletro"], rot=2)
    pop(f, c["moveis"], 780, 1335, t, M["moveis"], rot=-2)
    return f


def sc_loja(t):
    f = STORE_BG.copy()
    lt = t - M["corre"]
    z = 1.0 + 0.03 * lt
    slide(f, STORE_CARD.resize((int(940 * 0.82 * z), int(840 * 0.82 * z)), Image.BILINEAR), W / 2, 730, t,
          M["corre"], dy=-300, dur=0.25)
    slam(f, txt("CORRE PRO", 92, WHITE, 6, DEEP), W / 2, 380, t, M["corre"], rot=-2)
    slam(f, txt("JK SHOPPING", 140, YEL, 9, DEEP), W / 2, 1170, t, M["jk"], rot=-2, big=2.0)
    slam(f, tag("3º PISO", 96, RED, WHITE), W / 2, 1320, t, M["piso"], rot=3)
    slam(f, tag("TAGUATINGA-DF", 60, WHITE, RED2), W / 2, 1462, t, M["tagua"], rot=-2)
    return f


def sc_whats(t):
    f = rays(t, (20, 160, 80), (14, 130, 64), speed=0.4)
    speedlines(f, t, alpha=25)
    slam(f, txt("OU CHAMA NO", 96, WHITE, 6, (0, 60, 30)), W / 2, 440, t, M["chama"])
    p = prog(t, M["whats"], 0.25)
    if p > 0:
        row = Image.new("RGBA", (1000, 200), (0, 0, 0, 0))
        row.alpha_composite(WA, (0, 25))
        tw = txt("WHATSAPP", 112, WHITE, 8, (0, 60, 30))
        row.alpha_composite(tw, (160, 100 - tw.height // 2))
        paste(f, row, W / 2 + 10, 620, alpha=clamp(p * 3), scale=1.6 - 0.6 * ease_out(p))
    # cartão do número: monta junto com a fala
    if t >= M["n61"]:
        num = "(61) " + "".join(d for at, d in DIGITS if t >= at)
        card = Image.new("RGBA", (1000, 300), (0, 0, 0, 0))
        sh = Image.new("RGBA", card.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((20, 34, 980, 290), 50, fill=(0, 0, 0, 130))
        card.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
        ImageDraw.Draw(card).rounded_rectangle((10, 10, 990, 270), 50, fill=WHITE)
        n = txt(num, 104, (12, 120, 56), shadow=False)
        card.alpha_composite(n, (500 - n.width // 2, 140 - n.height // 2))
        last = max([M["n61"]] + [at for at, _ in DIGITS if t >= at])
        bump = 1 + 0.06 * (1 - prog(t, last, 0.15))
        pp = prog(t, M["n61"], 0.25)
        paste(f, card, W / 2, 960, alpha=clamp(pp * 3), scale=bump * (0.6 + 0.4 * ease_back(pp)))
    if t >= DIGITS[-1][0] + 0.2:
        pop(f, tag("TOQUE E CHAME AGORA!", 56, YEL, RED2), W / 2, 1200, t, DIGITS[-1][0] + 0.2)
    return f


def sc_final(t):
    f = rays(t, RED, RED2, speed=0.5)
    lt = t - M["end"]
    slam(f, LOGO_BIG, W / 2, 620, t, M["end"], big=2.0, dur=0.25)
    slide(f, tag("ELETROS · MÓVEIS · UTENSÍLIOS", 44, WHITE, RED2), W / 2, 830, t, M["slogan"], dy=60)
    slide(f, tag("JK SHOPPING · 3º PISO · TAGUATINGA", 46, DEEP, WHITE, r=24), W / 2, 980, t, M["info"], dy=60)
    row = Image.new("RGBA", (880, 120), (0, 0, 0, 0))
    row.alpha_composite(WA.resize((100, 100)), (0, 10))
    nn = txt(WHATSAPP, 76, WHITE, 5, DEEP)
    row.alpha_composite(nn, (120, 60 - nn.height // 2))
    slide(f, row, W / 2 + 10, 1120, t, M["info"] + 0.25, dy=60)
    slide(f, txt("SEG A SÁB 10H–22H  •  DOM 14H–20H", 40, WHITE, w="Bold"), W / 2, 1240, t, M["info"] + 0.5, dy=40)
    pulse = 1 + 0.05 * math.sin(max(0, t - M["info"] - 0.8) * 7)
    p = prog(t, M["info"] + 0.8, 0.3)
    if p > 0:
        paste(f, tag("VISITE A LOJA HOJE!", 70, YEL, RED2), W / 2, 1400, alpha=clamp(p * 3),
              scale=ease_back(p) * pulse, rot=-2)
    return f


def frame(t):
    if t < M["sua"]:
        f = sc_atencao(t)
    elif t < M["logo"]:
        f = sc_cozinha(t)
    elif t < M["gas"]:
        f = sc_logo(t)
    elif t < M["ind"]:
        f = sc_produto(t, M["gas"], M["gas2"], "COOKTOP", "A GÁS",
                       P.with_floor(P.cooktop_edge(P.gas(t, M["gas"] + 0.1))), True)
    elif t < M["forno"]:
        f = sc_produto(t, M["ind"], M["ind2"], "COOKTOP", "DE INDUÇÃO",
                       P.with_floor(P.cooktop_edge(P.induction(t, M["ind"] + 0.1))), False)
    elif t < M["coifa"]:
        f = sc_produto(t, M["forno"], M["forno2"], "FORNO", "DE EMBUTIR",
                       P.with_floor(P.oven(t, M["forno"] + 0.1)).resize((700, 836), Image.BILINEAR), True)
    elif t < M["mais"]:
        f = sc_produto(t, M["coifa"], M["coifa"] + 0.25, "COIFA", "SEM CHEIRO NA CASA",
                       P.hood(t, M["coifa"] + 0.1), False)
    elif t < M["corre"]:
        f = sc_mais(t)
    elif t < M["chama"]:
        f = sc_loja(t)
    elif t < M["end"]:
        f = sc_whats(t)
    else:
        f = sc_final(t)
    if t >= M["logo"]:
        ticker(f, t)
    # tremida
    last_hit = max([h for h in HITS if h <= t], default=-9)
    k = 1 - prog(t, last_hit, 0.16)
    if k > 0:
        amp = 18 * k
        dx, dy = int(amp * math.sin(t * 190)), int(amp * math.cos(t * 160))
        f = f.resize((W + 40, H + 70), Image.BILINEAR).crop((20 + dx, 35 + dy, 20 + dx + W, 35 + dy + H))
    # flash branco nos cortes
    last_cut = max([M[c] for c in CUTS if M[c] <= t], default=-9)
    fl = 1 - prog(t, last_cut, 0.12)
    if fl > 0:
        f = Image.blend(f.convert("RGB"), Image.new("RGB", (W, H), WHITE), 0.75 * fl)
    return f.convert("RGB")


# ------------------------------------------------------------------ áudio ---
def trilha(path):
    """Beat de varejão 128 BPM + whoosh/impacto em cada batida do texto."""
    sr, bpm = 44100, 128
    n = int(sr * DURATION)
    out = np.zeros(n)
    rng = np.random.default_rng(3)
    beat = 60 / bpm

    def add(s, sig):
        s = int(s * sr)
        if s < n:
            e = min(n, s + len(sig))
            out[s:e] += sig[:e - s]

    k = np.arange(int(0.3 * sr)) / sr
    kick = 0.9 * np.sin(2 * np.pi * (45 + 120 * np.exp(-k * 35)) * k) * np.exp(-k * 9)
    c = np.arange(int(0.18 * sr)) / sr
    clap = 0.35 * rng.standard_normal(len(c)) * np.exp(-c * 28)
    hh = np.arange(int(0.04 * sr)) / sr
    hat = 0.12 * rng.standard_normal(len(hh)) * np.exp(-hh * 120)
    roots = [55.0, 55.0, 43.65, 49.0]  # Lá, Lá, Fá, Sol
    for b in range(int(DURATION / beat) + 1):
        tb = b * beat
        add(tb, kick)
        add(tb + beat / 2, hat)
        if b % 2 == 1:
            add(tb, clap)
        r = roots[(b // 4) % 4]
        bb = np.arange(int(beat / 2 * sr)) / sr
        bass = 0.32 * np.sign(np.sin(2 * np.pi * r * 2 * bb)) * np.exp(-bb * 6)
        add(tb + beat / 2, bass)
        if b % 4 in (0, 3):
            st = np.arange(int(0.16 * sr)) / sr
            stab = sum(np.sin(2 * np.pi * r * m * st) for m in (4, 5, 6)) * 0.07 * np.exp(-st * 14)
            add(tb + (beat / 2 if b % 4 == 3 else 0), stab)
    # SFX
    w_ = np.arange(int(0.22 * sr)) / sr
    whoosh = rng.standard_normal(len(w_)) * (w_ / w_[-1]) ** 2 * 0.25
    whoosh = np.convolve(whoosh, np.ones(20) / 20, mode="same")
    i_ = np.arange(int(0.5 * sr)) / sr
    boom = 0.8 * np.sin(2 * np.pi * (38 + 60 * np.exp(-i_ * 20)) * i_) * np.exp(-i_ * 6)
    for h in HITS:
        is_cut = any(abs(h - M[c]) < 1e-6 for c in CUTS)
        if is_cut:
            add(h - 0.22, whoosh)
            add(h, boom)
        else:
            add(h, boom * 0.35)
    tt = np.arange(n) / sr
    out *= np.minimum(1, (DURATION - tt) / 1.2)
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
    music = ROOT / "audio/trilha_anuncio.wav"
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
