# Vídeos Mimo

Vídeo-presente com fotos, legendas, mensagem e música original. Produto da Criativos Rápidos
para o público geral: aniversário, namorados, Dia das Mães/Pais, casamento, Natal.

- `index.html` — página de vendas (preços + montador de pedido para WhatsApp)
- `marca/` — identidade visual (`IDENTIDADE.md`, logo e símbolo em SVG)
- `gerador/` — scripts que fazem o vídeo e a música
- `exemplo/` — vídeo de demonstração e as 3 trilhas
- `divulgacao/` — vídeo de divulgação do Dia dos Namorados (`python3 gerador/promo_namorados.py`)

## Como fazer o vídeo de um cliente

Requer Python 3 com `numpy` e `Pillow`, e `ffmpeg`.

```bash
# 1. trilha original (romantico | emocionante | festa), na duração do vídeo
python3 gerador/musica.py trilha.wav --estilo romantico --duracao 60

# 2. fotos do cliente numa pasta; legendas opcionais em legendas.txt (uma por linha, na ordem dos arquivos)
python3 gerador/video.py --fotos pedido_ana/ --para "Ana" --de "João" --ocasiao aniversario \
  --mensagem "Obrigado por transformar cada dia comum em uma lembrança bonita." \
  --musica trilha.wav --duracao 60 --saida ana.mp4
```

Ocasiões: `aniversario`, `namorados`, `maes`, `pais`, `casamento`, `presente`, `natal`
(ou qualquer texto, que vira a frase de abertura). Um vídeo de 1 minuto leva cerca de 2 minutos para renderizar.

## Vídeo de divulgação dos mimos (com narração)
`divulgacao/promo-mimos.mp4` — 38 s, vertical, voz feminina (ElevenLabs, voz "Ana Alice").
Mostra o site, os 3 mimos com preços, o pedido sendo preenchido e o vídeo pronto.

```bash
PW=$(npm root -g)/playwright node gerador/capturar_site.js /caminho/telas   # captura o site
python3 gerador/musica.py trilha38.wav --estilo festa --duracao 38
cd gerador && python3 promo_mimos.py --telas /caminho/telas --demo ../exemplo/videomimo-demo.mp4 \
  --voz ../divulgacao/narracao-mimos.mp3 --musica ../trilha38.wav --saida ../divulgacao/promo-mimos.mp4
```
