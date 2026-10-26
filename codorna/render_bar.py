#!/usr/bin/env python3
"""Vídeo 9:16 em motion para BARES e RESTAURANTES - Codorna do Alecrim (venda no atacado, bandeja com 8).

Uso:  python3 render_bar.py              -> saida/codorna_alecrim_bares.mp4
      python3 render_bar.py preview 1 5  -> quadros soltos em saida/preview/
"""
import json
import math
import sys
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw

import cod_art as A
import embalagem as E
import render_codorna as R
from cod_art import BG, CREAM, GOLD, GREEN, INK, ORANGE, RED, WHITE, font
from render_codorna import (W, H, back, chip, ease, emoji, fit, pop, prog, put, radial, rays, slam, slide, sparks,
                            steam, txt)

ROOT = Path(__file__).resolve().parent
DURATION = 30.0
DELAY = 0.30
NOME = "ALECRIM"
WORDS = [w for w in json.loads((ROOT / "audio/words_bar.json").read_text())["words"] if w["type"] == "word"]
WT = [w["start"] + DELAY for w in WORDS]


def at(word, nth=0):
    hits = [i for i, w in enumerate(WORDS) if w["text"].strip(".,!?:").lower() == word]
    return WT[hits[nth]]


@lru_cache(None)
def porcao(size=860):
    """Porção de codorna frita na tábua, com limão e ervas."""
    s = size
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    sh = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((s * .04, s * .16, s * .96, s * .96), fill=(0, 0, 0, 120))
    from PIL import ImageFilter
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(s * .03)))
    d = ImageDraw.Draw(img)
    d.ellipse((s * .02, s * .1, s * .98, s * .9), fill=(150, 96, 52, 255))
    d.ellipse((s * .05, s * .13, s * .95, s * .87), fill=(186, 128, 74, 255))
    d.polygon([(s * .2, s * .2), (s * .82, s * .16), (s * .86, s * .78), (s * .16, s * .82)], fill=(244, 236, 214, 255))
    for x, y, sz, rot in ((.08, .14, .52, -25), (.42, .12, .52, 20), (.24, .40, .56, 5)):
        q = A.roasted(int(s * sz), True).rotate(rot, Image.BICUBIC, expand=True)
        img.alpha_composite(q, (int(s * x), int(s * y)))
    for ch, x, y, sz, rot in (("🍋", .70, .60, .2, -10), ("🍋", .04, .62, .17, 20), ("🌿", .72, .12, .2, -30)):
        e = emoji(ch, int(s * sz)).rotate(rot, Image.BICUBIC, expand=True)
        img.alpha_composite(e, (int(s * x), int(s * y)))
    return img


def sc_abertura(t):
    img = rays((255, 120, 30), (255, 96, 14), t)
    sparks(img, t, 1)
    slam(img, fit("VOCÊ QUE TEM", 120), W / 2, 330, t, WT[0])
    pop(img, chip("BAR", 130, RED, rot=-5), W / 2 - 150, 620, t, at("bar") - .05)
    pop(img, emoji("🍺", 200), W / 2 + 200, 620, t, at("bar") + .05, rot=10 * math.sin(t * 5))
    pop(img, chip("RESTAURANTE", 110, BG, GOLD, rot=3), W / 2, 880, t, at("restaurante") - .05)
    slam(img, fit("OU TRABALHA COM", 90), W / 2, 1120, t, at("trabalha") - .1)
    pop(img, chip("PORÇÃO", 140, GREEN, rot=-3), W / 2, 1360, t, at("porção") - .1)
    pop(img, emoji("🍽️", 190), W / 2 + 330, 1500, t, at("porção"), rot=-12)
    return img


def sc_petisco(t):
    img = radial((110, 34, 10), BG)
    sparks(img, t, 2)
    t0 = at("codorna")
    p = ease(prog(t, t0, .5))
    put(img, porcao(880), W / 2, 1180 + 500 * (1 - p), rot=-15 * (1 - p) + 3 * math.sin(t * 2))
    steam(img, W / 2, 900, t)
    slam(img, fit("CODORNA FRITA", 150, color=GOLD, stroke=14), W / 2, 260, t, t0 - .05, rot=-3)
    slam(img, fit("É O PETISCO", 110), W / 2, 450, t, at("petisco") - .2)
    pop(img, chip("QUE VENDE!", 120, RED, rot=4), W / 2, 620, t, at("vende") - .05)
    return img


