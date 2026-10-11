#!/usr/bin/env python3
"""Prepara a locução: alonga pausas entre frases, ajusta o andamento (sem mudar o tom),
normaliza para -14 LUFS e remapeia os tempos por palavra.
Uso: python3 prep_audio.py take.mp3 palavras.json  -> assets/locucao.mp3 + build/palavras.json"""
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEMPO = 0.96          # 4% mais lento
# (ponto dentro de uma pausa, segundos extras de silêncio)
PAUSAS = [(1.44, 0.25), (6.44, 0.20), (13.52, 0.30), (14.92, 0.15),
          (17.77, 0.30), (19.08, 0.20), (20.30, 0.35)]
LEAD = 0.15           # respiro antes da primeira palavra


def main(take, palavras):
    words = json.loads(Path(palavras).read_text())
    pts = [0.0] + [p for p, _ in PAUSAS]
    parts, filt = [], []
    for i, (a, b) in enumerate(zip(pts, pts[1:] + [None])):
        trim = f"atrim=start={a}" + (f":end={b}" if b else "")
        filt.append(f"[0:a]{trim},asetpts=PTS-STARTPTS[s{i}]")
        parts.append(f"[s{i}]")
        if b:
            d = dict(PAUSAS)[b]
            filt.append(f"anullsrc=r=44100:cl=mono,atrim=duration={d}[z{i}]")
            parts.append(f"[z{i}]")
    filt.append(f"anullsrc=r=44100:cl=mono,atrim=duration={LEAD}[lead]")
    chain = (f"[lead]{''.join(parts)}concat=n={len(parts)+1}:v=0:a=1,"
             f"rubberband=tempo={TEMPO:.5f}:pitchq=quality:formant=preserved,"
             "highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,"
             "loudnorm=I=-14:TP=-1.5:LRA=7,aresample=48000,apad=pad_dur=1.5[out]")
    out = ROOT / "assets" / "locucao.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", take, "-filter_complex",
                    ";".join(filt + [chain]), "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "256k",
                    "-ac", "2", str(out)], check=True)

    def remap(t):
        return round((LEAD + t + sum(d for p, d in PAUSAS if p < t)) / TEMPO, 3)
    novas = [{"word": w["text"], "start": remap(w["start"]), "end": remap(w["end"])} for w in words]
    (ROOT / "build").mkdir(exist_ok=True)
    (ROOT / "build" / "palavras.json").write_text(json.dumps(novas, indent=0, ensure_ascii=False))
    print("ok", out, "última palavra termina em", novas[-1]["end"])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
