-- Motor do Aviso Concurso: coleta, processamento, avisos, recibos de push, webhooks e jobs.

-- ============ Avisos ============
-- Todo aviso tem link oficial (regra que não pode quebrar), garantida também no banco.
alter table alerts alter column url_oficial set not null;
alter table alerts add constraint alerts_url_oficial_http check (url_oficial ~ '^https?://');
-- Horário silencioso: o envio é adiado (não descartado) até esta hora.
alter table alerts add column agendado_para timestamptz;
alter table alerts add column tentativas smallint not null default 0;
create index alerts_pendentes on alerts (canal, agendado_para) where status = 'pendente';
create index alerts_whatsapp_mes on alerts (user_id, created_at) where canal = 'whatsapp';

-- Tickets do Expo Push: conferidos depois (recibos) para desativar aparelhos inválidos.
create table push_tickets (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references alerts(id) on delete cascade,
  device_id uuid references devices(id) on delete cascade,
  ticket_id text not null unique,
  status text not null default 'pendente' check (status in ('pendente', 'ok', 'erro')),
  erro text,
  created_at timestamptz not null default now(),
  checked_at timestamptz
);
create index push_tickets_pendentes on push_tickets (created_at) where status = 'pendente';

-- Resumo semanal por e-mail: um por pessoa por semana (AAAA-Wnn).
create table email_resumos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  semana text not null,
  status text not null check (status in ('enviado', 'falhou', 'vazio')),
  itens integer not null default 0,
  custo_centavos numeric(10, 4) not null default 0,
  erro text,
  created_at timestamptz not null default now(),
  unique (user_id, semana)
);

-- ============ Cobrança ============
-- Webhooks recebidos (idempotência por evento; reprocessa se falhou).
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  tipo text not null,
  payload jsonb not null,
  tentativas integer not null default 1,
  processado_em timestamptz,
  erro text,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);
create index on payments (subscription_id);

-- ============ Coleta e processamento ============
alter table raw_documents add column tentativas smallint not null default 0;
alter table raw_documents add column processado_em timestamptz;
create index raw_documents_publicado on raw_documents (publicado_em);
-- Um ato por documento bruto e uma extração viva por documento: reprocessar não duplica.
create unique index acts_um_por_documento on acts (raw_document_id) where raw_document_id is not null;
create unique index extractions_uma_viva on extractions (raw_document_id) where status <> 'rejeitada' and raw_document_id is not null;
create index on extractions (contest_id);
create index on follows (contest_id);
create index on contest_versions (contest_id, created_at desc);

-- Execuções dos jobs agendados (observabilidade no admin).
create table job_runs (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  iniciado_em timestamptz not null default now(),
  terminado_em timestamptz,
  status text not null default 'rodando' check (status in ('rodando', 'ok', 'erro')),
  resultado jsonb not null default '{}',
  erro text
);
create index on job_runs (nome, iniciado_em desc);

-- Configurações padrão (o admin pode mudar).
insert into app_config (chave, valor) values
  ('limiar_confianca', '0.85'),
  ('cambio_usd_brl', '5.5'),
  ('custo_whatsapp_centavos', '4.4')
on conflict (chave) do nothing;
