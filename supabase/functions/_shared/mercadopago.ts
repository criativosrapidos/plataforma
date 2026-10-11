// Cliente mínimo da API do Mercado Pago (Checkout Pro + consulta de pagamento).
const API = 'https://api.mercadopago.com';

function token(): string {
  const t = Deno.env.get('MP_ACCESS_TOKEN');
  if (!t) throw new Error('MP_ACCESS_TOKEN não configurado.');
  return t;
}

export type Preferencia = { id: string; init_point: string; sandbox_init_point: string };
export type Pagamento = {
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
};

export async function criarPreferencia(body: Record<string, unknown>, chave: string): Promise<Preferencia> {
  const r = await fetch(`${API}/checkout/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': chave },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Mercado Pago recusou a preferência (${r.status}): ${await r.text()}`);
  return await r.json();
}

export async function buscarPagamento(id: string): Promise<Pagamento> {
  const r = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!r.ok) throw new Error(`Pagamento ${id} não encontrado (${r.status}).`);
  return await r.json();
}

// Assinatura do webhook: header x-signature "ts=...,v1=..." = HMAC-SHA256 de
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" com a chave secreta do webhook.
export async function assinaturaValida(req: Request, dataId: string): Promise<boolean> {
  const segredo = Deno.env.get('MP_WEBHOOK_SECRET');
  if (!segredo) throw new Error('MP_WEBHOOK_SECRET não configurado.');
  const partes = Object.fromEntries(
    (req.headers.get('x-signature') ?? '').split(',').map((p) => p.trim().split('=') as [string, string]),
  );
  const requestId = req.headers.get('x-request-id') ?? '';
  if (!partes.ts || !partes.v1) return false;
  const manifesto = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${partes.ts};`;
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const assinatura = new Uint8Array(await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(manifesto)));
  const hex = Array.from(assinatura, (b) => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== partes.v1.length) return false;
  let dif = 0;
  for (let i = 0; i < hex.length; i++) dif |= hex.charCodeAt(i) ^ partes.v1.charCodeAt(i);
  return dif === 0;
}
