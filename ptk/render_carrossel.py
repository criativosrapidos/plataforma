#!/usr/bin/env python3
"""Carrossel Instagram (6 páginas, 1080x1350) + logos da PTK Fretes.

Uso: python3 render_carrossel.py  -> saida/carrossel/*.png, saida/logo/*.png
"""
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

import ptk_art as A
from ptk_art import BLACK, WHITE, YEL, YEL2
from render_ptk import CHECK, WA, WHATS, pin, tag, txt, wa_card

ROOT = Path(__file__).resolve().parent
W, H = 1080, 1350
OUT = ROOT / "saida/carrossel"


def put(base, img, cx, cy, rot=0.0, scale=1.0):
    if rot:
        img = img.rotate(rot, Image.BICUBIC, expand=True)
    if scale != 1.0:
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
    base.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


def rays(c1, c2, cy=0.5, n=16):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    ang = np.arctan2(yy - H * cy, xx - W / 2)
    dist = np.sqrt((xx - W / 2) ** 2 + (yy - H * cy) ** 2) / (H * 0.7)
    band = (ang * n / (2 * math.pi)) % 1.0 < 0.5
    arr = np.where(band[..., None], np.array(c1, np.float32), np.array(c2, np.float32))
    arr = arr * np.clip(1 - dist ** 1.6 * 0.6, 0.3, 1)[..., None] + np.clip(1 - dist * 1.6, 0, 1)[..., None] * 45
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def dusk(horizon=900):
    yy = np.arange(H, dtype=np.float32)[:, None] / horizon
    top, mid, hor = np.array([10, 16, 40]), np.array([40, 52, 110]), np.array([255, 176, 40])
    col = np.where(yy < 0.6, top + (mid - top) * (yy / 0.6), mid + (hor - mid) * np.clip((yy - 0.6) / 0.4, 0, 1))
    arr = np.repeat(col[:, None, :], W, 1)
    arr[horizon:] = (44, 44, 50)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    img.alpha_composite(A.skyline(1300, 340, (12, 12, 20)), (-120, horizon - 335))
    d = ImageDraw.Draw(img)
    d.rectangle((0, horizon, W, horizon + 8), fill=(90, 90, 96))
    for x in range(-60, W, 220):
        d.rectangle((x, horizon + 300, x + 120, horizon + 316), fill=YEL)
    return img


def footer(img, page, dark=True):
    d = ImageDraw.Draw(img)
    col = YEL if dark else BLACK
    put(img, A.logo_horizontal(dark, 64), 190, H - 70)
    for i in range(6):
        x = W - 250 + i * 34
        d.ellipse((x, H - 80, x + 18, H - 62), fill=col if i == page else ((120, 120, 120) if dark else (110, 80, 0)))


def s1():
    img = dusk()
    truck = A.pickup(0.2)
    put(img, truck, W / 2, 1010, scale=0.95)
    put(img, txt("PRECISA DE UM", 96, WHITE, 8, BLACK), W / 2, 200, rot=-3)
    put(img, txt("FRETE?", 250, YEL, 12, BLACK), W / 2, 400, rot=-3)
    put(img, tag("FALE COM PATRICK!", 84, YEL, BLACK), W / 2, 600, rot=2)
    put(img, txt("ARRASTA PRO LADO >>", 40, WHITE, w="Bold"), W / 2, 1270)
    return img


def s2():
    img = rays((26, 26, 30), (12, 12, 14))
    put(img, A.logo_horizontal(True, 250), W / 2, 470)
    put(img, tag("FORÇA E CONFIANÇA NO SEU FRETE", 50), W / 2, 700)
    truck = A.pickup(0.0)
    put(img, truck, W / 2, 1000, scale=0.85)
    put(img, txt("STRADA 2008 • FRETES EM BRASÍLIA E TODO O DF", 34, WHITE, w="Bold"), W / 2, 1180)
    footer(img, 1)
    return img


