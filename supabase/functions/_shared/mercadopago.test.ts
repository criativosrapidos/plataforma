// deno test --allow-env supabase/functions/_shared
import { assinaturaValida } from './mercadopago.ts';

async function assinar(segredo: string, manifesto: string) {
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const a = new Uint8Array(await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(manifesto)));
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

const pedido = (assinatura: string) =>
  new Request('https://x/functions/v1/mp-webhook?data.id=123&type=payment', {
    method: 'POST',
    headers: { 'x-signature': assinatura, 'x-request-id': 'req-1' },
  });

Deno.test('aceita a assinatura correta do Mercado Pago', async () => {
  Deno.env.set('MP_WEBHOOK_SECRET', 'segredo');
  const v1 = await assinar('segredo', 'id:123;request-id:req-1;ts:1700000000;');
  if (!(await assinaturaValida(pedido(`ts=1700000000,v1=${v1}`), '123'))) throw new Error('devia aceitar');
});

Deno.test('recusa assinatura com outro segredo, outro id ou sem header', async () => {
  Deno.env.set('MP_WEBHOOK_SECRET', 'segredo');
  const errada = await assinar('outro', 'id:123;request-id:req-1;ts:1700000000;');
  if (await assinaturaValida(pedido(`ts=1700000000,v1=${errada}`), '123')) throw new Error('segredo errado aceito');
  const certa = await assinar('segredo', 'id:123;request-id:req-1;ts:1700000000;');
  if (await assinaturaValida(pedido(`ts=1700000000,v1=${certa}`), '999')) throw new Error('id trocado aceito');
  if (await assinaturaValida(pedido(''), '123')) throw new Error('sem header aceito');
});
