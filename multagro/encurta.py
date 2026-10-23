"""Encurta pausas (>0.28 s) da locução para 0.18 s e acelera 4% (atempo, sem mudar o tom). Salva o mapa de tempo."""
import json
import subprocess
import wave

import numpy as np

SIL = [(7.7098, 8.08231), (11.0219, 11.4403), (16.2266, 16.5689), (19.1685, 19.4979), (21.0856, 21.5085),
       (25.6538, 26.0212), (27.1795, 27.5417), (29.7073, 30.0067)]
KEEP, TEMPO = 0.18, 1.04
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "audio/locucao_raw.mp3", "-ac", "1", "-ar", "44100", "audio/raw.wav"], check=True)
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
json.dump({"cuts": cuts, "tempo": TEMPO}, open("audio/mapa_tempo.json", "w"))
print("duração final:", round(len(y) / sr / TEMPO, 2))
