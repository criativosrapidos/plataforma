# Aviso Concurso · app (iOS, Android e web)

Expo SDK 58 · React Native 0.88 · React 19.3 · Expo Router 58 (rotas em `src/app`) · TypeScript · React Compiler ligado.
Consome a API `/api/v1` do `apps/web`. Regras e formatação vêm de `@aviso/shared` (`packages/shared/src`).

## Rodar em desenvolvimento

1. Backend (em outro terminal):
   ```
   service postgresql start
   cd apps/web && npm install && cp .env.example .env.local
   npm run db:reset && npm run dev -- -p 3004       # pare com: fuser -k 3004/tcp
   ```
   O app no navegador fala com a API em outra porta: `apps/web/src/proxy.ts` libera CORS para `/api/v1/*`
   (origens em `CORS_ORIGINS`, padrão `http://localhost:8081`).
2. App:
   ```
   cd apps/mobile && npm install
   cp .env.example .env.local                       # EXPO_PUBLIC_API_URL=http://localhost:3004
   npx expo start                                   # celular (development build) / emulador
   npx expo start --web --port 8081                 # navegador
   ```
   No celular físico, troque `localhost` pelo IP da máquina na rede em `EXPO_PUBLIC_API_URL`.
   Push não funciona no Expo Go: use um development build (`eas build --profile development`).

Logins de dev (senha `aviso1234`): `ana@exemplo.com` (teste do Aprovado, 3 concursos, avisos) e `bruno@exemplo.com` (sem plano → paywall).

## Variáveis

| Variável | Uso |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base da API. Dev `http://localhost:3004`; produção `https://avisoconcurso.com.br` (já nos perfis do `eas.json`). |
| `EXPO_PUBLIC_SITE_URL` | Site para assinatura/termos/privacidade. Vazio = mesma URL da API. |
| `EAS_PROJECT_ID` | Preenchido pelo `eas init`; necessário para o token de push. |
| `GOOGLE_SERVICES_JSON` | Variável de arquivo no EAS com o `google-services.json` (FCM, push no Android). |

## Estrutura

```
src/app/                 rotas (Expo Router)
  _layout.tsx            provedores, fontes, splash e a navegação protegida por etapa
  boas-vindas, entrar, cadastro      etapa "publico"
  assistente             etapa "perfil" (perfil de busca em 5 passos)
  planos                 etapa "planos" (paywall: teste de 3 dias, Pix automático ou cartão)
  (app)/(abas)/          Hoje (index), Agenda, Matérias, Concursos, Ajustes
  (app)/concurso/[id]/   detalhe e pergunte (Pergunte ao edital)
  (app)/avisos, (app)/perfis/
src/api/                 cliente HTTP tipado, endpoints e hooks do TanStack Query (otimistas)
src/contexto/            sessão (etapas), notificações push, upsell do Aprovado
src/componentes/         Texto, Botao, Card, Etiqueta, Chip, Cabecalho, EstadoVazio, Esqueleto, Toast, Folha...
src/lib/                 config, armazenamento (SecureStore / localStorage), haptics, push, formatação
src/tema.ts              cores, fontes, raios (identidade do CLAUDE.md)
```

A etapa vem de `/me`: sem token → `publico`; logo após o cadastro → `perfil` → `planos`; sem teste nem
assinatura em dia → só `planos` (sem plano grátis); com acesso → abas. Cada etapa libera só o seu grupo de
rotas com `Stack.Protected`. Respostas `402` revalidam `/me` (cai no paywall), `403 sem_acesso` abre o
upsell do Aprovado, `429` mostra o limite do mês.

`@aviso/shared` entra pelo Metro (`metro.config.js`: `watchFolders` + `extraNodeModules`) e pelo `paths` do
`tsconfig.json`. O app não faz parte de workspaces npm.

## Push e deep link

- A permissão só é pedida **depois do primeiro concurso acompanhado**, com uma folha explicando o porquê
  antes do pedido do sistema (repergunta no máximo a cada 3 dias). Se já houver permissão, o aparelho é
  registrado em silêncio ao entrar no app.
- O token Expo vai para `POST /api/v1/dispositivos` (`{ expo_push_token, plataforma }`); ao sair da conta,
  `DELETE /api/v1/dispositivos`.
- Canal Android `avisos` (também padrão no plugin). Ícone de notificação: `assets/images/notification-icon.png`.
- Payload esperado do backend (Expo Push API):
  ```json
  { "to": "ExponentPushToken[...]", "title": "Edital publicado: TJ BA", "body": "120 vagas · até R$ 8.900,00",
    "channelId": "avisos", "data": { "contest_id": "<uuid>", "url": "avisoconcurso://concurso/<uuid>" } }
  ```
  Tocar na notificação abre `/concurso/<id>` (por `data.contest_id` ou `data.url`); `avisoconcurso://avisos`
  abre a caixa de avisos. Se o app estiver bloqueado (sem login/teste), o destino espera a pessoa entrar.
- Scheme: `avisoconcurso`. Teste: `npx uri-scheme open avisoconcurso://concurso/<id> --android`
  (ou `xcrun simctl openurl booted avisoconcurso://concurso/<id>`).
- No navegador não há push: os avisos ficam no sino (Ajustes explica isso).

## Builds (EAS)

```
npm i -g eas-cli && eas login
eas init                                   # cria o projeto e o projectId (exporte EAS_PROJECT_ID)
eas credentials                            # chave APNs (iOS); FCM: suba o google-services.json como GOOGLE_SERVICES_JSON
eas build --profile development --platform android|ios   # dev client (push funciona)
eas build --profile preview --platform android           # APK interno apontando para produção
eas build --profile production --platform all            # lojas (versão gerida no EAS, autoIncrement)
eas submit --profile production
```
Bundle id / package: `br.com.avisoconcurso.app`. A assinatura é gerenciada no site (`/conta/assinatura`),
fora da loja, para evitar a taxa; confirme as regras da Apple e do Google antes de publicar.

## Web / PWA

```
EXPO_PUBLIC_API_URL=https://avisoconcurso.com.br npx expo export -p web     # gera dist/
npx serve -s dist                                                            # qualquer host estático com fallback para index.html
```
`web.output = "single"` (SPA). `public/index.html` e `public/manifest.json` trazem manifest, ícones e
`theme-color`. No backend, inclua a origem do PWA em `CORS_ORIGINS`.

## Ícones e splash

Gerados do símbolo da marca: `node scripts/gerar-icones.cjs` (Playwright) → `assets/images/*` e `public/icon-*.png`.

## Verificação

```
npx tsc --noEmit
npx expo lint
npx expo-doctor            # 3 checagens dependem de rede (exp.host / React Native Directory)
node scripts/capturas-web.cjs   # fluxos reais no navegador + capturas em docs/screenshots/app (banco recém-semeado)
```
