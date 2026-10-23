#!/usr/bin/env python3
"""Logo remodelada da JL Fitness: silhueta simétrica centralizada no ícone, variações e prancha. Exporta PNGs (2x)."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
vw, vh = open(ROOT.parent / "assets/silhueta_path.txt").readline().split()
D = open(ROOT.parent / "assets/silhueta_path.txt").read().split("\n", 1)[1]
AR = float(vh) / float(vw)
AM, PR = "#FFE100", "#0B0B0B"


def sil(w, cor=PR):
    return f'<svg viewBox="0 0 {vw} {vh}" style="width:{w}px;display:block"><path d="{D}" fill="{cor}"/></svg>'


def simbolo(s, fundo=AM, cor=PR, raio=.24):
    """Quadrado arredondado com a silhueta inteira, centralizada (sem corte)."""
    w = int(s * .76)
    return (f'<div style="width:{s}px;height:{s}px;border-radius:{int(s * raio)}px;background:{fundo};flex:none;'
            f'display:flex;align-items:center;justify-content:center">{sil(w, cor)}</div>')


def selo(s, faixa=True):
    """Selo redondo (perfil do Instagram): silhueta apoiada na faixa preta com o nome."""
    w = int(s * .6)
    h = w * AR
    banda = int(s * .33)
    top = s - banda - h + 4                       # encosta (e sobrepõe) na faixa preta
    nome = (f'<div style="position:absolute;left:0;right:0;bottom:0;height:{banda}px;background:{PR};display:flex;align-items:center;justify-content:center">'
            f'<div class="A" style="font-size:{int(s * .125)}px;color:#fff;transform:skewX(-7deg);white-space:nowrap;margin-top:-{int(s * .04)}px">'
            f'<span style="color:{AM}">JL</span> FITNESS</div></div>') if faixa else ""
    return (f'<div style="width:{s}px;height:{s}px;border-radius:50%;background:{AM};overflow:hidden;position:relative;flex:none">'
            f'<div style="position:absolute;left:50%;top:{top:.1f}px;transform:translateX(-50%)">{sil(w)}</div>{nome}</div>')


def palavra(fs, cor=PR, jl=PR, sub=PR):
    return (f'<div style="display:flex;flex-direction:column;justify-content:center">'
            f'<div class="A" style="font-size:{fs}px;color:{cor};transform:skewX(-7deg);line-height:.9;white-space:nowrap"><span style="color:{jl}">JL</span> FITNESS</div>'
            f'<div style="height:{int(fs * .07)}px;width:{int(fs * 1.2)}px;background:{AM};margin:{int(fs * .1)}px 0 {int(fs * .1)}px {int(fs * .04)}px;transform:skewX(-30deg)"></div>'
            f'<div style="font-weight:700;font-size:{int(fs * .205)}px;letter-spacing:.42em;color:{sub};white-space:nowrap;padding-left:{int(fs * .03)}px">ASSESSORIA ESPORTIVA</div></div>')


def horiz(fs, cor, jl, sub):
    return f'<div style="display:inline-flex;align-items:center;gap:{int(fs * .32)}px">{simbolo(int(fs * 1.5))}{palavra(fs, cor, jl, sub)}</div>'


CSS = '''@font-face { font-family: Anton; src: url(../fonts/anton-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(../fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 700; src: url(../fonts/montserrat-latin-700-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(../fonts/montserrat-latin-800-normal.woff); }
*{margin:0;padding:0;box-sizing:border-box} body{background:#777;font-family:M}
.A{font-family:Anton;text-transform:uppercase}
.x{display:inline-block;margin:20px;position:relative}'''

pecas = {
    "logo_horizontal_clara": f'<div class="x" id="logo_horizontal_clara" style="padding:30px">{horiz(150, PR, PR, PR)}</div>',
    "logo_horizontal_escura": f'<div class="x" id="logo_horizontal_escura" style="padding:30px">{horiz(150, "#fff", AM, "#fff")}</div>',
    "logo_vertical": (f'<div class="x" id="logo_vertical" style="padding:30px"><div style="display:flex;flex-direction:column;align-items:center;gap:34px">{simbolo(300)}'
                      f'<div style="display:flex;flex-direction:column;align-items:center"><div class="A" style="font-size:160px;color:{PR};transform:skewX(-7deg);line-height:.9;white-space:nowrap">JL FITNESS</div>'
                      f'<div style="height:11px;width:220px;background:{AM};margin:16px 0;transform:skewX(-30deg)"></div>'
                      f'<div style="font-weight:700;font-size:33px;letter-spacing:.42em;color:{PR};white-space:nowrap">ASSESSORIA ESPORTIVA</div></div></div></div>'),
    "simbolo": f'<div class="x" id="simbolo">{simbolo(1000)}</div>',
    "selo_perfil": f'<div class="x" id="selo_perfil">{selo(1000)}</div>',
}

prancha = f'''<div class="x" id="prancha" style="width:1600px;height:2000px;background:#fff;margin:0">
 <div style="position:absolute;left:80px;top:70px;font-weight:800;letter-spacing:.32em;font-size:24px;color:{PR}">JL FITNESS · LOGO REMODELADA</div>
 <div style="position:absolute;left:80px;right:80px;top:150px;height:520px;background:#F4F4F4;border-radius:34px;display:flex;align-items:center;justify-content:center">{horiz(150, PR, PR, PR)}</div>
 <div style="position:absolute;left:80px;width:700px;top:710px;height:520px;background:{PR};border-radius:34px;display:flex;align-items:center;justify-content:center"><div style="transform:scale(.62)">{horiz(150, "#fff", AM, "#fff")}</div></div>
 <div style="position:absolute;left:820px;right:80px;top:710px;height:520px;background:{AM};border-radius:34px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:22px">{simbolo(230, PR, AM)}<div class="A" style="font-size:96px;color:{PR};transform:skewX(-7deg)">JL FITNESS</div></div>
 <div style="position:absolute;left:80px;width:440px;top:1270px;height:440px;background:#F4F4F4;border-radius:34px;display:flex;align-items:center;justify-content:center">{simbolo(300)}</div>
 <div style="position:absolute;left:580px;width:440px;top:1270px;height:440px;background:#F4F4F4;border-radius:34px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px">{selo(330)}<div style="font-weight:700;font-size:20px;color:#777">perfil do Instagram</div></div>
 <div style="position:absolute;left:1080px;right:80px;top:1270px;height:440px;background:{PR};border-radius:34px;display:flex;align-items:center;justify-content:center">{simbolo(300, AM, PR)}</div>
 <div style="position:absolute;left:80px;right:80px;top:1760px;display:flex;gap:24px;align-items:center">
   <div style="width:90px;height:90px;border-radius:20px;background:{AM}"></div><div style="font-weight:800;font-size:26px;color:{PR}">Amarelo JL<br><span style="font-weight:600">#FFE100</span></div>
   <div style="width:90px;height:90px;border-radius:20px;background:{PR};margin-left:30px"></div><div style="font-weight:800;font-size:26px;color:{PR}">Preto<br><span style="font-weight:600">#0B0B0B</span></div>
   <div style="margin-left:auto;text-align:right;font-weight:600;font-size:24px;color:#555">Títulos: <b>Anton</b> (inclinada) · Textos: <b>Montserrat</b></div></div>
</div>'''

(ROOT / "logo.html").write_text(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{prancha}{"".join(pecas.values())}</body></html>')
transp = set(pecas)
js = ("const { chromium } = require('playwright'); const path = require('path');\n(async () => {\n"
      " const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });\n"
      " const p = await b.newPage({ viewport: { width: 1700, height: 2100 }, deviceScaleFactor: 2 });\n"
      " await p.goto('file://' + path.resolve('logo.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);\n")
for i in ["prancha", *pecas]:
    js += f" await (await p.$('#{i}')).screenshot({{ path: '{i}.png', omitBackground: {'true' if i in transp else 'false'} }});\n"
js += " await b.close();\n})();\n"
(ROOT / "shot.js").write_text(js)
subprocess.run(f"cd {ROOT} && NODE_PATH=$(npm root -g) node shot.js", shell=True, check=True)
print("ok")
