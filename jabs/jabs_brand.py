#!/usr/bin/env python3
"""Identidade visual, carrossel de exemplo, perfil simulado e proposta (PDF) - JABS Engenharia.

Uso: python3 jabs_brand.py  ->  saida/identidade/, saida/carrossel/, saida/perfil/, saida/proposta_jabs.pdf
"""
import math
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

import jabs_art as J
from jabs_art import font, text_width, tracked

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "saida"

ONYX, GRAPH, STONE, IVORY, WHITE = (11, 11, 12), (38, 38, 41), (140, 137, 130), (243, 240, 234), (255, 255, 255)
SOFT = (200, 198, 192)
WHATS = "(61) 99325-4777"

# ------------------------------------------------------------------ helpers --
_src = Image.open(ROOT / "assets/obra_jl.jpg").convert("RGB").crop((0, 82, 828, 674))
_big = _src.resize((_src.width * 3, _src.height * 3), Image.LANCZOS)
PHOTO = ImageEnhance.Contrast(_big).enhance(1.08)
_g = ImageOps.autocontrast(ImageOps.grayscale(_big), cutoff=1)
PHOTO_BW = ImageEnhance.Contrast(Image.merge("RGB", (_g, _g, _g))).enhance(1.25)


def cover(img, w, h, cx=0.5, cy=0.5, zoom=1.0):
    """Recorta img para w x h (preenchendo), com centro e zoom."""
    s = max(w / img.width, h / img.height) * zoom
    rw, rh = img.width * s, img.height * s
    x0 = min(max(cx * rw - w / 2, 0), rw - w)
    y0 = min(max(cy * rh - h / 2, 0), rh - h)
    r = img.resize((int(rw), int(rh)), Image.LANCZOS)
    return r.crop((int(x0), int(y0), int(x0) + w, int(y0) + h)).convert("RGBA")


def grad(w, h, a, b, vertical=True):
    t = np.linspace(0, 1, h if vertical else w)
    col = np.array(a, np.float32)[None] * (1 - t[:, None]) + np.array(b, np.float32)[None] * t[:, None]
    arr = np.repeat(col[:, None], w, 1) if vertical else np.repeat(col[None], h, 0)
    return Image.fromarray(arr.astype(np.uint8), "RGBA" if len(a) == 4 else "RGB").convert("RGBA")


def shade(w, h, start=0.45, strength=235):
    y = np.linspace(0, 1, h)[:, None]
    a = (np.clip((y - start) / (1 - start), 0, 1) ** 1.2 * strength).repeat(w, 1).astype(np.uint8)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    img.putalpha(Image.fromarray(a))
    return img


@lru_cache(None)
def concrete(w, h, base=16, amp=10, seed=1):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, (h // 4 + 1, w // 4 + 1))
    img = Image.fromarray(((n - n.min()) / (n.max() - n.min()) * 255).astype(np.uint8), "L").resize((w, h), Image.BICUBIC)
    img = img.filter(ImageFilter.GaussianBlur(2))
    arr = np.asarray(img).astype(np.float32) / 255 * amp + base
    fine = np.random.default_rng(seed + 1).normal(0, 2.2, (h, w))
    arr = np.clip(arr + fine, 0, 255)
    return Image.merge("RGB", [Image.fromarray(arr.astype(np.uint8))] * 3).convert("RGBA")


def T(d, xy, text, f, fill, anchor="la", track=0):
    if track:
        x, y = xy
        if anchor[0] == "m":
            tracked(d, x, y, text, f, fill, track)
        else:
            tracked(d, x, y, text, f, fill, track, anchor_center=False)
    else:
        d.text(xy, text, font=f, fill=fill, anchor=anchor)


def shadow_paste(base, img, xy, blur=24, off=(0, 18), alpha=150, rot=0):
    if rot:
        img = img.rotate(rot, Image.BICUBIC, expand=True)
    sh = Image.new("RGBA", (img.width + blur * 4, img.height + blur * 4), (0, 0, 0, 0))
    sh.paste((0, 0, 0, alpha), (blur * 2, blur * 2), img.getchannel("A"))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(sh, (xy[0] - blur * 2 + off[0], xy[1] - blur * 2 + off[1]))
    base.alpha_composite(img, xy)


def rounded(img, r):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width - 1, img.height - 1), r, fill=255)
    out = img.copy()
    out.putalpha(m)
    return out


