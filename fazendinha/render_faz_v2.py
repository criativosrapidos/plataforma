#!/usr/bin/env python3
"""Vídeo 9:16 (30 s) v2 - Fazendinha Self Service. Cortes rápidos na voz, legenda karaokê, emojis e preços animados.

Uso:  python3 render_faz_v2.py              -> saida/fazendinha_30s_v2.mp4
      python3 render_faz_v2.py preview 1 5  -> quadros soltos em saida/preview/
"""
import json
import math
import subprocess
import sys
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import faz_art as F
from faz_art import CREAM, MAROON, MAROON3
from render_faz import bandeirinhas, clamp, ease, ease_back, photo, prog

ROOT = Path(__file__).resolve().parent
W, H, FPS, DURATION = 1080, 1920, 30, 30.0
VOICE = ROOT / "audio/locucao_v2.mp3"  # ElevenLabs "Renato - Warm and melodic", take 1 (eleven_v4)
OUT = ROOT / "saida/fazendinha_30s_v2.mp4"
DELAY = 0.30
INSTA = "@fazendinhaselfservicee"
ORANGE, YELLOW, WHITE, BLACK = (245, 122, 30), (255, 206, 46), (255, 255, 255), (12, 6, 4)

WORDS = json.loads((ROOT / "audio/words_v2.json").read_text())["words"]
WORDS = [w for w in WORDS if w["type"] == "word"]
WT = [w["start"] + DELAY for w in WORDS]
WE = [w["end"] + DELAY for w in WORDS]


def at(word):
    """Instante (no vídeo) em que a palavra começa a ser dita."""
    for i, w in enumerate(WORDS):
        if w["text"].strip(".,!?").lower() == word:
            return WT[i]
    raise KeyError(word)


T_PRICE, T_FIM, T_END = at("durante"), WT[47], at("fazendinha")


# ------------------------------------------------------------------ fontes ---
@lru_cache(None)
def fnt(weight, size):
    return ImageFont.truetype(str(ROOT / f"fonts/montserrat-latin-{weight}-normal.woff"), size)


@lru_cache(None)
def emoji(ch, size):
    f = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", 109)
    img = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((80, 80), ch, font=f, embedded_color=True, anchor="mm")
    img = img.crop(img.getbbox()).resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size + 40, size + 40), (0, 0, 0, 0))
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 140), (20, 28), img.getchannel("A"))
    out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    out.alpha_composite(img, (20, 20))
    return out


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


def pop(base, img, cx, cy, t, t0, dur=0.35, rot=0.0):
    p = prog(t, t0, dur)
    if p > 0:
        put(base, img, cx, cy, alpha=clamp(p * 3), scale=ease_back(p, 2.2), rot=rot)


# ------------------------------------------------------------------- fotos ---
@lru_cache(None)
def _shade():
    y = np.linspace(0, 1, H)[:, None]
    a = np.clip((y - .5) / .5, 0, 1) ** 1.4 * 200 + np.clip((.16 - y) / .16, 0, 1) ** 1.6 * 120
    img = Image.new("RGBA", (W, H), (14, 6, 4, 0))
    img.putalpha(Image.fromarray(np.repeat(a, W, 1).astype(np.uint8)))
    return img


def cam(name, t, t0, cx, cy, z, dz=0.10, pan=(0.0, 0.0), blur=0):
    """Enquadramento 9:16 com 'punch-in' no corte (zoom rápido que assenta) e deriva lenta."""
    src = photo(name)
    u = t - t0
    punch = 0.16 * math.exp(-u * 9)            # entra 'empurrando' e assenta
    zz = z * (1 + punch + dz * min(u, 3) / 3)
    cx += pan[0] * min(u, 3) / 3
    cy += pan[1] * min(u, 3) / 3
    s = max(W / src.width, H / src.height) * zz
    cw, ch = W / s, H / s
    x0 = clamp(cx * src.width - cw / 2, 0, src.width - cw)
    y0 = clamp(cy * src.height - ch / 2, 0, src.height - ch)
    img = src.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.BICUBIC)
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    img = img.convert("RGBA")
    img.alpha_composite(_shade())
    return img


