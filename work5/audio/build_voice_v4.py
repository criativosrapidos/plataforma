"""Voz v4 (30s): emenda trechos do take v2 (38s) com a frase de preço do take v1 (mesma voz Bea),
acelera 6% e imprime o tempo de cada trecho no vídeo."""
import subprocess, json
V2, V1 = 'take_v2_38s.mp3', 'take1_alessandra.mp3'
SEGS = [  # (arquivo, início, fim, rótulo)
    (V2, 0.00, 1.82, 'atencao'),
    (V2, 2.06, 7.58, 'dor'),
    (V2, 7.86, 10.02, 'melasma'),
    (V2, 14.04, 17.30, 'sonho'),
    (V2, 19.48, 25.78, 'solucao'),
    (V1, 11.86, 18.34, 'preco'),
    (V2, 33.40, 38.00, 'convite'),
]
GAP, TEMPO, LEAD, DUR = 0.03, 1.06, 0.1, 30.0

def rms(f, a, b):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-ss', str(a), '-to', str(b), '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(out.split('mean_volume: ')[1].split(' dB')[0])

ref = rms(V2, 0, 38)
filt, labels, t, starts = [], [], 0.0, {}
for i, (f, a, b, name) in enumerate(SEGS):
    idx = 0 if f == V2 else 1
    gain = ref - rms(f, a, b) if f == V1 else 0.0
    filt.append(f'[{idx}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,volume={gain:.2f}dB,afade=t=in:d=0.03,afade=t=out:st={b-a-0.05:.3f}:d=0.05,apad=pad_dur={GAP}[s{i}]')
    labels.append(f'[s{i}]')
    starts[name] = (t, a)
    t += (b - a) + GAP
filt.append(''.join(labels) + f'concat=n={len(SEGS)}:v=0:a=1,atempo={TEMPO},adelay={int(LEAD*1000)}:all=1,apad=whole_dur={DUR},atrim=0:{DUR}[o]')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', V2, '-i', V1, '-filter_complex', ';'.join(filt), '-map', '[o]', '-ar', '48000', '-ac', '1', 'voice.wav'], check=True)
# mapeia tempo original -> tempo no vídeo
mapping = {name: {'pos': round(pos / TEMPO + LEAD, 3), 'orig_start': a} for name, (pos, a) in starts.items()}
json.dump(mapping, open('voice_v4_map.json', 'w'), indent=1)
print(json.dumps(mapping, indent=1)); print('fala termina em', round(t / TEMPO + LEAD, 2))
