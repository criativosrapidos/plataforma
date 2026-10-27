-- Agendamentos da plataforma (rodar depois de publicar as funções). Pode rodar de novo: o mesmo nome substitui.
-- Variáveis do psql: :'projeto' (ex.: glffgfjlhltahyatsjed) e :'segredo' (o mesmo CRON_SECRET das funções).
-- Horários em UTC: 9h UTC = 6h em Brasília.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('postar-instagram', '*/10 * * * *', format($c$
  select net.http_post(url := 'https://%s.supabase.co/functions/v1/instagram/agendados',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', %L));
$c$, :'projeto', :'segredo'));

select cron.schedule('trafego-meta', '0 9 * * *', format($c$
  select net.http_post(url := 'https://%s.supabase.co/functions/v1/trafego/agendado',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', %L));
$c$, :'projeto', :'segredo'));

-- a esteira roda em sequência (pauta 6h, roteiro 6h20, copy 6h40, arte e edição 7h) e os outros agentes às 7h20 (Brasília)
select cron.unschedule(jobname) from cron.job where jobname = 'agentes-ia';
select cron.schedule('agentes-' || g, h, format($c$
  select net.http_post(url := 'https://%s.supabase.co/functions/v1/agentes/agendado',
    body := jsonb_build_object('grupo', %L),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', %L),
    timeout_milliseconds := 300000);
$c$, :'projeto', g, :'segredo'))
from (values ('pauta', '0 9 * * *'), ('roteiro', '20 9 * * *'), ('copy', '40 9 * * *'), ('arte', '0 10 * * *'), ('edicao', '5 10 * * *'), ('livres', '20 10 * * *')) as t(g, h);
