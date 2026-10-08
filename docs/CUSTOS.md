# Custos, créditos e margem

> Estimativa de outubro/2026 para decidir preço. Os números reais vêm do registro de custo por peça
> (tabela `geracoes`) assim que a geração estiver no ar. Revisar depois das primeiras 4 semanas.

## Como funcionam os créditos

- O crédito é só a **unidade de uso** que o cliente vê. Ele **já está incluso no preço do plano**.
- Quem paga a IA de verdade (Claude, ElevenLabs, servidor de vídeo) **somos nós**, por consumo.
  Cada peça gerada custa centavos pra gente; o crédito serve pra limitar quanto cada cliente pode gastar por mês.
- Os créditos do plano renovam todo mês. Se acabar, o cliente compra pacote extra (receita a mais, margem alta).

## Premissas

| Item | Valor usado |
| --- | --- |
| Dólar | R$ 5,50 (cotação ~R$ 5,12–5,20 + IOF e margem de segurança) |
| Texto (Claude Sonnet 5.5) | US$ 2 por milhão de tokens de entrada, US$ 10 por milhão de saída |
| Locução (ElevenLabs, modelo Multilingual) | ~US$ 0,10 por 1.000 caracteres (o Flash custa metade) |
| Render do vídeo (Remotion em servidor) | ~US$ 0,01–0,03 por vídeo de 30s |
| Impostos | ~6% (Simples Nacional — **confirmar com contador**, pode ser maior) |
| Gateway | ~1% no Pix; 4–5% no cartão (parcelado sem juros pode passar de 10% se antecipar) |

## Custo por peça (pra gente)

| Peça | Créditos | Custo estimado | Custo por crédito |
| --- | --- | --- | --- |
| Post / stories / anúncio | 1 | ~R$ 0,10 | R$ 0,10 |
| Carrossel (4–6 slides) | 2 | ~R$ 0,15 | R$ 0,08 |
| Vídeo até 30s (roteiro + locução + render) | 4 | ~R$ 0,50 | R$ 0,13 |

Fixo por marca por mês: calendário do mês ~R$ 0,55. Leitura do site/Instagram: ~R$ 0,50 uma vez.
**Conta pessimista: R$ 0,13 por crédito.** Imagem gerada por IA (quando o template pedir) soma ~R$ 0,20–0,40 por imagem.

## Margem por cliente/mês — pior caso (cliente usa 100% dos créditos)

| | Grátis | Básico anual | Profissional anual |
| --- | --- | --- | --- |
| Receita por mês | R$ 0 | R$ 41,66 (499,90 ÷ 12) | R$ 83,33 (999,90 ÷ 12) |
| Impostos + gateway (~11%) | — | − R$ 4,60 | − R$ 9,20 |
| IA (créditos × R$ 0,13) | − R$ 1,30 | − R$ 7,80 | − R$ 26,00 |
| Calendário + infra por cliente | − R$ 0,80 | − R$ 2,50 | − R$ 5,50 (5 marcas) |
| **Sobra** | **− R$ 2,10** | **≈ R$ 26,80 (64%)** | **≈ R$ 42,60 (51%)** |

Na prática, a maioria não usa todos os créditos, então a margem real tende a ser maior.
No mensal (R$ 49,90 / R$ 99,90) a sobra sobe ~R$ 7 e ~R$ 14.
Pacote extra de 20 créditos (R$ 19,90) custa ~R$ 2,60 de IA: **~75% de margem** depois de impostos e taxa.

Meta do briefing (até R$ 25 de custo de API por cliente/mês): Básico fica em ~R$ 8; Profissional em ~R$ 29 no pior caso
(200 créditos + calendário de 5 marcas). Baixar o Profissional pra 160 créditos fecha a meta (~R$ 24).

## Custos fixos (independem de cliente)

| Item | Por mês |
| --- | --- |
| Hospedagem do site (Vercel Pro) | ~R$ 110 |
| Banco + login + arquivos (Supabase Pro) | ~R$ 140 |
| ElevenLabs | por uso (planos pagos dão desconto por volume) |
| Domínio criativosrapidos.com.br | ~R$ 40/ano |
| **Total** | **~R$ 260/mês** |

Ponto de equilíbrio: ~10 clientes no Básico anual cobrem os fixos.

## Riscos a controlar

1. **Plano Grátis dá prejuízo** (~R$ 2 por usuário ativo/mês). Exigir confirmação por WhatsApp e limitar 1 conta por número.
2. **12x sem juros no cartão**: se o gateway antecipa, a taxa pode comer 10–15% do anual. Alternativa: 12x com juros pago pelo cliente.
3. **Reembolso de 7 dias** (obrigatório pelo CDC em compra online): os créditos gastos nesse período viram custo sem receita.
4. **Licença do Remotion**: gratuito pra empresas de até 3 pessoas; acima disso, licença paga.
