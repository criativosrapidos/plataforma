"""Monta o video Vídeos Mimo: abertura + fotos com movimento + mensagem final + musica.

Uso:
  python3 video.py --fotos pasta/ --para "Ana" --de "Joao" --ocasiao aniversario \
      --mensagem "Obrigado por cada dia ao seu lado." --musica trilha.wav --saida mimo.mp4

Legendas por foto (opcional): arquivo legendas.txt na pasta das fotos, uma linha por foto
na mesma ordem alfabetica dos arquivos.
"""
import argparse
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

AQUI = Path(__file__).parent
FONTES = AQUI / "fontes"
W, H, FPS = 1080, 1920, 30

# Paleta Vídeos Mimo
AMEIXA = (58, 13, 46)
ROSA = (255, 79, 121)
MANTEIGA = (255, 200, 87)
BLUSH = (255, 233, 238)
LEITE = (255, 248, 245)

OCASIOES = {
    "aniversario": "Feliz aniversário,",
    "namorados": "Pra você, meu amor,",
    "maes": "Feliz Dia das Mães,",
    "pais": "Feliz Dia dos Pais,",
    "casamento": "Nossa história,",
    "presente": "Um mimo pra você,",
    "natal": "Feliz Natal,",
}


def fonte(nome, tam):
    return ImageFont.truetype(str(FONTES / nome), tam)


def ease(x):
    x = min(1, max(0, x))
    return x * x * (3 - 2 * x)


def texto_centro(draw, y, txt, f, cor, largura=W - 160):
    # quebra de linha simples
    palavras, linhas, atual = txt.split(), [], ""
    for p in palavras:
        teste = (atual + " " + p).strip()
        if draw.textlength(teste, font=f) > largura and atual:
            linhas.append(atual)
            atual = p
        else:
            atual = teste
    linhas.append(atual)
    alt = f.size * 1.15
    for i, l in enumerate(linhas):
        draw.text((W / 2, y + i * alt), l, font=f, fill=cor, anchor="mm")
    return y + len(linhas) * alt


def coracao(draw, cx, cy, r, cor):
    pts = []
    for k in range(80):
        t = 2 * math.pi * k / 80
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * r / 16, cy - y * r / 16))
    draw.polygon(pts, fill=cor)


