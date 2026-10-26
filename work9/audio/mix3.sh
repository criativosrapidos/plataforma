#!/bin/bash
# Mixagem v2 (30s): voz (entra em 1,3s) + trilha de tensão no gancho + boom em "acabou" + SFX, −14 LUFS.
set -e
cd "$(dirname "$0")"
D=28
W=(4.6 7.15 17.3 19.75 22.5); I=(5.8 6.4 9.53 15.6 17.35 17.8 23.8); R=(17.8); K=(19.95 20.3 20.65 25.8)
in=(-i voice3.wav -i sfx_tensao.wav -i sfx_boom.wav)
f="[1:a]volume=0.4,afade=t=out:st=0.9:d=1.2[ten];[2:a]adelay=950:all=1,volume=0.7[bm];"
n=3; labels="[0:a][ten][bm]"
add() { in+=(-i "$1"); f+="[$n:a]adelay=$(python3 -c "print(max(0,int(($2-$3)*1000)))"):all=1,volume=$4[x$n];"; labels+="[x$n]"; n=$((n+1)); }
for t in "${W[@]}"; do add sfx_whoosh.wav $t 0.18 0.35; done
for t in "${I[@]}"; do add sfx_impact.wav $t 0.0 0.45; done
for t in "${R[@]}"; do add sfx_risco.wav $t 0.0 0.4; done
for t in "${K[@]}"; do add sfx_click.wav $t 0.0 0.6; done
# tiques de caixa registradora nas 10 vendas
for i in $(seq 0 9); do add sfx_click.wav $(python3 -c "print(12.93+$i*0.26)") 0.0 0.35; done
f+="${labels}amix=inputs=$n:normalize=0,apad,atrim=0:$D[pre]"
ffmpeg -y -v error "${in[@]}" -filter_complex "$f" -map "[pre]" -ar 48000 -ac 2 premix3.wav
J=$(ffmpeg -hide_banner -i premix3.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -v error -i premix3.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 final_audio3.wav
