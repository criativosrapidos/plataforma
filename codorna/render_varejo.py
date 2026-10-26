#!/usr/bin/env python3
"""Vídeo VAREJO 30 s - Codorna do Alecrim para o consumidor final (mesma identidade do vídeo de atacado).

Uso:  python3 render_varejo.py              -> saida/codorna_alecrim_varejo_30s.mp4
      python3 render_varejo.py preview 1 5  -> quadros soltos em saida/preview/
"""
import json
import math
import sys
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw

import marca2 as M
import render_atacado as A
import render_codorna as R
from marca2 import AMBER, CHAR, CREAM, font
from render_atacado import (W, H, base_bg, bandeja_contada, bokeh, callout, eio, eo, fade, finish, label, prog, rise,
                            wa_button)

ROOT = Path(__file__).resolve().parent
DURATION, DELAY = 30.0, 0.50
WORDS = [w for w in json.loads((ROOT / "audio/words_varejo.json").read_text())["words"] if w["type"] == "word"]
WT = [w["start"] + DELAY for w in WORDS]
LW = 9  # espessura do traço dos ícones


def at(word, nth=0):
    hits = [i for i, w in enumerate(WORDS) if w["text"].strip(".,!?:").lower() == word]
    return WT[hits[nth]]


# ------------------------------------------------------------ ícones em traço ---
@lru_cache(None)
def icone(nome, s=260):
    k = 3
    S = s * k
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c, w = AMBER + (255,), LW * k
    u = S / 100
    if nome == "alho":
        pts = M.bezier((50 * u, 8 * u), (40 * u, 30 * u), (8 * u, 40 * u), (12 * u, 66 * u), 30) + \
            M.bezier((12 * u, 66 * u), (16 * u, 92 * u), (84 * u, 92 * u), (88 * u, 66 * u), 30) + \
            M.bezier((88 * u, 66 * u), (92 * u, 40 * u), (60 * u, 30 * u), (50 * u, 8 * u), 30)
        d.line(pts + [pts[0]], fill=c, width=w, joint="curve")
        for x0, x1 in ((50, 50), (34, 30), (66, 70)):
            d.line(M.bezier((50 * u, 22 * u), (x0 * u, 45 * u), (x1 * u, 70 * u), (x1 * u, 86 * u), 20), fill=c,
                   width=int(w * .6), joint="curve")
        for i in range(5):
            x = (40 + i * 5) * u
            d.line((x, 88 * u, x + (i - 2) * 2 * u, 96 * u), fill=c, width=int(w * .5))
    elif nome == "limao":
        d.ellipse((8 * u, 8 * u, 92 * u, 92 * u), outline=c, width=w)
        d.ellipse((18 * u, 18 * u, 82 * u, 82 * u), outline=c, width=int(w * .5))
        for i in range(8):
            a = i * math.pi / 4
            d.line((50 * u + math.cos(a) * 6 * u, 50 * u + math.sin(a) * 6 * u, 50 * u + math.cos(a) * 30 * u,
                    50 * u + math.sin(a) * 30 * u), fill=c, width=int(w * .5))
    elif nome == "alecrim":
        d.line((50 * u, 96 * u, 50 * u, 6 * u), fill=c, width=int(w * .7))
        for i in range(13):
            y = (12 + i * 6.5) * u
            ln = (16 - abs(i - 6) * 1.2) * u
            for sg in (-1, 1):
                d.line((50 * u, y, 50 * u + sg * ln, y - 7 * u), fill=c, width=int(w * .6))
    elif nome == "airfryer":
        d.rounded_rectangle((16 * u, 6 * u, 84 * u, 94 * u), 18 * u, outline=c, width=w)
        d.ellipse((42 * u, 14 * u, 58 * u, 30 * u), outline=c, width=int(w * .6))
        d.rounded_rectangle((24 * u, 42 * u, 76 * u, 84 * u), 8 * u, outline=c, width=int(w * .7))
        d.rounded_rectangle((38 * u, 58 * u, 62 * u, 66 * u), 3 * u, fill=c)
    elif nome == "forno":
        d.rounded_rectangle((6 * u, 10 * u, 94 * u, 90 * u), 8 * u, outline=c, width=w)
        d.line((6 * u, 28 * u, 94 * u, 28 * u), fill=c, width=int(w * .6))
        for x in (20, 34, 48):
            d.ellipse(((x - 4) * u, 15 * u, (x + 4) * u, 23 * u), fill=c)
        d.rounded_rectangle((18 * u, 40 * u, 82 * u, 78 * u), 5 * u, outline=c, width=int(w * .6))
        d.line((26 * u, 34 * u, 74 * u, 34 * u), fill=c, width=int(w * .6))
    return img.resize((s, s), Image.LANCZOS)


