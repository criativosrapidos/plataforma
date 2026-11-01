# Aviso Concurso

**Você estuda. O Aviso Concurso vigia e organiza.** O app lê os diários oficiais e os sites das bancas todo dia, avisa no celular e junta todos os concursos da pessoa numa agenda só, com as matérias em comum.

| Parte | Onde |
|---|---|
| App (iOS, Android, web) | `apps/mobile` (Expo) |
| Site, landing, área do cliente, painel admin, API, coletores | `apps/web` (Next.js 16) |
| Regras de negócio e tipos compartilhados | `packages/shared` |
| Documentação | `docs/` · site map, regras de negócio, arquitetura, lançamento |
| Kit de lançamento (briefing, protótipo, Instagram, vídeo) | `kit/` |

## Rodar localmente

```bash
service postgresql start                       # ou qualquer Postgres 15+
cd apps/web
cp .env.example .env.local                     # ajuste DATABASE_URL se precisar
npm install
npm run db:reset                               # cria o schema e os dados de exemplo
npm run dev                                    # http://localhost:3000
```

Logins de desenvolvimento (senha `aviso1234`):

| E-mail | Papel |
|---|---|
| admin@avisoconcurso.com.br | admin (painel completo em `/admin`) |
| editor@avisoconcurso.com.br | editor (revisão e concursos) |
| ana@exemplo.com | assinante em teste do plano Aprovado, acompanha 3 concursos |
| bruno@exemplo.com | sem plano (cai na tela de planos) |

App: veja `apps/mobile/README.md`.

Testes: `cd apps/web && npm test`.

## Documentação
- [Site map](docs/01-site-map.md)
- [Regras de negócio](docs/02-regras-de-negocio.md)
- [Arquitetura](docs/03-arquitetura.md)
- [Lançamento](docs/04-lancamento.md)
