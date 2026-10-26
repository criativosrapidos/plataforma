#!/bin/bash
# Mixagem v2 (30s): voz (entra em 1,3s) + trilha de tensão no gancho + boom em "acabou" + SFX, −14 LUFS.
set -e
cd "$(dirname "$0")"
D=30
W=(6.4 9.3 19.95 23.95); I=(7.6 8.2 10.5 16.9 21.0 25.25); R=(21.0); K=(27.4)
in=(-i voice.wav -i sfx_tensao.wav -i sfx_boom.wav)
f="[1:a]volume=0.55,afade=t=out:st=2.1:d=2.6[ten];[2:a]adelay=2200:all=1,volume=0.8[bm];"
n=3; labels="[0:a][ten][bm]"
add() { in+=(-i "$1"); f+="[$n:a]adelay=$(python3 -c "print(max(0,int(($2-$3)*1000)))"):all=1,volume=$4[x$n];"; labels+="[x$n]"; n=$((n+1)); }
for t in "${W[@]}"; do add sfx_whoosh.wav $t 0.18 0.35; done
for t in "${I[@]}"; do add sfx_impact.wav $t 0.0 0.45; done
for t in "${R[@]}"; do add sfx_risco.wav $t 0.0 0.4; done
for t in "${K[@]}"; do add sfx_click.wav $t 0.0 0.6; done
# tiques de caixa registradora nas 10 vendas
for i in $(seq 0 9); do add sfx_click.wav $(python3 -c "print(14.2+$i*0.27)") 0.0 0.35; done
f+="${labels}amix=inputs=$n:normalize=0,apad,atrim=0:$D[pre]"
ffmpeg -y -v error "${in[@]}" -filter_complex "$f" -map "[pre]" -ar 48000 -ac 2 premix2.wav
J=$(ffmpeg -hide_banner -i premix2.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -v error -i premix2.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 final_audio2.wav
