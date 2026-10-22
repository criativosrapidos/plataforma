# Como lançar o site da Criativos Rápidos

O lançamento tem três partes. **Só a primeira é necessária pra colocar o site no ar hoje.**

| Parte | O que liga | Precisa de | Tempo |
|---|---|---|---|
| 1 · Site no ar | Home, página do Largada (`/videos`), briefing (`/brief`) e política de privacidade. Os pedidos de contato e os briefings chegam no seu e-mail | Só a HostGator | 15 min |
| 2 · Área do cliente | App do cliente, painel da agência, login, entregas, aprovação e download em alta | Supabase (gratuito) | 30 min |
| 3 · Instagram | Postagem automática depois que o cliente aprova | App na Meta + análise da Meta | alguns dias |

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
3. A partir daí os pedidos de contato e os briefings passam a ficar no painel (abas **Interessados** e **Briefings**), e não mais só no e-mail.

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
