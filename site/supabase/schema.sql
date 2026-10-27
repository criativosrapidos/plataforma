-- Criativos Rápidos · banco de dados da plataforma
-- Cole tudo no Supabase em SQL Editor > New query > Run. Pode rodar de novo sem problema.

-- ============================================================ perfis
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  nome text,
  empresa text,
  whatsapp text,
  plano text default 'Sem plano',
  ajustes_mes int not null default 1,
  papel text not null default 'cliente' check (papel in ('cliente', 'admin')),
  criado_em timestamptz not null default now()
);

-- marca do cliente e quem da equipe cuida dele (a agência preenche)
alter table public.perfis add column if not exists marca jsonb;        -- { cores: [], fontes, tom, palavras, evitar, obs }
alter table public.perfis add column if not exists responsavel uuid;   -- id em public.equipe
alter table public.perfis add column if not exists meta_ad_account text; -- conta de anúncio no Meta (act_...), pro relatório de tráfego

-- cria o perfil automaticamente quando alguém cria a conta em /entrar
create or replace function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, email, nome, empresa, whatsapp)
  values (new.id, new.email,
          new.raw_user_meta_data ->> 'nome',
          new.raw_user_meta_data ->> 'empresa',
          new.raw_user_meta_data ->> 'whatsapp')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.novo_usuario();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin');
$$;

-- cliente só muda nome, empresa e WhatsApp; plano, ajustes e papel só a agência
-- (no SQL Editor auth.uid() é nulo, então lá tudo é permitido)
create or replace function public.protege_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.papel := old.papel; new.plano := old.plano; new.ajustes_mes := old.ajustes_mes; new.email := old.email; new.instagram := old.instagram;
    new.marca := old.marca; new.responsavel := old.responsavel; new.meta_ad_account := old.meta_ad_account;
  end if;
  return new;
end $$;

drop trigger if exists protege_perfil on public.perfis;
create trigger protege_perfil before update on public.perfis
  for each row execute function public.protege_perfil();

alter table public.perfis enable row level security;
drop policy if exists "perfil: ver" on public.perfis;
create policy "perfil: ver" on public.perfis for select using (id = auth.uid() or public.is_admin());
drop policy if exists "perfil: editar" on public.perfis;
create policy "perfil: editar" on public.perfis for update using (id = auth.uid() or public.is_admin());

-- ============================================================ entregas
create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfis (id) on delete cascade,
  titulo text not null,
  tipo text not null default 'post' check (tipo in ('stories', 'post', 'carrossel', 'reels', 'anuncio', 'video', 'outro')),
  legenda text,
  data_postagem date,
  arquivo_path text,          -- arquivo guardado no Supabase Storage (bucket "entregas")
  arquivo_nome text,
  link_externo text,          -- ou um link do Google Drive
  status text not null default 'aguardando' check (status in ('aguardando', 'aprovado', 'ajuste')),
  comentario text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists entregas_cliente on public.entregas (cliente_id, criado_em desc);

-- publicação automática no Instagram (veja a função supabase/functions/instagram)
alter table public.perfis add column if not exists instagram text;                         -- @ conectado, só leitura pro cliente
alter table public.entregas add column if not exists hora_postagem time default '10:00';   -- horário de Brasília
alter table public.entregas add column if not exists extras text[];                         -- demais imagens de um carrossel
alter table public.entregas add column if not exists publicar boolean not null default true; -- postar sozinho quando o cliente aprovar
alter table public.entregas add column if not exists publicado_em timestamptz;
alter table public.entregas add column if not exists publicado_link text;
alter table public.entregas add column if not exists publicacao_erro text;
alter table public.entregas add column if not exists ig_container text;                     -- vídeo ainda processando no Instagram

-- cliente só pode aprovar ou pedir ajuste (status + comentário); o resto só a agência
create or replace function public.protege_entrega() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.status not in ('aprovado', 'ajuste') then
      raise exception 'Status inválido';
    end if;
    new.cliente_id := old.cliente_id; new.titulo := old.titulo; new.tipo := old.tipo; new.legenda := old.legenda;
    new.data_postagem := old.data_postagem; new.arquivo_path := old.arquivo_path; new.arquivo_nome := old.arquivo_nome;
    new.link_externo := old.link_externo; new.hora_postagem := old.hora_postagem; new.extras := old.extras;
    new.publicar := old.publicar; new.publicado_em := old.publicado_em; new.publicado_link := old.publicado_link;
    new.publicacao_erro := old.publicacao_erro; new.ig_container := old.ig_container;
  end if;
  new.atualizado_em := now();
  return new;
