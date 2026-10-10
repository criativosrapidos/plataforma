import sys, math; sys.path.insert(0,'/home/user/plataforma/jabs')
import jabs_art as J
from PIL import Image, ImageDraw
K=4
W_=(255,255,255)
def column(d, cx, top, h, w, c):
    pts=[]
    n=40
    for i in range(n+1):
        y=i/n; pts.append((cx-0.5*w*(1-y)**2.6, top+y*h))
    for i in range(n,-1,-1):
        y=i/n; pts.append((cx+0.5*w*(1-y)**2.6, top+y*h))
    d.polygon(pts, fill=c)
def alvorada(size, color=W_, circle=False):
    s=size*K; img=Image.new('RGBA',(s,s),(0,0,0,0)); d=ImageDraw.Draw(img); c=color+(255,)
    lw=max(2,int(s*.010))
    x0,x1=s*.12,s*.88; slab=s*.24; base=s*.74
    d.rectangle((x0, slab-lw*1.6, x1, slab), fill=c)               # laje
    n_=4; cw=(x1-x0)/n_
    for i in range(n_):
        column(d, x0+cw*(i+.5), slab, base-slab, cw*0.96, c)
    d.line((s*.06, base, s*.94, base), fill=c, width=lw)            # espelho d'água
    d.line((s*.20, base+s*.04, s*.80, base+s*.04), fill=color+(120,), width=max(1,lw//2))
    if circle:
        d.ellipse((s*.02,s*.02,s*.98,s*.98), outline=c, width=lw)
    return img.resize((size,size), Image.LANCZOS)
def congresso(size, color=W_):
    s=size*K; img=Image.new('RGBA',(s,s),(0,0,0,0)); d=ImageDraw.Draw(img); c=color+(255,)
    lw=max(2,int(s*.010)); base=s*.74
    d.rectangle((s*.45,s*.14,s*.49,base), fill=c); d.rectangle((s*.51,s*.14,s*.55,base), fill=c)
    d.rectangle((s*.45,s*.36,s*.55,s*.38), fill=c)
    d.rectangle((s*.12,base-s*.10,s*.88,base-s*.085), fill=c)
    d.chord((s*.17,base-s*.20,s*.37,base-s*.06),180,360,fill=c)   # cúpula (Senado)
    d.chord((s*.61,base-s*.25,s*.85,base-s*.03),0,180,fill=c)     # cuia (Câmara)
    d.line((s*.06,base,s*.94,base),fill=c,width=lw)
    return img.resize((size,size), Image.LANCZOS)
bg=Image.new('RGBA',(1800,860),(10,10,11,255)); d=ImageDraw.Draw(bg)
labels=[("A","Colunas do Alvorada"),("B","Alvorada em selo"),("C","Congresso Nacional")]
opts=[alvorada(420), alvorada(420,circle=True), congresso(420)]
for i,o in enumerate(opts):
    x=60+i*580
    bg.alpha_composite(o,(x+40,60))
    wm=J.wordmark(420); bg.alpha_composite(wm,(x+40,500))
    d.text((x+250,720),labels[i][0],fill=(235,235,235),anchor='mm',font=J.font('cinzel',40))
    d.text((x+250,775),labels[i][1].upper(),fill=(150,150,150),anchor='mm',font=J.font('mont4',20))
bg.convert('RGB').save('/home/user/plataforma/jabs/saida/logo/opcoes_simbolo_brasilia.png')
