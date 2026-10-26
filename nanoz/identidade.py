#!/usr/bin/env python3
"""Nanoz Consultoria · prancha de identidade visual (proposta Criativos Rápidos) + prints da landing page. Exporta PNG/JPG em saida/."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
W, H = open(ROOT / "assets/nz_path.txt").readline().split()
D = open(ROOT / "assets/nz_path.txt").read().split("\n", 1)[1].strip()
NAVY, NAVY2, OURO, OURO2, CINZA, CLARO = "#16274D", "#0E1A36", "#BEA876", "#E3D3A6", "#8C96AD", "#F6F3EC"


def nz(w, cor=OURO):
    return f'<svg viewBox="0 0 {W} {H}" style="width:{w}px;display:block"><path d="{D}" fill="{cor}"/></svg>'


def logo(w, cor_nz=OURO, cor_nome=OURO, cor_sub="#fff"):
    return (f'<div style="display:flex;flex-direction:column;align-items:center">{nz(w, cor_nz)}'
            f'<div style="margin-top:{int(w * .15)}px;font-weight:600;letter-spacing:.42em;padding-left:.42em;font-size:{int(w * .13)}px;color:{cor_nome}">NANOZ</div>'
            f'<div style="font-weight:400;letter-spacing:.08em;font-size:{int(w * .145)}px;color:{cor_sub}">Consultoria</div></div>')


def horiz(h, cor_txt="#fff"):
    return (f'<div style="display:inline-flex;align-items:center;gap:{int(h * .35)}px">{nz(int(h * 2.25))}'
            f'<div style="border-left:2px solid {OURO};padding-left:{int(h * .35)}px"><div style="font-weight:600;letter-spacing:.38em;font-size:{int(h * .34)}px;color:{OURO}">NANOZ</div>'
            f'<div style="font-weight:400;letter-spacing:.06em;font-size:{int(h * .4)}px;color:{cor_txt}">Consultoria</div></div></div>')


ser = lambda t: f'<span style="font-family:PF;font-style:italic;font-weight:700;color:{OURO2}">{t}</span>'
cores = [(NAVY, "Azul Nanoz", "#16274D"), (NAVY2, "Azul profundo", "#0E1A36"), (OURO, "Dourado", "#BEA876"),
         (OURO2, "Dourado claro", "#E3D3A6"), (CINZA, "Cinza azulado", "#8C96AD"), (CLARO, "Marfim", "#F6F3EC")]

post = f'''<div style="width:420px;height:525px;border-radius:18px;overflow:hidden;position:relative;background:radial-gradient(ellipse 120% 80% at 50% 25%,{NAVY},{NAVY2});box-shadow:0 20px 50px rgba(0,0,0,.35)">
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(190,168,118,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(190,168,118,.06) 1px,transparent 1px);background-size:30px 30px"></div>
  <div style="position:absolute;left:30px;top:30px">{nz(60)}</div>
  <div style="position:absolute;left:30px;right:30px;top:120px;font-weight:800;font-size:44px;line-height:1.08;color:#fff">Dinheiro parado<br>não trabalha<br>{ser("por você.")}</div>
  <svg viewBox="0 0 360 140" style="position:absolute;left:30px;bottom:90px;width:360px"><g fill="rgba(190,168,118,.4)">{"".join(f'<rect x="{8 + i * 50}" y="{120 - h}" width="30" height="{h}" rx="5"/>' for i, h in enumerate((24, 36, 48, 66, 86, 104)))}</g><rect x="308" y="4" width="30" height="116" rx="5" fill="{OURO}"/></svg>
  <div style="position:absolute;left:30px;bottom:32px;font-weight:600;font-size:15px;color:{OURO2}">@nanozconsultoria</div></div>'''

story = f'''<div style="width:260px;height:525px;border-radius:18px;overflow:hidden;position:relative;background:{CLARO};box-shadow:0 20px 50px rgba(0,0,0,.35)">
  <div style="position:absolute;left:0;right:0;top:0;height:250px;background:{NAVY2}"></div>
  <div style="position:absolute;left:0;right:0;top:56px">{logo(120)}</div>
  <div style="position:absolute;left:26px;right:26px;top:290px;font-weight:800;font-size:30px;line-height:1.12;color:{NAVY2}">Imóveis que geram <span style="font-family:PF;font-style:italic;color:{OURO}">renda passiva</span></div>
  <div style="position:absolute;left:26px;right:26px;bottom:36px;background:{OURO};color:{NAVY2};font-weight:800;font-size:16px;text-align:center;border-radius:40px;padding:14px">Agende sua consultoria gratuita</div></div>'''

prancha = f'''<div id="prancha" style="width:1600px;height:2120px;position:relative;background:{CLARO};font-family:M;color:{NAVY2}">
 <div style="position:absolute;left:0;right:0;top:0;height:120px;background:#0B0F1C;display:flex;align-items:center;justify-content:space-between;padding:0 80px">
   <div style="font-weight:700;letter-spacing:.3em;font-size:20px;color:#C9CED9">NANOZ CONSULTORIA · PROPOSTA DE IDENTIDADE VISUAL</div>
   <div style="display:flex;align-items:center;gap:12px"><div style="width:44px;height:44px;background:#FFD400;border-radius:10px;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 40 40" style="width:30px"><g fill="#0B0B0B"><rect x="4" y="12" width="9" height="3.2" rx="1.6"/><rect x="2" y="18.4" width="11" height="3.2" rx="1.6"/><rect x="4" y="24.8" width="9" height="3.2" rx="1.6"/><path d="M16 9 L35 20 L16 31 Z"/></g></svg></div>
     <div style="line-height:1"><div style="font-weight:500;font-size:20px;color:#fff">criativos</div><div style="font-weight:800;font-style:italic;font-size:22px;color:#FFD400">rápidos</div></div></div></div>

 <div style="position:absolute;left:80px;right:80px;top:170px;height:600px;border-radius:34px;background:radial-gradient(ellipse 90% 90% at 50% 30%,{NAVY},{NAVY2});display:flex;align-items:center;justify-content:center;overflow:hidden">
   <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(190,168,118,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(190,168,118,.06) 1px,transparent 1px);background-size:44px 44px"></div>
   <div style="position:relative">{logo(330)}</div>
   <div style="position:absolute;left:40px;bottom:30px;font-weight:600;font-size:16px;letter-spacing:.2em;color:{CINZA}">LOGO PRINCIPAL · mantida e redesenhada em vetor</div></div>

 <div style="position:absolute;left:80px;width:700px;top:810px;height:260px;border-radius:30px;background:#fff;border:1px solid #E6E0D2;display:flex;align-items:center;justify-content:center">{horiz(90, NAVY2).replace(f"color:{OURO}\">NANOZ", f"color:{NAVY}\">NANOZ")}</div>
 <div style="position:absolute;left:820px;right:80px;top:810px;height:260px;border-radius:30px;background:{NAVY2};display:flex;align-items:center;justify-content:center">{horiz(90)}</div>

 <div style="position:absolute;left:80px;top:1120px;font-weight:700;letter-spacing:.24em;font-size:18px;color:{NAVY}">CORES</div>
 <div style="position:absolute;left:80px;right:80px;top:1160px;display:grid;grid-template-columns:repeat(6,1fr);gap:18px">
   {"".join(f'<div><div style="height:140px;border-radius:22px;background:{c};border:1px solid #E1DBCD"></div><div style="font-weight:700;font-size:20px;margin-top:12px">{n}</div><div style="font-size:17px;color:#4B5670">{h}</div></div>' for c, n, h in cores)}</div>

 <div style="position:absolute;left:80px;top:1440px;font-weight:700;letter-spacing:.24em;font-size:18px;color:{NAVY}">TIPOGRAFIA</div>
 <div style="position:absolute;left:80px;width:700px;top:1480px;height:250px;border-radius:30px;background:#fff;border:1px solid #E6E0D2;padding:34px">
   <div style="font-weight:800;font-size:58px;line-height:1">Montserrat</div>
   <div style="font-size:20px;color:#4B5670;margin-top:10px">Títulos (ExtraBold) e textos (Regular / Medium)</div>
   <div style="font-family:PF;font-style:italic;font-weight:700;font-size:52px;color:{OURO};margin-top:22px;line-height:1">Playfair Display <span style="font-family:M;font-style:normal;font-weight:400;font-size:20px;color:#4B5670">· destaque</span></div></div>
 <div style="position:absolute;left:80px;width:700px;top:1760px;height:280px;border-radius:30px;background:{NAVY2};color:#fff;padding:34px">
   <div style="font-weight:700;letter-spacing:.24em;font-size:16px;color:{OURO}">TOM DE VOZ</div>
   <div style="font-weight:800;font-size:34px;line-height:1.2;margin-top:14px">Seguro, próximo e direto.<br>{ser("Estratégia")} no lugar de promessa.</div>
   <div style="font-size:19px;color:#C9CED9;margin-top:16px;line-height:1.45">“Multiplique seu patrimônio com estratégia” · “Imóveis que geram renda passiva” · “Agende sua consultoria gratuita”</div></div>

 <div style="position:absolute;left:820px;top:1440px;font-weight:700;letter-spacing:.24em;font-size:18px;color:{NAVY}">APLICAÇÕES</div>
 <div style="position:absolute;left:820px;top:1480px">{post}</div>
 <div style="position:absolute;left:1260px;top:1480px">{story}</div>
</div>'''

CSS = f'''@font-face {{ font-family: M; font-weight: 400; src: url(fonts/montserrat-latin-400-normal.woff); }}
@font-face {{ font-family: M; font-weight: 500; src: url(fonts/montserrat-latin-500-normal.woff); }}
@font-face {{ font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }}
@font-face {{ font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }}
@font-face {{ font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }}
@font-face {{ font-family: PF; font-weight: 700; font-style: italic; src: url(fonts/playfair-display-latin-700-italic.woff); }}
* {{ margin:0; padding:0; box-sizing:border-box; }} body {{ background:#888; }}'''

pecas = {
    "logo_principal": f'<div id="logo_principal" style="width:1200px;height:1200px;background:{NAVY};display:flex;align-items:center;justify-content:center;font-family:M">{logo(620)}</div>',
    "perfil_instagram": f'<div id="perfil_instagram" style="width:1080px;height:1080px;border-radius:50%;background:{NAVY};display:flex;align-items:center;justify-content:center;font-family:M">{logo(520)}</div>',
    "simbolo_nz": f'<div id="simbolo_nz" style="display:inline-block;padding:40px">{nz(1200)}</div>',
}
(ROOT / "identidade.html").write_text(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{prancha}{"".join(pecas.values())}</body></html>')
js = '''const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1700, height: 2200 }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.resolve(__dirname, "identidade.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await (await p.$("#prancha")).screenshot({ path: "saida/nanoz_identidade_visual.png" });
  for (const id of ["logo_principal", "perfil_instagram", "simbolo_nz"])
    await (await p.$("#" + id)).screenshot({ path: "saida/identidade/" + id + ".png", omitBackground: true });
  const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await d.goto("file://" + path.resolve(__dirname, "landing/index.html")); await d.evaluate(() => document.fonts.ready); await d.waitForTimeout(500);
  await d.screenshot({ path: "saida/landing_computador.jpg", fullPage: true, type: "jpeg", quality: 88 });
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await m.goto("file://" + path.resolve(__dirname, "landing/index.html")); await m.evaluate(() => document.fonts.ready); await m.waitForTimeout(500);
  await m.screenshot({ path: "saida/landing_celular.jpg", fullPage: true, type: "jpeg", quality: 85 });
  await b.close();
})();
'''
(ROOT / "shot.js").write_text(js)
(ROOT / "saida/identidade").mkdir(parents=True, exist_ok=True)
subprocess.run(f"cd {ROOT} && NODE_PATH=$(npm root -g) node shot.js", shell=True, check=True)
print("ok")
