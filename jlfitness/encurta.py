"""Encurta pausas da locução (take Rômulo Franklin) e acelera 6% (atempo). Gera audio/locucao.mp3 + audio/cues.json."""
import json
import subprocess
import wave

import numpy as np

SIL = [(2.086, 2.442), (5.554, 5.835), (7.116, 7.633), (10.165, 10.632), (12.044, 12.501), (18.718, 19.061), (24.285, 24.592), (30.251, 30.587)]
KEEP, TEMPO = 0.26, 1.06
W = {"atencao": 0.137, "aguas": 1.24, "paga": 2.72, "caro": 3.6, "academia": 4.44, "vazia": 6.24, "falta": 8.12, "animo": 9.39,
     "esteira": 10.88, "cabide": 11.52, "imagina": 12.55, "condominio": 14.16, "professor": 15.56, "vizinhos": 17.44, "jl": 19.2,
     "grupo": 20.56, "danca": 21.68, "along": 22.16, "predio": 23.2, "idades": 24.61, "mostra": 26.37, "sindico": 27.44, "chama": 28.24,
     "insta": 29.76, "bora": 30.64, "fim": 32.08}
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
