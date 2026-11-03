# Regras de negócio · Aviso Concurso

Cada regra tem um código (RN-xx) e aponta onde está implementada. A fonte única das regras puras é
`packages/shared/src` (`plans.ts`, `rules.ts`); o backend sempre decide, o app só exibe.

## Produto e escopo

- **RN-01 · O que a gente faz.** Lê diários oficiais e sites das bancas todo dia, avisa no celular e organiza a agenda de vários concursos com as matérias em comum. Não dá aula, não vende material, não faz inscrição pela pessoa.
- **RN-02 · Fonte oficial obrigatória.** Todo concurso e todo aviso têm `url_oficial` (Diário Oficial, órgão ou banca). Sem ato oficial com link, não existe aviso. (`contests.url_oficial not null`)
- **RN-03 · Sem política e sem achismo.** Não publicamos opinião, notícia sem fonte ou "previsão" sem ato. "Previsto" só com pedido/ato registrado.
- **RN-04 · Tom.** Prometemos tranquilidade com datas, nunca aprovação.

## Conta e acesso

- **RN-10 · Cadastro.** Nome, e-mail, senha (mín. 8) e aceite dos termos. E-mail único.
- **RN-10a · Tentativas.** Login: até 10 erros por e-mail e 30 por IP a cada 15 min (depois, 429); a resposta não revela se o e-mail tem conta. Cadastro: 10 por IP por hora. Formulário da landing: 20 por IP por hora.
- **RN-11 · Sem plano grátis.** Sem teste ativo nem assinatura em dia, o app mostra só a tela de planos. A API responde `402 assinatura_necessaria`. (`calcularAcesso`, `exigirAcesso`)
- **RN-12 · Teste de 3 dias.** Com o plano escolhido completo, exigindo cartão ou Pix automático cadastrado. **Um teste por pessoa e por e-mail**, mesmo depois de excluir a conta (guardamos só o hash do e-mail em `testes_usados`). Quem já testou assina direto: **o acesso só libera quando o provedor confirma o 1º pagamento** (até lá, status `inadimplente` sem acesso). (`assinar`, `jaUsouTeste`)
- **RN-13 · Cobrança no 4º dia.** Se não cancelar, a primeira cobrança acontece no fim do teste. Push e e-mail **1 dia antes** da cobrança. (job `cobrancas`, `subscriptions.aviso_cobranca_enviado_em`)
- **RN-14 · Cancelamento.** Cancelar a qualquer momento (cancela também a cobrança recorrente no provedor); continua usando até o fim do período pago (ou do teste). Sem multa. Enquanto o período vale, dá para **desfazer o cancelamento** (`POST /assinatura/reativar`), sem cobrança imediata: a próxima cobrança fica para o fim do período.
- **RN-15 · Inadimplência.** Cobrança falhou → status `inadimplente`, com **3 dias de tolerância** após o vencimento; depois, bloqueio (só tela de planos). (`DIAS_TOLERANCIA_INADIMPLENCIA`)
- **RN-16 · Troca de plano.** Upgrade e downgrade a qualquer momento; o novo valor vale a partir da próxima cobrança.
- **RN-17 · Uma assinatura viva por pessoa.** (índice único `subscriptions_uma_viva`). Checkout, cancelamento, reativação e cortesia são serializados por pessoa (duplo clique não cria duas cobranças). Quem já tem acesso em dia troca de plano em vez de assinar de novo; assinatura antiga sem acesso é cancelada no provedor antes da nova.
- **RN-18 · Venda pelo site.** A assinatura é vendida no site (Pix/cartão) para evitar a comissão das lojas, respeitando as regras vigentes da Apple e do Google.

## Planos

| | Aviso | Aprovado |
|---|---|---|
| Mensal / anual | R$ 9,90 / R$ 99 | R$ 19,90 / R$ 199 |
| Perfis de busca ilimitados, push na hora, lembretes de isenção e inscrição, erratas, agenda, matérias em comum, checklist | ✔ | ✔ |
| WhatsApp para prazo acabando | — | até 10/mês |
| Pergunte ao edital | — | 30/mês |
| Radar de previstos e autorizados | — | ✔ |
| Convocação com o nome no Diário Oficial | — | ✔ |

- **RN-20 · Recursos por plano** são checados no backend (`temRecurso`). Limites mensais contam pelo mês civil no fuso de Brasília e renovam no dia 1º, com reserva atômica (pedidos simultâneos não passam do limite). (`usoDoMes`)
- **RN-21 · Radar.** No app, previstos/autorizados/banca definida só aparecem (busca, novidades do Hoje) e só podem ser acompanhados no plano Aprovado. No site público (SEO) eles aparecem, com chamada para o plano.

## Perfil de busca e casamento

- **RN-30 · Perfis ilimitados**, cada um com: escolaridade, áreas, cargos, UFs (+ incluir nacionais), salário mínimo, bancas e palavras-chave. Pode pausar.
- **RN-31 · Casamento perfil × concurso** (`casarPerfil`): um concurso casa quando **todos os filtros preenchidos** batem; filtro vazio não restringe.
  - Escolaridade/área: interseção com as do concurso ou de algum cargo.
  - UF: UF do concurso no perfil; federais sem UF passam se "incluir nacionais".
  - Salário: o maior salário do concurso ≥ mínimo; concurso sem salário informado passa.
  - Banca: banca no perfil; concurso sem banca definida (previsto) passa.
  - Cargos/palavras-chave: algum termo aparece em cargo, órgão, título ou resumo (sem acento, sem caixa).
