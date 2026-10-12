#!/usr/bin/env python3
"""Anúncio MultAgro (30 s): quadros + locução + violão (trilha da fazendinha) + efeitos de pop sincronizados.
Uso: python3 monta.py <pasta_quadros> <saida.mp4>"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / "fazendinha"))
import render_faz  # noqa: E402

SR, DUR, LEAD = 44100, 30.0, 0.15
N = int(SR * DUR)


def put(buf, x, t0):
    i = int(t0 * SR); j = min(len(buf), i + len(x))
    if 0 <= i < len(buf):
        buf[i:j] += x[: j - i]


def pop(f0=520):
    n = int(SR * 0.12); t = np.arange(n) / SR
    f = f0 * (1 + 1.2 * np.exp(-t / 0.02))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.04) * 0.5


def whoosh(d=0.4, seed=1):
    n = int(SR * d); x = np.random.default_rng(seed).standard_normal(n)
    x = np.convolve(x, np.ones(25) / 25, "same")
    return x * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.8


def sino():
    n = int(SR * 0.9); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) for f in (1047, 1319, 1568)) * np.exp(-t / 0.3) * 0.18


if __name__ == "__main__":
    quadros, saida = sys.argv[1], sys.argv[2]
    c = json.load(open(ROOT / "audio/cues.json"))
    s = np.zeros(N)
    for k, f0 in (("cachorro", 520), ("gato", 600), ("passarinho", 680), ("cavalo", 560), ("gado", 480), ("horta", 760)):
        put(s, pop(f0), c[k] + LEAD)
    for k in ("racao", "antipulgas", "vermifugos", "medicamentos", "sementes", "adubos", "jardim", "piscina"):
        put(s, whoosh(0.35, int(c[k] * 10)) * 0.7, c[k] + LEAD - 0.2)
    for t in (1.62, 7.2, 10.3, 15.12, 19.45, 23.9):
        put(s, whoosh(0.45, int(t * 7)), t + LEAD - 0.27)
    put(s, sino(), c["multagro"] + LEAD)
    put(s, sino(), c["mult2"] + LEAD)
    s = np.clip(s / np.abs(s).max() * 0.9, -1, 1)
    with wave.open(str(ROOT / "audio/sfx.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((s * 32767).astype(np.int16).tobytes())
    render_faz.DURATION = DUR
    musica = ROOT / "audio/trilha.wav"
    render_faz.trilha(musica)
    dl = int(LEAD * 1000)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", f"{quadros}/f_%05d.jpg",
        "-i", str(ROOT / "audio/locucao.mp3"), "-i", str(musica), "-i", str(ROOT / "audio/sfx.wav"),
        "-filter_complex",
        f"[1:a]adelay={dl}|{dl},aresample=44100,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=90,"
        f"volume=2.0,apad,atrim=0:{DUR},asplit=2[v1][v2];"
        "[2:a]volume=0.16[m];[m][v1]sidechaincompress=threshold=0.03:ratio=6:release=300[md];[3:a]volume=0.22[fx];"
        f"[md][v2][fx]amix=inputs=3:duration=longest:normalize=0,afade=t=out:st={DUR - 0.8}:d=0.8,loudnorm=I=-14:TP=-1.0,atrim=0:{DUR}[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", str(DUR), saida], check=True)
    print("OK ->", saida)
