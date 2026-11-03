"""Outline text into SVG path data using HarfBuzz shaping + fontTools."""
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

def _n(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s

_cache = {}
def _load(path):
    if path not in _cache:
        blob = hb.Blob.from_file_path(path)
        face = hb.Face(blob)
        tt = TTFont(path)
        _cache[path] = (hb.Font(face), tt, tt.getGlyphSet(), tt.getGlyphOrder(), tt["head"].unitsPerEm)
    return _cache[path]

def shape(path, text, size, tracking=0.0, space=None):
    """Return list of (glyphname, x, y) in px for baseline at 0, plus advance width."""
    font, tt, gs, order, upm = _load(path)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    sc = size / upm
    x = 0.0; out = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        g = order[info.codepoint]
        out.append((g, x + pos.x_offset * sc, -pos.y_offset * sc))
        adv = pos.x_advance * sc
        if g == "space" and space is not None:
            adv = space * size
        x += adv + tracking * size
    return out, x - tracking * size

def text_path(path, text, size, x0=0.0, y0=0.0, tracking=0.0, space=None):
    font, tt, gs, order, upm = _load(path)
    sc = size / upm
    placed, width = shape(path, text, size, tracking, space)
    parts = []
    bp = BoundsPen(gs)
    for g, gx, gy in placed:
        pen = SVGPathPen(gs, ntos=_n)
        t = (sc, 0, 0, -sc, x0 + gx, y0 + gy)
        gs[g].draw(TransformPen(pen, t))
        parts.append(pen.getCommands())
        gs[g].draw(TransformPen(bp, t))
    return "".join(parts), width, bp.bounds  # bounds: (xmin, ymin, xmax, ymax) in SVG coords
