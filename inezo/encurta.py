"""Encurta pausas da locução (take Nassif) e acelera 3% (atempo). Gera audio/locucao.mp3 + audio/cues.json."""
import json
import subprocess
import wave

import numpy as np

SIL = [(2.354, 2.776), (4.638, 5.506), (9.435, 10.018), (17.775, 18.168), (26.122, 26.459), (28.592, 28.922)]
KEEP, TEMPO = 0.22, 1.03
W = {"obra": 0.133, "parada": 0.3, "pedreiro": 1.18, "orcamento": 2.88, "aumenta": 3.989, "quem": 5.995, "dor": 7.58,
     "comeco": 8.48, "agora": 10.053, "engenheiro": 11.48, "projeto": 13.03, "prazo": 13.787, "acomp": 14.444, "na": 16.707,
     "inezo": 16.8, "construcao": 17.863, "reforma": 18.971, "regular": 19.65, "habite": 20.66, "laudos": 21.547,
     "manut": 22.12, "tudo": 23.56, "aqui": 25.008, "chama": 26.547, "whats": 26.853, "pede": 27.42, "inezo2": 28.72,
     "construindo": 29.509, "seguranca": 31.02, "fim": 31.84}
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "audio/take_a.mp3", "-ac", "1", "-ar", "44100", "audio/raw.wav"], check=True)
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
