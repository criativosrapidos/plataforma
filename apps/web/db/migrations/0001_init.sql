-- Aviso Concurso · schema inicial (Postgres 15+ / Supabase)
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

-- ============ Pessoas, acesso e cobrança ============

create table users (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email citext not null unique,
  senha_hash text not null,
  role text not null default 'user' check (role in ('user', 'editor', 'admin')),
  telefone text,                         -- E.164, ex.: +5511999998888
  whatsapp_optin boolean not null default false,
  whatsapp_optin_em timestamptz,
  busca_nominal_optin boolean not null default false,  -- autoriza buscar o nome em convocações (LGPD)
  nome_busca text,                       -- nome completo como aparece no DOU
  termos_aceitos_em timestamptz,
  email_verificado_em timestamptz,
  ultimo_acesso_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  cliente text not null default 'web' check (cliente in ('web', 'app')),
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index on sessions (user_id);

create table password_resets (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plano text not null check (plano in ('aviso', 'aprovado')),
  ciclo text not null default 'mensal' check (ciclo in ('mensal', 'anual')),
  status text not null check (status in ('trial', 'ativa', 'inadimplente', 'cancelada', 'expirada')),
  metodo text check (metodo in ('cartao', 'pix_automatico')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  provider text not null default 'mock',  -- asaas | mercadopago | stripe | mock
  provider_customer_id text,
  provider_subscription_id text unique,
  aviso_cobranca_enviado_em timestamptz,  -- push "cobrança amanhã" (1 dia antes)
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- uma assinatura viva por pessoa
create unique index subscriptions_uma_viva on subscriptions (user_id) where status in ('trial', 'ativa', 'inadimplente');
create index on subscriptions (status, trial_ends_at);

create table payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions(id) on delete set null,
  user_id uuid not null references users(id) on delete cascade,
  valor_centavos integer not null,
  status text not null check (status in ('pendente', 'pago', 'falhou', 'estornado')),
  metodo text,
  provider_payment_id text unique,
  vencimento date,
  pago_em timestamptz,
  created_at timestamptz not null default now()
);
create index on payments (user_id, created_at desc);

create table user_settings (
  user_id uuid primary key references users(id) on delete cascade,
  push_on boolean not null default true,
  whatsapp_on boolean not null default false,
  email_resumo boolean not null default true,
  antecedencia_dias smallint not null default 3 check (antecedencia_dias in (1, 2, 3, 5)),
  silencio_inicio time default '22:00',
  silencio_fim time default '07:00',
  updated_at timestamptz not null default now()
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  expo_push_token text not null unique,
  plataforma text not null check (plataforma in ('ios', 'android', 'web')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index on devices (user_id) where ativo;

-- Perfis de busca (ilimitados por pessoa)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nome text not null default 'Meu perfil',
  escolaridades text[] not null default '{}',
  areas text[] not null default '{}',
  cargos text[] not null default '{}',
  ufs text[] not null default '{}',
  incluir_nacional boolean not null default true,
  salario_min_centavos integer,
  bancas text[] not null default '{}',
  palavras_chave text[] not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on profiles (user_id);

-- ============ Coleta ============

create table sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  tipo text not null check (tipo in ('dou', 'banca', 'querido_diario', 'diario_estadual', 'manual')),
  url text,
  ativo boolean not null default true,
  frequencia_min integer not null default 60,
  config jsonb not null default '{}',
  ultimo_run_em timestamptz,
  ultimo_status text,
  ultimo_hash text,                       -- detecção de mudança por hash (bancas)
  created_at timestamptz not null default now()
);

create table source_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  iniciado_em timestamptz not null default now(),
  terminado_em timestamptz,
  status text not null default 'rodando' check (status in ('rodando', 'ok', 'erro')),
  docs_encontrados integer not null default 0,
  docs_novos integer not null default 0,
  erro text
);
create index on source_runs (source_id, iniciado_em desc);

create table raw_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete set null,
  url text not null,
  titulo text,
  hash text not null unique,              -- sha256 do conteúdo: rodar 2x não duplica
  storage_path text,                      -- original guardado no Storage
  mime text,
  conteudo_texto text,
  publicado_em date,
  coletado_em timestamptz not null default now(),
  metadata jsonb not null default '{}',
  status text not null default 'novo' check (status in ('novo', 'classificado', 'descartado', 'extraido', 'revisao', 'erro')),
  erro text
);
create index on raw_documents (status, coletado_em);

-- ============ Concursos ============

create table contests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  dedup_key text not null unique,         -- órgão + número do edital + ano
  orgao text not null,
  orgao_sigla text,
  esfera text not null check (esfera in ('federal', 'estadual', 'municipal')),
  uf char(2),
  cidade text,
  banca text,
  numero_edital text,
  ano integer,
  status text not null default 'edital_aberto' check (status in (
    'previsto', 'autorizado', 'banca_definida', 'edital_aberto', 'inscricoes_encerradas',
    'prova_realizada', 'resultado', 'homologado', 'cancelado')),
  titulo text not null,
  resumo text,
  url_oficial text not null,              -- todo aviso leva link oficial
  taxa_centavos integer,
  vagas_total integer,                    -- desnormalizado de contest_roles
  cadastro_reserva boolean not null default false,
  salario_max_centavos integer,
  escolaridades text[] not null default '{}',
  areas text[] not null default '{}',
  edital_storage_path text,
  edital_texto text,                      -- texto integral para o Pergunte ao edital
  publicado_em date,
  publicado boolean not null default true, -- false = em revisão, não aparece no app
  exemplo boolean not null default false,  -- dado de demonstração (seed)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on contests (status) where publicado;
create index on contests using gin (escolaridades);
create index on contests using gin (areas);
create index contests_busca on contests using gin ((orgao || ' ' || titulo || ' ' || coalesce(resumo, '')) gin_trgm_ops);

create table contest_roles (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references contests(id) on delete cascade,
  nome text not null,
  escolaridade text check (escolaridade in ('fundamental', 'medio', 'tecnico', 'superior')),
  area text,
  vagas integer,
  cadastro_reserva boolean not null default false,
  salario_centavos integer,
  jornada text,
  requisitos text
);
create index on contest_roles (contest_id);

create table contest_dates (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references contests(id) on delete cascade,
  tipo text not null check (tipo in ('isencao', 'inscricao', 'pagamento', 'local_prova', 'prova', 'gabarito', 'recurso', 'resultado', 'outro')),
  inicio date,
  fim date,
  descricao text,
  fonte_item text,
  fonte_pagina integer,
  updated_at timestamptz not null default now()
);
create index on contest_dates (contest_id);
create index on contest_dates (fim);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  slug text not null unique,
  sinonimos text[] not null default '{}'
);

