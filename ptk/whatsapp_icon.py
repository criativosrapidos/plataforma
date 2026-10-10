"""Símbolo do WhatsApp desenhado (balão + telefone), em 4x para ficar liso."""
import math
from functools import lru_cache

from PIL import Image, ImageDraw

GREEN = (37, 211, 102)


@lru_cache(None)
def wa_icon(size=140, bg=True):
    k = 4
    s = size * k
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = s / 100
    if bg:
        d.ellipse((0, 0, s - 1, s - 1), fill=GREEN)
    # balão: anel branco + rabinho embaixo à esquerda
    cx, cy, r, sw = 50 * u, 48 * u, 33 * u, 6.5 * u
    d.polygon([(19 * u, 85 * u), (24 * u, 64 * u), (37 * u, 75 * u)], fill="white")
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline="white", width=int(sw))
    # recorta o miolo do rabinho para ficar só o contorno
    inner = r - sw
    d.ellipse((cx - inner, cy - inner, cx + inner, cy + inner), fill=GREEN if bg else (0, 0, 0, 0))
    # telefone: arco grosso abaulado para baixo/esquerda, com bocal e fone nas pontas
    hr, hw = 16.5 * u, 8.5 * u
    hx, hy = cx + 1.5 * u, cy - 1 * u
    d.arc((hx - hr, hy - hr, hx + hr, hy + hr), 60, 210, fill="white", width=int(hw))
    for ang, ln in ((60, 0.0), (210, 0.0)):
        a = math.radians(ang)
        px, py = hx + math.cos(a) * (hr - hw / 2), hy + math.sin(a) * (hr - hw / 2)
        # pontas (fone/bocal) como cápsulas perpendiculares ao arco
        t = a + math.pi / 2
        L, Wd = 6.5 * u, 6.0 * u
        dx, dy = math.cos(t) * L, math.sin(t) * L
        d.line((px - dx * 0.2, py - dy * 0.2, px + dx * (1 if ang == 60 else -1) * 0.9 + dx * 0.0,
                py + dy * (1 if ang == 60 else -1) * 0.9), fill="white", width=int(Wd))
        d.ellipse((px - Wd / 2, py - Wd / 2, px + Wd / 2, py + Wd / 2), fill="white")
    return img.resize((size, size), Image.LANCZOS)