- **RN-32 · Um aviso por concurso por pessoa**, mesmo que vários perfis casem.

## Acompanhar, agenda, matérias e checklist

- **RN-40 · Acompanhar** um concurso exige plano ativo. Concurso despublicado pela equipe sai da agenda de quem acompanha, e a pessoa sempre consegue deixar de acompanhar. Cada concurso ganha uma cor (azul, roxo, petróleo, laranja, verde, vinho, cinza, nessa ordem) e um checklist padrão: pedir isenção, fazer inscrição, pagar boleto, conferir local de prova, documento com foto, caneta preta de tubo transparente. Itens podem ser marcados, editados, criados e apagados.
- **RN-41 · Agenda** junta isenção, inscrição, boleto, local de prova, prova, gabarito, recurso e resultado de todos os concursos acompanhados, filtrável por concurso.
- **RN-42 · Matérias em comum** (`materiasEmComum`): ordena pelo número de concursos em que a matéria cai e, no empate, pela soma de questões. A pessoa liga/desliga concursos no cálculo. Cada edital conta uma vez por matéria: sem cargo escolhido, vale o conteúdo geral do edital; com cargo escolhido, o do cargo.
- **RN-43 · Matérias canônicas.** Nomes diferentes nos editais ("Português", "Língua Portuguesa") viram a mesma matéria pela tabela de sinônimos. Matéria nova sem correspondência vai para revisão.

## Avisos

| Tipo | Quem recebe | Canais |
|---|---|---|
| Edital publicado | perfis que casam | push + no app |
| Autorizado / previsto (radar) | perfis que casam, **só Aprovado** | push + no app |
| Isenção acabando · Inscrição acabando | quem acompanha | push + no app; **WhatsApp na véspera, só Aprovado** |
| Errata (o que mudou) | **só quem acompanha** | push + no app |
| Local de prova · Prova amanhã · Gabarito · Resultado | quem acompanha | push + no app |
| Convocação nominal | Aprovado com autorização de busca nominal | push + no app |
| Cobrança amanhã | quem está em teste/renovação | push + e-mail |
| Resumo semanal | quem ativou | e-mail |

- **RN-50 · Push é o canal principal** (custo zero). Meta: aviso em até 1 hora após a publicação.
- **RN-51 · Lembretes de prazo** saem no dia da antecedência escolhida (1, 2, 3 ou 5 dias; padrão 3) **e** na véspera. Prova: na véspera. (`lembretesDoDia`)
- **RN-52 · WhatsApp** só no Aprovado, só "isenção/inscrição acaba amanhã", com consentimento e telefone, **máximo 10 por mês**; nunca para o plano Aviso. (`canaisPermitidos`)
- **RN-53 · Horário silencioso** (padrão 22:00–07:00) **adia** o push para o fim do silêncio; não descarta.
- **RN-54 · Sem acesso, sem aviso.** Teste vencido ou inadimplência além da tolerância: nenhum aviso de concurso sai.
- **RN-55 · Idempotência.** Cada aviso tem `dedup_key` (pessoa + concurso + tipo + referência) único por canal: rodar o job 2x não manda 2x.
- **RN-56 · Registro.** Todo aviso grava canal, status, horário de envio e custo.

## Coleta e qualidade dos dados

- **RN-60 · Fontes**: DOU via INLABS (diário, 6h), sites das 9 bancas (de hora em hora, detecção por hash, respeitando robots.txt), Querido Diário (municipais), diários estaduais (fase 2: SP, MG, RJ, BA, PR, RS, DF).
- **RN-61 · Original guardado** sempre (Storage), com URL e data. Documento repetido (mesmo hash) é ignorado.
- **RN-62 · Classificação** em: previsto, autorização, edital de abertura, retificação, homologação, resultado, convocação, outro.
- **RN-63 · Extração com IA** (Claude Haiku 5.5; Claude Sonnet 5.5 quando a confiança é baixa), validada por schema, com item e página de origem de cada campo.
- **RN-64 · Revisão humana.** Confiança abaixo do limiar (padrão 0,85) ou campo obrigatório faltando → fila de revisão no admin **antes** de qualquer aviso.
- **RN-65 · Deduplicação** por órgão + número do edital + ano (`chaveDedup`).
- **RN-66 · Errata** liga ao edital original, gera versão com o diff dos campos, atualiza as datas (a agenda de quem acompanha muda sozinha) e avisa só quem acompanha, dizendo o que mudou.

## Pergunte ao edital (Aprovado)

- **RN-70** Responde **só** com base no texto do edital, citando item e página. Se não estiver no edital, diz que não encontrou.
- **RN-71** 30 perguntas por mês; registra tokens e custo de cada pergunta.

## Privacidade (LGPD)

- **RN-80** WhatsApp só com consentimento explícito (data registrada em `whatsapp_optin_em`).
- **RN-81** Busca do nome em convocações só com autorização explícita e nome informado pela pessoa.
- **RN-82** A pessoa pode baixar todos os seus dados e excluir a conta: primeiro cancelamos a cobrança no provedor (se falhar, nada é apagado), depois anonimização e fim das sessões. Fica só o hash do e-mail, para não liberar outro teste grátis.
- **RN-83** Ações sensíveis da equipe ficam no `audit_log`.

## Papéis da equipe

- **Editor**: revisão, concursos, documentos, fontes, matérias.
- **Admin**: tudo do editor + usuários, financeiro, avisos, leads, configurações, auditoria.
