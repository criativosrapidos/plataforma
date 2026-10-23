#!/usr/bin/env python3
"""Vídeo v3 (30 s, tudo falado): junta quadros + locução v3 + violão baixo. Uso: python3 monta_v3.py <pasta_quadros> <saida.mp4>"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / "fazendinha"))
import render_faz  # noqa: E402

quadros, saida = sys.argv[1], sys.argv[2]
DUR, LEAD = 30.0, 0.30
render_faz.DURATION = DUR
musica = ROOT / "audio/trilha.wav"
render_faz.trilha(musica)
dl = int(LEAD * 1000)
subprocess.run([
    "ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", f"{quadros}/f_%05d.jpg",
    "-i", str(ROOT / "audio/locucao_v3.mp3"), "-i", str(musica),
    "-filter_complex",
    f"[1:a]adelay={dl}|{dl},aresample=44100,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=90,"
    f"volume=2.0,apad,atrim=0:{DUR},asplit=2[v1][v2];"
    "[2:a]volume=0.13[m];[m][v1]sidechaincompress=threshold=0.03:ratio=6:release=300[md];"
    f"[md][v2]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.0,atrim=0:{DUR}[a]",
    "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", str(DUR), saida], check=True)
print("OK ->", saida)
