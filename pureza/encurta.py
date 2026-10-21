"""Encurta pausas da locução (take Rômulo Franklin) e acelera 14% (atempo). Gera audio/locucao.mp3 + audio/cues.json."""
import json
import subprocess
import wave

import numpy as np

SIL = [(3.291, 3.690), (6.724, 6.988), (9.391, 9.796), (11.362, 11.733), (15.017, 15.270), (17.257, 17.616), (29.518, 29.795)]
KEEP, TEMPO = 0.24, 1.14
W = {"brasilia": 0.137, "iphone": 1.12, "pureza": 2.72, "quer": 3.733, "caro": 6.48, "cair": 7.36, "some": 8.32, "ninguem": 10.28,
     "imagina": 12.08, "mao": 14.64, "seguranca": 15.52, "preco": 16.48, "pro": 17.68, "256": 19.0, "p8700": 20.88, "promax": 23.2,
     "p9700": 25.04, "cores": 26.69, "preto": 27.28, "silver": 28.12, "azul": 28.64, "bordo": 29.12, "desde": 30.11, "feira": 31.36,
     "bloco": 32.72, "chama": 34.96, "whats": 35.92, "garante": 36.96, "fim": 38.0}
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "audio/take.mp3", "-ac", "1", "-ar", "44100", "audio/raw.wav"], check=True)
with wave.open("audio/raw.wav") as w:
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16)
cuts, parts, pos = [], [], 0
for a, b in SIL:
    ka, kb = a + KEEP / 2, b - KEEP / 2
    parts.append(x[int(pos * sr):int(ka * sr)])
    cuts.append((ka, kb - ka))
    pos = kb
parts.append(x[int(pos * sr):])
y = np.concatenate(parts)
with wave.open("audio/curta.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(y.tobytes())
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "audio/curta.wav", "-af", f"atempo={TEMPO}",
                "-c:a", "libmp3lame", "-b:a", "192k", "audio/locucao.mp3"], check=True)
mapa = lambda t: round((t - sum(d for a, d in cuts if a < t)) / TEMPO, 3)
json.dump({k: mapa(v) for k, v in W.items()}, open("audio/cues.json", "w"), indent=1)
print("duração final:", round(len(y) / sr / TEMPO, 2))
