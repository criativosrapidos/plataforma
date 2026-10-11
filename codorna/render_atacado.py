#!/usr/bin/env python3
"""Vídeo ATACADO 30 s - Codorna do Alecrim para donos de bar. Visual adulto: grafite + âmbar, tipografia condensada,
movimentos suaves (sem tremida), bandeja realista e comandas de pedido.

Uso:  python3 render_atacado.py              -> saida/codorna_alecrim_atacado_30s.mp4
      python3 render_atacado.py preview 1 5  -> quadros soltos em saida/preview/
"""
import json
import math
import sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import marca2 as M
import render_codorna as R
from marca2 import AMBER, AMBER_D, CHAR, CHAR2, CREAM, WHITE, font

ROOT = Path(__file__).resolve().parent
W, H, FPS = 1080, 1920, 30
DURATION, DELAY = 30.0, 0.30
WHATS = "(69) 99352-8816"
WA_GREEN = (37, 211, 102)
WORDS = [w for w in json.loads((ROOT / "audio/words_atacado.json").read_text())["words"] if w["type"] == "word"]
WT = [w["start"] + DELAY for w in WORDS]


def at(word, nth=0):
    hits = [i for i, w in enumerate(WORDS) if w["text"].strip(".,!?:").lower() == word]
    return WT[hits[nth]]


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, s, d):
    return clamp((t - s) / d)


def eo(x):  # ease out expo-ish
    return 1 - (1 - x) ** 4


def eio(x):
    return x * x * (3 - 2 * x)


# ---------------------------------------------------------------- texto ---
@lru_cache(None)
def label(text, fname, size, color=CREAM, track=0.0):
    f = font(fname, size)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    ws = [d.textlength(c, font=f) for c in text]
    tr = size * track
    tw = sum(ws) + tr * (len(text) - 1)
    bb = d.textbbox((0, 0), text, font=f)
    hgt = bb[3] - bb[1]
    img = Image.new("RGBA", (int(tw + 20), int(hgt * 1.5)), (0, 0, 0, 0))
    dd = ImageDraw.Draw(img)
    x = 10
    for c, w in zip(text, ws):
        dd.text((x, img.height / 2), c, font=f, fill=color, anchor="lm")
        x += w + tr
    return img


def rise(base, img, cx, cy, t, t0, dur=.45, dist=None, anchor="c"):
    """Texto sobe de dentro de uma 'máscara' (revelação limpa, sem tremer)."""
    p = eo(prog(t, t0, dur))
    if p <= 0:
        return
    dist = dist or img.height
    off = int(dist * (1 - p))
    crop = img.crop((0, 0, img.width, img.height - off)) if off < img.height else None
    if crop is None or crop.height <= 0:
        return
    x = cx - img.width / 2 if anchor == "c" else cx
    base.alpha_composite(crop, (int(x), int(cy - img.height / 2 + off)))


def fade(base, img, cx, cy, t, t0, dur=.4, dy=30, scale0=1.0):
    p = eo(prog(t, t0, dur))
    if p <= 0:
        return
    if scale0 != 1.0:
        s = scale0 + (1 - scale0) * p
        img = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.BICUBIC)
    if p < 1:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v: int(v * p)))
    base.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2 + dy * (1 - p))))


def underline(base, x0, x1, y, t, t0, dur=.4, col=AMBER, w=8):
    p = eo(prog(t, t0, dur))
    if p > 0:
        ImageDraw.Draw(base).rectangle((x0, y, x0 + (x1 - x0) * p, y + w), fill=col + (255,))


# ---------------------------------------------------------------- fundo ---
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)


@lru_cache(None)
def base_bg(gx=.5, gy=.42, warm=1.0):
    r = np.sqrt(((_xx - W * gx) / W) ** 2 + ((_yy - H * gy) / H * .6) ** 2)
    glow = np.clip(1 - r / .75, 0, 1) ** 2 * warm
    col = np.array(CHAR, np.float32) + glow[..., None] * np.array([70, 42, 14], np.float32)
    return Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).convert("RGBA")


