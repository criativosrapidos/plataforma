"""Video de divulgacao Vídeos Mimo: apresenta os 3 mimos navegando pelo site, com narracao.

Uso:
  python3 promo_mimos.py --telas pasta_telas/ --demo ../exemplo/videomimo-demo.mp4 \
      --voz narracao.mp3 --musica trilha.wav --saida promo-mimos.mp4

pasta_telas/ vem de capturar_site.js (pagina.png inteira + pedido_*.png).
Os tempos abaixo seguem as pausas da narracao (ffmpeg silencedetect).
"""
import argparse
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

from promo_namorados import F_BOLD, F_MAO, F_MED, fundo, marca, texto
from video import AMEIXA, FPS, H, LEITE, MANTEIGA, ROSA, W, ease, fonte

VOZ_ATRASO = 0.3
DUR = 38.0

# posicoes (px na captura 2x, viewport 540x960)
CELULAR = (244, 1423, 592, 1303)  # tela do video no topo do site (girada 3 graus)
CARTOES = [(4575, 854), (5468, 998), (6507, 924)]

CENAS = [(0.0, 2.4, "gancho"), (2.4, 27.7, "site"), (27.7, 31.6, "pedido"), (31.6, 34.5, "resultado"), (34.5, DUR, "fim")]

MIMOS = [  # (inicio, itens com tempos, preco, tempo do preco)
    (6.3, [("até 10 fotos", 7.35), ("30 segundos", 8.4)], "R$ 39,90", 9.9),
    (11.8, [("até 20 fotos", 13.3), ("1 minuto", 14.4), ("legenda em cada foto", 15.7)], "R$ 59,90", 17.4),
    (19.5, [("até 30 fotos", 21.3), ("até 2 minutos", 22.5), ("trilha exclusiva", 23.8)], "R$ 79,90", 25.6),
]


class Leitor:
    """Le quadros de um video sob demanda, sem guardar tudo na memoria."""

    def __init__(self, path, tam, ini=0.0):
        self.tam = tam
        self.p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-ss", str(ini), "-i", path, "-vf",
                                   f"scale={tam[0]}:{tam[1]}", "-r", str(FPS), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                  stdout=subprocess.PIPE)
        self.n, self.cache = -1, {}

    def get(self, i):
        while self.n < i:
            raw = self.p.stdout.read(self.tam[0] * self.tam[1] * 3)
            if not raw or len(raw) < self.tam[0] * self.tam[1] * 3:
                break
            self.n += 1
            self.cache[self.n] = Image.frombytes("RGB", self.tam, raw)
            self.cache.pop(self.n - 4, None)
        return self.cache.get(i) or self.cache[max(self.cache)]


def topo_camera(t):
    def alvo(c):
        y, h = CARTOES[c]
        return y + h / 2 - H * 0.35
    keys = [(0, 0), (4.6, 0), (6.3, alvo(0)), (11.8, alvo(0)), (12.6, alvo(1)), (19.5, alvo(1)), (20.3, alvo(2)), (99, alvo(2))]
    for (t0, y0), (t1, y1) in zip(keys, keys[1:]):
        if t0 <= t < t1:
            return y0 + (y1 - y0) * ease((t - t0) / (t1 - t0))
    return keys[-1][1]


def pilula(img, txt, y, t, t0, cor_fundo, cor_txt, tam=64, pad=34):
    k = ease((t - t0) / 0.3)
    if k <= 0:
        return
    d = ImageDraw.Draw(img, "RGBA")
    f = fonte(F_BOLD, tam)
    larg = d.textlength(txt, font=f) + pad * 2
    alt = tam + pad
    esc = 0.85 + 0.15 * k
    w, h = larg * esc, alt * esc
    a = int(255 * k)
    d.rounded_rectangle((W / 2 - w / 2, y - h / 2, W / 2 + w / 2, y + h / 2), int(h / 2), fill=cor_fundo + (a,))
    d.text((W / 2, y), txt, font=fonte(F_BOLD, int(tam * esc)), fill=cor_txt + (a,), anchor="mm")


