# SFX sintetizados (originais, sem licença de terceiros): whoosh, risco e clique
import numpy as np, wave, sys
SR = 48000
rng = np.random.default_rng(7)

def save(name, x):
    x = np.clip(x / (np.abs(x).max() + 1e-9) * 0.9, -1, 1)
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def onepole(x, fc):  # passa-baixa com corte variável no tempo
    y = np.zeros_like(x); a = np.exp(-2 * np.pi * fc / SR); z = 0.0
    for i in range(len(x)):
        z = (1 - a[i]) * x[i] + a[i] * z; y[i] = z
    return y

def whoosh(d=0.45):
    n = int(SR * d); t = np.linspace(0, 1, n)
    env = np.sin(np.pi * t ** 0.6) ** 2
    fc = 300 + 5000 * np.sin(np.pi * t) ** 2
    lp = onepole(rng.standard_normal(n), fc)
    hp = lp - onepole(lp, np.full(n, 150.0))
    return hp * env

def scratch(d=0.22):
    n = int(SR * d); t = np.linspace(0, 1, n)
    env = np.exp(-3 * t) * (1 - np.exp(-60 * t))
    noise = rng.standard_normal(n)
    band = onepole(noise, np.full(n, 6000.0)) - onepole(noise, np.full(n, 1800.0))
    grit = 1 + 0.6 * np.sign(np.sin(2 * np.pi * 38 * np.arange(n) / SR))
    return band * env * grit

def click(d=0.06):
    n = int(SR * d); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 140) + 0.5 * np.sin(2 * np.pi * 900 * t) * np.exp(-t * 90))

save('sfx_whoosh.wav', whoosh()); save('sfx_risco.wav', scratch()); save('sfx_click.wav', click())
print('ok')
