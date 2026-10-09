#!/bin/bash
# Reposiciona as frases do take A nos tempos das cenas (s = início no take, e = fim, at = posição no vídeo, tempo = aceleração)
set -e
cd "$(dirname "$0")"
ffmpeg -y -v error -i takeA.mp3 -ar 48000 -ac 1 takeA.wav
segs=(
"0.00 1.98 0.12 1.0"
"1.98 7.16 2.70 1.0"
"7.16 9.22 7.90 1.0"
"9.22 13.88 10.38 1.0"
"13.88 19.40 15.40 1.0"
"19.40 22.04 21.40 1.0"
"22.04 27.90 24.30 1.04"
)
inputs=""; filt=""; i=0
for s in "${segs[@]}"; do read a b at t <<< "$s"
  ms=$(python3 -c "print(int($at*1000))")
  filt+="[0:a]atrim=$a:$b,asetpts=PTS-STARTPTS,atempo=$t,afade=t=in:d=0.02,afade=t=out:st=$(python3 -c "print(round(($b-$a)/$t-0.03,3))"):d=0.03,adelay=$ms[s$i];"
  i=$((i+1)); done
mix=""; for k in $(seq 0 $((i-1))); do mix+="[s$k]"; done
ffmpeg -y -v error -i takeA.wav -filter_complex "${filt}${mix}amix=inputs=$i:normalize=0,apad,atrim=0:30[out]" -map "[out]" -ar 48000 voice.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 voice.wav