# ------------------------------------------------------------ cenas finais ---
@lru_cache(None)
def price_card(label, value, color):
    cw, chh = 940, 360
    img = Image.new("RGBA", (cw + 60, chh + 60), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((30, 46, cw + 30, chh + 46), 46, fill=(0, 0, 0, 160))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(16)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((30, 30, cw + 30, chh + 30), 46, fill=CREAM + (255,))
    f = fnt(900, 50)
    lw = d.textlength(label, font=f)
    d.rounded_rectangle((30 + cw / 2 - lw / 2 - 34, 62, 30 + cw / 2 + lw / 2 + 34, 142), 40, fill=color + (255,))
    d.text((30 + cw / 2, 103), label, font=f, fill=WHITE, anchor="mm")
    return img


def price_value(value):
    img = Image.new("RGBA", (900, 230), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fr, fv = fnt(900, 70), fnt(900, 190)
    wr, wv = d.textlength("R$", font=fr), d.textlength(value, font=fv)
    x = 450 - (wr + 18 + wv) / 2
    d.text((x, 150), "R$", font=fr, fill=MAROON + (255,), anchor="ls")
    d.text((x + wr + 18, 185), value, font=fv, fill=MAROON + (255,), anchor="ls")
    return img


def counted(t, t0, t1, target):
    p = ease(prog(t, t0, max(0.2, t1 - t0)))
    v = target * p
    return f"{int(v):d},{int(round((v - int(v)) * 100)):02d}" if p < 1 else f"{target:.2f}".replace(".", ",")


def scene_precos(t):
    img = cam("petiscos", t, T_PRICE, .55, .7, 1.25, dz=.08, blur=10)
    img.alpha_composite(Image.new("RGBA", (W, H), MAROON3 + (150,)))
    k = ImageDraw.Draw(img)
    p = ease(prog(t, T_PRICE, .3))
    if p > 0:
        f = fnt(900, 64)
        put(img, _label("COMA À VONTADE", f, YELLOW), W / 2, 330 - 30 * (1 - p), alpha=p)
        put(img, _label("SELF-SERVICE", fnt(800, 40), CREAM), W / 2, 410 - 30 * (1 - p), alpha=p)
    cards = [("DIA DE SEMANA", 39.90, WT[42], WT[43], WT[47], 760, -2, ORANGE),
             ("FINAL DE SEMANA", 49.90, WT[49], WT[52], WT[56], 1200, 2, MAROON)]
    for label, val, t0, c0, c1, y, rot, col in cards:
        pc = prog(t, t0, .4)
        if pc <= 0:
            continue
        card = price_card(label, val, col).copy()
        card.alpha_composite(price_value(counted(t, c0, c1, val)), (80, 150))
        bump = 1 + 0.06 * math.exp(-max(0, t - c1) * 8) if t > c1 else 1
        put(img, card, W / 2, y, alpha=clamp(pc * 3), scale=ease_back(pc, 2.0) * bump, rot=rot)
    pe = prog(t, WT[56] + .2, .35)
    if pe > 0:
        put(img, emoji("😋", 150), 900, 1450, alpha=clamp(pe * 3), scale=ease_back(pe, 2), rot=10 * math.sin(t * 5))
    return img


@lru_cache(None)
def _label(text, f, color, stroke=6):
    bb = ImageDraw.Draw(Image.new("L", (1, 1))).textbbox((0, 0), text, font=f, stroke_width=stroke)
    img = Image.new("RGBA", (bb[2] - bb[0] + 60, bb[3] - bb[1] + 60), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((30 - bb[0], 36 - bb[1]), text, font=f, fill=(0, 0, 0, 170), stroke_width=stroke,
                            stroke_fill=(0, 0, 0, 170))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
    ImageDraw.Draw(img).text((30 - bb[0], 30 - bb[1]), text, font=f, fill=color, stroke_width=stroke, stroke_fill=BLACK)
    return img


LOGO = F.logo_recriado(640)


@lru_cache(None)
def _end_bg():
    img = cam("piscina", 10, 0, .5, .6, 1.2, dz=0, blur=14)
    img.alpha_composite(Image.new("RGBA", (W, H), MAROON3 + (185,)))
    return img


@lru_cache(None)
def stamp(text, size, fill):
    f = fnt(900, size)
    tw = ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f)
    w, h = int(tw + size * 1.1), int(size * 1.55)
    img = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((20, 30, w + 20, h + 30), h // 2, fill=(0, 0, 0, 150))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((20, 20, w + 20, h + 20), h // 2, fill=fill + (255,))
    d.text((20 + w / 2, 20 + h / 2), text, font=f, fill=WHITE, anchor="mm")
    return img


def scene_final(t):
    img = _end_bg().copy()
    bandeirinhas(img, t, y0=-10)
    u = t - T_END
    float_y = 8 * math.sin(u * 2.2)
    pop(img, LOGO, W / 2, 660 + float_y, t, T_END, .5)
    ts = at("setor")
    p = ease(prog(t, ts - .1, .4))
    if p > 0:
        put(img, emoji("📍", 90), W / 2, 1090 - 30 * (1 - p), alpha=p)
        put(img, _label("SETOR DE MANSÕES", fnt(900, 66), WHITE), W / 2, 1190 - 30 * (1 - p), alpha=p)
        put(img, _label("DE TAGUATINGA", fnt(900, 66), YELLOW), W / 2, 1275 - 30 * (1 - p), alpha=p)
    tb = at("bora")
    pb = prog(t, tb, .4)
    if pb > 0:
        pulse = 1 + 0.04 * math.sin(max(0, t - tb - .4) * 6)
        put(img, stamp("BORA?", 110, ORANGE), W / 2, 1520, alpha=clamp(pb * 3), scale=ease_back(pb, 2.4) * pulse, rot=-3)
        put(img, emoji("🤠", 140), W / 2 + 290, 1440, alpha=clamp(pb * 3), scale=ease_back(pb, 2.4),
            rot=12 * math.sin(t * 4))
    p2 = ease(prog(t, tb + .5, .5))
    if p2 > 0:
        put(img, _label(INSTA, fnt(800, 44), CREAM, 4), W / 2, 1740 + 20 * (1 - p2), alpha=p2)
    return img


# ---------------------------------------------------------- roteiro de cortes ---
# (início, foto, cx, cy, zoom, deriva de zoom, pan)
def _w(i):
    return WT[i]


SHOTS = [
    (0.0, "picanha", .55, .42, 1.45, .10, (0, .04)),       # Sabe aquele almoço...
    (_w(4), "saladas", .62, .74, 1.25, .10, (0, -.03)),   # domingo
    (_w(7), "picanha", .45, .62, 1.4, .12, (0, -.05)),      # água na boca
    (_w(10), "picanha", .5, .5, 1.05, .12, (0, 0)),       # Churrasco saindo na hora
    (_w(14), "peixe", .62, .5, 1.0, .14, (-.05, 0)),      # peixe assado
    (_w(16), "saladas", .5, .8, 1.15, .10, (.04, 0)),     # comida caseira
    (_w(19), "petiscos", .5, .74, 1.2, .12, (0, 0)),      # fogão a lenha
    (_w(22), "saladas", .55, .55, 1.0, .08, (0, .1)),     # e você come
    (_w(26), "petiscos", .7, .7, 1.7, .12, (0, 0)),       # à vontade!
    (_w(27), "mural", .45, .5, 1.0, .10, (.04, 0)),       # Depois
    (_w(29), "rede", .38, .62, 1.05, .10, (.05, 0)),      # rede
    (_w(30), "piscina", .5, .6, 1.0, .12, (0, .05)),      # piscina
    (_w(32), "mural", .66, .55, 1.65, .10, (0, 0)),       # música ao vivo (violão no mural)
    (_w(36), "rede", .6, .5, 1.25, .10, (-.06, 0)),       # pra curtir
    (_w(38), "piscina", .4, .55, 1.15, .10, (.12, 0)),    # o dia todo
    (T_PRICE, "@precos"),
    (T_END, "@final"),
]

STICKERS = [  # (início, fim, emoji, x, y, tamanho)
    (_w(7), _w(10), "😋", 820, 520, 200),
    (_w(10), _w(14), "🔥", 230, 560, 190),
    (_w(14), _w(16), "🐟", 830, 560, 170),
    (_w(19), _w(22), "🔥", 830, 560, 170),
    (_w(26), _w(27), "🤤", 820, 520, 210),
    (_w(29), _w(30), "🌴", 840, 520, 190),
    (_w(30), _w(32), "💦", 230, 520, 190),
    (_w(32), _w(36), "🎶", 830, 520, 190),
    (_w(38), T_PRICE, "☀️", 830, 500, 200),
]


def shot_img(i, t):
    s = SHOTS[i]
    if s[1] == "@precos":
        return scene_precos(t)
    if s[1] == "@final":
        return scene_final(t)
    t0, name, cx, cy, z, dz, pan = s
    return cam(name, t, t0, cx, cy, z, dz, pan)


def smear(img, amount):
    """Borrão de movimento horizontal (whip pan)."""
    k = max(1, int(W / (1 + amount * 40)))
    return img.resize((k, H), Image.BILINEAR).resize((W, H), Image.BILINEAR)


WHIP = 0.09


def _roll(img, off):
    return Image.fromarray(np.roll(np.asarray(img), off, axis=1)) if off else img


def background(t):
    idx = max(i for i, s in enumerate(SHOTS) if s[0] <= t)
    nxt = SHOTS[idx + 1][0] if idx + 1 < len(SHOTS) else 1e9
    prv = SHOTS[idx][0]
    if idx > 0 and t - prv < WHIP:                 # metade final do whip: entrando
        p = (t - prv) / WHIP
        return _roll(smear(shot_img(idx, t), 1 - p), int(W * 0.35 * (1 - p) ** 2))
    if nxt - t < WHIP:                              # metade inicial do whip: saindo
        p = 1 - (nxt - t) / WHIP
        return _roll(smear(shot_img(idx, t), p), -int(W * 0.35 * p ** 2))
    return shot_img(idx, t)


# ---------------------------------------------------------- legenda karaokê ---
GROUPS = [2, 3, 3, 2, 1, 3, 2, 2, 4, 3, 2, 3, 1, 4, 2, 3]  # palavras 0..39 (até "o dia todo")
PHRASES = []
_i = 0
for n in GROUPS:
    PHRASES.append(list(range(_i, _i + n)))
    _i += n
CAP_F = fnt(900, 92)
CAP_Y = 1400


def _clean(i):
    return WORDS[i]["text"].strip(".,").upper().replace("...", "")


@lru_cache(None)
def caption(pi, active):
    ws = PHRASES[pi]
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    space = 26
    widths = [d.textlength(_clean(i), font=CAP_F) for i in ws]
    lines, cur, cw = [], [], 0
    for i, w in zip(ws, widths):
        if cur and cw + space + w > 930:
            lines.append(cur)
            cur, cw = [], 0
        cur.append((i, w))
        cw += (space if len(cur) > 1 else 0) + w
    lines.append(cur)
    lh = 118
    img = Image.new("RGBA", (W, lh * len(lines) + 60), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d, ds = ImageDraw.Draw(img), ImageDraw.Draw(sh)
    for li, line in enumerate(lines):
        total = sum(w for _, w in line) + space * (len(line) - 1)
        x = W / 2 - total / 2
        y = 30 + li * lh + lh / 2
        for i, w in line:
            txt = _clean(i)
            if i == active:
                d.rounded_rectangle((x - 16, y - 58, x + w + 16, y + 54), 22, fill=ORANGE + (255,))
            ds.text((x + 3, y + 8), txt, font=CAP_F, fill=(0, 0, 0, 190), anchor="lm", stroke_width=8,
                    stroke_fill=(0, 0, 0, 190))
            x += w + space
    img = Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7)), img)
    d = ImageDraw.Draw(img)
    for li, line in enumerate(lines):
        total = sum(w for _, w in line) + space * (len(line) - 1)
        x = W / 2 - total / 2
        y = 30 + li * lh + lh / 2
        for i, w in line:
            col = WHITE if i == active else (255, 255, 255)
            d.text((x, y), _clean(i), font=CAP_F, fill=col, anchor="lm", stroke_width=0 if i == active else 7,
                   stroke_fill=BLACK)
            x += w + space
    return img


def draw_caption(img, t):
    if t >= T_PRICE - 0.05:
        return
    for pi, ws in enumerate(PHRASES):
        start = WT[ws[0]]
        end = WT[PHRASES[pi + 1][0]] if pi + 1 < len(PHRASES) else T_PRICE
        if start - 0.05 <= t < end:
            active = max([i for i in ws if WT[i] <= t + 0.03], default=ws[0])
            cap = caption(pi, active)
            p = prog(t, start - 0.05, 0.14)
            put(img, cap, W / 2, CAP_Y, alpha=clamp(p * 2), scale=0.88 + 0.12 * ease_back(p, 1.8))
            return


# ------------------------------------------------------------------ quadro ---
MINI = F.logo_recriado(170)


def frame(t):
    img = background(t)
    for t0, t1, ch, x, y, sz in STICKERS:
        if t0 <= t < t1:
            p = prog(t, t0 + 0.05, 0.35)
            wob = 8 * math.sin((t - t0) * 6)
            put(img, emoji(ch, sz), x, y + 6 * math.sin((t - t0) * 4), alpha=clamp(p * 3),
                scale=max(0.01, ease_back(p, 2.4)), rot=wob)
    if t < T_PRICE:
        put(img, MINI, W - 130, 200, alpha=ease(prog(t, 0.6, 0.4)) * 0.95)
    draw_caption(img, t)
    rgb = img.convert("RGB")
    if t < 0.2:
        rgb = Image.blend(Image.new("RGB", (W, H)), rgb, t / 0.2)
    if t > DURATION - 0.5:
        rgb = Image.blend(rgb, Image.new("RGB", (W, H)), (t - (DURATION - 0.5)) / 0.5)
    return rgb


# ------------------------------------------------------------------ áudio ---
def trilha(path):
    """Violão dedilhado alegre (Karplus-Strong) + palmas leves, bem baixo debaixo da voz."""
    sr = 44100
    n = int(sr * DURATION)
    out = np.zeros(n)
    rng = np.random.default_rng(3)
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)

    def pluck(freq, dur=1.2, amp=0.3):
        N = int(sr / freq)
        buf = rng.uniform(-1, 1, N)
        L = int(dur * sr)
        y = np.zeros(L)
        for i in range(L):
            y[i] = buf[i % N]
            buf[i % N] = 0.995 * 0.5 * (buf[i % N] + buf[(i + 1) % N])
        return y * amp

    cache = {}
    beat = 60 / 112
    chords = [[55, 59, 62, 67, 71], [60, 64, 67, 72, 76], [62, 66, 69, 74, 78], [55, 59, 62, 67, 71]]  # G C D G
    patt = [0, 3, 2, 4, 1, 3, 2, 4]
    for b in range(int(DURATION / (beat * 4)) + 1):
        ch = chords[b % 4]
        for j, pi in enumerate(patt):
            m = ch[pi]
            if m not in cache:
                cache[m] = pluck(hz(m))
            s = int((b * 4 + j * 0.5) * beat * sr)
            if s < n:
                e = min(n, s + len(cache[m]))
                out[s:e] += cache[m][:e - s] * (1.0 if j % 2 == 0 else 0.55)
        k = np.arange(int(0.12 * sr)) / sr
        for j in range(4):
            s = int((b * 4 + j) * beat * sr)
            if s >= n:
                continue
            if j in (0, 2):
                e = min(n, s + len(k))
                out[s:e] += (0.3 * np.sin(2 * np.pi * (55 + 70 * np.exp(-k * 30)) * k) * np.exp(-k * 18))[:e - s]
            else:
                clap = rng.standard_normal(len(k)) * np.exp(-k * 45) * 0.12
                e = min(n, s + len(k))
                out[s:e] += clap[:e - s]
    tt = np.arange(n) / sr
    out *= np.minimum(1, tt / 0.6) * np.minimum(1, (DURATION - tt) / 1.5)
    out = np.tanh(out * 1.2)
    out = (out / np.abs(out).max() * 0.85 * 32767).astype(np.int16)
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
         "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
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
         "[2:a]volume=0.16[m];[m][v1]sidechaincompress=threshold=0.03:ratio=6:release=350[md];"
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
            frame(s).save(d / f"v2_{s:05.2f}.jpg", quality=88)
    else:
        main()
