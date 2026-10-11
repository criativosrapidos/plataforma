#!/usr/bin/env python3
"""Vídeo 9:16 (30 s) - Fazendinha Self Service (Setor de Mansões de Taguatinga). Copy de desejo, fotos reais.

Uso:  python3 render_faz.py             -> saida/fazendinha_30s.mp4
      python3 render_faz.py preview 1 5  -> quadros soltos em saida/preview/
"""
import math
import subprocess
import sys
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

import faz_art as F
from faz_art import CREAM, GOLD, MAROON, MAROON3, WOOD, font

ROOT = Path(__file__).resolve().parent
W, H, FPS, DURATION = 1080, 1920, 30, 30.0
VOICE = ROOT / "audio/locucao.mp3"  # ElevenLabs "Renato - Warm and melodic", take 1
OUT = ROOT / "saida/fazendinha_30s.mp4"
TEMPO, DELAY = 1.08, 0.25
_M = dict(imagina=0.0, sol=1.84, piscina=2.373, musica=3.32, comida=5.2, fogao=6.72, na=8.08, vontade=10.4,
          churrasco=11.44, peixe=12.36, saladas=13.52, mais=15.04, depois=16.24, rede=17.92, familia=19.52,
          durante=20.4, trinta=21.44, fim=23.2, quarenta=24.12, faz2=25.893, setor=27.68, traz=29.72)
M = {k: v / TEMPO + DELAY for k, v in _M.items()}
M["imagina"] = 0.15
INSTA = "@fazendinhaselfservicee"


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, s, d):
    return clamp((t - s) / d)


def ease(x):
    return x * x * (3 - 2 * x)


def ease_back(x, c=1.7):
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


# ------------------------------------------------------------------- fotos ---
@lru_cache(None)
def photo(name):
    hd = ROOT / f"assets/hd/{name}.png"
    src = Image.open(hd if hd.exists() else ROOT / f"assets/raw/{name}.png").convert("RGB")
    if not hd.exists():
        src = src.filter(ImageFilter.UnsharpMask(2, 60, 2))
    # tratamento: mais calor, contraste e cor (apetitoso)
    src = ImageEnhance.Color(src).enhance(1.18)
    src = ImageEnhance.Contrast(src).enhance(1.08)
    arr = np.asarray(src).astype(np.float32)
    arr[..., 0] *= 1.04
    arr[..., 2] *= 0.94
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def kb(name, t, t0, dur, z0=1.0, z1=1.12, cx0=0.5, cx1=0.5, cy0=0.5, cy1=0.5):
    """Ken Burns: recorte 9:16 com zoom e pan lentos."""
    src = photo(name)
    p = ease(prog(t, t0, dur))
    z = z0 + (z1 - z0) * p
    cx, cy = cx0 + (cx1 - cx0) * p, cy0 + (cy1 - cy0) * p
    s = max(W / src.width, H / src.height) * z
    cw, ch = W / s, H / s
    x0 = clamp(cx * src.width - cw / 2, 0, src.width - cw)
    y0 = clamp(cy * src.height - ch / 2, 0, src.height - ch)
    return src.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.BICUBIC).convert("RGBA")


_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)


@lru_cache(None)
def shade(top=0.0, bottom=0.62, strength=225):
    """Gradiente escuro (topo e/ou base) para leitura do texto."""
    y = _yy[:, :1] / H
    a = np.clip((y - bottom) / (1 - bottom), 0, 1) ** 1.3 * strength
    if top:
        a = np.maximum(a, np.clip((top - y) / top, 0, 1) ** 1.5 * strength * 0.8)
    img = Image.new("RGBA", (W, H), (20, 8, 6, 0))
    img.putalpha(Image.fromarray(np.repeat(a, W, 1).astype(np.uint8)))
    return img


_VIG = Image.fromarray((np.clip(1 - np.sqrt(((_xx - W / 2) / (W * .9)) ** 2 + ((_yy - H / 2) / (H * .72)) ** 2), 0, 1)
                        ** 0.6 * 255).astype(np.uint8), "L")


# ------------------------------------------------------------------- texto ---
@lru_cache(None)
def ttext(text, fname, size, color=CREAM, shadow=True, stroke=0):
    f = font(fname, size)
    bb = ImageDraw.Draw(Image.new("L", (1, 1))).textbbox((0, 0), text, font=f, stroke_width=stroke)
    pad = 40
    img = Image.new("RGBA", (bb[2] - bb[0] + pad * 2, bb[3] - bb[1] + pad * 2), (0, 0, 0, 0))
    pos = (pad - bb[0], pad - bb[1])
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((pos[0] + 4, pos[1] + 7), text, font=f, fill=(20, 6, 4, 200), stroke_width=stroke,
                                stroke_fill=(20, 6, 4, 200))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(9)))
    ImageDraw.Draw(img).text(pos, text, font=f, fill=color, stroke_width=stroke, stroke_fill=MAROON3)
    return img


