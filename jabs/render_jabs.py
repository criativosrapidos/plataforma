#!/usr/bin/env python3
"""Vídeo premium 9:16 (30 s) - JABS Engenharia. Preto e branco, ritmo calmo, cor surge no final.

Uso:  python3 render_jabs.py             -> saida/jabs_30s.mp4
      python3 render_jabs.py preview 1 5  -> quadros soltos em saida/preview/
"""
import math
import subprocess
import sys
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

import jabs_art as J
from jabs_art import font, text_width, tracked

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / "ptk"))
from whatsapp_icon import wa_icon  # noqa: E402

# ----------------------------------------------------------------- CONFIG ---
W, H, FPS, DURATION = 1080, 1920, 30, 30.0
VOICE = ROOT / "audio/locucao.mp3"   # ElevenLabs "Thales", take 1
OUT = ROOT / "saida/jabs_30s.mp4"
DELAY = 0.6
WHATS = "(61) 99325-4777"
_M = dict(construir=0.0, estruturas=2.6, jabs=3.84, pensado=6.08, exclusivamente=6.64, obras=8.8,
          precisao=10.56, acabamento=12.56, cronograma=14.24, aqui=16.32, nao=17.84, entregamos=18.88,
          conforto=20.4, elegancia=21.64, jabs2=22.8, construtora=24.24, fale=26.56, whats=27.8)
M = {k: v + DELAY for k, v in _M.items()}
S2, S3, S4, S5, S6 = M["jabs"] - 0.2, M["obras"] - 0.15, M["aqui"] - 0.1, M["entregamos"] - 0.2, M["jabs2"] - 0.25
XF = 0.6  # duração das fusões
# ---------------------------------------------------------------------------


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, s, d):
    return clamp((t - s) / d)


def ease(x):
    return x * x * (3 - 2 * x)


@lru_cache(None)
def ttext(text, fname, size, color=(240, 240, 242), track=0):
    f = font(fname, size)
    w = int(text_width(text, f, track)) + 40
    probe = ImageDraw.Draw(Image.new("L", (1, 1))).textbbox((0, 0), "ÁgjpÇ", font=f)
    h = int((probe[3] - probe[1]) * 1.6) + 20
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    tracked(ImageDraw.Draw(img), w / 2, h / 2, text, f, color + (255,), track)
    return img


def put(base, img, cx, cy, alpha=1.0, scale=1.0):
    if alpha <= 0.01:
        return
    if abs(scale - 1) > 1e-3:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.BICUBIC)
    if alpha < 1:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v: int(v * alpha)))
    base.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


def rise(base, img, cx, cy, t, at, dur=0.9, dy=26):
    """Entrada elegante: sobe de leve e aparece (sem pancada)."""
    p = ease(prog(t, at, dur))
    if p > 0:
        put(base, img, cx, cy + dy * (1 - p), alpha=p)


def hline(base, cx, y, w, p, alpha=200):
    if p <= 0:
        return
    d = ImageDraw.Draw(base)
    half = w / 2 * ease(p)
    d.line((cx - half, y, cx + half, y), fill=(230, 230, 232, alpha), width=2)


# ------------------------------------------------------------------- fundos --
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)