def sc_crocante(t):
    img = rays((255, 206, 60), (255, 188, 40), t, 18, .3)
    put(img, porcao(700), W / 2, 1150, scale=1 + .02 * (t - at("crocante")), rot=(t - at("crocante")) * 4)
    pop(img, chip("CROCANTE", 120, ORANGE, rot=-5), W / 2 - 60, 300, t, at("crocante") - .1)
    pop(img, chip("SEQUINHA", 120, RED, rot=4), W / 2 + 80, 500, t, at("sequinha") - .1)
    pop(img, emoji("🍺", 300), 860, 1580, t, at("cerveja") - .15, rot=8 * math.sin(t * 4))
    pop(img, chip("+ CERVEJA GELADA", 80, BG, GOLD, rot=-2), W / 2 - 80, 1780, t, at("cerveja") - .05)
    return img


def sc_pedido(t):
    img = rays((226, 38, 32), (198, 26, 22), t, 12, -.4)
    sparks(img, t, 3, col=(255, 220, 120))
    slam(img, fit("O CLIENTE", 120), W / 2, 300, t, at("cliente") - .2)
    pop(img, chip("PEDE UMA...", 110, BG, GOLD, rot=-3), W / 2, 520, t, at("pede") - .05)
    t2 = at("pede", 1)
    slam(img, fit("PEDE OUTRA!", 170, color=GOLD, stroke=14), W / 2, 760, t, t2 - .1, rot=-4)
    n = 1 + int(max(0, t - t2) / .18) if t >= t2 else (1 if t >= at("pede") else 0)
    n = min(n, 6)
    for i in range(n):
        x = W / 2 + (i % 3 - 1) * 280
        y = 1120 + (i // 3) * 300
        pop(img, A.roasted(220, True), x, y, t, at("pede") + (0 if i == 0 else (t2 - at("pede")) + (i - 1) * .18), .3)
    pop(img, emoji("🤑", 200), 900, 1700, t, t2 + .3, rot=10 * math.sin(t * 5))
    return img


def sc_onde(t):
    img = radial((96, 32, 12), BG)
    sparks(img, t, 4)
    t0 = at("onde") - .25
    slam(img, fit("E DE ONDE VEM", 120), W / 2, 560, t, t0)
    slam(img, fit("A SUA CODORNA?", 140, color=GOLD, stroke=14), W / 2, 760, t, at("sua") - .1, rot=-2)
    pop(img, emoji("🤔", 360), W / 2, 1250, t, at("codorna", 1) - .1, rot=8 * math.sin(t * 3))
    return img


def sc_marca(t):
    img = rays((255, 120, 30), (240, 98, 16), t, 16, .25)
    sparks(img, t, 5)
    t0 = at("na")
    pop(img, A.logo(700, NOME), W / 2, 760 + 10 * math.sin(t * 2.4), t, t0, .45)
    slam(img, fit("VOCÊ COMPRA", 110), W / 2, 1300, t, at("você", 1) - .05)
    pop(img, chip("NO ATACADO", 140, BG, GOLD, rot=-3), W / 2, 1520, t, at("atacado") - .1)
    return img


def sc_bandeja(t):
    img = radial((120, 40, 14), BG)
    sparks(img, t, 6)
    t0 = at("bandeja")
    p = ease(prog(t, t0 - .1, .45))
    u = t - t0
    b = E.bandeja(560, NOME)
    put(img, b, W / 2, 1000 + 600 * (1 - p), alpha=clamp_(p * 2), rot=-4 + 2 * math.sin(u * 1.5), scale=1 + .015 * u)
    slam(img, fit("BANDEJA COM 8", 120, color=GOLD), W / 2, 200, t, t0 - .05)
    pop(img, chip("LIMPINHAS", 80, GREEN, rot=-6), 300, 1640, t, at("limpinhas") - .05)
    pop(img, emoji("✅", 120), 540, 1600, t, at("limpinhas") + .05)
    pop(img, chip("SÓ TEMPERAR E FRITAR", 72, RED, rot=2), W / 2, 1790, t, at("temperar") - .1)
    pop(img, emoji("🔥", 140), 920, 1640, t, at("fritar") - .05, rot=-10)
    return img


def clamp_(x):
    return max(0.0, min(1.0, x))


def sc_lucro(t):
    img = rays((255, 206, 60), (255, 184, 30), t, 20, -.6)
    sparks(img, t, 7, col=WHITE)
    slam(img, fit("PREÇO BOM", 170, color=WHITE, stroke=14), W / 2, 420, t, at("preço") - .1, rot=-3)
    slam(img, fit("PRA VOCÊ LUCRAR", 110), W / 2, 680, t, at("pra") - .1)
    pop(img, chip("EM CADA PORÇÃO", 110, RED, rot=3), W / 2, 900, t, at("cada") - .1)
    pop(img, emoji("💰", 250), 260, 1260, t, at("lucrar"), rot=-10)
    pop(img, emoji("📈", 250), 820, 1260, t, at("lucrar") + .1, rot=8)
    pa = ease(prog(t, at("porção", 1) - .1, .3))
    if pa > 0:
        put(img, chip("R$ 11,25 A UNIDADE", 74, BG, GOLD), W / 2, 1600, alpha=pa)
    return img


def sc_final(t):
    img = rays((255, 120, 30), (240, 98, 16), t, 16, .2)
    sparks(img, t, 8)
    t0 = at("chama")
    pop(img, A.logo(600, NOME), W / 2, 520 + 10 * math.sin(t * 2.4), t, t0 - .15, .45)
    pb = prog(t, t0 - .05, .35)
    if pb > 0:
        pulse = 1 + .035 * math.sin(max(0, t - t0) * 7)
        put(img, R.wa_button(), W / 2, 1030, alpha=clamp_(pb * 3), scale=back(pb) * pulse)
    slam(img, fit("FAÇA SEU PEDIDO!", 130, color=GOLD, stroke=12), W / 2, 1300, t, at("faz") - .1, rot=-2)
    pp = ease(prog(t, at("pedido") + .4, .4))
    if pp > 0:
        put(img, chip("BARES · RESTAURANTES · ATACADO", 54, BG, CREAM), W / 2, 1520, alpha=pp)
        put(img, emoji("🍺", 150), 250, 1720, alpha=pp, rot=10 * math.sin(t * 4))
        put(img, emoji("😋", 150), 830, 1720, alpha=pp, rot=-10 * math.sin(t * 4))
    return img


SCENES = [(0.0, sc_abertura), (at("codorna") - .1, sc_petisco), (at("crocante") - .12, sc_crocante),
          (at("cliente") - .3, sc_pedido), (at("onde") - .35, sc_onde), (at("na") - .1, sc_marca),
          (at("bandeja") - .12, sc_bandeja), (at("preço") - .12, sc_lucro), (at("chama") - .12, sc_final)]


def frame(t):
    idx = max(i for i, (s, _) in enumerate(SCENES) if s <= t)
    s0 = SCENES[idx][0]
    img = SCENES[idx][1](t)
    u = t - s0
    if idx > 0 and u < .16:
        z = 1 + .12 * (1 - u / .16)
        cw, ch = W / z, H / z
        img = img.crop((int((W - cw) / 2), int((H - ch) / 2), int((W + cw) / 2), int((H + ch) / 2))).resize((W, H))
        if u < .05:
            img = Image.blend(img.convert("RGB"), Image.new("RGB", (W, H), (255, 255, 255)), .55 * (1 - u / .05))
    rgb = img.convert("RGB")
    if t > DURATION - .4:
        rgb = Image.blend(rgb, Image.new("RGB", (W, H)), (t - (DURATION - .4)) / .4)
    return rgb


if __name__ == "__main__":
    # reaproveita o pipeline do vídeo 1 (trilha, mixagem e encode) com esta locução e estas cenas
    R.DURATION, R.DELAY, R.SCENES, R.frame = DURATION, DELAY, SCENES, frame
    R.VOICE = ROOT / "audio/locucao_bar.mp3"
    R.OUT = ROOT / "saida/codorna_alecrim_bares.mp4"
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        d = ROOT / "saida/preview"
        d.mkdir(parents=True, exist_ok=True)
        for s in map(float, sys.argv[2:]):
            frame(s).save(d / f"b_{s:05.2f}.jpg", quality=88)
    else:
        R.main()
