// Recebe a notificação do Mercado Pago, confere a assinatura e consulta o pagamento na API
// antes de marcar a multa como paga. Nunca confia no corpo da notificação.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { assinaturaValida, buscarPagamento } from '../_shared/mercadopago.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');

  const url = new URL(req.url);
  const corpo = await req.json().catch(() => ({}));
  const tipo = url.searchParams.get('type') ?? corpo.type;
  const dataId = url.searchParams.get('data.id') ?? corpo?.data?.id?.toString();
  if (tipo !== 'payment' || !dataId) return new Response('ignorado');

  if (!(await assinaturaValida(req, dataId))) return new Response('assinatura inválida', { status: 401 });

  const pagamento = await buscarPagamento(dataId);
  if (pagamento.status !== 'approved' || !pagamento.external_reference) return new Response('ok');

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: multa } = await admin
    .from('multas')
    .select('id, status, valor_centavos')
    .eq('id', pagamento.external_reference)
    .maybeSingle();
  if (!multa) return new Response('multa não encontrada');
  if (pagamento.currency_id !== 'BRL' || Math.round(pagamento.transaction_amount * 100) !== multa.valor_centavos) {
    console.error('Valor divergente', { multa: multa.id, pagamento: pagamento.id });
    return new Response('valor divergente');
  }
  if (multa.status === 'aberta' || multa.status === 'contestada') {
    await admin
      .from('multas')
      .update({ status: 'paga', mp_payment_id: String(pagamento.id), pago_em: new Date().toISOString() })
      .eq('id', multa.id);
  }
  return new Response('ok');
});
