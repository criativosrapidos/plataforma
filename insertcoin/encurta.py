"""Encurta pausas da locução (take Arnold) e acelera 3% (atempo). Gera audio/locucao.mp3 + audio/cues.json."""
import json
import subprocess
import wave

import numpy as np

SIL = [(1.249, 1.784), (4.429, 4.701), (9.369, 9.831), (23.929, 24.190), (27.620, 27.977), (31.135, 31.403)]
KEEP, TEMPO = 0.24, 1.08
W = {"atencao": 0.16, "brasilia": 0.693, "turma": 1.76, "suou": 2.32, "ralou": 2.88, "venceu": 3.36, "ganhar": 4.72, "brinde": 6.4, "gaveta": 8.68,
     "naone": 9.92, "essa": 10.587, "moeda": 12.24, "insert": 12.88, "moedas": 14.64, "distintivos": 15.2, "personalizados": 16.92, "3d": 17.84,
     "turmas": 19.68, "batalhoes": 21.2, "policias": 22.16, "forcas": 23.12, "arte": 24.32, "50": 25.92, "pronta": 28.0, "insert2": 30.32,
     "historia": 31.44, "metal": 33.2, "faca": 33.76, "fim": 35.6}
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
