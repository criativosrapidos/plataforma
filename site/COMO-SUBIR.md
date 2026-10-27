# Como lançar o site da Criativos Rápidos

O lançamento tem três partes. **Só a primeira é necessária pra colocar o site no ar hoje.**

| Parte | O que liga | Precisa de | Tempo |
|---|---|---|---|
| 1 · Site no ar | Home, página do Largada (`/videos`), briefing (`/brief`) e política de privacidade. Os pedidos de contato e os briefings chegam no seu e-mail | Só a HostGator | 15 min |
| 2 · Área do cliente | App do cliente, painel da agência, login, entregas, aprovação e download em alta | Supabase (gratuito) | 30 min |
| 3 · Instagram | Postagem automática depois que o cliente aprova | App na Meta + análise da Meta | alguns dias |
| 4 · Tráfego | Números dos anúncios (Meta Ads) entrando sozinhos no relatório de cada cliente | Gerenciador de Negócios da agência | 20 min |

Enquanto a parte 2 não estiver ligada, quem clica em "Área do cliente" vê o aviso "abre em breve" e um botão pra ver a demonstração.

---

## Parte 1 · Site no ar (só HostGator)

### 1. Preparar o arquivo de configuração
Antes de subir, abra o `site-criativos-rapidos.zip` no computador, abra o arquivo `assets/config.js` num editor de texto (Bloco de Notas serve) e preencha:

```js
WHATSAPP: "5561999999999",   // 55 + DDD + número, só números
INSTAGRAM: "criativosrapidos", // o @ sem o arroba
```

Deixe `SUPABASE_URL` e `SUPABASE_ANON_KEY` vazios por enquanto. Salve e feche o zip de novo (ou extraia, edite e compacte outra vez).

### 2. Criar o e-mail que envia os pedidos
1. Entre no **Portal do Cliente da HostGator** e abra o **cPanel**.
2. Em **E-mail → Contas de e-mail**, crie a conta `site@criativosrapidos.com.br` (qualquer senha forte).
3. Esse é o remetente dos avisos. Eles chegam em `criativosrapidos@gmail.com`. Pra trocar quem recebe, edite a primeira linha do `enviar.php`.

### 3. Subir os arquivos
1. No cPanel, abra o **Gerenciador de arquivos** e entre na pasta **public_html**.
2. Se tiver arquivos de um site antigo, crie uma pasta `antigo` e mova tudo pra lá.
3. Clique em **Carregar** e envie o `site-criativos-rapidos.zip`.
4. Volte pra `public_html`, clique com o botão direito no zip e escolha **Extrair**. Os arquivos `index.html`, `videos.html`, `enviar.php` e as pastas `assets` e `dados` precisam ficar **direto** dentro de `public_html`.
5. Em **Configurações** (canto de cima, à direita), marque **Mostrar arquivos ocultos** e confira se o arquivo `.htaccess` está lá. Ele deixa os endereços sem o ".html" e obriga o cadeado (https).
6. Apague o zip de dentro de `public_html`.

### 4. Ligar o cadeado (https)
No cPanel, abra **Segurança → Status de SSL/TLS** e confira se `criativosrapidos.com.br` está com o cadeado verde. A HostGator faz isso de graça (AutoSSL). Se não estiver, clique em **Executar AutoSSL** e espere alguns minutos.

### 5. Conferir
- Abra https://criativosrapidos.com.br, https://criativosrapidos.com.br/videos e https://criativosrapidos.com.br/brief.
- Preencha o formulário "Quero começar" com seus dados e veja se o e-mail chegou (olhe também o spam e marque como "não é spam").
- Se o e-mail não chegar, o pedido fica guardado no servidor: no Gerenciador de arquivos, pasta `public_html/dados`, arquivos `lead-ANO-MÊS.txt` e `briefing-ANO-MÊS.txt`. Essa pasta é bloqueada pra quem está de fora.

**Se o domínio estiver registrado fora da HostGator** (no Registro.br, por exemplo), troque os **servidores DNS** do domínio pelos que a HostGator mandou no e-mail de boas-vindas (algo como `ns1234.hostgator.com.br`). A troca leva algumas horas.

**Pra atualizar depois:** suba só os arquivos que mudaram, por cima, no mesmo lugar.

---

## Parte 2 · Área do cliente (Supabase)

