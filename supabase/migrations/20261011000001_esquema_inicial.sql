-- FocoMulta · esquema inicial
-- Metas com dinheiro em jogo: quem falha, doa.
-- Datas de "hoje" sempre no fuso de Brasília.

create or replace function public.hoje() returns date
language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  criado_em timestamptz not null default now()
);

create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil();

-- ---------------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------------
create table public.comunidades (
  id text primary key,
  nome text not null,
  exemplos text[] not null default '{}',
  ordem smallint not null
);

insert into public.comunidades (id, nome, exemplos, ordem) values
  ('exercicio',   'Exercício',           '{"Treinar 4x por semana","Correr 5 km todo sábado","10 mil passos por dia"}', 1),
  ('alimentacao', 'Alimentação e peso',  '{"Sem refrigerante por 30 dias","Marmita de segunda a sexta","Perder 4 kg em 2 meses"}', 2),
  ('estudos',     'Estudos e concursos', '{"Ler 20 páginas por dia","40 questões por dia","2 horas de estudo antes do trabalho"}', 3),
  ('carreira',    'Carreira',            '{"Mandar 5 currículos por semana","Publicar 1 projeto por mês","Terminar o curso até dezembro"}', 4),
  ('dinheiro',    'Dinheiro',            '{"30 dias sem delivery","Guardar R$ 300 por mês","Zerar o cartão até março"}', 5),
  ('habitos',     'Hábitos e saúde',     '{"Dormir antes da meia-noite","Parar de fumar","Menos de 2 horas de tela por dia"}', 6);

-- Lista verificada pelo FocoMulta. Cadastre as instituições reais pelo painel do Supabase.
create table public.instituicoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  ativa boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Metas
-- ---------------------------------------------------------------------------
create type public.modo_meta as enum ('so_eu', 'com_fiscal');
create type public.status_meta as enum ('ativa', 'cumprida', 'encerrada');

create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  comunidade_id text not null references public.comunidades (id),
  titulo text not null check (char_length(titulo) between 3 and 80),
  modo public.modo_meta not null default 'com_fiscal',
  checkins_por_semana smallint not null check (checkins_por_semana between 1 and 7),
  valor_centavos integer not null check (valor_centavos between 500 and 100000),
  semanas smallint not null check (semanas between 1 and 52),
  instituicao_id uuid not null references public.instituicoes (id),
  fiscal_id uuid references public.perfis (id),
  codigo_convite text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  inicio date not null default public.hoje(),
  status public.status_meta not null default 'ativa',
  criado_em timestamptz not null default now(),
  check (fiscal_id is null or fiscal_id <> user_id)
);
create index on public.metas (user_id);
create index on public.metas (fiscal_id);
create index on public.metas (comunidade_id, status);

-- Último dia da meta.
create or replace function public.fim_da_meta(m public.metas) returns date
language sql immutable as $$ select m.inicio + (m.semanas * 7 - 1) $$;

-- ---------------------------------------------------------------------------
-- Check-ins
-- ---------------------------------------------------------------------------
create type public.status_checkin as enum ('pendente', 'aprovado', 'recusado');

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references public.metas (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  dia date not null default public.hoje(),
  foto_path text not null,
  texto text check (char_length(texto) <= 280),
  status public.status_checkin not null default 'pendente',
  revisado_por uuid references public.perfis (id),
  revisado_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (meta_id, dia)
);
create index on public.checkins (criado_em desc);
create index on public.checkins (meta_id);

-- Check-in só vale para hoje, numa meta ativa da própria pessoa e dentro do prazo.
-- Meta sem fiscal é aprovada direto (a foto é obrigatória e fica no feed).
create or replace function public.validar_checkin() returns trigger
language plpgsql security definer set search_path = public as $$
declare m public.metas;
begin
  select * into m from public.metas where id = new.meta_id;
  if m.id is null or m.user_id <> auth.uid() then
    raise exception 'Meta não encontrada.';
  end if;
  if m.status <> 'ativa' then
    raise exception 'Essa meta já foi encerrada.';
  end if;
  new.user_id := auth.uid();
  new.dia := public.hoje();
  if new.dia < m.inicio or new.dia > public.fim_da_meta(m) then
    raise exception 'Hoje está fora do prazo da meta.';
  end if;
  if new.foto_path not like auth.uid()::text || '/%' then
    raise exception 'Foto inválida.';
  end if;
  new.status := case when m.fiscal_id is null then 'aprovado' else 'pendente' end::public.status_checkin;
  new.revisado_por := null;
  new.revisado_em := null;
  return new;
end $$;

create trigger validar_checkin before insert on public.checkins
  for each row execute function public.validar_checkin();

