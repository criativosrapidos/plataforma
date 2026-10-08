# Arquitetura e etapas — Fase 1 (Ferramenta)

> Proposta para aprovação. Decisão final de stack é do Wellington.

## Planos (definido em 08/10/2026)

O briefing previa "Negócio R$ 100/mês" e "Agência R$ 297/mês". Foi substituído por:

| Plano | Anual | Mensal | Créditos/mês | Marcas | Usuários | Extras |
| --- | --- | --- | --- | --- | --- | --- |
| Grátis | R$ 0 | R$ 0 | 10 | 1 | 1 | Sem vídeo/anúncio, marca d'água, não compra créditos |
| Básico | R$ 499,90 (12x R$ 41,66) | R$ 49,90 | 60 | 1 | 1 | Vídeo, anúncio, compra créditos |
| Profissional | R$ 999,90 (12x R$ 83,33) | R$ 99,90 | 200 | 5 | 3 | Link de aprovação, logo da agência (white-label) |

O anual é o principal (≈ 2 meses grátis); o mensal existe como referência e opção sem fidelidade.
**Custo em créditos por peça:** post 1 · stories 1 · anúncio 1 · carrossel 2 · vídeo até 30s 4.
Créditos do plano renovam todo mês (mesmo no anual); créditos extras não expiram.
**Pacotes extras:** +20 por R$ 19,90 · +50 por R$ 39,90 · +120 por R$ 79,90.
Reembolso integral em até 7 dias da compra.

Custos e margem: ver `docs/CUSTOS.md`.

## Stack proposta

- **Next.js (App Router) + TypeScript + Tailwind** — já usado na primeira cara.
- **Supabase** — Auth (e-mail/senha + link mágico), Postgres com RLS, Storage para os arquivos gerados.
- **Claude API** (Anthropic) — leitura do site/Instagram → perfil da marca; calendário do mês; textos das peças, legendas e hashtags. Saída em JSON estruturado que alimenta os templates.
- **Templates de imagem** — componentes React renderizados para PNG (Satori/`@vercel/og` ou Playwright). Imagem por IA só quando o template pedir.
- **Remotion** — vídeos de até 30s a partir de templates de motion + locução com **ElevenLabs**. Sem IA generativa de vídeo no MVP.
- **Pagamento: HyperCash** (escolha dos sócios) — Pix e cartão em até 12x. Precisa ter API + webhook pra liberar o plano automaticamente; Asaas fica de reserva.
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

## Decidido

- Domínio: **criativosrapidos.com.br**
- Pagamento: **HyperCash** · Locução: **ElevenLabs**
- Reembolso: **7 dias**
- Preço anual: **R$ 499,90** e **R$ 999,90**

## Perguntas em aberto

1. **Mensal:** manter a opção mensal (R$ 49,90 / R$ 99,90) ou vender só anual?
2. **Créditos:** os números (10/60/200) e o peso por tipo de peça estão bons? Ajuste e "gerar de novo" consomem crédito (como na demo) ou dá alguns grátis por peça?
3. **Plano Grátis:** fica com marca d'água e sem vídeo? Exigir verificação por WhatsApp contra abuso?
4. **Leitura do Instagram:** API oficial da Meta (cliente faz login com conta profissional) ou só pelo site + upload de imagens?
5. **HyperCash:** tem API e webhook? Faz 12x? Quem antecipa e qual a taxa do parcelado?
6. **12x no cartão:** sem juros (a gente absorve a taxa) ou com juros (cliente paga)?
7. **Contador:** regime tributário (Simples anexo III ou V muda a margem).
8. **Logo oficial:** subir os arquivos de `/marca` no repositório (hoje há um SVG provisório).