_GRAIN = [Image.fromarray(np.random.default_rng(i).integers(0, 255, (H // 2, W // 2), dtype=np.uint8)).resize((W, H))
          for i in range(6)]


def bokeh(img, t, seed=1, n=14):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rng = np.random.default_rng(seed)
    for _ in range(n):
        x, y0, r, sp, ph = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(20, 70), rng.uniform(10, 30), rng.uniform(0, 6)
        y = (y0 - t * sp) % (H + 200) - 100
        a = int(26 + 18 * math.sin(t * .8 + ph))
        d.ellipse((x - r, y - r, x + r, y + r), fill=AMBER + (a,))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(10)))


def finish(img, t):
    g = _GRAIN[int(t * FPS) % 6]
    rgb = img.convert("RGB")
    return Image.blend(rgb, Image.merge("RGB", (g, g, g)), .035)


# --------------------------------------------------------------- peças ---
@lru_cache(None)
def comanda(mesa, qtd, w=520):
    h = int(w * .46)
    img = Image.new("RGBA", (w + 30, h + 40), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rectangle((15, 25, w + 15, h + 25), fill=(0, 0, 0, 150))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(img)
    pts = [(15, 15)]
    for i in range(21):  # borda serrilhada do papel
        pts.append((15 + i * w / 20, 15 + (6 if i % 2 else 0)))
    pts += [(w + 15, h + 15), (15, h + 15)]
    d.polygon(pts, fill=(250, 248, 240, 255))
    d.text((40, 60), f"MESA {mesa:02d}", font=font("osw6", int(w * .065)), fill=(110, 100, 90), anchor="lm")
    d.text((w - 10, 60), "PEDIDO", font=font("osw5", int(w * .05)), fill=(150, 140, 130), anchor="rm")
    d.line((40, 92, w - 10, 92), fill=(210, 204, 194), width=2)
    d.text((40, 150), f"{qtd}x  PORÇÃO DE CODORNA", font=font("osw7", int(w * .072)), fill=CHAR, anchor="lm")
    d.text((40, 200), "frita · com limão", font=font("m6", int(w * .042)), fill=(120, 110, 100), anchor="lm")
    return img


@lru_cache(None)
def wa_button(w=900):
    h = 170
    img = Image.new("RGBA", (w + 40, h + 50), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((20, 34, w + 20, h + 34), h // 2, fill=(0, 0, 0, 160))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((20, 20, w + 20, h + 20), h // 2, fill=WA_GREEN + (255,))
    ic = R.wa_icon(120, bg=False)
    img.alpha_composite(ic, (70, 20 + (h - 120) // 2))
    d.text((220, 20 + h / 2 - 30), "PEÇA PELO WHATSAPP", font=font("osw7", 50), fill=WHITE, anchor="lm")
    d.text((222, 20 + h / 2 + 34), WHATS, font=font("osw5", 46), fill=WHITE, anchor="lm")
    return img


@lru_cache(None)
def callout(text, w=400):
    f = font("osw6", 40)
    tw = ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f)
    img = Image.new("RGBA", (int(tw + 70), 80), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, img.width - 1, 79), 12, fill=(16, 14, 12, 230), outline=AMBER + (255,), width=3)
    d.text((35, 40), text, font=f, fill=CREAM, anchor="lm")
    return img


def timer_icon(img, cx, cy, r, p):
    d = ImageDraw.Draw(img)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=CREAM + (90,), width=6)
    d.arc((cx - r, cy - r, cx + r, cy + r), -90, -90 + 360 * p, fill=AMBER + (255,), width=10)
    d.rectangle((cx - 12, cy - r - 30, cx + 12, cy - r - 8), fill=CREAM)
    a = math.radians(-90 + 360 * p)
    d.line((cx, cy, cx + math.cos(a) * r * .7, cy + math.sin(a) * r * .7), fill=AMBER, width=8)
    d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=AMBER)


# ---------------------------------------------------------------- cenas ---
def sc_abre(t):
    img = base_bg().copy()
    bokeh(img, t, 1)
    rise(img, label("DONO", "anton", 260, CREAM, .02), W / 2, 640, t, WT[0])
    rise(img, label("DE BAR,", "anton", 260, CREAM, .02), W / 2, 900, t, at("bar") - .15)
    fade(img, label("presta atenção.", "play", 110, AMBER), W / 2, 1180, t, at("presta") - .05)
    underline(img, W / 2 - 300, W / 2 + 300, 1270, t, at("atenção"), .5)
    return img


def sc_petisco(t):
    img = base_bg(.5, .3).copy()
    bokeh(img, t, 2)
    t0 = at("codorna")
    rise(img, label("CODORNA FRITA", "anton", 170, CREAM, .02), W / 2, 330, t, t0 - .05)
    fade(img, label("é o petisco que sai", "play", 76, AMBER), W / 2, 500, t, at("aquele") - .05)
    rise(img, label("O TEMPO TODO.", "anton", 130, AMBER), W / 2, 640, t, at("tempo") - .1)
    pedidos = [(4, 1), (7, 2), (12, 1), (3, 3), (9, 2)]
    for i, (mesa, q) in enumerate(pedidos):
        ti = at("petisco") + i * .32
        p = eo(prog(t, ti, .5))
        if p <= 0:
            continue
        x = W / 2 + (-150 if i % 2 == 0 else 150)
        y = 1760 - i * 190 - 30 * (t - ti)
        c = comanda(mesa, q).rotate((-4 if i % 2 == 0 else 3), Image.BICUBIC, expand=True)
        fade(img, c, x, y + 250 * (1 - p), t, ti, .01)
    return img


def sc_crocante(t):
    img = base_bg(.5, .55, 1.2).copy()
    bokeh(img, t, 3, 22)
    rise(img, label("CROCANTE", "anton", 210, CREAM), W / 2, 420, t, at("crocante") - .05)
    fade(img, label("por fora", "play", 90, AMBER), W / 2, 590, t, at("por") - .05)
    rise(img, label("SUCULENTA", "anton", 210, CREAM), W / 2, 820, t, at("suculenta") - .05)
    fade(img, label("por dentro", "play", 90, AMBER), W / 2, 990, t, at("por", 1) - .05)
    tp = at("pronta")
    if t > tp - .2:
        p = eo(prog(t, tp - .2, .4))
        timer_icon(img, W / 2, 1330, int(110 * p) + 1, clamp((t - tp) / 1.0))
    rise(img, label("PRONTA RAPIDINHO", "anton", 110, AMBER), W / 2, 1580, t, tp)
    return img


@lru_cache(None)
def marcador(n, r=30):
    img = Image.new("RGBA", (r * 2 + 8, r * 2 + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((4, 6, r * 2 + 4, r * 2 + 6), fill=(0, 0, 0, 120))
    d.ellipse((2, 2, r * 2 + 2, r * 2 + 2), fill=AMBER + (255,), outline=CHAR + (255,), width=3)
    d.text((r + 2, r + 4), str(n), font=font("anton", int(r * 1.25)), fill=CHAR, anchor="mm")
    return img


def bandeja_contada(w, n, t, t0):
    """Bandeja com as codornas sendo numeradas de 1 até n (cada número 'acende' em sequência)."""
    b = M.bandeja(w).copy()
    for i, (x, y) in enumerate(M.pontos_codornas(w)[:n]):
        p = eo(prog(t, t0 + i * .1, .25))
        if p > 0:
            mk = marcador(i + 1)
            s = .4 + .6 * p
            mk = mk.resize((max(1, int(mk.width * s)), max(1, int(mk.height * s))), Image.BICUBIC)
            b.alpha_composite(mk, (int(x - mk.width / 2), int(y - mk.height / 2)))
    return b


def sc_produto(t):
    img = base_bg(.5, .5, 1.1).copy()
    bokeh(img, t, 4)
    t_logo, t_band = at("codorna", 1) - .25, at("bandejas") - .15
    pl = eio(prog(t, t_band, .6))
    lg = M.emblema(int(500 - 280 * pl))
    fade(img, lg, W / 2, 700 - 520 * pl, t, t_logo, .5, 0, .85)
    if t < t_band + .2:
        rise(img, label("NO ATACADO", "anton", 150, AMBER), W / 2, 1200, t, at("atacado") - .1)
        fade(img, label("você compra", "play", 70, CREAM), W / 2, 1060, t, at("você") - .05)
    pb = eo(prog(t, t_band, .7))
    if pb > 0:
        b = bandeja_contada(620, 8, t, at("oito") - .15)
        b = b.rotate(-4 + 1.5 * math.sin((t - t_band) * .8), Image.BICUBIC, expand=True)
        fade(img, b, W / 2 + 120, 1060 + 900 * (1 - pb), t, t_band, .01)
    t8 = at("oito") - .15
    rise(img, label("8", "anton", 300, AMBER), 190, 760, t, t8, .5)
    fade(img, label("UNIDADES", "osw6", 54, CREAM, .1), 190, 930, t, t8 + .2, .4)
    fade(img, callout("LIMPAS"), 190, 1180, t, at("limpas") - .05, .35, 20)
    fade(img, callout("PRONTAS PRA TEMPERAR"), W / 2, 1810, t, at("prontas") - .05, .35, 20)
    return img


def sc_lucro(t):
    img = base_bg(.5, .5).copy()
    bokeh(img, t, 5)
    rows = [("MENOS", "TRABALHO", "na cozinha", at("menos"), "-"), ("MAIS", "PORÇÃO", "na mesa", at("mais"), "+"),
            ("MAIS", "LUCRO", "no caixa", at("mais", 1), "+")]
    for i, (a, b, c, t0, sg) in enumerate(rows):
        y = 470 + i * 420
        col = AMBER if i == 2 else CREAM
        p = eo(prog(t, t0 - .1, .4))
        if p > 0:
            d = ImageDraw.Draw(img)
            r = 70
            cx = 170
            d.ellipse((cx - r, y - r, cx + r, y + r), outline=AMBER + (int(255 * p),), width=6)
            d.line((cx - 32, y, cx + 32, y), fill=AMBER + (int(255 * p),), width=10)
            if sg == "+":
                d.line((cx, y - 32, cx, y + 32), fill=AMBER + (int(255 * p),), width=10)
        rise(img, label(f"{a} {b}", "anton", 104, col), 280, y - 30, t, t0 - .05, anchor="l")
        fade(img, label(c, "play", 64, AMBER if i < 2 else CREAM), 300 + label(c, "play", 64).width / 2, y + 80, t,
             t0 + .25, .35, 15)
    pa = prog(t, at("caixa") + .1, .4)
    if pa > 0:
        fade(img, callout("R$ 11,25 POR UNIDADE"), W / 2, 1720, t, at("caixa") + .1, .4)
    return img


def sc_final(t):
    img = base_bg(.5, .35).copy()
    bokeh(img, t, 6)
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
    fade(img, label("BARES  ·  RESTAURANTES  ·  ATACADO", "osw5", 40, AMBER, .08), W / 2, 1560, t,
         at("seis") + .2, .5)
    fade(img, label("Bandeja com 8 unidades", "play", 52, CREAM), W / 2, 1650, t, at("seis") + .5, .5)
    return img


SCENES = [(0.0, sc_abre), (at("codorna") - .15, sc_petisco), (at("crocante") - .15, sc_crocante),
          (at("na", 0) - .15, sc_produto), (at("menos") - .2, sc_lucro), (at("peça") - .25, sc_final)]
XF = .3


def frame(t):
    idx = max(i for i, (s, _) in enumerate(SCENES) if s <= t)
    img = SCENES[idx][1](t)
    s0 = SCENES[idx][0]
    if idx > 0 and t - s0 < XF:   # transição suave: dissolve com leve zoom
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
    R.VOICE = ROOT / "audio/locucao_atacado.mp3"
    R.OUT = ROOT / "saida/codorna_alecrim_atacado_30s.mp4"
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        d = ROOT / "saida/preview"
        d.mkdir(parents=True, exist_ok=True)
        for s in map(float, sys.argv[2:]):
            frame(s).save(d / f"v2_{s:05.2f}.jpg", quality=88)
    else:
        R.main()