# ---------------------------------------------------------------- cenas ---
def sc_abre(t):
    img = base_bg(.5, .5, 1.3).copy()
    bokeh(img, t, 11, 20)
    fade(img, label("já pensou numa", "play", 90, AMBER), W / 2, 520, t, WT[0], .45)
    rise(img, label("CODORNA", "anton", 250, CREAM, .02), W / 2, 760, t, at("codorna") - .1)
    rise(img, label("CROCANTE", "anton", 170, CREAM), W / 2, 1010, t, at("crocante") - .05)
    rise(img, label("E DOURADINHA", "anton", 130, AMBER), W / 2, 1190, t, at("douradinha") - .1)
    fade(img, label("no almoço de domingo?", "play", 76, CREAM), W / 2, 1390, t, at("almoço") - .1, .45)
    return img


def sc_chega(t):
    img = base_bg(.5, .5, 1.1).copy()
    bokeh(img, t, 12)
    t_logo = at("codorna", 1) - .25
    t_band = at("limpinha") - .2
    pl = eio(prog(t, t_band, .6))
    fade(img, M.emblema(int(520 - 290 * pl)), W / 2, 720 - 530 * pl, t, t_logo, .5, 0, .85)
    if t < t_band + .2:
        fade(img, label("chega pra você", "play", 70, AMBER), W / 2, 1120, t, at("chega") - .05)
    pb = eo(prog(t, t_band, .7))
    if pb > 0:
        b = M.bandeja(600).rotate(-4 + 1.5 * math.sin((t - t_band) * .8), Image.BICUBIC, expand=True)
        fade(img, b, W / 2, 1060 + 900 * (1 - pb), t, t_band, .01)
    fade(img, callout("LIMPINHA"), 220, 640, t, at("limpinha"), .35, 20)
    fade(img, callout("PRONTA PRA TEMPERAR"), W / 2, 1810, t, at("pronta") - .05, .35, 20)
    return img


def sc_tempero(t):
    img = base_bg(.5, .45).copy()
    bokeh(img, t, 13)
    rise(img, label("É SÓ", "anton", 150, CREAM), W / 2, 330, t, at("é") - .05)
    itens = [("alho", "UM ALHO", at("alho") - .1), ("limao", "UM LIMÃO", at("limão") - .1),
             ("alecrim", "ALECRIM", at("raminho") - .1)]
    for i, (ic, txt, t0) in enumerate(itens):
        y = 650 + i * 420
        fade(img, icone(ic, 250), 300, y, t, t0, .4, 30, .7)
        rise(img, label(txt, "anton", 110, CREAM if i < 2 else AMBER), 470, y, t, t0 + .05, anchor="l")
        if i < 2:
            fade(img, label("+", "anton", 90, AMBER), 300, y + 210, t, t0 + .3, .3)
    return img


def sc_preparo(t):
    img = base_bg(.5, .5, 1.2).copy()
    bokeh(img, t, 14)
    t0 = at("pronto")
    rise(img, label("E PRONTO:", "anton", 150, CREAM), W / 2, 420, t, t0 - .05)
    fade(img, icone("airfryer", 330), W / 2, 780, t, at("airfryer") - .1, .45, 30, .7)
    rise(img, label("AIRFRYER", "anton", 130, AMBER), W / 2, 1040, t, at("airfryer"))
    fade(img, label("ou", "play", 80, CREAM), W / 2, 1180, t, at("ou") - .05, .3)
    fade(img, icone("forno", 300), W / 2, 1420, t, at("forno") - .1, .45, 30, .7)
    rise(img, label("FORNO", "anton", 130, AMBER), W / 2, 1680, t, at("forno"))
    return img