end $$;

drop trigger if exists protege_entrega on public.entregas;
create trigger protege_entrega before update on public.entregas
  for each row execute function public.protege_entrega();

alter table public.entregas enable row level security;
drop policy if exists "entrega: ver" on public.entregas;
create policy "entrega: ver" on public.entregas for select using (cliente_id = auth.uid() or public.is_admin());
drop policy if exists "entrega: criar" on public.entregas;
create policy "entrega: criar" on public.entregas for insert with check (public.is_admin());
drop policy if exists "entrega: editar" on public.entregas;
create policy "entrega: editar" on public.entregas for update using (cliente_id = auth.uid() or public.is_admin());
drop policy if exists "entrega: apagar" on public.entregas;
create policy "entrega: apagar" on public.entregas for delete using (public.is_admin());

-- ============================================================ pedidos de ajuste (para contar o limite do mês)
create table if not exists public.ajustes (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references public.entregas (id) on delete cascade,
  cliente_id uuid not null references public.perfis (id) on delete cascade,
  comentario text not null,
  criado_em timestamptz not null default now()
);

alter table public.ajustes enable row level security;
drop policy if exists "ajuste: ver" on public.ajustes;
create policy "ajuste: ver" on public.ajustes for select using (cliente_id = auth.uid() or public.is_admin());
drop policy if exists "ajuste: pedir" on public.ajustes;
create policy "ajuste: pedir" on public.ajustes for insert with check (
  cliente_id = auth.uid()
  and exists (select 1 from public.entregas e where e.id = entrega_id and e.cliente_id = auth.uid())
);

-- ============================================================ briefings (o formulário /brief não exige login)
create table if not exists public.briefings (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.perfis (id) on delete set null,
  nome text,
  empresa text,
  whatsapp text,
  plano text,
  texto text,
  respostas jsonb,
  status text not null default 'novo' check (status in ('novo', 'em_producao', 'pronto')),
  criado_em timestamptz not null default now()
);
alter table public.briefings add column if not exists status text not null default 'novo';

alter table public.briefings enable row level security;
drop policy if exists "briefing: enviar" on public.briefings;
create policy "briefing: enviar" on public.briefings for insert to anon, authenticated
  with check (cliente_id is null or cliente_id = auth.uid());
drop policy if exists "briefing: ver" on public.briefings;
create policy "briefing: ver" on public.briefings for select using (cliente_id = auth.uid() or public.is_admin());
drop policy if exists "briefing: editar" on public.briefings;
create policy "briefing: editar" on public.briefings for update using (public.is_admin());
drop policy if exists "briefing: apagar" on public.briefings;
create policy "briefing: apagar" on public.briefings for delete using (public.is_admin());

-- ============================================================ leads (formulário "quero esse plano" da home e da landing de vídeos)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 120),
  whatsapp text not null check (char_length(whatsapp) between 8 and 30),
  empresa text check (char_length(empresa) <= 160),
  interesse text check (char_length(interesse) <= 80),
  origem text check (char_length(origem) <= 40),
  status text not null default 'novo' check (status in ('novo', 'conversando', 'fechou', 'perdido')),
  criado_em timestamptz not null default now()
);

alter table public.leads enable row level security;
drop policy if exists "lead: enviar" on public.leads;
create policy "lead: enviar" on public.leads for insert to anon, authenticated with check (status = 'novo');
drop policy if exists "lead: ver" on public.leads;
create policy "lead: ver" on public.leads for select using (public.is_admin());
drop policy if exists "lead: editar" on public.leads;
create policy "lead: editar" on public.leads for update using (public.is_admin());
drop policy if exists "lead: apagar" on public.leads;
create policy "lead: apagar" on public.leads for delete using (public.is_admin());

-- CRM: etapa "proposta enviada", anotação e data do próximo contato
alter table public.leads add column if not exists observacao text;
alter table public.leads add column if not exists proximo_contato date;
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check check (status in ('novo', 'conversando', 'proposta', 'fechou', 'perdido'));
drop policy if exists "lead: criar (agência)" on public.leads;
create policy "lead: criar (agência)" on public.leads for insert to authenticated with check (public.is_admin());


