#!/usr/bin/env python3
"""Nanoz Consultoria · identidade visual v2 (tom de banco privado): logo mantida, nova tipografia (EB Garamond + Inter),
paleta refinada e aplicações. Exporta a prancha, as logos e os prints da landing em saida/."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
W, H = open(ROOT / "nz_path.txt").readline().split()
D = open(ROOT / "nz_path.txt").read().split("\n", 1)[1].strip()
INK, NAVY, NOITE, OURO, CHAMP, MARFIM, TXT = "#070B14", "#13254A", "#0A1730", "#B89B5E", "#E4D6B3", "#F7F4EE", "#4A5468"


def nz(w, cor=OURO):
    return f'<svg viewBox="0 0 {W} {H}" style="width:{w}px;display:block"><path d="{D}" fill="{cor}"/></svg>'


def logo(w, cor_sub="#fff"):
    return (f'<div style="display:flex;flex-direction:column;align-items:center">{nz(w)}'
            f'<div style="margin-top:{int(w * .15)}px;font-family:IN;font-weight:500;letter-spacing:.5em;padding-left:.5em;font-size:{int(w * .11)}px;color:{OURO}">NANOZ</div>'
            f'<div style="font-family:EB;font-weight:500;font-size:{int(w * .17)}px;color:{cor_sub};line-height:1.1">Consultoria</div></div>')


def horiz(h, cor_txt="#fff"):
    return (f'<div style="display:inline-flex;align-items:center;gap:{int(h * .38)}px">{nz(int(h * 2.25))}'
            f'<div style="border-left:1px solid {OURO};padding-left:{int(h * .38)}px;line-height:1.1"><div style="font-family:IN;font-weight:500;letter-spacing:.42em;font-size:{int(h * .3)}px;color:{OURO}">NANOZ</div>'
            f'<div style="font-family:EB;font-weight:500;font-size:{int(h * .5)}px;color:{cor_txt}">Consultoria</div></div></div>')


it = lambda t, cor=CHAMP: f'<span style="font-style:italic;color:{cor}">{t}</span>'
lbl = lambda t, cor=OURO: f'<div style="font-family:IN;font-weight:600;letter-spacing:.3em;font-size:15px;color:{cor};text-transform:uppercase">{t}</div>'
cores = [(INK, "Preto institucional", "#070B14"), (NOITE, "Azul noite", "#0A1730"), (NAVY, "Azul Nanoz", "#13254A"),
         (OURO, "Dourado", "#B89B5E"), (CHAMP, "Champagne", "#E4D6B3"), (MARFIM, "Marfim", "#F7F4EE")]

post = f'''<div style="width:400px;height:500px;position:relative;overflow:hidden;background:radial-gradient(ellipse 100% 70% at 50% 30%,#111C33,{INK});box-shadow:0 24px 60px rgba(0,0,0,.35)">
  <div style="position:absolute;left:30px;top:30px">{nz(54)}</div>
  <div style="position:absolute;right:30px;top:36px">{lbl("Dolarização", CHAMP)}</div>
  <div style="position:absolute;left:30px;right:30px;top:150px;font-family:EB;font-weight:500;font-size:46px;line-height:1.05;color:#fff">Proteja seu patrimônio em {it("moeda forte.")}</div>
  <div style="position:absolute;left:30px;right:30px;top:330px;height:1px;background:linear-gradient(90deg,{OURO},transparent)"></div>
  <div style="position:absolute;left:30px;right:30px;top:350px;font-family:IN;font-size:15px;line-height:1.5;color:#AEB5C4">Estratégias de dolarização para brasileiros no exterior, com segurança e transparência.</div>
  <div style="position:absolute;left:30px;bottom:28px;font-family:IN;font-size:13px;letter-spacing:.18em;color:{OURO}">@NANOZCONSULTORIA</div></div>'''

story = f'''<div style="width:270px;height:480px;position:relative;overflow:hidden;background:{MARFIM};box-shadow:0 24px 60px rgba(0,0,0,.35)">
  <div style="position:absolute;left:0;right:0;top:0;height:230px;background:{NOITE}"></div>
  <div style="position:absolute;left:0;right:0;top:50px">{logo(110)}</div>
  <div style="position:absolute;left:24px;right:24px;top:260px">{lbl("+10 anos de consultoria")}</div>
  <div style="position:absolute;left:24px;right:24px;top:322px;font-family:EB;font-weight:500;font-size:29px;line-height:1.1;color:{NOITE}">O próximo nível dos seus {it("investimentos.", OURO)}</div>
  <div style="position:absolute;left:24px;right:24px;bottom:28px;background:{OURO};color:{INK};font-family:IN;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;text-align:center;padding:14px">Fale com um especialista</div></div>'''

cartao = f'''<div style="display:flex;gap:22px">
  <div style="width:350px;height:200px;background:{NOITE};display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px rgba(0,0,0,.3)">{horiz(48)}</div>
  <div style="width:350px;height:200px;background:{MARFIM};padding:28px;position:relative;box-shadow:0 18px 40px rgba(0,0,0,.18)">
    <div style="font-family:EB;font-weight:600;font-size:28px;color:{NOITE}">Rico Rósas</div>
    <div style="font-family:IN;font-size:11px;letter-spacing:.2em;color:{OURO};margin-top:2px">FUNDADOR · ESPECIALISTA</div>
    <div style="font-family:IN;font-size:12.5px;line-height:1.7;color:{TXT};margin-top:18px">+55 (61) 92002-3306<br>investimento1@nanozconsultoria.com.br<br>nanozconsultoria.com.br</div>
    <div style="position:absolute;right:24px;bottom:22px">{nz(44)}</div></div></div>'''

prancha = f'''<div id="prancha" style="width:1600px;height:2160px;position:relative;background:{MARFIM};color:{NOITE}">
 <div style="position:absolute;left:0;right:0;top:0;height:110px;background:#04060B;display:flex;align-items:center;justify-content:space-between;padding:0 80px">
   <div style="font-family:IN;font-weight:500;letter-spacing:.3em;font-size:17px;color:#C9CED9">NANOZ CONSULTORIA · IDENTIDADE VISUAL · PROPOSTA</div>
   <div style="display:flex;align-items:center;gap:12px"><div style="width:42px;height:42px;background:#FFD400;border-radius:10px;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 40 40" style="width:28px"><g fill="#0B0B0B"><rect x="4" y="12" width="9" height="3.2" rx="1.6"/><rect x="2" y="18.4" width="11" height="3.2" rx="1.6"/><rect x="4" y="24.8" width="9" height="3.2" rx="1.6"/><path d="M16 9 L35 20 L16 31 Z"/></g></svg></div>
     <div style="line-height:1;font-family:IN"><div style="font-weight:500;font-size:19px;color:#fff">criativos</div><div style="font-weight:700;font-style:italic;font-size:21px;color:#FFD400">rápidos</div></div></div></div>

 <div style="position:absolute;left:80px;right:80px;top:160px;height:620px;background:radial-gradient(ellipse 80% 90% at 50% 30%,#111C33,{INK});display:flex;align-items:center;justify-content:center;overflow:hidden">
   <div style="position:absolute;inset:0;background-image:linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:120px 100%"></div>
   <div style="position:relative">{logo(340)}</div>
   <div style="position:absolute;left:40px;bottom:32px">{lbl("Logo principal · mantida, redesenhada em vetor", "#8E97AB")}</div>
   <div style="position:absolute;right:40px;bottom:28px;font-family:EB;font-style:italic;font-size:26px;color:{CHAMP}">“O próximo nível dos seus investimentos.”</div></div>

 <div style="position:absolute;left:80px;width:700px;top:820px;height:250px;background:#fff;border:1px solid #E4DED2;display:flex;align-items:center;justify-content:center">{horiz(84, NOITE)}</div>
 <div style="position:absolute;left:820px;right:80px;top:820px;height:250px;background:{NOITE};display:flex;align-items:center;justify-content:center">{horiz(84)}</div>

 <div style="position:absolute;left:80px;top:1120px">{lbl("Paleta")}</div>
 <div style="position:absolute;left:80px;right:80px;top:1160px;display:grid;grid-template-columns:repeat(6,1fr);gap:16px">
   {"".join(f'<div><div style="height:130px;background:{c};border:1px solid #E1DBCD"></div><div style="font-family:IN;font-weight:600;font-size:17px;margin-top:12px">{n}</div><div style="font-family:IN;font-size:15px;color:{TXT}">{h}</div></div>' for c, n, h in cores)}</div>

 <div style="position:absolute;left:80px;top:1420px">{lbl("Tipografia")}</div>
 <div style="position:absolute;left:80px;width:700px;top:1460px;height:300px;background:#fff;border:1px solid #E4DED2;padding:36px">
   <div style="font-family:EB;font-weight:500;font-size:72px;line-height:1">EB Garamond</div>
   <div style="font-family:IN;font-size:17px;color:{TXT};margin-top:10px">Títulos · serifada clássica, de instituição financeira</div>
   <div style="font-family:IN;font-weight:500;font-size:46px;margin-top:34px;letter-spacing:-.01em">Inter</div>
   <div style="font-family:IN;font-size:17px;color:{TXT};margin-top:6px">Textos, números e rótulos em CAIXA ALTA espaçada</div></div>
 <div style="position:absolute;left:80px;width:700px;top:1790px;height:290px;background:{NOITE};color:#fff;padding:36px">
   {lbl("Tom de voz", CHAMP)}
   <div style="font-family:EB;font-weight:500;font-size:38px;line-height:1.15;margin-top:16px">Sóbrio, seguro e próximo.<br>{it("Confiança")} antes de promessa.</div>
   <div style="font-family:IN;font-size:16px;color:#C3C9D6;margin-top:18px;line-height:1.55">Segurança · Transparência · Estratégia sob medida · Parceria duradoura · Porto seguro no Brasil</div></div>

 <div style="position:absolute;left:820px;top:1420px">{lbl("Aplicações")}</div>
 <div style="position:absolute;left:820px;top:1460px">{post}</div>
 <div style="position:absolute;left:1250px;top:1460px">{story}</div>
 <div style="position:absolute;left:820px;top:1990px;font-family:IN;font-size:13px;color:{TXT}">Post · Story · Cartão de visita (abaixo)</div>
</div>
<div id="cartoes" style="display:inline-block;padding:40px;background:#E9E4D8">{cartao}</div>'''

CSS = '''@font-face { font-family: EB; font-weight: 500; src: url(fonts/eb-garamond-latin-500-normal.woff2); }
@font-face { font-family: EB; font-weight: 600; src: url(fonts/eb-garamond-latin-600-normal.woff2); }
@font-face { font-family: EB; font-weight: 500; font-style: italic; src: url(fonts/eb-garamond-latin-500-italic.woff2); }
@font-face { font-family: IN; font-weight: 400; src: url(fonts/inter-latin-400-normal.woff2); }
@font-face { font-family: IN; font-weight: 500; src: url(fonts/inter-latin-500-normal.woff2); }
@font-face { font-family: IN; font-weight: 600; src: url(fonts/inter-latin-600-normal.woff2); }
@font-face { font-family: IN; font-weight: 700; src: url(fonts/inter-latin-700-normal.woff2); }
* { margin:0; padding:0; box-sizing:border-box; } body { background:#888; font-variant-numeric:lining-nums; }'''

pecas = {
    "logo_principal": f'<div id="logo_principal" style="width:1200px;height:1200px;background:{NOITE};display:flex;align-items:center;justify-content:center">{logo(600)}</div>',
    "perfil_instagram": f'<div id="perfil_instagram" style="width:1080px;height:1080px;border-radius:50%;background:{NOITE};display:flex;align-items:center;justify-content:center">{logo(500)}</div>',
    "logo_horizontal_escura": f'<div id="logo_horizontal_escura" style="display:inline-block;padding:60px 80px;background:{NOITE}">{horiz(150)}</div>',
    "logo_horizontal_clara": f'<div id="logo_horizontal_clara" style="display:inline-block;padding:60px 80px;background:#fff">{horiz(150, NOITE)}</div>',
}
(ROOT / "identidade.html").write_text(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{prancha}{"".join(pecas.values())}</body></html>')
(ROOT / "saida/identidade").mkdir(parents=True, exist_ok=True)
js = '''const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1700, height: 2300 }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.resolve(__dirname, "identidade.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  await (await p.$("#prancha")).screenshot({ path: path.resolve(__dirname, "saida/nanoz_identidade_visual_v2.png") });
  await (await p.$("#cartoes")).screenshot({ path: path.resolve(__dirname, "saida/identidade/cartao_de_visita.png") });
  for (const id of ["logo_principal", "perfil_instagram", "logo_horizontal_escura", "logo_horizontal_clara"])
    await (await p.$("#" + id)).screenshot({ path: path.resolve(__dirname, "saida/identidade/" + id + ".png") });
  for (const [nome, vw, vh, esc] of [["landing_computador", 1440, 900, 1], ["landing_celular", 390, 844, 2]]) {
    const q = await b.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: esc });
    await q.goto("file://" + path.resolve(__dirname, "landing/index.html")); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(600);
    await q.screenshot({ path: path.resolve(__dirname, "saida/" + nome + ".jpg"), fullPage: true, type: "jpeg", quality: 86 });
  }
  await b.close();
})();
'''
(ROOT / "shot.js").write_text(js)
subprocess.run(f"cd {ROOT} && NODE_PATH=$(npm root -g) node shot.js", shell=True, check=True)
print("ok")
