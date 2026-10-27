// Camada de dados da plataforma: Supabase quando configurado, senão modo demonstração (localStorage).
// O modo demonstração também liga com ?demo=1 na URL (vale até fechar a aba), para mostrar o app a quem ainda não é cliente.
(function () {
  var C = window.CR_CONFIG || {};
  var SEM_CHAVES = !(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  var DEMO_FORCADO = false;
  try {
    var q = new URLSearchParams(location.search).get("demo");
    if (q === "1") sessionStorage.setItem("cr-demo", "1");
    if (q === "0") sessionStorage.removeItem("cr-demo");
    DEMO_FORCADO = sessionStorage.getItem("cr-demo") === "1";
  } catch (e) {}
  // Sem as chaves do Supabase o site roda em "modo lançamento": a home, /videos e /brief funcionam
  // e mandam os pedidos por e-mail (enviar.php, na HostGator); a área do cliente fica "em breve".
  var LANCAMENTO = SEM_CHAVES && !DEMO_FORCADO;
  var DEMO = SEM_CHAVES || DEMO_FORCADO;
  var BUCKET = "entregas";

  var TIPOS = { stories: "Stories", post: "Post", carrossel: "Carrossel", reels: "Reels", anuncio: "Anúncio", video: "Vídeo", outro: "Outro" };
  var STATUS = { aguardando: "Para aprovar", aprovado: "Aprovado", ajuste: "Em ajuste" };
  var CREDITOS = { stories: 1, post: 2, carrossel: 3, reels: 4, anuncio: 5 };

  // O que cada plano, pacote e vídeo inclui. É a mesma tabela da landing e dos contratos.
  var PLANOS = [
    { nome: "Sem plano", grupo: "", ajustes: 0 },
    { nome: "Presença", grupo: "plano", preco: "R$ 597/mês", ajustes: 1, papel: "Conteúdo pronto. Você posta.",
      qtd: { stories: 10, post: 9, carrossel: 6, reels: 3, anuncio: 2 }, posta: false, trafego: false,
      inclui: ["Legendas prontas", "Perfil completo", "Calendário de postagem pronto", "Você publica no seu tempo"] },
    { nome: "Crescimento", grupo: "plano", preco: "R$ 797/mês", ajustes: 2, papel: "Social media: a gente programa e posta.",
      qtd: { stories: 20, post: 12, carrossel: 9, reels: 6, anuncio: 3 }, posta: true, trafego: false,
      inclui: ["Legendas prontas", "Perfil completo", "A gente programa e posta"] },
    { nome: "Autoridade", grupo: "plano", preco: "R$ 997/mês", ajustes: 3, papel: "Social media + gestão de tráfego.",
      qtd: { stories: 30, post: 15, carrossel: 12, reels: 9, anuncio: 4 }, posta: true, trafego: true,
      inclui: ["Legendas prontas", "Perfil completo", "A gente programa e posta", "Gestão de tráfego pago", "Relatório mensal", "Bônus: calendário humanizado e sequência de stories que vende"] },
    { nome: "Largada", grupo: "pacote", preco: "R$ 97", ajustes: 1, qtd: { video: 2, anuncio: 1 }, papel: "3 anúncios: 2 vídeos e 1 arte.", inclui: ["2 vídeos pra anúncio", "1 arte pra anúncio"] },
    { nome: "Acelera", grupo: "pacote", preco: "R$ 297", ajustes: 2, qtd: { anuncio: 1 }, papel: "Identidade visual com 1 anúncio de brinde.", inclui: ["Identidade visual: logo, paleta, fontes, foto de perfil e destaques", "Brinde: 1 anúncio pronto"] },
    { nome: "Turbo", grupo: "pacote", preco: "R$ 497", ajustes: 3, papel: "Identidade visual completa, landing page e PDFs bônus.", inclui: ["Identidade visual completa", "Landing page completa", "PDFs bônus: boas práticas do Instagram e respostas prontas de vendas"] }
  ];
  // os agentes de IA que já vêm prontos (iguais aos do supabase/schema.sql)
  var AGENTES_INICIAIS = [
    {"nome": "Capitã Rápida", "cargo": "CEO", "area": "direcao", "genero": "f", "frequencia": "semanal", "fontes": ["crm", "clientes", "entregas", "relatorios", "financeiro", "instagram", "whatsapp", "agenda"], "saidas": ["alerta", "tarefa"], "missao": "Você dirige a Criativos Rápidos rumo a ser a maior agência de marketing do Brasil. Toda semana, olhe a agência inteira e diga as 3 a 5 prioridades: clientes em risco, dinheiro parado, vendas esfriando, gargalos na produção e oportunidades. Diga qual área resolve cada uma.", "autonomia": "aprovar"},
    {"nome": "Bússola", "cargo": "Estratégia e metas", "area": "direcao", "genero": "m", "frequencia": "semanal", "fontes": ["crm", "clientes", "financeiro", "relatorios"], "saidas": ["alerta", "tarefa"], "missao": "Acompanhe as metas da agência (clientes ativos, receita, cancelamentos, entregas no prazo) e diga, toda semana, se estamos no ritmo e o que mudar.", "autonomia": "aprovar", "chefe": "Capitã Rápida"},
    {"nome": "Fecha-Tudo", "cargo": "Diretor Comercial", "area": "comercial", "genero": "m", "frequencia": "semanal", "fontes": ["crm", "clientes", "financeiro", "whatsapp", "agenda"], "saidas": ["alerta", "tarefa"], "missao": "Você cuida de marketing e vendas. Toda semana, analise o funil (contatos, conversas no WhatsApp, reuniões, propostas, fechamentos), a taxa de cada etapa, o placar dos vendedores e os contatos parados. Diga o que fazer pra fechar mais.", "autonomia": "aprovar", "chefe": "Capitã Rápida"},
    {"nome": "Holofote", "cargo": "Marketing da agência", "area": "comercial", "genero": "f", "frequencia": "semanal", "fontes": ["crm", "relatorios", "instagram"], "saidas": ["tarefa", "alerta"], "missao": "Coordene o marketing da própria Criativos Rápidos em todas as redes: tema da semana, oferta em destaque e o que cada rede deve postar, pra trazer mais contatos pro WhatsApp.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Filtro", "cargo": "Instagram da agência", "area": "comercial", "genero": "f", "frequencia": "semanal", "fontes": ["instagram", "clientes"], "saidas": ["ideia", "tarefa"], "missao": "Cuide do perfil da própria Criativos Rápidos no Instagram: toda semana, proponha 7 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no Instagram, usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Dancinha", "cargo": "TikTok da agência", "area": "comercial", "genero": "f", "frequencia": "semanal", "fontes": ["clientes"], "saidas": ["tarefa"], "missao": "Cuide do perfil da própria Criativos Rápidos no TikTok: toda semana, proponha 7 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no TikTok, usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Gravata", "cargo": "LinkedIn da agência", "area": "comercial", "genero": "m", "frequencia": "semanal", "fontes": ["clientes", "relatorios"], "saidas": ["tarefa"], "missao": "Cuide do perfil da própria Criativos Rápidos no LinkedIn: toda semana, proponha 3 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no LinkedIn, usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Passarinho", "cargo": "X (Twitter) da agência", "area": "comercial", "genero": "m", "frequencia": "semanal", "fontes": ["clientes"], "saidas": ["tarefa"], "missao": "Cuide do perfil da própria Criativos Rápidos no X (Twitter): toda semana, proponha 10 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no X (Twitter), usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Play", "cargo": "YouTube da agência", "area": "comercial", "genero": "m", "frequencia": "semanal", "fontes": ["clientes"], "saidas": ["tarefa"], "missao": "Cuide do perfil da própria Criativos Rápidos no YouTube (Shorts e vídeos): toda semana, proponha 3 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no YouTube (Shorts e vídeos), usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Joinha", "cargo": "Facebook da agência", "area": "comercial", "genero": "m", "frequencia": "semanal", "fontes": ["clientes"], "saidas": ["tarefa"], "missao": "Cuide do perfil da própria Criativos Rápidos no Facebook: toda semana, proponha 3 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no Facebook, usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Pena", "cargo": "Blog da agência", "area": "comercial", "genero": "f", "frequencia": "semanal", "fontes": ["site", "clientes"], "saidas": ["tarefa"], "missao": "Escreva toda semana 1 artigo pro blog da Criativos Rápidos (título, estrutura e texto completo) sobre marketing pra pequenos negócios, pensado pra aparecer no Google.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Buscador", "cargo": "SEO e site", "area": "comercial", "genero": "m", "frequencia": "semanal", "fontes": ["site"], "saidas": ["tarefa"], "missao": "Analise o site da Criativos Rápidos e sugira melhorias de SEO pra aparecer no Google em buscas de agência de marketing e social media. Uma tarefa por melhoria, com o texto pronto.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Carteiro", "cargo": "E-mail e newsletter", "area": "comercial", "genero": "m", "frequencia": "semanal", "fontes": ["crm", "clientes"], "saidas": ["tarefa"], "missao": "Escreva a newsletter semanal da agência (pra contatos que se inscreveram) e as sequências de e-mail de quem pediu contato e ainda não fechou.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Turbinho", "cargo": "Anúncios da agência", "area": "comercial", "genero": "m", "frequencia": "semanal", "fontes": ["relatorios", "crm"], "saidas": ["alerta", "tarefa"], "missao": "Cuide dos anúncios da própria agência, principalmente os de clique pro WhatsApp: verba, públicos, criativos e custo por conversa. Diga o que pausar, o que escalar e o que testar.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Antena", "cargo": "Tendências e concorrentes", "area": "comercial", "genero": "f", "frequencia": "semanal", "fontes": ["crm", "clientes"], "saidas": ["tarefa", "ideia"], "missao": "Acompanhe o que está em alta no marketing pra pequenos negócios e o que as outras agências estão anunciando. Traga oportunidades de conteúdo e de oferta pra agência.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Megafone", "cargo": "Parcerias e indicações", "area": "comercial", "genero": "m", "frequencia": "semanal", "fontes": ["clientes", "crm"], "saidas": ["tarefa", "mensagem_whatsapp"], "missao": "Encontre parceiros que indicam clientes (contadores, sistemas, associações) e clientes satisfeitos que podem indicar. Escreva a abordagem de cada um.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Depoimento", "cargo": "Prova social", "area": "comercial", "genero": "f", "frequencia": "semanal", "fontes": ["clientes", "relatorios", "instagram"], "saidas": ["mensagem_whatsapp", "tarefa"], "missao": "Peça depoimentos e autorização de case pros clientes com bons resultados reais e organize os que já foram autorizados. Nunca escreva depoimento por ninguém.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Lili do Zap", "cargo": "Atendente (WhatsApp e site)", "area": "comercial", "genero": "f", "frequencia": "manual", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["mensagem_whatsapp"], "missao": "Você atende no WhatsApp e no chat do site quem chama a Criativos Rápidos. Responda rápido e simpático, entenda o negócio da pessoa (o que vende, pra quem, se já posta, se já anuncia), mostre como a gente ajuda e, quando houver interesse de verdade, passe pra um dos vendedores. Se a pessoa pedir pra falar com alguém, passe pra equipe.", "autonomia": "automatico", "etapa": "whatsapp", "chefe": "Fecha-Tudo"},
    {"nome": "Farejador", "cargo": "Prospecção", "area": "comercial", "genero": "m", "frequencia": "diaria", "fontes": ["crm"], "saidas": ["mensagem_whatsapp", "tarefa"], "missao": "Pra cada contato da lista de prospecção ainda não abordado, escreva uma primeira mensagem curta e personalizada pra equipe mandar do próprio celular, e sugira o melhor canal (Instagram, e-mail, LinkedIn ou ligação). Nunca mais de 20 por dia.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Termômetro", "cargo": "Qualificação de contatos", "area": "comercial", "genero": "f", "frequencia": "diaria", "fontes": ["crm", "whatsapp"], "saidas": ["alerta"], "missao": "Dê uma nota de 0 a 10 pra cada contato em aberto (quanto tem a cara do nosso cliente ideal e quanto está pronto pra comprar) e diga quais o time deve priorizar hoje.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Agendinha", "cargo": "Agendamento e pré-reunião", "area": "comercial", "genero": "f", "frequencia": "diaria", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["tarefa", "mensagem_whatsapp"], "missao": "Pra cada reunião marcada nos próximos 2 dias, prepare um resumo pra equipe (quem é, o negócio, as dores, o plano que faz sentido) e escreva o lembrete da reunião pro contato.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Trator", "cargo": "Vendedor direto", "area": "comercial", "genero": "m", "frequencia": "manual", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["mensagem_whatsapp"], "missao": "Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: direto e confiante: cria senso de oportunidade (vagas da agenda, começar este mês) e pede o fechamento logo, com firmeza e respeito, sem inventar promoção. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.", "autonomia": "automatico", "etapa": "vendas", "chefe": "Fecha-Tudo"},
    {"nome": "Conselheira", "cargo": "Vendedora consultiva", "area": "comercial", "genero": "f", "frequencia": "manual", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["mensagem_whatsapp"], "missao": "Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: consultiva: faz perguntas, entende o negócio a fundo e só então mostra o plano que resolve o problema dele. Sem pressa. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.", "autonomia": "automatico", "etapa": "vendas", "chefe": "Fecha-Tudo"},
    {"nome": "Amigão", "cargo": "Vendedor de relacionamento", "area": "comercial", "genero": "m", "frequencia": "manual", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["mensagem_whatsapp"], "missao": "Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: leve e bem-humorado, conversa como amigo e cria confiança antes de falar de plano. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.", "autonomia": "automatico", "etapa": "vendas", "chefe": "Fecha-Tudo"},
    {"nome": "Professor", "cargo": "Vendedor especialista", "area": "comercial", "genero": "m", "frequencia": "manual", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["mensagem_whatsapp"], "missao": "Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: especialista: explica como o marketing funciona (frequência, formatos, tráfego) com clareza técnica, mostra autoridade e ensina antes de vender. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.", "autonomia": "automatico", "etapa": "vendas", "chefe": "Fecha-Tudo"},
    {"nome": "Contadora de Histórias", "cargo": "Vendedora narradora", "area": "comercial", "genero": "f", "frequencia": "manual", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["mensagem_whatsapp"], "missao": "Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: narradora: usa histórias pra mostrar o antes e depois de um negócio parecido com o dele, deixando claro quando é um exemplo e sem inventar resultado de cliente. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.", "autonomia": "automatico", "etapa": "vendas", "chefe": "Fecha-Tudo"},
    {"nome": "Provocador", "cargo": "Vendedor desafiador", "area": "comercial", "genero": "m", "frequencia": "manual", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["mensagem_whatsapp"], "missao": "Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: desafiador: questiona com respeito o jeito que a pessoa faz marketing hoje, mostra o custo de ficar parado e propõe um caminho novo. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.", "autonomia": "automatico", "etapa": "vendas", "chefe": "Fecha-Tudo"},
    {"nome": "Resolve", "cargo": "Vendedora solucionadora", "area": "comercial", "genero": "f", "frequencia": "manual", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["mensagem_whatsapp"], "missao": "Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: solucionadora: descobre o problema principal (falta de cliente, de tempo, de conteúdo) e mostra exatamente qual parte do plano resolve cada um. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.", "autonomia": "automatico", "etapa": "vendas", "chefe": "Fecha-Tudo"},
    {"nome": "Negociador", "cargo": "Vendedor negociador", "area": "comercial", "genero": "m", "frequencia": "manual", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["mensagem_whatsapp"], "missao": "Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: negociador: entende o orçamento, oferece o plano ou pacote que cabe (começar pelo Largada, por exemplo) e chega num acordo bom pros dois, sem criar desconto que não existe. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.", "autonomia": "automatico", "etapa": "vendas", "chefe": "Fecha-Tudo"},
    {"nome": "Proposteiro", "cargo": "Propostas comerciais", "area": "comercial", "genero": "m", "frequencia": "diaria", "fontes": ["crm", "whatsapp", "agenda"], "saidas": ["tarefa"], "missao": "Pra cada contato que fez reunião ou pediu proposta, monte a proposta: diagnóstico do negócio, plano indicado da tabela, o que entra, próximos passos. Texto pronto pra virar a página da proposta.", "autonomia": "aprovar", "chefe": "Fecha-Tudo"},
    {"nome": "Mestre da Esteira", "cargo": "Diretor Operacional", "area": "operacional", "genero": "m", "frequencia": "diaria", "fontes": ["clientes", "entregas", "briefings", "instagram"], "saidas": ["alerta", "tarefa"], "missao": "Você cuida da entrega. Todo dia, veja se cada cliente está recebendo o que o plano promete, o que está parado na esteira ou esperando aprovação, ajustes pendentes e clientes sem briefing. Aponte o gargalo e quem resolve.", "autonomia": "aprovar", "chefe": "Capitã Rápida"},
    {"nome": "Tapete Vermelho", "cargo": "Onboarding", "area": "operacional", "genero": "f", "frequencia": "diaria", "fontes": ["clientes", "briefings", "financeiro"], "saidas": ["mensagem_whatsapp", "tarefa"], "missao": "Cuide de quem acabou de fechar: boas-vindas, link do briefing (criativosrapidos.com.br/brief), acesso ao app e o que acontece em seguida. Cobre gentilmente quem ainda não mandou o briefing.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Prontinho", "cargo": "Suporte e atendimento", "area": "operacional", "genero": "m", "frequencia": "diaria", "fontes": ["clientes", "entregas"], "saidas": ["mensagem_whatsapp", "alerta"], "missao": "Cuide do dia a dia dos clientes: dúvidas sobre o app, lembrete simpático pra quem tem conteúdo parado esperando aprovação e retorno pra quem pediu ajuste.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Sorriso", "cargo": "Sucesso do cliente", "area": "operacional", "genero": "f", "frequencia": "semanal", "fontes": ["clientes", "entregas", "relatorios", "financeiro", "instagram"], "saidas": ["mensagem_whatsapp", "alerta"], "missao": "Cuide da retenção: ache clientes com risco de cancelar (pouca aprovação, muitos ajustes, atraso no pagamento, resultado fraco) e clientes prontos pra subir de plano. Escreva a mensagem certa pra cada um.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Até Logo", "cargo": "Offboarding", "area": "operacional", "genero": "m", "frequencia": "semanal", "fontes": ["clientes", "financeiro"], "saidas": ["mensagem_whatsapp", "tarefa"], "missao": "Cuide de quem cancelou ou vai cancelar: entenda o motivo com uma pesquisa curta, entregue os arquivos, encerre com elegância e veja se dá pra recuperar com outro plano.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Trend", "cargo": "Tendências por nicho", "area": "operacional", "genero": "f", "frequencia": "semanal", "fontes": ["clientes", "briefings"], "saidas": ["ideia"], "missao": "Pra cada cliente, traga o que está em alta no nicho dele (formatos, temas, datas) e transforme em ideias de conteúdo.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Pauteiro", "cargo": "Estrategista de conteúdo", "area": "operacional", "genero": "m", "frequencia": "diaria", "fontes": ["clientes", "briefings", "ideias", "instagram"], "saidas": [], "missao": "Monte a pauta do mês de cada cliente com a quantidade exata do plano: um mix que vende (atrair, educar, provar e vender), usando o briefing, a marca, as ideias aprovadas e o que funcionou no Instagram.", "autonomia": "automatico", "etapa": "pauta", "chefe": "Mestre da Esteira"},
    {"nome": "Gancho", "cargo": "Roteirista", "area": "operacional", "genero": "f", "frequencia": "diaria", "fontes": ["clientes", "briefings"], "saidas": [], "missao": "Escreva o roteiro de cada reels, vídeo e carrossel: gancho nos 3 primeiros segundos, desenvolvimento curto e chamada pra ação. Reels de 15 a 30 segundos, carrossel de 5 a 8 slides.", "autonomia": "automatico", "etapa": "roteiro", "chefe": "Mestre da Esteira"},
    {"nome": "Caneta de Ouro", "cargo": "Copywriter", "area": "operacional", "genero": "m", "frequencia": "diaria", "fontes": ["clientes", "briefings"], "saidas": [], "missao": "Escreva a legenda e o texto da arte de cada conteúdo, no tom de voz da marca, com chamada pra ação clara. Texto de arte curto: no máximo 8 palavras no título.", "autonomia": "automatico", "etapa": "copy", "chefe": "Mestre da Esteira"},
    {"nome": "Pincel", "cargo": "Diretora de arte", "area": "operacional", "genero": "f", "frequencia": "diaria", "fontes": ["clientes"], "saidas": [], "missao": "Faça a direção de arte de cada post, carrossel, story e anúncio: formato, composição, elementos, cores da marca, fontes e destaque.", "autonomia": "automatico", "etapa": "arte", "chefe": "Mestre da Esteira"},
    {"nome": "Corta-Corta", "cargo": "Editor de vídeo", "area": "operacional", "genero": "m", "frequencia": "diaria", "fontes": ["clientes"], "saidas": [], "missao": "Faça o plano de edição de cada reels e vídeo: cortes segundo a segundo, texto na tela, legendas, trilha, ritmo e duração final.", "autonomia": "automatico", "etapa": "edicao", "chefe": "Mestre da Esteira"},
    {"nome": "Influ", "cargo": "Roteiros UGC e avatares", "area": "operacional", "genero": "f", "frequencia": "manual", "fontes": ["clientes", "briefings"], "saidas": ["tarefa"], "missao": "Escreva roteiros de vídeo no estilo UGC (pessoa falando pra câmera, depoimento, unboxing) pros clientes, prontos pra gravar com criadores ou avatares de IA.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Lupa", "cargo": "Revisor de qualidade", "area": "operacional", "genero": "m", "frequencia": "diaria", "fontes": ["clientes", "entregas"], "saidas": ["alerta"], "missao": "Revise as entregas recentes: erro de português, preço ou informação que não bate com o briefing, legenda fora do tom da marca. Aponte cada problema.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Relógio", "cargo": "Programação e postagem", "area": "operacional", "genero": "m", "frequencia": "diaria", "fontes": ["clientes", "entregas"], "saidas": ["alerta"], "missao": "Garanta que tudo aprovado tem data, horário e vai ao ar: aponte post aprovado sem data, Instagram desconectado e postagem que falhou.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Curtida", "cargo": "Social media dos clientes", "area": "operacional", "genero": "f", "frequencia": "semanal", "fontes": ["clientes", "instagram", "entregas"], "saidas": ["alerta", "ideia"], "missao": "Acompanhe o Instagram dos clientes: o que teve mais e menos curtidas e comentários, se os seguidores cresceram. Aponte o que funcionou e sugira ideias pra repetir.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Responde Aí", "cargo": "Comunidade dos clientes", "area": "operacional", "genero": "f", "frequencia": "semanal", "fontes": ["clientes", "instagram"], "saidas": ["tarefa"], "missao": "Sugira respostas pros comentários e mensagens que os clientes recebem nos posts, no tom da marca de cada um, e aponte dúvidas frequentes que viram conteúdo.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Radar", "cargo": "Estrategista de tráfego", "area": "operacional", "genero": "f", "frequencia": "manual", "fontes": ["clientes", "briefings", "relatorios"], "saidas": ["tarefa"], "missao": "Monte a estratégia de tráfego de cada cliente: objetivo, público, oferta, ângulos de copy, formatos (imagem, vídeo, carrossel) e por quê, duração dos vídeos, ganchos dos primeiros segundos, campanhas e orçamento de teste.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Turbo", "cargo": "Gestor de tráfego", "area": "operacional", "genero": "m", "frequencia": "semanal", "fontes": ["relatorios", "clientes"], "saidas": ["alerta", "tarefa"], "missao": "Analise os números dos anúncios de cada cliente. Aponte campanha cara demais, verba mal distribuída e o que testar. Seja específico.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Gráfica", "cargo": "Relatórios dos clientes", "area": "operacional", "genero": "f", "frequencia": "semanal", "fontes": ["relatorios", "entregas", "instagram"], "saidas": ["comentario_relatorio"], "missao": "Escreva o comentário do relatório do mês de cada cliente: o que foi bem, o que melhorar e o que testar no próximo mês, em linguagem simples.", "autonomia": "automatico", "chefe": "Mestre da Esteira"},
    {"nome": "Paleta", "cargo": "Marca dos clientes", "area": "operacional", "genero": "f", "frequencia": "semanal", "fontes": ["clientes", "briefings"], "saidas": ["tarefa"], "missao": "Confira se cada cliente tem a marca completa na plataforma (cores, fontes, tom de voz, logo) e proponha o que falta a partir do briefing.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Construtor", "cargo": "Landing pages", "area": "operacional", "genero": "m", "frequencia": "manual", "fontes": ["clientes", "briefings"], "saidas": ["tarefa"], "missao": "Escreva a estrutura e os textos das landing pages dos clientes que têm o pacote Turbo: título, seções, provas, oferta e chamada pro WhatsApp.", "autonomia": "aprovar", "chefe": "Mestre da Esteira"},
    {"nome": "Dona Ordem", "cargo": "Diretora Administrativa", "area": "administrativo", "genero": "f", "frequencia": "semanal", "fontes": ["clientes", "briefings", "site"], "saidas": ["alerta", "tarefa"], "missao": "Você cuida da organização: cadastros, contratos, processos, ferramentas, documentos, o time de agentes e a conformidade com a LGPD. Aponte o que está faltando ou desorganizado e quem resolve.", "autonomia": "aprovar", "chefe": "Capitã Rápida"},
    {"nome": "Carimbo", "cargo": "Cadastro e contratos", "area": "administrativo", "genero": "f", "frequencia": "semanal", "fontes": ["clientes", "briefings", "financeiro"], "saidas": ["tarefa"], "missao": "Confira se cada cliente tem cadastro completo (contato, plano, briefing, marca e contrato) e liste o que falta, cliente por cliente.", "autonomia": "aprovar", "chefe": "Dona Ordem"},
    {"nome": "Dr. Cláusula", "cargo": "Jurídico e LGPD", "area": "administrativo", "genero": "m", "frequencia": "semanal", "fontes": ["crm", "site"], "saidas": ["tarefa", "alerta"], "missao": "Cuide da conformidade: consentimento dos contatos antes de mensagens, pedidos de descadastro, política de privacidade e termos do site, cláusulas dos contratos. Não substitui advogado: aponte o que levar pra um.", "autonomia": "aprovar", "chefe": "Dona Ordem"},
    {"nome": "Engrenagem", "cargo": "Processos e automação", "area": "administrativo", "genero": "f", "frequencia": "semanal", "fontes": ["clientes", "entregas", "crm"], "saidas": ["tarefa"], "missao": "Encontre retrabalho e etapas lentas na jornada (venda, onboarding, produção, aprovação) e proponha como deixar mais automático.", "autonomia": "aprovar", "chefe": "Dona Ordem"},
    {"nome": "Painel", "cargo": "Indicadores da agência", "area": "administrativo", "genero": "m", "frequencia": "semanal", "fontes": ["crm", "clientes", "entregas", "financeiro", "relatorios"], "saidas": ["alerta"], "missao": "Monte o resumo semanal dos números da agência: novos clientes, cancelamentos, entregas no prazo, conversão de vendas, receita e custo. Compare com a semana anterior.", "autonomia": "aprovar", "chefe": "Dona Ordem"},
    {"nome": "Treinador", "cargo": "Time de agentes", "area": "administrativo", "genero": "m", "frequencia": "semanal", "fontes": ["clientes", "entregas", "crm"], "saidas": ["tarefa"], "missao": "Cuide do time de agentes de IA: veja quais rascunhos a equipe mais descarta ou edita e proponha como melhorar a função de cada agente.", "autonomia": "aprovar", "chefe": "Dona Ordem"},
    {"nome": "Chave", "cargo": "Ferramentas e acessos", "area": "administrativo", "genero": "m", "frequencia": "semanal", "fontes": ["clientes"], "saidas": ["tarefa", "alerta"], "missao": "Cuide das ferramentas e acessos: Instagram desconectado, conta de anúncio sem acesso, integrações paradas. Liste o que precisa ser reconectado.", "autonomia": "aprovar", "chefe": "Dona Ordem"},
    {"nome": "Arquivo", "cargo": "Documentos", "area": "administrativo", "genero": "f", "frequencia": "semanal", "fontes": ["clientes", "briefings"], "saidas": ["tarefa"], "missao": "Organize os documentos de cada cliente (briefing, marca, contrato, materiais) e aponte o que está faltando ou fora do lugar.", "autonomia": "aprovar", "chefe": "Dona Ordem"},
    {"nome": "Cofrinho", "cargo": "Diretora Financeira", "area": "financeiro", "genero": "f", "frequencia": "semanal", "fontes": ["financeiro", "clientes"], "saidas": ["alerta", "tarefa"], "missao": "Você cuida do dinheiro. Toda semana, mostre o previsto e o recebido no mês, as cobranças em atraso, mensalidades não lançadas, gastos e riscos de caixa.", "autonomia": "aprovar", "chefe": "Capitã Rápida"},
    {"nome": "Lembrete", "cargo": "Cobrança", "area": "financeiro", "genero": "m", "frequencia": "diaria", "fontes": ["financeiro", "clientes"], "saidas": ["mensagem_whatsapp"], "missao": "Escreva um lembrete educado pra cada cobrança em atraso, sem tom agressivo, oferecendo ajuda se o cliente já pagou.", "autonomia": "aprovar", "chefe": "Cofrinho"},
    {"nome": "Notinha", "cargo": "Faturamento", "area": "financeiro", "genero": "f", "frequencia": "semanal", "fontes": ["financeiro", "clientes"], "saidas": ["tarefa", "alerta"], "missao": "Confira se toda venda e mensalidade virou cobrança, com o valor do plano certo, e se cada pagamento recebido precisa de nota fiscal.", "autonomia": "aprovar", "chefe": "Cofrinho"},
    {"nome": "Conciliador", "cargo": "Conciliação", "area": "financeiro", "genero": "m", "frequencia": "semanal", "fontes": ["financeiro"], "saidas": ["alerta"], "missao": "Confira se cada cobrança marcada como paga bate com o que entrou na conta e aponte diferenças.", "autonomia": "aprovar", "chefe": "Cofrinho"},
    {"nome": "Boleto", "cargo": "Contas a pagar", "area": "financeiro", "genero": "m", "frequencia": "semanal", "fontes": ["financeiro"], "saidas": ["alerta", "tarefa"], "missao": "Acompanhe os gastos da agência (ferramentas, IA, anúncios, fornecedores): o que vence na semana e o que dá pra cortar.", "autonomia": "aprovar", "chefe": "Cofrinho"},
    {"nome": "Calculadora", "cargo": "Preço e margem", "area": "financeiro", "genero": "f", "frequencia": "semanal", "fontes": ["financeiro", "clientes", "entregas"], "saidas": ["alerta", "tarefa"], "missao": "Calcule quanto custa entregar cada plano (produção, IA, ferramentas) e se a margem está saudável. Avise quando um plano começar a dar prejuízo.", "autonomia": "aprovar", "chefe": "Cofrinho"},
    {"nome": "Bola de Cristal", "cargo": "Planejamento financeiro", "area": "financeiro", "genero": "f", "frequencia": "semanal", "fontes": ["financeiro", "clientes", "crm"], "saidas": ["alerta", "tarefa"], "missao": "Projete o caixa dos próximos 3 meses (mensalidades, vendas no funil, gastos) e diga quantos clientes precisamos fechar pra bater a meta.", "autonomia": "aprovar", "chefe": "Cofrinho"},
    {"nome": "Leão", "cargo": "Impostos e contador", "area": "financeiro", "genero": "m", "frequencia": "semanal", "fontes": ["financeiro"], "saidas": ["tarefa"], "missao": "Organize o que o contador precisa todo mês (recebimentos, notas, gastos) e lembre dos vencimentos de impostos. Não substitui o contador.", "autonomia": "aprovar", "chefe": "Cofrinho"}
  ];

  // rosto ilustrado de cada agente (SVG desenhado aqui, igual sempre pro mesmo nome)
  function avatar(nome, genero) {
    var h = 0; String(nome || "").split("").forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; });
    function pega(l, k) { return l[(h >>> k) % l.length]; }
    var pele = pega(["#F6D3B8", "#EDB98A", "#D08B5B", "#AE6B44", "#7A4A2D", "#5C3A26"], 0);
    var cabelo = pega(["#1E1A18", "#2E211B", "#4A3022", "#7A4E2D", "#B07A43", "#D8B27A", "#6E6E6E"], 3);
    var fundo = pega(["#FFD400", "#F2E6C9", "#CFE3F7", "#D8F0DF", "#F7D9D6", "#E3DDF7"], 6);
    var roupa = pega(["#101216", "#2B4C7E", "#7A2E2E", "#2E6B4A", "#5A4A8A", "#C26A1E"], 9);
    var f = genero === "f", estilo = (h >>> 12) % 3;
    var atras = f ? ["M14 30c0-14 8-22 18-22s18 8 18 22v18H14z", "M16 30c0-13 7-21 16-21s16 8 16 21v8c-3 2-6 3-8 3H24c-2 0-5-1-8-3z", "M15 31c0-14 8-23 17-23s17 9 17 23v24H15z"][estilo] : "";
    var topo = f ? ["M17 28c1-11 7-17 15-17s14 6 15 17c-5-6-11-8-15-8s-10 2-15 8z", "M18 27c2-10 7-15 14-15s12 5 14 15c-6-4-10-5-14-5s-8 1-14 5z", "M17 29c0-11 7-18 15-18s15 7 15 18c-4-7-9-9-15-9s-11 2-15 9z"][estilo]
      : ["M18 27c0-9 6-15 14-15s14 6 14 15c-2-4-7-6-14-6s-12 2-14 6z", "M19 25c1-8 6-12 13-12s12 4 13 12c-4-3-8-4-13-4s-9 1-13 4z", "M17 28c0-10 6-17 15-17s15 7 15 17l-2-3c-3 0-4-4-7-4s-4 3-6 3-3-3-6-3-4 4-7 4z"][estilo];
    return '<svg viewBox="0 0 64 64" class="av" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="' + fundo + '"/>' +
      (atras ? '<path d="' + atras + '" fill="' + cabelo + '"/>' : "") +
      '<path d="M12 64c1-11 9-17 20-17s19 6 20 17z" fill="' + roupa + '"/><rect x="27" y="38" width="10" height="10" rx="4" fill="' + pele + '"/>' +
      '<ellipse cx="32" cy="29" rx="13" ry="14" fill="' + pele + '"/><path d="' + topo + '" fill="' + cabelo + '"/>' +
      '<circle cx="27" cy="30" r="1.6" fill="#1E1A18"/><circle cx="37" cy="30" r="1.6" fill="#1E1A18"/>' +
      '<path d="M28 35.5c2.4 2 5.6 2 8 0" stroke="#7A3B2A" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  }
  function plano(nome) { return PLANOS.find(function (p) { return p.nome === nome; }) || PLANOS[0]; }

  // ---------------------------------------------------------------- utilidades
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    [].concat(kids || []).forEach(function (k) { if (k != null) n.appendChild(typeof k === "string" ? document.createTextNode(k) : k); });
    return n;
  }
  function data(d) {
    if (!d) return "";
    var s = String(d).slice(0, 10).split("-");
    return s.length === 3 ? s[2] + "/" + s[1] + "/" + s[0] : d;
  }
  var SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dataLonga(s) {
    if (!s) return "";
    var p = String(s).slice(0, 10).split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    var dif = Math.round((d - hoje) / 864e5);
    if (dif === 0) return "hoje";
    if (dif === 1) return "amanhã";
    if (dif === -1) return "ontem";
    return SEMANA[d.getDay()] + ", " + d.getDate() + " de " + MESES[d.getMonth()];
  }
  function inicioDoMes() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString(); }
  function toast(msg, erro) {
    var t = document.getElementById("toast");
    if (!t) { t = el("div", { id: "toast", role: "status" }); document.body.appendChild(t); }
    t.textContent = msg; t.className = "show" + (erro ? " erro" : "");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = ""; }, 3200);
  }
  function whats(texto) {
    return C.WHATSAPP ? "https://wa.me/" + C.WHATSAPP + (texto ? "?text=" + encodeURIComponent(texto) : "") : "";
  }
  function soDigitos(s) { return String(s || "").replace(/\D/g, ""); }
  function copiar(texto, ok) {
    try {
      navigator.clipboard.writeText(texto).then(function () { toast(ok || "Copiado"); }, function () { toast("Não deu pra copiar. Selecione o texto e copie.", true); });
    } catch (e) { toast("Não deu pra copiar. Selecione o texto e copie.", true); }
  }

  // Google Drive: transforma o link de compartilhar em prévia e em download direto
  function driveId(url) {
    var m = String(url || "").match(/\/d\/([\w-]{10,})/) || String(url || "").match(/[?&]id=([\w-]{10,})/);
    return m ? m[1] : null;
  }
  function linkPrevia(url) { var id = driveId(url); return id ? "https://drive.google.com/file/d/" + id + "/preview" : url; }
  function linkDownload(url) { var id = driveId(url); return id ? "https://drive.google.com/uc?export=download&id=" + id : url; }
  function tipoArquivo(nome) {
    var n = String(nome || "").toLowerCase().split("?")[0];
    if (/\.(mp4|mov|webm|m4v)$/.test(n)) return "video";
    if (/\.(png|jpe?g|webp|gif)$/.test(n)) return "imagem";
    if (/\.pdf$/.test(n)) return "pdf";
    return "arquivo";
  }
  function nomeArquivo(nome) { return nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_"); }

  // a função do Instagram devolve { error: "mensagem" } no corpo
  async function erroFuncao(e, qual) {
    try { var d = await e.context.json(); if (d && d.error) return d.error; } catch (x) {}
    return /Failed to send|fetch/i.test(e.message) ? "Não consegui falar com o servidor. A função do " + (qual || "Instagram") + " foi publicada no Supabase?" : e.message;
  }

  // ---------------------------------------------------------------- Supabase
  function apiSupabase() {
    var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
    function ok(r) { if (r.error) throw new Error(traduz(r.error.message)); return r.data; }
    function traduz(m) {
      if (/Invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
      if (/Email not confirmed/i.test(m)) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
      if (/already registered/i.test(m)) return "Esse e-mail já tem conta. Use Entrar ou Esqueci minha senha.";
      if (/Password should be/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
      if (/Failed to fetch|NetworkError/i.test(m)) return "Sem conexão. Confira sua internet e tente de novo.";
      return m;
    }
    return {
      demo: false,
      async usuario() { var r = await sb.auth.getSession(); return r.data.session ? r.data.session.user : null; },
      async entrar(email, senha) { ok(await sb.auth.signInWithPassword({ email: email, password: senha })); },
      async criarConta(email, senha, meta) {
        var d = ok(await sb.auth.signUp({ email: email, password: senha, options: { data: meta, emailRedirectTo: location.origin + "/app" } }));
        return { confirmar: !d.session };
      },
      async esqueci(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/entrar?nova=1" })); },
      async novaSenha(senha) { ok(await sb.auth.updateUser({ password: senha })); },
      aoMudarSessao(fn) { sb.auth.onAuthStateChange(function (ev) { fn(ev); }); },
      async sair() { await sb.auth.signOut(); },
      async perfil() {
        var u = await this.usuario(); if (!u) return null;
        return ok(await sb.from("perfis").select("*").eq("id", u.id).single());
      },
      async salvarPerfil(id, campos) { ok(await sb.from("perfis").update(campos).eq("id", id)); },
      async clientes() { return ok(await sb.from("perfis").select("*").order("criado_em", { ascending: false })); },
      async entregas(clienteId) {
        var q = sb.from("entregas").select("*").order("criado_em", { ascending: false });
        if (clienteId) q = q.eq("cliente_id", clienteId);
        return ok(await q);
      },
      async aprovar(id) { ok(await sb.from("entregas").update({ status: "aprovado", comentario: null }).eq("id", id)); },
      async pedirAjuste(entrega, comentario) {
        var u = await this.usuario();
        ok(await sb.from("ajustes").insert({ entrega_id: entrega.id, cliente_id: u.id, comentario: comentario }));
        ok(await sb.from("entregas").update({ status: "ajuste", comentario: comentario }).eq("id", entrega.id));
      },
      async ajustesNoMes(clienteId) {
        var r = await sb.from("ajustes").select("id", { count: "exact", head: true }).eq("cliente_id", clienteId).gte("criado_em", inicioDoMes());
        if (r.error) throw new Error(r.error.message);
        return r.count || 0;
      },
      async criarEntrega(campos, arquivo, aoProgredir, extras) {
        async function sobe(f) {
          var path = campos.cliente_id + "/" + Date.now() + "-" + nomeArquivo(f.name);
          if (aoProgredir) aoProgredir("Enviando " + f.name + "…");
          ok(await sb.storage.from(BUCKET).upload(path, f, { contentType: f.type, upsert: false }));
          return path;
        }
        if (arquivo) { campos.arquivo_path = await sobe(arquivo); campos.arquivo_nome = arquivo.name; }
        if (extras && extras.length) { campos.extras = []; for (var i = 0; i < extras.length; i++) campos.extras.push(await sobe(extras[i])); }
        return ok(await sb.from("entregas").insert(campos).select().single());
      },
      async urlExtras(entrega) {
        var out = [];
        for (var i = 0; i < (entrega.extras || []).length; i++) out.push(ok(await sb.storage.from(BUCKET).createSignedUrl(entrega.extras[i], 3600)).signedUrl);
        return out;
      },
      async instagramLink() { var r = await sb.functions.invoke("instagram/link", { method: "POST" }); if (r.error) throw new Error(await erroFuncao(r.error)); return r.data.url; },
      async instagramDesconectar() { var r = await sb.functions.invoke("instagram/desconectar", { method: "POST" }); if (r.error) throw new Error(await erroFuncao(r.error)); },
      async publicarAgora(id) { var r = await sb.functions.invoke("instagram/publicar", { method: "POST", body: { entrega_id: id } }); if (r.error) throw new Error(await erroFuncao(r.error)); return r.data.resultado; },
      async trocarArquivo(entrega, arquivo) {
        var path = entrega.cliente_id + "/" + Date.now() + "-" + nomeArquivo(arquivo.name);
        ok(await sb.storage.from(BUCKET).upload(path, arquivo, { contentType: arquivo.type }));
        if (entrega.arquivo_path) await sb.storage.from(BUCKET).remove([entrega.arquivo_path]);
        ok(await sb.from("entregas").update({ arquivo_path: path, arquivo_nome: arquivo.name, status: "aguardando" }).eq("id", entrega.id));
      },
      async editarEntrega(id, campos) { ok(await sb.from("entregas").update(campos).eq("id", id)); },
      async apagarEntrega(entrega) {
        if (entrega.arquivo_path) await sb.storage.from(BUCKET).remove([entrega.arquivo_path]);
        ok(await sb.from("entregas").delete().eq("id", entrega.id));
      },
      // link temporário (1 hora) do arquivo em alta qualidade
      async urlArquivo(entrega, baixar) {
        if (entrega.arquivo_path) {
          var d = ok(await sb.storage.from(BUCKET).createSignedUrl(entrega.arquivo_path, 3600, baixar ? { download: entrega.arquivo_nome || true } : undefined));
          return d.signedUrl;
        }
        return baixar ? linkDownload(entrega.link_externo) : linkPrevia(entrega.link_externo);
      },
      async enviarBriefing(b) {
        var u = await this.usuario(); if (u) b.cliente_id = u.id;
        ok(await sb.from("briefings").insert(b));
      },
      async briefings() { return ok(await sb.from("briefings").select("*").order("criado_em", { ascending: false })); },
      async statusBriefing(id, status) { ok(await sb.from("briefings").update({ status: status }).eq("id", id)); },
      async apagarBriefing(id) { ok(await sb.from("briefings").delete().eq("id", id)); },
      async enviarLead(l) { ok(await sb.from("leads").insert(l)); },
      async leads() { return ok(await sb.from("leads").select("*").order("criado_em", { ascending: false })); },
      async statusLead(id, status) { ok(await sb.from("leads").update({ status: status }).eq("id", id)); },
      async apagarLead(id) { ok(await sb.from("leads").delete().eq("id", id)); },
      async editarLead(id, campos) { ok(await sb.from("leads").update(campos).eq("id", id)); },
      async ajustes() { return ok(await sb.from("ajustes").select("*").order("criado_em", { ascending: false })); },
      // ideias de conteúdo: a agência sugere, o cliente aprova ou manda as dele
      async ideias(clienteId) { return ok(await doCliente(sb.from("ideias").select("*").order("criado_em", { ascending: false }), clienteId)); },
      async criarIdeia(campos) { return ok(await sb.from("ideias").insert(campos).select().single()); },
      async editarIdeia(id, campos) { ok(await sb.from("ideias").update(campos).eq("id", id)); },
      async apagarIdeia(id) { ok(await sb.from("ideias").delete().eq("id", id)); },
      // materiais: arquivos da marca, guias e documentos (sem cliente = vale pra todos)
      async materiais(clienteId) {
        var q = sb.from("materiais").select("*").order("criado_em", { ascending: false });
        if (clienteId) q = q.or("cliente_id.is.null,cliente_id.eq." + clienteId);
        return ok(await q);
      },
      async criarMaterial(campos, arquivo) {
        if (arquivo) {
          var path = (campos.cliente_id || "geral") + "/materiais/" + Date.now() + "-" + nomeArquivo(arquivo.name);
          ok(await sb.storage.from(BUCKET).upload(path, arquivo, { contentType: arquivo.type, upsert: false }));
          campos.arquivo_path = path; campos.arquivo_nome = arquivo.name;
        }
        return ok(await sb.from("materiais").insert(campos).select().single());
      },
      async apagarMaterial(m) {
        if (m.arquivo_path) await sb.storage.from(BUCKET).remove([m.arquivo_path]);
        ok(await sb.from("materiais").delete().eq("id", m.id));
      },
      async urlMaterial(m, baixar) {
        if (m.arquivo_path) return ok(await sb.storage.from(BUCKET).createSignedUrl(m.arquivo_path, 3600, baixar ? { download: m.arquivo_nome || true } : undefined)).signedUrl;
        return baixar ? linkDownload(m.link_externo) : m.link_externo;
      },
      // relatório do mês: os números de tráfego que a agência lança (os de conteúdo saem das entregas)
      async relatorios(clienteId) { return ok(await doCliente(sb.from("relatorios").select("*").order("mes", { ascending: false }), clienteId)); },
      async salvarRelatorio(campos) { ok(await sb.from("relatorios").upsert(campos, { onConflict: "cliente_id,mes" })); },
      // conexão com o Meta Ads (função supabase/functions/trafego)
      // agentes de IA (função supabase/functions/agentes)
      async agentes() { return ok(await sb.from("agentes").select("*").order("ordem").order("criado_em")); },
      async salvarAgente(a) { if (a.id) ok(await sb.from("agentes").update(a).eq("id", a.id)); else ok(await sb.from("agentes").insert(a)); },
      async apagarAgente(id) { ok(await sb.from("agentes").delete().eq("id", id)); },
      async rodarAgente(id) { var r = await sb.functions.invoke("agentes/rodar", { method: "POST", body: { agente_id: id } }); if (r.error) throw new Error(await erroFuncao(r.error, "agentes")); return r.data; },
      async perguntar(pergunta, clienteId) { var r = await sb.functions.invoke("agentes/perguntar", { method: "POST", body: { pergunta: pergunta, cliente_id: clienteId || null } }); if (r.error) throw new Error(await erroFuncao(r.error, "agentes")); return r.data.resposta; },
      async igMetricas(clienteId) { return ok(await doCliente(sb.from("ig_metricas").select("*").order("dia", { ascending: false }).limit(clienteId ? 40 : 400), clienteId)); },
      async atualizarMetricasIG() { var r = await sb.functions.invoke("instagram/metricas", { method: "POST" }); if (r.error) throw new Error(await erroFuncao(r.error)); return r.data.atualizados; },
      async producao(clienteId) { return ok(await doCliente(sb.from("producao").select("*").neq("etapa", "cancelado").order("data_sugerida", { ascending: true, nullsFirst: false }).limit(1000), clienteId)); },
      async editarProducao(id, c) { c.atualizado_em = new Date().toISOString(); ok(await sb.from("producao").update(c).eq("id", id)); },
      async briefingIA(texto) { var r = await sb.functions.invoke("agentes/briefing", { method: "POST", body: { texto: texto } }); if (r.error) throw new Error(await erroFuncao(r.error, "agentes")); return r.data; },
      // WhatsApp oficial, agenda e configurações
      async conversa(leadId) { return ok(await sb.from("whatsapp_mensagens").select("*").eq("lead_id", leadId).order("criado_em").limit(300)); },
      async enviarWhatsApp(leadId, texto) { var r = await sb.functions.invoke("whatsapp/enviar", { method: "POST", body: { lead_id: leadId, texto: texto } }); if (r.error) throw new Error(await erroFuncao(r.error, "WhatsApp")); },
      async primeiroContato(leadId) { var r = await sb.functions.invoke("whatsapp/contato", { method: "POST", body: { lead_id: leadId } }); if (r.error) throw new Error(await erroFuncao(r.error, "WhatsApp")); },
      async reunioes() { return ok(await sb.from("reunioes").select("*").order("inicio").limit(300)); },
      async salvarReuniao(r) { if (r.id) ok(await sb.from("reunioes").update(r).eq("id", r.id)); else ok(await sb.from("reunioes").insert(r)); },
      async config(chave) { var d = ok(await sb.from("configuracoes").select("valor").eq("chave", chave).maybeSingle()); return d ? d.valor : {}; },
      async salvarConfig(chave, valor) { ok(await sb.from("configuracoes").upsert({ chave: chave, valor: valor, atualizado_em: new Date().toISOString() })); },
      async importarLeads(lista) { ok(await sb.from("leads").insert(lista)); },
      async chatSite(historico, pagina) { var r = await sb.functions.invoke("whatsapp/chat", { method: "POST", body: { historico: historico, pagina: pagina } }); if (r.error) throw new Error(await erroFuncao(r.error, "chat")); return r.data; },
      async sugestoes() { return ok(await sb.from("agente_sugestoes").select("*").order("criado_em", { ascending: false }).limit(200)); },
      async editarSugestao(id, campos) { ok(await sb.from("agente_sugestoes").update(campos).eq("id", id)); },
      async trafegoContas() { var r = await sb.functions.invoke("trafego/contas", { method: "POST" }); if (r.error) throw new Error(await erroFuncao(r.error, "tráfego")); return r.data.contas; },
      async sincronizarTrafego(mes, clienteId) { var r = await sb.functions.invoke("trafego/sincronizar", { method: "POST", body: { mes: mes, cliente_id: clienteId || null } }); if (r.error) throw new Error(await erroFuncao(r.error, "tráfego")); return r.data.resultado; },
      // financeiro
      async cobrancas(clienteId) { return ok(await doCliente(sb.from("cobrancas").select("*").order("vencimento", { ascending: false }), clienteId)); },
      async criarCobranca(campos) { ok(await sb.from("cobrancas").insert(campos)); },
      async editarCobranca(id, campos) { ok(await sb.from("cobrancas").update(campos).eq("id", id)); },
      async apagarCobranca(id) { ok(await sb.from("cobrancas").delete().eq("id", id)); },
      // equipe da agência
      async equipe() { return ok(await sb.from("equipe").select("*").order("criado_em")); },
      async salvarMembro(m) { if (m.id) ok(await sb.from("equipe").update(m).eq("id", m.id)); else ok(await sb.from("equipe").insert(m)); },
      async apagarMembro(id) { ok(await sb.from("equipe").delete().eq("id", id)); }
    };
  }
  function doCliente(q, clienteId) { return clienteId ? q.eq("cliente_id", clienteId) : q; }

  // ---------------------------------------------------------------- modo demonstração
  function apiDemo() {
    var KEY = "cr-demo-v12";
    function dia(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
    function semente() {
      var cli = "demo-cliente", adm = "demo-admin", cli2 = "demo-cliente-2";
      var D = "assets/demo/", V = "assets/videos/";
      return {
        sessao: null,
        perfis: [
          { id: adm, email: "agencia@demo", nome: "Ana Cláudia", empresa: "Criativos Rápidos", whatsapp: "", plano: "Sem plano", ajustes_mes: 0, papel: "admin", criado_em: dia(-40) },
          { id: cli, email: "cliente@demo", nome: "Marina Souza", empresa: "Brasa Burger", whatsapp: "(61) 90000-0000", plano: "Crescimento", ajustes_mes: 2, papel: "cliente", instagram: "brasaburger", responsavel: "q1", criado_em: dia(-12),
            marca: { cores: ["#E4572E", "#1B1B1B", "#FFC145", "#FFF8EC"], fontes: "Títulos em Montserrat Black, textos em Inter", tom: "Informal, como amigo. Frases curtas.", palavras: "bora, fominha, chapa quente", evitar: "Prometer entrega em 10 minutos", obs: "" } },
          { id: cli2, email: "lis@demo", nome: "Letícia Ramos", empresa: "Lis Moda", whatsapp: "(61) 90000-0001", plano: "Largada", ajustes_mes: 1, papel: "cliente", criado_em: dia(-3) }
        ],
        entregas: [
          { id: "e1", cliente_id: cli, titulo: "Reels do combo duplo", tipo: "reels", legenda: "Tá com fome? 🍔 Combo duplo por R$ 34,90 toda terça e quarta. Burger duplo + batata + refri. Peça pelo link da bio!", data_postagem: dia(1), demo_url: V + "exemplo-hamburgueria.mp4", demo_capa: V + "exemplo-hamburgueria.jpg", arquivo_nome: "reels-combo-duplo.mp4", status: "aguardando", criado_em: dia(0) + "T10:00" },
          { id: "e2", cliente_id: cli, titulo: "Post do combo duplo", tipo: "post", legenda: "Duas carnes, queijo derretendo e preço de amigo. Combo duplo R$ 34,90, só terça e quarta.", data_postagem: dia(2), demo_url: D + "brasa-post-combo.jpg", arquivo_nome: "post-combo-duplo.jpg", status: "aguardando", criado_em: dia(0) + "T09:00" },
          { id: "e3", cliente_id: cli, titulo: "Stories delivery até 23h", tipo: "stories", legenda: "", data_postagem: dia(0), demo_url: D + "brasa-stories.jpg", arquivo_nome: "stories-delivery.jpg", status: "aprovado", hora_postagem: "18:00", publicar: true, criado_em: dia(-1) + "T15:00" },
          { id: "e4", cliente_id: cli, titulo: "Carrossel 3 motivos", tipo: "carrossel", legenda: "Salva pra lembrar na hora da fome 😋 Arrasta pro lado e vê os 3 motivos.", data_postagem: dia(-2), demo_url: D + "brasa-carrossel.jpg", arquivo_nome: "carrossel-3-motivos.jpg", status: "aprovado", hora_postagem: "12:00", publicado_em: dia(-2) + "T12:00", publicado_link: "https://www.instagram.com/", criado_em: dia(-3) + "T11:00" },
          { id: "e5", cliente_id: cli, titulo: "Anúncio frete grátis", tipo: "anuncio", legenda: "Frete grátis nos pedidos acima de R$ 50. Peça agora!", data_postagem: dia(4), demo_url: D + "brasa-anuncio.jpg", arquivo_nome: "anuncio-frete-gratis.jpg", status: "ajuste", comentario: "Trocar para frete grátis acima de R$ 60.", criado_em: dia(-1) + "T18:00" },
          { id: "e6", cliente_id: cli2, titulo: "Vídeo nova coleção", tipo: "video", legenda: "Nova coleção primavera-verão. Vestidos a partir de R$ 89.", data_postagem: dia(3), demo_url: V + "exemplo-moda.mp4", demo_capa: V + "exemplo-moda.jpg", arquivo_nome: "video-nova-colecao.mp4", status: "aguardando", criado_em: dia(0) + "T08:00" }
        ],
        ajustes: [{ id: "a1", entrega_id: "e5", cliente_id: cli, comentario: "Trocar para frete grátis acima de R$ 60.", criado_em: new Date().toISOString() }],
        briefings: [
          { id: "b1", cliente_id: cli, nome: "Marina Souza", empresa: "Brasa Burger", whatsapp: "(61) 90000-0000", plano: "Crescimento", status: "pronto", criado_em: dia(-10) + "T09:00",
            respostas: { campos: { primeiro: "combo duplo de terça e quarta", promo: "Aniversário da casa no fim do mês", assuntos: "Como a gente escolhe a carne e o ponto certo", cores: "laranja e preto", palavras: "bora, fominha", proibido: "Prometer entrega em 10 minutos", publico: "jovens de 18 a 35 anos do bairro" }, grupos: { tom: ["t1"], estilo: ["e3", "e5"], aparecer: ["a2"] } },
            texto: "*BRIEFING · CRIATIVOS RÁPIDOS*\n\n*Sobre*\n• Nome: Marina Souza\n• Empresa: Brasa Burger\n• Segmento: hamburgueria delivery\n\n*Negócio*\n• O que vende: hambúrgueres artesanais, combos e porções\n• Diferencial: carne moída na hora e entrega rápida\n\n*Cliente*\n• Quem é: jovens de 18 a 35 anos do bairro\n\n*Conteúdo*\n• Divulgar primeiro: combo duplo de terça e quarta" }
        ],
        leads: [
          { id: "l1", nome: "Rafael Lima", whatsapp: "(61) 98888-0000", empresa: "Barbearia do Rafa", interesse: "Crescimento", origem: "home", status: "novo", criado_em: dia(0) + "T11:30" },
          { id: "l2", nome: "Patrícia Alves", whatsapp: "(61) 97777-0000", empresa: "@doces.paty", interesse: "Largada", origem: "videos", status: "conversando", vendedor_id: "ag23", proximo_contato: dia(0), observacao: "Pediu exemplo de vídeo de confeitaria.", criado_em: dia(-1) + "T19:10" }
        ],
        ideias: [
          { id: "i1", cliente_id: cli, origem: "agencia", tipo: "reels", titulo: "Bastidores da chapa", descricao: "15 segundos mostrando a carne sendo moída na hora e indo pra chapa. Fecha com o combo duplo.", status: "sugerida", criado_em: dia(-1) + "T10:00" },
          { id: "i2", cliente_id: cli, origem: "agencia", tipo: "carrossel", titulo: "Monte seu burger ideal", descricao: "Carrossel interativo: pão, carne, queijo e molho. Último slide chama pro pedido.", status: "sugerida", criado_em: dia(-1) + "T10:05" },
          { id: "i3", cliente_id: cli, origem: "cliente", tipo: "post", titulo: "Aniversário da casa", descricao: "Queria um post avisando que no dia 30 tem sobremesa grátis no combo.", status: "nova", criado_em: dia(0) + "T08:40" },
          { id: "i4", cliente_id: cli, origem: "agencia", tipo: "stories", titulo: "Enquete: qual o molho da semana?", descricao: "Sequência de 3 stories com enquete.", status: "producao", criado_em: dia(-6) + "T10:00" }
        ],
        materiais: [
          { id: "m1", cliente_id: cli, categoria: "marca", titulo: "Logo Brasa Burger", descricao: "PNG com fundo transparente.", demo_url: D + "brasa-avatar.png", arquivo_nome: "logo-brasa.png", criado_em: dia(-11) + "T10:00" },
          { id: "m2", cliente_id: cli, categoria: "arquivo", titulo: "Fotos do cardápio", descricao: "As fotos que a gente usa nos conteúdos.", demo_url: D + "brasa-post-combo.jpg", arquivo_nome: "fotos-cardapio.jpg", criado_em: dia(-9) + "T10:00" }
        ],
        relatorios: [],
        cobrancas: [
          { id: "c1", cliente_id: cli, descricao: "Mensalidade Crescimento", valor: 797, vencimento: iso(new Date(new Date().getFullYear(), new Date().getMonth(), 10)), status: "paga", pago_em: iso(new Date(new Date().getFullYear(), new Date().getMonth(), 9)), forma: "PIX", criado_em: dia(-12) },
          { id: "c2", cliente_id: cli2, descricao: "Pacote Largada", valor: 97, vencimento: dia(-3), status: "paga", pago_em: dia(-3), forma: "Cartão", criado_em: dia(-3) }
        ],
        // os agentes de IA (os mesmos 10 do schema.sql) e exemplos do que eles deixam pra aprovar
        agentes: AGENTES_INICIAIS.map(function (a, k) {
          var chefe = a.chefe ? AGENTES_INICIAIS.findIndex(function (x) { return x.nome === a.chefe; }) : -1;
          return Object.assign({ id: "ag" + (k + 1), ativo: true, modelo: "claude-opus-5-5", ordem: k + 1, chefe_id: chefe >= 0 ? "ag" + (chefe + 1) : null, criado_em: dia(-5) }, a);
        }),
        // conversa de exemplo da atendente de IA no WhatsApp e a reunião que ela marcou
        mensagens: [
          { id: "w1", lead_id: "l2", direcao: "entrada", autor: "contato", texto: "Oi! Vi o anúncio de vocês. Faço doces por encomenda, vocês fazem vídeo pra confeitaria?", criado_em: dia(-1) + "T19:10" },
          { id: "w2", lead_id: "l2", direcao: "saida", autor: "ia", texto: "Oi, Patrícia! Fazemos sim 😊 Hoje você já posta seus doces no Instagram com frequência, ou está mais parado?", criado_em: dia(-1) + "T19:10" },
          { id: "w3", lead_id: "l2", direcao: "entrada", autor: "contato", texto: "Posto quando dá, mas não vende muito", criado_em: dia(-1) + "T19:14" },
          { id: "w4", lead_id: "l2", direcao: "saida", autor: "ia", texto: "Entendi! Que tal uma conversa rápida de 30 min com a equipe pra montar um plano? Tenho amanhã às 10:00 ou às 14:30.", criado_em: dia(-1) + "T19:15" },
          { id: "w5", lead_id: "l2", direcao: "entrada", autor: "contato", texto: "14:30 pode ser", criado_em: dia(-1) + "T19:20" },
          { id: "w6", lead_id: "l2", direcao: "saida", autor: "ia", texto: "Marcado pra amanhã às 14:30! Te mando o link aqui um pouco antes. Até lá 👋", criado_em: dia(-1) + "T19:20" }
        ],
        reunioes: [{ id: "r1", lead_id: "l2", nome: "Patrícia Alves", telefone: "(61) 97777-0000", inicio: dia(0) + "T17:30:00.000Z", fim: dia(0) + "T18:00:00.000Z", status: "marcada", marcada_por: "ia", observacao: "Confeitaria por encomenda, posta pouco, quer vender mais. Indicar Largada ou Presença.", criado_em: dia(-1) }],
        producao: [
          { id: "pr1", cliente_id: cli, mes: dia(0).slice(0, 8) + "01", tipo: "reels", titulo: "Do pedido à porta em 30 segundos", objetivo: "provar", data_sugerida: dia(5), etapa: "roteiro", criado_em: dia(-1) },
          { id: "pr2", cliente_id: cli, mes: dia(0).slice(0, 8) + "01", tipo: "carrossel", titulo: "3 erros que deixam o hambúrguer seco", objetivo: "educar", data_sugerida: dia(6), etapa: "copy", roteiro: "Slide 1: Seu hambúrguer sai seco? · Slide 2: Erro 1, carne magra demais · Slide 3: Erro 2, prensar na chapa · Slide 4: Erro 3, passar do ponto · Slide 5: Na Brasa é carne moída na hora · Slide 6: Peça o combo duplo", criado_em: dia(-2) },
          { id: "pr3", cliente_id: cli, mes: dia(0).slice(0, 8) + "01", tipo: "post", titulo: "Combo da semana", objetivo: "vender", data_sugerida: dia(7), etapa: "arte", legenda: "Duas carnes, queijo derretendo e preço de amigo. Peça pelo link da bio!", texto_arte: "COMBO DUPLO", criado_em: dia(-2) },
          { id: "pr4", cliente_id: cli, mes: dia(0).slice(0, 8) + "01", tipo: "reels", titulo: "Bastidores da chapa", objetivo: "atrair", data_sugerida: dia(8), etapa: "producao", roteiro: "0-3s: close da carne caindo na chapa, texto \"Isso aqui é sexta à noite\". 3-15s: montagem do burger. 15-20s: mordida. Fecha com o logo.", legenda: "Ouviu esse barulho? 🔥 Peça pelo link da bio.", texto_arte: "Sexta à noite", plano_edicao: "Vertical 1080x1920, 20s. Cortes a cada 2s no ritmo da batida; texto na tela nos 3 primeiros segundos; legenda automática; trilha animada sem voz.", criado_em: dia(-3) }
        ],
        sugestoes: [
          { id: "s1", agente_id: "ag19", tipo: "mensagem_whatsapp", prioridade: "alta", lead_id: "l1", titulo: "Primeira mensagem: Rafael Lima", status: "pendente", criado_em: dia(0) + "T09:00",
            conteudo: { texto: "Oi, Rafael! Aqui é da Criativos Rápidos. Vi que você se interessou pelo plano Crescimento pra Barbearia do Rafa. Hoje vocês já postam no Instagram com frequência ou está parado?" } },
          { id: "s2", agente_id: "ag45", tipo: "ideia", prioridade: "media", cliente_id: cli, titulo: "Do pedido à porta", status: "pendente", criado_em: dia(0) + "T09:01",
            conteudo: { formato: "reels", texto: "Cronômetro na tela: pedido chega, carne vai pra chapa, monta, embala e sai pro motoboy. Fecha com \"Peça pelo link da bio\"." } },
          { id: "s3", agente_id: "ag1", tipo: "alerta", prioridade: "alta", cliente_id: cli, titulo: "Brasa Burger com 2 conteúdos parados", status: "pendente", criado_em: dia(0) + "T09:02",
            conteudo: { texto: "Reels e post do combo duplo estão esperando aprovação e vão ao ar amanhã e quinta. Vale chamar a Marina hoje pra não atrasar o calendário." } }
        ],
        ig: [
          { cliente_id: cli, dia: dia(-7), seguidores: 2380, publicacoes: 140, posts: [] },
          { cliente_id: cli, dia: dia(0), seguidores: 2431, publicacoes: 143, posts: [
            { id: "p1", tipo: "IMAGE", legenda: "Salva pra lembrar na hora da fome 😋", data: dia(-2) + "T12:00:00", curtidas: 214, comentarios: 18, link: "https://www.instagram.com/" },
            { id: "p2", tipo: "VIDEO", legenda: "Delivery até 23h", data: dia(-4) + "T18:00:00", curtidas: 156, comentarios: 9, link: "https://www.instagram.com/" },
            { id: "p3", tipo: "IMAGE", legenda: "Frete grátis acima de R$ 50", data: dia(-6) + "T12:00:00", curtidas: 88, comentarios: 3, link: "https://www.instagram.com/" }] }
        ],
        equipe: [
          { id: "q1", nome: "Ana Cláudia", funcao: "Direção", email: "agencia@demo", whatsapp: "", cuida: ["relacionamento", "producao", "resultados"], ativo: true, criado_em: dia(-40) }
        ]
      };
    }
    function ler() { try { return JSON.parse(localStorage.getItem(KEY)) || semente(); } catch (e) { return semente(); } }
    function gravar(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
    var db = ler();
    ["leads", "ideias", "materiais", "relatorios", "cobrancas", "equipe", "sugestoes", "agentes", "ig", "producao", "mensagens", "reunioes"].forEach(function (k) { if (!db[k]) db[k] = []; });
    var mem = {}; // arquivos enviados nesta aba (não ficam salvos no modo demonstração)
    function salvar() { gravar(db); }
    function uid() { return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
    function espera() { return new Promise(function (r) { setTimeout(r, 120); }); }
    function achar(lista, id) { return db[lista].find(function (x) { return x.id === id; }); }
    function doCli(lista, clienteId) { return lista.filter(function (x) { return !clienteId || x.cliente_id === clienteId; }); }
    function ordena(lista) { return lista.slice().sort(function (a, b) { return a.criado_em < b.criado_em ? 1 : -1; }); }
    var ouvintes = [];
    return {
      demo: true,
      async usuario() { var p = db.sessao && achar("perfis", db.sessao); return p ? { id: p.id, email: p.email } : null; },
      async entrar(email) {
        await espera();
        var p = db.perfis.find(function (x) { return x.email === String(email).trim().toLowerCase(); });
        if (!p) throw new Error("Na demonstração use cliente@demo ou agencia@demo (qualquer senha).");
        db.sessao = p.id; salvar(); ouvintes.forEach(function (f) { f("SIGNED_IN"); });
      },
      async criarConta(email, senha, meta) {
        await espera();
        email = String(email).trim().toLowerCase();
        if (db.perfis.some(function (p) { return p.email === email; })) throw new Error("Esse e-mail já tem conta. Use Entrar.");
        var p = { id: uid(), email: email, nome: meta.nome, empresa: meta.empresa, whatsapp: meta.whatsapp, plano: "Sem plano", ajustes_mes: 0, papel: "cliente", criado_em: iso(new Date()) };
        db.perfis.push(p); db.sessao = p.id; salvar();
        return { confirmar: false };
      },
      async esqueci() { await espera(); },
      async novaSenha() { await espera(); },
      aoMudarSessao(fn) { ouvintes.push(fn); },
      async sair() { db.sessao = null; salvar(); },
      async perfil() { return (db.sessao && achar("perfis", db.sessao)) || null; },
      async salvarPerfil(id, campos) { Object.assign(achar("perfis", id), campos); salvar(); },
      async clientes() { return db.perfis.slice().reverse(); },
      async entregas(clienteId) {
        return db.entregas.filter(function (e) { return !clienteId || e.cliente_id === clienteId; })
          .sort(function (a, b) { return a.criado_em < b.criado_em ? 1 : -1; });
      },
      async aprovar(id) { var e = achar("entregas", id); e.status = "aprovado"; e.comentario = null; salvar(); },
      async pedirAjuste(entrega, comentario) {
        db.ajustes.push({ id: uid(), entrega_id: entrega.id, cliente_id: entrega.cliente_id, comentario: comentario, criado_em: new Date().toISOString() });
        var e = achar("entregas", entrega.id); e.status = "ajuste"; e.comentario = comentario; salvar();
      },
      async ajustesNoMes(clienteId) { var i = inicioDoMes(); return db.ajustes.filter(function (a) { return a.cliente_id === clienteId && a.criado_em >= i; }).length; },
      async criarEntrega(campos, arquivo, prog, extras) {
        await espera();
        var e = Object.assign({ id: uid(), status: "aguardando", publicar: true, criado_em: new Date().toISOString() }, campos);
        if (arquivo) { mem[e.id] = URL.createObjectURL(arquivo); e.arquivo_nome = arquivo.name; }
        if (extras && extras.length) { e.extras = extras.map(function (f, i) { mem[e.id + ":" + i] = URL.createObjectURL(f); return f.name; }); }
        db.entregas.push(e); salvar(); return e;
      },
      async urlExtras(entrega) { return (entrega.extras || []).map(function (x, i) { return mem[entrega.id + ":" + i] || (entrega.demo_extras || [])[i] || ""; }); },
      async instagramLink() {
        await espera();
        var p = achar("perfis", db.sessao); p.instagram = (p.empresa || "minhaempresa").toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, ""); salvar();
        return "app.html?ig=ok#conta";
      },
      async instagramDesconectar() { achar("perfis", db.sessao).instagram = null; salvar(); },
      async publicarAgora(id) {
        await espera();
        var e = achar("entregas", id), p = achar("perfis", e.cliente_id);
        if (!p.instagram) throw new Error("Esse cliente ainda não conectou o Instagram.");
        e.publicado_em = new Date().toISOString(); e.publicado_link = "https://www.instagram.com/" + p.instagram + "/"; e.publicacao_erro = null; salvar();
        return "publicado";
      },
      async trocarArquivo(entrega, arquivo) {
        var e = achar("entregas", entrega.id);
        mem[e.id] = URL.createObjectURL(arquivo); e.arquivo_nome = arquivo.name; e.demo_url = null; e.demo_capa = null; e.status = "aguardando"; salvar();
      },
      async editarEntrega(id, campos) { Object.assign(achar("entregas", id), campos); salvar(); },
      async apagarEntrega(entrega) { db.entregas = db.entregas.filter(function (x) { return x.id !== entrega.id; }); salvar(); },
      async urlArquivo(entrega, baixar) {
        if (mem[entrega.id]) return mem[entrega.id];
        if (entrega.demo_url) return entrega.demo_url;
        if (entrega.link_externo) return baixar ? linkDownload(entrega.link_externo) : linkPrevia(entrega.link_externo);
        return "";
      },
      async enviarBriefing(b) { await espera(); b.id = uid(); b.status = "novo"; b.criado_em = new Date().toISOString(); if (db.sessao) b.cliente_id = db.sessao; db.briefings.push(b); salvar(); },
      async briefings() { return db.briefings.slice().sort(function (a, b) { return a.criado_em < b.criado_em ? 1 : -1; }); },
      async statusBriefing(id, status) { achar("briefings", id).status = status; salvar(); },
      async apagarBriefing(id) { db.briefings = db.briefings.filter(function (b) { return b.id !== id; }); salvar(); },
      async enviarLead(l) { await espera(); l.id = uid(); l.status = "novo"; l.criado_em = new Date().toISOString(); db.leads.push(l); salvar(); },
      async leads() { return db.leads.slice().sort(function (a, b) { return a.criado_em < b.criado_em ? 1 : -1; }); },
      async statusLead(id, status) { achar("leads", id).status = status; salvar(); },
      async apagarLead(id) { db.leads = db.leads.filter(function (b) { return b.id !== id; }); salvar(); },
      async editarLead(id, campos) { Object.assign(achar("leads", id), campos); salvar(); },
      async ajustes() { return db.ajustes.slice(); },
      async ideias(clienteId) { return ordena(doCli(db.ideias, clienteId)); },
      async criarIdeia(c) { await espera(); var i = Object.assign({ id: uid(), criado_em: new Date().toISOString() }, c); db.ideias.push(i); salvar(); return i; },
      async editarIdeia(id, c) { Object.assign(achar("ideias", id), c); salvar(); },
      async apagarIdeia(id) { db.ideias = db.ideias.filter(function (x) { return x.id !== id; }); salvar(); },
      async materiais(clienteId) { return ordena(db.materiais.filter(function (m) { return !clienteId || !m.cliente_id || m.cliente_id === clienteId; })); },
      async criarMaterial(c, arquivo) {
        await espera();
        var m = Object.assign({ id: uid(), criado_em: new Date().toISOString() }, c);
        if (arquivo) { mem[m.id] = URL.createObjectURL(arquivo); m.arquivo_nome = arquivo.name; }
        db.materiais.push(m); salvar(); return m;
      },
      async apagarMaterial(m) { db.materiais = db.materiais.filter(function (x) { return x.id !== m.id; }); salvar(); },
      async urlMaterial(m, baixar) { return mem[m.id] || m.demo_url || (baixar ? linkDownload(m.link_externo) : m.link_externo) || ""; },
      async relatorios(clienteId) { return doCli(db.relatorios, clienteId).slice().sort(function (a, b) { return a.mes < b.mes ? 1 : -1; }); },
      async salvarRelatorio(c) {
        var r = db.relatorios.find(function (x) { return x.cliente_id === c.cliente_id && x.mes === c.mes; });
        if (r) Object.assign(r, c); else db.relatorios.push(Object.assign({ id: uid(), criado_em: new Date().toISOString() }, c));
        salvar();
      },
      async cobrancas(clienteId) { return doCli(db.cobrancas, clienteId).slice().sort(function (a, b) { return a.vencimento < b.vencimento ? 1 : -1; }); },
      async criarCobranca(c) { [].concat(c).forEach(function (x) { db.cobrancas.push(Object.assign({ id: uid(), status: "aberta", criado_em: new Date().toISOString() }, x)); }); salvar(); },
      async editarCobranca(id, c) { Object.assign(achar("cobrancas", id), c); salvar(); },
      async apagarCobranca(id) { db.cobrancas = db.cobrancas.filter(function (x) { return x.id !== id; }); salvar(); },
      async equipe() { return db.equipe.slice(); },
      async salvarMembro(m) { if (m.id) Object.assign(achar("equipe", m.id), m); else db.equipe.push(Object.assign({ id: uid(), ativo: true, criado_em: new Date().toISOString() }, m)); salvar(); },
      async apagarMembro(id) { db.equipe = db.equipe.filter(function (x) { return x.id !== id; }); salvar(); },
      async agentes() { return db.agentes.slice().sort(function (a, b) { return (a.ordem || 0) - (b.ordem || 0); }); },
      async salvarAgente(a) { if (a.id) Object.assign(achar("agentes", a.id), a); else db.agentes.push(Object.assign({ id: uid(), ativo: true, ordem: db.agentes.length + 1, criado_em: new Date().toISOString() }, a)); salvar(); },
      async apagarAgente(id) { db.agentes = db.agentes.filter(function (x) { return x.id !== id; }); salvar(); },
      async rodarAgente() { await espera(); throw new Error("Na demonstração os agentes não rodam. No site de verdade, este botão chama o agente e os rascunhos aparecem na caixa de aprovação."); },
      async perguntar() { await espera(); return "Na demonstração o assistente não está ligado. No site de verdade, ele responde com os dados da plataforma: entregas, relatórios, Instagram e financeiro."; },
      async igMetricas(clienteId) { return doCli(db.ig, clienteId).slice().sort(function (a, b) { return a.dia < b.dia ? 1 : -1; }); },
      async atualizarMetricasIG() { await espera(); throw new Error("Na demonstração não tem Instagram conectado."); },
      async sugestoes() { return ordena(db.sugestoes); },
      async conversa(leadId) { return db.mensagens.filter(function (m) { return m.lead_id === leadId; }); },
      async enviarWhatsApp() { await espera(); throw new Error("Na demonstração o WhatsApp oficial não está conectado."); },
      async primeiroContato() { await espera(); throw new Error("Na demonstração o WhatsApp oficial não está conectado."); },
      async reunioes() { return db.reunioes.slice().sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; }); },
      async salvarReuniao(r) { if (r.id) Object.assign(achar("reunioes", r.id), r); else db.reunioes.push(Object.assign({ id: uid(), status: "marcada", marcada_por: "equipe", criado_em: new Date().toISOString() }, r)); salvar(); },
      async config(chave) { return (db.config || {})[chave] || {}; },
      async salvarConfig(chave, valor) { db.config = db.config || {}; db.config[chave] = valor; salvar(); },
      async chatSite() { await espera(); return { resposta: "Na demonstração eu ainda não estou ligada 🙂 No site de verdade, eu tiro suas dúvidas, pego seu WhatsApp e já marco uma conversa com a equipe." }; },
      async importarLeads(lista) { lista.forEach(function (l) { db.leads.push(Object.assign({ id: uid(), status: "novo", criado_em: new Date().toISOString() }, l)); }); salvar(); },
      async producao(clienteId) { return doCli(db.producao, clienteId).filter(function (x) { return x.etapa !== "cancelado"; }).sort(function (a, b) { return (a.data_sugerida || "9") < (b.data_sugerida || "9") ? -1 : 1; }); },
      async editarProducao(id, c) { Object.assign(achar("producao", id), c); salvar(); },
      async briefingIA() { await espera(); throw new Error("Na demonstração a IA do briefing não está ligada. No site de verdade, ela lê o seu texto e preenche o formulário."); },
      async editarSugestao(id, c) { Object.assign(achar("sugestoes", id), c); salvar(); },
      async trafegoContas() { await espera(); throw new Error("Na demonstração não tem conta do Meta ligada. No site de verdade, a lista das contas de anúncio aparece aqui."); },
      async sincronizarTrafego() { await espera(); throw new Error("Na demonstração os números não vêm do Meta. No site de verdade, este botão puxa tudo sozinho."); },
      resetar() { db = semente(); mem = {}; salvar(); }
    };
  }

  var api = DEMO ? apiDemo() : apiSupabase();

  // modo lançamento: pedidos de contato e briefings vão por e-mail pelo enviar.php da hospedagem
  async function porEmail(tipo, dados) {
    var r = await fetch("enviar.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: tipo, dados: dados }) });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok || !j.ok) throw new Error(j.erro || "Não conseguimos enviar agora.");
  }
  if (LANCAMENTO) {
    api.enviarLead = function (l) { return porEmail("lead", l); };
    api.enviarBriefing = function (b) { return porEmail("briefing", { nome: b.nome, empresa: b.empresa, whatsapp: b.whatsapp, plano: b.plano, texto: b.texto }); };
  }

  // faixa de aviso no modo demonstração
  function avisoDemo() {
    if (!DEMO || document.getElementById("demo-bar")) return;
    if (LANCAMENTO) return;
    var kids = DEMO_FORCADO
      ? [el("span", {}, [el("b", { text: "Demonstração. " }), "Tudo aqui é exemplo, com marcas fictícias."]),
         el("button", { type: "button", text: "Sair da demonstração", onclick: function () { try { sessionStorage.removeItem("cr-demo"); } catch (e) {} location.href = "./"; } })]
      : [el("span", {}, [el("b", { text: "Demonstração. " }), "Entre como cliente@demo ou agencia@demo, com qualquer senha."]),
         el("button", { type: "button", text: "Recomeçar", onclick: function () { api.resetar(); location.reload(); } })];
    document.body.insertBefore(el("div", { id: "demo-bar" }, kids), document.body.firstChild);
  }

  // app instalável (PWA): registra o service worker e guarda o convite de instalação do Android/Chrome
  var convite = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); convite = e; document.dispatchEvent(new Event("cr-instalavel")); });
  function registrarApp() {
    try {
      if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost") && window.top === window.self)
        navigator.serviceWorker.register("/sw.js").catch(function () {});
    } catch (e) {}
  }
  function instalado() { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } }
  function ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }

  // ---------------------------------------------------------------- menu (barra lateral, barra de baixo e "Mais")
  // grupos: [[título ou "", [[id, rótulo, ícone], ...]], ...]; rodape: itens que ficam embaixo na lateral;
  // aba: ids que aparecem na barra de baixo do celular (o resto vai pro "Mais")
  function menu(o) {
    var todos = [];
    o.grupos.forEach(function (g) { todos = todos.concat(g[1]); });
    todos = todos.concat(o.rodape || []);
    function link(v, curto) {
      var a = el("a", { href: "#" + v[0], "data-v": v[0] }, [CR.ic(v[2]), el("span", { text: curto && v[3] ? v[3] : v[1] })]);
      a.appendChild(el("span", { class: "badge", hidden: true, "data-badge": v[0] }));
      return a;
    }
    var side = document.getElementById("nav-side");
    o.grupos.forEach(function (g) {
      if (g[0]) side.appendChild(el("span", { class: "grp", text: g[0] }));
      g[1].forEach(function (v) { side.appendChild(link(v)); });
    });
    var rod = document.getElementById("nav-rodape");
    if (rod) (o.rodape || []).forEach(function (v) { rod.appendChild(link(v)); });
    var tab = document.getElementById("nav-tab");
    o.aba.forEach(function (id) { var v = todos.find(function (x) { return x[0] === id; }); tab.appendChild(link(v, true)); });
    var resto = todos.filter(function (v) { return o.aba.indexOf(v[0]) < 0; });
    var sheet = el("dialog", { class: "mais", "aria-label": "Mais opções" });
    var lista = el("nav", { class: "mais-in" });
    var grupoDe = {};
    o.grupos.forEach(function (g) { g[1].forEach(function (v) { grupoDe[v[0]] = g[0]; }); });
    var ultimo = null;
    resto.forEach(function (v) {
      var g = grupoDe[v[0]] || "";
      if (g && g !== ultimo) lista.appendChild(el("span", { class: "grp", text: g }));
      else if (!g && ultimo) lista.appendChild(el("hr"));
      ultimo = g;
      var a = link(v); a.addEventListener("click", function () { sheet.close(); }); lista.appendChild(a);
    });
    sheet.appendChild(lista);
    sheet.addEventListener("click", function (ev) { if (ev.target === sheet) sheet.close(); });
    document.body.appendChild(sheet);
    var mais = el("a", { href: "#", "data-mais": "", role: "button" }, [CR.ic("menu"), el("span", { text: "Mais" })]);
    mais.appendChild(el("span", { class: "badge", hidden: true, "data-badge-mais": "" }));
    mais.addEventListener("click", function (ev) { ev.preventDefault(); sheet.showModal(); });
    tab.appendChild(mais);

    function ir(v) {
      if (!todos.some(function (x) { return x[0] === v; })) v = todos[0][0];
      todos.forEach(function (x) { var n = document.getElementById("v-" + x[0]); if (n) n.hidden = x[0] !== v; });
      document.querySelectorAll("[data-v]").forEach(function (a) { if (a.dataset.v === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      var m = document.querySelector("[data-mais]");
      if (resto.some(function (x) { return x[0] === v; })) m.setAttribute("aria-current", "page"); else m.removeAttribute("aria-current");
      if (sheet.open) sheet.close();
      window.scrollTo(0, 0);
      if (o.aoIr) o.aoIr(v);
    }
    window.addEventListener("hashchange", function () { ir(location.hash.slice(1)); });
    return {
      ir: ir,
      // n: { id: quantidade }
      badges: function (n) {
        document.querySelectorAll("[data-badge]").forEach(function (b) { var k = n[b.dataset.badge] || 0; b.textContent = k; b.hidden = !k; });
        var r = resto.reduce(function (t, v) { return t + (n[v[0]] || 0); }, 0);
        var b = document.querySelector("[data-badge-mais]"); b.textContent = r; b.hidden = !r;
      }
    };
  }

  // as respostas do /brief que ajudam a pensar ideias e a marca
  var BRIEF_GRUPOS = {
    tom: { t1: "Bem informal, como amigo", t2: "Simpático, mas profissional", t3: "Formal" },
    aparecer: { a1: "Topa aparecer nos vídeos", a2: "Às vezes aparece nos vídeos", a3: "Prefere não aparecer" },
    estilo: { e1: "Moderna", e2: "Elegante", e3: "Divertida", e4: "Minimalista", e5: "Popular", e6: "Premium", e7: "Acolhedora", e8: "Técnica / séria" }
  };
  function briefingResumo(b) {
    var r = (b && b.respostas) || {}, c = r.campos || {}, g = r.grupos || {};
    function grupo(k) { return (g[k] || []).map(function (id) { return (BRIEF_GRUPOS[k] || {})[id] || id; }).join(", "); }
    return {
      primeiro: c.primeiro || "", promo: c.promo || "", assuntos: c.assuntos || "", publico: c.publico || "",
      cores: c.cores || "", naocores: c.naocores || "", palavras: c.palavras || "", proibido: c.proibido || "", refs: c.refs || "",
      tom: grupo("tom"), estilo: grupo("estilo"), aparecer: grupo("aparecer")
    };
  }
  function reais(v) { return "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function precoNumero(p) { var m = String(p || "").replace(/\./g, "").match(/(\d+(?:,\d+)?)/); return m ? parseFloat(m[1].replace(",", ".")) : 0; }
  // contratado no mês para um plano mensal (soma das quantidades)
  function totalPlano(P) { return P && P.qtd ? Object.keys(P.qtd).reduce(function (t, k) { return t + P.qtd[k]; }, 0) : 0; }

  window.CR = {
    menu: menu, avatar: avatar, briefingResumo: briefingResumo, reais: reais, precoNumero: precoNumero, totalPlano: totalPlano,
    api: api, demo: DEMO, demoForcado: DEMO_FORCADO, lancamento: LANCAMENTO, config: C,
    el: el, data: data, dataLonga: dataLonga, iso: iso, MESES: MESES, SEMANA: SEMANA,
    toast: toast, whats: whats, copiar: copiar, soDigitos: soDigitos,
    TIPOS: TIPOS, STATUS: STATUS, CREDITOS: CREDITOS, PLANOS: PLANOS, plano: plano,
    tipoArquivo: tipoArquivo, linkPrevia: linkPrevia, avisoDemo: avisoDemo,
    registrarApp: registrarApp, instalado: instalado, ios: ios,
    podeInstalar: function () { return !!convite; },
    instalar: async function () { if (!convite) return false; convite.prompt(); var r = await convite.userChoice; convite = null; return r.outcome === "accepted"; },
    // manda para /entrar se não estiver logado; devolve o perfil. Na demonstração aberta pelo site, entra direto como cliente.
    async exigirLogin(papel) {
      if (LANCAMENTO) { location.replace("entrar.html"); return null; }
      var p = null;
      try { p = await api.perfil(); } catch (e) { p = null; }
      if (!p && DEMO_FORCADO) { await api.entrar(papel === "admin" ? "agencia@demo" : "cliente@demo"); p = await api.perfil(); }
      if (!p) { location.replace("entrar.html?volta=" + encodeURIComponent(location.pathname.split("/").pop() || "app.html")); return null; }
      if (papel === "admin" && p.papel !== "admin") { location.replace("app.html"); return null; }
      return p;
    }
  };
})();