O Supabase é onde ficam os logins dos clientes, o banco de dados e os arquivos em alta qualidade. O plano gratuito aguenta bem o começo: até 1 GB de arquivos, com no máximo 50 MB cada. Vídeo maior, use o link do Google Drive no painel.

> O painel do Supabase é em inglês. Os nomes dos botões estão entre aspas, do jeito que aparecem lá.

### 1. Criar o projeto
1. Crie uma conta em https://supabase.com e clique em "New project".
2. Nome: `criativos-rapidos`. Região: "South America (São Paulo)". Anote a senha do banco.

### 2. Criar o banco
1. Extraia o `supabase-criativos-rapidos.zip` no computador.
2. No Supabase, abra "SQL Editor" e depois "New query".
3. Cole todo o conteúdo do arquivo `supabase/schema.sql` e clique em "Run". Deve aparecer "Success".

### 3. Configurar o login
1. Em "Authentication" → "URL Configuration":
   - "Site URL": `https://criativosrapidos.com.br`
   - "Redirect URLs": adicione `https://criativosrapidos.com.br/**`
2. Em "Authentication" → "Sign In / Providers" → "Email", desligue "Confirm email" por enquanto. O envio grátis de e-mail do Supabase só manda mensagem pra equipe do projeto.
3. Pra ligar confirmação de e-mail e "esqueci minha senha" pros clientes, configure um envio de e-mail próprio em "Authentication" → "Emails" → "SMTP Settings". Dá pra usar o próprio e-mail da HostGator (servidor `mail.criativosrapidos.com.br`, porta 465) ou o Resend, que tem plano grátis.

### 4. Ligar o site ao Supabase
1. Em "Project Settings" → "API", copie a "Project URL" e a chave "anon public".
2. Na HostGator, abra `public_html/assets/config.js` (botão direito → **Editar**) e preencha:
   ```js
   SUPABASE_URL: "https://abcd1234.supabase.co",
   SUPABASE_ANON_KEY: "eyJ...",
   ```
   A chave "anon" pode ficar no site: as regras do banco garantem que cada cliente só vê o que é dele. **Nunca** coloque a chave "service_role" no site.
3. A partir daí os pedidos de contato e os briefings passam a ficar no painel (abas **CRM** e **Briefings**), e não mais só no e-mail.

### 5. Primeiro acesso da agência
1. Entre em https://criativosrapidos.com.br/entrar e clique em **Criar minha conta** com o e-mail da agência.
2. No Supabase, no "SQL Editor", rode (troque o e-mail se for outro):
   ```sql
   update public.perfis set papel = 'admin' where email = 'criativosrapidos@gmail.com';
   ```
3. Saia e entre de novo: você cai no **Painel da agência**.

### 6. Testar como cliente
Crie uma segunda conta com outro e-mail, escolha um plano pra ela no painel (aba **Clientes**), envie uma entrega (aba **Entregas**) e aprove pelo celular.

## Rotina com cada cliente

0. **CRM:** quem preenche o formulário da home ou de `/videos` aparece no **CRM** do painel, num quadro por etapa (novo, conversando, proposta enviada, fechou, não fechou), com botão pra chamar no WhatsApp. Você também cadastra contatos à mão, anota a conversa e marca o próximo contato: no dia, ele aparece em **Visão geral → Precisa de você**.

1. Fechou a venda e recebeu o pagamento: mande o link `criativosrapidos.com.br/brief?plano=crescimento`, com o plano dele no final.
2. O briefing chega na aba **Briefings** do painel (e, se ele quiser, também no WhatsApp).
3. Peça para o cliente criar a conta em `criativosrapidos.com.br/entrar` com o e-mail do contrato.
4. Na aba **Clientes**, escolha o plano dele. Os ajustes do mês se preenchem sozinhos. Clique em **Salvar**.
5. Na aba **Entregas**:
   - Escolha o cliente.
   - Envie os arquivos ou cole o link do Drive.
   - Ele recebe tudo em **Para aprovar** na área do cliente.
6. Quando ele pedir ajuste:
   - A entrega aparece **Em ajuste**, com o comentário dele.
   - Use **Enviar versão ajustada** e ela volta para ele aprovar.
   - O limite de ajustes do mês aparece para o cliente e é contado no banco.

