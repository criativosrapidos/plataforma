#!/usr/bin/env python3
"""Proposta comercial (PDF 16:9) para a Fazendinha, na identidade visual dela, assinada pela Criativos Rápidos.

Uso: python3 proposta_faz.py  -> saida/proposta_fazendinha.pdf
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from faz_art import CREAM, MAROON, MAROON3
from faz_brand import COBRE, MARROM, PH, PW, ff, page, pattern, put, shadow_paste, tarja, tw
from render_faz import bandeirinhas
from render_faz_v2 import ORANGE, WHITE, YELLOW, fnt
import faz_art as F
import render_faz_v2 as V

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "saida"
PACOTES = [
    ("START", "247", ["3 vídeos com locução", "3 carrosséis", "Roteiro e legendas", "Ajustes inclusos"], False),
    ("PRO", "497", ["Identidade visual completa", "6 vídeos com locução", "6 carrosséis",
                    "Roteiro e legendas", "Ajustes inclusos"], True),
    ("MAX", "997", ["Identidade visual completa", "Landing page profissional", "9 vídeos com locução",
                    "9 carrosséis", "Roteiro e legendas", "Prioridade nas entregas"], False),
]


def fnti(size):
    return ImageFont.truetype(str(ROOT / "fonts/montserrat-latin-900-italic.woff"), size)


def criativos(h=90, color=WHITE):
    """Assinatura da agência: raio + CRIATIVOS RÁPIDOS."""
    s = h
    icon = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(icon)
    d.rounded_rectangle((0, 0, s - 1, s - 1), int(s * .26), fill=ORANGE + (255,))
    d.polygon([(s * .58, s * .12), (s * .26, s * .56), (s * .48, s * .56), (s * .40, s * .88), (s * .74, s * .42),
               (s * .52, s * .42)], fill=WHITE + (255,))
    f1, f2 = fnti(int(h * .42)), fnti(int(h * .42))
    w = int(max(tw("CRIATIVOS", f1), tw("RÁPIDOS", f2)) + s * 1.3)
    img = Image.new("RGBA", (w, s), (0, 0, 0, 0))
    img.alpha_composite(icon)
    d = ImageDraw.Draw(img)
    d.text((s * 1.22, s * .27), "CRIATIVOS", font=f1, fill=color, anchor="lm")
    d.text((s * 1.22, s * .74), "RÁPIDOS", font=f2, fill=ORANGE, anchor="lm")
    return img


def rounded(img, r):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width - 1, img.height - 1), r, fill=255)
    img = img.convert("RGBA")
    img.putalpha(m)
    return img


def p_capa():
    p = pattern(PW, PH).copy()
    bandeirinhas(p, 1.0, y0=-10)
    put(p, F.logo_recriado(470), PW / 2, 420, shadow=True)
    d = ImageDraw.Draw(p)
    d.text((PW / 2, 735), "PROPOSTA DE CONTEÚDO", font=fnt(900, 72), fill=CREAM, anchor="mm")
    d.text((PW / 2, 805), "Vídeos com locução · carrosséis · identidade visual · Instagram", font=fnt(600, 30),
           fill=COBRE, anchor="mm")
    ag = criativos(80)
    d.text((PW / 2, 930), "PREPARADO POR", font=fnt(700, 20), fill=COBRE, anchor="mm")
    put(p, ag, PW / 2, 995)
    return p


def p_video():
    p = page("O Vídeo", "Amostra de 30 s feita com as fotos reais da casa e locução profissional", 1, tag="PROPOSTA")
    times = [0.8, 3.8, 5.4, 13.6, 18.6, 26.5]
    for i, t in enumerate(times):
        fr = V.frame(t).resize((270, 480), Image.LANCZOS)
        shadow_paste(p, rounded(fr, 18), (90 + i * 296, 230))
    d = ImageDraw.Draw(p)
    pts = ["Cortes rápidos no ritmo da voz", "Legenda grande, palavra por palavra", "Preços animados na tela",
           "Logo e localização no final"]
    for i, t in enumerate(pts):
        x = 90 + (i % 2) * 880
        y = 800 + (i // 2) * 70
        d.ellipse((x, y - 14, x + 28, y + 14), fill=ORANGE + (255,))
        d.text((x + 48, y), t, font=fnt(700, 32), fill=MAROON, anchor="lm")
    d.text((90, 1010), "Arquivo enviado junto: fazendinha_30s_v2.mp4", font=fnt(600, 22), fill=MARROM)
    return p


def p_carrosseis():
    p = page("Carrosséis", "3 carrosséis de exemplo: comida, lazer e preço", 2, tag="PROPOSTA")
    car = OUT / "carrossel_v2"
    rows = [("c1_comida", "COMIDA"), ("c2_lazer", "LAZER"), ("c3_preco", "PREÇO E LOCAL")]
    for r, (k, lab) in enumerate(rows):
        y = 200 + r * 280
        tg = tarja(lab, 28, MAROON if r % 2 else ORANGE)
        p.alpha_composite(tg, (90, y + 100))
        for i in range(5):
            im = Image.open(car / k / f"fazendinha_{k}_{i + 1}.jpg").resize((200, 250), Image.LANCZOS)
            shadow_paste(p, rounded(im, 12), (420 + i * 290, y), blur=10, off=(0, 8), alpha=110)
    return p


def p_posts():
    p = page("Feed e Stories", "Posts prontos pra puxar conversa e stories pra vender no dia", 3, dark=True, tag="PROPOSTA")
    posts = sorted((OUT / "posts").glob("*.jpg"))
    for i, f in enumerate(posts):
        im = Image.open(f).resize((300, 375), Image.LANCZOS)
        r, c = divmod(i, 3)
        shadow_paste(p, rounded(im, 14), (90 + c * 330, 220 + r * 410))
    stories = sorted((OUT / "stories").glob("*.jpg"))
    for i, f in enumerate(stories):
        im = Image.open(f).resize((230, 409), Image.LANCZOS)
        shadow_paste(p, rounded(im, 16), (1110 + i * 250, 300))
    d = ImageDraw.Draw(p)
    d.text((1110, 250), "STORIES", font=fnt(900, 28), fill=ORANGE)
    d.text((90, 1050), "", font=fnt(600, 20), fill=COBRE)
    return p


def p_identidade():
    p = page("Identidade Visual", "Logo original redesenhado, cores, letras, elementos e aplicações", 4, tag="PROPOSTA")
    for i, n in enumerate((1, 3, 4, 5)):
        im = Image.open(OUT / f"identidade/fazendinha_identidade_{n}.png").resize((700, 394), Image.LANCZOS)
        r, c = divmod(i, 2)
        shadow_paste(p, rounded(im, 16), (220 + c * 780, 200 + r * 420))
    d = ImageDraw.Draw(p)
    d.text((PW / 2, 1055), "Manual completo enviado junto: fazendinha_manual_identidade.pdf", font=fnt(600, 22),
           fill=MARROM, anchor="mm")
    return p


def p_pacotes():
    p = pattern(PW, PH).copy()
    bandeirinhas(p, 1.6, y0=-30)
    d = ImageDraw.Draw(p)
    d.text((PW / 2, 175), "ESCOLHA O SEU PACOTE", font=fnt(900, 64), fill=CREAM, anchor="mm")
    cw, ch, gap = 540, 700, 40
    x0 = (PW - (cw * 3 + gap * 2)) // 2
    for i, (name, price, items, hl) in enumerate(PACOTES):
        x, y = x0 + i * (cw + gap), 270 - (24 if hl else 0)
        h = ch + (48 if hl else 0)
        card = Image.new("RGBA", (cw, h), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card)
        cd.rounded_rectangle((0, 0, cw - 1, h - 1), 34, fill=(CREAM if hl else (255, 250, 242)) + (255,),
                             outline=(ORANGE if hl else (230, 214, 190)) + (255,), width=6 if hl else 2)
        top = 70
        if hl:
            tg = tarja("MAIS ESCOLHIDO", 26, ORANGE)
            card.alpha_composite(tg, (cw // 2 - tg.width // 2, 26))
            top = 120
        cd.text((cw / 2, top + 10), name, font=ff("bevan", 64), fill=MAROON, anchor="mm")
        cd.text((cw / 2 - 100, top + 140), "R$", font=fnt(800, 34), fill=MARROM, anchor="rm")
        cd.text((cw / 2 - 88, top + 132), price, font=fnt(900, 130), fill=(ORANGE if hl else MAROON), anchor="lm")
        cd.line((60, top + 225, cw - 60, top + 225), fill=(230, 214, 190), width=2)
        for j, it in enumerate(items):
            yy = top + 285 + j * 60
            cd.ellipse((56, yy - 15, 86, yy + 15), fill=ORANGE + (255,))
            cd.line((63, yy, 69, yy + 7, 80, yy - 7), fill=WHITE, width=4)
            cd.text((106, yy), it, font=fnt(700, 25), fill=MAROON, anchor="lm")
        shadow_paste(p, card, (x, y), blur=20, alpha=150)
    d.text((PW / 2, 1035), "Valores por pacote. Locução com voz profissional; fotos e informações fornecidas pela Fazendinha.",
           font=fnt(600, 22), fill=COBRE, anchor="mm")
    return p


def p_proximos():
    p = page("Próximos Passos", "Simples e rápido: a Fazendinha só precisa escolher e mandar as fotos", 5, tag="PROPOSTA")
    d = ImageDraw.Draw(p)
    steps = [("1", "Escolhe o pacote", "START, PRO ou MAX"), ("2", "Manda as fotos", "pratos, eventos, música"),
             ("3", "Aprova os roteiros", "ajustamos o que precisar"), ("4", "Recebe tudo pronto", "é só postar")]
    for i, (n, t1, t2) in enumerate(steps):
        x = 90 + i * 440
        d.rounded_rectangle((x, 240, x + 400, 620), 30, fill=(255, 250, 242, 255), outline=(230, 214, 190), width=2)
        d.ellipse((x + 40, 280, x + 140, 380), fill=ORANGE + (255,))
        d.text((x + 90, 330), n, font=fnt(900, 56), fill=WHITE, anchor="mm")
        d.text((x + 40, 450), t1, font=fnt(900, 30), fill=MAROON, anchor="lm")
        d.text((x + 40, 505), t2, font=fnt(600, 26), fill=MARROM, anchor="lm")
    band = Image.new("RGBA", (PW - 180, 300), MAROON3 + (255,))
    band = rounded(band, 30)
    p.alpha_composite(band, (90, 690))
    put(p, criativos(110), 560, 840)
    d.text((960, 805), "Conteúdo que dá água na boca", font=fnt(900, 42), fill=CREAM, anchor="lm")
    d.text((960, 865), "e enche a casa no fim de semana.", font=fnt(900, 42), fill=YELLOW, anchor="lm")
    return p


def main():
    pages = [p_capa(), p_video(), p_carrosseis(), p_posts(), p_identidade(), p_pacotes(), p_proximos()]
    rgb = [pg.convert("RGB") for pg in pages]
    out = OUT / "proposta_fazendinha.pdf"
    rgb[0].save(out, save_all=True, append_images=rgb[1:], resolution=150)
    prev = OUT / "proposta_paginas"
    prev.mkdir(exist_ok=True)
    for i, pg in enumerate(rgb):
        pg.save(prev / f"proposta_{i + 1}.jpg", quality=92)
    print("OK ->", out)


if __name__ == "__main__":
    main()
