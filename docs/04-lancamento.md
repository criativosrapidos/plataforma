# Lançamento · passo a passo

## 1. Contas e registros (antes de anunciar)
- [ ] Pesquisar "Aviso Concurso" no INPI e nas lojas (existe um app Android chamado "Alerta Concurso") e registrar a marca.
- [ ] Domínio `avisoconcurso.com.br` e perfil `@avisoconcurso`.
- [ ] Conta Apple Developer (US$ 99/ano) e Google Play (US$ 25 única).
- [ ] Confirmar as regras atuais da Apple e do Google para assinatura vendida fora do app.
- [ ] Meta Business verificada, número do WhatsApp, modelos aprovados como "utilidade": `isencao_acaba_amanha`, `inscricao_acaba_amanha`. Confirmar preço por mensagem no Brasil.
- [ ] Cadastro gratuito no INLABS (Imprensa Nacional) e conferência dos termos de uso.
- [ ] Conta Asaas (Pix automático e cartão) e URL do webhook `https://avisoconcurso.com.br/api/webhooks/asaas`.
- [ ] Política de privacidade e termos revisados por advogado (LGPD: WhatsApp e busca nominal com consentimento).

## 2. Infraestrutura
1. **Supabase**: criar projeto (região São Paulo), copiar a connection string do pooler para `DATABASE_URL`, criar o bucket `originais` (privado) no Storage.
2. **Migrações**: `cd apps/web && DATABASE_URL=... npm run db:migrate`. Depois `SEED_EXEMPLOS=0 npm run db:seed`: carrega só matérias e fontes (em produção o seed nunca cria usuários nem concursos de exemplo).
   Conta da equipe: `npx tsx scripts/criar-admin.ts "Seu Nome" voce@avisoconcurso.com.br admin` (gera uma senha forte e mostra uma vez). `db:reset` só roda em banco local.
3. **Vercel**: importar o repositório com raiz `apps/web`, configurar as variáveis de `apps/web/.env.example`, domínio, e os crons do `vercel.json`.
4. **Resend**: domínio verificado para `avisos@avisoconcurso.com.br`.

## 3. App
1. `cd apps/mobile && npx eas login && npx eas init` (vincula o projeto Expo).
2. Credenciais de push: APNs (chave .p8 da Apple) e FCM (Firebase) no EAS.
3. `EXPO_PUBLIC_API_URL=https://avisoconcurso.com.br`.
4. `npx eas build -p all --profile production` e `npx eas submit`.
5. Fichas das lojas: textos e screenshots (ver `kit/` e `docs/screenshots/app/`).

## 4. Antes de abrir para o público (critérios de pronto do briefing)
- [ ] Rodar o coletor duas vezes não duplica concursos nem avisos (`npm test`).
- [ ] Toda notificação tem `url_oficial` que abre.
- [ ] Uma errata muda a data na agenda de quem acompanha e manda push só para essas pessoas.
- [ ] Matérias em comum batem com o conteúdo programático de 3 editais conferidos à mão.
- [ ] WhatsApp nunca passa de 10 por usuário por mês e nunca sai para o plano Aviso.
- [ ] 20 editais reais conferidos à mão batem com a extração em vagas, salário e datas.
- [ ] Teste completo de cobrança no sandbox do Asaas: teste de 3 dias → aviso 1 dia antes → cobrança no 4º dia → cancelamento.

## 5. Enquanto o app não está nas lojas
O link da bio leva para a landing, que capta o contato (`/api/v1/leads`, visível em `/admin/leads`) e manda o link do app no lançamento.
