#!/bin/bash
# Mixagem do tutorial: voz + whoosh nos passos, clique em cada toque, "pling" nas confirmações. −14 LUFS.
set -e
cd "$(dirname "$0")"
D=99
in=(-i locucao.mp3); f=""; n=1; labels="[0:a]"
add() { in+=(-i "$1"); f+="[$n:a]adelay=$(python3 -c "print(max(0,int(($2-$3)*1000)))"):all=1,volume=$4[x$n];"; labels+="[x$n]"; n=$((n+1)); }
for t in 11.4 31.0 46.2 59.1 72.9 89.0; do add sfx_whoosh.wav $t 0.18 0.35; done
for t in 18.1 20.6 23.0 25.6 27.9 29.7 37.0 43.2 45.0 50.8 52.3 53.6 58.2 64.3 66.4 69.3 70.6 78.9 80.7 82.6 86.7 88.3; do add sfx_click.wav $t 0.0 0.55; done
for t in 30.2 45.3 58.5 71.1 88.5 89.2; do add sfx_impact.wav $t 0.0 0.25; done
f+="${labels}amix=inputs=$n:normalize=0,apad,atrim=0:$D[pre]"
ffmpeg -y -v error "${in[@]}" -filter_complex "$f" -map "[pre]" -ar 48000 -ac 2 premix.wav
J=$(ffmpeg -hide_banner -i premix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -v error -i premix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 final_audio.wav
