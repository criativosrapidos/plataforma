#!/usr/bin/env python3
"""Identidade visual completa da Fazendinha Self Service + posts, stories e capas de destaque.

Uso: python3 faz_brand.py  -> saida/identidade/, saida/posts/, saida/stories/, saida/destaques/
"""
import math
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import faz_art as F
from faz_art import CREAM, MAROON, MAROON3
from render_carrosseis_v2 import chrome, cover, line, shade as cshade
from render_faz import bandeirinhas, photo
from render_faz_v2 import BLACK, INSTA, ORANGE, WHITE, YELLOW, emoji, fnt, price_card, price_value, stamp

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "saida"
FONTS = ROOT / "fonts"
COBRE, MARROM = (230, 166, 100), (88, 28, 26)
PALETTE = [("VINHO", MAROON, "#361012"), ("VINHO MÉDIO", MARROM, "#581C1A"), ("COBRE", COBRE, "#E6A664"),
           ("CREME", CREAM, "#F7ECD8"), ("LARANJA", ORANGE, "#F57A1E"), ("AMARELO", YELLOW, "#FFCE2E")]


@lru_cache(None)
def ff(name, size):
    files = {"bevan": "bevan-latin-400-normal.woff", "lobster": "lobster-latin-400-normal.woff"}
    return ImageFont.truetype(str(FONTS / files[name]), size)


def tw(text, f):
    return ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f)


def shadow_paste(base, img, xy, blur=22, off=(0, 16), alpha=140):
    sh = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, alpha), (int(xy[0] + off[0]), int(xy[1] + off[1])), img.getchannel("A"))
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    base.alpha_composite(img, (int(xy[0]), int(xy[1])))


def put(base, img, cx, cy, rot=0, shadow=False):
    if rot:
        img = img.rotate(rot, Image.BICUBIC, expand=True)
    xy = (cx - img.width / 2, cy - img.height / 2)
    if shadow:
        shadow_paste(base, img, xy)
    else:
        base.alpha_composite(img, (int(xy[0]), int(xy[1])))


