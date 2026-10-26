#!/usr/bin/env python3
"""Trilha elegante (corporate/finanças) gerada aqui: pad, piano suave em arpejo, pulso discreto; mix com a locução (ducking)."""
import subprocess, sys, wave
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parent
SR = 44100
DUR = float(sys.argv[1])
N = int(SR * DUR)
BPM = 84; beat = 60 / BPM
m = np.zeros(N)
def put(x, t0):
    i = int(t0 * SR); j = min(N, i + len(x))
    if i < N: m[i:j] += x[: j - i]
def piano(f, d=1.6, v=.16):
    n = int(SR * d); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * k * t) for k, a in ((1, 1), (2, .35), (3, .12), (4, .05)))
    return x * np.exp(-t / .55) * np.minimum(1, t / .004) * v
def pad(fs, d):
    n = int(SR * d); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t + .3 * np.sin(2 * np.pi * .25 * t)) + .5 * np.sin(2 * np.pi * f * 1.003 * t) for f in fs)
    return x * np.minimum(1, t / .8) * np.minimum(1, (d - t) / .8) * .05
def kick():
    n = int(SR * .3); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-t / .05)) / SR) * np.exp(-t / .1) * .5
prog = [(146.8, 174.6, 220), (116.5, 146.8, 174.6), (174.6, 220, 261.6), (130.8, 164.8, 196)]
comp = beat * 4; k = 0
while k * comp < DUR:
    ch = prog[k % 4]
    put(pad([f / 2 for f in ch], comp + 1), k * comp)
    for i in range(8):
        put(piano(ch[i % 3] * 2, d=2.2, v=.07 if i % 2 else .1), k * comp + i * beat / 2)
    for b in range(4):
        if k * comp + b * beat > 1.9 and b % 2 == 0: put(kick() * .7, k * comp + b * beat)
    k += 1
fade = np.ones(N); nf = int(SR * 2.2); fade[-nf:] = np.linspace(1, 0, nf)
m *= fade; m = m / np.abs(m).max() * .85
with wave.open(str(ROOT / "audio/trilha.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((m * 32767).astype(np.int16).tobytes())
print("trilha ok", DUR)
