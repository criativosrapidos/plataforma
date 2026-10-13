"""Encurta pausas longas da locução (mantém 0,25 s para não perder a emoção) e acelera 6%. Salva o mapa de tempo."""
import json
import subprocess
import wave

import numpy as np

SIL = [(1.68338, 2.05297), (2.08104, 2.42429), (4.87127, 5.39517), (8.01107, 8.54868), (9.53923, 9.97946), (12.4405, 13.2693), (16.0066, 16.592), (19.1361, 19.5752), (26.3589, 26.9864), (30.8599, 31.5237), (34.5251, 35.143), (35.8694, 36.2157)]
KEEP, TEMPO = 0.25, 1.06
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
