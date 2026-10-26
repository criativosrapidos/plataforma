# v3: voz entra em 0,12s, 1,06x mais rápida; corta "Você não controla Brasília" (vira texto na tela: "a política").
import subprocess
SP = 1.06
SEG = [(0.00, 1.22, 0.12), (1.57, 4.82, 1.47), (5.24, 7.69, 4.72), (8.06, 18.68, 7.23), (20.97, 22.45, 18.2), (22.72, 26.80, 22.6)]
f = []; p = []
for i, (a, b, at) in enumerate(SEG):
    d = (b - a) / SP
    f.append(f'[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,atempo={SP},afade=t=in:d=0.015,afade=t=out:st={d - 0.03:.3f}:d=0.03,adelay={int(at * 1000)}[s{i}]')
    p.append(f'[s{i}]'); print(f'{at:6.2f} {at + d:6.2f}')
fc = ';'.join(f) + ';' + ''.join(p) + f'amix=inputs={len(SEG)}:normalize=0,apad,atrim=0:28[out]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'take2.mp3', '-filter_complex', fc, '-map', '[out]', '-ar', '48000', '-ac', '1', 'voice3.wav'], check=True)
