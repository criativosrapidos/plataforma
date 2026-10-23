# Como colocar uma entrega no site da Criativos Rápidos

Cada pasta aqui dentro (ex.: `jl-fitness/`) é uma página de entrega completa e independente:
`index.html` + as imagens/vídeos (`p/`, `id/`, `lp/`) + `jszip.min.js`.

1. Suba a pasta inteira para o servidor do site, dentro de `entregas/`
   (ex.: cPanel → Gerenciador de Arquivos → public_html/entregas/ → enviar o zip e extrair).
2. Endereço para mandar ao cliente: https://criativosrapidos.com.br/entregas/jl-fitness/
3. Pronto: o cliente vê agenda, artes, vídeos (tocam na página), legendas, landing page e identidade.
   Os botões "Baixar" e "Baixar tudo" baixam direto para a pasta Downloads, sem perguntar onde salvar
   (só pergunta se o navegador dele estiver configurado para perguntar sempre).

A página tem `noindex`: não aparece no Google; só quem tem o link acessa.
Dica: para o link ficar difícil de adivinhar, renomeie a pasta (ex.: `jl-fitness-8k3q/`).
