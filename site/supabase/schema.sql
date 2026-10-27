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
alter table public.perfis add column if not exists redes text[];       -- canais do Postiz onde os conteúdos dele são publicados
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
    new.marca := old.marca; new.responsavel := old.responsavel; new.redes := old.redes; new.meta_ad_account := old.meta_ad_account;
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
alter table public.entregas add column if not exists redes text[];                          -- canais do Postiz só dessa entrega (senão, os do cliente)
alter table public.entregas add column if not exists redes_enviado_em timestamptz;          -- quando foi pro Postiz
alter table public.entregas add column if not exists redes_resultado jsonb;

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
    new.redes := old.redes; new.redes_enviado_em := old.redes_enviado_em; new.redes_resultado := old.redes_resultado;
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
  create temp table _time (nome text, cargo text, area text, genero text, etapa text, autonomia text, frequencia text, ordem int, fontes text[], saidas text[], missao text, chefe text) on commit drop;
  insert into _time values
  ('Capitã Rápida', 'CEO', 'direcao', 'f', null, 'aprovar', 'semanal', 1, array['crm','clientes','entregas','relatorios','financeiro','instagram','whatsapp','agenda']::text[], array['alerta','tarefa']::text[], 'Você dirige a Criativos Rápidos rumo a ser a maior agência de marketing do Brasil. Toda semana, olhe a agência inteira e diga as 3 a 5 prioridades: clientes em risco, dinheiro parado, vendas esfriando, gargalos na produção e oportunidades. Diga qual área resolve cada uma.', null),
  ('Bússola', 'Estratégia e metas', 'direcao', 'm', null, 'aprovar', 'semanal', 2, array['crm','clientes','financeiro','relatorios']::text[], array['alerta','tarefa']::text[], 'Acompanhe as metas da agência (clientes ativos, receita, cancelamentos, entregas no prazo) e diga, toda semana, se estamos no ritmo e o que mudar.', 'Capitã Rápida'),
  ('Fecha-Tudo', 'Diretor Comercial', 'comercial', 'm', null, 'aprovar', 'semanal', 3, array['crm','clientes','financeiro','whatsapp','agenda']::text[], array['alerta','tarefa']::text[], 'Você cuida de marketing e vendas. Toda semana, analise o funil (contatos, conversas no WhatsApp, reuniões, propostas, fechamentos), a taxa de cada etapa, o placar dos vendedores e os contatos parados. Diga o que fazer pra fechar mais.', 'Capitã Rápida'),
  ('Holofote', 'Marketing da agência', 'comercial', 'f', null, 'aprovar', 'semanal', 4, array['crm','relatorios','instagram']::text[], array['tarefa','alerta']::text[], 'Coordene o marketing da própria Criativos Rápidos em todas as redes: tema da semana, oferta em destaque e o que cada rede deve postar, pra trazer mais contatos pro WhatsApp.', 'Fecha-Tudo'),
  ('Filtro', 'Instagram da agência', 'comercial', 'f', null, 'aprovar', 'semanal', 5, array['instagram','clientes']::text[], array['ideia','tarefa']::text[], 'Cuide do perfil da própria Criativos Rápidos no Instagram: toda semana, proponha 7 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no Instagram, usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.', 'Fecha-Tudo'),
  ('Dancinha', 'TikTok da agência', 'comercial', 'f', null, 'aprovar', 'semanal', 6, array['clientes']::text[], array['tarefa']::text[], 'Cuide do perfil da própria Criativos Rápidos no TikTok: toda semana, proponha 7 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no TikTok, usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.', 'Fecha-Tudo'),
  ('Gravata', 'LinkedIn da agência', 'comercial', 'm', null, 'aprovar', 'semanal', 7, array['clientes','relatorios']::text[], array['tarefa']::text[], 'Cuide do perfil da própria Criativos Rápidos no LinkedIn: toda semana, proponha 3 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no LinkedIn, usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.', 'Fecha-Tudo'),
  ('Passarinho', 'X (Twitter) da agência', 'comercial', 'm', null, 'aprovar', 'semanal', 8, array['clientes']::text[], array['tarefa']::text[], 'Cuide do perfil da própria Criativos Rápidos no X (Twitter): toda semana, proponha 10 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no X (Twitter), usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.', 'Fecha-Tudo'),
  ('Play', 'YouTube da agência', 'comercial', 'm', null, 'aprovar', 'semanal', 9, array['clientes']::text[], array['tarefa']::text[], 'Cuide do perfil da própria Criativos Rápidos no YouTube (Shorts e vídeos): toda semana, proponha 3 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no YouTube (Shorts e vídeos), usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.', 'Fecha-Tudo'),
  ('Joinha', 'Facebook da agência', 'comercial', 'm', null, 'aprovar', 'semanal', 10, array['clientes']::text[], array['tarefa']::text[], 'Cuide do perfil da própria Criativos Rápidos no Facebook: toda semana, proponha 3 posts com o texto pronto (gancho, corpo e chamada pra ação), no formato que funciona no Facebook, usando o que a agência faz e os resultados reais dos clientes. Nunca invente número ou depoimento.', 'Fecha-Tudo'),
  ('Pena', 'Blog da agência', 'comercial', 'f', null, 'aprovar', 'semanal', 11, array['site','clientes']::text[], array['tarefa']::text[], 'Escreva toda semana 1 artigo pro blog da Criativos Rápidos (título, estrutura e texto completo) sobre marketing pra pequenos negócios, pensado pra aparecer no Google.', 'Fecha-Tudo'),
  ('Buscador', 'SEO e site', 'comercial', 'm', null, 'aprovar', 'semanal', 12, array['site']::text[], array['tarefa']::text[], 'Analise o site da Criativos Rápidos e sugira melhorias de SEO pra aparecer no Google em buscas de agência de marketing e social media. Uma tarefa por melhoria, com o texto pronto.', 'Fecha-Tudo'),
  ('Carteiro', 'E-mail e newsletter', 'comercial', 'm', null, 'aprovar', 'semanal', 13, array['crm','clientes']::text[], array['tarefa']::text[], 'Escreva a newsletter semanal da agência (pra contatos que se inscreveram) e as sequências de e-mail de quem pediu contato e ainda não fechou.', 'Fecha-Tudo'),
  ('Turbinho', 'Anúncios da agência', 'comercial', 'm', null, 'aprovar', 'semanal', 14, array['relatorios','crm']::text[], array['alerta','tarefa']::text[], 'Cuide dos anúncios da própria agência, principalmente os de clique pro WhatsApp: verba, públicos, criativos e custo por conversa. Diga o que pausar, o que escalar e o que testar.', 'Fecha-Tudo'),
  ('Antena', 'Tendências e concorrentes', 'comercial', 'f', null, 'aprovar', 'semanal', 15, array['crm','clientes']::text[], array['tarefa','ideia']::text[], 'Acompanhe o que está em alta no marketing pra pequenos negócios e o que as outras agências estão anunciando. Traga oportunidades de conteúdo e de oferta pra agência.', 'Fecha-Tudo'),
  ('Megafone', 'Parcerias e indicações', 'comercial', 'm', null, 'aprovar', 'semanal', 16, array['clientes','crm']::text[], array['tarefa','mensagem_whatsapp']::text[], 'Encontre parceiros que indicam clientes (contadores, sistemas, associações) e clientes satisfeitos que podem indicar. Escreva a abordagem de cada um.', 'Fecha-Tudo'),
  ('Depoimento', 'Prova social', 'comercial', 'f', null, 'aprovar', 'semanal', 17, array['clientes','relatorios','instagram']::text[], array['mensagem_whatsapp','tarefa']::text[], 'Peça depoimentos e autorização de case pros clientes com bons resultados reais e organize os que já foram autorizados. Nunca escreva depoimento por ninguém.', 'Fecha-Tudo'),
  ('Lili do Zap', 'Atendente (WhatsApp e site)', 'comercial', 'f', 'whatsapp', 'automatico', 'manual', 18, array['crm','whatsapp','agenda']::text[], array['mensagem_whatsapp']::text[], 'Você atende no WhatsApp e no chat do site quem chama a Criativos Rápidos. Responda rápido e simpático, entenda o negócio da pessoa (o que vende, pra quem, se já posta, se já anuncia), mostre como a gente ajuda e, quando houver interesse de verdade, passe pra um dos vendedores. Se a pessoa pedir pra falar com alguém, passe pra equipe.', 'Fecha-Tudo'),
  ('Farejador', 'Prospecção', 'comercial', 'm', null, 'aprovar', 'diaria', 19, array['crm']::text[], array['mensagem_whatsapp','tarefa']::text[], 'Pra cada contato da lista de prospecção ainda não abordado, escreva uma primeira mensagem curta e personalizada pra equipe mandar do próprio celular, e sugira o melhor canal (Instagram, e-mail, LinkedIn ou ligação). Nunca mais de 20 por dia.', 'Fecha-Tudo'),
  ('Termômetro', 'Qualificação de contatos', 'comercial', 'f', null, 'aprovar', 'diaria', 20, array['crm','whatsapp']::text[], array['alerta']::text[], 'Dê uma nota de 0 a 10 pra cada contato em aberto (quanto tem a cara do nosso cliente ideal e quanto está pronto pra comprar) e diga quais o time deve priorizar hoje.', 'Fecha-Tudo'),
  ('Agendinha', 'Agendamento e pré-reunião', 'comercial', 'f', null, 'aprovar', 'diaria', 21, array['crm','whatsapp','agenda']::text[], array['tarefa','mensagem_whatsapp']::text[], 'Pra cada reunião marcada nos próximos 2 dias, prepare um resumo pra equipe (quem é, o negócio, as dores, o plano que faz sentido) e escreva o lembrete da reunião pro contato.', 'Fecha-Tudo'),
  ('Trator', 'Vendedor direto', 'comercial', 'm', 'vendas', 'automatico', 'manual', 22, array['crm','whatsapp','agenda']::text[], array['mensagem_whatsapp']::text[], 'Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: direto e confiante: cria senso de oportunidade (vagas da agenda, começar este mês) e pede o fechamento logo, com firmeza e respeito, sem inventar promoção. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.', 'Fecha-Tudo'),
  ('Conselheira', 'Vendedora consultiva', 'comercial', 'f', 'vendas', 'automatico', 'manual', 23, array['crm','whatsapp','agenda']::text[], array['mensagem_whatsapp']::text[], 'Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: consultiva: faz perguntas, entende o negócio a fundo e só então mostra o plano que resolve o problema dele. Sem pressa. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.', 'Fecha-Tudo'),
  ('Amigão', 'Vendedor de relacionamento', 'comercial', 'm', 'vendas', 'automatico', 'manual', 24, array['crm','whatsapp','agenda']::text[], array['mensagem_whatsapp']::text[], 'Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: leve e bem-humorado, conversa como amigo e cria confiança antes de falar de plano. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.', 'Fecha-Tudo'),
  ('Professor', 'Vendedor especialista', 'comercial', 'm', 'vendas', 'automatico', 'manual', 25, array['crm','whatsapp','agenda']::text[], array['mensagem_whatsapp']::text[], 'Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: especialista: explica como o marketing funciona (frequência, formatos, tráfego) com clareza técnica, mostra autoridade e ensina antes de vender. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.', 'Fecha-Tudo'),
  ('Contadora de Histórias', 'Vendedora narradora', 'comercial', 'f', 'vendas', 'automatico', 'manual', 26, array['crm','whatsapp','agenda']::text[], array['mensagem_whatsapp']::text[], 'Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: narradora: usa histórias pra mostrar o antes e depois de um negócio parecido com o dele, deixando claro quando é um exemplo e sem inventar resultado de cliente. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.', 'Fecha-Tudo'),
  ('Provocador', 'Vendedor desafiador', 'comercial', 'm', 'vendas', 'automatico', 'manual', 27, array['crm','whatsapp','agenda']::text[], array['mensagem_whatsapp']::text[], 'Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: desafiador: questiona com respeito o jeito que a pessoa faz marketing hoje, mostra o custo de ficar parado e propõe um caminho novo. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.', 'Fecha-Tudo'),
  ('Resolve', 'Vendedora solucionadora', 'comercial', 'f', 'vendas', 'automatico', 'manual', 28, array['crm','whatsapp','agenda']::text[], array['mensagem_whatsapp']::text[], 'Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: solucionadora: descobre o problema principal (falta de cliente, de tempo, de conteúdo) e mostra exatamente qual parte do plano resolve cada um. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.', 'Fecha-Tudo'),
  ('Negociador', 'Vendedor negociador', 'comercial', 'm', 'vendas', 'automatico', 'manual', 29, array['crm','whatsapp','agenda']::text[], array['mensagem_whatsapp']::text[], 'Você é vendedor(a) de IA da Criativos Rápidos no WhatsApp. Estilo: negociador: entende o orçamento, oferece o plano ou pacote que cabe (começar pelo Largada, por exemplo) e chega num acordo bom pros dois, sem criar desconto que não existe. Continue a conversa de onde a atendente parou, use só os preços da tabela e conduza pra uma reunião ou pro fechamento.', 'Fecha-Tudo'),
  ('Proposteiro', 'Propostas comerciais', 'comercial', 'm', null, 'aprovar', 'diaria', 30, array['crm','whatsapp','agenda']::text[], array['tarefa']::text[], 'Pra cada contato que fez reunião ou pediu proposta, monte a proposta: diagnóstico do negócio, plano indicado da tabela, o que entra, próximos passos. Texto pronto pra virar a página da proposta.', 'Fecha-Tudo'),
  ('Mestre da Esteira', 'Diretor Operacional', 'operacional', 'm', null, 'aprovar', 'diaria', 31, array['clientes','entregas','briefings','instagram']::text[], array['alerta','tarefa']::text[], 'Você cuida da entrega. Todo dia, veja se cada cliente está recebendo o que o plano promete, o que está parado na esteira ou esperando aprovação, ajustes pendentes e clientes sem briefing. Aponte o gargalo e quem resolve.', 'Capitã Rápida'),
  ('Tapete Vermelho', 'Onboarding', 'operacional', 'f', null, 'aprovar', 'diaria', 32, array['clientes','briefings','financeiro']::text[], array['mensagem_whatsapp','tarefa']::text[], 'Cuide de quem acabou de fechar: boas-vindas, link do briefing (criativosrapidos.com.br/brief), acesso ao app e o que acontece em seguida. Cobre gentilmente quem ainda não mandou o briefing.', 'Mestre da Esteira'),
  ('Prontinho', 'Suporte e atendimento', 'operacional', 'm', null, 'aprovar', 'diaria', 33, array['clientes','entregas']::text[], array['mensagem_whatsapp','alerta']::text[], 'Cuide do dia a dia dos clientes: dúvidas sobre o app, lembrete simpático pra quem tem conteúdo parado esperando aprovação e retorno pra quem pediu ajuste.', 'Mestre da Esteira'),
  ('Sorriso', 'Sucesso do cliente', 'operacional', 'f', null, 'aprovar', 'semanal', 34, array['clientes','entregas','relatorios','financeiro','instagram']::text[], array['mensagem_whatsapp','alerta']::text[], 'Cuide da retenção: ache clientes com risco de cancelar (pouca aprovação, muitos ajustes, atraso no pagamento, resultado fraco) e clientes prontos pra subir de plano. Escreva a mensagem certa pra cada um.', 'Mestre da Esteira'),
  ('Até Logo', 'Offboarding', 'operacional', 'm', null, 'aprovar', 'semanal', 35, array['clientes','financeiro']::text[], array['mensagem_whatsapp','tarefa']::text[], 'Cuide de quem cancelou ou vai cancelar: entenda o motivo com uma pesquisa curta, entregue os arquivos, encerre com elegância e veja se dá pra recuperar com outro plano.', 'Mestre da Esteira'),
  ('Trend', 'Tendências por nicho', 'operacional', 'f', null, 'aprovar', 'semanal', 36, array['clientes','briefings']::text[], array['ideia']::text[], 'Pra cada cliente, traga o que está em alta no nicho dele (formatos, temas, datas) e transforme em ideias de conteúdo.', 'Mestre da Esteira'),
  ('Pauteiro', 'Estrategista de conteúdo', 'operacional', 'm', 'pauta', 'automatico', 'diaria', 37, array['clientes','briefings','ideias','instagram']::text[], array[]::text[], 'Monte a pauta do mês de cada cliente com a quantidade exata do plano: um mix que vende (atrair, educar, provar e vender), usando o briefing, a marca, as ideias aprovadas e o que funcionou no Instagram.', 'Mestre da Esteira'),
  ('Gancho', 'Roteirista', 'operacional', 'f', 'roteiro', 'automatico', 'diaria', 38, array['clientes','briefings']::text[], array[]::text[], 'Escreva o roteiro de cada reels, vídeo e carrossel: gancho nos 3 primeiros segundos, desenvolvimento curto e chamada pra ação. Reels de 15 a 30 segundos, carrossel de 5 a 8 slides.', 'Mestre da Esteira'),
  ('Caneta de Ouro', 'Copywriter', 'operacional', 'm', 'copy', 'automatico', 'diaria', 39, array['clientes','briefings']::text[], array[]::text[], 'Escreva a legenda e o texto da arte de cada conteúdo, no tom de voz da marca, com chamada pra ação clara. Texto de arte curto: no máximo 8 palavras no título.', 'Mestre da Esteira'),
  ('Pincel', 'Diretora de arte', 'operacional', 'f', 'arte', 'automatico', 'diaria', 40, array['clientes']::text[], array[]::text[], 'Faça a direção de arte de cada post, carrossel, story e anúncio: formato, composição, elementos, cores da marca, fontes e destaque.', 'Mestre da Esteira'),
  ('Corta-Corta', 'Editor de vídeo', 'operacional', 'm', 'edicao', 'automatico', 'diaria', 41, array['clientes']::text[], array[]::text[], 'Faça o plano de edição de cada reels e vídeo: cortes segundo a segundo, texto na tela, legendas, trilha, ritmo e duração final.', 'Mestre da Esteira'),
  ('Influ', 'Roteiros UGC e avatares', 'operacional', 'f', null, 'aprovar', 'manual', 42, array['clientes','briefings']::text[], array['tarefa']::text[], 'Escreva roteiros de vídeo no estilo UGC (pessoa falando pra câmera, depoimento, unboxing) pros clientes, prontos pra gravar com criadores ou avatares de IA.', 'Mestre da Esteira'),
  ('Lupa', 'Revisor de qualidade', 'operacional', 'm', null, 'aprovar', 'diaria', 43, array['clientes','entregas']::text[], array['alerta']::text[], 'Revise as entregas recentes: erro de português, preço ou informação que não bate com o briefing, legenda fora do tom da marca. Aponte cada problema.', 'Mestre da Esteira'),
  ('Relógio', 'Programação e postagem', 'operacional', 'm', null, 'aprovar', 'diaria', 44, array['clientes','entregas']::text[], array['alerta']::text[], 'Garanta que tudo aprovado tem data, horário e vai ao ar: aponte post aprovado sem data, Instagram desconectado e postagem que falhou.', 'Mestre da Esteira'),
  ('Curtida', 'Social media dos clientes', 'operacional', 'f', null, 'aprovar', 'semanal', 45, array['clientes','instagram','entregas']::text[], array['alerta','ideia']::text[], 'Acompanhe o Instagram dos clientes: o que teve mais e menos curtidas e comentários, se os seguidores cresceram. Aponte o que funcionou e sugira ideias pra repetir.', 'Mestre da Esteira'),
  ('Responde Aí', 'Comunidade dos clientes', 'operacional', 'f', null, 'aprovar', 'semanal', 46, array['clientes','instagram']::text[], array['tarefa']::text[], 'Sugira respostas pros comentários e mensagens que os clientes recebem nos posts, no tom da marca de cada um, e aponte dúvidas frequentes que viram conteúdo.', 'Mestre da Esteira'),
  ('Radar', 'Estrategista de tráfego', 'operacional', 'f', null, 'aprovar', 'manual', 47, array['clientes','briefings','relatorios']::text[], array['tarefa']::text[], 'Monte a estratégia de tráfego de cada cliente: objetivo, público, oferta, ângulos de copy, formatos (imagem, vídeo, carrossel) e por quê, duração dos vídeos, ganchos dos primeiros segundos, campanhas e orçamento de teste.', 'Mestre da Esteira'),
  ('Turbo', 'Gestor de tráfego', 'operacional', 'm', null, 'aprovar', 'semanal', 48, array['relatorios','clientes']::text[], array['alerta','tarefa']::text[], 'Analise os números dos anúncios de cada cliente. Aponte campanha cara demais, verba mal distribuída e o que testar. Seja específico.', 'Mestre da Esteira'),
  ('Gráfica', 'Relatórios dos clientes', 'operacional', 'f', null, 'automatico', 'semanal', 49, array['relatorios','entregas','instagram']::text[], array['comentario_relatorio']::text[], 'Escreva o comentário do relatório do mês de cada cliente: o que foi bem, o que melhorar e o que testar no próximo mês, em linguagem simples.', 'Mestre da Esteira'),
  ('Paleta', 'Marca dos clientes', 'operacional', 'f', null, 'aprovar', 'semanal', 50, array['clientes','briefings']::text[], array['tarefa']::text[], 'Confira se cada cliente tem a marca completa na plataforma (cores, fontes, tom de voz, logo) e proponha o que falta a partir do briefing.', 'Mestre da Esteira'),
  ('Construtor', 'Landing pages', 'operacional', 'm', null, 'aprovar', 'manual', 51, array['clientes','briefings']::text[], array['tarefa']::text[], 'Escreva a estrutura e os textos das landing pages dos clientes que têm o pacote Turbo: título, seções, provas, oferta e chamada pro WhatsApp.', 'Mestre da Esteira'),
  ('Dona Ordem', 'Diretora Administrativa', 'administrativo', 'f', null, 'aprovar', 'semanal', 52, array['clientes','briefings','site']::text[], array['alerta','tarefa']::text[], 'Você cuida da organização: cadastros, contratos, processos, ferramentas, documentos, o time de agentes e a conformidade com a LGPD. Aponte o que está faltando ou desorganizado e quem resolve.', 'Capitã Rápida'),
  ('Carimbo', 'Cadastro e contratos', 'administrativo', 'f', null, 'aprovar', 'semanal', 53, array['clientes','briefings','financeiro']::text[], array['tarefa']::text[], 'Confira se cada cliente tem cadastro completo (contato, plano, briefing, marca e contrato) e liste o que falta, cliente por cliente.', 'Dona Ordem'),
  ('Dr. Cláusula', 'Jurídico e LGPD', 'administrativo', 'm', null, 'aprovar', 'semanal', 54, array['crm','site']::text[], array['tarefa','alerta']::text[], 'Cuide da conformidade: consentimento dos contatos antes de mensagens, pedidos de descadastro, política de privacidade e termos do site, cláusulas dos contratos. Não substitui advogado: aponte o que levar pra um.', 'Dona Ordem'),
  ('Engrenagem', 'Processos e automação', 'administrativo', 'f', null, 'aprovar', 'semanal', 55, array['clientes','entregas','crm']::text[], array['tarefa']::text[], 'Encontre retrabalho e etapas lentas na jornada (venda, onboarding, produção, aprovação) e proponha como deixar mais automático.', 'Dona Ordem'),
  ('Painel', 'Indicadores da agência', 'administrativo', 'm', null, 'aprovar', 'semanal', 56, array['crm','clientes','entregas','financeiro','relatorios']::text[], array['alerta']::text[], 'Monte o resumo semanal dos números da agência: novos clientes, cancelamentos, entregas no prazo, conversão de vendas, receita e custo. Compare com a semana anterior.', 'Dona Ordem'),
  ('Treinador', 'Time de agentes', 'administrativo', 'm', null, 'aprovar', 'semanal', 57, array['clientes','entregas','crm']::text[], array['tarefa']::text[], 'Cuide do time de agentes de IA: veja quais rascunhos a equipe mais descarta ou edita e proponha como melhorar a função de cada agente.', 'Dona Ordem'),
  ('Chave', 'Ferramentas e acessos', 'administrativo', 'm', null, 'aprovar', 'semanal', 58, array['clientes']::text[], array['tarefa','alerta']::text[], 'Cuide das ferramentas e acessos: Instagram desconectado, conta de anúncio sem acesso, integrações paradas. Liste o que precisa ser reconectado.', 'Dona Ordem'),
  ('Arquivo', 'Documentos', 'administrativo', 'f', null, 'aprovar', 'semanal', 59, array['clientes','briefings']::text[], array['tarefa']::text[], 'Organize os documentos de cada cliente (briefing, marca, contrato, materiais) e aponte o que está faltando ou fora do lugar.', 'Dona Ordem'),
  ('Cofrinho', 'Diretora Financeira', 'financeiro', 'f', null, 'aprovar', 'semanal', 60, array['financeiro','clientes']::text[], array['alerta','tarefa']::text[], 'Você cuida do dinheiro. Toda semana, mostre o previsto e o recebido no mês, as cobranças em atraso, mensalidades não lançadas, gastos e riscos de caixa.', 'Capitã Rápida'),
  ('Lembrete', 'Cobrança', 'financeiro', 'm', null, 'aprovar', 'diaria', 61, array['financeiro','clientes']::text[], array['mensagem_whatsapp']::text[], 'Escreva um lembrete educado pra cada cobrança em atraso, sem tom agressivo, oferecendo ajuda se o cliente já pagou.', 'Cofrinho'),
  ('Notinha', 'Faturamento', 'financeiro', 'f', null, 'aprovar', 'semanal', 62, array['financeiro','clientes']::text[], array['tarefa','alerta']::text[], 'Confira se toda venda e mensalidade virou cobrança, com o valor do plano certo, e se cada pagamento recebido precisa de nota fiscal.', 'Cofrinho'),
  ('Conciliador', 'Conciliação', 'financeiro', 'm', null, 'aprovar', 'semanal', 63, array['financeiro']::text[], array['alerta']::text[], 'Confira se cada cobrança marcada como paga bate com o que entrou na conta e aponte diferenças.', 'Cofrinho'),
  ('Boleto', 'Contas a pagar', 'financeiro', 'm', null, 'aprovar', 'semanal', 64, array['financeiro']::text[], array['alerta','tarefa']::text[], 'Acompanhe os gastos da agência (ferramentas, IA, anúncios, fornecedores): o que vence na semana e o que dá pra cortar.', 'Cofrinho'),
  ('Calculadora', 'Preço e margem', 'financeiro', 'f', null, 'aprovar', 'semanal', 65, array['financeiro','clientes','entregas']::text[], array['alerta','tarefa']::text[], 'Calcule quanto custa entregar cada plano (produção, IA, ferramentas) e se a margem está saudável. Avise quando um plano começar a dar prejuízo.', 'Cofrinho'),
  ('Bola de Cristal', 'Planejamento financeiro', 'financeiro', 'f', null, 'aprovar', 'semanal', 66, array['financeiro','clientes','crm']::text[], array['alerta','tarefa']::text[], 'Projete o caixa dos próximos 3 meses (mensalidades, vendas no funil, gastos) e diga quantos clientes precisamos fechar pra bater a meta.', 'Cofrinho'),
  ('Leão', 'Impostos e contador', 'financeiro', 'm', null, 'aprovar', 'semanal', 67, array['financeiro']::text[], array['tarefa']::text[], 'Organize o que o contador precisa todo mês (recebimentos, notas, gastos) e lembre dos vencimentos de impostos. Não substitui o contador.', 'Cofrinho');
  insert into public.agentes (nome, cargo, area, genero, etapa, autonomia, frequencia, ordem, fontes, saidas, missao)
    select nome, cargo, area, genero, etapa, autonomia, frequencia, ordem, fontes, saidas, missao from _time;
  update public.agentes a set chefe_id = c.id from _time t, public.agentes c where t.nome = a.nome and c.nome = t.chefe;
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

