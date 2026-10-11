#!/usr/bin/env python3
"""Gera build/timings.json: início de cada cena, alinhado às falas da locução.

Uso:
  python3 sync.py assets/locucao.mp3     -> detecta pausas (ffmpeg silencedetect) e encaixa as frases
  python3 sync.py --rascunho             -> tempos estimados (sem áudio), só para conferir o visual
  python3 sync.py MP3 --palavras w.json  -> usa uma transcrição com tempos por palavra
                                            ([{"word":..., "start":..., "end":...}]) se houver uma
"""
import json, re, subprocess, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FPS = 30
END_HOLD = 4.2      # segura a tela final por pelo menos isto
TAIL = 0.6          # respiro depois da última palavra
PRE_ROLL = 0.033      # corta 1 quadro antes da palavra (o olho chega antes do ouvido)


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def silabas(txt):
    """Estimativa de sílabas (grupos de vogais) para pesar a duração de cada fala."""
    return max(1, len(re.findall(r"[aeiouy]+", norm(txt))))


def duracao(mp3):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(mp3)], capture_output=True, text=True).stdout
    return float(out.strip())


def segmentos_fala(mp3, noise="-34dB", d=0.09):
    """Trechos com voz = complemento dos silêncios detectados."""
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(mp3), "-af",
                          f"silencedetect=noise={noise}:d={d}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    total = duracao(mp3)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    sil = list(zip(starts, ends + [total] * (len(starts) - len(ends))))
    segs, cur = [], 0.0
    for a, b in sil:
        if a - cur > 0.04:
            segs.append((cur, a))
        cur = b
    if total - cur > 0.04:
        segs.append((cur, total))
    return segs, total


def alinhar(cues, segs):
    """Distribui as falas pelo 'tempo de fala' (sem pausas) proporcional às sílabas e
    encaixa cada início no começo de trecho de voz mais próximo (= palavra após pausa)."""
    pesos = [silabas(c["fala"]) for c in cues]
    fala_total = sum(b - a for a, b in segs)
    tot = sum(pesos)

    def real(p):  # posição no tempo de fala -> tempo real
        for a, b in segs:
            if p <= b - a:
                return a + p
            p -= b - a
        return segs[-1][1]

    acum, inicios = 0, []
    for w in pesos:
        inicios.append(real(fala_total * acum / tot))
        acum += w
    onsets = [a for a, _ in segs]
    usados, out = set(), []
    for i, t in enumerate(inicios):
        cand = [o for o in onsets if o not in usados and abs(o - t) < 0.45
                and (not out or o > out[-1] + 0.2)]
        if i == 0:
            t2 = onsets[0]
        elif cand:
            t2 = min(cand, key=lambda o: abs(o - t))
        else:
            t2 = max(t, out[-1] + 0.25)
        usados.add(t2)
        out.append(t2)
    return out


def alinhar_palavras(cues, palavras):
    """Com tempos por palavra: cada cena começa na primeira palavra da sua fala."""
    idx, out = 0, []
    for c in cues:
        out.append(palavras[min(idx, len(palavras) - 1)]["start"])
        idx += len(c["fala"].split())
    return out


def rascunho(cues):
    t, out = 0.25, []
    for c in cues:
        out.append(t)
        t += silabas(c["fala"]) / 6.4 + (0.35 if c["fala"].rstrip()[-1] in ".!?" else 0.12)
    return out, t + 0.3


def main():
    args = sys.argv[1:]
    cues = json.loads((ROOT / "cues.json").read_text())["cues"]
    info = {}
    if "--rascunho" in args:
        inicios, fim_fala = rascunho(cues)
        info["modo"] = "rascunho (tempos estimados, sem áudio)"
        audio = None
    else:
        audio = Path(args[0]).resolve()
        if "--palavras" in args:
            pal = json.loads(Path(args[args.index("--palavras") + 1]).read_text())
            inicios = alinhar_palavras(cues, pal)
            fim_fala = pal[-1]["end"]
            info["modo"] = "tempos por palavra"
        else:
            segs, total = segmentos_fala(audio)
            inicios = alinhar(cues, segs)
            fim_fala = segs[-1][1]
            info["modo"] = "pausas do áudio (silencedetect)"
            info["trechos_de_voz"] = [[round(a, 3), round(b, 3)] for a, b in segs]
    # quadro exato do corte
    inicios = [round(max(0, t - PRE_ROLL) * FPS) / FPS for t in inicios]
    inicios[0] = 0.0
    dur = max(fim_fala + TAIL, inicios[-1] + END_HOLD)
    dur = round(dur * FPS) / FPS
    res = {"fps": FPS, "duracao": dur, "audio": str(audio) if audio else None, **info,
           "cenas": [{"id": c["id"], "inicio": t, "fim": (inicios[i + 1] if i + 1 < len(cues) else dur)}
                     for i, (c, t) in enumerate(zip(cues, inicios))]}
    (ROOT / "build").mkdir(exist_ok=True)
    (ROOT / "build" / "timings.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    for c, t in zip(cues, inicios):
        print(f"{t:6.2f}s  {c['id']:<10} {c['fala']}")
    print(f"duração: {dur:.2f}s  ({info['modo']})")


if __name__ == "__main__":
    main()
