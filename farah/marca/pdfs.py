#!/usr/bin/env python3
"""Junta as páginas exportadas em dois PDFs: manual de identidade e proposta."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
PAG = ROOT / "saida/paginas"
for prefixo, nome in (("id_", "farah_identidade_visual.pdf"), ("pr_", "farah_proposta.pdf")):
    imgs = [Image.open(p).convert("RGB") for p in sorted(PAG.glob(prefixo + "*.jpg"))]
    imgs[0].save(ROOT / "saida" / nome, save_all=True, append_images=imgs[1:], resolution=150)
    print(nome, len(imgs), "páginas")
