#!/usr/bin/env python3
"""Líderes do Brasil × Grupo Alvim (alimentação e varejo): reunião dos presidentes + visita à operação Burger King.
Duas versões: pílula só com trilha (estilo Sociedade JABS) e versão com locução.
Uso: python3 edita.py [pilula|locucao|tudo] [preview]"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / "sociedade"))
import edita as soc                                                        # gerador de trilha 110 BPM

TMP = ROOT / "tmp"
TMP.mkdir(exist_ok=True)
B = 60 / 110


def run(*a):
    subprocess.run(a, check=True)


def bruto(c):
    return str(next((ROOT / "brutos").glob(f"{c}.*")))


def clipe(i, c, ini, dur, z0=1.03, z1=1.10, vel=1.0, cx=0.5, cy=0.5):
    """Corta o trecho, leva a 1080x1920 (lanczos, só o necessário), push-in suave e cor tratada. CRF 14 = sem perda visível."""
    fonte = dur * vel
    vf = (f"setpts=PTS/{vel},scale=w='trunc(max(1080/iw\\,1920/ih)*iw*({z0}+({z1}-{z0})*min(t/{dur:.3f}\\,1))/2)*2':h=-2:eval=frame:flags=lanczos,"
          f"crop=1080:1920:(iw-1080)*{cx}:(ih-1920)*{cy},unsharp=5:5:0.45,eq=contrast=1.07:saturation=1.12:gamma=0.98,colorbalance=rs=0.025:bh=-0.02:rh=0.015,"
          f"setsar=1,fps=30,trim=0:{dur:.3f},setpts=PTS-STARTPTS")
    out = TMP / f"s{i:02d}.mp4"
    run("ffmpeg", "-y", "-loglevel", "error", "-ss", f"{ini}", "-t", f"{fonte + 0.2:.3f}", "-i", bruto(c), "-an", "-vf", vf,
        "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", str(out))
    return out


def base(segs, nome):
    lista = []
    for i, s in enumerate(segs):
        c, ini, dur = s[:3]
        kw = s[3] if len(s) > 3 else {}
        z = (1.02, 1.09) if i % 2 == 0 else (1.09, 1.03)
        lista.append(clipe(i, c, ini, dur, *kw.get("z", z), vel=kw.get("vel", 1.0), cx=kw.get("cx", .5), cy=kw.get("cy", .5)))
    (TMP / "lista.txt").write_text("".join(f"file '{p}'\n" for p in lista))
    out = TMP / f"{nome}_base.mp4"
    run("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(TMP / "lista.txt"), "-c", "copy", str(out))
    return out


CSS = '''
@font-face { font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; background:transparent; overflow:hidden; font-family:M; color:#fff; }
.abs { position:absolute; }
#vin { inset:0; background:radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.5) 100%); }
#grad { left:0; right:0; bottom:0; height:950px; background:linear-gradient(180deg, transparent, rgba(0,0,0,.8)); }
.k { font-weight:600; letter-spacing:.38em; font-size:28px; color:#C9D3FF; text-transform:uppercase; }
.big { font-family:Anton; font-size:140px; line-height:.95; text-transform:uppercase; text-shadow:0 6px 30px rgba(0,0,0,.5); }
.azul { color:#8FA6FF; } .lar { color:#FF8A1F; }
.mask { overflow:hidden; padding:64px 0 10px; margin:-58px 0 -10px; }
.item { position:absolute; left:70px; right:70px; opacity:0; }
.chip { display:inline-flex; align-items:center; gap:14px; background:#2E46C8; padding:12px 26px; border-radius:10px; font-weight:800; font-size:34px; letter-spacing:.04em; }
.chip img { height:42px; }
.fio { height:6px; width:0; margin-top:16px; background:#fff; border-radius:3px; }
.sub { font-weight:800; font-size:38px; margin-top:14px; text-transform:uppercase; letter-spacing:.05em; text-shadow:0 4px 18px rgba(0,0,0,.6); }
.num { font-family:Anton; font-size:230px; line-height:.9; text-shadow:0 8px 34px rgba(0,0,0,.55); }
#bug { right:46px; top:60px; display:flex; align-items:center; gap:10px; font-weight:800; font-size:22px; letter-spacing:.24em; text-transform:uppercase;
       padding:10px 20px; border:1.5px solid rgba(255,255,255,.5); border-radius:40px; background:rgba(0,0,0,.28); opacity:0; }
#bug img { height:30px; }
#flash { inset:0; background:#fff; opacity:0; }
#fim { inset:0; opacity:0; background:radial-gradient(ellipse at 50% 40%, #1d2a5c 0%, #0b1030 55%, #05060f 100%);
       display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
#fim img { width:620px; }
#fim .linha { width:0; height:4px; background:linear-gradient(90deg,transparent,#8FA6FF,transparent); margin:44px auto 36px; }
'''


def item_html(it):
    """it = dict(t0, t1, top, kicker?, linhas=[(texto, classe)], chip?, sub?, num?)"""
    h = f'<div class="item" data-a="{it["t0"]:.3f}" data-b="{it["t1"]:.3f}" style="top:{it.get("top", 1300)}px">'
    if it.get("chip"):
        h += f'<div class="chip"><img src="assets/lideres_logo.png">{it["chip"]}</div><div style="height:18px"></div>'
    if it.get("kicker"):
        h += f'<div class="mask"><div class="k s">{it["kicker"]}</div></div>'
    if it.get("num"):
        h += f'<div class="mask"><div class="num s"><span class="lar">+</span>R$ <span class="cont" data-v="{it["num"]}">0</span> MI</div></div>'
    for txt, cls in it.get("linhas", []):
        h += f'<div class="mask"><div class="big s {cls}" style="font-size:{it.get("fs", 140)}px">{txt}</div></div>'
    if it.get("sub"):
        h += f'<div class="mask"><div class="sub s">{it["sub"]}</div></div><div class="fio"></div>'
    return h + "</div>"


FIM_TXT = ("Vem novidade", "por aí", "Fica atento")


def overlay(itens, cuts, fim, bug=(None, None), flash=True):
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div id="vin" class="abs"></div><div id="grad" class="abs"></div>
{"".join(item_html(i) for i in itens)}
<div id="bug" class="abs"><img src="assets/lideres_logo.png"></div>
<div id="fim" class="abs"><img id="flogo" src="assets/lideres_logo.png"><div class="linha" id="flin"></div>
  <div class="mask"><div class="big" id="f1" style="font-size:110px">{FIM_TXT[0]}</div></div>
  <div class="mask"><div class="big azul" id="f2" style="font-size:110px">{FIM_TXT[1]}</div></div>
  <div class="mask" style="margin-top:24px"><div class="k" id="f3">{FIM_TXT[2]}</div></div></div>
<div id="flash" class="abs"></div>
<script>
const C = {json.dumps(cuts)}, FIM = {fim:.3f}, BUG = {json.dumps(bug)}, FL = {json.dumps(flash)};
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), e5 = x => 1 - Math.pow(1 - x, 5), eo = x => 1 - Math.pow(1 - x, 3);
const $ = id => document.getElementById(id);
function sobe(el, t, t0, t1) {{ const p = e5(cl((t - t0) / .5)), q = eo(cl((t - t1) / .35)); el.style.transform = `translateY(${{((1 - p) * 175 + q * 175).toFixed(1)}}%)`; }}
function render(t) {{
  document.querySelectorAll(".item").forEach(it => {{
    const a = +it.dataset.a, b = +it.dataset.b;
    it.style.opacity = (t > a - .05 && t < b + .4) ? 1 : 0;
    it.querySelectorAll(".s").forEach((s, k) => sobe(s, t, a + k * .12, b - .1 + k * .04));
    const ch = it.querySelector(".chip"); if (ch) {{ ch.style.opacity = cl((t - a) / .3) * (1 - cl((t - b) / .3)); ch.style.transform = `translateX(${{((1 - e5(cl((t - a) / .5))) * -80).toFixed(1)}}px)`; }}
    const f = it.querySelector(".fio"); if (f) {{ f.style.width = (e5(cl((t - a - .3) / .7)) * 320 * (1 - cl((t - b) / .3))).toFixed(0) + "px"; }}
    const n = it.querySelector(".cont"); if (n) n.textContent = Math.round(+n.dataset.v * eo(cl((t - a - .2) / 1.2)));
  }});
  $("bug").style.opacity = BUG[0] === null ? 0 : (.9 * cl((t - BUG[0]) / .4) * (1 - cl((t - BUG[1]) / .4))).toFixed(3);
  let f = 0; if (FL) C.slice(1).forEach(c => {{ const q = t - c; if (q >= 0 && q < .16) f = Math.max(f, .28 * (1 - q / .16)); }});
  $("flash").style.opacity = f;
  $("fim").style.opacity = cl((t - FIM) / .35);
  const ql = e5(cl((t - FIM - .1) / .6));
  $("flogo").style.transform = `scale(${{(0.75 + 0.25 * ql + .03 * cl((t - FIM) / 4)).toFixed(4)}})`; $("flogo").style.opacity = ql;
  $("flin").style.width = (e5(cl((t - FIM - .35) / .7)) * 600).toFixed(0) + "px";
  sobe($("f1"), t, FIM + .45, 999); sobe($("f2"), t, FIM + .6, 999); sobe($("f3"), t, FIM + .9, 999);
}}
window.render = render; render(0);
</script></body></html>'''


def captura(html, dur, pasta, preview=None):
    (ROOT / "overlay.html").write_text(html)
    pasta.mkdir(parents=True, exist_ok=True)
    for p in pasta.glob("*.png"):
        p.unlink()
    args = ["preview", str(pasta), *map(str, preview)] if preview else ["30", f"{dur:.3f}", str(pasta)]
    subprocess.run(f"cd {ROOT} && NODE_PATH=$(npm root -g) node captura_alpha.js " + " ".join(args), shell=True, check=True)


def grava(nome, x, sr=44100):
    x = np.clip(x / np.abs(x).max() * 0.9, -1, 1)
    with wave.open(str(nome), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def trilha(dur, cuts):
    soc.DUR, soc.CUTS = dur, cuts
    soc.N = int(soc.SR * dur)
    return soc.trilha()


def monta(nome, segs, itens, fim_extra, bug, voz=None, music_cuts=None, preview=None):
    cuts = [0.0]
    for s in segs:
        cuts.append(cuts[-1] + s[2])
    fim = cuts[-1]
    dur = fim + fim_extra
    html = overlay(itens, cuts, fim, bug)
    if preview:
        captura(html, dur, TMP / "prev", preview)
        return
    vb = TMP / f"{nome}_base.mp4"
    if not (vb.exists() and __import__("os").environ.get("REUSA_BASE")):
        vb = base(segs, nome)
    captura(html, dur, TMP / f"ov_{nome}")
    grava(TMP / f"trilha_{nome}.wav", trilha(dur + 0.6, music_cuts or cuts))
    saida = ROOT / "saida" / f"{nome}.mp4"
    (ROOT / "saida").mkdir(exist_ok=True)
    vf = (f"color=c=black:s=1080x1920:r=30:d={dur:.3f}[bg];[bg][0:v]overlay=eof_action=repeat[b];"
          f"[b][1:v]overlay=0:0:format=auto,format=yuv420p[v]")
    if voz:
        ent = ["-i", str(voz)]
        af = (f"[3:a]adelay=150|150,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=90,volume=2.0,apad,asplit=2[v1][v2];"
              f"[2:a]volume=0.22[m];[m][v1]sidechaincompress=threshold=0.03:ratio=5:release=250[md];"
              f"[md][v2]amix=inputs=2:duration=first:normalize=0,afade=t=out:st={dur - 1.0:.3f}:d=1.0,loudnorm=I=-14:TP=-1.0,atrim=0:{dur:.3f}[a]")
    else:
        ent = []
        af = f"[2:a]afade=t=in:d=0.3,afade=t=out:st={dur - 1.2:.3f}:d=1.2,loudnorm=I=-14:TP=-1.0,atrim=0:{dur:.3f}[a]"
    run("ffmpeg", "-y", "-loglevel", "error", "-i", str(vb), "-framerate", "30", "-i", str(TMP / f"ov_{nome}" / "o_%05d.png"),
        "-i", str(TMP / f"trilha_{nome}.wav"), *ent, "-filter_complex", vf + ";" + af, "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-profile:v", "high", "-c:a", "aac", "-b:a", "256k",
        "-movflags", "+faststart", "-t", f"{dur:.3f}", str(saida))
    print("OK ->", saida, round(dur, 2), "s")


# ---------------------------------------------------------------- pílula (só trilha, cortes no tempo da música)
P = [("c12", 0.3, 6 * B), ("c11", 0.5, 4 * B), ("c05", 0.2, 5 * B), ("c04", 4.0, 6 * B, {"z": (1.03, 1.12)}), ("c09", 0.0, 3 * B, {"vel": 0.62, "z": (1.0, 1.06)}),
     ("c03", 2.0, 5 * B), ("c06", 1.0, 4 * B), ("c07", 0.5, 4 * B), ("c08", 6.0, 6 * B), ("c10", 0.2, 5 * B), ("c03", 6.0, 5 * B)]


def pilula(preview=False):
    c = [0.0]
    for s in P:
        c.append(c[-1] + s[2])
    itens = [
        dict(t0=0.45, t1=c[1] - 0.2, top=1240, kicker="Líderes do Brasil", linhas=[("Reunião da", ""), ("presidência", "azul")]),
        dict(t0=c[1] + 0.1, t1=c[2] - 0.1, top=1420, linhas=[("Felipe Alvim", "")], sub="Presidente do Grupo Alvim · Especialista em alimentação e varejo", fs=130),
        dict(t0=c[2] + 0.3, t1=c[3] - 0.15, top=1420, chip="Presidentes · Líderes do Brasil", linhas=[("Alimentação", ""), ("& varejo", "azul")], fs=118),
        dict(t0=c[3] + 0.3, t1=c[4] - 0.15, top=1440, kicker="Nosso presidente", linhas=[("Daher", "")], sub="Presidente · Líderes do Brasil", fs=140),
        dict(t0=c[4] + 0.1, t1=c[5] - 0.1, top=1460, linhas=[("Cláudia", "")], sub="Vice-presidente · Líderes do Brasil", fs=130),
        dict(t0=c[5] + 0.2, t1=c[6] - 0.15, top=1420, kicker="Na mesa", linhas=[("Gestão · visão", ""), ("crescimento", "azul")], fs=110),
        dict(t0=c[6] + 0.2, t1=c[8] - 0.15, top=1420, kicker="Direto da operação", linhas=[("Da cozinha", ""), ("ao balcão", "azul")], fs=130),
        dict(t0=c[8] + 0.2, t1=c[9] - 0.1, top=1120, kicker="Grupo Alvim: dono de todos os", linhas=[("Burger King", ""), ("de Brasília", "azul")], fs=120),
        dict(t0=c[9] + 0.15, t1=c[10] - 0.1, top=1180, kicker="Felipe Alvim · Grupo Alvim", num=100, sub="de faturamento por ano"),
        dict(t0=c[10] + 0.15, t1=c[11] - 0.25, top=1400, kicker="Presidência Líderes × Grupo Alvim", linhas=[("Conexão", ""), ("que gera negócio", "azul")], fs=118),
    ]
    monta("lideres_grupo_alvim_pilula", P, itens, 6 * B, (c[1] + 0.2, c[-1] - 0.4), preview=[1.5, c[2] + 1.3, c[3] + 1.5, c[4] + 1.2, c[7] + 0.5, c[8] + 1.8, c[10], c[-1] + 2] if preview else None)


# ---------------------------------------------------------------- versão com locução (cortes nas frases)
def locucao(preview=False):
    L = 0.15
    # (bruto, início, entra, sai) — tempos da locução v2 (+L)
    plano = [("c12", 0.3, 0.0, 3.0), ("c05", 0.0, 3.0, 5.35), ("c04", 4.0, 5.35, 7.2, {"z": (1.03, 1.12)}),
             ("c09", 0.0, 7.2, 8.9, {"vel": .58, "z": (1.0, 1.06)}), ("c03", 2.0, 8.9, 9.95), ("c10", 0.2, 9.95, 12.2),
             ("c11", 1.5, 12.2, 14.3), ("c08", 4.5, 14.3, 18.05), ("c07", 0.4, 18.05, 21.45, {"z": (1.0, 1.14)}),
             ("c04", 6.5, 21.45, 23.6, {"z": (1.12, 1.03)}), ("c02", 6.0, 23.6, 26.0, {"z": (1.25, 1.32), "cx": .62, "cy": .45}),
             ("c06", 0.8, 26.0, 27.4), ("c08", 1.0, 27.4, 29.15), ("c03", 6.0, 29.15, 30.85)]
    segs = []
    for p in plano:
        cc, ini, a, b = p[:4]
        segs.append((cc, ini, b - a, p[4] if len(p) > 4 else {}))
    c = [0.0]
    for sg in segs:
        c.append(c[-1] + sg[2])
    itens = [
        dict(t0=0.3, t1=c[2] - 0.15, top=1180, kicker="Líderes do Brasil", linhas=[("Reunião da", ""), ("presidência", "azul")], sub="com o presidente do Grupo Alvim", fs=136),
        dict(t0=c[2] + 0.1, t1=c[3] - 0.1, top=1420, kicker="Nosso presidente", linhas=[("Daher", "")], sub="Presidente · Líderes do Brasil", fs=150),
        dict(t0=c[3] + 0.05, t1=c[4] - 0.05, top=1440, linhas=[("Cláudia", "")], sub="Vice-presidente · Líderes do Brasil", fs=140),
        dict(t0=c[5] + 0.05, t1=c[7] - 0.1, top=1400, kicker="Especialista em alimentação e varejo", linhas=[("Felipe Alvim", "")], sub="Presidente do Grupo Alvim", fs=136),
        dict(t0=c[7] + 0.1, t1=c[8] - 0.1, top=1180, kicker="O Grupo Alvim é dono de", linhas=[("Todos os", ""), ("Burger King", "lar"), ("de Brasília", "azul")], fs=124),
        dict(t0=c[8] + 0.05, t1=c[9] - 0.1, top=1180, kicker="E fatura mais de", num=100, sub="por ano"),
        dict(t0=c[9] + 0.1, t1=c[11] - 0.1, top=1400, kicker="Uma tarde de troca de", linhas=[("Experiência", ""), ("gestão e visão", "azul")], fs=124),
        dict(t0=c[11] + 0.1, t1=c[13] - 0.1, top=1420, kicker="Direto da operação", linhas=[("Da cozinha", ""), ("ao balcão", "azul")], fs=136),
    ]
    monta("lideres_grupo_alvim_locucao", segs, itens, 2.6, (c[2] + 0.2, c[-1] - 0.3),
          voz=ROOT / "audio" / "locucao.mp3", music_cuts=[0.0, c[2], c[7], c[8], c[9], c[11], c[-1]],
          preview=[1.5, c[2] + 1, c[5] + 1, c[7] + 1.5, c[8] + 1.5, c[-1] + 1.5] if preview else None)


if __name__ == "__main__":
    modo = sys.argv[1] if len(sys.argv) > 1 else "tudo"
    prev = "preview" in sys.argv
    if modo in ("pilula", "tudo"):
        pilula(prev)
    if modo in ("locucao", "tudo"):
        locucao(prev)
