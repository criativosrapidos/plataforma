import math, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from glyphs import _n
def nib_pin(cx=32.0, cy=25.0, R=19.5, ty=61.0, hole=4.4, slit=2.0, s=1.0, ox=0.0, oy=0.0):
    """Pin silhouette, small breather hole, slit split through the tip (two tines)."""
    d = ty - cy; th = math.acos(R / d)
    tx1, tyy = cx + R*math.sin(th), cy + R*math.cos(th); tx2 = cx - R*math.sin(th)
    hw = slit/2
    u = (cx - hw - tx2) / (cx - tx2); yL = tyy + (ty - tyy)*u
    yj = cy + math.sqrt(hole*hole - hw*hw)
    P = lambda x, y: f"{_n(ox + x*s)} {_n(oy + y*s)}"
    return (f"M{P(cx-hw, yL)}L{P(cx-hw, yj)}A{_n(hole*s)} {_n(hole*s)} 0 1 1 {P(cx+hw, yj)}"
            f"L{P(cx+hw, yL)}L{P(tx1, tyy)}A{_n(R*s)} {_n(R*s)} 0 1 0 {P(tx2, tyy)}Z")
if __name__ == "__main__":
    out = sys.argv[1]
    variants = {"v2": dict(hole=4.4, slit=2.0), "v3": dict(hole=5.4, slit=2.4), "v4": dict(hole=3.6, slit=1.6, cy=24.0, R=19.0, ty=62.0),
                "v5": dict(hole=4.8, slit=2.2, cy=24.5, R=20.0, ty=62.5)}
    for k, kw in variants.items():
        d = nib_pin(**kw)
        open(os.path.join(out, f"pin-{k}.svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#FF6B1A" d="{d}"/></svg>')
        open(os.path.join(out, f"pin-{k}-dark.svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#121417" d="{d}"/></svg>')
