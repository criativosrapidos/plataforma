#!/usr/bin/env bash
# Gera farah-video-final.mp4 a partir de assets/locucao.mp3 e assets/fotos/
set -euo pipefail
cd "$(dirname "$0")"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
MP3="${1:-$(ls assets/*.mp3 | head -1)}"
python3 fotos.py
python3 sync.py "$MP3"
node render.cjs ../farah-video-final.mp4 "$MP3"
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate -show_entries format=duration -of compact ../farah-video-final.mp4
