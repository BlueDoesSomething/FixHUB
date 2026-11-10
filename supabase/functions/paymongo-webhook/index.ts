import { adminClient, reply, retrieveSubscription, statusFields } from '../_shared/paymongo.ts';

const db = adminClient();

async function validSignature(body: string, header: string | null) {
  const secret = Deno.env.get('PAYMONGO_WEBHOOK_SECRET');
  if (!secret || !header) return false;
  const fields = Object.fromEntries(header.split(',').map(part => part.trim().split('=', 2)));
  const timestamp = Number(fields.t);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const supplied = fields.te?.toLowerCase();
  if (!supplied || !/^[a-f0-9]{64}$/.test(supplied)) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key,
    new TextEncoder().encode(`${fields.t}.${body}`)));
  const expected = Array.from(signature, byte => byte.toString(16).padStart(2, '0')).join('');
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return difference === 0;
}

Deno.serve(async request => {
  if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
  try {
    const body = await request.text();
    if (!await validSignature(body, request.headers.get('paymongo-signature'))) {
      return reply({ error: 'Invalid webhook signature.' }, 401);
    }
    const event = JSON.parse(body);
    const attributes = event?.data?.attributes;
    if (attributes?.livemode !== false) return reply({ error: 'Live payments are not accepted in sandbox.' }, 400);
    const type = attributes?.type;
    if (typeof type !== 'string' || !type.startsWith('subscription.')) return reply({ received: true });
    const resource = attributes?.data;
    const id = resource?.type === 'subscription' ? resource.id
      : resource?.type === 'invoice' ? resource.attributes?.resource_id : null;
    if (typeof id !== 'string' || !id.startsWith('subs_')) return reply({ received: true });
    // Re-read PayMongo rather than trusting webhook ordering or payload status.
    // Duplicate and out-of-order deliveries always converge on the latest state.
    const subscription = await retrieveSubscription(id);
    const { data: row, error: lookupError } = await db.from('technician_subscriptions')
      .select('user_id,paymongo_customer_id').eq('paymongo_subscription_id', id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!row) return reply({ received: true });
    if (subscription.attributes.customer_id !== row.paymongo_customer_id) {
      return reply({ error: 'Subscription customer mismatch.' }, 400);
    }
    const { error } = await db.from('technician_subscriptions').update(statusFields(subscription))
      .eq('user_id', row.user_id).eq('paymongo_subscription_id', id);
    if (error) throw error;
    return reply({ received: true });
  } catch {
    // A 5xx prompts PayMongo to retry transient failures.
    return reply({ error: 'Webhook could not be processed.' }, 500);
  }
});
