"""Encurta pausas longas (>0.30 s) da locução e acelera 5% (atempo, sem mudar o tom). Gera o mapa de tempo."""
import json, subprocess, wave
import numpy as np

SIL = [(7.939, 8.438), (9.322, 9.699), (11.167, 11.578), (12.907, 13.413), (16.130, 16.548), (23.930, 24.553)]
KEEP, TEMPO = 0.30, 1.05

subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "audio/locucao_raw.mp3", "-ac", "1", "-ar", "44100",
                "audio/raw.wav"], check=True)
with wave.open("audio/raw.wav") as w:
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16)
cuts = []  # (início do trecho removido, duração removida) em segundos do áudio original
parts, pos = [], 0
for a, b in SIL:
    keep_a = a + KEEP / 2
    keep_b = b - KEEP / 2
    parts.append(x[int(pos * sr):int(keep_a * sr)])
    cuts.append((keep_a, keep_b - keep_a))
    pos = keep_b
parts.append(x[int(pos * sr):])
y = np.concatenate(parts)
with wave.open("audio/curta.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(y.tobytes())
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "audio/curta.wav", "-af", f"atempo={TEMPO}",
                "-c:a", "libmp3lame", "-b:a", "192k", "audio/locucao.mp3"], check=True)
json.dump({"cuts": cuts, "tempo": TEMPO}, open("audio/mapa_tempo.json", "w"))
print("duração final:", len(y) / sr / TEMPO)