def put(base, img, cx, cy, alpha=1.0, scale=1.0, rot=0.0):
    if alpha <= 0.01:
        return
    if rot:
        img = img.rotate(rot, Image.BICUBIC, expand=True)
    if abs(scale - 1) > 1e-3:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.BICUBIC)
    if alpha < 1:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v: int(v * alpha)))
    base.paste(img, (int(cx - img.width / 2), int(cy - img.height / 2)), img)


def rise(base, img, cx, cy, t, at, dur=0.55, dy=40, rot=0.0):
    p = ease(prog(t, at, dur))
    if p > 0:
        put(base, img, cx, cy + dy * (1 - p), alpha=p, rot=rot)


def pop(base, img, cx, cy, t, at, dur=0.45, rot=0.0):
    p = prog(t, at, dur)
    if p > 0:
        put(base, img, cx, cy, alpha=clamp(p * 2.5), scale=max(0.01, ease_back(p)), rot=rot)


@lru_cache(None)
def chip(text, size=46):
    t = ttext(text, "m7", size, MAROON3, shadow=False)
    w, h = t.width - 40, t.height - 30
    img = Image.new("RGBA", (w + 30, h + 30), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((15, 20, w + 15, h + 20), h // 2, fill=(0, 0, 0, 120))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    ImageDraw.Draw(img).rounded_rectangle((10, 10, w + 10, h + 10), h // 2, fill=CREAM + (255,))
    img.alpha_composite(t, (10 + (w - t.width) // 2, 10 + (h - t.height) // 2))
    return img


@lru_cache(None)
def price_tag(label, value, seed):
    pw, ph = 900, 300
    pl = F.wood_plank(pw, ph, seed=seed)
    d = ImageDraw.Draw(pl)
    d.text((pw / 2, 78), label, font=font("m7", 40), fill=MAROON3, anchor="mm")
    d.text((pw / 2 - 150, 190), "R$", font=font("slab", 54), fill=MAROON3, anchor="rm")
    d.text((pw / 2 - 135, 190), value, font=font("slab", 130), fill=MAROON3, anchor="lm")
    out = Image.new("RGBA", (pw + 60, ph + 60), (0, 0, 0, 0))
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 170), (30, 44), pl.getchannel("A"))
    out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    out.alpha_composite(pl, (30, 30))
    return out


def bandeirinhas(img, t, y0=0, alpha=255):
    """Varal de bandeirinhas balançando (clima de fazenda/festa)."""
    d = ImageDraw.Draw(img)
    cols = [(214, 60, 44), (242, 190, 60), (60, 150, 90), (60, 120, 200), (246, 236, 216)]
    n = 11
    pts = []
    for i in range(n + 1):
        x = -20 + i * (W + 40) / n
        y = y0 + 70 + 34 * math.sin(i / n * math.pi) + 4 * math.sin(t * 2 + i)
        pts.append((x, y))
    d.line(pts, fill=(250, 240, 220, alpha), width=3)
    for i in range(n):
        (xa, ya), (xb, yb) = pts[i], pts[i + 1]
        mx, my = (xa + xb) / 2, (ya + yb) / 2
        sw = 3 * math.sin(t * 3 + i * 1.3)
        c = cols[i % 5] + (alpha,)
        d.polygon([(mx - 34, my), (mx + 34, my), (mx + 34 + sw, my + 70), (mx + sw, my + 50), (mx - 34 + sw, my + 70)],
                  fill=c)


# --------------------------------------------------------------- cenas -----
def sc_sonho(t):
    if t < M["comida"]:
        f = kb("piscina", t, 0, M["comida"] + 0.6, 1.05, 1.22, 0.5, 0.45, 0.62, 0.55)
        f.alpha_composite(shade(top=0.32, bottom=0.6))
        rise(f, ttext("Imagina", "playi", 92), W / 2, 330, t, M["imagina"])
        rise(f, ttext("um domingo assim...", "playi", 92), W / 2, 440, t, M["imagina"] + 0.45)
        for i, (lab, k) in enumerate((("SOL", "sol"), ("PISCINA", "piscina"), ("MÚSICA AO VIVO", "musica"))):
            pop(f, chip(lab), W / 2, 1300 + i * 120, t, M[k], rot=(-3, 2, -2)[i])
    else:
        f = kb("picanha", t, M["comida"], 3.4, 1.0, 1.15, 0.55, 0.5, 0.45, 0.5)
        f.alpha_composite(shade(bottom=0.55))
        rise(f, ttext("Comida caseira", "script", 120), W / 2, 1390, t, M["comida"])
        rise(f, ttext("NO FOGÃO A LENHA", "m8", 52, GOLD), W / 2, 1520, t, M["fogao"], dy=24)
    return f


BADGE = F.badge(700)


def sc_marca(t):
    f = kb("mural", t, M["na"], 3.5, 1.15, 1.25, 0.5, 0.5, 0.62, 0.6)
    f = Image.blend(f.filter(ImageFilter.GaussianBlur(9)), Image.new("RGBA", (W, H), MAROON3 + (255,)), 0.55)
    p = prog(t, M["na"], 0.6)
    put(f, BADGE, W / 2, 800, alpha=clamp(p * 2), scale=0.75 + 0.25 * ease_back(p))
    rise(f, ttext("VOCÊ COME", "m8", 64, CREAM), W / 2, 1290, t, M["vontade"] - 0.35)
    rise(f, ttext("à vontade!", "script", 150, GOLD), W / 2, 1430, t, M["vontade"] - 0.05)
    return f


def sc_pratos(t):
    items = [("picanha", "churrasco", "Churrasco", 0.5), ("peixe", "peixe", "Peixe assado", 0.5),
             ("saladas", "saladas", "Saladas fresquinhas", 0.5), ("petiscos", "mais", "e muito mais...", 0.45)]
    idx = max(i for i, it in enumerate(items) if t >= M[it[1]] - 0.05 or i == 0)
    name, k, lab, cx = items[idx]
    nxt = M[items[idx + 1][1]] if idx + 1 < len(items) else M["depois"]
    z0, z1 = (1.0, 1.06) if name == "peixe" else (1.08, 1.22)
    f = kb(name, t, M[k], nxt - M[k] + 0.5, z0, z1, cx, cx, 0.55, 0.45)
    f.alpha_composite(shade(bottom=0.6))
    rise(f, ttext(lab, "script", 118), W / 2, 1450, t, M[k], dur=0.4)
    # contador de "à vontade" no topo
    put(f, chip("SELF-SERVICE À VONTADE", 34), W / 2, 260)
    return f


def sc_rede(t):
    if t < M["familia"] - 0.35:
        f = kb("rede", t, M["depois"], 3.6, 1.0, 1.14, 0.45, 0.55, 0.6, 0.55)
        f.alpha_composite(shade(top=0.4, bottom=0.6))
        rise(f, ttext("Depois, é só", "playi", 84), W / 2, 330, t, M["depois"])
        rise(f, ttext("deitar na rede", "script", 130, GOLD), W / 2, 470, t, M["rede"] - 0.2)
    else:
        f = kb("piscina", t, M["familia"] - 0.35, 2.0, 1.2, 1.3, 0.4, 0.45, 0.6, 0.6)
        f.alpha_composite(shade(bottom=0.55))
        rise(f, ttext("e curtir o dia", "playi", 84), W / 2, 1360, t, M["familia"] - 0.5)
        rise(f, ttext("com a família", "script", 130, GOLD), W / 2, 1490, t, M["familia"] - 0.15)
    return f


def sc_precos(t):
    f = kb("saladas", t, M["durante"], 6.0, 1.3, 1.4, 0.5, 0.5, 0.5, 0.5).filter(ImageFilter.GaussianBlur(10))
    f = Image.blend(f, Image.new("RGBA", (W, H), MAROON3 + (255,)), 0.55)
    bandeirinhas(f, t)
    rise(f, ttext("SELF-SERVICE À VONTADE", "m8", 46, GOLD), W / 2, 470, t, M["durante"] - 0.2)
    pop(f, price_tag("DURANTE A SEMANA", "39,90", 3), W / 2, 760, t, M["durante"], rot=-2)
    pop(f, price_tag("FIM DE SEMANA", "49,90", 5), W / 2, 1130, t, M["fim"] - 0.1, rot=2)
    rise(f, ttext("Música ao vivo · piscina · redes", "playi5", 50, CREAM), W / 2, 1420, t, M["quarenta"] + 0.4)
    return f


def sc_final(t):
    f = kb("mural", t, M["faz2"], 4.5, 1.25, 1.35, 0.5, 0.5, 0.62, 0.62).filter(ImageFilter.GaussianBlur(6))
    f = Image.blend(f, Image.new("RGBA", (W, H), MAROON3 + (255,)), 0.6)
    bandeirinhas(f, t)
    p = prog(t, M["faz2"], 0.7)
    put(f, BADGE, W / 2, 760, alpha=clamp(p * 2), scale=0.8 + 0.2 * ease_back(p))
    rise(f, ttext("Setor de Mansões de Taguatinga", "playi5", 52, CREAM), W / 2, 1200, t, M["setor"] - 0.2)
    rise(f, ttext(INSTA, "m6", 38, GOLD), W / 2, 1280, t, M["setor"] + 0.3)
    rise(f, ttext("Traz a família!", "script", 140, CREAM), W / 2, 1450, t, M["traz"] - 0.1)
    return f


SCENES = [(0.0, sc_sonho), (M["na"] - 0.05, sc_marca), (M["churrasco"] - 0.1, sc_pratos), (M["depois"] - 0.1, sc_rede),
          (M["durante"] + 0.05, sc_precos), (M["faz2"] - 0.15, sc_final)]
XF = 0.35


def frame(t):
    idx = max(i for i, (st, _) in enumerate(SCENES) if t >= st)
    f = SCENES[idx][1](t)
    if idx + 1 < len(SCENES):
        nxt = SCENES[idx + 1][0]
        if t > nxt - XF:
            f = Image.blend(f, SCENES[idx + 1][1](t), ease(prog(t, nxt - XF, XF)))
    rgb = f.convert("RGB")
    rgb = Image.composite(rgb, Image.new("RGB", (W, H), (12, 4, 2)), _VIG.point(lambda v: int(90 + v * 165 / 255)))
    k = min(prog(t, 0, 0.5), 1 - prog(t, DURATION - 0.7, 0.7))
    if k < 1:
        rgb = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), rgb, k)
    return rgb


