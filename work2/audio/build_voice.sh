#!/bin/bash
# Voz do vídeo 2: take 2 acelerado 9% (32,1s -> 29,4s), começando em 0,05s
set -e
cd "$(dirname "$0")"
ffmpeg -y -v error -i take2_planos.mp3 -af "atempo=1.09,adelay=50:all=1,apad,atrim=0:30" -ar 48000 -ac 1 voice.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 voice.wav
