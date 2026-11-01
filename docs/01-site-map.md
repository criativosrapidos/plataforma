# Site map · Aviso Concurso

Quatro superfícies, um backend:

| Superfície | Onde | Para quem |
|---|---|---|
| **App** (produto principal) | iOS, Android e web (Expo) | assinante |
| **Site + landing** | avisoconcurso.com.br | visitante, Google, anúncio |
| **Área do cliente** | avisoconcurso.com.br/conta | assinante (assinatura, dados, LGPD) |
| **Painel admin** | avisoconcurso.com.br/admin | equipe (admin e editor) |

```mermaid
flowchart LR
  subgraph Público
    L[Landing /] --> P[/planos/]
    L --> CF[/como-funciona/]
    L --> F[/fontes/]
    L --> D[/duvidas/]
    L --> BC[/concursos/ busca SEO] --> CS[/concursos/slug/]
  end
  L -- "3 dias grátis" --> CAD[/cadastro/] --> AS[/assinar/] --> BX[/baixar/]
  CS -- "acompanhar no app" --> BX
  BX --> APP((App))
  ENT[/entrar/] --> CONTA[/conta/]
  APP -- "gerenciar assinatura" --> CONTA
  ENT -- equipe --> ADM[/admin/]
```

## 1. Site público (`apps/web/src/app/(site)`)

| Rota | Conteúdo | Objetivo |
|---|---|---|
| `/` | Landing: dor ("Você já perdeu concurso. E nem viu."), aviso no celular, como funciona em 4 passos, agenda multi-concurso, matérias em comum, fontes oficiais, planos, dúvidas, CTA e formulário pré-lançamento | converter em teste de 3 dias |
| `/planos` | Aviso R$ 9,90 · Aprovado R$ 19,90 · anual R$ 99 / R$ 199 · 3 dias grátis · comparação | converter |
| `/como-funciona` | Perfil → coleta diária → notificação → agenda e matérias | educar |
| `/fontes` | DOU (INLABS), bancas, Querido Diário, diários estaduais; o que é e o que não é aviso | confiança |
| `/duvidas` | FAQ: teste, cobrança, cancelamento, iPhone, WhatsApp, LGPD, "vocês dão aula?" (não) | reduzir objeção |
| `/concursos` | Busca pública com filtros (UF, escolaridade, área, banca, status) | SEO, topo de funil |
| `/concursos/[slug]` | Página do concurso: cargos, vagas, salário, cronograma, matérias, link oficial, JSON-LD | SEO + "acompanhar no app" |
| `/baixar` | Links das lojas; sem lojas ainda → captura de contato | instalar |
| `/termos`, `/privacidade` | Termos de uso e política de privacidade (LGPD) | jurídico |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | SEO e PWA | — |

## 2. Autenticação (`(auth)`)

`/entrar` · `/cadastro` · `/recuperar-senha` · `/redefinir-senha?token=` · `/assinar` (onboarding pós-cadastro: plano → método → teste iniciado → baixar o app).

## 3. Área do cliente (`/conta`)

| Rota | Conteúdo |
|---|---|
| `/conta` | Status do plano (teste com dias restantes, ativa, inadimplente, cancelada até…), próximos prazos, atalho para o app |
| `/conta/assinatura` | Escolher/trocar plano e ciclo, método (Pix automático ou cartão), cancelar, histórico de pagamentos |
| `/conta/perfis` | Perfis de busca (criar, editar, pausar, apagar) |
| `/conta/avisos` | Histórico de avisos recebidos |
| `/conta/dados` | Nome, telefone, consentimento de WhatsApp, autorização de busca nominal no DOU, baixar meus dados, excluir conta |
| `/conta/seguranca` | Trocar senha, sessões ativas, sair |

> A assinatura é vendida pelo site (Pix/cartão) para evitar a comissão das lojas, onde as regras da Apple e do Google permitirem. O app abre `/conta/assinatura` no navegador.

## 4. App (`apps/mobile`, Expo Router)