@lru_cache(None)
def black_bg():
    g = np.clip(1 - np.sqrt(((_xx - W / 2) / 900) ** 2 + ((_yy - H * .45) / 1100) ** 2), 0, 1) ** 1.6 * 26
    arr = np.zeros((H, W, 3), np.float32) + 8 + g[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


@lru_cache(None)
def grid_bg():
    img = black_bg().copy()
    d = ImageDraw.Draw(img)
    for x in range(0, W, 60):
        d.line((x, 0, x, H), fill=(255, 255, 255, 10), width=1)
    for y in range(0, H, 60):
        d.line((0, y, W, y), fill=(255, 255, 255, 10), width=1)
    return img


_GRAIN = [Image.fromarray((np.random.default_rng(i).normal(0, 9, (H // 2, W // 2)) + 128).clip(0, 255).astype(np.uint8),
                          "L").resize((W, H), Image.BILINEAR) for i in range(4)]
_VIG = Image.fromarray((np.clip(1 - np.sqrt(((_xx - W / 2) / (W * .85)) ** 2 + ((_yy - H / 2) / (H * .7)) ** 2), 0, 1)
                        ** 0.7 * 255).astype(np.uint8), "L")


def finish(img, t):
    """Vinheta + grão de filme sutil."""
    rgb = img.convert("RGB")
    dark = Image.new("RGB", (W, H), (0, 0, 0))
    rgb = Image.composite(rgb, dark, _VIG.point(lambda v: int(80 + v * 175 / 255)))
    g = _GRAIN[int(t * 12) % 4]
    rgb = Image.blend(rgb, Image.merge("RGB", (g, g, g)), 0.035)
    return rgb


# -------------------------------------------------------------------- foto ---
_src = Image.open(ROOT / "assets/obra_jl.jpg").convert("RGB").crop((0, 82, 828, 674))
_photo = _src.resize((int(_src.width * 2.35), int(_src.height * 2.35)), Image.LANCZOS)
PHOTO_COLOR = ImageEnhance.Contrast(ImageEnhance.Color(_photo).enhance(1.05)).enhance(1.08)
_gray = ImageOps.grayscale(_photo)
_gray = ImageOps.autocontrast(_gray, cutoff=1)
PHOTO_BW = ImageEnhance.Contrast(Image.merge("RGB", (_gray, _gray, _gray))).enhance(1.25)


def photo_frame(t, t0, dur, z0, z1, cx0, cx1, color_mix=0.0, cy=0.5):
    """Recorte 9:16 com zoom/pan lento (Ken Burns) da foto da obra."""
    p = ease(prog(t, t0, dur))
    z = z0 + (z1 - z0) * p
    cx = cx0 + (cx1 - cx0) * p
    src = PHOTO_BW if color_mix <= 0 else (PHOTO_COLOR if color_mix >= 1 else Image.blend(PHOTO_BW, PHOTO_COLOR, color_mix))
    ph = src.height / z
    pw = ph * W / H
    x0 = clamp(cx * src.width - pw / 2, 0, src.width - pw)
    y0 = clamp(cy * src.height - ph / 2, 0, src.height - ph)
    crop = src.crop((int(x0), int(y0), int(x0 + pw), int(y0 + ph))).resize((W, H), Image.BICUBIC)
    return crop.convert("RGBA")


PH_H = int(W * _src.height / _src.width)  # altura da foto inteira na largura do vídeo
_fy = np.clip(np.minimum(np.arange(PH_H) / (PH_H * .18), (PH_H - 1 - np.arange(PH_H)) / (PH_H * .18)), 0, 1)
WIDE_MASK = Image.fromarray(np.repeat((_fy[:, None] ** 1.2 * 255).astype(np.uint8), W, 1), "L")


def photo_wide(t, t0, dur, z0, z1, cy_screen=820, color_mix=0.0):
    """Fachada inteira (proporção original) sobre fundo preto, bordas fundidas, zoom lento."""
    p = ease(prog(t, t0, dur))
    z = z0 + (z1 - z0) * p
    src = PHOTO_BW if color_mix <= 0 else (PHOTO_COLOR if color_mix >= 1 else Image.blend(PHOTO_BW, PHOTO_COLOR, color_mix))
    pw, ph = src.width / z, src.height / z
    x0, y0 = (src.width - pw) / 2, (src.height - ph) / 2
    crop = src.crop((int(x0), int(y0), int(x0 + pw), int(y0 + ph))).resize((W, PH_H), Image.BICUBIC)
    f = black_bg().copy()
    f.paste(crop, (0, int(cy_screen - PH_H / 2)), WIDE_MASK)
    return f


@lru_cache(None)
def shade_bottom(strength=235):
    a = np.clip((_yy - H * 0.42) / (H * 0.5), 0, 1) ** 1.3 * strength
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    img.putalpha(Image.fromarray(a.astype(np.uint8)))
    return img


# --------------------------------------------------------------- cenas -----
def sc1(t):
    """Desenho técnico da fachada sendo traçado."""
    f = grid_bg().copy()
    p = ease(prog(t, 0.0, S2 - 0.2))
    bp = J.draw_blueprint(980, 760, 0.04 + 0.96 * p)
    put(f, bp, W / 2, 1180)
    rise(f, ttext("Construir é muito mais", "cormi3", 86), W / 2, 470, t, M["construir"] + 0.05)
    rise(f, ttext("do que levantar estruturas.", "cormi3", 86), W / 2, 580, t, M["estruturas"] - 0.3)
    return f


def sc2(t):
    f = photo_wide(t, S2, S3 - S2 + XF, 1.0, 1.10, cy_screen=760)
    rise(f, ttext("JABS ENGENHARIA", "mont3", 34, track=14), W / 2, 1260, t, M["jabs"])
    hline(f, W / 2, 1310, 160, prog(t, M["jabs"] + 0.3, 0.8))
    rise(f, ttext("Pensado exclusivamente", "cormi3", 88), W / 2, 1410, t, M["pensado"] - 0.2)
    rise(f, ttext("para você.", "cormi3", 88), W / 2, 1515, t, M["exclusivamente"] + 0.4)
    return f


def sc3(t):
    f = photo_frame(t, S3, S4 - S3 + XF, 1.55, 1.75, 0.30, 0.42, cy=0.55)
    f.alpha_composite(shade_bottom(245))
    items = [("ALTO PADRÃO", M["obras"]), ("PRECISÃO EM CADA ETAPA", M["precisao"]),
             ("ACABAMENTO IMPECÁVEL", M["acabamento"]), ("CRONOGRAMA CUMPRIDO", M["cronograma"])]
    for i, (lab, at) in enumerate(items):
        y = 1080 + i * 120
        rise(f, ttext(lab, "mont4", 44, track=9), W / 2, y, t, at, dy=18)
        if i < len(items) - 1:
            hline(f, W / 2, y + 60, 60, prog(t, at + 0.4, 0.6), alpha=120)
    return f


def sc4(t):
    """Sua obra não atrasa: linha do tempo com marcos sendo cumpridos."""
    f = black_bg().copy()
    d = ImageDraw.Draw(f)
    x0, x1, y = 170, 910, 1180
    p = ease(prog(t, S4 + 0.2, M["entregamos"] - S4 - 0.6))
    d.line((x0, y, x1, y), fill=(255, 255, 255, 40), width=2)
    d.line((x0, y, x0 + (x1 - x0) * p, y), fill=(240, 240, 242, 255), width=3)
    labels = ["PROJETO", "ESTRUTURA", "ACABAMENTO", "ENTREGA"]
    for i, lab in enumerate(labels):
        mx = x0 + (x1 - x0) * i / 3
        done = p >= i / 3 - 1e-3
        r = 13 if i < 3 else 18
        d.ellipse((mx - r, y - r, mx + r, y + r), outline=(240, 240, 242, 255), width=2,
                  fill=(240, 240, 242, 255) if done else (8, 8, 9, 255))
        put(f, ttext(lab, "mont3", 24, track=5, color=(200, 200, 204)), mx, y + 52, alpha=0.5 + 0.5 * done)
    if p >= 1:
        cp = prog(t, S4 + 0.2 + (M["entregamos"] - S4 - 0.6), 0.4)
        mx = x1
        d.line((mx - 8, y, mx - 2, y + 7, mx + 9, y - 7), fill=(8, 8, 9, int(255 * cp)), width=4)
    rise(f, ttext("Aqui,", "cormi3", 80), W / 2, 680, t, M["aqui"])
    rise(f, ttext("SUA OBRA", "cinzel", 110, track=18), W / 2, 820, t, M["aqui"] + 0.6)
    rise(f, ttext("NÃO ATRASA.", "cinzel", 110, track=18), W / 2, 950, t, M["nao"])
    rise(f, ttext("ENTREGA NO PRAZO, DO PROJETO À CHAVE", "mont3", 28, track=6, color=(190, 190, 195)),
         W / 2, 1360, t, M["nao"] + 0.5)
    return f


def sc5(t):
    mix = ease(prog(t, M["entregamos"] + 0.5, 2.2))
    f = photo_wide(t, S5, S6 - S5 + XF, 1.12, 1.0, cy_screen=760, color_mix=mix)
    rise(f, ttext("Onde o conforto", "cormi3", 92), W / 2, 1360, t, M["conforto"] - 0.3)
    rise(f, ttext("encontra a elegância.", "cormi3", 92), W / 2, 1470, t, M["elegancia"] - 0.3)
    return f


WA_W = wa_icon(64, bg=False)


def sc6(t):
    f = black_bg().copy()
    lp = ease(prog(t, S6, 1.6))
    ic = J.icon_anim(560, lp)
    put(f, ic, W / 2, 610)
    wm = J.wordmark(760)
    wp = ease(prog(t, S6 + 0.9, 1.2))
    put(f, wm, W / 2, 950 + 20 * (1 - wp), alpha=wp)
    rise(f, ttext("CONSTRUTORA  &  INCORPORADORA", "mont3", 30, track=8, color=(200, 200, 204)), W / 2, 1185, t,
         M["construtora"])
    rise(f, ttext("Especializada em obras de alto padrão", "cormi3", 50, color=(225, 225, 228)), W / 2, 1265, t,
         M["construtora"] + 0.8)
    p = ease(prog(t, M["fale"] - 0.2, 0.9))
    if p > 0:
        row = Image.new("RGBA", (760, 110), (0, 0, 0, 0))
        d = ImageDraw.Draw(row)
        d.rounded_rectangle((1, 1, 758, 108), 54, outline=(230, 230, 232, 255), width=2)
        row.alpha_composite(WA_W, (60, 23))
        num = ttext(WHATS, "mont4", 46, track=4)
        row.alpha_composite(num, (430 - num.width // 2, 55 - num.height // 2))
        put(f, row, W / 2, 1430 + 20 * (1 - p), alpha=p)
    rise(f, ttext("FALE COM A GENTE", "mont3", 24, track=8, color=(170, 170, 175)), W / 2, 1530, t, M["whats"])
    return f


SCENES = [(0.0, sc1), (S2, sc2), (S3, sc3), (S4, sc4), (S5, sc5), (S6, sc6)]


def frame(t):
    idx = max(i for i, (st, _) in enumerate(SCENES) if t >= st)
    f = SCENES[idx][1](t)
    if idx + 1 < len(SCENES):
        nxt = SCENES[idx + 1][0]
        if t > nxt - XF:  # fusão para a próxima cena
            a = ease(prog(t, nxt - XF, XF))
            f = Image.blend(f, SCENES[idx + 1][1](t), a)
    fade_in = prog(t, 0, 0.8)
    fade_out = 1 - prog(t, DURATION - 0.8, 0.8)
    out = finish(f, t)
    k = min(fade_in, fade_out)
    if k < 1:
        out = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), out, k)
    return out


# ------------------------------------------------------------------ áudio ---
def trilha(path):
    """Trilha cinematográfica: pads suaves + piano esparso + graves nas transições."""
    sr = 44100
    n = int(sr * DURATION)
    out = np.zeros(n)
    tt = np.arange(n) / sr
    chords = [[57, 60, 64, 71], [53, 57, 60, 64], [48, 55, 60, 64], [55, 59, 62, 67]]  # Am9, F, C, G
    bar = 4.0
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    for i in range(int(DURATION / bar) + 1):
        s = int(i * bar * sr)
        e = min(n, int((i + 1) * bar * sr + sr))
        k = np.arange(e - s) / sr
        env = np.minimum(1, k / 1.2) * np.exp(-k * 0.25)
        for m in chords[i % 4]:
            for det in (-0.12, 0.12):
                out[s:e] += 0.035 * np.sin(2 * np.pi * hz(m - 12) * (1 + det / 100) * k) * env
        out[s:e] += 0.06 * np.sin(2 * np.pi * hz(chords[i % 4][0] - 24) * k) * env
    rng = np.random.default_rng(4)
    for i in range(int(DURATION / 1.0)):  # piano esparso
        if rng.random() < 0.55:
            ch = chords[int(i / bar) % 4]
            m = ch[rng.integers(0, 4)] + 12
            s = int((i + rng.choice([0, 0.5])) * sr)
            k = np.arange(int(2.5 * sr)) / sr
            note = sum(a * np.sin(2 * np.pi * hz(m) * h * k) for h, a in ((1, 1), (2, .4), (3, .15))) * np.exp(-k * 2.2)
            e = min(n, s + len(k))
            out[s:e] += 0.05 * note[:e - s]
    for st in [S2, S3, S4, S5, S6]:  # grave sutil nas transições
        s = int(st * sr)
        k = np.arange(int(1.5 * sr)) / sr
        e = min(n, s + len(k))
        out[s:e] += (0.25 * np.sin(2 * np.pi * 42 * k) * np.exp(-k * 3))[:e - s]
    # reverb simples (convolução com ruído decaindo)
    ir_t = np.arange(int(1.8 * sr)) / sr
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.2) * 0.02
    ir[0] = 1.0
    L = len(out) + len(ir)
    nfft = 1 << (L - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(out, nfft) * np.fft.rfft(ir, nfft), nfft)[:len(out)]
    out = wet * np.minimum(1, tt / 1.5) * np.minimum(1, (DURATION - tt) / 2.0)
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
         f"[1:a]adelay={dl}|{dl},aresample=44100,highpass=f=70,acompressor=threshold=-22dB:ratio=3:attack=8:release=120,"
         "volume=1.8,asplit=2[v1][v2];[2:a]volume=0.42[m];"
         "[m][v1]sidechaincompress=threshold=0.05:ratio=3:release=400[md];"
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
