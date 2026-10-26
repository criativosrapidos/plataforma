#!/usr/bin/env python3
"""Junta as páginas exportadas da proposta em um PDF."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
imgs = [Image.open(p).convert("RGB") for p in sorted((ROOT / "saida/paginas").glob("pr_*.jpg"))]
imgs[0].save(ROOT.parent / "saida/multagro_proposta.pdf", save_all=True, append_images=imgs[1:], resolution=150)
print(len(imgs), "páginas")