@lru_cache(None)
def pattern(w, h, c1=(66, 22, 22), c2=(56, 18, 18), cell=110):
    """Padrão de losangos do selo, como fundo da marca."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32) / cell
    chk = ((np.floor(xx + yy) + np.floor(xx - yy)) % 2)[..., None]
    col = np.array(c1, np.float32) * chk + np.array(c2, np.float32) * (1 - chk)
    return Image.fromarray(np.concatenate([col, np.full((h, w, 1), 255, np.float32)], -1).astype(np.uint8))


def duotone(img, dark, light):
    """Versão em duas cores do selo (para gravação, bordado, carimbo)."""
    g = np.asarray(img.convert("L")).astype(np.float32) / 255
    g = np.clip((g - .12) / .75, 0, 1)[..., None]
    col = np.array(dark, np.float32) * (1 - g) + np.array(light, np.float32) * g
    out = Image.fromarray(np.concatenate([col, np.asarray(img.getchannel("A"))[..., None].astype(np.float32)], -1)
                          .astype(np.uint8))
    return out


def logo(size):
    return F.logo_recriado(size)


# ------------------------------------------------------------ páginas 16:9 ---
PW, PH = 1920, 1080


def page(title, sub, n, dark=False):
    p = Image.new("RGBA", (PW, PH), (MAROON3 if dark else CREAM) + (255,))
    if dark:
        p = pattern(PW, PH).copy()
    d = ImageDraw.Draw(p)
    fg = CREAM if dark else MAROON
    d.text((90, 92), title, font=ff("bevan", 64), fill=fg, anchor="ls")
    d.text((92, 140), sub, font=fnt(600, 28), fill=(COBRE if dark else MARROM), anchor="ls")
    d.text((PW - 90, 92), f"{n:02d}", font=fnt(900, 40), fill=ORANGE, anchor="rs")
    d.text((PW - 90, 140), "FAZENDINHA SELF SERVICE · IDENTIDADE VISUAL", font=fnt(700, 20),
           fill=(COBRE if dark else MARROM), anchor="rs")
    d.line((90, 168, PW - 90, 168), fill=(fg + (90,)), width=2)
    return p


def p_logo():
    p = page("A Marca", "O selo original da Fazendinha, redesenhado em vetor: nítido em qualquer tamanho", 1, dark=True)
    lg = logo(760)
    put(p, lg, 560, 620, shadow=True)
    d = ImageDraw.Draw(p)
    x0 = 1060
    d.text((x0, 260), "VERSÕES", font=fnt(900, 30), fill=ORANGE)
    vers = [("Principal", lg), ("Creme", duotone(lg, MAROON3, CREAM)), ("Preto e branco", duotone(lg, (14, 10, 10), WHITE)),
            ("Carimbo / bordado", duotone(lg, (14, 10, 10), COBRE))]
    for i, (lab, im) in enumerate(vers):
        r, c = divmod(i, 2)
        cx, cy = x0 + 180 + c * 400, 470 + r * 360
        put(p, im.resize((260, 260), Image.LANCZOS), cx, cy, shadow=True)
        d.text((cx, cy + 160), lab.upper(), font=fnt(800, 22), fill=CREAM, anchor="mm")
    return p


def p_cores_tipo():
    p = page("Cores e Letras", "Vinho e cobre vêm do selo; laranja e amarelo dão o tom alegre nas redes", 2)
    d = ImageDraw.Draw(p)
    for i, (name, col, hx) in enumerate(PALETTE):
        x = 90 + i * 295
        d.rounded_rectangle((x, 220, x + 265, 520), 26, fill=col + (255,), outline=(214, 196, 170), width=2)
        light = sum(col) > 500
        tc = MAROON if light else CREAM
        d.text((x + 26, 470), name, font=fnt(900, 26), fill=tc, anchor="ls")
        d.text((x + 26, 505), hx, font=fnt(600, 22), fill=tc, anchor="ls")
    y = 610
    cols = [("TÍTULO DA MARCA", "FAZENDINHA", ff("bevan", 58), "Bevan · nome e placas"),
            ("ASSINATURA", "Self Service", ff("lobster", 100), "Lobster · toque caseiro"),
            ("COMUNICAÇÃO", "ÁGUA NA BOCA", fnt(900, 58), "Montserrat Black · posts e legendas")]
    for i, (lab, sample, f, desc) in enumerate(cols):
        x = 90 + i * 590
        d.rounded_rectangle((x, y, x + 560, y + 360), 26, fill=(255, 250, 240, 255), outline=(230, 214, 190), width=2)
        d.text((x + 34, y + 54), lab, font=fnt(800, 22), fill=ORANGE)
        d.text((x + 280, y + 190), sample, font=f, fill=MAROON, anchor="mm")
        d.text((x + 34, y + 318), desc, font=fnt(600, 22), fill=MARROM)
    return p


def tarja(text, size=70, fill=ORANGE):
    f = fnt(900, size)
    w = tw(text, f)
    img = Image.new("RGBA", (int(w + size * 1.1), int(size * 1.55)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, img.width - 1, img.height - 1), int(size * .32), fill=fill + (255,))
    d.text((img.width / 2, img.height / 2), text, font=f, fill=WHITE, anchor="mm")
    return img


def selo_redondo(text1, text2, size=360, fill=ORANGE):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    n = 24
    pts = [(size / 2 + (size / 2 if k % 2 == 0 else size * .44) * math.cos(k * math.pi / n),
            size / 2 + (size / 2 if k % 2 == 0 else size * .44) * math.sin(k * math.pi / n)) for k in range(2 * n)]
    d.polygon(pts, fill=fill + (255,))
    d.ellipse((size * .1, size * .1, size * .9, size * .9), outline=WHITE + (200,), width=4)
    d.text((size / 2, size * .42), text1, font=fnt(900, int(size * .15)), fill=WHITE, anchor="mm")
    d.text((size / 2, size * .6), text2, font=fnt(900, int(size * .11)), fill=YELLOW, anchor="mm")
    return img


def p_elementos():
    p = page("Elementos", "Peças que se repetem e fazem tudo parecer da mesma família", 3)
    d = ImageDraw.Draw(p)
    band = Image.new("RGBA", (1080, 220), (0, 0, 0, 0))
    bandeirinhas(band, 1.2)
    p.alpha_composite(band.resize((900, 183), Image.LANCZOS), (90, 190))
    d.text((90, 390), "BANDEIRINHAS · clima de fazenda e festa", font=fnt(700, 22), fill=MARROM)
    pt = pattern(420, 220)
    m = Image.new("L", pt.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, 419, 219), 24, fill=255)
    pt.putalpha(m)
    p.alpha_composite(pt, (1080, 200))
    d.text((1080, 450), "PADRÃO LOSANGO · fundo do selo", font=fnt(700, 22), fill=MARROM)
    put(p, tarja("ÁGUA NA BOCA", 60), 330, 560)
    put(p, tarja("À VONTADE", 60, MAROON), 330, 680)
    d.text((90, 760), "TARJA DE DESTAQUE · a palavra que importa", font=fnt(700, 22), fill=MARROM)
    put(p, selo_redondo("COMA À", "VONTADE", 300), 800, 640, rot=-8)
    d.text((800, 820), "SELO DE OFERTA", font=fnt(700, 22), fill=MARROM, anchor="mm")
    card = price_card("DIA DE SEMANA", 0, ORANGE).copy()
    card.alpha_composite(price_value("39,90"), (80, 150))
    put(p, card.resize((card.width * 52 // 100, card.height * 52 // 100), Image.LANCZOS), 1290, 640, rot=-2)
    d.text((1290, 820), "CARTÃO DE PREÇO", font=fnt(700, 22), fill=MARROM, anchor="mm")
    for i, e in enumerate(["😋", "🔥", "🌴", "🎶", "☀️", "🤠"]):
        put(p, emoji(e, 90), 1600 + (i % 3) * 115, 600 + (i // 3) * 120)
    d.text((1720, 820), "STICKERS", font=fnt(700, 22), fill=MARROM, anchor="mm")
    d.rounded_rectangle((90, 880, PW - 90, 1000), 24, fill=MAROON + (255,))
    d.text((PW / 2, 940), "TOM DE VOZ:  desejo, não dor  ·  leve e caseiro  ·  frases curtas  ·  sempre chamar pra vir",
           font=fnt(800, 30), fill=CREAM, anchor="mm")
    return p


# ------------------------------------------------------ peças de Instagram ---
DEST = [("CARDÁPIO", "😋"), ("PREÇOS", "💰"), ("LAZER", "🌴"), ("MÚSICA", "🎶"), ("COMO CHEGAR", "📍")]


def destaque(label, e, size=1080):
    img = pattern(size, size, cell=90).copy()
    d = ImageDraw.Draw(img)
    d.ellipse((size * .16, size * .16, size * .84, size * .84), fill=CREAM + (255,))
    d.ellipse((size * .19, size * .19, size * .81, size * .81), outline=COBRE + (255,), width=10)
    put(img, emoji(e, int(size * .36)), size / 2, size / 2)
    return img


def avatar(size=1080):
    img = pattern(size, size, cell=90).copy()
    lg = logo(int(size * .9))
    put(img, lg, size / 2, size / 2, shadow=True)
    return img


def post_quiz():
    W, H = 1080, 1350
    a = cover("picanha", .5, .5, 1.1).crop((0, 0, 1080, 675))
    b = cover("peixe", .6, .5, 1.0).crop((0, 337, 1080, 1012))
    img = Image.new("RGBA", (W, H))
    img.paste(a, (0, 0))
    img.paste(b, (0, 675))
    img.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, 70)))
    put(img, tarja("CHURRASCO", 84, ORANGE), W / 2, 420, rot=-3)
    put(img, emoji("🔥", 150), W / 2 + 330, 330)
    put(img, tarja("PEIXE ASSADO", 84, MAROON), W / 2, 1010, rot=3)
    put(img, emoji("🐟", 150), W / 2 - 360, 920)
    d = ImageDraw.Draw(img)
    d.ellipse((W / 2 - 110, 675 - 110, W / 2 + 110, 675 + 110), fill=CREAM + (255,), outline=ORANGE + (255,), width=10)
    d.text((W / 2, 675), "OU", font=fnt(900, 90), fill=MAROON, anchor="mm")
    line(img, "VOCÊ É TIME...", 190, 84)
    line(img, "RESPONDE AQUI EMBAIXO 👇".replace(" 👇", ""), 1190, 46, color=YELLOW)
    chrome(img, None)
    return img


def _hide_counter(img):
    """Posts únicos não têm o '1/5' do carrossel: cobre com o próprio fundo."""
    reg = img.crop((900, 60, 1060, 140)).filter(ImageFilter.GaussianBlur(30))
    img.paste(reg, (900, 60))


def post_domingou():
    img = cover("piscina", .5, .6, 1.0)
    img.alpha_composite(cshade())
    line(img, "SEXTOU? NADA DISSO.", 860, 66)
    line(img, "DOMINGOU!", 990, 120, box=ORANGE)
    put(img, emoji("☀️", 170), 540, 700, rot=-8)
    line(img, "Almoço à vontade, rede e piscina", 1130, 40, color=CREAM)
    chrome(img, None)
    return img


def post_cardapio():
    W, H = 1080, 1350
    img = pattern(W, H).copy()
    bandeirinhas(img, 1.0, y0=-20)
    line(img, "O QUE TEM", 250, 84)
    line(img, "NO BUFFET?", 360, 84, box=ORANGE)
    tiles = [("picanha", .5, .5, 1.2, "CHURRASCO"), ("peixe", .6, .5, 1.0, "PEIXE ASSADO"),
             ("saladas", .6, .74, 1.2, "SALADAS"), ("petiscos", .5, .74, 1.3, "PETISCOS")]
    for i, (n, cx, cy, z, lab) in enumerate(tiles):
        r, c = divmod(i, 2)
        x, y = 70 + c * 480, 470 + r * 420
        t = cover(n, cx, cy, z).resize((1080 * 45 // 100, 1350 * 45 // 100), Image.LANCZOS).crop((0, 60, 460, 460))
        m = Image.new("L", t.size, 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, 459, 399), 30, fill=255)
        t.putalpha(m)
        shadow_paste(img, t, (x, y))
        tg = tarja(lab, 30, MAROON)
        img.alpha_composite(tg, (int(x + 230 - tg.width / 2), y + 330))
    chrome(img, None)
    return img


def post_rede():
    img = cover("rede", .4, .6, 1.0)
    img.alpha_composite(cshade())
    line(img, "ALMOÇO BOM", 860, 84)
    line(img, "TERMINA NA REDE", 975, 84, box=ORANGE)
    put(img, emoji("😴", 160), 540, 700, rot=8)
    line(img, "Marca quem dorme depois do almoço", 1120, 40, color=CREAM)
    chrome(img, None)
    return img


def post_musica():
    img = cover("mural", .55, .55, 1.15)
    img.alpha_composite(cshade(.35))
    put(img, selo_redondo("AO", "VIVO", 280), 860, 330, rot=10)
    line(img, "FIM DE SEMANA", 840, 76)
    line(img, "TEM MÚSICA", 955, 100, box=ORANGE)
    put(img, emoji("🎶", 160), 200, 690, rot=-10)
    line(img, "Almoço gostoso com som ao vivo", 1100, 40, color=CREAM)
    chrome(img, None)
    return img


def post_precos():
    img = pattern(1080, 1350).copy()
    bandeirinhas(img, 2.0, y0=-20)
    line(img, "QUANTO CUSTA", 260, 84)
    line(img, "COMER À VONTADE?", 370, 84, box=ORANGE)
    for label, val, y, rot, col in (("DIA DE SEMANA", "39,90", 640, -2, ORANGE),
                                    ("FINAL DE SEMANA", "49,90", 1010, 2, (110, 30, 28))):
        card = price_card(label, 0, col).copy()
        card.alpha_composite(price_value(val), (80, 150))
        put(img, card, 540, y, rot)
    put(img, emoji("🤑", 140), 950, 1180, rot=10)
    chrome(img, None)
    return img


# ------------------------------------------------------------------ stories ---
SW, SH = 1080, 1920


def story_base(name, cx, cy, z):
    src = photo(name)
    s = max(SW / src.width, SH / src.height) * z
    w, h = SW / s, SH / s
    x0 = min(max(cx * src.width - w / 2, 0), src.width - w)
    y0 = min(max(cy * src.height - h / 2, 0), src.height - h)
    img = src.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((SW, SH), Image.LANCZOS).convert("RGBA")
    y = np.linspace(0, 1, SH)[:, None]
    a = np.clip((y - .35) / .65, 0, 1) ** 1.2 * 225 + np.clip((.15 - y) / .15, 0, 1) * 120
    sh = Image.new("RGBA", (SW, SH), (14, 6, 4, 0))
    sh.putalpha(Image.fromarray(np.repeat(np.clip(a, 0, 255), SW, 1).astype(np.uint8)))
    img.alpha_composite(sh)
    img.alpha_composite(logo(170), (60, 90))
    return img


def sline(img, text, cy, size=96, box=None, color=WHITE):
    lay = Image.new("RGBA", (1080, 1350), (0, 0, 0, 0))
    line(lay, text, 600, size, box=box, color=color)
    img.alpha_composite(lay.crop((0, 300, 1080, 900)), (0, int(cy - 300)))


def enquete(q1, q2):
    w, h = 760, 300
    img = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((20, 34, w + 20, h + 34), 36, fill=(0, 0, 0, 120))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((20, 20, w + 20, h + 20), 36, fill=(255, 255, 255, 255))
    for i, q in enumerate((q1, q2)):
        y = 60 + i * 130
        d.rounded_rectangle((60, y, w - 20, y + 100), 50, fill=(240, 236, 232, 255))
        d.text((w / 2 + 20, y + 50), q, font=fnt(800, 40), fill=MAROON, anchor="mm")
    return img


def story_enquete():
    img = story_base("picanha", .5, .5, 1.0)
    sline(img, "BORA ALMOÇAR", 900, 100)
    sline(img, "AQUI NO DOMINGO?", 1030, 100, box=ORANGE)
    put(img, enquete("SIM, COM CERTEZA 😋".replace(" 😋", ""), "CLARO, LEVO A FAMÍLIA"), 540, 1340)
    put(img, emoji("😋", 150), 900, 1200, rot=10)
    ImageDraw.Draw(img).text((540, 1800), INSTA, font=fnt(700, 34), fill=CREAM, anchor="mm")
    return img


def story_precos():
    img = story_base("saladas", .55, .62, 1.0)
    img.alpha_composite(Image.new("RGBA", (SW, SH), MAROON3 + (120,)))
    sline(img, "SELF-SERVICE", 420, 80, color=YELLOW)
    sline(img, "À VONTADE", 540, 120, box=ORANGE)
    for label, val, y, rot, col in (("DIA DE SEMANA", "39,90", 900, -2, ORANGE),
                                    ("FINAL DE SEMANA", "49,90", 1290, 2, (110, 30, 28))):
        card = price_card(label, 0, col).copy()
        card.alpha_composite(price_value(val), (80, 150))
        put(img, card, 540, y, rot)
    d = ImageDraw.Draw(img)
    put(img, emoji("📍", 70), 130, 1600)
    d.text((580, 1600), "SETOR DE MANSÕES DE TAGUATINGA", font=fnt(800, 38), fill=WHITE, anchor="mm")
    d.text((540, 1800), INSTA, font=fnt(700, 34), fill=CREAM, anchor="mm")
    return img


def story_musica():
    img = story_base("mural", .6, .55, 1.0)
    put(img, selo_redondo("AO", "VIVO", 340), 820, 520, rot=10)
    sline(img, "HOJE TEM", 1050, 100)
    sline(img, "MÚSICA AO VIVO", 1180, 100, box=ORANGE)
    put(img, emoji("🎶", 160), 220, 900, rot=-10)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((190, 1340, 890, 1450), 55, fill=(255, 255, 255, 235))
    d.text((540, 1395), "ESCREVA AQUI O HORÁRIO", font=fnt(800, 36), fill=(150, 130, 120), anchor="mm")
    d.text((540, 1800), INSTA, font=fnt(700, 34), fill=CREAM, anchor="mm")
    return img


# ---------------------------------------------------------- perfil + mockups ---
def profile_screen(grid):
    W, H = 1170, 2532
    s = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    d = ImageDraw.Draw(s)
    K = (14, 14, 14)
    d.text((90, 90), "9:41", font=fnt(700, 44), fill=K, anchor="lm")
    d.text((70, 200), "fazendinhaselfservicee", font=fnt(800, 50), fill=K, anchor="lm")
    d.text((W - 80, 200), "···", font=fnt(800, 52), fill=K, anchor="rm")
    av = avatar(250)
    m = Image.new("L", (250, 250), 0)
    ImageDraw.Draw(m).ellipse((0, 0, 249, 249), fill=255)
    av.putalpha(m)
    d.ellipse((50, 290, 330, 570), outline=ORANGE, width=8)
    s.alpha_composite(av, (65, 305))
    d.text((380, 340), "Fazendinha Self Service", font=fnt(800, 42), fill=K)
    for i, (num, lab) in enumerate([("186", "posts"), ("4.920", "seguidores"), ("312", "seguindo")]):
        x = 380 + i * 250
        d.text((x, 410), num, font=fnt(800, 46), fill=K)
        d.text((x, 475), lab, font=fnt(500, 36), fill=K)
    y = 630
    d.text((60, y), "Restaurante self-service", font=fnt(500, 38), fill=(120, 120, 120))
    bio = ["Comida caseira no fogão a lenha", "Churrasco · peixe assado · à vontade",
           "Rede, piscina e música ao vivo", "Setor de Mansões de Taguatinga - DF"]
    for i, ln in enumerate(bio):
        d.text((60, y + 56 + i * 54), ln, font=fnt(500, 38), fill=K)
    by = y + 300
    for i, (lab, col, tc) in enumerate([("Seguir", (0, 149, 246), WHITE), ("Mensagem", (239, 239, 239), K),
                                        ("Como chegar", (239, 239, 239), K)]):
        x = 60 + i * 360
        d.rounded_rectangle((x, by, x + 340, by + 96), 20, fill=col)
        d.text((x + 170, by + 48), lab, font=fnt(700, 36), fill=tc, anchor="mm")
    hy = by + 160
    for i, (lab, e) in enumerate(DEST):
        x = 60 + i * 216
        d.ellipse((x, hy, x + 170, hy + 170), outline=(210, 210, 210), width=3)
        dc = destaque(lab, e, 156)
        mm = Image.new("L", (156, 156), 0)
        ImageDraw.Draw(mm).ellipse((0, 0, 155, 155), fill=255)
        dc.putalpha(mm)
        s.alpha_composite(dc, (x + 7, hy + 7))
        d.text((x + 85, hy + 210), lab.title(), font=fnt(500, 30), fill=K, anchor="mm")
    ty = hy + 280
    d.line((0, ty + 90, W, ty + 90), fill=(220, 220, 220), width=2)
    d.line((60, ty + 90, W / 3 - 60, ty + 90), fill=K, width=4)
    for gx in range(3):
        for gy in range(3):
            d.rectangle((W / 6 - 27 + gx * 20, ty + 18 + gy * 20, W / 6 - 13 + gx * 20, ty + 32 + gy * 20), fill=K)
    gy0 = ty + 96
    tw_ = (W - 4) // 3
    th = int(tw_ * 4 / 3)
    for i, tl in enumerate(grid):
        r, c = divmod(i, 3)
        x, y = c * (tw_ + 2), gy0 + r * (th + 2)
        if y > H:
            break
        s.alpha_composite(tl.convert("RGBA").resize((tw_, th), Image.LANCZOS), (x, y))
    return s


def phone(screen, width=480):
    k = width / screen.width
    sc = screen.resize((width, int(screen.height * k)), Image.LANCZOS)
    pad = int(width * 0.035)
    body = Image.new("RGBA", (width + pad * 2, sc.height + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((0, 0, body.width - 1, body.height - 1), int(width * .14), fill=(28, 28, 30))
    m = Image.new("L", sc.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, sc.width - 1, sc.height - 1), int(width * .11), fill=255)
    sc.putalpha(m)
    body.alpha_composite(sc, (pad, pad))
    ImageDraw.Draw(body).rounded_rectangle((body.width / 2 - width * .15, pad + width * .025, body.width / 2 + width * .15,
                                            pad + width * .085), int(width * .03), fill=(0, 0, 0))
    return body


def p_perfil(grid, stories):
    p = page("Instagram", "Perfil organizado: foto, bio, destaques e feed com a mesma cara", 4, dark=True)
    ph = phone(profile_screen(grid), 400)
    sc = 860 / ph.height
    ph = ph.resize((int(ph.width * sc), 860), Image.LANCZOS)
    shadow_paste(p, ph, (110, 195))
    for i, st in enumerate(stories):
        s2 = phone(st, 300)
        sc = 760 / s2.height
        s2 = s2.resize((int(s2.width * sc), 760), Image.LANCZOS)
        shadow_paste(p, s2, (640 + i * 420, 250))
    d = ImageDraw.Draw(p)
    d.text((640, 1040), "STORIES PRONTOS: preços · enquete · música ao vivo", font=fnt(800, 26), fill=CREAM, anchor="ls")
    return p


def fabric(w, h, col, seed=1):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 6, (h, w, 1))
    base = np.array(col, np.float32)[None, None, :] + n
    return Image.fromarray(np.clip(np.concatenate([base, np.full((h, w, 1), 255)], -1), 0, 255).astype(np.uint8))


def avental():
    w, h = 520, 700
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    m = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(m)
    md.polygon([(150, 60), (370, 60), (380, 230), (500, 300), (480, 690), (40, 690), (20, 300), (140, 230)], fill=255)
    fab = fabric(w, h, MARROM)
    img.paste(fab, (0, 0), m)
    d = ImageDraw.Draw(img)
    d.line((150, 60, 120, 0), fill=(40, 12, 12), width=14)
    d.line((370, 60, 400, 0), fill=(40, 12, 12), width=14)
    d.line((20, 300, -10, 330), fill=(40, 12, 12), width=14)
    d.rounded_rectangle((90, 540, 430, 640), 10, outline=(120, 50, 40), width=3)
    lg = duotone(logo(230), MAROON3, CREAM)
    put(img, lg, w / 2, 360)
    return img


def camiseta():
    w, h = 620, 640
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).polygon([(200, 20), (250, 50), (370, 50), (420, 20), (600, 120), (540, 260), (480, 230), (480, 630),
                               (140, 630), (140, 230), (80, 260), (20, 120)], fill=255)
    img.paste(fabric(w, h, CREAM, 2), (0, 0), m)
    d = ImageDraw.Draw(img)
    d.arc((240, 0, 380, 90), 0, 180, fill=(210, 196, 172), width=10)
    put(img, logo(150), 400, 210)
    return img


def placa():
    w, h = 560, 700
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle((268, 0, 292, 700), fill=(60, 40, 30))
    d.line((180, 40, 280, 0), fill=(150, 150, 150), width=5)
    d.line((380, 40, 280, 0), fill=(150, 150, 150), width=5)
    disc = F.wood_plank(470, 470, seed=4)
    mk = Image.new("L", (470, 470), 0)
    ImageDraw.Draw(mk).ellipse((0, 0, 469, 469), fill=255)
    disc.putalpha(mk)
    put(img, disc, 280, 280, shadow=True)
    put(img, logo(400), 280, 280)
    return img


def display_mesa():
    w, h = 420, 600
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.polygon([(20, 600), (400, 600), (360, 560), (60, 560)], fill=(200, 200, 205, 200))
    d.rounded_rectangle((40, 0, 380, 570), 20, fill=MAROON + (255,))
    put(img, logo(170), 210, 110)
    d.text((210, 230), "SELF-SERVICE", font=fnt(900, 30), fill=YELLOW, anchor="mm")
    d.text((210, 268), "À VONTADE", font=fnt(900, 30), fill=WHITE, anchor="mm")
    for i, (lab, v) in enumerate((("DIA DE SEMANA", "39,90"), ("FIM DE SEMANA", "49,90"))):
        y = 330 + i * 120
        d.rounded_rectangle((70, y, 350, y + 100), 16, fill=CREAM + (255,))
        d.text((210, y + 26), lab, font=fnt(800, 20), fill=ORANGE, anchor="mm")
        d.text((210, y + 66), f"R$ {v}", font=fnt(900, 44), fill=MAROON, anchor="mm")
    return img


def p_aplicacoes():
    p = page("Aplicações", "A marca no dia a dia: equipe, fachada e mesa", 5)
    bg = cover("piscina", .5, .6, 1.2, blur=16).resize((PW - 180, 820))
    bg.alpha_composite(Image.new("RGBA", bg.size, (247, 236, 216, 110)))
    m = Image.new("L", bg.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, bg.width - 1, bg.height - 1), 30, fill=255)
    bg.putalpha(m)
    p.alpha_composite(bg, (90, 200))
    items = [(avental(), 330, "AVENTAL DA EQUIPE"), (camiseta(), 800, "CAMISETA"), (placa(), 1250, "PLACA DA ENTRADA"),
             (display_mesa(), 1650, "DISPLAY DE MESA")]
    d = ImageDraw.Draw(p)
    for im, cx, lab in items:
        sc = min(560 / im.height, 420 / im.width)
        im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
        shadow_paste(p, im, (cx - im.width / 2, 300 + (560 - im.height)))
        w = tw(lab, fnt(800, 24)) + 40
        d.rounded_rectangle((cx - w / 2, 920, cx + w / 2, 970), 25, fill=MAROON + (255,))
        d.text((cx, 945), lab, font=fnt(800, 24), fill=CREAM, anchor="mm")
    return p


def p_capa():
    p = pattern(PW, PH).copy()
    bandeirinhas(p, 1.0, y0=-10)
    put(p, logo(560), PW / 2, 470, shadow=True)
    d = ImageDraw.Draw(p)
    d.text((PW / 2, 850), "IDENTIDADE VISUAL", font=fnt(900, 64), fill=CREAM, anchor="mm")
    d.text((PW / 2, 920), "Marca · cores · letras · elementos · Instagram · aplicações", font=fnt(600, 28),
           fill=COBRE, anchor="mm")
    return p


# --------------------------------------------------------------------- main ---
def main():
    dirs = {k: OUT / k for k in ("identidade", "posts", "stories", "destaques")}
    for v in dirs.values():
        v.mkdir(parents=True, exist_ok=True)
    posts = {"1_precos": post_precos(), "2_time_churrasco_ou_peixe": post_quiz(), "3_domingou": post_domingou(),
             "4_o_que_tem_no_buffet": post_cardapio(), "5_rede": post_rede(), "6_musica_ao_vivo": post_musica()}
    for k, v in posts.items():
        v.convert("RGB").save(dirs["posts"] / f"fazendinha_post_{k}.jpg", quality=94)
    stories = {"1_precos": story_precos(), "2_enquete": story_enquete(), "3_musica_ao_vivo": story_musica()}
    for k, v in stories.items():
        v.convert("RGB").save(dirs["stories"] / f"fazendinha_story_{k}.jpg", quality=94)
    for lab, e in DEST:
        destaque(lab, e).convert("RGB").save(dirs["destaques"] / f"destaque_{lab.lower().replace(' ', '_').replace('á', 'a').replace('ú', 'u').replace('ç', 'c').replace('õ', 'o')}.jpg", quality=94)
    avatar(1080).convert("RGB").save(dirs["identidade"] / "fazendinha_foto_perfil.jpg", quality=95)
    car = OUT / "carrossel_v2"
    grid = [posts["1_precos"], Image.open(car / "c1_comida/fazendinha_c1_comida_1.jpg"), posts["2_time_churrasco_ou_peixe"],
            Image.open(car / "c2_lazer/fazendinha_c2_lazer_1.jpg"), posts["3_domingou"], posts["4_o_que_tem_no_buffet"],
            posts["6_musica_ao_vivo"], Image.open(car / "c3_preco/fazendinha_c3_preco_1.jpg"), posts["5_rede"]]
    pages = [p_capa(), p_logo(), p_cores_tipo(), p_elementos(), p_perfil(grid, list(stories.values())), p_aplicacoes()]
    rgb = [pg.convert("RGB") for pg in pages]
    for i, pg in enumerate(rgb):
        pg.save(dirs["identidade"] / f"fazendinha_identidade_{i}.png")
    rgb[0].save(dirs["identidade"] / "fazendinha_manual_identidade.pdf", save_all=True, append_images=rgb[1:],
                resolution=150)
    print("OK")


if __name__ == "__main__":
    main()
