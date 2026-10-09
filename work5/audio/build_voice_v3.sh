#!/bin/bash
# Voz v3: take de 38s em velocidade natural (sem acelerar).
# Cortes: frase do sol (10,04–13,96s) e "e ainda com um presente" (31,56–33,30s).
# A: 0–10,04 em 0,3s | B: 13,96–31,56 em 10,44s | C: 33,30–fim em 28,39s. Duração 34s.
set -e
cd "$(dirname "$0")"
ffmpeg -y -v error -i take_v2_38s.mp3 -filter_complex "\
[0:a]atrim=0:10.04,asetpts=PTS-STARTPTS,afade=t=out:st=9.99:d=0.05,adelay=300:all=1[a];\
[0:a]atrim=13.96:31.56,asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=17.52:d=0.08,adelay=10440:all=1[b];\
[0:a]atrim=33.30,asetpts=PTS-STARTPTS,afade=t=in:d=0.04,adelay=28390:all=1[c];\
[a][b][c]amix=inputs=3:normalize=0,apad=whole_dur=34,atrim=0:34[o]" -map "[o]" -ar 48000 -ac 1 voice.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 voice.wav
