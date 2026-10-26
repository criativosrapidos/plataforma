#!/usr/bin/env python3
"""Recria a logo MultAgro em vetor, igual à original: anéis geométricos + bichos, faixa, letras e estrelas
vetorizados (potrace) a partir da logo ampliada 4x (assets/logo_x4.png). Saída: marca/logo_paths.json"""
import json
from pathlib import Path

import numpy as np
import potrace
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent
im = np.asarray(Image.open(ROOT.parent / "assets/logo_x4.png").convert("RGB")).astype(float) / 255
r, g, b = im[..., 0], im[..., 1], im[..., 2]
mx, mn = im.max(-1), im.min(-1)
s = (mx - mn) / (mx + 1e-6)
d = mx - mn + 1e-6
h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
# pertinência suave por cor (mantém os contornos finos claros dentro dos bichos)
ink = np.clip((s - 0.14) / 0.22, 0, 1)
escuro = np.clip((0.90 - im.mean(-1)) / 0.25, 0, 1)
escuro[700:] = 0                            # chifres e cauda (acinzentados) só na área dos bichos
inkv = np.maximum(np.clip((s - 0.10) / 0.20, 0, 1), escuro)
hl = ((h > 10) & (h < 60)).astype(float)
hv = ((h > 66) & (h < 178)).astype(float)
laranja = ndimage.gaussian_filter(ink * hl, 1.0) > 0.5
verde = ndimage.gaussian_filter(inkv * hv, 1.0) > 0.5
# contornos internos claros (ovelha, porco): pixels mais claros que a vizinhança dentro do verde
Lg = im[..., 1]
det = ndimage.gaussian_filter(Lg - ndimage.gaussian_filter(Lg, 5), 0.8)
linhas = (det > 0.035) & ndimage.binary_erosion(verde, iterations=3)
linhas[1300:] = False                       # só na área dos bichos (acima da faixa)
linhas[700:] = False
verde = verde & ~linhas
H, W = laranja.shape

# --- anéis: ajusta círculo nos pixels laranja fora da faixa
yy, xx = np.nonzero(laranja)
fora = (yy < 690) | (yy > 1095)
A = np.c_[2 * xx[fora], 2 * yy[fora], np.ones(fora.sum())]
cx, cy, c = np.linalg.lstsq(A, xx[fora] ** 2 + yy[fora] ** 2, rcond=None)[0]
rr = np.hypot(xx[fora] - cx, yy[fora] - cy)
hist, edges = np.histogram(rr, bins=np.arange(rr.min() - 2, rr.max() + 3, 1))
on = hist > hist.max() * 0.25
bandas, i = [], 0
while i < len(on):
    if on[i]:
        j = i
        while j < len(on) and on[j]:
            j += 1
        bandas.append((float(edges[i]), float(edges[j])))
        i = j
    else:
        i += 1
print("centro", round(cx, 1), round(cy, 1), "bandas", [(round(a), round(b)) for a, b in bandas])


def suaviza(m, it=1):
    m = ndimage.binary_closing(m, iterations=it)
    m = ndimage.binary_opening(m, iterations=it)
    return ndimage.binary_fill_holes(m) if False else m


def traca(m):
    bm = potrace.Bitmap(~m)  # potracer traça os pixels False
    plist = bm.trace(turdsize=30, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0, opticurve=True, opttolerance=0.2)
    out = []
    for curve in plist:
        sp = curve.start_point
        seg = [f"M{sp.x:.1f} {sp.y:.1f}"]
        for sgm in curve.segments:
            if sgm.is_corner:
                seg.append(f"L{sgm.c.x:.1f} {sgm.c.y:.1f}L{sgm.end_point.x:.1f} {sgm.end_point.y:.1f}")
            else:
                seg.append(f"C{sgm.c1.x:.1f} {sgm.c1.y:.1f} {sgm.c2.x:.1f} {sgm.c2.y:.1f} {sgm.end_point.x:.1f} {sgm.end_point.y:.1f}")
        out.append("".join(seg) + "Z")
    return "".join(out)


# arcos: faixa angular onde cada anel aparece (para desenhar anéis geométricos interrompidos na faixa)
yy, xx = np.nonzero(laranja)
ang = (np.degrees(np.arctan2(yy - cy, xx - cx)) + 360) % 360
rr = np.hypot(xx - cx, yy - cy)
arcos = []
for a0, a1 in bandas:
    sel = (rr > a0 + 3) & (rr < a1 - 3)
    hist = np.bincount(ang[sel].astype(int), minlength=360) > 8
    segs, k = [], 0
    while k < 360:
        if hist[k]:
            j = k
            while j < 360 and hist[j]:
                j += 1
            segs.append([k, j])
            k = j
        else:
            k += 1
    if len(segs) > 1 and segs[0][0] == 0 and segs[-1][1] == 360:
        segs[0][0] = segs.pop()[0] - 360
    arcos.append([g for g in segs if g[1] - g[0] > 50])
print("arcos", arcos)
anel = np.zeros_like(laranja)
for a0, a1 in bandas:
    anel |= (np.hypot(*np.meshgrid(np.arange(W) - cx, np.arange(H) - cy)) > a0 - 6) & (np.hypot(*np.meshgrid(np.arange(W) - cx, np.arange(H) - cy)) < a1 + 6)
anel[705:1030] = False                     # dentro da faixa fica o "Mult"
laranja = laranja & ~anel
# laranja inteiro (anéis já interrompidos na faixa, como na original + "Mult") e verde inteiro
mult = laranja
verde_s = verde
# separa: bichos (acima da faixa), faixa+Agro, estrelas
lab, n = ndimage.label(verde_s)
larg = [(sl[1].stop - sl[1].start, k + 1) for k, sl in enumerate(ndimage.find_objects(lab))]
faixa = ndimage.binary_fill_holes(lab == max(larg)[1])
faixa = ndimage.binary_dilation(faixa, iterations=6)
dados = {"faixa": "", "arcos": arcos, "w": W, "h": H, "cx": cx, "cy": cy, "aneis": bandas,
         "mult": traca(mult), "verde": traca(verde_s)}
(ROOT / "logo_paths.json").write_text(json.dumps(dados))
print("ok", len(dados["mult"]), len(dados["verde"]))
