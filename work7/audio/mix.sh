#!/bin/bash
# Mixagem de um criativo: voz + SFX sintetizados e normalização em −14 LUFS (2 passadas).
# Uso: bash mix.sh <v1|v2|v3|v4>   (tempos de whoosh/impacto/risco/clique por vídeo abaixo)
set -e
cd "$(dirname "$0")"
v=$1
case $v in
  v1) TEMPO=1.0;  W=(3.44 8.24 10.5 13.76 20.6 24.05 26.64); I=(2.8 9.84 23.4 26.0); R=(9.6); K=(28.7) ;;
  v2) TEMPO=1.04; W=(4.6 10.75 13.35 19.05 23.8 27.55); I=(2.85 6.0 12.75 21.85 23.9); R=(7.65 8.45 12.0 26.9); K=(29.3) ;;
  v3) TEMPO=1.0;  W=(2.16 7.2 10.72 17.5 23.62 26.5); I=(1.6 6.2 9.62 22.96 23.9 25.04); R=(); K=(29.3) ;;
  v4) TEMPO=1.0;  W=(2.95 6.25 10.85 18.45 23.38 26.72); I=(1.69 9.62 12.6 22.6 23.45 25.5); R=(7.85 8.75); K=(29.0) ;;
esac
ffmpeg -y -v error -i $v.mp3 -af "atempo=$TEMPO,apad,atrim=0:30" -ar 48000 -ac 1 ${v}_voice.wav
in=(-i ${v}_voice.wav); f=""; n=1; labels="[0:a]"
add() { in+=(-i "$1"); f+="[$n:a]adelay=$(python3 -c "print(max(0,int(($2-$3)*1000)))"):all=1,volume=$4[x$n];"; labels+="[x$n]"; n=$((n+1)); }
for t in "${W[@]}"; do add sfx_whoosh.wav $t 0.18 0.35; done
for t in "${I[@]}"; do add sfx_impact.wav $t 0.0 0.45; done
for t in "${R[@]}"; do add sfx_risco.wav $t 0.0 0.4; done
for t in "${K[@]}"; do add sfx_click.wav $t 0.0 0.6; done
f+="${labels}amix=inputs=$n:normalize=0,atrim=0:30[pre]"
ffmpeg -y -v error "${in[@]}" -filter_complex "$f" -map "[pre]" -ar 48000 -ac 2 ${v}_premix.wav
J=$(ffmpeg -hide_banner -i ${v}_premix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -v error -i ${v}_premix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 ${v}_final.wav