7. **Ideias:** no painel, aba **Ideias**, escolha o cliente: o que ele contou no briefing aparece do lado. Mande a sugestão e ela aparece no app dele, que responde **Quero essa** ou **Agora não**. O cliente também manda ideias pelo app. Quando for produzir, use **Virar entrega**.
8. **Marca e materiais:** preencha cores, fontes e o jeito de falar de cada cliente (o botão **Puxar do briefing** adianta) e suba logo, manual, guias e arquivos. Tudo aparece no app do cliente, em **Marca** e **Materiais**. Escolha **Pra todos os clientes** pra guias que valem pra todo mundo.
9. **Financeiro:** no começo do mês, clique em **Lançar mensalidades** (cria uma cobrança pra cada plano mensal, com o valor do plano). Lance pacotes avulsos em **Nova cobrança** e marque como **Paga** quando receber. O cliente vê os pagamentos dele em **Conta**.
10. **Relatórios:** o que foi entregue, aprovado e publicado sai sozinho das entregas. No fim do mês, em **Relatórios → Lançar**, coloque os números do tráfego (investido, alcance, cliques, conversas…) e um comentário. O cliente vê em **Relatórios** no app.
11. **Equipe:** cadastre os agentes, diga de que parte cada um cuida e escolha o responsável de cada cliente na aba **Clientes**.

**Atualizou o site com essas abas novas?** Rode o `supabase/schema.sql` de novo no SQL Editor (pode rodar quantas vezes quiser): ele cria as tabelas de ideias, materiais, relatórios, cobranças e equipe sem apagar nada.

**Link do Google Drive:** no Drive, clique em **Compartilhar** e escolha **Qualquer pessoa com o link** como **Leitor**. Copie o link e cole no painel.

## Instalar o app no celular (pra vocês e pros clientes)

- **Android (Chrome):** abra `criativosrapidos.com.br/app`, toque no menu ⋮ e em **Instalar app**. Em muitos celulares aparece um botão **Instalar app** na própria tela de Conta.
- **iPhone (Safari):** abra `criativosrapidos.com.br/app`, toque em **Compartilhar** e em **Adicionar à Tela de Início**.

O ícone amarelo da Criativos fica na tela do celular e abre direto no app, sem a barra do navegador.

## Mostrar o app pra quem ainda não é cliente

Mande o link `criativosrapidos.com.br/app?demo=1`. Abre o app com a marca fictícia Brasa Burger, dados de exemplo e nada salvo no banco de vocês. O botão "Ver o app funcionando" da home leva pra lá.

## Parte 3 · Instagram: postar sozinho depois que o cliente aprova

Funciona assim: o cliente toca em **Conectar meu Instagram** na aba Conta do app e autoriza. A partir daí, todo conteúdo que ele aprovar vai ao ar sozinho no dia e horário da entrega, com a legenda. Vale para os planos em que a gente posta (Crescimento e Autoridade). No painel aparece "Agendado", "Publicado · ver post" ou o motivo de não ter publicado, e o botão **Postar agora**.

**O que precisa ter:**
- A conta do cliente precisa ser **profissional** (Comercial ou Criador de conteúdo). Conta pessoal o Instagram não deixa.
- Imagens em **JPG** e vídeos em **MP4**. Arquivos enviados pelo painel (link do Drive não posta sozinho).
- Carrossel: no painel, escolha vários arquivos e deixe marcado **Juntar os arquivos num carrossel só** (até 10).
- Stories também vão sozinhos (sem legenda, porque o Instagram não aceita legenda em stories).

**Configuração (uma vez só):**
1. **App da Meta:** em https://developers.facebook.com crie um app do tipo **Empresa** e adicione o produto **Instagram → API do Instagram com login do Instagram**. Anote o **ID do app do Instagram** e a **Chave secreta**.
2. Em **Configurar login empresarial**, coloque como URL de redirecionamento: `https://SEU-PROJETO.supabase.co/functions/v1/instagram/callback`.
3. **Publicar a função** (no computador, com Node instalado): extraia o `supabase-criativos-rapidos.zip` numa pasta e rode os comandos nessa pasta (a que tem a pasta `supabase` dentro):
   ```bash
   npx supabase login
   npx supabase link --project-ref SEU-PROJETO
   npx supabase secrets set IG_APP_ID=... IG_APP_SECRET=... SITE_URL=https://criativosrapidos.com.br CRON_SECRET=uma-senha-longa-qualquer
   npx supabase functions deploy instagram --no-verify-jwt
   ```
