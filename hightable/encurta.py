"""Encurta pausas da locução (take Gustavo Sancho) e acelera 5% (atempo). Gera audio/locucao.mp3 + audio/cues.json."""
import json
import subprocess
import wave

import numpy as np

SIL = [(2.884, 3.264), (5.513, 5.879), (7.912, 8.668), (9.298, 9.836), (14.078, 14.525), (18.172, 18.548), (20.898, 21.296), (23.722, 24.118), (27.790, 28.251)]
KEEP, TEMPO = 0.26, 1.05
W = {"brasilia": 0.137, "iphone": 0.8, "pureza": 2.08, "quer": 3.253, "caro": 5.28, "cair": 6.08, "some": 6.88, "ninguem": 8.693,
     "imagina": 10.12, "mao": 11.92, "seguranca": 12.64, "preco": 13.6, "pro": 14.56, "256": 15.72, "p8700": 16.96, "promax": 18.64,
     "p9700": 19.84, "cores": 21.28, "preto": 21.76, "silver": 22.24, "azul": 22.84, "bordo": 23.36, "desde": 24.28, "feira": 25.44,
     "bloco": 26.48, "chama": 28.307, "whats": 29.08, "garante": 29.64, "fim": 30.48}
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
