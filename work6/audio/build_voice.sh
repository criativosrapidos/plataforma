#!/bin/bash
# Monta a locução: trechos novos (take_novo, gerado pra este vídeo) + trechos do take do vídeo 1 (mesma voz, Matheus)
# formato: arquivo início fim posição_no_vídeo velocidade
set -e
cd "$(dirname "$0")"
segs=(
"N 0.00 2.70 0.10 1.0"    # Você tem negócio e não tem agência?
"N 3.05 3.90 3.00 1.0"    # Presta atenção.
"A 2.25 8.05 4.15 1.04"   # Gravar. Editar. Postar. Toda semana... não cabe na sua rotina.
"N 4.27 8.90 9.90 1.0"    # Imagina seu Instagram postando todo dia, com cara de marca grande.
"A 8.30 9.78 14.75 1.0"   # A gente cria pra você.
"A 14.27 19.00 16.45 1.0" # Você manda as informações do seu negócio... e recebe em até vinte e quatro horas.
"N 9.12 12.30 21.45 1.0"  # Sem contrato, a partir de noventa e sete reais.
"A 22.05 23.90 24.90 1.0" # Criativos Rápidos.
"N 12.52 14.44 26.95 1.0" # Responde essa mensagem agora!
)
ffmpeg -y -v error -i take_novo.mp3 -ar 48000 -ac 1 N.wav
ffmpeg -y -v error -i take_antigo.mp3 -ar 48000 -ac 1 A.wav
filt=""; i=0
for s in "${segs[@]}"; do read src a b at t <<< "$s"
  idx=$([ "$src" = N ] && echo 0 || echo 1)
  ms=$(python3 -c "print(int($at*1000))")
  st=$(python3 -c "print(round(($b-$a)/$t-0.04,3))")
  filt+="[$idx:a]atrim=$a:$b,asetpts=PTS-STARTPTS,atempo=$t,afade=t=in:d=0.02,afade=t=out:st=$st:d=0.04,adelay=$ms[s$i];"
  i=$((i+1)); done
mix=""; for k in $(seq 0 $((i-1))); do mix+="[s$k]"; done
ffmpeg -y -v error -i N.wav -i A.wav -filter_complex "${filt}${mix}amix=inputs=$i:normalize=0,apad,atrim=0:30[out]" -map "[out]" -ar 48000 voice.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 voice.wav
