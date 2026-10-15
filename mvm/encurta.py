"""Encurta pausas da locução (take Roberta) e acelera 3% (atempo). Gera audio/locucao.mp3 + audio/cues.json."""
import json
import subprocess
import wave

import numpy as np

SIL = [(4.527, 4.919), (6.818, 7.161), (9.030, 9.330), (11.477, 12.185), (12.604, 12.991), (13.737, 14.133), (17.646, 18.099), (22.686, 23.092), (25.039, 25.457), (27.539, 27.837), (31.279, 31.552), (32.674, 32.979)]
KEEP, TEMPO = 0.24, 1.06
W = {"atencao": 0.08, "ceilandia": 0.72, "chegou": 2.64, "pedaco": 3.92, "vista": 5.2, "cansada": 5.84, "letrinha": 7.12, "embacando": 8.08,
     "oculos": 9.36, "olhos": 10.4, "cara": 11.04, "pois": 12.16, "acabou": 13.04, "chegou2": 14.16, "mvm": 14.72, "brasilidade": 15.92,
     "olhar": 17.36, "armacao": 18.08, "lente": 19.84, "preco": 20.96, "bolso": 22.32, "porque": 23.04, "todo": 24.16, "corre": 25.44,
     "shopping": 26.16, "ceilandia2": 26.96, "box": 27.84, "inauguracao": 30.0, "mvm2": 31.68, "vemver": 32.96, "fim": 34.8}
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
