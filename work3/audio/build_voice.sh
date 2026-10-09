#!/bin/bash
# Voz do vídeo 3 (feed): take 1 sem alteração de velocidade, começando em 0,25s
set -e
cd "$(dirname "$0")"
ffmpeg -y -v error -i take1_feed.mp3 -af "adelay=250:all=1,apad,atrim=0:30" -ar 48000 -ac 1 voice.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 voice.wav
