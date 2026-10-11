-- Avalia as metas todo dia às 03:10 (horário de Brasília = 06:10 UTC).
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('avaliar-metas', '10 6 * * *', $$ select public.avaliar_metas(); $$);
