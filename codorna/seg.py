"""Recorta as codornas da foto (tira a tábua de madeira) para montar a bandeja realista."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent


def recorte():
    im = Image.open(ROOT / "assets/raw/codornas_tabua.jpg").convert("RGB")
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    sat = (mx - mn) / (mx + 1)
    L = (r + g + b) / 3
    m = ((L > 140) & (sat < .34)) | ((L > 92) & (sat < .40) & ((r - b) < 62) & (r >= g))
    m[:190] = False
    m[:, :25] = False
    m = ndimage.binary_opening(m, iterations=2)
    m = ndimage.binary_closing(m, iterations=6)
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.where(sizes > 4000)[0])
    mask = Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out.crop(out.getbbox())


if __name__ == "__main__":
    o = recorte()
    o.save(ROOT / "assets/codornas_recorte.png")
    bg = Image.new("RGBA", o.size, (40, 160, 40, 255))
    bg.alpha_composite(o)
    bg.convert("RGB").resize((o.width // 2, o.height // 2)).save(
        "/tmp/claude-0/-home-user-plataforma/77ffb2c5-01f2-5fb6-9706-f5c25ea7325b/scratchpad/mask.jpg")
    print(o.size)