-- Vale o check-in aprovado, ou o pendente que o fiscal não respondeu em 24 horas.
create or replace function public.checkin_valido(c public.checkins) returns boolean
language sql stable as $$
  select c.status = 'aprovado' or (c.status = 'pendente' and c.criado_em < now() - interval '24 hours')
$$;

-- ---------------------------------------------------------------------------
-- Multas
-- ---------------------------------------------------------------------------
create type public.status_multa as enum ('aberta', 'contestada', 'paga', 'cancelada');

create table public.multas (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references public.metas (id) on delete cascade,
  user_id uuid not null references public.perfis (id) on delete cascade,
  semana smallint not null,
  checkins_feitos smallint not null,
  valor_centavos integer not null,
  status public.status_multa not null default 'aberta',
  contestacao text,
  mp_preference_id text,
  mp_payment_id text,
  pago_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (meta_id, semana)
);
create index on public.multas (user_id, status);

-- ---------------------------------------------------------------------------
-- Apoios (o "curtir" do feed; não existe curtida negativa)
-- ---------------------------------------------------------------------------
create table public.apoios (
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (checkin_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Ações (RPC). Tudo que mexe em dinheiro ou no papel do fiscal passa por aqui.
-- ---------------------------------------------------------------------------

-- O amigo entra como fiscal com o código que recebeu.
create or replace function public.aceitar_convite(codigo text) returns uuid
language plpgsql security definer set search_path = public as $$
declare m public.metas;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  select * into m from public.metas where codigo_convite = upper(trim(codigo)) for update;
  if m.id is null then raise exception 'Código não encontrado.'; end if;
  if m.user_id = auth.uid() then raise exception 'Você não pode fiscalizar a própria meta.'; end if;
  if m.status <> 'ativa' then raise exception 'Essa meta já foi encerrada.'; end if;
  if m.fiscal_id is not null and m.fiscal_id <> auth.uid() then raise exception 'Essa meta já tem fiscal.'; end if;
  update public.metas set fiscal_id = auth.uid(), modo = 'com_fiscal' where id = m.id;
  return m.id;
end $$;

-- O fiscal aprova ou recusa um check-in pendente.
create or replace function public.revisar_checkin(checkin uuid, aprovar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare c public.checkins; m public.metas;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  select * into c from public.checkins where id = checkin for update;
  select * into m from public.metas where id = c.meta_id;
  if c.id is null or m.fiscal_id is distinct from auth.uid() then raise exception 'Check-in não encontrado.'; end if;
  if c.status <> 'pendente' then raise exception 'Esse check-in já foi revisado.'; end if;
  update public.checkins
     set status = case when aprovar then 'aprovado' else 'recusado' end::public.status_checkin,
         revisado_por = auth.uid(), revisado_em = now()
   where id = c.id;
end $$;

-- Contestação em até 48 horas depois da multa aberta. Quem decide é o FocoMulta.
create or replace function public.contestar_multa(multa uuid, motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare x public.multas;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  select * into x from public.multas where id = multa for update;
  if x.id is null or x.user_id <> auth.uid() then raise exception 'Multa não encontrada.'; end if;
  if x.status <> 'aberta' then raise exception 'Essa multa não pode mais ser contestada.'; end if;
  if x.criado_em < now() - interval '48 hours' then raise exception 'O prazo de 48 horas para contestar acabou.'; end if;
  if char_length(trim(coalesce(motivo, ''))) < 10 then raise exception 'Conte o que aconteceu em pelo menos 10 caracteres.'; end if;
  update public.multas set status = 'contestada', contestacao = trim(motivo) where id = x.id;
end $$;

-- Avalia as semanas encerradas de todas as metas ativas.
-- Uma semana fecha no 7º dia; a avaliação espera mais 1 dia para o fiscal responder.
-- Semana com menos check-ins válidos que o combinado vira multa.
create or replace function public.avaliar_metas() returns integer
language plpgsql security definer set search_path = public as $$
declare
  m public.metas;
  s integer;
  ini date;
  feitos integer;
  criadas integer := 0;
begin
  for m in select * from public.metas where status = 'ativa' for update loop
    for s in 1 .. m.semanas loop
      ini := m.inicio + (s - 1) * 7;
      exit when ini + 6 >= public.hoje() - 1;
      continue when exists (select 1 from public.multas where meta_id = m.id and semana = s);
      select count(*) into feitos from public.checkins c
       where c.meta_id = m.id and c.dia between ini and ini + 6 and public.checkin_valido(c);
      if feitos < m.checkins_por_semana then
        insert into public.multas (meta_id, user_id, semana, checkins_feitos, valor_centavos)
        values (m.id, m.user_id, s, feitos, m.valor_centavos)
        on conflict do nothing;
        criadas := criadas + 1;
      end if;
    end loop;
    if public.fim_da_meta(m) < public.hoje() - 1 then
      update public.metas
         set status = case when exists (select 1 from public.multas where meta_id = m.id) then 'encerrada' else 'cumprida' end::public.status_meta
       where id = m.id;
    end if;
  end loop;
  return criadas;
end $$;
revoke execute on function public.avaliar_metas() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Feed e números do perfil
-- ---------------------------------------------------------------------------
create view public.feed with (security_invoker = true) as
select c.id, c.dia, c.texto, c.foto_path, c.status, c.criado_em,
       c.user_id, p.nome,
       m.id as meta_id, m.titulo, m.comunidade_id, m.valor_centavos, m.inicio, m.semanas,
       (c.dia - m.inicio + 1) as dia_da_meta,
       (select count(*) from public.apoios a where a.checkin_id = c.id) as apoios,
       exists (select 1 from public.apoios a where a.checkin_id = c.id and a.user_id = auth.uid()) as apoiei
  from public.checkins c
  join public.metas m on m.id = c.meta_id
  join public.perfis p on p.id = c.user_id
 where c.status <> 'recusado';

-- Sequência = dias seguidos com check-in, terminando hoje ou ontem.
create or replace function public.numeros_do_perfil(pessoa uuid) returns table (sequencia integer, cumpridas_pct integer, doados_centavos bigint)
language sql stable security definer set search_path = public as $$
  with d as (
    select distinct c.dia from public.checkins c where c.user_id = pessoa and c.status <> 'recusado'
  ), g as (
    select dia, dia + (row_number() over (order by dia desc))::integer as grupo from d
  )
  select coalesce((select count(*)::integer from g
                    where grupo = (select grupo from g order by dia desc limit 1)
                      and (select max(dia) from d) >= public.hoje() - 1), 0),
         coalesce((select round(100.0 * count(*) filter (where status = 'cumprida') / nullif(count(*), 0))::integer
                     from public.metas where user_id = pessoa and status <> 'ativa'), 0),
         coalesce((select sum(valor_centavos) from public.multas where user_id = pessoa and status = 'paga'), 0)::bigint
$$;

-- ---------------------------------------------------------------------------
-- Segurança (RLS)
-- ---------------------------------------------------------------------------
alter table public.perfis enable row level security;
alter table public.comunidades enable row level security;
alter table public.instituicoes enable row level security;
alter table public.metas enable row level security;
alter table public.checkins enable row level security;
alter table public.multas enable row level security;
alter table public.apoios enable row level security;

create policy "perfis visíveis" on public.perfis for select to authenticated using (true);
create policy "edita o próprio perfil" on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "comunidades visíveis" on public.comunidades for select to authenticated using (true);
create policy "instituições ativas visíveis" on public.instituicoes for select to authenticated using (ativa);

create policy "metas visíveis" on public.metas for select to authenticated using (true);
create policy "cria a própria meta" on public.metas for insert to authenticated
  with check (user_id = auth.uid() and status = 'ativa' and fiscal_id is null and inicio = public.hoje());

create policy "check-ins visíveis" on public.checkins for select to authenticated using (true);
create policy "faz o próprio check-in" on public.checkins for insert to authenticated
  with check (user_id = auth.uid());

create policy "vê as próprias multas" on public.multas for select to authenticated using (user_id = auth.uid());

create policy "apoios visíveis" on public.apoios for select to authenticated using (true);
create policy "apoia" on public.apoios for insert to authenticated with check (user_id = auth.uid());
create policy "retira o apoio" on public.apoios for delete to authenticated using (user_id = auth.uid());

-- Não deixa criar meta nova com multa em aberto.
create or replace function public.bloquear_meta_com_multa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.multas where user_id = new.user_id and status = 'aberta') then
    raise exception 'Pague a multa em aberto antes de criar outra meta.';
  end if;
  return new;
end $$;
create trigger bloquear_meta_com_multa before insert on public.metas
  for each row execute function public.bloquear_meta_com_multa();

-- ---------------------------------------------------------------------------
-- Fotos de check-in (bucket privado; o app usa URLs assinadas)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('checkins', 'checkins', false, 5242880, '{image/jpeg}')
on conflict (id) do nothing;

create policy "envia foto na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'checkins' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos de check-in visíveis" on storage.objects for select to authenticated
  using (bucket_id = 'checkins');

revoke execute on function public.aceitar_convite(text) from anon;
revoke execute on function public.revisar_checkin(uuid, boolean) from anon;
revoke execute on function public.contestar_multa(uuid, text) from anon;
revoke execute on function public.numeros_do_perfil(uuid) from anon;
