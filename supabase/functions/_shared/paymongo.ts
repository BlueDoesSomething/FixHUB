import { createClient } from 'npm:@supabase/supabase-js@2';

export const monthlyCentavos = 15000;
export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type Subscription = {
  id: string;
  attributes: {
    status: string; livemode: boolean; customer_id: string;
    next_billing_schedule: string | null;
    plan: { id: string; amount: number; currency: string; interval: string; interval_count: number };
    latest_invoice?: { payment_intent?: { id: string }; status?: string };
  };
};

export async function paymongo(path: string, method = 'GET', attributes?: Record<string, unknown>, idempotencyKey?: string) {
  const key = Deno.env.get('PAYMONGO_SECRET_KEY');
  if (!key?.startsWith('sk_test_')) throw new Error('Configure a PayMongo sandbox secret key on the server.');
  const response = await fetch(`https://api.paymongo.com${path}`, {
    method,
    headers: { Authorization: `Basic ${btoa(`${key}:`)}`, 'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
    body: attributes ? JSON.stringify({ data: { attributes } }) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.errors?.[0]?.detail || `PayMongo returned ${response.status}. Check sandbox subscription access and configuration.`);
  }
  if (response.status === 204) return null;
  return (await response.json()).data;
}

/** Reconcile uncertain create responses before ever creating another payable subscription. */
export async function findCustomerSubscription(customerId: string, planId: string) {
  const list = await paymongo(`/v1/subscriptions?customer_id=${encodeURIComponent(customerId)}&plan_id=${encodeURIComponent(planId)}&limit=100`);
  if (!Array.isArray(list)) throw new Error('Could not reconcile PayMongo subscriptions.');
  const payable = list.filter((item: Subscription) =>
    ['incomplete', 'active', 'past_due', 'unpaid'].includes(item.attributes?.status));
  if (payable.length > 1 || (list.length === 100 && !payable.length)) {
    throw new Error('Multiple or unverified subscriptions found. Contact FIXHUB support before retrying.');
  }
  return payable.length === 1 ? retrieveSubscription(payable[0].id) : null;
}

export async function verifyPlan() {
  const id = Deno.env.get('PAYMONGO_PLAN_ID');
  if (!id?.startsWith('plan_')) throw new Error('Configure the PayMongo monthly plan ID on the server.');
  const plan = await paymongo(`/v1/subscriptions/plans/${encodeURIComponent(id)}`);
  const a = plan.attributes;
  if (a.livemode !== false || a.amount !== monthlyCentavos || a.currency !== 'PHP'
    || !['month', 'monthly'].includes(a.interval) || a.interval_count !== 1
    || a.type === 'on_demand' || a.cycle_count != null) throw new Error('The PayMongo plan must be ₱150 monthly, unlimited cycles, in sandbox mode.');
  return id;
}

export async function retrieveSubscription(id: string): Promise<Subscription> {
  const subscription = await paymongo(`/v1/subscriptions/${encodeURIComponent(id)}`) as Subscription;
  const a = subscription.attributes;
  if (a.livemode !== false || a.plan?.id !== Deno.env.get('PAYMONGO_PLAN_ID')
    || a.plan.amount !== monthlyCentavos || a.plan.currency !== 'PHP'
    || !['month', 'monthly'].includes(a.plan.interval) || a.plan.interval_count !== 1
    || (a.plan as typeof a.plan & { cycle_count?: number }).cycle_count != null) {
    throw new Error('PayMongo subscription does not match the configured sandbox plan.');
  }
  return subscription;
}

export function statusFields(subscription: Subscription) {
  const status = subscription.attributes.status;
  if (!['incomplete', 'incomplete_cancelled', 'active', 'past_due', 'unpaid', 'cancelled'].includes(status)) {
    throw new Error('Unknown PayMongo subscription status.');
  }
  return { status, next_billing_at: subscription.attributes.next_billing_schedule ?? null,
    updated_at: new Date().toISOString() };
}
