# Aviso Concurso · monorepo

App de celular (Expo) + site/landing + área do cliente + painel admin + coletores. Especificação completa:
`kit/briefing/index.html` (briefing v2) e `docs/`. Tudo em **português do Brasil**: datas DD/MM/AAAA, valores R$ 8.500,00.

## Estrutura
- `packages/shared/src` — regras de negócio puras e tipos (planos, acesso, matching perfil × concurso, matérias em comum, lembretes, diff de errata, formatação, contrato da API em `api-types.ts`). **Fonte única** das regras: não duplique lógica de plano/limite em outro lugar.
- `apps/web` — Next.js 16 (App Router, Tailwind v4, TS). Site, landing, área do cliente (`/conta`), admin (`/admin`), API do app (`/api/v1`), jobs (`/api/cron`), webhooks.
  - `src/lib/db.ts` cliente Postgres (`postgres` / porsager). SQL direto com tagged templates, sem ORM.
  - `src/lib/auth/*` sessão JWT (jose) com tabela `sessions` (revogável). Cookie `ac_sessao` no site, `Authorization: Bearer` no app. `guards.ts`: `exigirLogin()` e `exigirAdmin()` para páginas.
  - `src/lib/api.ts` helpers: `rota()`, `ok()`, `lerJson(req, zodSchema)`, `exigirUsuario()`, `exigirAcesso(recurso)`, `exigirAdminApi()`, `ErroApi`.
  - `src/lib/repo/*` acesso a dados. `src/lib/billing` provedor de cobrança (mock/asaas). `src/lib/ai` IA.
  - `db/migrations/NNNN_nome.sql` migrações em ordem (`npm run db:migrate`). Nunca edite uma migração já commitada: crie outra.
  - `scripts/seed.ts` dados de desenvolvimento (concursos com `exemplo = true`).
- `apps/mobile` — Expo (React Native) + Expo Router. Consome `/api/v1`.

## Next.js 16
Leia `apps/web/node_modules/next/dist/docs/` antes de usar APIs que você não tem certeza. `middleware` agora é `proxy.ts`.
`params`/`searchParams`/`cookies()`/`headers()` são assíncronos. Cache Components está DESLIGADO (modelo dinâmico clássico).

## Rodar
```
service postgresql start            # Postgres local (user/senha/db: aviso)
cd apps/web && cp .env.example .env.local
npm run db:reset                    # recria schema + seed
npm run dev                         # http://localhost:3000
```
Logins de dev (senha `aviso1234`): admin@avisoconcurso.com.br (admin), editor@avisoconcurso.com.br (editor),
ana@exemplo.com (teste do plano Aprovado, acompanha 3 concursos), bruno@exemplo.com (sem plano).

Para parar o servidor, não use `pkill -f "next dev"` (mata o próprio shell): use `fuser -k 3000/tcp`.

## Regras que não podem quebrar
- Sem plano grátis. Sem teste ativo nem assinatura em dia → só a tela de planos (`calcularAcesso`).
- Todo aviso tem `url_oficial`. Nada de notícia sem fonte oficial, nada de política.
- Rodar coletor 2x não duplica concursos (`contests.dedup_key`, `raw_documents.hash`) nem avisos (`alerts.dedup_key` + canal).
- WhatsApp: só plano Aprovado, só "isenção/inscrição acaba amanhã", máx. 10/mês (`canaisPermitidos`).
- Pergunte ao edital: só Aprovado, 30/mês, responde só com base no edital citando item e página.
- Errata atualiza a agenda de quem acompanha e manda push só para essas pessoas.
- Concursos `exemplo = true` são só para desenvolvimento.

## Identidade visual
Azul caneta #1F3FD1, marca-texto #FFE14D (grifo; nunca texto amarelo em fundo claro), tinta #0F1530, papel #F5F6F1,
cards brancos, linha #E1E3EA, texto secundário #4F566E, aberto #0E8A45, encerra #D93A40. Barlow Condensed 800 caixa alta
nos títulos, Figtree na interface, JetBrains Mono em datas/valores/etiquetas. Toque ≥ 44px, contraste AA.
Tom: direto, de concurseiro para concurseiro; promete tranquilidade com datas, nunca aprovação. Sem emoji na interface.
Classes utilitárias prontas em `apps/web/src/app/globals.css`: `.card .btn .btn-sec .btn-marca .campo .etiqueta .rotulo .grifo .titulo`.
Logo: `apps/web/public/simbolo.svg` (bolinha de gabarito azul com "!" branco e ponto amarelo).
