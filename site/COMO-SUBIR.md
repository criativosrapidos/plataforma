# Como colocar a plataforma no ar em criativosrapidos.com.br

São 4 etapas: **Supabase** (login, banco e arquivos, plano gratuito), **HostGator** (onde o site fica), **primeiro acesso** e, quando quiserem postar sozinho, **Instagram**. As três primeiras levam por volta de 40 minutos.

## O que tem na pasta `site/`

| Endereço | Arquivo | Para quem |
|---|---|---|
| criativosrapidos.com.br | `index.html` | Home: o time, como funciona, planos (Presença, Crescimento, Autoridade), pacotes, o app e dúvidas. Os botões "Quero o…" abrem um formulário que cai no painel como interessado |
| criativosrapidos.com.br/videos | `videos.html` | Landing de campanha do pacote Largada (R$ 97: 2 vídeos + 1 arte), com vídeos de exemplo e formulário próprio |
| criativosrapidos.com.br/brief | `brief.html` | Briefing que o cliente preenche **depois de pagar**. Aceita `?plano=crescimento`, `?plano=turbo`, `?plano=largada` etc. para já marcar o que ele comprou |
| criativosrapidos.com.br/entrar | `entrar.html` | Login, criar conta e esqueci a senha |
| criativosrapidos.com.br/app | `app.html` | App do cliente: Início, Conteúdos (aprovar, pedir ajuste, baixar em alta), Calendário de postagem e Conta. **Instala no celular** como aplicativo |
| criativosrapidos.com.br/app?demo=1 | — | Demonstração do app com a marca fictícia Brasa Burger, pra mostrar a quem ainda não é cliente |
| criativosrapidos.com.br/admin | `admin.html` | Painel da agência: visão geral, entregas, clientes, briefings e interessados (leads) |
| | `assets/config.js` | **O único arquivo que vocês editam** (chaves do Supabase, WhatsApp e Instagram) |
| | `supabase/schema.sql` | Banco de dados, para colar no Supabase |
| | `manifest.webmanifest`, `sw.js`, `offline.html` | O que faz o app instalar no celular |

Enquanto o `config.js` estiver sem as chaves, o site inteiro funciona em **modo demonstração**: entre como `cliente@demo` ou `agencia@demo`, com qualquer senha. Para ver no computador, abra a pasta `site` num terminal e rode `npx serve .`. Depois acesse http://localhost:3000.

Os vídeos e as artes de exemplo são gerados a partir de `site-fontes/` (veja o README de lá).

---

## 1. Supabase: login, banco e arquivos

1. Crie uma conta em https://supabase.com e clique em **New project**.
   - Nome: `criativos-rapidos`
   - Região: **South America (São Paulo)**
   - Crie e **guarde a senha do banco**.
2. No menu da esquerda, abra **SQL Editor**, depois **New query**.
3. Cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**. Deve aparecer "Success". Pode rodar de novo sem problema.
4. Abra **Authentication**, depois **URL Configuration**:
   - Site URL: `https://criativosrapidos.com.br`
   - Redirect URLs: adicione `https://criativosrapidos.com.br/**`
