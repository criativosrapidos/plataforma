# SFX de glitch digital (rajadas de ruído picotado e tom quadrado) — sintetizado, sem licença.
import numpy as np, wave
SR = 48000; rng = np.random.default_rng(11)
n = int(SR * 0.45); t = np.arange(n) / SR; x = np.zeros(n)
for k in range(9):
    a = int(rng.uniform(0, 0.4) * SR); L = int(rng.uniform(0.01, 0.05) * SR)
    f = rng.uniform(200, 2400); seg = np.sign(np.sin(2 * np.pi * f * np.arange(L) / SR)) * 0.6 + rng.standard_normal(L) * 0.5
    x[a:a + L] += seg[: max(0, min(L, n - a))]
x = np.round(x * 6) / 6  # "bitcrush"
x *= np.exp(-t * 3)
x = x / (np.abs(x).max() + 1e-9) * 0.8
with wave.open('sfx_glitch.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
print('ok')