-- ============================================================ WhatsApp oficial (API da Meta), agenda de reuniões e treino do atendente
-- optin: a pessoa pediu contato (formulário do site) ou chamou a gente. Sem optin a plataforma não inicia conversa.
alter table public.leads add column if not exists optin boolean not null default true;
alter table public.leads add column if not exists ia_ativa boolean not null default true;   -- a atendente de IA responde esse contato
alter table public.leads add column if not exists vendedor_id uuid references public.agentes (id) on delete set null;  -- vendedor de IA que assumiu o contato
alter table public.leads add column if not exists ultima_entrada_em timestamptz;            -- última mensagem que ele mandou (janela de 24 h)
alter table public.leads add column if not exists whatsapp_num text generated always as (regexp_replace(whatsapp, '\D', '', 'g')) stored;  -- só os números, pra achar o contato
alter table public.leads drop constraint if exists leads_whatsapp_check;
alter table public.leads add constraint leads_whatsapp_check check (char_length(whatsapp) between 8 and 30);

create table if not exists public.whatsapp_mensagens (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  cliente_id uuid references public.perfis (id) on delete cascade,
  telefone text not null,
  direcao text not null check (direcao in ('entrada', 'saida')),
  autor text not null default 'contato' check (autor in ('contato', 'ia', 'equipe')),
  tipo text not null default 'texto',
  texto text,
  wa_id text unique,
  criado_em timestamptz not null default now()
);
create index if not exists whatsapp_lead on public.whatsapp_mensagens (lead_id, criado_em);
alter table public.whatsapp_mensagens enable row level security;
drop policy if exists "whatsapp: agência" on public.whatsapp_mensagens;
create policy "whatsapp: agência" on public.whatsapp_mensagens for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.reunioes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  nome text,
  telefone text,
  inicio timestamptz not null,
  fim timestamptz not null,
  status text not null default 'marcada' check (status in ('marcada', 'feita', 'faltou', 'cancelada')),
  observacao text,
  marcada_por text not null default 'equipe',     -- ia ou equipe
  criado_em timestamptz not null default now()
);
create index if not exists reunioes_inicio on public.reunioes (inicio);
alter table public.reunioes enable row level security;
drop policy if exists "reunião: agência" on public.reunioes;
create policy "reunião: agência" on public.reunioes for all using (public.is_admin()) with check (public.is_admin());

-- configurações da agência: agenda ({ dias, inicio, fim, duracao, intervalo, link }) e treino do atendente ({ texto, audio })
create table if not exists public.configuracoes (
  chave text primary key,
  valor jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.configuracoes enable row level security;
drop policy if exists "config: agência" on public.configuracoes;
create policy "config: agência" on public.configuracoes for all using (public.is_admin()) with check (public.is_admin());
insert into public.configuracoes (chave, valor) values
  ('agenda', '{"dias": [1, 2, 3, 4, 5], "inicio": "09:00", "fim": "18:00", "duracao": 30, "antecedencia_horas": 3, "link": ""}'),
  ('atendente', '{"texto": "", "audio": false}'),
  ('estudio', '{"quem": "nos", "max": 12}')
on conflict (chave) do nothing;

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