def degrade_baixo(img, ini=0.58):
    cam = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(cam)
    y0 = int(H * ini)
    for y in range(y0, H):
        d.line((0, y, W, y), fill=AMEIXA + (int(235 * min(1, (y - y0) / (H * 0.07))),))
    img.paste(cam, (0, 0), cam)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--telas", required=True)
    ap.add_argument("--demo", required=True)
    ap.add_argument("--voz", required=True)
    ap.add_argument("--musica", required=True)
    ap.add_argument("--saida", default="promo-mimos.mp4")
    a = ap.parse_args()

    telas = Path(a.telas)
    pagina = Image.open(telas / "pagina.png").convert("RGB")
    pedidos = [Image.open(p).convert("RGB") for p in sorted(telas.glob("pedido_*.png"))]
    cx, cy, cw, ch = CELULAR
    mascara_cel = Image.new("L", (cw - 40, ch - 30), 0)
    ImageDraw.Draw(mascara_cel).rounded_rectangle((0, 0, cw - 41, ch - 31), 60, fill=255)
    demo_cel = Leitor(a.demo, (cw - 40, ch - 30), ini=1.4)
    demo_cheio = Leitor(a.demo, (W, H))
    degr = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    degrade_baixo(degr)

    def cena(nome, t, lt):
        if nome == "gancho":
            img = fundo(True, t)
            texto(img, "Quer emocionar", 130, LEITE, H * 0.43, lt, 0.05)
            texto(img, "quem você ama?", 130, ROSA, H * 0.52, lt, 0.4)
            return img
        if nome == "site":
            top = topo_camera(t)
            z = 1 + 0.18 * (1 - ease((t - 2.4) / 2.0)) if t < 4.6 else 1.0
            w, h = W / z, H / z
            x0, y0 = (W - w) / 2, top + (H - h) / 2
            base = pagina.crop((int(x0), int(y0), int(x0 + w), int(y0 + h)))
            if y0 < cy + ch:  # cola o video tocando dentro do celular do site
                fr = demo_cel.get(int(lt * FPS)).convert("RGBA")
                fr.putalpha(mascara_cel)
                fr = fr.rotate(-3, expand=True, resample=Image.BICUBIC)
                px = int(cx + cw / 2 - fr.width / 2 - x0)
                py = int(cy + ch / 2 - fr.height / 2 - y0)
                base.paste(fr, (px, py), fr)
            img = base.resize((W, H), Image.BILINEAR) if z != 1 else base.copy()
            if 4.4 <= t < 6.3:
                img.paste(degr, (0, 0), degr)
                texto(img, "escolha o seu mimo", 96, MANTEIGA, H * 0.84, t, 4.5, F_MAO)
            for (ini, itens, preco, tp), fim in zip(MIMOS, [11.8, 19.5, 27.7]):
                if ini <= t < fim:
                    img.paste(degr, (0, 0), degr)
                    for i, (txt, ti) in enumerate(itens):
                        pilula(img, txt, H * 0.70 + i * 108, t, ti, ROSA, LEITE, 56)
                    texto(img, preco, 150, MANTEIGA, H * 0.70 + len(itens) * 108 + 70, t, tp)
            return img
        if nome == "pedido":
            k = min(len(pedidos) - 1, int(lt / 3.4 * len(pedidos)))
            img = pedidos[k].copy()
            img.paste(degr, (0, 0), degr)
            texto(img, "coloca o nome de quem você ama", 60, LEITE, H * 0.80, lt, 0.1, F_MED)
            pilula(img, "manda as fotos pelo WhatsApp", H * 0.88, lt, 1.6, ROSA, LEITE, 56)
            return img
        if nome == "resultado":
            img = demo_cheio.get(int(lt * FPS)).copy()
            pilula(img, "pronto em até 24h", H * 0.86, lt, 0.4, MANTEIGA, AMEIXA, 64)
            return img
        img = fundo(True, t)
        k = ease(lt / 0.5)
        camada = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        marca(camada, W / 2, H * 0.36, 120, LEITE)
        camada.putalpha(camada.getchannel("A").point(lambda v: int(v * k)))
        img.paste(camada, (0, 0), camada)
        texto(img, "o presente que emociona", 72, MANTEIGA, H * 0.43, lt, 0.3, F_MAO)
        pilula(img, "Peça o seu agora", H * 0.56, lt, 1.2, ROSA, LEITE, 76, 44)
        texto(img, "a partir de R$ 39,90", 66, LEITE, H * 0.64, lt, 1.6, F_MED)
        texto(img, "link na bio  ·  chama no WhatsApp", 52, LEITE, H * 0.70, lt, 2.0, F_MED)
        return img

    trilha = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
        "-i", "-", "-i", a.voz, "-i", a.musica,
        "-filter_complex",
        f"[1:a]adelay={int(VOZ_ATRASO * 1000)}|{int(VOZ_ATRASO * 1000)},volume=1.6[v];[2:a]volume=0.22[m];"
        "[v][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[a]",
        "-map", "0:v", "-map", "[a]", "-t", str(DUR),
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", a.saida,
    ], stdin=subprocess.PIPE)
    X = 0.25
    for n in range(int(DUR * FPS)):
        t = n / FPS
        i = next(k for k, (s, e, _) in enumerate(CENAS) if s <= t < e or k == len(CENAS) - 1)
        s, e, nome = CENAS[i]
        fr = cena(nome, t, t - s)
        if i + 1 < len(CENAS) and t > e - X:
            s2, _, nome2 = CENAS[i + 1]
            fr = Image.blend(fr.convert("RGB"), cena(nome2, t, 0).convert("RGB"), ease((t - (e - X)) / X))
        trilha.stdin.write(fr.convert("RGB").tobytes())
    trilha.stdin.close()
    trilha.wait()
    print("ok", a.saida)


if __name__ == "__main__":
    main()
