"""Reconstrói a logo da Araujo Security em vetor (SVG com texto convertido em curvas).

Geometria medida no material da cliente (recorte em px x 10):
- símbolo: barra inclinada com ponta e pequena aba à esquerda no topo, mais um ponto embaixo à esquerda;
- "ARAUJO": caixa alta fina, altura de versal 120, de x=840 a x=1840;
- "SECURITY": caixa alta fina, altura de versal 90, mesma largura, com espaçamento maior.
Uso: python3 -I build_logo.py <pasta_saida>
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'
font = TTFont(FONT)
gs = font.getGlyphSet()
cmap = font.getBestCmap()
cap = font['OS/2'].sCapHeight
hmtx = font['hmtx']


def word_path(word, x0, x1, baseline, cap_h):
    """Converte a palavra em curvas, distribuindo o espaçamento para ocupar de x0 a x1."""
    s = cap_h / cap
    names = [cmap[ord(c)] for c in word]
    # largura do desenho de cada letra (bounding box) para alinhar bordas reais
    from fontTools.pens.boundsPen import BoundsPen
    boxes = []
    for n in names:
        bp = BoundsPen(gs); gs[n].draw(bp); boxes.append(bp.bounds)
    widths = [(b[2] - b[0]) * s for b in boxes]
    gap = (x1 - x0 - sum(widths)) / (len(names) - 1)
    d = []
    x = x0
    for n, b, w in zip(names, boxes, widths):
        pen = SVGPathPen(gs)
        # translada para que a borda esquerda real da letra caia em x; inverte y (SVG cresce pra baixo)
        tp = TransformPen(pen, (s, 0, 0, -s, x - b[0] * s, baseline))
        gs[n].draw(tp)
        d.append(pen.getCommands())
        x += w + gap
    return ' '.join(d)


# símbolo (px do recorte x 10)
SYMBOL = 'M395 150 L665 760 L525 760 L372 318 L322 298 Z'
DOT = (190, 690, 72)

ARAUJO = word_path('ARAUJO', 840, 1840, 415, 120)
SECURITY = word_path('SECURITY', 845, 1835, 612, 90)

VIEW = (100, 110, 1800, 700)  # x, y, w, h


def svg(color):
    x, y, w, h = VIEW
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" width="{w}" height="{h}">
  <title>Araujo Security</title>
  <g fill="{color}">
    <path d="{SYMBOL}"/>
    <circle cx="{DOT[0]}" cy="{DOT[1]}" r="{DOT[2]}"/>
    <path d="{ARAUJO}"/>
    <path d="{SECURITY}"/>
  </g>
</svg>
'''


out = sys.argv[1] if len(sys.argv) > 1 else '.'
for name, color in [('marrom', '#2B201A'), ('branca', '#FFFFFF'), ('cobre', '#B8692A')]:
    with open(f'{out}/araujo-logo-{name}.svg', 'w') as f:
        f.write(svg(color))
print('ok')
