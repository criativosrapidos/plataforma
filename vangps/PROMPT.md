# Prompt para construir o VanGPS

> Copie tudo abaixo da linha e cole no outro Claude. Se der, anexe junto a pasta `vangps/` (landing page, logo e `marca.html`) para ele seguir a mesma identidade visual.

---

Você vai construir o **VanGPS** (vangps.com.br), um micro SaaS brasileiro de **rastreamento de van escolar com avisos automáticos no WhatsApp**. Todo o produto, textos e interface são em **português do Brasil**.

## 1. O produto em uma frase
O motorista da van escolar liga o rastreio (pelo celular ou por um rastreador GPS), as famílias conectam na van pelo código, acompanham a van no mapa em tempo real e recebem avisos automáticos: "a van saiu", "chega em 10 minutos", "chega em 5 minutos", "embarcou", "chegou na escola", "saiu da escola", "chegou em casa". O motorista não digita nada.

## 2. Quem usa
- **Motorista / dono da van** (quem paga): cadastra a van, os alunos e a rota, e inicia o rastreio.
- **Família (mãe, pai, avó, babá)** (usa grátis): conecta na van, cadastra o filho e recebe os avisos.
- **Administrador do VanGPS** (nós): painel interno com assinaturas, vans e uso.

## 3. Planos (cobrança por van, até 25 alunos)
| Plano | Mensal | Anual | O que inclui |
|---|---|---|---|
| **Rastreio** | R$ 24,90 | R$ 249 | Mapa ao vivo para as famílias, previsão de chegada (casa e escola), notificações push no app, lista de chamada, "meu filho não vai hoje", chat, histórico de 30 dias |
| **Completo** | R$ 49,90 | R$ 499 | Tudo do Rastreio + **avisos automáticos no WhatsApp** de cada família, comunicados em massa no WhatsApp, cobrança de mensalidades por Pix com lembrete, contrato digital, botão de emergência, histórico de 12 meses, suporte prioritário |

- 14 dias grátis do plano Completo, sem cartão.
- O que é exclusivo do Completo precisa ser bloqueado no código (feature flag por plano), não só escondido na interface.
- Plano Frota (mais de 3 vans ou escolas): só um formulário de contato no MVP.

## 4. Fluxos principais

### Motorista
1. Cria conta com celular + código por SMS/WhatsApp (ou e-mail e senha).
2. Cadastra a van: apelido ("Van do Tio Carlos"), placa, modelo, cor, foto, escola(s) atendida(s) com endereço, turnos (manhã/tarde).
3. O sistema gera um **código único da van** (ex.: `VAN-4K7P`) e um **QR Code** para compartilhar com as famílias.
4. Aprova ou recusa as famílias que pediram para entrar.
5. Monta a ordem das paradas de cada rota (ida e volta), arrastando a lista.
6. Toca em **"Iniciar rota"**: o celular passa a enviar a localização a cada 5–10 segundos (em segundo plano, com a tela apagada). Toca em **"Encerrar rota"** no fim.
7. Durante a rota: lista de chamada com botões "Embarcou" e "Não veio" para cada aluno, e botão de emergência.
8. Comunicado em massa: "Amanhã não tem aula", "Rota atrasada 15 min".
9. Financeiro (Completo): valor da mensalidade por aluno, vencimento, cobrança por Pix, quem pagou e quem não pagou.

### Família
1. Baixa o app (grátis), cria conta com celular.
2. Digita o código da van ou lê o QR Code e cadastra filho(s): nome, foto opcional, escola, turno, endereço de embarque/desembarque e números de WhatsApp que vão receber os avisos.
3. Espera o motorista aprovar.
4. Tela principal: mapa com a van ao vivo **somente durante a rota**, minutos até chegar em casa, status (a caminho / embarcou / na escola / voltando), dados do motorista e da van.
5. Botão "Meu filho não vai hoje" (escolhe ida, volta ou ambos). O motorista recebe na hora e o aluno sai da rota do dia.
6. Convidar outros responsáveis (pai, avó) para o mesmo filho.
7. Chat com o motorista, histórico de trajetos e (no Completo) mensalidade, Pix e contrato.

## 5. Motor de avisos (o coração do produto)
Para cada aluno ativo na rota em andamento, gerar eventos:

| Evento | Gatilho |
|---|---|
| `rota_iniciada` | motorista tocou em "Iniciar rota" |
| `eta_10min` / `eta_5min` | previsão de chegada até o endereço do aluno ≤ 10 / ≤ 5 min (enviar só uma vez por trajeto) |
| `embarcou` / `desembarcou` | motorista marcou na chamada (ou chegada no endereço + saída, como reforço) |
| `chegou_escola` / `saiu_escola` | entrada e saída da cerca virtual (geofence, raio de ~150 m) da escola |
| `chegou_casa` | desembarque no endereço na volta |
| `atraso` | previsão de chegada passou X min do horário habitual |
| `emergencia` | botão de emergência (manda para todas as famílias da van com a localização) |

- **Previsão de chegada:** começar com distância pela rota (Mapbox/Google Directions ou OSRM) ÷ velocidade média recente. Recalcular a cada 30 s. Ter histerese para não mandar "5 min" e voltar a "10 min".
- **Envio:** fila (ex.: BullMQ/Redis ou a fila do Supabase) com idempotência pela chave `(aluno, trajeto, evento)`, para nunca mandar duplicado. Respeitar quem pediu "não vai hoje".
- **Canais:** push (FCM/Expo) em todos os planos e **WhatsApp só no plano Completo**.
- **WhatsApp:** usar a **WhatsApp Cloud API oficial (Meta)** com modelos de mensagem (templates) aprovados, um número da VanGPS. Deixar um adaptador para trocar de provedor (Z-API, Twilio, 360dialog). Registrar status de entrega (enviado/entregue/lido).
- Textos curtos, com o nome da criança e emojis com moderação. Exemplos:
  - "🚐 A van do Tio Carlos saiu para a rota da manhã."
  - "⏱️ Chega em 5 minutos! Já pode descer com a Júlia 🎒"
  - "✅ A Júlia embarcou às 07:03."
  - "🏫 A Júlia chegou no Colégio Aurora às 07:21."
  - "🏠 Saiu da escola. Previsão em casa: 12:40."

