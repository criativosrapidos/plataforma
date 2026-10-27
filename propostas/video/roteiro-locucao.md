# Locução do vídeo

O `video-criativos-rapidos.mp4` já tem a locução (`locucao.mp3`, voz "Enzo" do ElevenLabs), e as cenas estão sincronizadas com a fala.

Texto da locução:

> Oi! Sabe aquele Instagram parado, que não traz cliente nenhum? A gente resolve isso.
> A Criativos Rápidos entrega tudo que uma agência entrega: copywriter, designer, social media, editor de vídeo e locutor.
> Monte seu pacote como num buffet: stories, posts, carrosséis, reels e anúncios. Você escolhe o que quer.
> Pacotes a partir de noventa e sete reais, sem mensalidade. E você recebe tudo em vinte e quatro horas.
> Quer postar todo dia? Nos planos mensais são de trinta a setenta conteúdos por mês, a partir de quinhentos e noventa e sete reais.
> E sem fidelidade: você fica porque gosta.
> É simples: escolhe, responde o briefing e recebe.
> Responde essa mensagem e bora começar!

Para refazer o vídeo depois de editar `cenas.html`: renderize os quadros com o Chromium/Playwright chamando `render(t)` a 30 fps, junte com o ffmpeg e adicione `locucao.mp3` com 0,2 s de atraso.
