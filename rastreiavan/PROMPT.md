# Prompt para construir o Rastreia Van

> Copie tudo abaixo da linha e cole no outro Claude. Anexe junto a pasta `rastreiavan/` (site, logo, `marca.html`) para ele seguir a mesma identidade visual.

---

Você vai construir o **Rastreia Van** (rastreiavan.com.br), um micro SaaS brasileiro de **rastreamento de van escolar com notificações automáticas no celular** (push). Todo o produto, textos e interface em **português do Brasil**.

## 1. O produto em uma frase
O motorista da van escolar toca em "Iniciar rota" no app. As famílias conectam na van pelo código, acompanham a van no mapa em tempo real e recebem **notificações push** (o pop-up que aparece na tela do celular, inclusive bloqueado): "a van saiu", "chega em 10 minutos", "chega em 5 minutos", "embarcou", "chegou na escola", "saiu da escola", "chegou em casa". O motorista não digita nada.

**Não usar WhatsApp nesta versão.** Os avisos são só por notificação push (e, no máximo, um e-mail de recuperação de conta).

## 2. Quem usa
- **Motorista / dono da van** (quem paga): cadastra a van, os alunos e a rota, e inicia o rastreio.
- **Família (mãe, pai, avó, babá)** (usa grátis): conecta na van, cadastra o filho e recebe as notificações.
- **Administrador do Rastreia Van** (nós): painel interno com assinaturas, vans e uso.

## 3. Planos (cobrança por van, até 25 alunos)
| Plano | Mensal | Anual | O que inclui |
|---|---|---|---|
| **Essencial** | R$ 14,90 | R$ 149 | Mapa ao vivo para as famílias, previsão de chegada (casa e escola), notificações principais (**a van saiu**, **chega em 5 min**, **chegou na escola**), código e QR Code da van, histórico de 7 dias |
| **Completo** | R$ 29,90 | R$ 299 | Tudo do Essencial + **todas** as notificações (chega em 10 e 5 min, embarcou, desembarcou, saiu da escola, chegou em casa, atraso), lista de chamada, "meu filho não vai hoje", chat motorista ↔ família, recado em massa (push para todas as famílias), vários responsáveis por aluno, cobrança de mensalidades por Pix, botão de emergência, histórico de 12 meses |

- 14 dias grátis do plano Completo, sem cartão.
- Bloquear os recursos por plano **no backend** (feature flags), não só esconder na interface.
- Plano Frota (mais de 3 vans ou escolas): no MVP, só um formulário de contato.

## 4. Fluxos principais

### Motorista
1. Cria conta (celular + código por SMS, ou e-mail e senha).
2. Cadastra a van: apelido ("Van do Tio Carlos"), placa, modelo, cor, foto, escola(s) com endereço e turnos.
3. O sistema gera um **código único da van** (ex.: `VAN4K7`) e um **QR Code** para enviar às famílias.
4. Aprova ou recusa as famílias que pediram para entrar.
5. (Completo) Monta a ordem das paradas da ida e da volta.
6. Toca em **"Iniciar rota"**: o celular envia a localização a cada 5–10 s em segundo plano, com a tela apagada. Toca em **"Encerrar rota"** no fim.
7. (Completo) Durante a rota: lista de chamada com "Embarcou" e "Não veio", e botão de emergência.
8. (Completo) Recado em massa: "Amanhã não tem aula", "Rota atrasada 15 min".
9. (Completo) Financeiro: mensalidade por aluno, vencimento, cobrança Pix, quem pagou e quem não pagou.

### Família
1. Baixa o app (grátis) e cria conta. **Pedir permissão de notificação logo no cadastro**, explicando o porquê ("para avisar quando a van estiver chegando").
2. Digita o código da van ou lê o QR Code. Cadastra filho(s): nome, escola, turno, endereço de embarque/desembarque.
3. Espera o motorista aprovar.
4. Tela principal: mapa com a van ao vivo **só durante a rota**, minutos até chegar, status (a caminho / embarcou / na escola / voltando), dados do motorista e da van.
5. (Completo) "Meu filho não vai hoje" (ida, volta ou ambos), convidar outros responsáveis, chat, mensalidade e Pix.
6. Configurar quais avisos quer receber (ex.: desligar o "10 minutos").

## 5. Motor de notificações (o coração do produto)
Para cada aluno ativo na rota em andamento, gerar eventos:

| Evento | Gatilho | Plano |
|---|---|---|
| `rota_iniciada` | motorista tocou em "Iniciar rota" | Essencial |
| `eta_5min` | previsão até o endereço do aluno ≤ 5 min | Essencial |
| `chegou_escola` | entrada na cerca virtual da escola (raio ~150 m) | Essencial |
| `eta_10min` | previsão ≤ 10 min | Completo |
| `embarcou` / `desembarcou` | marcado na chamada | Completo |
| `saiu_escola` | saída da cerca virtual da escola | Completo |
| `chegou_casa` | desembarque no endereço na volta | Completo |
| `atraso` | previsão passou X min do horário habitual | Completo |
| `emergencia` | botão de emergência (todas as famílias, com localização) | Completo |
| `recado` | recado em massa do motorista | Completo |

