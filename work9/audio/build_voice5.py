# v5 (= v4 com a frase nova "Você não controla a política!"): voz desde 0,12s (1,06x). Ordem: eleição → boleto → "você não controla..." (+ "A POLÍTICA" na tela)
# → "mas controla o seu marketing" → case → CTA → "Faça como a Alessandra!" (take novo).
import subprocess
SP = 1.06
import sys
PA, PB = float(sys.argv[1]), float(sys.argv[2])
SEG = [('take2.mp3', 0.00, 1.22, 0.12), ('take2.mp3', 1.57, 4.82, 1.47), ('take2.mp3', 5.24, 7.69, 4.72),
       ('politica.mp3', PA, PB, 7.3), ('take2.mp3', 20.97, 22.45, 9.2), ('take2.mp3', 8.06, 18.68, 10.8),
       ('take2.mp3', 22.72, 26.80, 22.0), ('faca.mp3', 0.0, 1.68, 26.15)]
ins = []; srcs = []
for f in [s[0] for s in SEG]:
    if f not in srcs: srcs.append(f)
for f in srcs: ins += ['-i', f]
fc = []; p = []
for i, (f, a, b, at) in enumerate(SEG):
    sp = 1.15 if f == 'politica.mp3' else SP  # frase nova um pouco mais rápida pra caber antes do case
    d = (b - a) / sp
    fc.append(f'[{srcs.index(f)}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,aresample=48000,atempo={sp},afade=t=in:d=0.015,afade=t=out:st={d - 0.03:.3f}:d=0.03,adelay={int(at * 1000)}[s{i}]')
    p.append(f'[s{i}]'); print(f'{at:6.2f} {at + d:6.2f} {f} {a}-{b}')
graph = ';'.join(fc) + ';' + ''.join(p) + f'amix=inputs={len(SEG)}:normalize=0,apad,atrim=0:29[out]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', graph, '-map', '[out]', '-ar', '48000', '-ac', '1', 'voice5.wav'], check=True)
