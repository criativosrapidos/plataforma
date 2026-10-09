# Criativos Rápidos — plataforma

Agência de marketing com IA, na palma da mão. Gera posts, carrosséis, vídeos e anúncios para Instagram com a cara da marca.

## Etapa atual: "primeira cara" (seção 7 do briefing)

Telas navegáveis com dados de exemplo (hamburgueria fictícia **Brasa Burger**). Ainda **sem backend, sem IA e sem pagamento**: tudo roda em memória no navegador.

| Rota | Tela |
| --- | --- |
| `/` | Página inicial: promessa, como funciona, recursos, planos, créditos, FAQ |
| `/cadastro`, `/entrar` | Cadastro (com escolha de plano) e login |
| `/onboarding` → `/onboarding/perfil` | Conectar Instagram/site e revisar o perfil da marca |
| `/app` | Painel: calendário do mês com status de cada peça |
| `/app/peca/[id]` | Peça: prévia, legenda editável, aprovar, ajustar, gerar de novo, baixar |
| `/app/marcas` | Lista e troca de marcas (Profissional) |
| `/app/plano` | Plano atual, créditos usados, compra de créditos, troca de plano |
| `/app/conta` | Conta |

Na tela **Plano** dá pra trocar de plano na hora e ver como cada um muda a plataforma (Grátis bloqueia vídeo/anúncio e põe marca d'água; Profissional libera várias marcas e link de aprovação).

## Rodar

```bash
npm install
npm run dev   # http://localhost:3000
```

## Demonstração publicável

```bash
npm run demo   # gera dist-demo/criativos-rapidos.html (site + plataforma num arquivo só)
```

Usa o mesmo código de `src/`, com um roteador em memória no lugar do roteamento do Next (`demo/`).

## Onde mexer

- `src/lib/plans.ts` — planos, preços, créditos e pacotes (fonte única).
- `src/lib/mock.ts` — dados de exemplo (conta > marcas > peças).
- `src/components/PecaPreview.tsx` — templates visuais das peças.
- `docs/ARQUITETURA.md` — plano de arquitetura, etapas e perguntas em aberto.