- **Previsão de chegada:** distância pela rota (OSRM, Mapbox ou Google Directions) ÷ velocidade média recente, recalculada a cada 30 s, com histerese para não mandar "5 min" e depois "10 min".
- **Fila com idempotência** pela chave `(aluno, trajeto, evento)`: nunca enviar duplicado. Respeitar "não vai hoje" e as preferências da família.
- **Push:** Expo Push Notifications (que usa FCM no Android e APNs no iOS). Notificação com título e texto curtos, som padrão, prioridade alta, e ao tocar abre o mapa da van. Guardar status de envio e tirar tokens inválidos.
- **Reserva:** se a família está com o app aberto, mostrar o aviso também dentro do app (banner).
- Textos curtos, com o nome da criança:
  - Título "🚐 A van saiu!" / texto "O Tio Carlos começou a rota da manhã."
  - Título "⏱️ Chega em 5 minutos" / texto "Já pode descer com a Júlia 🎒"
  - Título "✅ Embarcou" / texto "A Júlia embarcou às 07:03."
  - Título "🏫 Chegou na escola" / texto "A Júlia chegou no Colégio Aurora."
  - Título "🏠 Chegou em casa" / texto "A Júlia desceu da van às 12:41."

## 6. Rastreamento
- **MVP:** app do motorista com localização em segundo plano (Android: foreground service com notificação fixa; iOS: permissão "Sempre"). Enviar a cada 5–10 s em movimento e a cada 30 s parado.
- **Depois:** rastreador GPS fixo (GT06/Teltonika) por um serviço TCP. A tabela de posições já deve ter `source: app | tracker`.
- Tempo real para a família via Supabase Realtime ou WebSocket.
- **LGPD:** localização visível só para famílias aprovadas e só com a rota ativa. Apagar posições brutas depois de 7 dias (Essencial) ou 12 meses (Completo). Termos de uso, política de privacidade e consentimento do responsável (dados de menores).

## 7. Pagamentos
- **Assinatura do motorista:** Asaas ou Mercado Pago (Pix + cartão, recorrente). Webhook atualiza o plano. Se vencer: aviso no app e volta para um modo limitado, sem apagar dados.
- **Mensalidade dos alunos (Completo):** cobrança Pix por aluno/mês via Asaas (subconta/split para o motorista), lembrete por push 3 dias antes e no vencimento, baixa automática.

## 8. Stack sugerida
- **Apps:** React Native + Expo (um app com dois modos, Motorista e Família). Mapas com `react-native-maps`. Push com `expo-notifications`. Localização em segundo plano com `expo-location` + `expo-task-manager`.
- **Backend:** Supabase (Postgres + PostGIS, Auth, Realtime, Storage, Edge Functions) + um worker para o motor de notificações (cron/fila).
- **Web:** Next.js para o site (já existe em HTML em `rastreiavan/index.html`, converter mantendo o visual), painel web do motorista (cadastros e financeiro) e painel admin.
- **Infra:** Vercel (web) + Supabase + Render/Fly para o worker.

## 9. Modelo de dados (mínimo)
`usuarios`, `motoristas`, `vans` (codigo, placa, plano, status_assinatura), `escolas` (endereco, geofence), `alunos`, `responsaveis` (push_tokens, preferencias_aviso), `vinculos_aluno_responsavel`, `rotas` (turno, sentido), `paradas_rota` (ordem, aluno), `trajetos` (rota num dia: inicio, fim), `posicoes` (trajeto, lat, lng, velocidade, source, ts — particionar por data), `eventos` (trajeto, aluno, tipo, ts), `notificacoes` (evento, responsavel, status), `ausencias`, `mensagens_chat`, `assinaturas`, `cobrancas_mensalidade`.

## 10. Identidade visual (seguir à risca)
- **Nome:** Rastreia Van. Wordmark junto e em minúsculas: "rastreia" em azul-noite + "van" em amarelo-escuro (em fundo amarelo, tudo azul com "van" sublinhado em branco).
- **Símbolo:** van amigável em azul-noite sobre quadrado amarelo arredondado, com ponto verde de localização no canto (arquivos em `rastreiavan/assets/`). É também o ícone do app e da notificação.
- **Cores:** Amarelo Escolar `#FFC21A`, Amarelo Escuro `#E8A400`, Azul Noite `#0E1B3D`, Verde Ao Vivo `#1FB46A`, Coral Alerta `#FF6B57`, Creme `#FFFBF2`. Ter modo escuro.
- **Fontes:** Fredoka (títulos) e Nunito (texto).
- **Estilo:** arredondado (raio 16–28 px), botões em pílula, botão principal amarelo com sombra sólida amarelo-escura.
- **Tom de voz:** próximo, curto, tranquilizador, com o nome da criança. Nunca termos técnicos para a família ("geofence", "ETA", "push").

## 11. Ordem de entrega
1. **Semanas 1–2:** login, cadastro de van/escola/alunos, código e QR, aprovação de famílias.
2. **Semanas 3–4:** "Iniciar rota" com localização em segundo plano + mapa ao vivo na família.
3. **Semana 5:** motor de notificações push (eventos do Essencial).
4. **Semana 6:** assinatura (Essencial R$ 14,90 / Completo R$ 29,90) com teste de 14 dias e bloqueio por plano.
5. **Semana 7:** recursos do Completo: chamada, "não vai hoje", demais avisos, chat, recados.
6. **Depois:** mensalidades por Pix, emergência, painel Frota, rastreador GPS fixo.

## 12. Critérios de pronto
- Um script que simula uma rota (injeta posições de um GPX) dispara as notificações na ordem certa, sem duplicar.
- Família não aprovada não vê nada. Ninguém vê a localização fora da rota.
- O plano Essencial só recebe os 3 avisos dele.
- A notificação chega com o app fechado e o celular bloqueado (Android e iOS).
- O app do motorista roda 4 horas com a tela apagada sem parar de enviar a localização.
- Testes automatizados do motor (previsão de chegada, cerca virtual, idempotência, regras por plano).

Comece me mostrando a arquitetura e o plano de pastas. Depois implemente na ordem do item 11, com commits pequenos.
