# Aperta as pausas do take e acelera 7%: imprime onde cada frase cai no vídeo.
import subprocess
SP = 1.07
SEG = [  # (início, fim, pausa depois, frase)
 (0.00, 2.12, 0.25, 'A eleição acabou.'),
 (2.43, 5.47, 0.30, 'E talvez o resultado não tenha sido o que você queria.'),
 (5.93, 6.93, 0.15, 'Mas presta atenção:'),
 (7.33, 9.54, 0.22, 'o seu boleto vence do mesmo jeito.'),
 (9.91, 12.18, 0.15, 'Aluguel, fornecedor, funcionário...'),
 (12.54, 14.65, 0.30, 'nenhum político vai pagar isso por você.'),
 (15.10, 17.29, 0.18, 'Quem fica esperando o país melhorar pra vender...'),
 (17.75, 18.67, 0.40, 'vai ficar esperando.'),
 (19.14, 24.30, 0.22, 'Olha a nossa cliente Alessandra: com 97 reais, fez um anúncio em vídeo com a gente.'),
 (24.65, 29.15, 0.40, 'Em menos de 24 horas... mais de 1.500 reais em vendas.'),
 (29.50, 31.23, 0.15, 'Você não controla Brasília.'),
 (31.56, 33.00, 0.25, 'Mas controla o seu marketing.'),
 (33.32, 35.94, 0.30, 'Seu faturamento não pode depender de político.'),
 (36.29, 41.70, 0.0, 'Anúncio em vídeo por 97 reais. Clica no botão e chama a gente no WhatsApp agora.'),
]
t = 0.08; filt = []; parts = []
for i, (a, b, gap, s) in enumerate(SEG):
    d = (b - a) / SP
    print(f'{t:6.2f} {t + d:6.2f}  {s}')
    filt.append(f'[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,atempo={SP},afade=t=in:d=0.015,afade=t=out:st={d - 0.03:.3f}:d=0.03,adelay={int(t * 1000)}[s{i}]')
    parts.append(f'[s{i}]'); t += d + gap
DUR = round(t + 1.2, 2)
print('DURACAO', DUR)
fc = ';'.join(filt) + ';' + ''.join(parts) + f'amix=inputs={len(SEG)}:normalize=0,apad,atrim=0:{DUR}[out]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'take.mp3', '-filter_complex', fc, '-map', '[out]', '-ar', '48000', '-ac', '1', 'voice.wav'], check=True)
