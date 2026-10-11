#!/usr/bin/env python3
"""Associa as fotos de assets/fotos/ às cenas pelo nome do arquivo -> build/mapa_fotos.json.
Arquivos com nome de produto de tabaco ficam de fora e são listados.
Se build/mapa_fotos.json já tiver "manual": true, ele é mantido como está."""
import json, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXT = {".jpg", ".jpeg", ".png", ".webp"}


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def main():
    out = ROOT / "build" / "mapa_fotos.json"
    if out.exists() and json.loads(out.read_text()).get("manual"):
        print("mapa manual mantido:", out)
        return
    cfg = json.loads((ROOT / "cues.json").read_text())
    fotos = sorted(p for p in (ROOT / "assets" / "fotos").glob("*") if p.suffix.lower() in EXT)
    mapa, proib, sobra = {}, [], []
    for p in fotos:
        n = norm(p.stem)
        if any(norm(w) in n for w in cfg["proibidas"]):
            proib.append(p.name)
            continue
        chave = next((k for k, ws in cfg["fotos_palavras"].items()
                      if k not in mapa and any(norm(w) in n for w in ws)), None)
        if chave:
            mapa[chave] = "assets/fotos/" + p.name
        else:
            sobra.append(p.name)
    faltam = [k for k in cfg["fotos_palavras"] if k not in mapa]
    res = {"manual": False, "fotos": mapa, "sem_foto": faltam,
           "excluidas_tabaco": proib, "nao_usadas": sobra}
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(json.dumps(res, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