## 6. Rastreamento
- **Fonte 1 (MVP):** o app do motorista com localização em segundo plano (Android foreground service com notificação fixa; iOS "always" location). Economizar bateria: envio a cada 5–10 s em movimento, a cada 30 s parado.
- **Fonte 2 (depois):** rastreador GPS fixo (protocolos GT06/Teltonika) chegando por um serviço TCP. Desenhar a tabela de posições para aceitar as duas fontes desde já (`source: app | tracker`).
- Tempo real para as famílias via WebSocket / Supabase Realtime.
- **Privacidade (LGPD):** a localização só fica visível para famílias aprovadas e só durante a rota ativa. Apagar posições brutas depois de 30 dias (Rastreio) ou 12 meses (Completo). Termos de uso e política de privacidade. Consentimento do responsável para dados de menores.

## 7. Pagamentos
- **Assinatura do motorista:** Asaas, Stripe ou Mercado Pago (Pix + cartão, recorrente). Webhook atualiza o status do plano. Se a assinatura vencer, bloquear o WhatsApp e mostrar um aviso, sem apagar dados.
- **Mensalidade dos alunos (Completo):** gerar cobrança Pix por aluno/mês via Asaas (subconta ou split para o motorista), lembrete automático no WhatsApp 3 dias antes e no vencimento, e marcação automática de pago.

## 8. Stack sugerida (pode ajustar se tiver motivo)
- **Apps:** React Native + Expo (um app com dois modos, Motorista e Família, ou dois apps). Mapas: `react-native-maps` ou Mapbox.
- **Backend:** Supabase (Postgres + PostGIS, Auth por telefone, Realtime, Storage, Edge Functions) **ou** Node/NestJS + Postgres/PostGIS + Redis.
- **Web:** Next.js para a landing page (já existe em HTML na pasta `vangps/`, converter), o painel web do motorista (cadastros e financeiro são mais fáceis no computador) e o painel admin.
- **Infra:** Vercel (web) + Supabase/Render/Fly (backend e workers).

## 9. Modelo de dados (mínimo)
`usuarios`, `motoristas`, `vans` (codigo, placa, plano, status_assinatura), `escolas` (endereco, geofence), `alunos`, `responsaveis` (whatsapp, push_token), `vinculos_aluno_responsavel`, `rotas` (turno, sentido ida/volta), `paradas_rota` (ordem, aluno), `trajetos` (instância de rota num dia: inicio, fim), `posicoes` (trajeto, lat, lng, velocidade, source, ts — indexar e particionar por data), `eventos` (trajeto, aluno, tipo, ts), `notificacoes` (evento, canal, status, provider_id), `ausencias`, `mensagens_chat`, `assinaturas`, `cobrancas_mensalidade`, `contratos`.

## 10. Identidade visual (seguir à risca)
- **Nome:** VanGPS. Wordmark "van" em azul-noite + "GPS" em amarelo-escuro.
- **Símbolo:** van amigável em azul-noite sobre quadrado amarelo arredondado, com ponto verde de localização no canto (arquivos em `vangps/assets/`).
- **Cores:** Amarelo Escolar `#FFC21A` (principal), Amarelo Escuro `#E8A400`, Azul Noite `#0E1B3D` (texto), Verde Ao Vivo `#1FB46A` (status, WhatsApp, sucesso), Coral Alerta `#FF6B57` (atraso, emergência), Creme `#FFFBF2` (fundo). Ter modo escuro.
- **Fontes:** Fredoka (títulos) e Nunito (texto), do Google Fonts.
- **Estilo:** arredondado (raio 16–28 px), botões em pílula, botão principal amarelo com "sombra sólida" amarelo-escura, ícones de traço arredondado.
- **Tom de voz:** próximo, curto e tranquilizador. Sempre usar o nome da criança. Nunca termos técnicos para a família ("geofence", "ETA").

## 11. Ordem de entrega (MVP primeiro)
1. **Semana 1–2:** auth por telefone, cadastro de van/escola/alunos, código e QR, aprovação de famílias.
2. **Semana 3–4:** app do motorista com "Iniciar rota" + envio de localização em segundo plano, e mapa ao vivo no app da família.
3. **Semana 5:** motor de avisos com push, lista de chamada e "não vai hoje".
4. **Semana 6:** WhatsApp Cloud API + templates, bloqueio por plano.
5. **Semana 7:** assinatura (Rastreio R$ 24,90 / Completo R$ 49,90) com teste de 14 dias.
6. **Depois:** mensalidades por Pix, contrato digital, comunicados em massa, emergência, painel Frota, rastreador GPS fixo.

## 12. Critérios de pronto
- Simular uma rota (script que injeta posições de um GPX) e ver os avisos saírem na ordem certa, sem duplicar.
- Família não aprovada não vê nada. Ninguém vê localização fora da rota.
- Plano Rastreio nunca dispara WhatsApp.
- App do motorista roda 4 horas com a tela apagada sem parar de enviar a localização.
- Testes automatizados no motor de avisos (previsão de chegada, geofence, idempotência).

Comece me mostrando a arquitetura e o plano de pastas, depois implemente na ordem do item 11, com commits pequenos.