```
(onboarding)
  boas-vindas → cadastro | entrar → perfil de busca (assistente) → planos (paywall, 3 dias grátis)
(tabs)
  Hoje        contagem da próxima prova · prazos da semana · avisos · novos para o seu perfil
  Agenda      semana/mês · uma cor por concurso · filtro por concurso · compromissos por dia
  Matérias    matérias em comum (nº de concursos → questões) · liga/desliga concursos
  Concursos   Acompanhando · Explorar (busca) · Radar (Aprovado)
  Ajustes     plano · push · WhatsApp · e-mail · antecedência 1/2/3/5 · horário silencioso · perfis · conta
concurso/[id]       trilha de etapas · cargos · cronograma · matérias · o que mudou (errata) · checklist · link oficial
concurso/[id]/pergunte   Pergunte ao edital (Aprovado, 30/mês)
avisos              caixa de avisos
perfil/[id]         editor de perfil de busca
planos              paywall (aparece sempre que não há teste/assinatura em dia)
```

Deep link: `avisoconcurso://concurso/<id>` (toda notificação abre a tela do concurso).
Permissão de notificação: pedida **depois do primeiro concurso salvo**, nunca na abertura.

## 5. Painel admin (`/admin`)

| Rota | Papel | Conteúdo |
|---|---|---|
| `/admin` | editor | KPIs: assinantes por status/plano, MRR, testes, conversão, churn, avisos por canal e custo, custo de IA, fila de revisão, saúde dos coletores |
| `/admin/revisao` | editor | Fila de extrações de baixa confiança: original × campos, editar, aprovar, rejeitar |
| `/admin/concursos` | editor | CRUD de concursos, cargos, datas, matérias, edital; publicar; errata com aviso |
| `/admin/documentos` | editor | Documentos brutos coletados, reprocessar |
| `/admin/fontes` | editor | Coletores: status, execuções, erros, rodar agora |
| `/admin/materias` | editor | Matérias canônicas, sinônimos, mesclar |
| `/admin/usuarios` | admin | Busca, detalhe, estender teste, cortesia, papel, revogar sessões, aviso de teste |
| `/admin/financeiro` | admin | Assinaturas, pagamentos, inadimplência, CSV |
| `/admin/avisos` | admin | Log de avisos por canal, status e custo |
| `/admin/leads` | admin | Contatos da landing, CSV |
| `/admin/config` | admin | Limiar de confiança, pausa de WhatsApp, horário do coletor |
| `/admin/auditoria` | admin | Registro de ações sensíveis |

## 6. API do app (`/api/v1`)

| Método e rota | Acesso | Função |
|---|---|---|
| `POST auth/cadastro` · `auth/login` · `auth/sair` | público | sessão (Bearer no app, cookie no site) |
| `POST auth/recuperar` · `auth/redefinir` | público | senha |
| `GET/PATCH/DELETE me` · `GET me/exportar` | logado | conta, LGPD |
| `GET/PUT ajustes` | logado | notificações e lembretes |
| `GET/POST perfis` · `PUT/DELETE perfis/:id` | logado | perfis de busca |
| `GET concursos` · `GET concursos/:id` | público (radar: Aprovado) | busca e detalhe |
| `POST/PATCH/DELETE concursos/:id/acompanhar` | plano ativo | seguir, cor, cargo, matérias |
| `POST concursos/:id/checklist` · `PATCH/DELETE checklist/:item` | plano ativo | checklist |
| `GET/POST concursos/:id/perguntas` | Aprovado | Pergunte ao edital |
| `GET hoje` · `agenda` · `materias` · `acompanhando` | plano ativo | telas do app |
| `GET/POST avisos` | logado | caixa de avisos, marcar lidos |
| `POST/DELETE dispositivos` | logado | token de push |
| `GET planos` · `GET assinatura` · `POST assinatura/checkout` · `trocar` · `cancelar` | logado | cobrança |
| `POST leads` | público | formulário da landing |

Jobs (`/api/cron/*`, protegidos por `CRON_SECRET`): `coletar-dou` (6h), `coletar-bancas` (de hora em hora), `coletar-municipais`, `processar`, `lembretes`, `cobrancas`, `push-receipts`, `resumo-semanal`, `convocacoes`.
Webhook: `/api/webhooks/asaas`.