# ------------------------------------------------------------------ áudio ---
def trilha(path):
    """Violão dedilhado (Karplus-Strong) + leve percussão, clima de almoço de domingo."""
    sr = 44100
    n = int(sr * DURATION)
    out = np.zeros(n)
    rng = np.random.default_rng(8)
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)

    def pluck(freq, dur=1.6, amp=0.3):
        N = int(sr / freq)
        buf = rng.uniform(-1, 1, N)
        L = int(dur * sr)
        y = np.zeros(L)
        for i in range(L):
            y[i] = buf[i % N]
            buf[i % N] = 0.996 * 0.5 * (buf[i % N] + buf[(i + 1) % N])
        return y * amp

    cache = {}
    bpm = 96
    beat = 60 / bpm
    prog_ = [[52, 59, 64, 68, 71], [57, 64, 69, 72, 76], [50, 57, 62, 66, 69], [52, 59, 64, 68, 71]]  # E, A, D, E
    patt = [0, 2, 3, 4, 3, 2, 1, 2]
    for b in range(int(DURATION / (beat * 4)) + 1):
        ch = prog_[b % 4]
        for j, pi in enumerate(patt):
            m = ch[pi]
            if m not in cache:
                cache[m] = pluck(hz(m))
            s = int((b * 4 + j * 0.5) * beat * sr)
            if s < n:
                e = min(n, s + len(cache[m]))
                out[s:e] += cache[m][:e - s] * (1.0 if j == 0 else 0.6)
        for j in range(4):  # bumbo suave + chocalho
            s = int((b * 4 + j) * beat * sr)
            k = np.arange(int(0.2 * sr)) / sr
            if s < n:
                e = min(n, s + len(k))
                if j in (0, 2):
                    out[s:e] += (0.35 * np.sin(2 * np.pi * (50 + 60 * np.exp(-k * 30)) * k) * np.exp(-k * 12))[:e - s]
                sh_ = rng.standard_normal(len(k)) * np.exp(-k * 60) * 0.06
                s2 = s + int(beat / 2 * sr)
                if s2 < n:
                    e2 = min(n, s2 + len(k))
                    out[s2:e2] += sh_[:e2 - s2]
    tt = np.arange(n) / sr
    out *= np.minimum(1, tt / 1.0) * np.minimum(1, (DURATION - tt) / 1.8)
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
         f"[1:a]atempo={TEMPO},adelay={dl}|{dl},aresample=44100,highpass=f=80,"
         "acompressor=threshold=-20dB:ratio=3:attack=6:release=100,volume=1.8,asplit=2[v1][v2];"
         "[2:a]volume=0.38[m];[m][v1]sidechaincompress=threshold=0.05:ratio=4:release=300[md];"
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
            frame(s).save(d / f"a_{s:05.2f}.jpg", quality=88)
    else:
        main()
