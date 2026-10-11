#!/usr/bin/env bash
# Fecha o v3 quando a locução existir.
# Uso: ./build_v3.sh assets/takes/v3.mp3 assets/takes/v3_scribe.json
# A take deve seguir o roteiro de 42 palavras (Atenção, Ubatuba! ... Passa aqui!), na ordem usada em cena3.html.
set -euo pipefail
cd "$(dirname "$0")"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
python3 prep_voz.py "$1" "$2" assets/locucao_v3.mp3 build/palavras_v3.json
N=$(python3 -c "import json;print(len(json.load(open('build/palavras_v3.json'))))")
[ "$N" = 42 ] || { echo "esperava 42 palavras, veio $N"; exit 1; }
DUR=$(python3 -c "import json;w=json.load(open('build/palavras_v3.json'));print(round(max(w[-1]['end']+0.6, w[36]['start']+4.2),2))")
python3 trilha3.py "$DUR" build/palavras_v3.json assets/locucao_v3.mp3 trilha_v3.wav
PALAVRAS=build/palavras_v3.json node render3.cjs ../farah-video-v3.mp4 build/trilha_v3.wav "$DUR"
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,channels -show_entries format=duration -of compact ../farah-video-v3.mp4
