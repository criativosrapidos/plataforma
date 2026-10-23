"""Encurta pausas da locução (take Arnold) e acelera 3% (atempo). Gera audio/locucao.mp3 + audio/cues.json."""
import json
import subprocess
import wave

import numpy as np

SIL = [(2.370, 2.683), (6.139, 6.533), (9.060, 9.465), (14.180, 14.576), (17.946, 18.439), (22.184, 22.594), (24.483, 25.074), (25.993, 26.368), (27.701, 28.207), (29.633, 30.029)]
KEEP, TEMPO = 0.28, 1.05
W = {"sua": 0.147, "ia": 1.0, "sem": 2.78, "regra": 3.413, "socio": 4.21, "contrato": 5.441, "dados": 6.43, "protecao": 8.383,
     "mundo": 9.495, "decisao": 11.104, "pequena": 11.499, "grande": 12.72, "problema": 13.175, "na": 14.558, "estrela": 14.631,
     "complex": 16.381, "motiva": 17.351, "empresarial": 18.697, "societario": 19.547, "lgpd": 20.571, "trabalhista": 21.497,
     "estrategia": 22.635, "desafio": 23.891, "antes": 25.016, "converse": 26.247, "estrela2": 27.936, "direito2": 29.744,
     "complexos": 31.996, "fim": 32.82}
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
