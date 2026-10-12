"""Cria ilustracoes de exemplo no lugar de fotos reais (so para demonstracao)."""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1080, 1350
CENAS = [
    ((255, 158, 128), (120, 40, 90)),   # por do sol
    ((255, 214, 170), (255, 120, 150)),
    ((140, 200, 255), (60, 40, 120)),
    ((255, 230, 180), (230, 90, 80)),
    ((190, 240, 220), (40, 110, 120)),
    ((255, 190, 220), (110, 50, 140)),
    ((255, 240, 200), (200, 120, 60)),
    ((210, 200, 255), (90, 60, 160)),
]


def cena(i, topo, base, rng):
    y = np.linspace(0, 1, H)[:, None, None]
    arr = (np.array(topo) * (1 - y) + np.array(base) * y) * np.ones((1, W, 1))
    img = Image.fromarray(arr.astype(np.uint8))
    luz = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(luz)
    for _ in range(40):
        x, yy, r = rng.uniform(0, W), rng.uniform(0, H * 0.7), rng.uniform(15, 70)
        d.ellipse((x - r, yy - r, x + r, yy + r), fill=(255, 255, 240, int(rng.uniform(40, 110))))
    luz = luz.filter(ImageFilter.GaussianBlur(10))
    img.paste(luz, (0, 0), luz)
    d = ImageDraw.Draw(img)
    sil = tuple(int(c * 0.35) for c in base)
    tipo = i % 4
    chao = H * 0.8
    d.rectangle((0, chao, W, H), fill=sil)
    if tipo == 0:  # casal
        for cx, h in ((W * 0.42, 430), (W * 0.58, 400)):
            d.ellipse((cx - 55, chao - h - 110, cx + 55, chao - h), fill=sil)
            d.rounded_rectangle((cx - 85, chao - h, cx + 85, chao), 60, fill=sil)
    elif tipo == 1:  # bolo
        d.rounded_rectangle((W * 0.25, chao - 300, W * 0.75, chao), 30, fill=(255, 245, 240))
        d.rectangle((W * 0.25, chao - 180, W * 0.75, chao - 150), fill=(255, 79, 121))
        for k in range(5):
            x = W * 0.33 + k * W * 0.085
            d.rectangle((x - 8, chao - 400, x + 8, chao - 300), fill=(255, 200, 87))
            d.ellipse((x - 14, chao - 440, x + 14, chao - 395), fill=(255, 240, 150))
    elif tipo == 2:  # baloes
        for k in range(6):
            x, yy = W * (0.2 + 0.12 * k), H * (0.25 + 0.08 * math.sin(k * 2))
            cor = [(255, 79, 121), (255, 200, 87), (255, 248, 245)][k % 3]
            d.line((x, yy + 90, W / 2, chao), fill=sil, width=3)
            d.ellipse((x - 70, yy - 90, x + 70, yy + 90), fill=cor)
    else:  # familia
        for cx, h in ((W * 0.3, 420), (W * 0.5, 260), (W * 0.7, 400)):
            d.ellipse((cx - 50, chao - h - 100, cx + 50, chao - h), fill=sil)
            d.rounded_rectangle((cx - 75, chao - h, cx + 75, chao), 55, fill=sil)
    return img


if __name__ == "__main__":
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(11)
    for i, (t, b) in enumerate(CENAS):
        cena(i, t, b, rng).save(out / f"foto_{i + 1:02d}.jpg", quality=92)
    print("ok", out)