-- ============================================================ equipe da agência (os agentes de cada área)
create table if not exists public.equipe (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  funcao text,
  email text,
  whatsapp text,
  cuida text[] not null default '{}',   -- relacionamento, producao, resultados
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table public.equipe enable row level security;
drop policy if exists "equipe: agência" on public.equipe;
create policy "equipe: agência" on public.equipe for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================ ideias de conteúdo
-- a agência sugere (status sugerida) e o cliente diz se quer; o cliente também manda as dele (status nova)
create table if not exists public.ideias (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfis (id) on delete cascade,
  origem text not null default 'agencia' check (origem in ('agencia', 'cliente')),
  tipo text not null default 'post' check (tipo in ('stories', 'post', 'carrossel', 'reels', 'anuncio', 'video', 'outro')),
  titulo text not null check (char_length(titulo) between 1 and 160),
  descricao text check (char_length(descricao) <= 4000),
  referencia text check (char_length(referencia) <= 500),
  status text not null default 'sugerida' check (status in ('nova', 'sugerida', 'aprovada', 'producao', 'feita', 'descartada')),
  criado_em timestamptz not null default now()
);
create index if not exists ideias_cliente on public.ideias (cliente_id, criado_em desc);

-- o cliente só responde às sugestões (quero / agora não); o resto só a agência
create or replace function public.protege_ideia() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if old.status <> 'sugerida' or new.status not in ('aprovada', 'descartada') then
      raise exception 'Essa ideia não pode mais ser alterada';
    end if;
    new.cliente_id := old.cliente_id; new.origem := old.origem; new.tipo := old.tipo; new.titulo := old.titulo;
    new.descricao := old.descricao; new.referencia := old.referencia;
  end if;
  return new;
end $$;
drop trigger if exists protege_ideia on public.ideias;
create trigger protege_ideia before update on public.ideias for each row execute function public.protege_ideia();

alter table public.ideias enable row level security;
drop policy if exists "ideia: ver" on public.ideias;
create policy "ideia: ver" on public.ideias for select using (cliente_id = auth.uid() or public.is_admin());
drop policy if exists "ideia: criar" on public.ideias;
create policy "ideia: criar" on public.ideias for insert with check (
  public.is_admin() or (cliente_id = auth.uid() and origem = 'cliente' and status = 'nova')
);
drop policy if exists "ideia: editar" on public.ideias;
create policy "ideia: editar" on public.ideias for update using (cliente_id = auth.uid() or public.is_admin());
drop policy if exists "ideia: apagar" on public.ideias;
create policy "ideia: apagar" on public.ideias for delete using (public.is_admin());

-- ============================================================ materiais: marca, guias e arquivos (sem cliente = pra todos)
create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.perfis (id) on delete cascade,
  categoria text not null default 'arquivo' check (categoria in ('marca', 'guia', 'arquivo')),
  titulo text not null,
  descricao text,
  arquivo_path text,
  arquivo_nome text,
  link_externo text,
  criado_em timestamptz not null default now()
);
alter table public.materiais enable row level security;
drop policy if exists "material: ver" on public.materiais;
create policy "material: ver" on public.materiais for select to authenticated using (cliente_id is null or cliente_id = auth.uid() or public.is_admin());
drop policy if exists "material: agência" on public.materiais;
create policy "material: agência" on public.materiais for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================ relatório do mês (tráfego; os números de conteúdo saem das entregas)
create table if not exists public.relatorios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfis (id) on delete cascade,
  mes date not null,                 -- sempre o dia 1 do mês
  investido numeric(10, 2),
  alcance int,
  impressoes int,
  cliques int,
  conversas int,                     -- mensagens ou contatos que vieram dos anúncios
  seguidores int,                    -- seguidores novos no mês
  resumo text,
  link text,                         -- relatório completo (PDF, Drive, Looker…)
  criado_em timestamptz not null default now(),
  unique (cliente_id, mes)
);
alter table public.relatorios add column if not exists campanhas jsonb;          -- [{ nome, investido, alcance, cliques, conversas }]
alter table public.relatorios add column if not exists origem text;              -- 'meta' quando veio da conexão
alter table public.relatorios add column if not exists atualizado_em timestamptz;
alter table public.relatorios enable row level security;
drop policy if exists "relatório: ver" on public.relatorios;
create policy "relatório: ver" on public.relatorios for select using (cliente_id = auth.uid() or public.is_admin());
drop policy if exists "relatório: agência" on public.relatorios;
create policy "relatório: agência" on public.relatorios for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================ financeiro: cobranças (o cliente vê as dele)
create table if not exists public.cobrancas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfis (id) on delete cascade,
  descricao text not null,
  valor numeric(10, 2) not null check (valor >= 0),
  vencimento date not null,
  status text not null default 'aberta' check (status in ('aberta', 'paga', 'cancelada')),
  pago_em date,
  forma text,
  criado_em timestamptz not null default now()
);
create index if not exists cobrancas_venc on public.cobrancas (vencimento desc);
alter table public.cobrancas enable row level security;
drop policy if exists "cobrança: ver" on public.cobrancas;
create policy "cobrança: ver" on public.cobrancas for select using (cliente_id = auth.uid() or public.is_admin());
drop policy if exists "cobrança: agência" on public.cobrancas;
create policy "cobrança: agência" on public.cobrancas for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================ agentes de IA
-- cada agente tem uma função (missão), lê só as fontes marcadas e deixa RASCUNHOS que a agência aprova
create table if not exists public.agentes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cargo text,
  missao text not null,                       -- a função do agente, em linguagem normal
  fontes text[] not null default '{}',        -- crm, clientes, briefings, entregas, ideias, relatorios, financeiro, instagram, site
  saidas text[] not null default '{}',        -- mensagem_whatsapp, ideia, legenda, comentario_relatorio, alerta, tarefa
  frequencia text not null default 'manual' check (frequencia in ('manual', 'diaria', 'semanal')),
  modelo text not null default 'claude-opus-5-5',
  ativo boolean not null default true,
  ultima_execucao timestamptz,
  ultimo_resultado text,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
