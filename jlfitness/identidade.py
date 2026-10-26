#!/usr/bin/env python3
"""Proposta de identidade visual + mockup de Instagram da JL Fitness (2 PNGs para mandar ao cliente)."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
AM, PR = "#FFE100", "#0B0B0B"


def logo(esc=1.0, borda=PR):
    return (f'<div style="display:inline-flex;align-items:stretch;transform:scale({esc});transform-origin:left center;border:5px solid {borda};border-radius:27px">'
            f'<div style="width:190px;height:170px;background:{AM};border-radius:22px 0 0 22px;display:flex;align-items:center;justify-content:center">'
            f'<img src="assets/silhueta.png" style="width:160px"></div>'
            f'<div style="display:flex;flex-direction:column;justify-content:center;background:#fff;border-radius:0 22px 22px 0;padding:0 34px 0 26px">'
            f'<div class="A" style="font-size:104px;color:{PR};line-height:1">JL FITNESS</div>'
            f'<div style="background:{PR};color:#fff;font-weight:800;font-size:25px;letter-spacing:.24em;padding:6px 16px;margin-top:4px;transform:skewX(-12deg)">'
            f'<span style="display:inline-block;transform:skewX(12deg)">ASSESSORIA ESPORTIVA</span></div></div></div>')


def selo(tam):
    """Avatar redondo: selo amarelo com a silhueta e JL."""
    return (f'<div style="width:{tam}px;height:{tam}px;border-radius:50%;background:{AM};border:{tam // 28}px solid {PR};display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden">'
            f'<img src="assets/silhueta.png" style="width:{int(tam * .5)}px;margin-top:{int(tam * .02)}px">'
            f'<div class="A" style="font-size:{int(tam * .15)}px;color:{PR};line-height:1;margin-top:{int(tam * .03)}px">JL FITNESS</div></div>')


def ph(arq, pos="center"):
    return f'background-image:url(assets/{arq});background-size:cover;background-position:{pos}'


ICON = {
    "predio": '<path d="M4 21V5l8-3v19M12 21h8V9l-8-2M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" />',
    "play": '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M10 9l5 3-5 3z" fill="#0B0B0B"/>',
    "estrela": '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    "agenda": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "zap": '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c.5 2 2.5 4 4.5 4.5l1.2-1.2 2 1-.5 1.7c-3.5 0-7.7-4.2-7.7-7.7L10.2 7l1 2z" fill="#0B0B0B"/>',
}


def destaque(ic, nome):
    return (f'<div style="text-align:center;width:150px"><div style="width:128px;height:128px;margin:0 auto;border-radius:50%;padding:5px;border:3px solid #3a3a3a">'
            f'<div style="width:100%;height:100%;border-radius:50%;background:{AM};display:flex;align-items:center;justify-content:center">'
            f'<svg viewBox="0 0 24 24" style="width:54px;height:54px;fill:none;stroke:{PR};stroke-width:2;stroke-linecap:round;stroke-linejoin:round">{ICON[ic]}</svg></div></div>'
            f'<div style="font-size:24px;margin-top:10px;color:#eee">{nome}</div></div>')


# ---- 12 posts do feed (modelos de post, carrossel e reels com fotos reais)
def post_foto(arq, titulo, pos="center 35%"):
    return (f'<div class="cel" style="{ph(arq, pos)}"><div class="ov"></div>'
            f'<div style="position:absolute;left:18px;right:18px;bottom:22px"><span class="tag" style="font-size:40px"><span>{titulo}</span></span></div></div>')


def reels(arq, titulo, pos="center 35%"):
    return (f'<div class="cel" style="{ph(arq, pos)}"><div class="ov" style="background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.65))"></div>'
            f'<svg viewBox="0 0 24 24" style="position:absolute;right:16px;top:16px;width:40px;height:40px;fill:none;stroke:#fff;stroke-width:2"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M10 8.5l5 3.5-5 3.5z" fill="#fff"/></svg>'
            f'<div class="A" style="position:absolute;left:20px;right:20px;top:50%;transform:translateY(-50%);font-size:58px;line-height:.98;text-align:center">{titulo}</div></div>')


def carrossel(titulo, sub, fundo=AM):
    cor = PR if fundo == AM else "#fff"
    return (f'<div class="cel" style="background:{fundo}">'
            f'<div style="position:absolute;inset:0;background:repeating-linear-gradient(-45deg,rgba(0,0,0,.06) 0 14px,transparent 14px 28px)"></div>'
            f'<svg viewBox="0 0 24 24" style="position:absolute;right:16px;top:16px;width:38px;height:38px;fill:none;stroke:{cor};stroke-width:2"><rect x="7" y="3" width="14" height="14" rx="2"/><path d="M3 7v12a2 2 0 0 0 2 2h12"/></svg>'
            f'<div style="position:absolute;left:24px;right:24px;top:70px"><div class="A" style="font-size:62px;line-height:.98;color:{cor}">{titulo}</div>'
            f'<div style="font-weight:800;font-size:22px;margin-top:16px;color:{cor};letter-spacing:.06em">{sub}</div></div>'
            f'<img src="assets/silhueta.png" style="position:absolute;right:20px;bottom:18px;width:80px;{"filter:invert(1)" if fundo != AM else ""}"></div>')


def frase(txt):
    return (f'<div class="cel" style="background:{PR};display:flex;align-items:center;justify-content:center;padding:30px">'
            f'<div class="A" style="font-size:60px;line-height:1;text-align:center">{txt}</div></div>')


feed = [
    reels("f_leques.jpg", 'AULA DE<br><span style="color:#FFE100">DANÇA</span><br>NO PRÉDIO', "center 30%"),
    carrossel("5 MOTIVOS PRA TREINAR NO SEU CONDOMÍNIO", "ARRASTA PRO LADO →"),
    post_foto("f_grupo1.jpg", "TURMA DO CONDOMÍNIO"),
    frase('ACADEMIA DO PRÉDIO<br><span style="color:#FFE100">VAZIA?</span><br>A GENTE RESOLVE.'),
    reels("f_along.jpg", 'ALONGAMENTO<br>EM <span style="color:#FFE100">5 MIN</span>', "center 50%"),
    post_foto("f_senhoras.jpg", "PRA TODAS AS IDADES"),
    post_foto("f_grupo2.jpg", "PROFESSOR DO SEU LADO"),
    carrossel("SÍNDICO: COMO LEVAR AULAS PRO SEU PRÉDIO", "PASSO A PASSO →", PR),
    reels("f_setembro.jpg", 'BASTIDORES<br>DA <span style="color:#FFE100">AULA</span>', "center 0%"),
    carrossel("O QUE NOSSOS ALUNOS DIZEM", "DEPOIMENTOS →"),
    post_foto("f_quadra.jpg", "AULA NA QUADRA"),
    reels("f_turma_natal.jpg", 'FESTA DE<br>FIM DE <span style="color:#FFE100">ANO</span>', "center 40%"),
]

CSS = f'''
@font-face {{ font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }}
@font-face {{ font-family: M; font-weight: 500; src: url(fonts/montserrat-latin-500-normal.woff); }}
@font-face {{ font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }}
@font-face {{ font-family: M; font-weight: 700; src: url(fonts/montserrat-latin-700-normal.woff); }}
@font-face {{ font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }}
@font-face {{ font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:#222; font-family:M, sans-serif; color:#fff; }}
.A {{ font-family:Anton; text-transform:uppercase; line-height:.95; }}
.pg {{ width:1080px; position:relative; overflow:hidden; margin-bottom:40px; }}
.tag {{ display:inline-block; background:{AM}; color:{PR}; font-family:Anton; text-transform:uppercase; padding:6px 20px 10px; transform:skewX(-10deg); line-height:1; }}
.tag > span {{ display:inline-block; transform:skewX(10deg); }}
.tagP {{ display:inline-block; background:{PR}; color:{AM}; font-family:Anton; text-transform:uppercase; padding:8px 26px 12px; transform:skewX(-10deg); line-height:1; }}
.tagP > span {{ display:inline-block; transform:skewX(10deg); }}
.grid {{ display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; }}
.cel {{ position:relative; aspect-ratio:4/5; overflow:hidden; background-color:#333; }}
.ov {{ position:absolute; inset:0; background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.55)); }}
.cor {{ flex:1; height:220px; border-radius:22px; padding:22px; display:flex; flex-direction:column; justify-content:flex-end; font-weight:800; font-size:26px; }}
.lbl {{ font-weight:800; letter-spacing:.3em; font-size:24px; text-transform:uppercase; color:{PR}; margin-bottom:22px; }}
'''

# ---- página 1: identidade visual
p1 = f'''
<div class="pg" id="p1" style="height:2130px;background:{AM}">
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(-45deg,rgba(0,0,0,.05) 0 26px,transparent 26px 52px)"></div>
  <div style="position:absolute;left:70px;right:70px;top:70px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="tagP" style="font-size:44px"><span>IDENTIDADE VISUAL</span></span>
      <div style="font-weight:800;font-size:22px;color:{PR};letter-spacing:.2em">PROPOSTA · CRIATIVOS RÁPIDOS</div></div>
    <div class="A" style="font-size:118px;color:{PR};margin-top:46px">JL FITNESS,<br>MAIS FORTE.</div>
    <div style="font-weight:600;font-size:32px;color:#222;margin-top:22px;line-height:1.35;max-width:880px">Mantivemos o que já funciona: o amarelo, o preto e a silhueta. Redesenhamos a tipografia e criamos um selo para perfil, posts e vídeos.</div>

    <div class="lbl" style="margin-top:60px">Logo principal</div>
    <div style="background:{PR};border-radius:30px;padding:56px 40px;display:flex;justify-content:center">{logo(1.0, "#fff")}</div>

    <div style="display:flex;gap:30px;margin-top:30px">
      <div style="flex:1;background:#fff;border-radius:30px;padding:40px;display:flex;flex-direction:column;align-items:center;gap:20px">
        <div class="lbl" style="margin:0">Selo / perfil</div>{selo(250)}</div>
      <div style="flex:1;background:{PR};border-radius:30px;padding:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px">
        <div class="lbl" style="margin:0;color:{AM}">Assinatura</div>
        <div class="A" style="font-size:86px;color:#fff;text-align:center">BORA SE<br><span style="color:{AM}">MOVIMENTAR!</span></div></div>
    </div>

    <div class="lbl" style="margin-top:56px">Cores</div>
    <div style="display:flex;gap:20px">
      <div class="cor" style="background:{AM};color:{PR};border:4px solid {PR}">AMARELO JL<br><span style="font-weight:600;font-size:22px">#FFE100</span></div>
      <div class="cor" style="background:{PR};color:#fff">PRETO<br><span style="font-weight:600;font-size:22px">#0B0B0B</span></div>
      <div class="cor" style="background:#fff;color:{PR}">BRANCO<br><span style="font-weight:600;font-size:22px">#FFFFFF</span></div>
    </div>

    <div class="lbl" style="margin-top:56px">Tipografia</div>
    <div style="display:flex;gap:20px">
      <div style="flex:1;background:#fff;border-radius:22px;padding:30px;color:{PR}"><div class="A" style="font-size:96px">ANTON</div><div style="font-weight:600;font-size:24px;margin-top:10px">Títulos e chamadas — forte, condensada, esportiva</div></div>
      <div style="flex:1;background:#fff;border-radius:22px;padding:30px;color:{PR}"><div style="font-weight:900;font-size:70px;line-height:1.1">Montserrat</div><div style="font-weight:600;font-size:24px;margin-top:10px">Textos, legendas e informações</div></div>
    </div>
  </div>
</div>'''

# ---- página 2: como fica o Instagram
p2 = f'''
<div class="pg" id="p2" style="background:#000">
  <div style="padding:46px 40px 0">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="font-weight:800;font-size:40px">jlfitnessassessoriaesportiva</div>
      <span class="tag" style="font-size:30px"><span>COMO FICA O INSTAGRAM</span></span></div>
    <div style="display:flex;align-items:center;gap:50px;margin-top:40px">
      <div style="padding:7px;border-radius:50%;background:conic-gradient({AM},#ff8a00,{AM})">{selo(210)}</div>
      <div style="display:flex;gap:56px;text-align:center">
        <div><div style="font-weight:800;font-size:40px">571</div><div style="font-size:26px;color:#ccc">posts</div></div>
        <div><div style="font-weight:800;font-size:40px">1.881</div><div style="font-size:26px;color:#ccc">seguidores</div></div>
        <div><div style="font-weight:800;font-size:40px">1.616</div><div style="font-size:26px;color:#ccc">seguindo</div></div></div></div>
    <div style="margin-top:30px;font-size:30px;line-height:1.42">
      <b>JL Fitness · Assessoria Esportiva</b><br>
      <span style="color:#bbb">Assessoria esportiva</span><br>
      🏢 Aulas em grupo dentro do seu condomínio e empresa<br>
      💃 Dança · alongamento · atividades para todas as idades<br>
      📍 Águas Claras · Brasília/DF · Goiânia/GO<br>
      👇 Leve a JL pro seu prédio</div>
    <div style="display:flex;gap:16px;margin-top:30px">
      <div style="flex:1;background:{AM};color:{PR};text-align:center;font-weight:800;font-size:30px;padding:20px;border-radius:16px">Chamar no WhatsApp</div>
      <div style="flex:1;background:#262626;text-align:center;font-weight:700;font-size:30px;padding:20px;border-radius:16px">Mensagem</div></div>
    <div style="display:flex;justify-content:space-between;margin-top:40px">
      {destaque("predio", "Condomínios")}{destaque("play", "Aulas")}{destaque("estrela", "Depoimentos")}{destaque("agenda", "Agenda")}{destaque("zap", "Contato")}</div>
  </div>
  <div style="display:flex;border-top:1px solid #222;margin-top:36px">
    <div style="flex:1;text-align:center;padding:22px;border-bottom:3px solid #fff;font-weight:700;font-size:26px">▦ POSTS</div>
    <div style="flex:1;text-align:center;padding:22px;color:#888;font-weight:700;font-size:26px">▶ REELS</div></div>
  <div class="grid">{"".join(feed)}</div>
</div>'''

html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{p1}{p2}</body></html>'
(ROOT / "identidade.html").write_text(html)
js = r'''
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.resolve("identidade.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  await (await p.$("#p1")).screenshot({ path: "saida/jlfitness_identidade_visual.png" });
  await (await p.$("#p2")).screenshot({ path: "saida/jlfitness_instagram_proposta.png" });
  await b.close();
})();'''
(ROOT / "shot_identidade.js").write_text(js)
subprocess.run(f"cd {ROOT} && NODE_PATH=$(npm root -g) node shot_identidade.js", shell=True, check=True)
print("ok")
