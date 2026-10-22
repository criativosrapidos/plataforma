# Como colocar a plataforma no ar em criativosrapidos.com.br

São 4 etapas, todas com plano gratuito: **Supabase** (login, banco e arquivos), **Vercel** (hospeda o site), **domínio** (aponta criativosrapidos.com.br para a Vercel) e **primeiro acesso**. Leva por volta de 40 minutos.

## O que tem na pasta `site/`

| Endereço | Arquivo | Para quem |
|---|---|---|
| criativosrapidos.com.br | `index.html` | Landing com vídeos motion, pacotes, planos e dúvidas |
| criativosrapidos.com.br/brief | `brief.html` | Briefing. Aceita `?plano=crescimento`, `?plano=turbo` etc. para já marcar o plano |
| criativosrapidos.com.br/entrar | `entrar.html` | Login, criar conta e esqueci a senha |
| criativosrapidos.com.br/app | `app.html` | Área do cliente: aprovar, pedir ajuste, baixar em alta, copiar legenda |
| criativosrapidos.com.br/admin | `admin.html` | Painel da agência: enviar entregas, definir plano do cliente, ler briefings |
| | `assets/config.js` | **O único arquivo que vocês editam** (chaves do Supabase e WhatsApp) |
| | `supabase/schema.sql` | Banco de dados, para colar no Supabase |

Enquanto o `config.js` estiver sem as chaves, o site funciona em **modo demonstração**: entre como `cliente@demo` ou `agencia@demo`, com qualquer senha, para testar tudo. Para ver no computador, abra a pasta `site` num terminal e rode `npx serve .`. Depois acesse http://localhost:3000.

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

## 2. Vercel: hospedar o site

O código já está no GitHub em `criativosrapidos/plataforma`. Com a Vercel ligada ao GitHub, o site se atualiza sozinho a cada mudança.

1. Crie uma conta em https://vercel.com usando **Continue with GitHub**.
2. Clique em **Add New…**, depois **Project**, e importe `criativosrapidos/plataforma`.
3. Em **Root Directory**, clique em **Edit** e escolha `site`. Framework Preset: **Other**. Não precisa de comando de build.
4. Clique em **Deploy**. Em 1 minuto sai um endereço tipo `plataforma-xxx.vercel.app`. Abra e confira.

O arquivo `vercel.json` já faz `/brief`, `/entrar`, `/app` e `/admin` funcionarem sem o `.html`.

> Se preferirem a Netlify: em https://app.netlify.com escolha **Add new site**, depois **Import from Git**, com o mesmo repositório e base directory `site`. Também dá para arrastar a pasta `site` para https://app.netlify.com/drop.

## 3. Domínio: apontar criativosrapidos.com.br

1. Na Vercel, abra o projeto e vá em **Settings**, depois **Domains**.
2. Adicione `criativosrapidos.com.br` e também `www.criativosrapidos.com.br`. A Vercel mostra os registros de DNS. Normalmente são:

   | Tipo | Nome | Valor |
   |---|---|---|
   | A | @ (ou vazio) | `76.76.21.21` |
   | CNAME | www | `cname.vercel-dns.com` |

   Use **os valores que a Vercel mostrar** na tela, que podem ser diferentes destes.
3. No site onde o domínio foi registrado, crie esses registros:
   - No **Registro.br**: acesse https://registro.br, abra o domínio, vá em **DNS** e depois em **Editar zona**.
   - Se o DNS estiver em outro lugar (Hostinger, GoDaddy, Cloudflare), crie os registros lá.
4. A propagação leva de minutos a algumas horas. A Vercel coloca o cadeado (HTTPS) sozinha.

## 4. Primeiro acesso da agência

1. Entre em https://criativosrapidos.com.br/entrar e clique em **Criar minha conta** com o e-mail da agência.
2. No Supabase, abra o **SQL Editor** e rode este comando (troque o e-mail se for outro):
   ```sql
   update public.perfis set papel = 'admin' where email = 'criativosrapidos@gmail.com';
   ```
3. Saia e entre de novo: você vai cair no **Painel da agência** (`/admin`).

## Rotina com cada cliente

1. Fechou a venda: mande o link `criativosrapidos.com.br/brief?plano=crescimento`, com o plano dele no final.
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

## Atualizar o site depois

Toda mudança enviada para o GitHub na pasta `site/` publica sozinha na Vercel. Para trocar preços ou textos, edite `site/index.html` ou me peça.
