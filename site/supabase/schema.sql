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
