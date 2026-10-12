"""Gera uma trilha instrumental original (sem direitos autorais de terceiros).

Uso: python3 musica.py saida.wav --duracao 60 --estilo romantico|festa|emocionante
"""
import argparse
import wave

import numpy as np

SR = 44100

ESTILOS = {
    # bpm, tonica (MIDI), progressao em graus da escala maior, brilho
    "romantico": dict(bpm=76, tonica=60, prog=[0, 5, 3, 4], brilho=0.6),
    "emocionante": dict(bpm=84, tonica=62, prog=[5, 3, 0, 4], brilho=0.8),
    "festa": dict(bpm=112, tonica=65, prog=[0, 4, 5, 3], brilho=1.0),
}
ESCALA = [0, 2, 4, 5, 7, 9, 11]


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def acorde(tonica, grau):
    return [tonica + ESCALA[(grau + i) % 7] + 12 * ((grau + i) // 7) for i in (0, 2, 4)]


def piano(freq, dur, vel=1.0):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t * 2.8) * (1 - np.exp(-t * 400))
    sig = sum(a * np.sin(2 * np.pi * freq * h * t) for h, a in [(1, 1), (2, 0.45), (3, 0.18), (4, 0.08)])
    return vel * env * sig


def pad(freqs, dur):
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 0.8)
    sig = sum(np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.003 * t) for f in freqs)
    return env * sig / len(freqs)


def kick(dur=0.35):
    t = np.arange(int(SR * dur)) / SR
    return np.sin(2 * np.pi * (50 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9)


def shaker(dur=0.08, rng=np.random.default_rng(7)):
    n = int(SR * dur)
    return rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 60) * 0.25


def add(buf, sig, start):
    i = int(start * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i]


def gerar(duracao, estilo):
    cfg = ESTILOS[estilo]
    beat = 60 / cfg["bpm"]
    compasso = beat * 4
    buf = np.zeros(int(SR * (duracao + 3)))
    rng = np.random.default_rng(42)
    n_comp = int(np.ceil(duracao / compasso))
    for c in range(n_comp):
        t0 = c * compasso
        notas = acorde(cfg["tonica"], cfg["prog"][c % 4])
        secao = 0 if c < 4 else (1 if c < n_comp - 4 else 2)  # intro, corpo, final
        add(buf, 0.18 * pad([hz(n - 12) for n in notas], compasso + 0.6), t0)
        add(buf, 0.35 * piano(hz(notas[0] - 24), compasso * 0.9), t0)
        # arpejo
        padrao = [0, 1, 2, 1, 0, 2, 1, 2] if estilo != "festa" else [0, 2, 1, 2] * 2
        for k, idx in enumerate(padrao):
            add(buf, 0.22 * cfg["brilho"] * piano(hz(notas[idx] + 12), beat * 1.5, 0.8 + 0.2 * rng.random()), t0 + k * beat / 2)
        # melodia simples no corpo
        if secao == 1:
            for k in range(4):
                if rng.random() < 0.7:
                    nota = notas[rng.integers(0, 3)] + 12 + (12 if rng.random() < 0.3 else 0)
                    add(buf, 0.28 * piano(hz(nota), beat * 2), t0 + k * beat)
            add(buf, 0.5 * kick(), t0)
            add(buf, 0.4 * kick(), t0 + 2 * beat)
            if estilo == "festa":
                add(buf, 0.45 * kick(), t0 + beat)
                add(buf, 0.45 * kick(), t0 + 3 * beat)
            for k in range(8):
                add(buf, shaker() * (1 if k % 2 else 0.5), t0 + k * beat / 2)
    # reverb simples (ecos)
    out = buf.copy()
    for d, g in [(0.083, 0.3), (0.137, 0.22), (0.211, 0.16), (0.293, 0.1)]:
        s = int(d * SR)
        out[s:] += g * buf[:-s]
    out = out[: int(SR * duracao)]
    fade = int(SR * 2.5)
    out[:int(SR * 0.5)] *= np.linspace(0, 1, int(SR * 0.5))
    out[-fade:] *= np.linspace(1, 0, fade)
    out /= np.max(np.abs(out)) + 1e-9
    return np.tanh(out * 1.2) * 0.85


def salvar(path, sig):
    est = np.stack([sig, np.roll(sig, 220)], axis=1)  # leve abertura estereo
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((est * 32767).astype(np.int16).tobytes())


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("saida")
    ap.add_argument("--duracao", type=float, default=60)
    ap.add_argument("--estilo", choices=ESTILOS, default="romantico")
    a = ap.parse_args()
    salvar(a.saida, gerar(a.duracao, a.estilo))
    print("ok", a.saida)
