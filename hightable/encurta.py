"""Encurta pausas da locução (take Rômulo Franklin) e acelera 6% (atempo). Gera audio/locucao.mp3 + audio/cues.json."""
import json
import subprocess
import wave

import numpy as np

SIL = [(1.804, 2.809), (4.427, 4.752), (6.791, 7.409), (9.205, 9.621), (13.914, 14.290), (16.838, 17.095), (21.436, 21.889), (26.233, 26.594), (28.123, 28.525), (29.283, 29.576), (31.746, 32.158)]
KEEP, TEMPO = 0.28, 1.06
W = {"fala": 0.16, "sabe": 2.88, "negocio": 3.48, "nunca": 5.04, "escritorio": 5.84, "mesa": 7.44, "chegou": 9.68, "high": 10.36,
     "conexoes": 11.28, "dia": 14.32, "tres": 15.76, "estacionamento": 17.2, "carro": 22.05, "van": 23.72, "cervejaria": 25.12,
     "retorno": 26.72, "realizacao": 28.56, "lideres": 29.64, "chopp": 30.96, "confirma": 32.36, "fortalecer": 33.6, "fim": 35.44}
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