def sc_preco(t):
    img = base_bg(.5, .5, 1.1).copy()
    bokeh(img, t, 15)
    t_band = at("bandeja") - .15
    pb = eo(prog(t, t_band, .6))
    if pb > 0:
        b = bandeja_contada(560, 8, t, at("oito") - .15)
        b = b.rotate(-4 + 1.5 * math.sin((t - t_band) * .8), Image.BICUBIC, expand=True)
        fade(img, b, W / 2 + 170, 820 + 700 * (1 - pb), t, t_band, .01)
    t8 = at("oito") - .15
    rise(img, label("8", "anton", 280, AMBER), 200, 600, t, t8, .5)
    fade(img, label("UNIDADES", "osw6", 52, CREAM, .1), 200, 760, t, t8 + .2, .4)
    ts = at("saindo") - .1
    p = eo(prog(t, ts, .45))
    if p > 0:
        d = ImageDraw.Draw(img)
        y0 = 1470 + 60 * (1 - p)
        d.rounded_rectangle((90, y0, W - 90, y0 + 300), 28, fill=(16, 14, 12, int(235 * p)),
                            outline=AMBER + (int(255 * p),), width=4)
    fade(img, label("saindo a", "play", 60, CREAM), W / 2, 1530, t, ts, .4)
    rise(img, label("R$ 11,25", "anton", 170, AMBER), W / 2 - 90, 1660, t, at("onze") - .05)
    fade(img, label("cada", "play", 80, CREAM), W / 2 + 320, 1680, t, at("cada") - .05, .35)
    return img


def sc_final(t):
    img = base_bg(.5, .35).copy()
    bokeh(img, t, 16)
    t0 = at("peça")
    fade(img, M.emblema(440), W / 2, 420, t, t0 - .25, .5, 0, .85)
    rise(img, label("PEÇA JÁ", "anton", 190, CREAM), W / 2, 820, t, t0)
    pb = eo(prog(t, at("whatsapp") - .1, .45))
    if pb > 0:
        pulse = 1 + .02 * math.sin(max(0, t - at("whatsapp") - .5) * 5)
        b = wa_button()
        b = b.resize((int(b.width * pulse), int(b.height * pulse)), Image.BICUBIC)
        fade(img, b, W / 2, 1080, t, at("whatsapp") - .1, .45, 40)
    partes = [("(69)", at("sessenta") - .05), ("99352", at("nove", 1) - .05), ("-8816", at("oito", 1) - .05)]
    x = W / 2 - 420
    for txt, tp in partes:
        lb = label(txt, "anton", 130, AMBER if txt != "(69)" else CREAM)
        rise(img, lb, x, 1340, t, tp, .35, anchor="l")
        x += lb.width + 6
    fade(img, label("Bandeja com 8 unidades · R$ 11,25 cada", "play", 50, CREAM), W / 2, 1580, t, at("seis") + .3, .5)
    return img


SCENES = [(0.0, sc_abre), (at("a", 0) - .15, sc_chega), (at("é") - .2, sc_tempero), (at("pronto") - .2, sc_preparo),
          (at("bandeja") - .25, sc_preco), (at("peça") - .25, sc_final)]
XF = .3


def frame(t):
    idx = max(i for i, (s, _) in enumerate(SCENES) if s <= t)
    img = SCENES[idx][1](t)
    s0 = SCENES[idx][0]
    if idx > 0 and t - s0 < XF:
        p = eio((t - s0) / XF)
        prev = SCENES[idx - 1][1](t)
        z = 1 + .04 * (1 - p)
        cw, ch = W / z, H / z
        img = img.crop((int((W - cw) / 2), int((H - ch) / 2), int((W + cw) / 2), int((H + ch) / 2))).resize((W, H))
        img = Image.blend(prev, img, p)
    if t < .3:
        img = Image.blend(Image.new("RGBA", (W, H), CHAR + (255,)), img, t / .3)
    out = finish(img, t)
    if t > DURATION - .5:
        out = Image.blend(out, Image.new("RGB", (W, H)), (t - (DURATION - .5)) / .5)
    return out


if __name__ == "__main__":
    R.DURATION, R.DELAY, R.SCENES, R.frame = DURATION, DELAY, SCENES, frame
    R.VOICE = ROOT / "audio/locucao_varejo.mp3"
    R.OUT = ROOT / "saida/codorna_alecrim_varejo_30s.mp4"
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        d = ROOT / "saida/preview"
        d.mkdir(parents=True, exist_ok=True)
        for s in map(float, sys.argv[2:]):
            frame(s).save(d / f"vr_{s:05.2f}.jpg", quality=88)
    else:
        R.main()
