import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
const db = new PGlite();
const run = (sql) => db.exec(sql);
// --- Stubs do Supabase (auth, storage, papéis) ---
await run(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (bucket_id text, name text);
alter table storage.objects enable row level security; grant all on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
grant usage on schema public, auth, storage to authenticated, anon;
alter default privileges in schema public grant all on tables to authenticated, anon;
alter default privileges in schema public grant all on functions to authenticated, anon;
`);
await run(fs.readFileSync(new URL("../migrations/20261011000001_esquema_inicial.sql", import.meta.url), 'utf8'));
// hoje() controlável no teste
await run(`create or replace function public.hoje() returns date language sql stable as $$ select coalesce(nullif(current_setting('app.hoje', true), '')::date, current_date) $$;`);
const A='11111111-1111-1111-1111-111111111111', B='22222222-2222-2222-2222-222222222222';
await run(`insert into auth.users (id,email,raw_user_meta_data) values ('${A}','ana@x.com','{"nome":"Ana"}'),('${B}','bruno@x.com','{}');
insert into public.instituicoes (nome) values ('Instituição teste');`);
const as = async (uid, sql, params) => {
  await run(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
  try { return await db.query(sql, params); } finally { await run('reset role'); }
};
const setHoje = (d) => run(`select set_config('app.hoje', '${d}', false)`);
const ok = (c, msg) => { console.log((c ? 'OK   ' : 'FALHA') + ' ' + msg); if (!c) process.exitCode = 1; };
const falha = async (p, msg) => { try { await p; ok(false, msg + ' (devia ter falhado)'); } catch (e) { ok(true, msg + ' → ' + e.message); } };

console.log((await db.query('select * from public.perfis')).rows.map(r=>r.nome).join(', '));
await setHoje('2026-10-01');
const meta = (await as(A, `insert into public.metas (comunidade_id, titulo, checkins_por_semana, valor_centavos, semanas, instituicao_id)
  values ('habitos','Parar de fumar',2,1000,2,(select id from public.instituicoes limit 1)) returning id, codigo_convite`)).rows[0];
ok(meta.id, 'Ana cria meta (código ' + meta.codigo_convite + ')');
await falha(as(A, `update public.metas set valor_centavos = 500 where id = $1 returning id`, [meta.id]).then(r => { if (!r.rows.length) throw new Error('RLS bloqueou'); }), 'Ana não altera o valor da meta');
await falha(as(A, `select public.aceitar_convite($1)`, [meta.codigo_convite]), 'Ana não fiscaliza a própria meta');
await as(B, `select public.aceitar_convite($1)`, [meta.codigo_convite.toLowerCase()]);
ok((await db.query('select fiscal_id from public.metas')).rows[0].fiscal_id === B, 'Bruno vira fiscal com o código');
const c1 = (await as(A, `insert into public.checkins (meta_id, foto_path, dia) values ($1, $2, '2020-01-01') returning id, status, dia`, [meta.id, A + '/m/1.jpg'])).rows[0];
ok(c1.status === 'pendente' && String(c1.dia).includes('2026') , 'check-in fica pendente e com a data de hoje (ignora data enviada)');
await falha(as(A, `insert into public.checkins (meta_id, foto_path) values ($1, $2)`, [meta.id, A + '/m/2.jpg']), 'segundo check-in no mesmo dia');
await falha(as(B, `insert into public.checkins (meta_id, foto_path) values ($1, $2)`, [meta.id, B + '/m/1.jpg']), 'Bruno não faz check-in na meta da Ana');
await falha(as(A, `select public.revisar_checkin($1, true)`, [c1.id]), 'Ana não aprova o próprio check-in');
await as(B, `select public.revisar_checkin($1, true)`, [c1.id]);
ok((await db.query('select status from public.checkins')).rows[0].status === 'aprovado', 'Bruno aprova');
// Semana 1 com 1 de 2 check-ins → multa quando a avaliação rodar depois do prazo
await setHoje('2026-10-08'); ok((await db.query('select public.avaliar_metas() n')).rows[0].n === 0, 'dia 8: semana 1 ainda aguarda o fiscal (sem multa)');
await setHoje('2026-10-09'); ok((await db.query('select public.avaliar_metas() n')).rows[0].n === 1, 'dia 9: semana 1 vira multa');
ok((await db.query('select public.avaliar_metas() n')).rows[0].n === 0, 'rodar de novo não duplica');
const multa = (await as(A, 'select * from public.multas')).rows[0];
ok(multa && multa.valor_centavos === 1000 && multa.checkins_feitos === 1, 'Ana vê a multa de R$ 10 (1 de 2 check-ins)');
ok((await as(B, 'select * from public.multas')).rows.length === 0, 'Bruno não vê a multa da Ana');
await falha(as(A, `insert into public.metas (comunidade_id, titulo, checkins_por_semana, valor_centavos, semanas, instituicao_id) values ('estudos','Estudar',3,500,1,(select id from public.instituicoes limit 1))`), 'nova meta bloqueada com multa em aberto');
await falha(as(A, `update public.multas set status = 'paga' returning id`).then(r => { if (!r.rows.length) throw new Error('RLS bloqueou'); }), 'Ana não marca a multa como paga');
await falha(as(A, `select public.contestar_multa($1, 'curto')`, [multa.id]), 'contestação curta demais');
await as(A, `select public.contestar_multa($1, 'Fiquei internada no hospital essa semana.')`, [multa.id]);
ok((await db.query('select status from public.multas')).rows[0].status === 'contestada', 'contestação registrada');
// Semana 2: dois check-ins sem resposta do fiscal valem após 24h
for (const d of ['2026-10-09','2026-10-10']) { await setHoje(d); await as(A, `insert into public.checkins (meta_id, foto_path) values ($1, $2)`, [meta.id, A + '/m/' + d + '.jpg']); }
await run(`update public.checkins set criado_em = now() - interval '2 days' where status = 'pendente'`);
await setHoje('2026-10-16'); ok((await db.query('select public.avaliar_metas() n')).rows[0].n === 0, 'semana 2 cumprida (fiscal não respondeu em 24h, vale)');
ok((await db.query('select status from public.metas')).rows[0].status === 'encerrada', 'meta encerrada (teve multa)');
const feed = (await as(B, 'select nome, titulo, dia_da_meta from public.feed order by dia')).rows;
ok(feed.length === 3 && feed[0].nome === 'Ana' && feed[2].dia_da_meta === 10, 'feed mostra os check-ins da Ana: ' + JSON.stringify(feed.map(f=>f.dia_da_meta)));
await setHoje('2026-10-11');
const nums = (await as(B, 'select * from public.numeros_do_perfil($1)', [A])).rows[0];
ok(nums.sequencia === 2, 'sequência de 2 dias (9 e 10) vista no dia 11: ' + JSON.stringify(nums));
await falha(as(A, `insert into public.checkins (meta_id, foto_path) values ($1, $2)`, [meta.id, A + '/m/x.jpg']), 'check-in em meta encerrada');
await falha(as(A, `insert into storage.objects (bucket_id, name) values ('checkins', $1)`, [B + '/x.jpg']), 'Ana não envia foto na pasta do Bruno');
await as(A, `insert into storage.objects (bucket_id, name) values ('checkins', $1)`, [A + '/m/y.jpg']); ok(true, 'Ana envia foto na própria pasta');
