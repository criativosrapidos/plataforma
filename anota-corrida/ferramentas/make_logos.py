import json, math, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from glyphs import text_path, _n

FONTS = sys.argv[1]; OUT = sys.argv[2]
WM = os.path.join(FONTS, "archivo-125-800.ttf")
VERDE, SINAL, ASFALTO, PAPEL = "#007A4D", "#43D98C", "#121417", "#F4F4EE"

from pin_variants import nib_pin
PIN = dict(cx=32.0, cy=24.5, R=20.0, ty=62.5, hole=4.8, slit=2.2)
def pin_paths(s=1.0, ox=0.0, oy=0.0, **over):
    kw = dict(PIN); kw.update(over)
    return nib_pin(s=s, ox=ox, oy=oy, **kw), (kw["cy"] - kw["R"], kw["ty"])

def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {_n(w)} {_n(h)}" width="{_n(w)}" height="{_n(h)}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')

files = {}
# --- symbol only (64 box)
sym, (ptop, ptip) = pin_paths()
for name, col in [("simbolo-verde", VERDE), ("simbolo-sinal", SINAL), ("simbolo-asfalto", ASFALTO), ("simbolo-papel", PAPEL)]:
    files[name + ".svg"] = svg(64, 64, f'<path fill="{col}" d="{sym}"/>', "Anota Corrida")

# --- wordmark geometry
SIZE = 100.0
TRACK = -0.012
SPACE = 0.24
wd, ww, wb = text_path(WM, "anota corrida", SIZE, 0, 0, TRACK, SPACE)
asc_top = wb[1]          # top of 'd' / 't' (negative y)
print("wordmark width", ww, "bounds", wb)

# --- horizontal lockup: pin top aligned with ascender top, tip slightly below baseline
def horizontal(word_col, pin_col):
    pin_h = (-asc_top) * 1.20         # pin a bit taller than the ascender
    s = pin_h / (ptip - ptop)
    pin_w = 2 * PIN['R'] * s
    top = asc_top - (pin_h - (-asc_top)) * 0.45   # overshoot split: more above, less below
    oy = top - ptop * s
    pad = 6
    ox = pad - (32 - PIN['R']) * s
    gap = 0.20 * SIZE
    tx = pad + pin_w + gap
    d_pin, _ = pin_paths(s=s, ox=ox, oy=oy)
    d_word, w2, b2 = text_path(WM, "anota corrida", SIZE, tx, 0, TRACK, SPACE)
    y_min = min(top, b2[1]) - pad
    y_max = max(oy + ptip * s, b2[3]) + pad
    W = tx + w2 + pad; H = y_max - y_min
    body = (f'<g transform="translate(0 {_n(-y_min)})">'
            f'<path fill="{pin_col}" d="{d_pin}"/>'
            f'<path fill="{word_col}" d="{d_word}"/></g>')
    return W, H, body

for name, wc, pc in [("logo-horizontal", ASFALTO, VERDE), ("logo-horizontal-negativo", PAPEL, SINAL), ("logo-horizontal-mono", ASFALTO, ASFALTO), ("logo-horizontal-mono-claro", PAPEL, PAPEL)]:
    W, H, body = horizontal(wc, pc)
    files[name + ".svg"] = svg(W, H, body, "Anota Corrida")

# --- stacked lockup: pin spans both lines
def stacked(word_col, pin_col):
    lead = 0.94 * SIZE
    d1, w1, b1 = text_path(WM, "anota", SIZE, 0, 0, TRACK)
    d2, w2, b2 = text_path(WM, "corrida", SIZE, 0, lead, TRACK)
    top_txt = b1[1]; bot_txt = b2[3]
    pin_h = (bot_txt - top_txt) * 1.02
    s = pin_h / (ptip - ptop)
    pin_w = 2 * PIN['R'] * s
    pad = 6
    top = top_txt - (pin_h - (bot_txt - top_txt)) * 0.5
    oy = top - ptop * s
    ox = pad - (32 - PIN['R']) * s
    gap = 0.16 * SIZE
    tx = pad + pin_w + gap
    d1, w1, b1 = text_path(WM, "anota", SIZE, tx, 0, TRACK)
    d2, w2, b2 = text_path(WM, "corrida", SIZE, tx, lead, TRACK)
    d_pin, _ = pin_paths(s=s, ox=ox, oy=oy)
    y_min = min(top, b1[1]) - pad; y_max = max(oy + ptip * s, b2[3]) + pad
    W = tx + max(w1, w2) + pad; H = y_max - y_min
    body = (f'<g transform="translate(0 {_n(-y_min)})">'
            f'<path fill="{pin_col}" d="{d_pin}"/>'
            f'<path fill="{word_col}" d="{d1}{d2}"/></g>')
    return W, H, body

for name, wc, pc in [("logo-empilhado", ASFALTO, VERDE), ("logo-empilhado-negativo", PAPEL, SINAL), ("logo-empilhado-mono", ASFALTO, ASFALTO), ("logo-empilhado-mono-claro", PAPEL, PAPEL)]:
    W, H, body = stacked(wc, pc)
    files[name + ".svg"] = svg(W, H, body, "Anota Corrida")

# --- app icons (1024 box, iOS-ish squircle approximated by rx)
def icon(bg, fg, name):
    s = 10.6   # pin 58 units tall -> ~615px of 1024
    top, tip = PIN["cy"] - PIN["R"], PIN["ty"]
    oy = 512 - (top + tip) / 2 * s - 6
    d_pin, _ = pin_paths(s=s, ox=512 - 32 * s, oy=oy)
    body = f'<rect width="1024" height="1024" rx="230" fill="{bg}"/><path fill="{fg}" d="{d_pin}"/>'
    files[name] = svg(1024, 1024, body, "Anota Corrida")
icon(VERDE, PAPEL, "app-icone.svg")
icon(ASFALTO, SINAL, "app-icone-noite.svg")

# --- favicon: chunkier hole + slit so it survives 16px
fav, _ = pin_paths(s=0.86, ox=32 - 32 * 0.86, oy=1.4, hole=6.2, slit=3.6)
files["favicon.svg"] = svg(64, 64, f'<rect width="64" height="64" rx="14" fill="{VERDE}"/><path fill="{PAPEL}" d="{fav}"/>', "Anota Corrida")

for k, v in files.items():
    open(os.path.join(OUT, k), "w").write(v)
    print(f"{len(v):>7} {k}")

# export raw path data for inline use in artboards
d_word_raw, w_raw, b_raw = text_path(WM, "anota corrida", SIZE, 0, 0, TRACK, SPACE)
json.dump({"pin64": sym, "pin_bounds": [ptop, ptip], "wordmark100": d_word_raw, "wordmark_w": w_raw, "wordmark_bounds": b_raw},
          open(os.path.join(OUT, "paths.json"), "w"))
