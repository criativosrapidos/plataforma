#!/usr/bin/env python3
"""Pílula 'Sociedade do Líder' (encontro 20/10, 17h): 4 takes verticais cortados no tempo da trilha (110 BPM),
cor tratada, push-in suave, camada de textos (HTML transparente) e trilha gerada aqui. Sem narração.
Uso: python3 edita.py [preview]"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
BPM = 110
B = 60 / BPM
# (take, início no bruto, duração em tempos)
SEG = [("take2", 0.10, 14), ("take1", 1.20, 12), ("take3", 0.50, 12), ("take4", 0.30, 12)]
FIM_BEATS = 7                                       # cartela final
CUTS = [0.0]
for _, _, nb in SEG:
    CUTS.append(CUTS[-1] + nb * B)
DUR = CUTS[-1] + FIM_BEATS * B
SR = 44100
N = int(SR * DUR)
rng = np.random.default_rng(11)


def run(*a):
    subprocess.run(a, check=True)


# ---------------------------------------------------------------- trilha
def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def put(buf, x, t0, g=1.0):
    i = int(t0 * SR)
    j = min(len(buf), i + len(x))
    if 0 <= i < len(buf):
        buf[i:j] += g * x[: j - i]


def kick():
    n = int(SR * 0.4); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(48 + 120 * np.exp(-t / 0.035)) / SR) * env(n, 0.002, 0.14)


def clap():
    n = int(SR * 0.25); x = rng.standard_normal(n)
    x = np.convolve(x, [1, -0.6], "same")
    e = sum(env(n, 0.001, 0.012) * (np.arange(n) >= int(SR * d)) for d in (0, 0.011, 0.022)) + env(n, 0.001, 0.09)
    return x * e * 0.22


def hat(r=0.02):
    n = int(SR * 0.08); x = np.diff(rng.standard_normal(n), prepend=0)
    return x * env(n, 0.001, r) * 0.18


def pluck(f, d=0.45):
    """Karplus-Strong: dedilhado brilhante."""
    n = int(SR * d); p = int(SR / f)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * 0.32


def pad(freqs, d):
    n = int(SR * d); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * 0.3 * t + k)) + 0.3 * np.sin(4 * np.pi * f * t)
            for k, f in enumerate(freqs))
    return x * np.minimum(1, t / 0.6) * np.minimum(1, np.maximum(0, d - t) / 0.6) * 0.045


def baixo(f, d):
    n = int(SR * d); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)
    return x * env(n, 0.006, d * 0.7) * 0.32


def impacto():
    n = int(SR * 1.4); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(36 + 60 * np.exp(-t / 0.09)) / SR) * np.exp(-t / 0.55)
    ns = np.convolve(rng.standard_normal(n), np.ones(20) / 20, "same") * np.exp(-t / 0.25) * 0.4
    return boom + ns


def riser(d):
    n = int(SR * d); t = np.arange(n) / SR
    x = np.convolve(rng.standard_normal(n), np.ones(8) / 8, "same")
    return x * (t / d) ** 2.5 * 0.35


def trilha():
    m = np.zeros(N)
    # Bbmaj7 - Gm7 - Ebmaj7 - F  (inspirador, corporativo)
    acordes = [[233.1, 293.7, 349.2, 440.0], [196.0, 233.1, 293.7, 349.2], [155.6, 196.0, 233.1, 293.7], [174.6, 220.0, 261.6, 349.2]]
    raiz = [58.27, 49.0, 77.78, 87.31]
    arp = [[466.2, 587.3, 698.5, 880.0], [392.0, 466.2, 587.3, 698.5], [311.1, 392.0, 466.2, 587.3], [349.2, 440.0, 523.3, 698.5]]
    fim = CUTS[-1]
    bar = 4 * B
    k = 0
    while k * bar < DUR:
        put(m, pad(acordes[k % 4], bar + 0.6), k * bar)
        k += 1
    beat = 0
    while beat * B < DUR + 1:
        t = beat * B
        bar_i = int(t // bar) % 4
        cheio = CUTS[1] - 0.01 <= t < fim
        if t < fim:
            if cheio or beat % 2 == 0:
                put(m, kick(), t, 0.95 if cheio else 0.6)
            if cheio and beat % 4 in (1, 3):
                put(m, clap(), t)
            put(m, hat(), t + B / 2, 1.0 if cheio else 0.6)
            if cheio:
                put(m, hat(0.01), t + B / 4, 0.5); put(m, hat(0.01), t + 3 * B / 4, 0.5)
                put(m, baixo(raiz[bar_i], B * 0.45), t + B / 2)
            for s in range(2):                       # arpejo em colcheias
                nota = arp[bar_i][(beat * 2 + s) % 4]
                put(m, pluck(nota), t + s * B / 2, 0.55 if cheio else 0.4)
        beat += 1
    for c in CUTS[1:-1]:
        put(m, riser(B * 2), c - B * 2)
        put(m, impacto(), c, 0.5)
    put(m, riser(B * 3), fim - B * 3, 1.3)
    put(m, impacto(), fim, 1.1)
    put(m, impacto(), 0.02, 0.7)
    for i, f in enumerate(arp[0] + [1174.7]):         # brilho final
        put(m, pluck(f, 1.2), fim + 0.05 + i * 0.09, 0.5)
    return m


def grava(nome, x):
    x = np.clip(x / np.abs(x).max() * 0.9, -1, 1)
    with wave.open(str(nome), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


# ---------------------------------------------------------------- camada de textos
def overlay_html():
    c = CUTS
    palavras = [("Estratégia", c[1]), ("Conexões", c[2]), ("Crescimento", c[3])]
    chips = "".join(f'<div class="lt" data-in="{t + 0.5:.3f}" data-out="{t + 4.6:.3f}"><div class="kick">Sociedade do Líder</div>'
                    f'<div class="pal">{p}</div><div class="fio"></div></div>' for p, t in palavras)
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: Anton; src: url(fonts/anton-latin-400-normal.woff); }}
@font-face {{ font-family: M; font-weight: 600; src: url(fonts/montserrat-latin-600-normal.woff); }}
@font-face {{ font-family: M; font-weight: 800; src: url(fonts/montserrat-latin-800-normal.woff); }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:1080px; height:1920px; background:transparent; overflow:hidden; font-family:M; color:#fff; }}
.abs {{ position:absolute; }}
#vin {{ inset:0; background:radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.55) 100%); }}
#grad {{ left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, transparent, rgba(0,0,0,.82)); }}
#tit {{ left:70px; right:70px; top:1210px; }}
.k {{ font-weight:600; letter-spacing:.42em; font-size:30px; color:#D9C38A; text-transform:uppercase; }}
.big {{ font-family:Anton; font-size:150px; line-height:.95; text-transform:uppercase; text-shadow:0 6px 30px rgba(0,0,0,.5); }}
.ouro {{ background:linear-gradient(180deg,#FFF1C4,#E7C06A 45%,#B08333 80%,#F0CF7E); -webkit-background-clip:text; background-clip:text; color:transparent; padding:.08em .03em; margin:-.08em -.03em; }}
.mask {{ overflow:hidden; padding:.24em 0 .08em; margin:-.24em 0 -.08em; }}
.mask > div {{ will-change:transform; }}
.data {{ display:inline-flex; gap:18px; align-items:center; margin-top:26px; padding:14px 30px; border:2px solid rgba(226,182,92,.8); border-radius:60px;
        background:rgba(10,8,5,.55); font-weight:800; font-size:38px; letter-spacing:.06em; }}
.data i {{ width:2px; height:34px; background:#E2B65C; }}
.lt {{ position:absolute; left:70px; top:1500px; opacity:0; }}
.lt .kick {{ font-weight:600; letter-spacing:.38em; font-size:26px; color:#D9C38A; text-transform:uppercase; }}
.lt .pal {{ font-family:Anton; font-size:118px; text-transform:uppercase; line-height:1; margin-top:8px; text-shadow:0 6px 26px rgba(0,0,0,.6); }}
.lt .fio {{ height:6px; width:0; margin-top:14px; background:linear-gradient(90deg,#E2B65C,#F7DC98); border-radius:3px; }}
#bug {{ right:46px; top:60px; font-weight:800; font-size:24px; letter-spacing:.3em; color:rgba(255,255,255,.85); text-transform:uppercase;
        padding:10px 20px; border:1.5px solid rgba(255,255,255,.45); border-radius:40px; background:rgba(0,0,0,.25); opacity:0; }}
#flash {{ inset:0; background:#fff; opacity:0; }}
#fim {{ inset:0; opacity:0; background:radial-gradient(ellipse at 50% 40%, #1d2a5c 0%, #0b1030 55%, #05060f 100%);
        display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }}
#fim img {{ width:640px; }}
#fim .linha {{ width:0; height:4px; background:linear-gradient(90deg,transparent,#E2B65C,transparent); margin:44px auto 40px; }}
</style></head><body>
<div id="vin" class="abs"></div><div id="grad" class="abs"></div>
<div id="tit" class="abs">
  <div class="mask"><div class="k" id="t0">Líderes do Brasil apresenta</div></div>
  <div class="mask" style="margin-top:14px"><div class="big" id="t1">Sociedade</div></div>
  <div class="mask"><div class="big ouro" id="t2">do Líder</div></div>
  <div class="data" id="t3">ENCONTRO <i></i> 20/10 <i></i> 17H</div>
</div>
{chips}
<div id="bug" class="abs">Sociedade do Líder</div>
<div id="fim" class="abs">
  <img id="flogo" src="assets/lideres_logo.png">
  <div class="linha" id="flin"></div>
  <div class="mask"><div class="big" id="f1" style="font-size:124px">Sociedade do Líder</div></div>
  <div class="mask" style="margin-top:22px"><div class="k" id="f2" style="font-size:32px;letter-spacing:.32em;color:#F2E6C4">Fortalecendo o movimento</div></div>
</div>
<div id="flash" class="abs"></div>
<script>
const C = {json.dumps(CUTS)}, FIMV = {CUTS[-1]:.4f};
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3), e5 = x => 1 - Math.pow(1 - x, 5);
const io = (t, a, b, d = .35) => cl((t - a) / d) * (1 - cl((t - b) / d));
const $ = id => document.getElementById(id);
function sobe(el, t, t0, t1) {{                        // entra subindo pela máscara, sai descendo
  const pin = e5(cl((t - t0) / .55)), pout = eo(cl((t - t1) / .4));
  el.style.transform = `translateY(${{((1 - pin) * 110 + pout * 110).toFixed(1)}}%)`;
}}
function render(t) {{
  // abertura
  sobe($("t0"), t, .5, 5.6); sobe($("t1"), t, .7, 5.7); sobe($("t2"), t, .9, 5.8);
  const d = io(t, 1.4, 5.8, .4); $("t3").style.opacity = d; $("t3").style.transform = `translateY(${{((1 - eo(cl((t - 1.4) / .4))) * 30).toFixed(1)}}px)`;
  $("grad").style.opacity = (0.55 + 0.45 * io(t, 0, 6.0, .6)).toFixed(3);
  // palavras de cada take
  document.querySelectorAll(".lt").forEach(l => {{
    const a = +l.dataset.in, b = +l.dataset.out, o = io(t, a, b, .3);
    l.style.opacity = o.toFixed(3);
    l.style.transform = `translateX(${{((1 - e5(cl((t - a) / .5))) * -80 - eo(cl((t - b) / .3)) * 40).toFixed(1)}}px)`;
    l.querySelector(".fio").style.width = (e5(cl((t - a - .2) / .7)) * 300).toFixed(0) + "px";
  }});
  $("bug").style.opacity = (0.9 * io(t, C[1] + .2, FIMV - .6, .4)).toFixed(3);
  // flash nos cortes
  let f = 0; C.slice(1).forEach(c => {{ const q = t - c; if (q >= 0 && q < .18) f = Math.max(f, .32 * (1 - q / .18)); }});
  $("flash").style.opacity = f.toFixed(3);
  // cartela final
  const pf = cl((t - (FIMV - .35)) / .35);
  $("fim").style.opacity = pf.toFixed(3);
  const ql = e5(cl((t - FIMV - .05) / .6));
  $("flogo").style.transform = `scale(${{(0.7 + 0.3 * ql + 0.03 * cl((t - FIMV) / 4)).toFixed(4)}})`; $("flogo").style.opacity = ql.toFixed(3);
  $("flin").style.width = (e5(cl((t - FIMV - .35) / .7)) * 600).toFixed(0) + "px";
  sobe($("f1"), t, FIMV + .45, 999); sobe($("f2"), t, FIMV + .8, 999);
}}
window.render = render; render(0);
</script></body></html>'''


# ---------------------------------------------------------------- vídeo
def clipes():
    tmp = ROOT / "tmp"; tmp.mkdir(exist_ok=True)
    lista = []
    for i, (tk, ini, nb) in enumerate(SEG):
        d = nb * B
        ult = i == len(SEG) - 1
        extra = FIM_BEATS * B if ult else 0
        z0, z1 = (1.02, 1.10) if i % 2 == 0 else (1.10, 1.03)   # alterna aproxima / afasta
        vf = (f"scale=w='trunc(1080*({z0}+({z1}-{z0})*min(t/{d:.3f},1))/2)*2':h=-2:eval=frame:flags=lanczos,"
              f"crop=1080:1920,unsharp=5:5:0.6,eq=contrast=1.08:saturation=1.15:gamma=0.98,"
              f"colorbalance=rs=0.03:bs=-0.02:rh=0.02:bh=-0.03,setsar=1,fps=30")
        if ult:
            vf += f",tpad=stop_mode=clone:stop_duration={extra:.3f}"
        out = tmp / f"s{i}.mp4"
        run("ffmpeg", "-y", "-loglevel", "error", "-ss", f"{ini}", "-t", f"{d:.4f}", "-i", str(ROOT / "brutos" / f"{tk}.mov"),
            "-an", "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", str(out))
        lista.append(out)
    (tmp / "lista.txt").write_text("".join(f"file '{p}'\n" for p in lista))
    run("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(tmp / "lista.txt"), "-c", "copy", str(tmp / "base.mp4"))
    return tmp / "base.mp4"


if __name__ == "__main__":
    (ROOT / "overlay.html").write_text(overlay_html())
    print("cortes:", [round(x, 2) for x in CUTS], "duração", round(DUR, 2))
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        sys.exit()
    base = clipes()
    od = ROOT / "tmp" / "ov"; od.mkdir(exist_ok=True)
    for p in od.glob("*.png"):
        p.unlink()
    run("node", str(ROOT / "captura_alpha.js"), "30", f"{DUR:.3f}", str(od))
    (ROOT / "audio").mkdir(exist_ok=True)
    grava(ROOT / "audio" / "trilha.wav", trilha())
    saida = ROOT / "saida" / "sociedade_do_lider_pilula.mp4"
    run("ffmpeg", "-y", "-loglevel", "error", "-i", str(base), "-framerate", "30", "-i", str(od / "o_%05d.png"),
        "-i", str(ROOT / "audio" / "trilha.wav"),
        "-filter_complex", f"[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v];"
                           f"[2:a]afade=t=in:d=0.3,afade=t=out:st={DUR - 1.2:.3f}:d=1.2,loudnorm=I=-14:TP=-1.0,atrim=0:{DUR:.3f}[a]",
        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart", "-t", f"{DUR:.3f}", str(saida))
    print("OK ->", saida)