4. **Agendador:** no Supabase, abra **Database → Extensions** e ligue `pg_cron` e `pg_net`. Depois rode no **SQL Editor** (troque o projeto e a senha):
   ```sql
   select cron.schedule('postar-instagram', '*/10 * * * *', $$
     select net.http_post(
       url := 'https://SEU-PROJETO.supabase.co/functions/v1/instagram/agendados',
       headers := '{"Content-Type": "application/json", "x-cron-secret": "uma-senha-longa-qualquer"}'::jsonb
     );
   $$);
   ```
   A cada 10 minutos ele publica o que estiver aprovado e com horário vencido, e renova as conexões que estão perto de vencer (o Instagram dá 60 dias).
5. **Liberação da Meta:** enquanto o app está em teste, só funciona com contas que vocês adicionarem como **testadoras** no painel do app. Pra qualquer cliente conectar, peça a **análise do app** com as permissões `instagram_business_basic` e `instagram_business_content_publish`. A Meta pede um vídeo mostrando o uso e a política de privacidade: use `https://criativosrapidos.com.br/privacidade` (revisem o texto antes). Costuma levar de alguns dias a algumas semanas.

Enquanto a Meta não libera, o resto da plataforma funciona normal e vocês postam pelo Meta Business, como hoje.


---

## Parte 4 · Tráfego direto do Meta Ads

Com isso, o investido, o alcance, as impressões, os cliques, as conversas (mensagens iniciadas e cadastros) e as campanhas de cada cliente entram sozinhos em **Relatórios**, no painel e no app do cliente. O comentário, o link do relatório completo e os seguidores novos continuam sendo lançados à mão.

**Configuração (uma vez só):**
1. **As contas de anúncio dos clientes precisam estar no Gerenciador de Negócios da agência** (business.facebook.com). Se o cliente é dono da conta, ele compartilha com vocês como parceiro: no Gerenciador dele, **Configurações → Contas de anúncios → Atribuir parceiros**, com o ID do Gerenciador da agência.
2. **Usuário do sistema:** no Gerenciador da agência, **Configurações → Usuários → Usuários do sistema → Adicionar** (função Administrador). Em **Atribuir ativos**, marque as contas de anúncio dos clientes com permissão de ver o desempenho.
3. **Token:** nesse usuário do sistema, clique em **Gerar novo token**, escolha o mesmo app da Meta usado no Instagram (ou crie um app do tipo Empresa), validade **Nunca**, e marque as permissões `ads_read` e `read_insights`. Copie o token: ele aparece uma vez só.
4. **Publicar a função** (na mesma pasta da Parte 3):
   ```bash
   npx supabase secrets set META_ADS_TOKEN=cole-o-token-aqui
   npx supabase functions deploy trafego --no-verify-jwt
   ```
   (Se ainda não tiver feito a Parte 3, rode antes `npx supabase login`, `npx supabase link --project-ref SEU-PROJETO` e defina também `CRON_SECRET=uma-senha-longa-qualquer`.)
5. **Ligar cada cliente:** no painel, **Relatórios → Lançar** no cliente → **Buscar contas**, escolha a conta de anúncio dele e toque em **Puxar do Meta agora**. Pronto: a partir daí o botão **Atualizar tudo do Meta** puxa todos de uma vez.
6. **Atualizar sozinho todo dia** (opcional, precisa do `pg_cron` e do `pg_net` ligados, como na Parte 3):
   ```sql
   select cron.schedule('trafego-meta', '0 9 * * *', $$
     select net.http_post(
       url := 'https://SEU-PROJETO.supabase.co/functions/v1/trafego/agendado',
       headers := '{"Content-Type": "application/json", "x-cron-secret": "uma-senha-longa-qualquer"}'::jsonb
     );
   $$);
   ```
   Todo dia às 6h (horário de Brasília; o Supabase usa UTC) ele atualiza o mês atual e, nos 3 primeiros dias do mês, fecha o mês anterior.

Como é o token da própria agência lendo as contas que ela já administra, não precisa da análise da Meta como na Parte 3.

---

## Parte 5 · Agentes de IA e assistente

