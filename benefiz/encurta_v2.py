"""Encurta pausas longas da locução (mantém 0,25 s para não perder a emoção) e acelera 6%. Salva o mapa de tempo."""
import json
import subprocess
import wave

import numpy as np

SIL = [(0.421406, 0.910794), (2.76408, 3.27211), (4.46669, 4.96245), (5.38864, 5.71102), (6.68138, 7.1029), (8.88395, 9.29692), (10.8897, 11.2115), (11.9938, 12.3934), (13.2558, 13.5712), (15.03, 15.3646), (16.1246, 16.5532), (17.0365, 17.3801), (19.1233, 19.5174), (26.1722, 26.5042)]
KEEP, TEMPO = 0.25, 1.0
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "audio/v2_raw.mp3", "-ac", "1", "-ar", "44100", "audio/v2_raw.wav"], check=True)
with wave.open("audio/v2_raw.wav") as w:
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
with wave.open("audio/v2_curta.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(y.tobytes())
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "audio/v2_curta.wav", "-af", f"atempo={TEMPO}",
                "-c:a", "libmp3lame", "-b:a", "192k", "audio/locucao_v2.mp3"], check=True)
json.dump({"cuts": cuts, "tempo": TEMPO}, open("audio/mapa_tempo_v2.json", "w"))
print("duração final:", round(len(y) / sr / TEMPO, 2))
