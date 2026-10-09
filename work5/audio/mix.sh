#!/bin/bash
# Mixagem do anúncio Alessandra Mendes: voz + SFX (+ trilha com ducking só na faixa da voz, se music.mp3 existir) e normalização em -14 LUFS
set -e
cd "$(dirname "$0")"
W=(2.25 8.1 10.45 15.9 22.25 28.3); R=(25.15); K=(31.17); I=(0.38 1.1 9.3 16.24 26.28 28.85)
in=(-i voice.wav); f=""; n=1; labels=""
add() { in+=(-i "$1"); f+="[$n:a]adelay=$(python3 -c "print(int(($2-$3)*1000))"):all=1,volume=$4[x$n];"; labels+="[x$n]"; n=$((n+1)); }
for t in "${W[@]}"; do add sfx_whoosh.wav $t 0.18 0.25; done
for t in "${R[@]}"; do add sfx_risco.wav $t 0.0 0.45; done
for t in "${K[@]}"; do add sfx_click.wav $t 0.0 0.6; done
for t in "${I[@]}"; do add sfx_impact.wav $t 0.0 0.35; done
m=$((n))
if [ -f music.mp3 ]; then
  in+=(-i music.mp3)
  # voz controla o ducking: trilha cai ~10 dB só enquanto há fala
  f+="[0:a]asplit=2[v][vk];[$n:a]atrim=0:34,asetpts=PTS-STARTPTS,volume=0.35,afade=t=out:st=32.8:d=1.2[mu];[mu][vk]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=350[md];"
  labels="[v][md]$labels"; m=$((n+1))
else
  f+="[0:a]anull[v];"; labels="[v]$labels"
fi
f+="${labels}amix=inputs=$m:normalize=0,apad=whole_dur=34,atrim=0:34[pre]"
ffmpeg -y -v error "${in[@]}" -filter_complex "$f" -map "[pre]" -ar 48000 -ac 2 premix.wav
# loudnorm em duas passadas para −14 LUFS integrado
J=$(ffmpeg -hide_banner -i premix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -v error -i premix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 final_audio.wav
ffmpeg -hide_banner -i final_audio.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" 