- **Agentes IA** (painel, grupo Equipe): 10 agentes prontos (Diretor/CEO, Relacionamento, Sucesso do cliente, Estrategista de conteúdo, Redator, Monitor de redes, Gestor de tráfego, Analista de resultados, Financeiro e SEO). Em **Configurar** você muda o nome, a função, o que cada um lê, o que entrega, quando roda e o nível de inteligência. **Novo agente** cria quantos quiser.
- Os agentes só deixam **rascunhos** em **Pra aprovar**: mensagem de WhatsApp, ideia, legenda, comentário de relatório, alerta ou tarefa. Aprovar faz a ação (abre o WhatsApp com o texto, manda a ideia pro app do cliente, coloca a legenda na entrega, salva o comentário no relatório).
- **Assistente:** no painel (Agentes IA) a equipe pergunta sobre a agência ou um cliente; no app, o cliente pergunta sobre os dados dele (em Relatórios e em Ajuda), com limite de 20 perguntas por dia.
- **Instagram dos clientes:** uma vez por dia a plataforma guarda seguidores, curtidas e comentários dos últimos posts de quem conectou o Instagram. Aparece em Relatórios no app e é lido pelo Monitor de redes.
- **Ligar:** crie uma chave em https://platform.claude.com (API Keys) e coloque como `ANTHROPIC_API_KEY` (veja a Parte 6). O custo é por uso (veja a estimativa no painel ou peça pra equipe).

### Organograma e esteira

- **Organograma** (Agentes IA): 67 agentes com apelido, rosto e função: direção (CEO e Estratégia) e as 4 áreas na ordem da jornada. Comercial = marketing da agência (um agente por rede: Instagram, TikTok, LinkedIn, X, YouTube, Facebook, blog, e-mail) + vendas (atendente, prospecção, qualificação, agendamento, os 8 vendedores e propostas). Operacional = entrega pros clientes (onboarding, suporte, sucesso, offboarding, a esteira de produção, social media, tráfego, relatórios e marca). Administrativo = clientes, contratos, jurídico/LGPD, processos, indicadores, o time de agentes, ferramentas e documentos. Financeiro = cobrança, faturamento, conciliação, contas a pagar, preço e margem, planejamento e impostos. Em ⚙ você muda tudo: área, chefe, função, o que lê, o que entrega, se pede aprovação ou age sozinho.
- **A jornada:** venda → pagamento → briefing (com IA ajudando a preencher em /brief) → pauta → roteiro → copy → arte ou edição → produção → aprovação do cliente → postagem → tráfego → relatório. Cada etapa mostra quantos estão nela e quem cuida.
- **Esteira** (Produção): todo dia de manhã o Estrategista monta a pauta do mês de cada cliente na quantidade do plano, a Roteirista escreve os roteiros, o Copywriter as legendas e textos da arte, a Diretora de arte e o Editor de vídeo deixam a arte e a edição especificadas. Na coluna **Produção** falta só o arquivo: abra o card, suba a imagem ou o vídeo e toque em **Enviar pro cliente aprovar**.
- **A própria agência:** em Agentes IA → "A Criativos Rápidos também é cliente", escolha o ritmo e a esteira produz o nosso conteúdo também.

## Parte 6 · Publicação automática (GitHub)

Toda mudança na pasta `site/` do branch `claude/generic-sales-proposal-lok7t4` publica sozinha o site na HostGator, atualiza o banco, publica as funções e liga os agendamentos. Pra isso, em **GitHub → criativosrapidos/plataforma → Settings → Secrets and variables → Actions → New repository secret**, cadastre:

| Secret | Onde pegar |
|---|---|
| `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` | cPanel da HostGator → **Contas FTP** (crie uma conta com acesso à `public_html`). Servidor: `ftp.criativosrapidos.com.br` |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → avatar → **Account → Access Tokens → Generate new token** |
| `SUPABASE_DB_URL` | Supabase → **Connect** → **Session pooler** → copie a URI e troque `[YOUR-PASSWORD]` pela senha do banco |
| `CRON_SECRET` | uma senha longa qualquer (use a mesma se já tiver feito a Parte 3) |
| `ANTHROPIC_API_KEY` | platform.claude.com → API Keys |
| `META_ADS_TOKEN` | o token do usuário do sistema (Parte 4) |
| `IG_APP_ID`, `IG_APP_SECRET` | só se ainda não estiverem no Supabase (Parte 3) |

O `assets/config.js` (com as chaves do Supabase) e o `enviar.php` que já estão na HostGator **não são substituídos**. Pra publicar na hora, sem esperar uma mudança: GitHub → **Actions → Publicar site e plataforma → Run workflow**.

