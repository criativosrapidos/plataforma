# FocoMulta

App de metas com dinheiro em jogo: a pessoa cria a meta, coloca um valor por semana,
chama um amigo para fiscalizar e faz check-in com foto. Cumpriu, não paga nada.
Falhou, a multa vira doação para a instituição que ela escolheu.

| Pasta | O que tem |
| --- | --- |
| `mobile/` | App iOS/Android em Expo (React Native) + Expo Router |
| `supabase/migrations/` | Banco: tabelas, regras de acesso (RLS), regras da meta e avaliação diária |
| `supabase/functions/` | Edge Functions do Mercado Pago (gerar pagamento da multa e webhook) |
| `supabase/tests/` | Teste das regras do banco num Postgres embutido (PGlite) |
| `marketing/video/` | Vídeo "Como funciona" (1min51, vertical, com a ciência da aversão à perda), versão curta de 1 min e a fonte para gerar de novo |

## Como a meta funciona (regras no banco)

- Meta = título, comunidade, check-ins por semana (1 a 7), valor por semana (R$ 5 a R$ 1.000), duração em semanas e instituição.
- Check-in só vale para **hoje** (fuso de Brasília), com foto na pasta da própria pessoa, um por dia.
- Com fiscal: o check-in fica pendente até o fiscal confirmar. **Sem resposta em 24 h, vale.** Sem fiscal, vale direto.
- O fiscal entra com o código de 6 letras da meta (`aceitar_convite`) e não coloca dinheiro.
- Todo dia às 03:10 (Brasília) `avaliar_metas()` fecha as semanas: menos check-ins válidos que o combinado vira multa daquela semana.
- Multa aberta: 48 h para contestar (`contestar_multa`); enquanto houver multa aberta, a pessoa não cria meta nova.
- Pagamento pelo Mercado Pago (Pix ou cartão, Checkout Pro). O webhook confere a assinatura e consulta o pagamento na API antes de marcar como paga.

## Configurar

### 1. Supabase
1. Crie um projeto em supabase.com.
2. Aplique as migrations: `npx supabase link --project-ref SEU_REF` e `npx supabase db push`
   (ou cole os arquivos de `supabase/migrations/` no SQL Editor, na ordem).
3. Cadastre as instituições que vão receber as doações na tabela `instituicoes` (Table Editor).
4. Em Authentication > Providers, deixe Email ligado. Para testar rápido, dá para desligar "Confirm email".

### 2. Mercado Pago
1. Em mercadopago.com.br/developers, crie uma aplicação (Checkout Pro) e copie o Access Token.
2. Configure os segredos das funções:
   ```
   npx supabase secrets set MP_ACCESS_TOKEN=... MP_WEBHOOK_SECRET=... MP_SANDBOX=true
   npx supabase functions deploy mp-pagar-multa
   npx supabase functions deploy mp-webhook --no-verify-jwt
   ```
3. No painel do Mercado Pago, em Webhooks, cadastre
   `https://SEU-PROJETO.supabase.co/functions/v1/mp-webhook` (evento "Pagamentos") e copie a
   chave secreta para `MP_WEBHOOK_SECRET`.
4. Use `MP_SANDBOX=true` com credenciais de teste; troque para `false` em produção.

### 3. App
```
cd mobile
cp .env.example .env      # preencha URL e chave anon do Supabase
npm install
npx expo start            # abra no Expo Go ou num development build
```
Antes de subir mudanças: `npx tsc --noEmit` e `npx eslint src`.
Para publicar nas lojas: `npx eas-cli@latest build` (precisa de conta Apple e Google).

### Testes
```
cd supabase/tests && npm install && npm test        # regras do banco
deno test --allow-env supabase/functions/_shared    # assinatura do webhook
```

## Ainda não feito
- Cobrança automática no cartão salvo (hoje a pessoa paga a multa pelo link do Mercado Pago).
- Repasse para as instituições: o dinheiro entra na conta do Mercado Pago do FocoMulta e o repasse é manual.
- Modo Desafio entre amigos, plano Pro (R$ 14,90/mês), notificações push e lembrete de check-in.
- Painel para analisar contestações (por enquanto, mude o status da multa pelo Supabase).