def preparar_foto(path):
    """Foto em qualquer proporcao -> quadro 9:16 com fundo desfocado e margem para movimento."""
    img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    bw, bh = int(W * 1.15), int(H * 1.15)
    fundo = ImageOps.fit(img, (bw, bh)).filter(ImageFilter.GaussianBlur(40))
    fundo = Image.blend(fundo, Image.new("RGB", fundo.size, AMEIXA), 0.35)
    frente = img.copy()
    frente.thumbnail((bw, bh), Image.LANCZOS)
    if frente.width >= bw * 0.95 and frente.height >= bh * 0.95:
        return ImageOps.fit(img, (bw, bh))
    fundo.paste(frente, ((bw - frente.width) // 2, (bh - frente.height) // 2))
    return fundo


def ken_burns(base, p, idx):
    bw, bh = base.size
    z = 1 + 0.12 * (p if idx % 2 == 0 else 1 - p)
    cw, ch = bw / z, bh / z
    dx = (bw - cw) * (0.5 + 0.35 * math.sin(idx * 1.7) * (p - 0.5))
    dy = (bh - ch) * (0.5 + 0.35 * math.cos(idx * 1.3) * (p - 0.5))
    return base.resize((W, H), Image.BILINEAR, box=(dx, dy, dx + cw, dy + ch))


def camada_legenda(txt):
    cam = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    grad = np.zeros((H, W, 4), np.uint8)
    a = np.clip((np.arange(H) - H * 0.62) / (H * 0.38), 0, 1) ** 1.4 * 200
    grad[..., :3] = AMEIXA
    grad[..., 3] = a[:, None].astype(np.uint8)
    cam = Image.fromarray(grad, "RGBA")
    d = ImageDraw.Draw(cam)
    texto_centro(d, H - 300, txt, fonte("Caveat-Bold.ttf", 92), LEITE)
    return cam


def marca(img, y, tam=34):
    logo = Image.open(AQUI.parent / "marca" / "logo-horizontal.png").convert("RGBA")
    esc = tam / 165
    lg = logo.resize((int(logo.width * esc), int(logo.height * esc)), Image.LANCZOS)
    img.paste(lg, (int(W / 2 - lg.width / 2), int(y - lg.height / 2)), lg)


def quadro_abertura(p, ocasiao, para):
    img = Image.new("RGB", (W, H), AMEIXA)
    d = ImageDraw.Draw(img)
    # bolhas de luz
    rng = np.random.default_rng(3)
    luz = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dl = ImageDraw.Draw(luz)
    for _ in range(28):
        x, y, r = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(20, 90)
        y -= p * 160 * (r / 90)
        cor = ROSA if rng.random() < 0.6 else MANTEIGA
        dl.ellipse((x - r, y - r, x + r, y + r), fill=cor + (int(60 * ease(p * 3)),))
    img.paste(luz.filter(ImageFilter.GaussianBlur(18)), (0, 0), luz.filter(ImageFilter.GaussianBlur(18)))
    d = ImageDraw.Draw(img, "RGBA")
    a1, a2 = ease((p - 0.08) / 0.25), ease((p - 0.3) / 0.25)
    d.text((W / 2, H * 0.42 - 30 * (1 - a1)), OCASIOES.get(ocasiao, ocasiao), font=fonte("Caveat-Bold.ttf", 110),
           fill=MANTEIGA + (int(255 * a1),), anchor="mm")
    f = fonte("Bricolage-ExtraBold.ttf", 210 if len(para) <= 8 else 150)
    d.text((W / 2, H * 0.53 + 40 * (1 - a2)), para, font=f, fill=LEITE + (int(255 * a2),), anchor="mm")
    s = ease((p - 0.5) / 0.2)
    if s > 0:
        coracao(d, W / 2, H * 0.65, 46 * s, ROSA + (255,))
    return img


def quadro_final(p, mensagem, de):
    img = Image.new("RGB", (W, H), BLUSH)
    d = ImageDraw.Draw(img, "RGBA")
    a = ease(p / 0.25)
    coracao(d, W / 2, H * 0.27, 70 * a, ROSA + (255,))
    camada = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dc = ImageDraw.Draw(camada)
    fim = texto_centro(dc, H * 0.40, mensagem, fonte("Bricolage-Medium.ttf", 68), AMEIXA, W - 200)
    dc.text((W / 2, fim + 90), f"Com amor, {de}", font=fonte("Caveat-Bold.ttf", 100), fill=ROSA, anchor="mm")
    alfa = camada.getchannel("A").point(lambda v: int(v * ease((p - 0.15) / 0.3)))
    camada.putalpha(alfa)
    img.paste(camada, (0, 0), camada)
    if p > 0.55:
        marca(img, H - 140)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fotos", required=True)
    ap.add_argument("--para", required=True)
    ap.add_argument("--de", required=True)
    ap.add_argument("--ocasiao", default="aniversario")
    ap.add_argument("--mensagem", required=True)
    ap.add_argument("--musica", required=True)
    ap.add_argument("--duracao", type=float, default=60)
    ap.add_argument("--saida", default="mimo.mp4")
    a = ap.parse_args()

    pasta = Path(a.fotos)
    fotos = sorted(p for p in pasta.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".heic"})
    leg_arq = pasta / "legendas.txt"
    legendas = leg_arq.read_text(encoding="utf-8").splitlines() if leg_arq.exists() else []
    T_AB, T_FIM, T_X = 4.0, 7.0, 0.7
    slot = (a.duracao - T_AB - T_FIM) / len(fotos)
    bases = [preparar_foto(f) for f in fotos]
    camadas = [camada_legenda(legendas[i]) if i < len(legendas) and legendas[i].strip() else None for i in range(len(fotos))]

    def quadro_foto(i, t_local):
        q = ken_burns(bases[i], t_local / (slot + T_X), i)
        if camadas[i] is not None:
            al = ease((t_local - T_X - 0.15) / 0.5) * (1 - ease((t_local - slot + 0.35) / 0.35))
            c = camadas[i].copy()
            c.putalpha(c.getchannel("A").point(lambda v: int(v * al)))
            q.paste(c, (0, 0), c)
        return q

    ff = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
        "-i", "-", "-i", a.musica, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", a.saida,
    ], stdin=subprocess.PIPE)

    total = int(a.duracao * FPS)
    for n in range(total):
        t = n / FPS
        if t < T_AB:
            fr = quadro_abertura(t / T_AB, a.ocasiao, a.para)
            if t > T_AB - T_X:
                fr = Image.blend(fr, quadro_foto(0, 0), ease((t - (T_AB - T_X)) / T_X))
        elif t < a.duracao - T_FIM:
            tl = t - T_AB
            i = min(int(tl // slot), len(fotos) - 1)
            fr = quadro_foto(i, tl - i * slot + T_X)
            fim_slot = (i + 1) * slot
            if tl > fim_slot - T_X:
                k = ease((tl - (fim_slot - T_X)) / T_X)
                prox = quadro_foto(i + 1, tl - fim_slot + T_X) if i + 1 < len(fotos) else quadro_final(0, a.mensagem, a.de)
                fr = Image.blend(fr, prox, k)
        else:
            fr = quadro_final((t - (a.duracao - T_FIM)) / T_FIM, a.mensagem, a.de)
        ff.stdin.write(fr.tobytes())
        if n % 300 == 0:
            print(f"{n}/{total}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("ok", a.saida)


if __name__ == "__main__":
    main()