## Parte 7 · WhatsApp oficial com a atendente de IA

A atendente (Lili do Zap, no organograma) responde na hora quem chama a agência no WhatsApp, entende o negócio, tira dúvidas com os planos da tabela, manda áudio com a voz da agência (opcional) e marca a reunião nos horários livres da **Agenda**. A equipe vê a conversa no CRM (ícone de balão no cartão) e pode assumir a qualquer momento.

**Regra que mantém o número vivo:** pela API oficial a plataforma só responde quem chamou ou quem pediu contato no site. Lista fria (Importar lista no CRM) fica marcada como "sem consentimento": o agente de Prospecção prepara a abordagem e a equipe manda do próprio celular, poucas por dia.

**Configuração (uma vez só):**
1. Em https://business.facebook.com → **WhatsApp Manager**, crie a conta do WhatsApp Business Platform e adicione um número **que não esteja em uso no WhatsApp do celular** (ou migre o atual).
2. No app da Meta (o mesmo do Instagram), adicione o produto **WhatsApp**. Copie o **ID do número de telefone**.
3. No usuário do sistema (Parte 4), gere um token com `whatsapp_business_messaging` e `whatsapp_business_management`.
4. Em **WhatsApp → Configuração → Webhook**: URL `https://SEU-PROJETO.supabase.co/functions/v1/whatsapp/webhook`, token de verificação = uma senha que você inventar; assine o campo `messages`.
5. (Opcional) Crie e aprove um **modelo** de primeiro contato (categoria Marketing ou Utilidade), ex.: "Oi, {{1}}! Aqui é da Criativos Rápidos, você pediu contato pelo nosso site. Posso te ajudar?".
6. Cadastre no GitHub (Parte 6): `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN` (a senha do passo 4), `WHATSAPP_APP_SECRET` (chave secreta do app), `WHATSAPP_TEMPLATE_CONTATO` (nome do modelo) e, pra áudio, `ELEVENLABS_API_KEY` (e `ELEVENLABS_VOZ` se quiser outra voz).
7. No painel, em **Agenda**, marque os horários livres, cole o link da sala e escreva o treino da atendente.

**Custo:** responder quem chamou não paga mensagem à Meta (janela de 24 h); anúncio de clique pro WhatsApp abre janela grátis de 72 h. Só modelos que a agência inicia são cobrados por mensagem. A IA custa por resposta: no nível "Econômica" fica bem barato.

## Parte 8 · Estúdio (artes e vídeos) e publicação em todas as redes

**Fluxo do nosso marketing (e, se quiser, dos clientes):** a esteira escreve (pauta, roteiro, copy, direção) → o **Estúdio** gera a arte (post, carrossel, stories, anúncio) ou o vídeo (reels com texto animado e narração na voz da agência) → aparece em **Entregas** pra aprovar → vai sozinho pras redes escolhidas, no dia e horário marcados.

**Estúdio** (pasta `estudio/`, roda no GitHub Actions de hora em hora, das 8h às 20h):
1. Cadastre no GitHub o secret `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → service_role). Pra narração, `ELEVENLABS_API_KEY`.
2. O GitHub só roda agendamentos de arquivos que estão no **branch principal** do repositório. Enquanto isso, dá pra rodar em **Actions → Estúdio → Run workflow**.
3. Em Agentes IA → "A Criativos Rápidos também é cliente", escolha se o Estúdio produz só o nosso marketing ou também o dos clientes.
4. As artes usam as cores, as fontes e o logo cadastrados em **Marcas dos clientes** (pra agência, as da Criativos Rápidos).

**Redes pelo Postiz** (Instagram, Facebook, TikTok, LinkedIn, X, YouTube, Threads, Pinterest e outras):
1. Crie a conta em https://postiz.com (ou instale o Postiz próprio) e conecte os perfis da agência e dos clientes. Dica: um "grupo" por cliente.
2. Em **Settings → Public API**, gere a chave e cadastre no GitHub como `POSTIZ_API_KEY` (se for Postiz próprio, também `POSTIZ_API_URL`).
3. No painel: **Clientes → Redes → Escolher** pra cada cliente, e **Agentes IA → Escolher nossas redes** pra agência.
4. TikTok e YouTube só recebem vídeo; stories vão pro Instagram e Facebook. Se o Instagram do cliente for pelo Postiz, a postagem direta da plataforma é desligada pra não sair duas vezes.
