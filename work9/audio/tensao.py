# Trilha de tensão do gancho (5s, sintetizada, sem licença): bumbo acelerando como apuração acirrada,
# tique de contagem, subida (riser) e um "boom" no fim. Grava sfx_tensao.wav e sfx_boom.wav.
import numpy as np, wave
SR = 48000
rng = np.random.default_rng(3)

def save(name, x, peak=0.9):
    x = x / (np.abs(x).max() + 1e-9) * peak
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())

def kick(d=0.35):
    t = np.arange(int(SR * d)) / SR
    f = 50 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)

def tick(d=0.03):
    t = np.arange(int(SR * d)) / SR
    return np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 220)

D = 5.0; n = int(SR * D); out = np.zeros(n)
# bumbo: intervalo cai de 0,5s para 0,12s (coração acelerando)
tt, k = 0.0, kick()
while tt < D - 0.4:
    i = int(tt * SR); seg = k[: n - i]; out[i:i + len(seg)] += 0.9 * seg
    tt += 0.5 - 0.38 * (tt / D)
# tique de relógio a cada 0,25s, ficando mais forte
tk = tick()
for j, tt in enumerate(np.arange(0, D - 0.3, 0.25)):
    i = int(tt * SR); out[i:i + len(tk)] += (0.15 + 0.35 * tt / D) * tk
# riser: ruído filtrado + seno subindo
t = np.arange(n) / SR
f = 120 + 900 * (t / D) ** 2
riser = 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / D) ** 1.5
noise = rng.standard_normal(n); a = np.exp(-2 * np.pi * (500 + 5000 * (t / D) ** 2) / SR); y = np.zeros(n); z = 0.0
for i in range(n): z = (1 - a[i]) * noise[i] + a[i] * z; y[i] = z
out += riser + 0.6 * y * (t / D) ** 2
# drone grave de fundo
out += 0.18 * np.sin(2 * np.pi * 55 * t) * np.minimum(1, t / 0.5)
out *= np.minimum(1, (D - t) / 0.08)
save('sfx_tensao.wav', out, 0.85)
# boom: impacto grave longo
tb = np.arange(int(SR * 1.4)) / SR
boom = np.sin(2 * np.pi * np.cumsum(40 + 80 * np.exp(-tb * 12)) / SR) * np.exp(-tb * 3) + 0.4 * rng.standard_normal(len(tb)) * np.exp(-tb * 25)
save('sfx_boom.wav', boom)
print('ok')