alter table public.agentes enable row level security;
drop policy if exists "agentes: agência" on public.agentes;
create policy "agentes: agência" on public.agentes for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.agente_sugestoes (
  id uuid primary key default gen_random_uuid(),
  agente_id uuid references public.agentes (id) on delete cascade,
  tipo text not null check (tipo in ('mensagem_whatsapp', 'ideia', 'legenda', 'comentario_relatorio', 'alerta', 'tarefa')),
  prioridade text not null default 'media' check (prioridade in ('alta', 'media', 'baixa')),
  cliente_id uuid references public.perfis (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  entrega_id uuid references public.entregas (id) on delete cascade,
  titulo text,
  conteudo jsonb not null,                    -- { texto, formato, detalhes, mes }
  status text not null default 'pendente' check (status in ('pendente', 'aprovada', 'descartada')),
  criado_em timestamptz not null default now()
);
create index if not exists agente_sugestoes_status on public.agente_sugestoes (status, criado_em desc);
alter table public.agente_sugestoes enable row level security;
drop policy if exists "agente: agência" on public.agente_sugestoes;
create policy "agente: agência" on public.agente_sugestoes for all using (public.is_admin()) with check (public.is_admin());

-- perguntas feitas ao assistente (pra limitar o uso por dia e acompanhar o custo)
create table if not exists public.assistente_perguntas (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid references public.perfis (id) on delete cascade,
  cliente_id uuid references public.perfis (id) on delete cascade,
  pergunta text not null,
  resposta text,
  tokens_entrada int,
  tokens_saida int,
  criado_em timestamptz not null default now()
);
alter table public.assistente_perguntas enable row level security;
drop policy if exists "assistente: ver" on public.assistente_perguntas;
create policy "assistente: ver" on public.assistente_perguntas for select using (autor_id = auth.uid() or public.is_admin());

-- organograma e esteira: área, chefe, passo da esteira que o agente executa e se age sozinho
alter table public.agentes add column if not exists area text;            -- direcao, comercial, operacional, administrativo, financeiro
alter table public.agentes add column if not exists chefe_id uuid references public.agentes (id) on delete set null;
alter table public.agentes add column if not exists etapa text;           -- pauta, roteiro, copy, arte, edicao (vazio = agente de rascunhos)
alter table public.agentes add column if not exists autonomia text not null default 'aprovar';
alter table public.agentes add column if not exists genero text;          -- f ou m, só pro desenho do avatar
alter table public.agentes drop constraint if exists agentes_autonomia_check;
alter table public.agentes add constraint agentes_autonomia_check check (autonomia in ('aprovar', 'automatico'));

-- o time inicial (só entra se a tabela estiver vazia; depois vocês editam no painel)
do $$
begin
  if exists (select 1 from public.agentes) then return; end if;
  insert into public.agentes (nome, cargo, area, genero, etapa, autonomia, frequencia, ordem, fontes, saidas, missao) values
  ('Helena Prado', 'CEO', 'direcao', 'f', null, 'aprovar', 'semanal', 1, array['crm','clientes','entregas','relatorios','financeiro','instagram'], array['alerta','tarefa'],
   'Você dirige a Criativos Rápidos. Toda semana, olhe a agência inteira e diga as 3 a 5 prioridades: clientes em risco, dinheiro parado, vendas esfriando, gargalos na produção e oportunidades. Diga qual diretoria resolve cada uma.'),
  ('Bruno Rocha', 'Diretor Comercial', 'comercial', 'm', null, 'aprovar', 'semanal', 2, array['crm','clientes','financeiro'], array['alerta','tarefa'],
   'Você cuida das vendas. Toda semana, analise o funil do CRM (novos, conversando, proposta, fechou, perdeu), a taxa de fechamento e os contatos parados. Diga o que o time comercial deve fazer pra fechar mais.'),
  ('Renata Teles', 'Diretora de Operações', 'operacional', 'f', null, 'aprovar', 'diaria', 3, array['clientes','entregas','briefings','instagram'], array['alerta','tarefa'],
   'Você cuida da produção e da entrega. Todo dia, veja se cada cliente está recebendo o que o plano promete no mês, o que está parado esperando aprovação, ajustes pendentes e clientes sem briefing. Aponte o gargalo e quem resolve.'),
  ('Ricardo Faria', 'Diretor Administrativo', 'administrativo', 'm', null, 'aprovar', 'semanal', 4, array['clientes','briefings','site'], array['alerta','tarefa'],
   'Você cuida da organização da agência: cadastro completo dos clientes (contato, plano, briefing, marca), contratos e o site da agência. Aponte o que está faltando ou desorganizado.'),
  ('Paula Siqueira', 'Diretora Financeira', 'financeiro', 'f', null, 'aprovar', 'semanal', 5, array['financeiro','clientes'], array['alerta','tarefa'],
   'Você cuida do dinheiro. Toda semana, mostre o previsto e o recebido no mês, as cobranças em atraso, clientes de plano mensal sem mensalidade lançada e riscos de caixa.'),
  ('Lívia Campos', 'Pré-vendas (SDR)', 'comercial', 'f', null, 'aprovar', 'diaria', 6, array['crm'], array['mensagem_whatsapp'],
   'Escreva a próxima mensagem de WhatsApp pra cada contato novo do CRM e pra quem tem retorno marcado pra hoje. Contato novo: apresente a Criativos Rápidos e faça uma pergunta sobre o negócio. Em andamento: retome a partir da anotação.'),
  ('Caio Nunes', 'Consultor de vendas', 'comercial', 'm', null, 'aprovar', 'diaria', 7, array['crm'], array['mensagem_whatsapp','tarefa'],
   'Cuide dos contatos em "conversando" e "proposta enviada": escreva a mensagem que leva pro fechamento, respondendo a objeção anotada e indicando o plano certo da tabela pro negócio dele.'),
  ('Gabriel Souza', 'Atendimento e sucesso do cliente', 'comercial', 'm', null, 'aprovar', 'diaria', 8, array['clientes','briefings','entregas','financeiro'], array['mensagem_whatsapp','alerta'],
   'Cuide da jornada do cliente: quem pagou e ainda não mandou o briefing recebe a mensagem com o link criativosrapidos.com.br/brief; quem tem conteúdo parado esperando aprovação recebe um lembrete simpático; quem pediu ajuste recebe retorno.'),
  ('Diego Alves', 'Estrategista de conteúdo', 'operacional', 'm', 'pauta', 'automatico', 'diaria', 9, array['clientes','briefings','ideias','instagram'], array[]::text[],
   'Monte a pauta do mês de cada cliente com a quantidade exata do plano: um mix que vende (atrair, educar, provar e vender), usando o briefing, a marca, as ideias aprovadas e o que funcionou no Instagram.'),
  ('Bianca Reis', 'Roteirista', 'operacional', 'f', 'roteiro', 'automatico', 'diaria', 10, array['clientes','briefings'], array[]::text[],
   'Escreva o roteiro de cada reels, vídeo e carrossel da pauta: gancho nos 3 primeiros segundos, desenvolvimento curto e chamada pra ação. Reels de 15 a 30 segundos, carrossel de 5 a 8 slides.'),
  ('Thiago Brandão', 'Copywriter', 'operacional', 'm', 'copy', 'automatico', 'diaria', 11, array['clientes','briefings'], array[]::text[],
   'Escreva a legenda e o texto da arte de cada conteúdo da pauta, no tom de voz da marca, com chamada pra ação clara. Texto de arte curto: no máximo 8 palavras no título.'),
  ('Camila Duarte', 'Diretora de arte', 'operacional', 'f', 'arte', 'automatico', 'diaria', 12, array['clientes'], array[]::text[],
   'Faça a direção de arte de cada post, carrossel, story e anúncio: formato, composição, elementos, cores da marca, fontes e o que fica em destaque, pra a arte sair pronta de primeira.'),
  ('Pedro Santana', 'Editor de vídeo', 'operacional', 'm', 'edicao', 'automatico', 'diaria', 13, array['clientes'], array[]::text[],
   'Faça o plano de edição de cada reels e vídeo: cortes segundo a segundo, texto na tela, legendas, trilha, ritmo e duração final, pensando em reter até o fim.'),
  ('Larissa Melo', 'Social media', 'operacional', 'f', null, 'aprovar', 'semanal', 14, array['clientes','instagram','entregas'], array['alerta','ideia'],
   'Acompanhe o Instagram dos clientes: quais posts tiveram mais e menos curtidas e comentários, se os seguidores cresceram ou caíram. Aponte o que funcionou e sugira ideias pra repetir.'),
  ('André Costa', 'Gestor de tráfego', 'operacional', 'm', null, 'aprovar', 'semanal', 15, array['relatorios','clientes'], array['alerta','tarefa'],
   'Analise os números dos anúncios de cada cliente (investido, alcance, cliques, conversas, campanhas). Aponte campanha cara demais, verba mal distribuída e o que testar. Seja específico.'),
  ('Natália Ribeiro', 'Estrategista de tráfego', 'operacional', 'f', null, 'aprovar', 'manual', 16, array['clientes','briefings','relatorios'], array['tarefa'],
   'Monte a estratégia de tráfego de cada cliente com tráfego pago: objetivo, público, oferta, ângulos de copy, formatos (imagem, vídeo, carrossel) e por quê, duração dos vídeos, ganchos dos primeiros segundos, estrutura de campanhas e orçamento sugerido pra testar.'),
  ('Aline Barros', 'Cadastro e contratos', 'administrativo', 'f', null, 'aprovar', 'semanal', 17, array['clientes','briefings','financeiro'], array['tarefa'],
   'Confira se cada cliente tem cadastro completo (nome, WhatsApp, e-mail, plano, briefing, marca e contrato) e liste o que falta, cliente por cliente.'),
  ('Felipe Matos', 'SEO e site', 'administrativo', 'm', null, 'aprovar', 'semanal', 18, array['site'], array['tarefa'],
   'Analise as páginas do site da Criativos Rápidos (título, descrição, textos, títulos das seções) e sugira melhorias de SEO pra aparecer no Google em buscas de agência de marketing e social media. Uma tarefa por melhoria, com o texto pronto.'),
  ('Sofia Andrade', 'Analista de resultados', 'administrativo', 'f', null, 'automatico', 'semanal', 19, array['relatorios','entregas','instagram'], array['comentario_relatorio'],
   'Escreva o comentário do relatório do mês de cada cliente que ainda não tem comentário: o que foi bem, o que pode melhorar e o que vamos testar no próximo mês, em linguagem simples.'),
  ('Vinícius Lopes', 'Cobrança', 'financeiro', 'm', null, 'aprovar', 'diaria', 20, array['financeiro','clientes'], array['mensagem_whatsapp'],
   'Escreva um lembrete educado de pagamento pra cada cobrança em atraso, sem tom agressivo, oferecendo ajuda se o cliente já pagou.');
  -- quem responde a quem
  update public.agentes a set chefe_id = c.id from public.agentes c
   where c.nome = case
     when a.area = 'direcao' then null
     when a.ordem between 2 and 5 then 'Helena Prado'
     when a.area = 'comercial' then 'Bruno Rocha'
     when a.area = 'operacional' then 'Renata Teles'
     when a.area = 'administrativo' then 'Ricardo Faria'
     when a.area = 'financeiro' then 'Paula Siqueira' end;
end $$;

-- ============================================================ esteira de produção
-- a pauta do mês de cada cliente passa por roteiro -> copy -> arte ou edição -> produção (alguém faz o arquivo) -> entregue
create table if not exists public.producao (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfis (id) on delete cascade,
  mes date not null,
  tipo text not null check (tipo in ('stories', 'post', 'carrossel', 'reels', 'anuncio', 'video', 'outro')),
  titulo text not null,
  objetivo text,                              -- atrair, educar, provar, vender
  data_sugerida date,
  roteiro text,
  legenda text,
  texto_arte text,
  direcao_arte text,
  plano_edicao text,
  etapa text not null default 'roteiro' check (etapa in ('roteiro', 'copy', 'arte', 'edicao', 'producao', 'entregue', 'cancelado')),
  ideia_id uuid references public.ideias (id) on delete set null,
  entrega_id uuid references public.entregas (id) on delete set null,
  atualizado_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);
create index if not exists producao_etapa on public.producao (etapa, cliente_id);
alter table public.producao enable row level security;
drop policy if exists "produção: agência" on public.producao;
create policy "produção: agência" on public.producao for all using (public.is_admin()) with check (public.is_admin());

-- uso do briefing com IA (formulário público): limite por dia
create table if not exists public.briefing_ia_uso (
  chave text not null,
  dia date not null,
  usos int not null default 0,
  primary key (chave, dia)
);
alter table public.briefing_ia_uso enable row level security;  -- sem políticas: só a função lê e grava

-- métricas do Instagram dos clientes (coletadas pela função instagram, 1 por dia)
create table if not exists public.ig_metricas (
  cliente_id uuid not null references public.perfis (id) on delete cascade,
  dia date not null,
  seguidores int,
  publicacoes int,
  posts jsonb,                                -- últimos posts: [{ id, tipo, legenda, data, curtidas, comentarios, link }]
  primary key (cliente_id, dia)
);
alter table public.ig_metricas enable row level security;
drop policy if exists "ig: ver" on public.ig_metricas;
create policy "ig: ver" on public.ig_metricas for select using (cliente_id = auth.uid() or public.is_admin());

-- ============================================================ Instagram conectado (o token fica só no servidor)
create table if not exists public.instagram_contas (
  cliente_id uuid primary key references public.perfis (id) on delete cascade,
  ig_user_id text not null,
  username text,
  token text not null,
  expira_em timestamptz,
  conectado_em timestamptz not null default now()
);
alter table public.instagram_contas enable row level security;  -- sem políticas: só a função do servidor lê e grava

create table if not exists public.instagram_estados (
  nonce text primary key,
  cliente_id uuid not null references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.instagram_estados enable row level security;

-- ============================================================ arquivos (Storage)
-- bucket privado: cada cliente só baixa o que está na pasta com o id dele
insert into storage.buckets (id, name, public) values ('entregas', 'entregas', false)
on conflict (id) do nothing;

drop policy if exists "arquivos: ver" on storage.objects;
create policy "arquivos: ver" on storage.objects for select
  using (bucket_id = 'entregas' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text
         or (auth.uid() is not null and (storage.foldername(name))[1] = 'geral')));
drop policy if exists "arquivos: enviar" on storage.objects;
create policy "arquivos: enviar" on storage.objects for insert with check (bucket_id = 'entregas' and public.is_admin());
drop policy if exists "arquivos: trocar" on storage.objects;
create policy "arquivos: trocar" on storage.objects for update using (bucket_id = 'entregas' and public.is_admin());
drop policy if exists "arquivos: apagar" on storage.objects;
create policy "arquivos: apagar" on storage.objects for delete using (bucket_id = 'entregas' and public.is_admin());

-- ============================================================ depois de criar a sua conta em /entrar, rode (com o seu e-mail):
-- update public.perfis set papel = 'admin' where email = 'criativosrapidos@gmail.com';