5. Abra **Authentication**, depois **Sign In / Providers**, depois **Email**. Desligue **Confirm email** por enquanto.
   - Motivo: o envio de e-mail grátis do Supabase só manda mensagem para os membros da equipe do projeto.
   - Quando quiserem confirmação de e-mail e o "esqueci minha senha" funcionando para clientes, configurem um SMTP próprio em **Authentication**, depois **Emails**, depois **SMTP Settings**.
   - O Resend (https://resend.com) tem plano grátis e funciona bem para isso.
6. Abra **Project Settings**, depois **API**, e copie dois valores:
   - **Project URL**, que parece com `https://abcd1234.supabase.co`
   - A chave **anon public**, que é um texto longo começando com `eyJ`
7. Abra `site/assets/config.js` e preencha os campos:
   ```js
   SUPABASE_URL: "https://abcd1234.supabase.co",
   SUPABASE_ANON_KEY: "eyJ...",
   WHATSAPP: "5561999999999",   // DDI + DDD + número, só números
   INSTAGRAM: "seuinstagram",   // sem o @
   ```
   A chave **anon** pode ficar no site: as regras do banco garantem que cada cliente só vê o que é dele.
   **Nunca** coloque a chave **service_role** no site.

**Tamanho dos arquivos:** no plano grátis do Supabase cabem 1 GB no total, com até 50 MB por arquivo. Para vídeos maiores, use a opção **Link do Google Drive** no painel: o cliente assiste e baixa direto do Drive. O plano Pro do Supabase custa US$ 25/mês e libera 100 GB.

## 2. HostGator: colocar o site no ar

1. Edite `assets/config.js` com as chaves do Supabase (etapa 1), o WhatsApp e o @ do Instagram **antes** de subir.
2. Entre no **Portal do Cliente HostGator** e abra o **cPanel** da hospedagem do criativosrapidos.com.br.
3. Abra o **Gerenciador de Arquivos** e entre na pasta **public_html**. Se tiver arquivos antigos de outro site, mova pra uma pasta `antigo`.
4. Clique em **Carregar** e envie o arquivo `site-criativos-rapidos.zip` (o banco e a função do Instagram vão separados, no `supabase-criativos-rapidos.zip`, e não sobem pra HostGator).
5. Volte pra `public_html`, clique com o botão direito no zip e em **Extract** (Extrair). Os arquivos `index.html`, `app.html` etc. precisam ficar **direto** dentro de `public_html`, não numa subpasta.
6. Confira se o arquivo **.htaccess** foi junto: em **Configurações** (canto de cima), marque **Mostrar arquivos ocultos**. Ele faz `/brief`, `/app`, `/entrar` e `/admin` funcionarem sem o `.html` e força o https.
7. No cPanel, abra **SSL/TLS Status** e confirme que o domínio tem o cadeado (o **AutoSSL** da HostGator é gratuito). Sem https o app não instala no celular e o login pode falhar.
8. Apague o zip de dentro de `public_html` e abra https://criativosrapidos.com.br.

Se o domínio estiver registrado fora da HostGator (no Registro.br, por exemplo), aponte os **servidores DNS** do domínio para os que a HostGator mandou no e-mail de boas-vindas (algo como `ns1234.hostgator.com.br`). Pode levar algumas horas.

**Atualizar depois:** suba só os arquivos que mudaram, por cima, no mesmo lugar. O `assets/config.js` não precisa ser enviado de novo se as chaves não mudaram.

> Outra opção é a Vercel (grátis, atualiza sozinha pelo GitHub): importe o repositório `criativosrapidos/plataforma` com a pasta `site` como raiz. O `vercel.json` já está pronto.

## 3. Primeiro acesso da agência

1. Entre em https://criativosrapidos.com.br/entrar e clique em **Criar minha conta** com o e-mail da agência.
2. No Supabase, abra o **SQL Editor** e rode este comando (troque o e-mail se for outro):
   ```sql
   update public.perfis set papel = 'admin' where email = 'criativosrapidos@gmail.com';
   ```
3. Saia e entre de novo: você vai cair no **Painel da agência** (`/admin`).

## Rotina com cada cliente

0. **Interessados:** quem preenche o formulário da home ou de `/videos` aparece em **Interessados** no painel, com botão pra chamar no WhatsApp. Atualize o status (novo, conversando, fechou, não fechou).

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

**Link do Google Drive:** no Drive, clique em **Compartilhar** e escolha **Qualquer pessoa com o link** como **Leitor**. Copie o link e cole no painel.

## Instalar o app no celular (pra vocês e pros clientes)

- **Android (Chrome):** abra `criativosrapidos.com.br/app`, toque no menu ⋮ e em **Instalar app**. Em muitos celulares aparece um botão **Instalar app** na própria tela de Conta.
- **iPhone (Safari):** abra `criativosrapidos.com.br/app`, toque em **Compartilhar** e em **Adicionar à Tela de Início**.

O ícone amarelo da Criativos fica na tela do celular e abre direto no app, sem a barra do navegador.

## Mostrar o app pra quem ainda não é cliente

Mande o link `criativosrapidos.com.br/app?demo=1`. Abre o app com a marca fictícia Brasa Burger, dados de exemplo e nada salvo no banco de vocês. O botão "Ver o app funcionando" da home leva pra lá.

## 4. Instagram: postar sozinho depois que o cliente aprova

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