# --------------------------------------------------------------- marcas -----
@lru_cache(None)
def seal(size=600, color=WHITE):
    """Selo circular: monograma ao centro e texto em volta."""
    k = 3
    s = size * k
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = color + (255,)
    lw = max(1, int(s * .004))
    d.ellipse((s * .02, s * .02, s * .98, s * .98), outline=c, width=lw)
    d.ellipse((s * .2, s * .2, s * .8, s * .8), outline=c, width=lw)
    ic = J.icon(int(s * .5), color)
    img.alpha_composite(ic, (int(s * .25), int(s * .22)))
    text = "JABS ENGENHARIA  ·  ALTO PADRÃO  ·  BRASÍLIA  ·  "
    f = font("mont4", int(s * .052))
    r = s * .4
    n = len(text)
    for i, ch in enumerate(text):
        a = -math.pi / 2 + 2 * math.pi * i / n
        g = Image.new("RGBA", (int(s * .1), int(s * .1)), (0, 0, 0, 0))
        ImageDraw.Draw(g).text((g.width / 2, g.height / 2), ch, font=f, fill=c, anchor="mm")
        g = g.rotate(-math.degrees(a) - 90, Image.BICUBIC)
        img.alpha_composite(g, (int(s / 2 + r * math.cos(a) - g.width / 2), int(s / 2 + r * math.sin(a) - g.height / 2)))
    return img.resize((size, size), Image.LANCZOS)


