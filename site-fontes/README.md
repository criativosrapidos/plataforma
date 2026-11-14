# Fontes das imagens e vídeos de exemplo do site

Tudo aqui usa **marcas fictícias** (Brasa Burger, Lis Moda e Lume Estética), só para mostrar como fica o trabalho.

| Arquivo | Gera |
|---|---|
| `demo/artes.html` + `demo/burger.svg.html` | Post, carrossel, stories, anúncio e avatar da Brasa Burger em `site/assets/demo/` |
| `videos/exemplo-hamburgueria.html` | `site/assets/videos/exemplo-hamburgueria.mp4` (+ capa .jpg) |
| `videos/exemplo-moda.html` | `site/assets/videos/exemplo-moda.mp4` |
| `videos/exemplo-estetica.html` | `site/assets/videos/exemplo-estetica.mp4` |

Comandos (precisam do Playwright com Chromium e do ffmpeg):

```bash
node site-fontes/gerar.js artes                      # artes JPG
node site-fontes/gerar.js icones                     # ícones do app
node site-fontes/gerar.js video exemplo-moda         # um vídeo
node site-fontes/gerar.js previa exemplo-moda 2 6 10 # quadros soltos em site-fontes/previas/
```

Os prints do app que aparecem na home (`site/assets/img/app-*.jpg`) são tirados do próprio app em modo demonstração.
