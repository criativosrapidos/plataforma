"""Encurta pausas (>0.28 s) da locução para 0.18 s e acelera 4% (atempo, sem mudar o tom). Salva o mapa de tempo."""
import json
import subprocess
import wave

import numpy as np

SIL = [(3.40615, 3.6781), (4.74261, 5.06125), (7.55059, 7.76993), (9.54143, 9.92583), (12.0434, 12.3438), (14.4437, 14.7994), (15.3684, 15.641), (19.5264, 19.9385), (27.3509, 27.5696), (30.1099, 30.5394)]
KEEP, TEMPO = 0.15, 1.10
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
