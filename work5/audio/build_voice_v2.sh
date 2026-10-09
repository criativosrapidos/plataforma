#!/bin/bash
# Voz v2 (estrutura atenção→dor→explicação→sonho→solução→objeção→convite):
# take de 38s, sem a frase "E sem o cuidado certo, ele volta e escurece com o sol" (10,04–13,96s),
# acelerado 10% e começando em 0,3s. Duração final do vídeo: 32s.
set -e
cd "$(dirname "$0")"
ffmpeg -y -v error -i take_v2_38s.mp3 -filter_complex "[0:a]atrim=0:10.04,asetpts=PTS-STARTPTS,afade=t=out:st=9.99:d=0.05[a];[0:a]atrim=13.96,asetpts=PTS-STARTPTS,afade=t=in:d=0.04[b];[a][b]concat=n=2:v=0:a=1,atempo=1.1,adelay=300:all=1,apad=whole_dur=32,atrim=0:32[o]" -map "[o]" -ar 48000 -ac 1 voice.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 voice.wav
