# Arquitetura e etapas — Fase 1 (Ferramenta)

> Proposta para aprovação. Decisão final de stack é do Wellington.

## Planos (definido na conversa de 08/10/2026)

O briefing previa "Negócio R$ 100/mês" e "Agência R$ 297/mês". Foi substituído por:

| Plano | Preço | Cobrança | Créditos/mês | Marcas | Usuários | Extras |
| --- | --- | --- | --- | --- | --- | --- |
| Grátis | R$ 0 | — | 10 | 1 | 1 | Sem vídeo/anúncio, marca d'água, não compra créditos |
| Básico | R$ 49,90/mês | Anual: R$ 598,80 (Pix) ou 12x cartão | 60 | 1 | 1 | Vídeo, anúncio, compra créditos |
| Profissional | R$ 99,90/mês | Anual: R$ 1.198,80 (Pix) ou 12x cartão | 200 | 5 | 3 | Link de aprovação, logo da agência (white-label) |

**Custo em créditos por peça:** post 1 · stories 1 · anúncio 1 · carrossel 2 · vídeo até 30s 4.
Créditos do plano renovam todo mês (mesmo no anual); créditos extras não expiram.
**Pacotes extras:** +20 por R$ 19,90 · +50 por R$ 39,90 · +120 por R$ 79,90.

Conta de custo (meta do briefing: até R$ 25 de API por cliente/mês): com ~R$ 0,10–0,15 por crédito (texto via Claude + render de template + TTS no vídeo), o Profissional cheio fica em ~R$ 20–30. Precisa validar com custo real nas primeiras semanas — o registro de custo por peça existe para isso.

## Stack proposta

- **Next.js (App Router) + TypeScript + Tailwind** — já usado na primeira cara.
- **Supabase** — Auth (e-mail/senha + link mágico), Postgres com RLS, Storage para os arquivos gerados.
- **Claude API** (Anthropic) — leitura do site/Instagram → perfil da marca; calendário do mês; textos das peças, legendas e hashtags. Saída em JSON estruturado que alimenta os templates.
- **Templates de imagem** — componentes React renderizados para PNG (Satori/`@vercel/og` ou Playwright). Imagem por IA só quando o template pedir.
- **Remotion** — vídeos de até 30s a partir de templates de motion + **TTS** para locução. Sem IA generativa de vídeo no MVP.
- **Pagamento recorrente com Pix e cartão** — Asaas, Pagar.me ou Mercado Pago (todos fazem assinatura + Pix no Brasil). Sugestão: Asaas.
- **Fila de geração** — jobs assíncronos (Supabase Queues/Inngest/Trigger.dev) para gerar o mês sem travar a tela.
- Chaves sempre em variáveis de ambiente (`.env.example`).

## Modelo de dados (conta > marcas > conteúdos)

```
contas         id, nome, plano_id, assinatura_status, ciclo_inicio, renova_em, logo_white_label
usuarios       id, conta_id, papel (dono|editor), email
planos         id, preco_mensal, creditos_mes, max_marcas, max_usuarios, flags (videos, anuncios, marca_dagua, link_aprovacao, white_label)
marcas         id, conta_id, nome, instagram, site, segmento, produtos[], cores[], logo_url, tom, publico
calendarios    id, marca_id, ano, mes, status
pecas          id, marca_id, calendario_id, data, hora, tipo, formato, template_id, conteudo_json, legenda, hashtags[], status (a_aprovar|aprovada|baixada), arquivo_url
geracoes       id, peca_id, conta_id, tipo (inicial|ajuste|regenerar), instrucao, creditos, custo_api_centavos, modelo, tokens_in, tokens_out, criado_em
creditos_mov   id, conta_id, tipo (renovacao|uso|compra|estorno), qtd, ref
pagamentos     id, conta_id, gateway, tipo (assinatura|pacote), valor, status
aprovacoes     id, marca_id, token, cliente_nome, decisoes_json      -- link de aprovação (Profissional)
```

Fases 2–4 entram sem quebrar isso: `parceiros`/`orcamentos` (audiovisual), `agencias` como contas que atendem outras contas (marketplace), `campanhas` (tráfego pago).

## Etapas de entrega (pequenas, cada uma rodando)

1. ✅ **Primeira cara** navegável com dados de exemplo (esta entrega).
2. Supabase: auth, cadastro, contas/marcas/peças no banco com RLS. Telas passam a ler do banco.
3. Leitura do site/Instagram com Claude → perfil da marca editável.
4. Geração do calendário do mês + legendas (Claude), com registro de custo por geração.
5. Templates: 5 de carrossel e 3 de vídeo (4:5 e 9:16), render de PNG e MP4 (Remotion + TTS).
6. Aprovação, ajuste, regenerar e download real (Storage).
7. Assinatura anual com Pix e cartão, renovação mensal de créditos, compra de pacotes.
8. Limites por plano + painel interno de custo por conta.

## Perguntas em aberto

1. **Preço anual:** confirmamos que R$ 49,90 e R$ 99,90 são **por mês, cobrados no ano** (R$ 598,80 e R$ 1.198,80)? Vai existir opção mensal mais cara?
2. **Créditos:** os números (10/60/200) e o peso por tipo de peça estão bons? Ajuste e "gerar de novo" consomem crédito (como na demo) ou dá alguns grátis por peça?
3. **Plano Grátis:** fica com marca d'água e sem vídeo? Precisa de verificação (WhatsApp) pra evitar abuso de contas?
4. **Leitura do Instagram:** via API oficial da Meta (exige login do cliente com conta profissional) ou só pelo site + prints/upload? Scraping é frágil e contra os termos.
5. **Gateway de pagamento:** alguma preferência (Asaas, Pagar.me, Mercado Pago)? Quem tem CNPJ/conta pra cadastrar?
6. **TTS:** voz em português — ElevenLabs, Azure ou Google? Custo por vídeo muda bastante.
7. **Domínio e hospedagem:** criativosrapidos.com.br? Vercel + Supabase?
8. **Logo oficial:** subir os arquivos de `/marca` no repositório (hoje há um SVG provisório).
9. **Reembolso de 7 dias** citado no FAQ: confirmar política (CDC exige para compra online).
