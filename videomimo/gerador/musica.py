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


# ---------------------------------------------------------------- SERTANEJO ROMANTICO
def violao(freq, dur, vel=1.0):
    """Corda dedilhada: harmonicos que decaem mais rapido quanto mais agudos + ataque."""
    t = np.arange(int(SR * dur)) / SR
    sig = np.zeros_like(t)
    for h in range(1, 9):
        f = freq * h * (1 + 0.0004 * h * h)
        sig += (1 / h ** 1.2) * np.exp(-t * (1.6 + 1.1 * h)) * np.sin(2 * np.pi * f * t + h)
    sig *= 1 - np.exp(-t * 900)
    return vel * sig * 0.6


def sanfona(freq, dur, vel=1.0):
    """Acordeon: dois registros levemente desafinados, vibrato e fole (envelope suave)."""
    t = np.arange(int(SR * dur)) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t)
    sig = np.zeros_like(t)
    for det in (1.0, 1.0035):
        fase = 2 * np.pi * freq * det * np.cumsum(vib) / SR
        for h in range(1, 10):
            sig += (0.9 ** h / h) * np.sin(h * fase)
    env = np.minimum(1, t / 0.06) * np.minimum(1, (dur - t) / 0.12).clip(0)
    return vel * env * sig * 0.35


def cajon(grave=True):
    n = int(SR * 0.25)
    t = np.arange(n) / SR
    if grave:
        return np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 40)) * t) * np.exp(-t * 14)
    ruido = np.random.default_rng(3).standard_normal(n)
    return (ruido - np.roll(ruido, 1)) * np.exp(-t * 28) * 0.5


def gerar_sertanejo(duracao, bpm=76, seed=8):
    rng = np.random.default_rng(seed)
    beat = 60 / bpm
    comp = 4 * beat
    tonica = 55  # Sol
    prog = [0, 4, 5, 3, 0, 4, 3, 4]  # G D Em C | G D C D
    buf = np.zeros(int(SR * (duracao + 4)))
    n_comp = int(np.ceil(duracao / comp))
    melodia_ant = 74
    for c in range(n_comp):
        t0 = c * comp
        grau = prog[c % len(prog)]
        notas = acorde(tonica, grau)
        parte = "intro" if c < 2 else ("verso" if c < 7 else ("refrao" if c < n_comp - 2 else "final"))
        # violao dedilhado: baixo - acorde - agudo - acorde (colcheias)
        cordas = [notas[0] - 12, notas[1], notas[2], notas[0] + 12, notas[1] + 12, notas[2], notas[0] + 12, notas[1]]
        for k, nota in enumerate(cordas):
            add(buf, violao(hz(nota), beat * 2, 0.9 if k % 2 == 0 else 0.65), t0 + k * beat / 2 + rng.uniform(0, 0.012))
        if parte != "intro":
            add(buf, 0.5 * piano(hz(notas[0] - 24), beat * 1.8), t0)
            add(buf, 0.4 * piano(hz(notas[2] - 24), beat * 1.6), t0 + 2 * beat)
        if parte in ("verso", "refrao"):
            for k in range(4):
                add(buf, (0.55 if k % 2 == 0 else 0.4) * cajon(k % 2 == 0), t0 + k * beat)
            for k in range(8):
                add(buf, shaker() * (0.8 if k % 2 else 0.4), t0 + k * beat / 2)
        if parte == "refrao":
            add(buf, 0.10 * pad([hz(n) for n in notas], comp + 0.5), t0)
            # melodia da sanfona: notas do acorde e da escala, sem saltos grandes
            ritmo = [(0, 1.5), (1.5, 0.5), (2, 1), (3, 1)] if c % 2 == 0 else [(0, 1), (1, 1), (2, 2)]
            for ini, d in ritmo:
                alvo = [n + 12 for n in notas] + [n + 24 for n in notas]
                cand = [n for n in alvo if abs(n - melodia_ant) <= 5] or alvo
                melodia_ant = cand[rng.integers(0, len(cand))]
                add(buf, sanfona(hz(melodia_ant), beat * d * 0.98, 0.8), t0 + ini * beat)
        if parte == "verso" and c % 2 == 1:
            add(buf, sanfona(hz(notas[2] + 12), beat * 2, 0.45), t0 + 2 * beat)
    if n_comp >= 1:
        final = acorde(tonica, 0)
        add(buf, 0.6 * violao(hz(final[0] - 12), 4), n_comp * comp)
        add(buf, sanfona(hz(final[0] + 12), 3, 0.6), n_comp * comp)
    out = buf.copy()
    for d, g in [(0.071, 0.22), (0.113, 0.16), (0.187, 0.11)]:
        s = int(d * SR)
        out[s:] += g * buf[:-s]
    out = out[: int(SR * duracao)]
    fade = int(SR * 3)
    out[-fade:] *= np.linspace(1, 0, fade)
    out /= np.max(np.abs(out)) + 1e-9
    return np.tanh(out * 1.3) * 0.88


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
    ap.add_argument("--estilo", choices=list(ESTILOS) + ["sertanejo"], default="romantico")
    a = ap.parse_args()
    sig = gerar_sertanejo(a.duracao) if a.estilo == "sertanejo" else gerar(a.duracao, a.estilo)
    salvar(a.saida, sig)
    print("ok", a.saida)
