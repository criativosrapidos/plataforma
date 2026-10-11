// Gera o link de pagamento (Pix ou cartão, Checkout Pro) de uma multa em aberto da pessoa logada.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { criarPreferencia } from '../_shared/mercadopago.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ erro: 'Use POST.' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const usuario = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await usuario.auth.getUser();
  if (!user) return json({ erro: 'Entre na sua conta.' }, 401);

  const { multa_id } = await req.json().catch(() => ({}));
  if (typeof multa_id !== 'string') return json({ erro: 'Informe a multa.' }, 400);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: multa } = await admin
    .from('multas')
    .select('id, user_id, status, valor_centavos, semana, metas(titulo)')
    .eq('id', multa_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!multa) return json({ erro: 'Multa não encontrada.' }, 404);
  if (multa.status !== 'aberta') return json({ erro: 'Essa multa não está em aberto.' }, 409);

  const titulo = (multa.metas as unknown as { titulo: string } | null)?.titulo ?? 'meta';
  const preferencia = await criarPreferencia(
    {
      items: [{
        id: multa.id,
        title: `Multa FocoMulta · ${titulo} · semana ${multa.semana}`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: multa.valor_centavos / 100,
      }],
      payer: { email: user.email },
      external_reference: multa.id,
      notification_url: `${url}/functions/v1/mp-webhook`,
      statement_descriptor: 'FOCOMULTA',
    },
    `multa-${multa.id}-${Date.now()}`,
  );

  await admin.from('multas').update({ mp_preference_id: preferencia.id }).eq('id', multa.id);
  const sandbox = Deno.env.get('MP_SANDBOX') === 'true';
  return json({ link: sandbox ? preferencia.sandbox_init_point : preferencia.init_point });
});