create table contest_subjects (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references contests(id) on delete cascade,
  role_id uuid references contest_roles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete restrict,
  questoes integer
);
create unique index contest_subjects_unq on contest_subjects (contest_id, coalesce(role_id, '00000000-0000-0000-0000-000000000000'::uuid), subject_id);

create table acts (
  id uuid primary key default gen_random_uuid(),
  raw_document_id uuid references raw_documents(id) on delete cascade,
  contest_id uuid references contests(id) on delete set null,
  tipo text not null check (tipo in ('previsto', 'autorizacao', 'edital_abertura', 'retificacao', 'homologacao', 'resultado', 'convocacao', 'outro')),
  confianca numeric(4, 3),
  resumo text,
  url_oficial text,
  publicado_em date,
  created_at timestamptz not null default now()
);
create index on acts (contest_id);

create table extractions (
  id uuid primary key default gen_random_uuid(),
  act_id uuid references acts(id) on delete cascade,
  raw_document_id uuid references raw_documents(id) on delete cascade,
  contest_id uuid references contests(id) on delete set null,
  modelo text not null,
  campos_json jsonb not null,
  confianca numeric(4, 3) not null,
  status text not null default 'pendente' check (status in ('pendente', 'aprovada', 'rejeitada', 'auto')),
  motivo_revisao text,
  revisado_por uuid references users(id),
  revisado_em timestamptz,
  tokens_in integer,
  tokens_out integer,
  custo_centavos numeric(10, 4),
  created_at timestamptz not null default now()
);
create index on extractions (status, created_at);

create table contest_versions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references contests(id) on delete cascade,
  act_id uuid references acts(id) on delete set null,
  versao integer not null,
  diff_json jsonb not null,               -- [{campo, antes, depois}]
  resumo text,
  created_at timestamptz not null default now(),
  unique (contest_id, versao)
);

-- ============ Acompanhamento (agenda, checklist) ============

create table follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  contest_id uuid not null references contests(id) on delete cascade,
  role_id uuid references contest_roles(id) on delete set null,   -- cargo de interesse
  cor text not null default '#1F3FD1',
  nas_materias boolean not null default true,                     -- liga/desliga em "Matérias em comum"
  created_at timestamptz not null default now(),
  unique (user_id, contest_id)
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  follow_id uuid not null references follows(id) on delete cascade,
  texto text not null,
  feito boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);
create index on checklist_items (follow_id, ordem);

-- ============ Avisos e IA ============

create table alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  contest_id uuid references contests(id) on delete cascade,
  tipo text not null,
  canal text not null check (canal in ('push', 'whatsapp', 'email', 'inapp')),
  titulo text not null,
  corpo text not null,
  url_oficial text,
  dedup_key text not null,                -- rodar 2x não manda 2x
  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'falhou', 'suprimido')),
  erro text,
  custo_centavos numeric(10, 4) not null default 0,
  enviado_em timestamptz,
  lido_em timestamptz,
  created_at timestamptz not null default now(),
  unique (dedup_key, canal)
);
create index on alerts (user_id, created_at desc);
create index on alerts (canal, user_id, enviado_em);

create table questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  contest_id uuid not null references contests(id) on delete cascade,
  pergunta text not null,
  resposta text,
  citacoes jsonb not null default '[]',   -- [{item, pagina, trecho}]
  encontrado boolean,
  modelo text,
  tokens_in integer,
  tokens_out integer,
  cache_read_tokens integer,
  custo_centavos numeric(10, 4),
  created_at timestamptz not null default now()
);
create index on questions (user_id, created_at desc);

-- ============ Site e operação ============

create table leads (
  id uuid primary key default gen_random_uuid(),
  nome text,
  email citext not null,
  whatsapp text,
  origem text,
  utm jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (email)
);

create table audit_log (
  id bigserial primary key,
  actor_id uuid references users(id) on delete set null,
  acao text not null,
  entidade text not null,
  entidade_id text,
  dados jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on audit_log (entidade, entidade_id);

create table app_config (
  chave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);
