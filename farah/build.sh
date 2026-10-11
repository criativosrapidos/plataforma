#!/usr/bin/env bash
# Gera farah-video-final.mp4 a partir de assets/locucao.mp3 e assets/fotos/
# (para refazer a locução a partir de uma take crua: python3 prep_audio.py take.mp3 palavras.json)
set -euo pipefail
cd "$(dirname "$0")"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
MP3="${1:-assets/locucao.mp3}"
python3 fotos.py > /dev/null
if [ -f build/palavras.json ]; then
  python3 sync.py "$MP3" --palavras build/palavras.json   # tempos por palavra (transcrição)
else
  python3 sync.py "$MP3"                                  # pausas do áudio
fi
node render.cjs ../farah-video-final.mp4 "$MP3"
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,channels -show_entries format=duration -of compact ../farah-video-final.mp4
