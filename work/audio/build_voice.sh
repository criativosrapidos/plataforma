#!/bin/bash
# Reposiciona as frases do take final (take 1) nos tempos das cenas (s = início no take, e = fim, at = posição no vídeo, tempo = aceleração)
set -e
cd "$(dirname "$0")"
ffmpeg -y -v error -i take1_final.mp3 -ar 48000 -ac 1 take1.wav
segs=(
"0.00 2.20 0.04 1.0"
"2.20 8.24 2.68 1.06"
"8.24 10.06 8.40 1.0"
"10.06 14.20 10.45 1.0"
"14.20 19.26 15.40 1.0"
"19.26 21.98 21.40 1.0"
"21.98 25.31 25.00 1.0"
)
inputs=""; filt=""; i=0
for s in "${segs[@]}"; do read a b at t <<< "$s"
  ms=$(python3 -c "print(int($at*1000))")
  filt+="[0:a]atrim=$a:$b,asetpts=PTS-STARTPTS,atempo=$t,afade=t=in:d=0.02,afade=t=out:st=$(python3 -c "print(round(($b-$a)/$t-0.03,3))"):d=0.03,adelay=$ms[s$i];"
  i=$((i+1)); done
mix=""; for k in $(seq 0 $((i-1))); do mix+="[s$k]"; done
ffmpeg -y -v error -i take1.wav -filter_complex "${filt}${mix}amix=inputs=$i:normalize=0,apad,atrim=0:30[out]" -map "[out]" -ar 48000 voice.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 voice.wav