def s3():
    img = rays(YEL, YEL2)
    put(img, txt("O QUE A GENTE", 90, BLACK, 0, BLACK, shadow=False), W / 2, 150, rot=-3)
    put(img, txt("LEVA PRA VOCÊ", 110, WHITE, 9, BLACK), W / 2, 270, rot=-3)
    items = ["MUDANÇA PEQUENA", "MÓVEIS", "ELETRODOMÉSTICOS", "CAIXAS", "ENTREGAS"]
    for i, lab in enumerate(items):
        put(img, tag(lab, 66, BLACK if i % 2 == 0 else WHITE, YEL if i % 2 == 0 else BLACK),
            W / 2 + (-50 if i % 2 else 50), 450 + i * 140, rot=(-2, 2)[i % 2])
    footer(img, 2, dark=False)
    return img


def s4():
    img = rays((26, 26, 30), (12, 12, 14))
    put(img, txt("POR QUE A", 90, WHITE, 6, BLACK), W / 2, 150, rot=-3)
    put(img, txt("PTK FRETES?", 140, YEL, 9, BLACK), W / 2, 290, rot=-3)
    rows = [("ATENDIMENTO", "RÁPIDO"), ("TRANSPORTE", "SEGURO"), ("PREÇO", "JUSTO"), ("CUIDADO COM", "SUA CARGA")]
    for i, (a, b) in enumerate(rows):
        y = 500 + i * 185
        img.alpha_composite(CHECK, (110, y - 30))
        ta = txt(a, 52, (200, 200, 206), shadow=False)
        tb = txt(b, 92, WHITE, 6, BLACK)
        img.alpha_composite(ta, (250 - 34, y - 60 - 34 + 30))
        img.alpha_composite(tb, (250 - 34, y - 34 + 10))
    footer(img, 3)
    return img


def s5():
    img = dusk(horizon=1020)
    put(img, pin(), W / 2, 210)
    put(img, txt("ATENDEMOS", 100, WHITE, 6, BLACK), W / 2, 420, rot=-3)
    put(img, txt("BRASÍLIA", 210, YEL, 12, BLACK), W / 2, 590, rot=-3)
    put(img, tag("E TODO O DF!", 100, WHITE, BLACK), W / 2, 790, rot=2)
    truck = A.pickup(0.5)
    put(img, truck, W - 330, 1150, scale=0.55)
    footer(img, 4)
    return img


def s6():
    img = rays((20, 160, 80), (14, 130, 64))
    put(img, txt("PEÇA SEU", 110, WHITE, 7, (0, 60, 30)), W / 2, 190)
    put(img, txt("ORÇAMENTO!", 150, YEL, 9, (0, 60, 30)), W / 2, 350, rot=-3)
    put(img, wa_card(WHATS), W / 2, 620)
    put(img, tag("CHAMA NO WHATSAPP", 70, YEL, BLACK), W / 2, 850, rot=-2)
    put(img, txt("ATENDIMENTO RÁPIDO • PREÇO JUSTO", 40, WHITE, w="Black"), W / 2, 980)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((60, 1060, W - 60, 1240), 40, fill=BLACK)
    put(img, A.logo_horizontal(True, 120), W / 2, 1150)
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for i, fn in enumerate((s1, s2, s3, s4, s5, s6), 1):
        fn().convert("RGB").save(OUT / f"ptk_carrossel_{i}.png", optimize=True)
    lg = ROOT / "saida/logo"
    lg.mkdir(parents=True, exist_ok=True)
    A.logo_icon(1080).save(lg / "ptk_logo_perfil.png")
    A.logo_horizontal(True, 500).save(lg / "ptk_logo_horizontal_fundo_escuro.png")
    A.logo_horizontal(False, 500).save(lg / "ptk_logo_horizontal_fundo_claro.png")
    # prancha de apresentação do logo
    board = Image.new("RGBA", (1600, 1000), (14, 14, 16, 255))
    put(board, A.logo_icon(560), 330, 380)
    put(board, A.logo_horizontal(True, 180), 1100, 300)
    light = Image.new("RGBA", (900, 300), (255, 255, 255, 255))
    put(light, A.logo_horizontal(False, 180), 450, 150)
    board.alpha_composite(light, (630, 470))
    for i, c in enumerate((YEL, BLACK, WHITE, (44, 44, 50))):
        ImageDraw.Draw(board).rounded_rectangle((640 + i * 220, 830, 820 + i * 220, 940), 20, fill=c,
                                                outline=(90, 90, 96), width=3)
    board.convert("RGB").save(lg / "ptk_logo_apresentacao.png")
    print("OK")


if __name__ == "__main__":
    main()
