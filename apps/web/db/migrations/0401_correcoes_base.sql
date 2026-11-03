-- Correções da revisão da base.

-- Um teste grátis por e-mail, mesmo depois de excluir a conta (guarda só o hash do e-mail normalizado).
create table testes_usados (
  email_hash text primary key,
  created_at timestamptz not null default now()
);
insert into testes_usados (email_hash)
select distinct encode(digest(lower(trim(u.email::text)), 'sha256'), 'hex')
from subscriptions s join users u on u.id = s.user_id
where s.trial_ends_at is not null and u.deleted_at is null
on conflict do nothing;

-- Limite de tentativas (login, cadastro, formulários públicos): contador por chave e janela.
create table rate_limits (
  chave text not null,
  janela timestamptz not null,
  n integer not null default 0,
  primary key (chave, janela)
);
create index on rate_limits (janela);

-- Índice de busca na MESMA expressão usada por buscarConcursos (o anterior não servia à consulta).
drop index if exists contests_busca;
create index contests_busca on contests using gin (
  (orgao || ' ' || titulo || ' ' || coalesce(resumo, '') || ' ' || coalesce(orgao_sigla, '')) gin_trgm_ops
);
