#!/usr/bin/env python3
"""Trilha do v4 (uso: python3 trilha3.py <duracao> <palavras.json> [voz.mp3|-] [saida.wav]).
Monta locução + batida leve (sintetizada aqui) + efeitos nos cortes.
A batida abaixa sozinha quando a voz entra (sidechain). Uso: python3 trilha.py <duracao>"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent
SR = 48000
DUR = float(sys.argv[1])
BPM = 118
pal = json.loads(Path(sys.argv[2]).read_text())
W = lambda i: pal[i]["start"] - 1 / 30

n = int(DUR * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(7)


def env(dur, a=0.002, d=None):
    k = np.arange(int(dur * SR)) / SR
    e = np.minimum(1, k / a)
    return e * np.exp(-k / (d or dur / 4))


def add(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i]


def kick():
    k = np.arange(int(0.32 * SR)) / SR
    f = 45 + 95 * np.exp(-k * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(0.32, d=0.09)


def hat():
    s = rng.standard_normal(int(0.05 * SR))
    s = np.diff(s, prepend=0)  # agudo
    return s * env(0.05, d=0.012) * 0.25


def clap():
    s = rng.standard_normal(int(0.14 * SR))
    s = np.convolve(s, np.ones(6) / 6, "same") - np.convolve(s, np.ones(60) / 60, "same")
    e = sum(env(0.14, d=0.03) * (np.arange(len(s)) >= int(x * SR)) for x in (0, 0.012, 0.024))
    return s * e * 0.35


def baixo(freq, dur):
    k = np.arange(int(dur * SR)) / SR
    s = np.tanh(2.2 * np.sin(2 * np.pi * freq * k))
    return s * np.minimum(1, k / 0.005) * np.exp(-k / (dur * 0.6)) * 0.32


# batida: começa no "Você" (depois do gancho) e para na tela final, com um respiro no fim
bed = np.zeros(n)
beat = 60 / BPM
inicio, fim = 0.0, DUR - 0.3
notas = [55.0, 55.0, 65.4, 49.0]  # lá, lá, dó, sol (grave)
b = 0
x = inicio
while x < fim:
    add(bed, kick(), x)
    add(bed, hat(), x + beat / 2)
    if b % 2 == 1: add(bed, clap(), x)
    if b % 2 == 0: add(bed, baixo(notas[(b // 4) % 4], beat * 0.9), x)
    x += beat; b += 1
bed *= np.clip((t - inicio) / 0.05, 0, 1) * np.clip((DUR - t) / 0.8, 0, 1)

# efeitos: whoosh antes dos cortes, swish nos produtos, impacto nas palavras fortes
sfx = np.zeros(n)


def whoosh(dur=0.28, sobe=True):
    s = rng.standard_normal(int(dur * SR)); k = np.linspace(0, 1, len(s))
    out = np.zeros_like(s); y = 0.0
    corte = (0.02 + 0.25 * (k if sobe else 1 - k))
    for i in range(len(s)): y += corte[i] * (s[i] - y); out[i] = y
    return out * np.sin(np.pi * k) ** 1.5 * 0.5


def impacto():
    k = np.arange(int(0.45 * SR)) / SR
    return np.sin(2 * np.pi * (38 + 40 * np.exp(-k * 18)) * k) * np.exp(-k / 0.12) * 0.8


for i in (2, 5, 9, 18, 25, 28, 35, 41): add(sfx, whoosh(0.28), W(i) - 0.24)
add(sfx, whoosh(0.32), W(47) + 0.9 - 0.26)
zk = np.arange(int(0.5 * SR)) / SR
zap = (np.sign(np.sin(2 * np.pi * 120 * zk)) * 0.25 + rng.standard_normal(len(zk)) * 0.15) * np.exp(-zk / 0.12)
for dt in (0, 0.1, 0.16): add(sfx, zap * (0.8 if dt else 1.0), W(20) + dt)
for i in (12, 14, 15, 16, 17): add(sfx, whoosh(0.13, sobe=False) * 0.7, W(i) - 0.05)
for i in (0, 1, 6, 11, 30, 37, 40, 46, 47): add(sfx, impacto(), W(i))

tmp = ROOT / "build"
for nome, sig, ganho in (("bed", bed, 0.5), ("sfx", sfx, 0.5)):
    s = (sig / (np.abs(sig).max() + 1e-9) * ganho * 32767).astype(np.int16)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    str(tmp / f"{nome}.wav")], input=s.tobytes(), check=True)

voz = sys.argv[3] if len(sys.argv) > 3 else None
if voz and voz != "-":
    fc = ("[0:a]aresample=48000,asplit=2[v][vk];"
          "[1:a]volume=0.55[b];[b][vk]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=250[bd];"
          "[2:a]volume=0.6[s];"
          "[v][bd][s]amix=inputs=3:normalize=0:duration=longest,"
          f"apad=whole_dur={DUR},atrim=0:{DUR},loudnorm=I=-14:TP=-1.5:LRA=9[out]")
    ins = ["-i", str(voz), "-i", str(tmp / "bed.wav"), "-i", str(tmp / "sfx.wav")]
else:  # prévia sem voz
    fc = (f"[0:a]volume=0.8[b];[1:a]volume=0.6[s];[b][s]amix=inputs=2:normalize=0,apad=whole_dur={DUR},atrim=0:{DUR},loudnorm=I=-16:TP=-1.5[out]")
    ins = ["-i", str(tmp / "bed.wav"), "-i", str(tmp / "sfx.wav")]
saida = tmp / (sys.argv[4] if len(sys.argv) > 4 else "trilha_v4.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", fc, "-map", "[out]", "-ac", "2", "-ar", "48000",
                "-c:a", "pcm_s16le", str(saida)], check=True)
print("ok", saida)
