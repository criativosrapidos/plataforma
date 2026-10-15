#!/usr/bin/env python3
"""Reels Benefiz (30 s): quadros + trilha alegre gerada aqui + efeitos sincronizados (locução entra quando houver audio/locucao.mp3).
Uso: python3 monta.py <pasta_quadros> <saida.mp4>"""
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
SR, DUR, LEAD, BPM = 44100, float(__import__("os").environ.get("DUR", 41.6)), 0.15, 100
N = int(SR * DUR)
rng = np.random.default_rng(7)


def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def put(buf, x, t0):
    i = int(t0 * SR)
    j = min(len(buf), i + len(x))
    if i < len(buf):
        buf[i:j] += x[: j - i]


def kick():
    n = int(SR * 0.35)
    t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.12)


def hat():
    n = int(SR * 0.06)
    x = rng.standard_normal(n)
    x = np.diff(x, prepend=0)
    return x * env(n, 0.001, 0.015) * 0.25


def baixo(freq, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * freq * t)) * 0.5 + np.sin(2 * np.pi * freq * t)
    k = np.ones(40) / 40                            # filtro simples para tirar o chiado
    return np.convolve(x, k, "same") * env(n, 0.01, dur * 0.6) * 0.22


def acorde(freqs, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.4 * t)) for f in freqs)
    return x * np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4) * 0.05


def trilha():
    """Trilha cinematográfica: pulso grave + pad menor; pausa dramática no 'Quem é líder, aparece' e volta forte no 'Bora'."""
    import json
    c = json.load(open(ROOT / "audio/cues.json"))
    m = np.zeros(N)
    beat = 60 / 100
    pausa, volta = c["quemelider"] - 0.25 + LEAD, c["bora"] + LEAD
    prog = ([110, 130.8, 164.8], [87.3, 110, 130.8], [130.8, 164.8, 196], [98, 123.5, 146.8])
    comp = beat * 8
    k = 0
    while k * comp < DUR:
        put(m, acorde(prog[k % 4], comp + 0.5) * 1.4, k * comp)
        k += 1
    b = 0
    while b * beat < DUR:
        tb = b * beat
        if not (pausa <= tb < volta):
            forte = tb >= volta
            put(m, kick() * (0.95 if forte else 0.75), tb)
            if tb > 1.4:
                put(m, hat() * (1.0 if forte else 0.7), tb + beat / 2)
                if forte:
                    put(m, hat() * 0.5, tb + beat / 4); put(m, hat() * 0.5, tb + 3 * beat / 4)
            nota = [55, 43.65, 65.4, 49][int(tb // comp) % 4]
            put(m, baixo(nota * 2, beat * 0.4), tb + beat / 2)
        b += 1
    # riser antes da volta e impacto grave na volta
    n = int(SR * 1.6); t = np.arange(n) / SR
    rs = rng.standard_normal(n); rs = np.convolve(rs, np.ones(12) / 12, "same") * (t / 1.6) ** 2 * 0.5
    put(m, rs, volta - 1.6)
    n = int(SR * 1.2); t = np.arange(n) / SR
    put(m, np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.5) * 1.2, volta)
    put(m, np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.5) * 0.8, pausa)
    return m


def sfx():
    return np.zeros(N)  # v2: sem efeitos por item, só trilha + voz
    s = np.zeros(N)
    def notif(t0):                                  # notificação de mensagem
        for k, f in enumerate((880, 1320)):
            n = int(SR * 0.18); t = np.arange(n) / SR
            put(s, np.sin(2 * np.pi * f * t) * env(n, 0.003, 0.06) * 0.35, t0 + k * 0.08)
    def erro(t0):                                   # buzz de erro
        n = int(SR * 0.32); t = np.arange(n) / SR
        put(s, np.sign(np.sin(2 * np.pi * 140 * t)) * env(n, 0.005, 0.12) * 0.18, t0)
    def whoosh(t0, d=0.45):
        n = int(SR * d); x = rng.standard_normal(n)
        x = np.convolve(x, np.ones(30) / 30, "same")
        put(s, x * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.9, t0 - d * 0.6)
    def impacto(t0):
        n = int(SR * 0.6); t = np.arange(n) / SR
        f = 40 + 80 * np.exp(-t / 0.05)
        put(s, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.25) * 0.8, t0)
    def sucesso(t0):                                # "ding" de nota emitida
        for k, f in enumerate((784, 988, 1319)):
            n = int(SR * 0.7); t = np.arange(n) / SR
            put(s, (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env(n, 0.003, 0.25) * 0.22, t0 + k * 0.07)
    def tique(t0):
        n = int(SR * 0.03); put(s, rng.standard_normal(n) * env(n, 0.001, 0.008) * 0.3, t0)
    erro(3.6)
    for t in (2.3, 10.7, 13.8, 17.4, 22.6, 26.9):
        whoosh(t)
    for t in (0.2, 3.6, 12.6, 16.65, 22.68):
        impacto(t)
    for t in (19.55, 20.2, 21.0, 21.75):
        whoosh(t + 0.25, 0.3)
    sucesso(24.75)
    sucesso(27.1)
    return s


def grava(nome, x):
    x = np.clip(x / max(1e-9, np.abs(x).max()) * 0.9, -1, 1)
    with wave.open(str(nome), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


if __name__ == "__main__":
    quadros, saida = sys.argv[1], sys.argv[2]
    aud = ROOT / "audio"
    m = trilha()
    s = sfx()
    s = np.roll(s, int(LEAD * SR))                 # efeitos seguem o tempo da locução
    grava(aud / "trilha.wav", m)
    grava(aud / "sfx.wav", s)
    voz = aud / "locucao.mp3"
    if voz.exists():
        ent = ["-i", str(voz)]
        fc = (f"[3:a]adelay={int(LEAD * 1000)}|{int(LEAD * 1000)},aresample=44100,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=90,"
              f"volume=2.0,apad,atrim=0:{DUR},asplit=2[v1][v2];[1:a]volume=0.20[m];[m][v1]sidechaincompress=threshold=0.03:ratio=5:release=250[md];"
              f"[2:a]volume=0.0[fx];[md][v2][fx]amix=inputs=3:duration=longest:normalize=0,")
    else:
        ent = []
        fc = "[1:a]volume=0.55[m];[2:a]volume=0.35[fx];[m][fx]amix=inputs=2:duration=longest:normalize=0,"
    fc += f"afade=t=out:st={DUR - 0.8}:d=0.8,loudnorm=I=-14:TP=-1.0,atrim=0:{DUR}[a]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", f"{quadros}/f_%05d.jpg",
                    "-i", str(aud / "trilha.wav"), "-i", str(aud / "sfx.wav"), *ent, "-filter_complex", fc,
                    "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", str(DUR), saida], check=True)
    print("OK ->", saida)
