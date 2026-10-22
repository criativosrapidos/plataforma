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
    new.papel := old.papel; new.plano := old.plano; new.ajustes_mes := old.ajustes_mes; new.email := old.email;
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
    new.link_externo := old.link_externo;
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

-- ============================================================ arquivos (Storage)
-- bucket privado: cada cliente só baixa o que está na pasta com o id dele
insert into storage.buckets (id, name, public) values ('entregas', 'entregas', false)
on conflict (id) do nothing;

drop policy if exists "arquivos: ver" on storage.objects;
create policy "arquivos: ver" on storage.objects for select
  using (bucket_id = 'entregas' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
drop policy if exists "arquivos: enviar" on storage.objects;
create policy "arquivos: enviar" on storage.objects for insert with check (bucket_id = 'entregas' and public.is_admin());
drop policy if exists "arquivos: trocar" on storage.objects;
create policy "arquivos: trocar" on storage.objects for update using (bucket_id = 'entregas' and public.is_admin());
drop policy if exists "arquivos: apagar" on storage.objects;
create policy "arquivos: apagar" on storage.objects for delete using (bucket_id = 'entregas' and public.is_admin());

-- ============================================================ depois de criar a sua conta em /entrar, rode (com o seu e-mail):
-- update public.perfis set papel = 'admin' where email = 'criativosrapidos@gmail.com';
