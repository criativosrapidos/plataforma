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

-- os agentes rodam depois do tráfego e do Instagram, pra já pegarem os números do dia
select cron.schedule('agentes-ia', '30 9 * * *', format($c$
  select net.http_post(url := 'https://%s.supabase.co/functions/v1/agentes/agendado',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', %L),
    timeout_milliseconds := 300000);
$c$, :'projeto', :'segredo'));
