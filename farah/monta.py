#!/usr/bin/env python3
"""Junta os quadros capturados + locução (ElevenLabs) + trilha leve de violão -> saida/farah_reels.mp4"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / "fazendinha"))
import render_faz  # noqa: E402  (violão dedilhado sintetizado, reaproveitado)

DUR, LEAD, SLOGAN = 34.0, 0.20, 30.0
render_faz.DURATION = DUR
musica = ROOT / "audio/trilha.wav"
render_faz.trilha(musica)
out = ROOT / "saida/farah_reels.mp4"
dl = int(LEAD * 1000)
subprocess.run([
    "ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", str(ROOT / "frames/f_%05d.jpg"),
    "-i", str(ROOT / "audio/locucao.mp3"), "-i", str(musica), "-i", str(ROOT / "audio/slogan.mp3"),
    "-filter_complex",
    f"[3:a]adelay={int(SLOGAN * 1000)}|{int(SLOGAN * 1000)},aresample=44100[sl];[1:a]adelay={dl}|{dl},aresample=44100[vz];"
    "[vz][sl]amix=inputs=2:duration=longest:normalize=0,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=90,"
    f"volume=2.0,apad,atrim=0:{DUR},asplit=2[v1][v2];"
    "[2:a]volume=0.13[m];[m][v1]sidechaincompress=threshold=0.03:ratio=6:release=300[md];"
    f"[md][v2]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.0,atrim=0:{DUR}[a]",
    "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", str(DUR), str(out)], check=True)
print("OK ->", out)
