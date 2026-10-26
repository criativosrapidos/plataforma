#!/usr/bin/env python3
"""Jéssica Balcasse (CS do Líderes do Brasil): edição profissional do depoimento (cortes de vícios, punch-in,
legenda palavra a palavra, áudio tratado, trilha discreta) + pílula de 10 s só com trilha.
Uso: python3 edita.py [video|pilula|tudo] [preview]"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
SOC = ROOT.parent / "sociedade"
sys.path.insert(0, str(SOC))
import edita as soc                                                     # trilha e utilidades da pílula Sociedade JABS

BRUTO = ROOT / "brutos" / "bruto.mov"
TMP = ROOT / "tmp"
TMP.mkdir(exist_ok=True)

# trechos mantidos do bruto (s): tira gaguejos, "é..." e pausas longas
KEEP = [(0.00, 6.50), (6.58, 7.10), (7.58, 11.40), (13.22, 15.14), (16.72, 17.22), (17.98, 19.08), (19.95, 21.20), (21.80, 22.72),
        (23.20, 25.50), (26.46, 29.42), (29.88, 30.34), (31.76, 33.04), (33.70, 39.20), (39.20, 40.60), (41.48, 42.45),
        (43.02, 48.30), (48.66, 49.80), (50.28, 53.62), (53.64, 55.28), (55.82, 57.90)]
# enquadramento por trecho: (zoom, centro x, centro y) — alterna aberto / fechado no rosto
ENQ = [(1.0, .5, .5), (1.45, .32, .43), (1.45, .32, .43), (1.2, .4, .46), (1.2, .4, .46), (1.2, .4, .46), (1.0, .5, .5), (1.0, .5, .5),
       (1.45, .32, .43), (1.2, .4, .46), (1.0, .5, .5), (1.0, .5, .5), (1.45, .32, .43), (1.2, .4, .46), (1.0, .5, .5),
       (1.45, .32, .43), (1.2, .4, .46), (1.2, .4, .46), (1.0, .5, .5), (1.45, .32, .43)]
FIMCARD = 2.6
# correções de grafia nas legendas
FIX = {"Leaders": "Líderes", "Balcassi,": "Balcasse,", "cês": "vocês"}
REMOVE = {"financei--", "ó,", "é,", "É,"}


def run(*a):
    subprocess.run(a, check=True)


def palavras():
    w = json.load(open(ROOT / "audio" / "palavras.json"))
    out, base = [], 0.0
    for a, b in KEEP:
        for p in w:
            m = (p["start"] + p["end"]) / 2
            if a <= m < b and p["text"] not in REMOVE:
                out.append({"t": base + max(0, p["start"] - a), "e": base + min(b, p["end"]) - a, "w": FIX.get(p["text"], p["text"])})
        base += b - a
    return out, base


def corta_video(segs, enq, saida, voz=True, rapido=False):
    fc, cat = [], ""
    for i, ((a, b), (z, cx, cy)) in enumerate(zip(segs, enq)):
        W, H = int(1080 * z) // 2 * 2, int(1080 * z * 848 / 480) // 2 * 2
        H = max(H, 1920)
        x = int(max(0, min(W - 1080, cx * W - 540)))
        y = int(max(0, min(H - 1920, cy * H - 960)))
        fc.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS,scale={W}:{H}:flags=lanczos,crop=1080:1920:{x}:{y},"
                  f"unsharp=5:5:0.5,eq=contrast=1.06:saturation=1.12:gamma=0.98,colorbalance=rs=0.02:bh=0.02,setsar=1,fps=30[v{i}]")
        if voz:
            fc.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={b - a - 0.03:.3f}:d=0.03[a{i}]")
            cat += f"[v{i}][a{i}]"
        else:
            cat += f"[v{i}]"
    n = len(segs)
    fc.append(f"{cat}concat=n={n}:v=1:a={1 if voz else 0}" + ("[v][a]" if voz else "[v]"))
    mp = ["-map", "[v]"] + (["-map", "[a]"] if voz else [])
    run("ffmpeg", "-y", "-loglevel", "error", "-i", str(BRUTO), "-filter_complex", ";".join(fc), *mp,
        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", *(["-c:a", "pcm_s16le"] if voz else []), str(saida))


CSS = '''
@font-face { font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }
@font-face { font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }
@font-face { font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }
@font-face { font-family: M; font-weight: 900; src: url(fonts/montserrat-latin-900-normal.woff); }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; background:transparent; overflow:hidden; font-family:M; color:#fff; }
.abs { position:absolute; }
#vin { inset:0; background:radial-gradient(ellipse at 50% 45%, transparent 58%, rgba(0,0,0,.45) 100%); }
#leg { left:60px; right:60px; top:1330px; text-align:center; font-weight:900; font-size:68px; line-height:1.18; text-transform:uppercase;
       text-shadow:0 4px 0 rgba(0,0,0,.55), 0 0 22px rgba(0,0,0,.65); -webkit-text-stroke:2px rgba(0,0,0,.35); }
#leg span { display:inline-block; margin:0 8px; }
#leg span.on { color:#0B0B0B; background:#FFFFFF; padding:0 14px; border-radius:12px; -webkit-text-stroke:0; text-shadow:none; transform:scale(1.06) rotate(-2deg); }
#lt { left:60px; top:1540px; opacity:0; }
#lt .n { font-family:Anton; font-size:96px; text-transform:uppercase; line-height:1; text-shadow:0 6px 26px rgba(0,0,0,.6); }
#lt .c { display:inline-flex; align-items:center; gap:14px; margin-top:12px; background:#2E46C8; padding:10px 22px; border-radius:10px; font-weight:800; font-size:32px; letter-spacing:.06em; }
#lt .c img { height:40px; }
#lt .fio { height:6px; width:0; margin-top:14px; background:#fff; border-radius:3px; }
#fim { inset:0; opacity:0; background:radial-gradient(ellipse at 50% 40%, #1d2a5c 0%, #0b1030 55%, #05060f 100%);
       display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
#fim img { width:640px; }
#fim .linha { width:0; height:4px; background:linear-gradient(90deg,transparent,#8FA6FF,transparent); margin:44px auto 36px; }
.k { font-weight:600; letter-spacing:.34em; font-size:30px; text-transform:uppercase; color:#C9D3FF; }
.big { font-family:Anton; font-size:120px; text-transform:uppercase; line-height:.98; }
.mask { overflow:hidden; padding:.34em 0 .1em; margin:-.34em 0 -.1em; }
#flash { inset:0; background:#fff; opacity:0; }
'''


def overlay_video(words, dur):
    # agrupa palavras em blocos curtos (até 3 palavras / quebra em pontuação)
    blocos, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= 3 or w["w"][-1] in ".,?!" :
            blocos.append(cur); cur = []
    if cur:
        blocos.append(cur)
    data = [{"a": b[0]["t"], "b": (blocos[i + 1][0]["t"] if i + 1 < len(blocos) else b[-1]["e"] + .4),
             "w": [[x["w"].rstrip(",.?!"), x["t"]] for x in b]} for i, b in enumerate(blocos)]
    fim = dur
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div id="vin" class="abs"></div>
<div id="leg" class="abs"></div>
<div id="lt" class="abs"><div class="mask"><div class="n" id="ln">Jéssica Balcasse</div></div>
  <div class="c" id="lc"><img src="assets/lideres_logo.png"> CS · Líderes do Brasil</div><div class="fio" id="lf"></div></div>
<div id="fim" class="abs"><img id="flogo" src="assets/lideres_logo.png"><div class="linha" id="flin"></div>
  <div class="mask"><div class="big" id="f1">Conte com a gente</div></div>
  <div class="mask" style="margin-top:20px"><div class="k" id="f2">Suporte e conexões para os membros</div></div></div>
<div id="flash" class="abs"></div>
<script>
const B = {json.dumps(data)}, FIM = {fim:.3f};
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), e5 = x => 1 - Math.pow(1 - x, 5), eo = x => 1 - Math.pow(1 - x, 3);
const $ = id => document.getElementById(id);
function sobe(el, t, t0, t1) {{ const p = e5(cl((t - t0) / .55)), q = eo(cl((t - t1) / .4)); el.style.transform = `translateY(${{((1 - p) * 110 + q * 110).toFixed(1)}}%)`; }}
let atual = -1;
function render(t) {{
  const i = B.findIndex(b => t >= b.a && t < b.b && t < FIM - .2);
  const leg = $("leg");
  if (i !== atual) {{ leg.innerHTML = i < 0 ? "" : B[i].w.map(w => `<span>${{w[0]}}</span>`).join(""); atual = i; }}
  if (i >= 0) {{
    const b = B[i], p = e5(cl((t - b.a) / .18));
    leg.style.transform = `translateY(${{((1 - p) * 30).toFixed(1)}}px) scale(${{(.92 + .08 * p).toFixed(3)}})`; leg.style.opacity = p;
    leg.querySelectorAll("span").forEach((s, k) => s.classList.toggle("on", t >= b.w[k][1] && (k + 1 >= b.w.length || t < b.w[k + 1][1])));
  }}
  // nome na abertura
  const lt = $("lt"), o = cl((t - 1.6) / .3) * (1 - cl((t - 6.4) / .35));
  lt.style.opacity = o; sobe($("ln"), t, 1.7, 6.3);
  $("lc").style.transform = `translateX(${{((1 - e5(cl((t - 2.0) / .5))) * -60).toFixed(1)}}px)`;
  $("lf").style.width = (e5(cl((t - 2.2) / .7)) * 360).toFixed(0) + "px";
  $("leg").style.visibility = (t > 1.6 && t < 6.5) ? "hidden" : "visible";
  // cartela
  $("fim").style.opacity = cl((t - FIM) / .35);
  const ql = e5(cl((t - FIM - .1) / .6));
  $("flogo").style.transform = `scale(${{(0.75 + 0.25 * ql).toFixed(4)}})`; $("flogo").style.opacity = ql;
  $("flin").style.width = (e5(cl((t - FIM - .35) / .7)) * 600).toFixed(0) + "px";
  sobe($("f1"), t, FIM + .45, 999); sobe($("f2"), t, FIM + .8, 999);
}}
window.render = render; render(0);
</script></body></html>'''


def overlay_pilula(cuts, dur):
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{CSS}
#t {{ left:60px; right:60px; top:1330px; }}
</style></head><body>
<div id="vin" class="abs"></div>
<div id="t" class="abs">
  <div class="mask"><div class="k" id="a0" style="color:#fff">Conheça a nossa CS</div></div>
  <div class="mask" style="margin-top:10px"><div class="big" id="a1" style="font-size:150px">Jéssica</div></div>
  <div class="mask"><div class="big" id="a2" style="font-size:150px;color:#9DB2FF">Balcasse</div></div>
</div>
<div id="lt" class="abs" style="top:1450px"><div class="c" id="lc" style="display:inline-flex;align-items:center;gap:14px;background:#2E46C8;padding:12px 26px;border-radius:10px;font-weight:800;font-size:40px">
  <img src="assets/lideres_logo.png" style="height:48px"> CS · Líderes do Brasil</div>
  <div class="mask" style="margin-top:26px"><div class="big" id="b1" style="font-size:96px">Suporte e conexões</div></div>
  <div class="mask"><div class="big" id="b2" style="font-size:96px">para cada membro</div></div></div>
<div id="fim" class="abs"><img id="flogo" src="assets/lideres_logo.png"><div class="linha" id="flin"></div>
  <div class="mask"><div class="k" id="f2">Fortalecendo o movimento</div></div></div>
<div id="flash" class="abs"></div>
<script>
const C = {json.dumps(cuts)}, FIM = {cuts[-1]:.3f};
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), e5 = x => 1 - Math.pow(1 - x, 5), eo = x => 1 - Math.pow(1 - x, 3);
const $ = id => document.getElementById(id);
function sobe(el, t, t0, t1) {{ const p = e5(cl((t - t0) / .5)), q = eo(cl((t - t1) / .35)); el.style.transform = `translateY(${{((1 - p) * 110 + q * 110).toFixed(1)}}%)`; }}
function render(t) {{
  sobe($("a0"), t, .3, C[2] - .35); sobe($("a1"), t, .45, C[2] - .3); sobe($("a2"), t, .6, C[2] - .25);
  const o = cl((t - C[2]) / .25) * (1 - cl((t - FIM + .3) / .3)); $("lt").style.opacity = o;
  $("lc").style.transform = `translateX(${{((1 - e5(cl((t - C[2]) / .5))) * -80).toFixed(1)}}px)`;
  sobe($("b1"), t, C[2] + .25, FIM - .3); sobe($("b2"), t, C[2] + .4, FIM - .3);
  let f = 0; C.slice(1).forEach(c => {{ const q = t - c; if (q >= 0 && q < .16) f = Math.max(f, .3 * (1 - q / .16)); }});
  $("flash").style.opacity = f;
  $("fim").style.opacity = cl((t - FIM + .3) / .3);
  const ql = e5(cl((t - FIM) / .5));
  $("flogo").style.transform = `scale(${{(0.75 + 0.25 * ql).toFixed(4)}})`; $("flogo").style.opacity = ql;
  $("flin").style.width = (e5(cl((t - FIM - .25) / .6)) * 600).toFixed(0) + "px";
  sobe($("f2"), t, FIM + .5, 999);
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
    """Reaproveita o gerador da Sociedade JABS (110 BPM) com outro comprimento e outros cortes."""
    soc.DUR, soc.CUTS = dur, cuts
    soc.N = int(soc.SR * dur)
    return soc.trilha()


def video(preview=False):
    words, base = palavras()
    dur = base + FIMCARD
    if preview:
        captura(overlay_video(words, base), dur, TMP / "prev", [2.5, 9.0, 20.0, 30.0, base + 1.5])
        return
    corta_video(KEEP, ENQ, TMP / "corte.mov")
    captura(overlay_video(words, base), dur, TMP / "ov")
    cuts = [0.0, base, dur]
    grava(TMP / "trilha.wav", trilha(dur + 0.5, [0.0, base]))
    saida = ROOT / "saida" / "jessica_balcasse_cs_lideres.mp4"
    voz = ("highpass=f=90,afftdn=nr=12:nf=-40,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.4:g=3,"
           "acompressor=threshold=-24dB:ratio=3.5:attack=5:release=120:makeup=6,alimiter=limit=0.95")
    fc = (f"color=c=black:s=1080x1920:r=30:d={dur:.3f}[bg];[bg][0:v]overlay=eof_action=repeat[b];[b][1:v]overlay=0:0:format=auto,format=yuv420p[v];"
          f"[0:a]{voz},apad=pad_dur={FIMCARD},asplit=2[v1][v2];"
          f"[2:a]volume=0.16,afade=t=in:d=0.5[m];[m][v1]sidechaincompress=threshold=0.02:ratio=6:release=300[md];"
          f"[md][v2]amix=inputs=2:duration=first:normalize=0,afade=t=out:st={dur - 1.0:.3f}:d=1.0,loudnorm=I=-14:TP=-1.0,atrim=0:{dur:.3f}[a]")
    run("ffmpeg", "-y", "-loglevel", "error", "-i", str(TMP / "corte.mov"), "-framerate", "30", "-i", str(TMP / "ov" / "o_%05d.png"),
        "-i", str(TMP / "trilha.wav"), "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", f"{dur:.3f}", str(saida))
    print("OK ->", saida, round(dur, 2), "s")


def pilula(preview=False):
    B = 60 / 110
    # 4 planos no tempo da música: aberto, fechado, médio, aberto + cartela
    segs = [(1.70, 1.70 + 4 * B), (34.0, 34.0 + 4 * B), (44.2, 44.2 + 4 * B), (12.6, 12.6 + 3 * B)]
    enq = [(1.0, .5, .5), (1.45, .32, .43), (1.2, .4, .46), (1.0, .5, .5)]
    cuts = [0.0]
    for a, b in segs:
        cuts.append(cuts[-1] + b - a)
    dur = cuts[-1] + 3.4 * B
    if preview:
        captura(overlay_pilula(cuts, dur), dur, TMP / "prev", [1.5, 3.5, 6.0, 9.6])
        return
    corta_video(segs, enq, TMP / "pil.mov", voz=False)
    captura(overlay_pilula(cuts, dur), dur, TMP / "ovp")
    grava(TMP / "trilha_p.wav", trilha(dur, cuts[:-1] + [cuts[-1]]))
    saida = ROOT / "saida" / "jessica_pilula_10s.mp4"
    fc = (f"color=c=black:s=1080x1920:r=30:d={dur:.3f}[bg];[bg][0:v]overlay=eof_action=repeat[b];[b][1:v]overlay=0:0:format=auto,format=yuv420p[v];"
          f"[2:a]afade=t=out:st={dur - 0.8:.3f}:d=0.8,loudnorm=I=-14:TP=-1.0,atrim=0:{dur:.3f}[a]")
    run("ffmpeg", "-y", "-loglevel", "error", "-i", str(TMP / "pil.mov"), "-framerate", "30", "-i", str(TMP / "ovp" / "o_%05d.png"),
        "-i", str(TMP / "trilha_p.wav"), "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", f"{dur:.3f}", str(saida))
    print("OK ->", saida, round(dur, 2), "s")


if __name__ == "__main__":
    modo = sys.argv[1] if len(sys.argv) > 1 else "tudo"
    prev = "preview" in sys.argv
    if modo in ("video", "tudo"):
        video(prev)
    if modo in ("pilula", "tudo"):
        pilula(prev)
