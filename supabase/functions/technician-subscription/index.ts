import { createClient } from 'npm:@supabase/supabase-js@2';
import { adminClient, cors, findCustomerSubscription, paymongo, reply, retrieveSubscription, statusFields, verifyPlan,
  type Subscription } from '../_shared/paymongo.ts';

const db = adminClient();

type BillingRow = {
  user_id: string; paymongo_customer_id: string | null;
  paymongo_subscription_id: string | null; status: string;
};

async function save(userId: string, subscription: Subscription, customerId: string) {
  const { error } = await db.from('technician_subscriptions').upsert({
    user_id: userId, paymongo_customer_id: customerId,
    paymongo_subscription_id: subscription.id, starting_at: null,
    ...statusFields(subscription),
  });
  if (error) throw error;
  return subscription.attributes.status;
}

async function current(userId: string) {
  const { data, error } = await db.from('technician_subscriptions').select('*')
    .eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data as BillingRow | null;
}

async function sync(userId: string, row: BillingRow) {
  if (!row.paymongo_subscription_id) return null;
  const subscription = await retrieveSubscription(row.paymongo_subscription_id);
  if (subscription.attributes.customer_id !== row.paymongo_customer_id) {
    throw new Error('Subscription customer mismatch.');
  }
  await save(userId, subscription, row.paymongo_customer_id!);
  return subscription;
}

async function paymentIntent(subscription: Subscription) {
  const id = subscription.attributes.latest_invoice?.payment_intent?.id;
  if (!id) throw new Error('PayMongo did not provide an invoice payment intent.');
  const intent = await paymongo(`/v1/payment_intents/${encodeURIComponent(id)}`);
  if (intent?.attributes?.amount !== 15000 || intent.attributes.currency !== 'PHP'
    || intent.attributes.livemode !== false || !intent.attributes.client_key) {
    throw new Error('PayMongo did not provide a valid ₱150 sandbox invoice payment intent.');
  }
  return { intentId: id, clientKey: intent.attributes.client_key };
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer /i, '');
    if (!token) return reply({ error: 'Sign in as a technician.' }, 401);
    const auth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await auth.auth.getUser(token);
    if (authError || !user) return reply({ error: 'Invalid session.' }, 401);
    const { data: role } = await db.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (role?.role !== 'technician') return reply({ error: 'Technician access required.' }, 403);

    const { action } = await request.json();
    const row = await current(user.id);
    if (action === 'status') {
      const subscription = row?.paymongo_subscription_id && Deno.env.get('PAYMONGO_SECRET_KEY')
        ? await sync(user.id, row) : null;
      return reply({ status: subscription?.attributes.status ?? row?.status ?? 'none' });
    }
    if (action === 'cancel') {
      if (!row?.paymongo_subscription_id) return reply({ error: 'No subscription to cancel.' }, 400);
      await paymongo(`/v1/subscriptions/${encodeURIComponent(row.paymongo_subscription_id)}`, 'DELETE');
      // Cancellation is immediate. A later webhook or refresh reconciles it again.
      const { error } = await db.from('technician_subscriptions').update({
        status: 'cancelled', next_billing_at: null, updated_at: new Date().toISOString(),
      }).eq('user_id', user.id).eq('paymongo_subscription_id', row.paymongo_subscription_id);
      if (error) throw error;
      return reply({ status: 'cancelled' });
    }
    if (action !== 'start') return reply({ error: 'Unknown action.' }, 400);

    const { data: profile } = await db.from('technician_profiles').select('id')
      .eq('user_id', user.id).eq('is_active', true).maybeSingle();
    if (!profile) return reply({ error: 'An approved, active technician profile is required.' }, 403);
    const planId = await verifyPlan();
    if (row?.paymongo_subscription_id) {
      const subscription = await sync(user.id, row);
      if (subscription?.attributes.status === 'incomplete') {
        return reply({ status: 'incomplete', ...await paymentIntent(subscription) });
      }
      if (!['cancelled', 'incomplete_cancelled'].includes(subscription?.attributes.status ?? '')) {
        return reply({ status: subscription?.attributes.status });
      }
    }

    const { data: attemptId, error: claimError } = await db.rpc('claim_technician_subscription_start', {
      p_user_id: user.id,
    });
    if (claimError) throw claimError;
    if (!attemptId) return reply({ error: 'Subscription setup is already in progress. Refresh shortly.' }, 409);
    try {
      let customerId = row?.paymongo_customer_id;
      if (!customerId) {
        const { data: person, error: profileError } = await db.from('profiles')
          .select('full_name,phone').eq('user_id', user.id).single();
        if (profileError) throw profileError;
        const names = (person.full_name || 'FIXHUB Technician').trim().split(/\s+/);
        const customer = await paymongo('/v1/customers', 'POST', {
          first_name: names[0], last_name: names.slice(1).join(' ') || names[0],
          email: user.email, ...(person.phone ? { phone: person.phone } : {}),
        }, `fixhub-customer-${user.id}`);
        customerId = customer.id as string;
        const { error } = await db.from('technician_subscriptions').update({
          paymongo_customer_id: customerId,
        }).eq('user_id', user.id);
        if (error) throw error;
      }
      const existing = await findCustomerSubscription(customerId!, planId);
      if (existing) {
        await save(user.id, existing, customerId!);
        return existing.attributes.status === 'incomplete'
          ? reply({ status: 'incomplete', ...await paymentIntent(existing) })
          : reply({ status: existing.attributes.status });
      }
      const created = await paymongo('/v1/subscriptions', 'POST', {
        plan_id: planId, customer_id: customerId,
      }, `fixhub-subscription-${attemptId}`) as Subscription;
      if (created.attributes.customer_id !== customerId || created.attributes.livemode !== false) {
        throw new Error('Unexpected PayMongo subscription response.');
      }
      await save(user.id, created, customerId!);
      return reply({ status: created.attributes.status, ...await paymentIntent(created) });
    } finally {
      await db.from('technician_subscriptions').update({ starting_at: null })
        .eq('user_id', user.id).eq('start_attempt_id', attemptId);
    }
  } catch (cause) {
    return reply({ error: cause instanceof Error ? cause.message : 'Subscription setup failed.' }, 400);
  }
});
