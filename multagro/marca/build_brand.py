#!/usr/bin/env python3
"""Gera marca/brand.js com a logo MultAgro recriada em vetor (paths de marca/logo_paths.json)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
d = json.loads((ROOT / "logo_paths.json").read_text())
(r1a, r1b), (r2a, r2b) = d["aneis"]
js = f'''// MultAgro - logo recriada em vetor, fiel à original (anéis, bichos, faixa, letras e estrelas vetorizados da logo ampliada).
window.MULTAGRO = {{
  cores: {{ verde: "#2E8B3E", verde2: "#1E6F38", verdeClaro: "#72B043", laranja: "#F2A531", laranja2: "#EE9424", creme: "#F4F1E6", terra: "#5B3A1E", tinta: "#16261A" }},
  P: {json.dumps({"mult": d["mult"], "verde": d["verde"], "faixa": d["faixa"]})},
  // tema: cor (fundo claro) | badge (selo com fundo creme) | negativo (fundo escuro: verde vira creme) | branco (tudo branco)
  emblema(size = 400, tema = "cor", uid = "e" + Math.round(Math.random() * 1e9)) {{
    const c = this.cores, P = this.P;
    const vx = 70, vy = 90, vw = 1565, vh = 1215;
    const corV = tema === "branco" ? "#fff" : tema === "negativo" ? c.creme : `url(#gv${{uid}})`;
    const corL = tema === "branco" ? "#fff" : `url(#gl${{uid}})`;
    const fundo = tema === "badge" ? `<circle cx="{d["cx"]:.1f}" cy="{d["cy"]:.1f}" r="760" fill="${{c.creme}}"/>` : "";
    const arco = (r, a0, a1) => {{ const p = a => [{d["cx"]:.1f} + r * Math.cos(a * Math.PI / 180), {d["cy"]:.1f} + r * Math.sin(a * Math.PI / 180)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${{x0.toFixed(1)}} ${{y0.toFixed(1)}}A${{r}} ${{r}} 0 ${{a1 - a0 > 180 ? 1 : 0}} 1 ${{x1.toFixed(1)}} ${{y1.toFixed(1)}}`; }};
    const aneis = {json.dumps(d["aneis"])}.map(([a, b], i) => {json.dumps(d["arcos"])}[i].map(([a0, a1]) =>
      `<path d="${{arco((a + b) / 2, a0, a1)}}" fill="none" stroke="${{corL}}" stroke-width="${{b - a - 6}}"/>`).join("")).join("");
    const anel = (a, b) => `<circle cx="{d["cx"]:.1f}" cy="{d["cy"]:.1f}" r="${{(a + b) / 2}}" fill="none" stroke="${{corL}}" stroke-width="${{b - a}}"/>`;
    const vb = tema === "badge" ? `{d["cx"] - 780:.0f} {d["cy"] - 780:.0f} 1560 1560` : `${{vx}} ${{vy}} ${{vw}} ${{vh}}`;
    const hh = tema === "badge" ? size : size * vh / vw;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${{vb}}" width="${{size}}" height="${{hh}}">
      <defs>
        <linearGradient id="gv${{uid}}" gradientUnits="userSpaceOnUse" x1="150" y1="0" x2="1560" y2="0"><stop offset="0" stop-color="${{c.verde2}}"/><stop offset=".55" stop-color="#4E9C40"/><stop offset="1" stop-color="${{c.verdeClaro}}"/></linearGradient>
        <linearGradient id="gl${{uid}}" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="1290"><stop offset="0" stop-color="#F6B640"/><stop offset=".6" stop-color="${{c.laranja}}"/><stop offset="1" stop-color="${{c.laranja2}}"/></linearGradient>
      </defs>
      ${{fundo}}
      ${{aneis}}
      
      <path d="${{P.verde}}" fill="${{corV}}" fill-rule="evenodd"/>
      <path d="${{P.mult}}" fill="${{corL}}" fill-rule="evenodd"/>
    </svg>`;
  }},
}};
'''
(ROOT / "brand.js").write_text(js)
print("brand.js", len(js) // 1024, "KB")
