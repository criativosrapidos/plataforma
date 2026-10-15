# Como colocar o site no ar

A pasta `site/` é o site inteiro: um `index.html` e a pasta `midia/`. Não precisa de servidor nem de banco de dados.

## Antes de subir (2 minutos)
1. Abra `index.html` num editor de texto, procure `var WHATSAPP = "";` e coloque o número com DDI e DDD, só números.
   Exemplo: `var WHATSAPP = "5561999998888";`
   Assim o botão "Enviar pedido no WhatsApp" abre a conversa com o pedido já escrito.
2. (Opcional) Cole o código do **Meta Pixel** onde está o comentário `<!-- Meta Pixel ... -->`. O botão já dispara o evento `Lead`.
3. Depois de publicar, troque `content="midia/og-image.jpg"` pelo endereço completo, por exemplo `https://videosmimo.com.br/midia/og-image.jpg`. Assim a imagem aparece quando o link é compartilhado no WhatsApp.

## Opção 1 · Netlify (grátis, mais fácil)
1. Entre em app.netlify.com › **Add new site › Deploy manually**.
2. Arraste a pasta `site` para a página. Em segundos o site está no ar num endereço `.netlify.app`.
3. **Domain management › Add a domain** e siga as instruções para apontar o domínio que vocês compraram (Registro.br, Hostinger etc.).

## Opção 2 · Hospedagem com cPanel / Hostinger
1. Abra o **Gerenciador de Arquivos** › pasta `public_html`.
2. Envie o `index.html` e a pasta `midia` inteira.

## Opção 3 · Vercel
`vercel deploy site/` ou arraste a pasta em vercel.com/new.

## Depois do pagamento
Quando escolherem a forma de pagamento (Pix, Mercado Pago, link de pagamento), é só trocar o botão do pedido pelo link de pagamento, ou mandar o link pelo WhatsApp depois de receber o pedido.
