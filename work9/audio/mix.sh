#!/bin/bash
# Mixagem: voz + SFX e normalização em −14 LUFS (2 passadas). Duração 39s.
set -e
cd "$(dirname "$0")"
D=39
W=(5.4 13.3 16.8 26.45 32.55); I=(0.7 5.45 7.8 11.1 15.6 19.4 24.85 27.6 34.2); R=(27.6); K=(37.0)
in=(-i voice.wav); f=""; n=1; labels="[0:a]"
add() { in+=(-i "$1"); f+="[$n:a]adelay=$(python3 -c "print(max(0,int(($2-$3)*1000)))"):all=1,volume=$4[x$n];"; labels+="[x$n]"; n=$((n+1)); }
for t in "${W[@]}"; do add sfx_whoosh.wav $t 0.18 0.35; done
for t in "${I[@]}"; do add sfx_impact.wav $t 0.0 0.45; done
for t in "${R[@]}"; do add sfx_risco.wav $t 0.0 0.4; done
for t in "${K[@]}"; do add sfx_click.wav $t 0.0 0.6; done
f+="${labels}amix=inputs=$n:normalize=0,apad,atrim=0:$D[pre]"
ffmpeg -y -v error "${in[@]}" -filter_complex "$f" -map "[pre]" -ar 48000 -ac 2 premix.wav
J=$(ffmpeg -hide_banner -i premix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -v error -i premix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 final_audio.wav