# ----------------------------------------------------- identidade (página) --
def page_identity():
    W, H = 1920, 1080
    p = Image.new("RGBA", (W, H), IVORY + (255,))
    left = concrete(760, H, 12, 12)
    p.alpha_composite(left, (0, 0))
    lk = J.lockup(470)
    p.alpha_composite(lk, ((760 - lk.width) // 2, 300))
    d = ImageDraw.Draw(p)
    T(d, (380, 110), "IDENTIDADE VISUAL", font("mont4", 22), SOFT, "mm", track=10)
    T(d, (380, 960), "Precisão em cada etapa.", font("cormi", 44), (230, 228, 222), "mm")
    # coluna direita
    x0 = 860
    T(d, (x0, 110), "JABS ENGENHARIA", font("mont4", 22), STONE, track=10)
    T(d, (x0, 180), "A construtora de alto padrão", font("corm", 64), ONYX)
    T(d, (x0, 250), "mais exclusiva de Brasília.", font("cormi", 64), ONYX)
    d.line((x0, 330, x0 + 120, 330), fill=ONYX, width=2)
    # paleta
    T(d, (x0, 380), "PALETA", font("mont5", 20), STONE, track=8)
    sw = [("ÔNIX", "#0B0B0C", ONYX), ("GRAFITE", "#262629", GRAPH), ("PEDRA", "#8C8982", STONE),
          ("MARFIM", "#F3F0EA", IVORY), ("BRANCO", "#FFFFFF", WHITE)]
    for i, (nm, hx, col) in enumerate(sw):
        x = x0 + i * 196
        d.rectangle((x, 420, x + 176, 560), fill=col, outline=(210, 206, 198) if col in (IVORY, WHITE) else None)
        T(d, (x, 576), nm, font("mont5", 18), ONYX, track=4)
        T(d, (x, 604), hx, font("mont3", 18), STONE)
    # tipografia
    T(d, (x0, 670), "TIPOGRAFIA", font("mont5", 20), STONE, track=8)
    T(d, (x0, 700), "Aa", font("cinzel", 96), ONYX)
    T(d, (x0 + 150, 712), "Cinzel", font("mont5", 22), ONYX)
    T(d, (x0 + 150, 745), "Marca e títulos", font("mont3", 18), STONE)
    T(d, (x0 + 330, 700), "Aa", font("cormi", 96), ONYX)
    T(d, (x0 + 460, 712), "Cormorant Garamond", font("mont5", 22), ONYX)
    T(d, (x0 + 460, 745), "Textos editoriais", font("mont3", 18), STONE)
    T(d, (x0 + 730, 712), "Aa", font("mont3", 78), ONYX)
    T(d, (x0 + 840, 712), "Montserrat", font("mont5", 22), ONYX)
    T(d, (x0 + 840, 745), "Apoio e informação", font("mont3", 18), STONE)
    # marcas secundárias
    T(d, (x0, 850), "MARCAS DE APOIO", font("mont5", 20), STONE, track=8)
    p.alpha_composite(seal(150, ONYX), (x0, 885))
    ic = J.icon(150, ONYX)
    p.alpha_composite(ic, (x0 + 190, 885))
    av = J.avatar(150, True)
    p.alpha_composite(av, (x0 + 380, 885))
    wm = J.wordmark(300, ONYX)
    p.alpha_composite(wm, (x0 + 570, 915))
    return p


# ------------------------------------------------------ aplicações (página) --
def business_cards():
    cw, ch = 700, 400
    front = concrete(cw, ch, 14, 10, seed=3)
    lk = J.lockup(260)
    front.alpha_composite(lk, ((cw - lk.width) // 2, (ch - lk.height) // 2))
    back = Image.new("RGBA", (cw, ch), IVORY + (255,))
    d = ImageDraw.Draw(back)
    back.alpha_composite(J.icon(90, ONYX), (50, 40))
    T(d, (50, 170), "Engenheiro Responsável", font("cormi", 40), ONYX)
    T(d, (50, 238), "CONSTRUTORA & INCORPORADORA", font("mont4", 16), STONE, track=4)
    d.line((50, 278, 140, 278), fill=ONYX, width=2)
    T(d, (50, 300), WHATS, font("mont4", 22), ONYX)
    T(d, (50, 336), "@jabsengenharia", font("mont3", 20), ONYX)
    return rounded(front, 10), rounded(back, 10)


def placa_obra():
    w, h = 760, 520
    p = concrete(w, h, 10, 10, seed=7)
    d = ImageDraw.Draw(p)
    d.rectangle((24, 24, w - 24, h - 24), outline=(220, 220, 222), width=2)
    T(d, (w / 2, 110), "AQUI, A JABS CONSTRÓI", font("mont4", 24), SOFT, "mm", track=10)
    T(d, (w / 2, 185), "Alto padrão", font("cormi", 72), WHITE, "mm")
    T(d, (w / 2, 255), "em cada detalhe.", font("cormi", 72), WHITE, "mm")
    wm = J.wordmark(230)
    p.alpha_composite(wm, ((w - wm.width) // 2, 312))
    T(d, (w / 2, 458), f"{WHATS}  ·  @jabsengenharia", font("mont3", 22), SOFT, "mm", track=2)
    return p


def page_applications():
    W, H = 1920, 1080
    p = concrete(W, H, 205, 18, seed=11)
    d = ImageDraw.Draw(p)
    T(d, (90, 90), "APLICAÇÕES", font("mont5", 22), GRAPH, track=10)
    T(d, (90, 130), "A marca no dia a dia da obra.", font("cormi", 58), ONYX)
    f, b = business_cards()
    shadow_paste(p, f, (110, 300), rot=-4)
    shadow_paste(p, b, (300, 640), rot=3)
    pl = placa_obra()
    shadow_paste(p, pl, (760, 250))
    # mockup de post
    post = carousel_slides()[0].resize((320, 400), Image.LANCZOS)
    shadow_paste(p, rounded(post, 8), (1570, 330), rot=-2)
    T(d, (900, 815), "Placa de obra / tapume", font("mont4", 20), GRAPH, track=3)
    T(d, (1600, 815), "Post de Instagram", font("mont4", 20), GRAPH, track=3)
    T(d, (330, 1060), "Cartão de visita", font("mont4", 20), GRAPH, track=3)
    return p


# ----------------------------------------------------- carrossel de exemplo --
CW, CH = 1080, 1350


def _footer(img, n, dark=True):
    d = ImageDraw.Draw(img)
    col = SOFT if dark else STONE
    T(d, (80, CH - 80), "JABS ENGENHARIA", font("mont4", 22), col, track=8)
    T(d, (CW - 80, CH - 80), f"{n:02d} / 06", font("mont3", 22), col, "ra")
    d.line((80, CH - 120, CW - 80, CH - 120), fill=col + (90,), width=1)


@lru_cache(None)
def carousel_slides():
    out = []
    # 1 capa
    s = cover(PHOTO_BW, CW, CH, cx=0.45, zoom=1.0)
    s.alpha_composite(shade(CW, CH, 0.35, 245))
    d = ImageDraw.Draw(s)
    T(d, (80, 860), "ALTO PADRÃO", font("mont4", 26), SOFT, track=10)
    T(d, (80, 900), "Do projeto", font("corm", 120), WHITE)
    T(d, (80, 1030), "à chave.", font("cormi", 120), WHITE)
    T(d, (CW - 80, 1210), "ARRASTE  →", font("mont4", 22), SOFT, "ra", track=6)
    s.alpha_composite(J.icon(110), (CW - 190, 70))
    out.append(s)
    # 2-5 etapas
    steps = [
        ("01", "Projeto", "Planejamento completo antes do primeiro tijolo.", "blue"),
        ("02", "Precisão", "Execução técnica rigorosa em cada etapa da obra.", "detail"),
        ("03", "Acabamento", "Materiais nobres e acabamento impecável.", "detail2"),
        ("04", "Entrega", "Cronograma cumprido à risca. Sua obra não atrasa.", "time"),
    ]
    for num, title, text, kind in steps:
        s = concrete(CW, CH, 12, 10, seed=int(num) + 20)
        d = ImageDraw.Draw(s)
        if kind == "blue":
            s.alpha_composite(J.draw_blueprint(920, 700, 1.0), (80, 120))
        elif kind in ("detail", "detail2"):
            ph = cover(PHOTO_BW if kind == "detail" else PHOTO, 920, 700, cx=0.22 if kind == "detail" else 0.62,
                       cy=0.45, zoom=1.9)
            s.alpha_composite(ph, (80, 120))
        else:
            x0, x1, y = 160, 920, 470
            d.line((x0, y, x1, y), fill=(240, 240, 242), width=3)
            for i, lab in enumerate(["PROJETO", "ESTRUTURA", "ACABAMENTO", "ENTREGA"]):
                mx = x0 + (x1 - x0) * i / 3
                r = 14 if i < 3 else 22
                d.ellipse((mx - r, y - r, mx + r, y + r), fill=(240, 240, 242))
                T(d, (mx, y + 60), lab, font("mont4", 22), SOFT, "mm", track=4)
            d.line((x1 - 10, y, x1 - 3, y + 8, x1 + 11, y - 9), fill=ONYX, width=5)
            T(d, (CW / 2, 300), "NO PRAZO", font("cinzel", 110), WHITE, "mm", track=14)
        T(d, (80, 900), num, font("cinzel", 40), SOFT)
        d.line((150, 925, 230, 925), fill=SOFT, width=1)
        T(d, (80, 950), title, font("corm", 110), WHITE)
        # quebra de linha simples
        words, lines, cur = text.split(), [], ""
        fb = font("mont3", 34)
        for w_ in words:
            test = (cur + " " + w_).strip()
            if d.textlength(test, font=fb) > CW - 160:
                lines.append(cur)
                cur = w_
            else:
                cur = test
        lines.append(cur)
        for i, ln in enumerate(lines):
            T(d, (80, 1085 + i * 48), ln, fb, (225, 223, 218))
        _footer(s, int(num) + 1)
        out.append(s)
    # 6 CTA
    s = Image.new("RGBA", (CW, CH), IVORY + (255,))
    d = ImageDraw.Draw(s)
    lk = J.lockup(520, ONYX)
    s.alpha_composite(lk, ((CW - lk.width) // 2, 200))
    T(d, (CW / 2, 800), "Vamos construir o seu", font("corm", 70), ONYX, "mm")
    T(d, (CW / 2, 880), "próximo endereço?", font("cormi", 70), ONYX, "mm")
    d.rounded_rectangle((240, 980, 840, 1080), 50, outline=ONYX, width=2)
    T(d, (CW / 2, 1030), f"WHATSAPP  {WHATS}", font("mont4", 28), ONYX, "mm", track=3)
    _footer(s, 6, dark=False)
    out.append(s)
    return out


# --------------------------------------------------------- perfil simulado --
def post_tiles():
    """12 posts do feed (3:4), mistura de foto, tipografia e marca."""
    w, h = 1080, 1440
    tiles = []

    def typo(lines, bg, fg, sub=None, italic_last=True):
        s = concrete(w, h, 12, 10, seed=len(tiles) + 40) if bg == "dark" else Image.new("RGBA", (w, h), IVORY + (255,))
        d = ImageDraw.Draw(s)
        y = h / 2 - len(lines) * 75
        for i, ln in enumerate(lines):
            f = font("cormi" if (italic_last and i == len(lines) - 1) else "corm", 140)
            T(d, (w / 2, y + i * 150), ln, f, fg, "mm")
        if sub:
            T(d, (w / 2, y + len(lines) * 150 + 40), sub, font("mont4", 30), STONE if bg != "dark" else SOFT, "mm", track=10)
        return s

    def photo(img, cx, cy, zoom, label=None):
        s = cover(img, w, h, cx=cx, cy=cy, zoom=zoom)
        if label:
            s.alpha_composite(shade(w, h, 0.55, 220))
            T(ImageDraw.Draw(s), (70, h - 120), label, font("mont4", 44), WHITE, track=10)
        return s

    tiles.append(photo(PHOTO, 0.5, 0.5, 1.0, "OBRA JL"))
    tiles.append(typo(["Precisão", "em cada etapa."], "dark", WHITE))
    bp = concrete(w, h, 12, 10, seed=60)
    bp.alpha_composite(J.draw_blueprint(1000, 800, 1.0), (40, 320))
    tiles.append(bp)
    tiles.append(photo(PHOTO_BW, 0.22, 0.45, 2.0))
    tiles.append(typo(["Sua obra", "não atrasa."], "light", ONYX, "CRONOGRAMA CUMPRIDO"))
    lg = concrete(w, h, 12, 10, seed=61)
    lk = J.lockup(640)
    lg.alpha_composite(lk, ((w - lk.width) // 2, (h - lk.height) // 2))
    tiles.append(lg)
    tiles.append(carousel_slides()[0].resize((w, int(w * CH / CW))).crop((0, 0, w, h)) if False else
                 cover(carousel_slides()[0], w, h))
    tiles.append(photo(PHOTO_BW, 0.5, 0.5, 1.0))
    q = photo(PHOTO, 0.7, 0.5, 1.6)
    q.alpha_composite(shade(w, h, 0.3, 235))
    dq = ImageDraw.Draw(q)
    T(dq, (w / 2, 1050), "Onde o conforto", font("cormi", 96), WHITE, "mm")
    T(dq, (w / 2, 1160), "encontra a elegância.", font("cormi", 96), WHITE, "mm")
    tiles.append(q)
    tiles.append(typo(["ALTO", "PADRÃO"], "light", ONYX, "BRASÍLIA · DF", italic_last=False))
    tiles.append(cover(carousel_slides()[4], w, h))
    tiles.append(photo(PHOTO, 0.6, 0.35, 2.2))
    return tiles


def profile_screen():
    """Tela do Instagram (modo escuro) com perfil simulado."""
    W, H = 1170, 2532
    s = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(s)
    sf = lambda n: font("mont5", n)
    sr = lambda n: font("mont4", n)
    T(d, (90, 70), "9:41", sf(44), WHITE)
    d.rounded_rectangle((W - 160, 72, W - 80, 108), 10, outline=WHITE, width=3)
    d.rounded_rectangle((W - 152, 80, W - 100, 100), 5, fill=WHITE)
    T(d, (60, 200), "‹", font("mont3", 90), WHITE, "lm")
    T(d, (140, 200), "jabsengenharia", sf(52), WHITE, "lm")
    d.ellipse((140 + d.textlength("jabsengenharia", font=sf(52)) + 16, 182, 140 + d.textlength("jabsengenharia", font=sf(52)) + 52, 218),
              fill=(56, 151, 240))
    T(d, (W - 80, 200), "···", sf(52), WHITE, "rm")
    av = J.avatar(250, True)
    ring = Image.new("RGBA", (280, 280), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse((0, 0, 279, 279), outline=(110, 110, 112), width=4)
    s.alpha_composite(ring, (50, 290))
    s.alpha_composite(av, (65, 305))
    T(d, (380, 330), "JABS Engenharia", sf(42), WHITE)
    for i, (num, lab) in enumerate([("52", "posts"), ("2.148", "seguidores"), ("87", "seguindo")]):
        x = 380 + i * 250
        T(d, (x, 400), num, sf(46), WHITE)
        T(d, (x, 465), lab, sr(38), WHITE)
    y = 620
    T(d, (60, y), "Construtora e incorporadora", sr(38), (168, 168, 170))
    bio = ["Obras de alto padrão em Brasília-DF", "Precisão em cada etapa. Do projeto à chave.",
           "Cronograma cumprido: sua obra não atrasa."]
    for i, ln in enumerate(bio):
        T(d, (60, y + 56 + i * 54), ln, sr(38), WHITE)
    T(d, (60, y + 56 + 3 * 54), "wa.me/5561993254777", sr(38), (150, 170, 255))
    by = y + 300
    for i, (lab, col) in enumerate([("Seguir", (0, 149, 246)), ("Mensagem", (38, 38, 40)), ("WhatsApp", (38, 38, 40))]):
        x = 60 + i * 360
        d.rounded_rectangle((x, by, x + 340, by + 96), 20, fill=col)
        T(d, (x + 170, by + 48), lab, sf(38), WHITE, "mm")
    hy = by + 160
    for i, lab in enumerate(["Obras", "Processo", "Entregas", "Clientes", "Contato"]):
        x = 60 + i * 216
        d.ellipse((x, hy, x + 170, hy + 170), outline=(90, 90, 92), width=3)
        d.ellipse((x + 10, hy + 10, x + 160, hy + 160), fill=(18, 18, 19))
        s.alpha_composite(J.icon(110), (x + 30, hy + 25))
        T(d, (x + 85, hy + 210), lab, sr(32), WHITE, "mm")
    ty = hy + 280
    d.line((0, ty + 90, W, ty + 90), fill=(40, 40, 42), width=2)
    d.line((W / 3 * 0 + 60, ty + 90, W / 3 - 60, ty + 90), fill=WHITE, width=4)
    for i in range(3):
        cx = W / 6 + i * W / 3
        if i == 0:
            for gx in range(3):
                for gy in range(3):
                    d.rectangle((cx - 27 + gx * 20, ty + 18 + gy * 20, cx - 13 + gx * 20, ty + 32 + gy * 20), fill=WHITE)
        elif i == 1:
            d.rounded_rectangle((cx - 28, ty + 16, cx + 28, ty + 72), 12, outline=(160, 160, 162), width=4)
            d.polygon([(cx - 8, ty + 32), (cx - 8, ty + 56), (cx + 12, ty + 44)], fill=(160, 160, 162))
        else:
            d.rounded_rectangle((cx - 28, ty + 16, cx + 28, ty + 72), 12, outline=(160, 160, 162), width=4)
            d.ellipse((cx - 11, ty + 26, cx + 11, ty + 48), outline=(160, 160, 162), width=4)
    gy0 = ty + 96
    tw = (W - 4) // 3
    th = int(tw * 4 / 3)
    tiles = post_tiles()
    for i, tl in enumerate(tiles):
        r, c = divmod(i, 3)
        x, y = c * (tw + 2), gy0 + r * (th + 2)
        if y > H:
            break
        s.alpha_composite(tl.resize((tw, th), Image.LANCZOS), (x, y))
        if i in (1, 6, 10):  # ícone de carrossel
            d.rounded_rectangle((x + tw - 62, y + 22, x + tw - 26, y + 58), 6, outline=WHITE, width=4)
        if i in (0, 3, 8):  # ícone de reels
            d.rounded_rectangle((x + tw - 64, y + 20, x + tw - 22, y + 62), 10, outline=WHITE, width=4)
            d.polygon([(x + tw - 50, y + 31), (x + tw - 50, y + 51), (x + tw - 34, y + 41)], fill=WHITE)
    return s


def phone(screen, width=520):
    k = width / screen.width
    sc = screen.resize((width, int(screen.height * k)), Image.LANCZOS)
    pad = int(width * 0.035)
    body = Image.new("RGBA", (width + pad * 2, sc.height + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((0, 0, body.width - 1, body.height - 1), int(width * .14), fill=(28, 28, 30),
                                           outline=(80, 80, 84), width=3)
    body.alpha_composite(rounded(sc, int(width * .11)), (pad, pad))
    ImageDraw.Draw(body).rounded_rectangle((body.width / 2 - width * .15, pad + width * .025, body.width / 2 + width * .15,
                                            pad + width * .085), int(width * .03), fill=(0, 0, 0))
    return body


def page_profile():
    W, H = 1920, 1080
    p = Image.new("RGBA", (W, H), IVORY + (255,))
    d = ImageDraw.Draw(p)
    ph = phone(profile_screen(), 440)
    sc = 1000 / ph.height
    ph = ph.resize((int(ph.width * sc), 1000), Image.LANCZOS)
    shadow_paste(p, ph, (140, 40))
    x0 = 760
    T(d, (x0, 110), "INSTAGRAM  ·  SIMULAÇÃO", font("mont5", 22), STONE, track=10)
    T(d, (x0, 160), "Um perfil à altura", font("corm", 70), ONYX)
    T(d, (x0, 240), "das obras que vocês entregam.", font("cormi", 70), ONYX)
    d.line((x0, 340, x0 + 120, 340), fill=ONYX, width=2)
    pts = ["Feed com padrão editorial: foto de obra, tipografia e marca alternadas.",
           "Reels com locução profissional e roteiro focado em alto padrão e prazo.",
           "Carrosséis que explicam o processo: do projeto à chave.",
           "Bio, destaques e capa alinhados à nova identidade."]
    for i, t_ in enumerate(pts):
        y = 400 + i * 80
        d.ellipse((x0, y + 14, x0 + 10, y + 24), fill=ONYX)
        T(d, (x0 + 34, y), t_, font("mont3", 28), GRAPH)
    T(d, (x0, 760), "CARROSSEL DE EXEMPLO", font("mont5", 20), STONE, track=8)
    slides = carousel_slides()
    for i, sl in enumerate(slides):
        th = sl.resize((176, 220), Image.LANCZOS)
        shadow_paste(p, th, (x0 + i * 192, 800), blur=10, off=(0, 8), alpha=90)
    T(d, (x0, 1045), "Números ilustrativos: projeção de perfil com conteúdo consistente.", font("mont3", 18), STONE)
    return p


# ------------------------------------------------------------------ planos --
PLANS = [
    ("START", "247", ["3 vídeos com locução profissional", "3 carrosséis", "Roteiro e legendas", "Ajustes inclusos"], False),
    ("PRO", "497", ["Identidade visual completa", "6 vídeos com locução profissional", "6 carrosséis",
                    "Roteiro e legendas", "Ajustes inclusos"], True),
    ("MAX", "997", ["Identidade visual completa", "Landing page profissional", "9 vídeos com locução profissional",
                    "9 carrosséis", "Roteiro e legendas", "Prioridade nas entregas"], False),
]


def page_plans():
    W, H = 1920, 1080
    p = concrete(W, H, 12, 10, seed=90)
    d = ImageDraw.Draw(p)
    T(d, (W / 2, 120), "INVESTIMENTO", font("mont5", 22), SOFT, "mm", track=12)
    T(d, (W / 2, 200), "Escolha o seu plano.", font("cormi", 76), WHITE, "mm")
    cw, ch, gap = 540, 700, 40
    x0 = (W - (cw * 3 + gap * 2)) // 2
    for i, (name, price, items, hl) in enumerate(PLANS):
        x, y = x0 + i * (cw + gap), 300 - (20 if hl else 0)
        h = ch + (40 if hl else 0)
        card = Image.new("RGBA", (cw, h), (IVORY if hl else (24, 24, 26)) + (255,))
        cd = ImageDraw.Draw(card)
        fg, sub = (ONYX, STONE) if hl else (WHITE, SOFT)
        if not hl:
            cd.rectangle((0, 0, cw - 1, h - 1), outline=(70, 70, 74), width=2)
        if hl:
            cd.rectangle((0, 0, cw, 56), fill=ONYX)
            T(cd, (cw / 2, 28), "MAIS ESCOLHIDO", font("mont5", 20), IVORY, "mm", track=8)
        top = 90 if hl else 60
        T(cd, (cw / 2, top + 20), name, font("cinzel", 54), fg, "mm", track=12)
        cd.line((cw / 2 - 40, top + 80, cw / 2 + 40, top + 80), fill=sub, width=1)
        T(cd, (cw / 2 - 95, top + 165), "R$", font("mont4", 30), sub, "rm")
        T(cd, (cw / 2 - 85, top + 160), price, font("corm", 120), fg, "lm")
        for j, it in enumerate(items):
            yy = top + 260 + j * 58
            cd.line((60, yy + 2, 70, yy + 12, 88, yy - 8), fill=fg, width=3)
            T(cd, (106, yy - 13), it, font("mont3", 24), fg)
        shadow_paste(p, card, (x, y), blur=20, alpha=160)
    T(d, (W / 2, 1040), "Valores por pacote. Locução com voz profissional por IA; fotos fornecidas pelo cliente.",
      font("mont3", 20), SOFT, "mm")
    return p


def page_video():
    """Quadros do vídeo de amostra."""
    W, H = 1920, 1080
    p = Image.new("RGBA", (W, H), IVORY + (255,))
    d = ImageDraw.Draw(p)
    T(d, (90, 110), "VÍDEO DE AMOSTRA  ·  30 S", font("mont5", 22), STONE, track=10)
    T(d, (90, 160), "Cinema de alto padrão", font("corm", 70), ONYX)
    T(d, (90, 240), "no feed da JABS.", font("cormi", 70), ONYX)
    frames_dir = OUT / "frames_video"
    files = sorted(frames_dir.glob("*.jpg"), key=lambda q: float(q.stem.split("_")[1]))
    for i, f_ in enumerate(files[:5]):
        im = Image.open(f_).convert("RGBA").resize((300, 533), Image.LANCZOS)
        shadow_paste(p, rounded(im, 16), (90 + i * 360, 400), blur=14, off=(0, 10), alpha=110)
    T(d, (90, 1000), "Arquivo do vídeo enviado junto com esta proposta (jabs_30s.mp4).", font("mont3", 22), STONE)
    return p


def main():
    (OUT / "identidade").mkdir(parents=True, exist_ok=True)
    (OUT / "carrossel").mkdir(parents=True, exist_ok=True)
    (OUT / "perfil").mkdir(parents=True, exist_ok=True)
    pages = [page_identity(), page_applications(), page_profile(), page_video(), page_plans()]
    names = ["01_identidade", "02_aplicacoes", "03_perfil", "04_video", "05_planos"]
    for pg, nm in zip(pages, names):
        pg.convert("RGB").save(OUT / "identidade" / f"{nm}.png")
    for i, sl in enumerate(carousel_slides(), 1):
        sl.convert("RGB").save(OUT / "carrossel" / f"jabs_carrossel_{i}.png")
    profile_screen().convert("RGB").save(OUT / "perfil" / "jabs_perfil_instagram.png")
    rgb = [pg.convert("RGB") for pg in pages]
    rgb[0].save(OUT / "proposta_jabs.pdf", save_all=True, append_images=rgb[1:], resolution=150)
    print("OK")


if __name__ == "__main__":
    main()
