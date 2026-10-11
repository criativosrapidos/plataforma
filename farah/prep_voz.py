#!/usr/bin/env python3
"""Prepara uma take do ElevenLabs: tira as tags de direção da lista de palavras (Scribe),
ajusta o início das palavras que vêm depois de uma tag pela pausa real, normaliza o volume.
Uso: python3 prep_voz.py take.mp3 palavras_scribe.json saida.mp3 palavras_saida.json
palavras_scribe.json = lista [[texto, inicio, fim], ...] ou [{"text","start","end"}, ...]"""
import json, re, subprocess, sys
take, entrada, saida_mp3, saida_json = sys.argv[1:5]
raw = json.load(open(entrada))
raw = [(w["text"], w["start"], w["end"]) if isinstance(w, dict) else tuple(w) for w in raw]
err = subprocess.run(['ffmpeg', '-hide_banner', '-i', take, '-af', 'silencedetect=noise=-38dB:d=0.06', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
onsets = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]
words, pend = [], None
for t, a, b in raw:
    if t.startswith('['): pend = a; continue
    if pend is not None:
        c = [o for o in onsets if pend - 0.12 <= o <= a + 0.05]
        a = min(c) if c else pend; pend = None
    words.append((t, a, b))
LEAD = 0.10
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', take, '-af', f'adelay={int(LEAD*1000)},highpass=f=70,'
                'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,loudnorm=I=-14:TP=-1.5:LRA=7,aresample=48000',
                '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '256k', saida_mp3], check=True)
json.dump([{'word': t, 'start': round(a + LEAD, 3), 'end': round(b + LEAD, 3)} for t, a, b in words],
          open(saida_json, 'w'), ensure_ascii=False, indent=0)
print(len(words), 'palavras')
