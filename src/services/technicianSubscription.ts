import { getSupabaseBackend } from './supabase';

export type SubscriptionStatus = 'none' | 'incomplete' | 'incomplete_cancelled' | 'active'
  | 'past_due' | 'unpaid' | 'cancelled';

export interface TechnicianSubscription {
  status: SubscriptionStatus;
  nextBillingAt: string | null;
  enforced: boolean;
}

export const MONTHLY_TECHNICIAN_FEE = 150;

async function invoke(action: 'status' | 'start' | 'cancel') {
  const { data, error } = await getSupabaseBackend().functions.invoke('technician-subscription', { body: { action } });
  if (error) {
    const details = await error.context?.json?.().catch(() => null);
    throw new Error(details?.error || error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data as { status: SubscriptionStatus; intentId?: string; clientKey?: string };
}

export async function getTechnicianSubscription(refreshProvider = false): Promise<TechnicianSubscription> {
  if (refreshProvider) await invoke('status');
  const { data, error } = await getSupabaseBackend().rpc('my_technician_subscription');
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('Technician subscription status is unavailable.');
  return { status: row.status as SubscriptionStatus, nextBillingAt: row.next_billing_at, enforced: row.enforced };
}

export async function startTechnicianSubscription() {
  const result = await invoke('start');
  if (!result.intentId || !result.clientKey) {
    if (result.status === 'active') throw new Error('Your subscription is already active.');
    throw new Error(`Subscription is ${result.status}. Cancel it before starting a new one.`);
  }
  return { intentId: result.intentId, clientKey: result.clientKey };
}

export async function cancelTechnicianSubscription() {
  return invoke('cancel');
}

async function paymongoPublic(path: string, attributes: Record<string, unknown>) {
  const key = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY?.trim();
  if (!key?.startsWith('pk_test_')) throw new Error('Configure VITE_PAYMONGO_PUBLIC_KEY with a sandbox public key.');
  const response = await fetch(`https://api.paymongo.com${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(`${key}:`)}` },
    body: JSON.stringify({ data: { attributes } }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.errors?.[0]?.detail || 'PayMongo could not process this payment.');
  return result.data as { id: string; attributes: { status: string; next_action?: { redirect?: { url?: string } }; last_payment_error?: { detail?: string } } };
}

/** Card details go directly from the browser to PayMongo, never to Supabase. */
export async function payFirstSubscriptionInvoice(
  intent: { intentId: string; clientKey: string },
  card: { number: string; month: number; year: number; cvc: string },
  billing: { name: string; email: string; phone?: string },
): Promise<string | null> {
  const returnUrl = import.meta.env.VITE_PAYMONGO_RETURN_URL?.trim()
    || (location.protocol.startsWith('http') ? `${location.origin}/technician/subscription?return=1` : '');
  if (!returnUrl || !/^https?:\/\//.test(returnUrl)) {
    throw new Error('Set VITE_PAYMONGO_RETURN_URL to your HTTPS subscription page for Android payments.');
  }
  const method = await paymongoPublic('/v1/payment_methods', {
    type: 'card',
    details: { card_number: card.number.replace(/\s/g, ''), exp_month: card.month,
      exp_year: card.year, cvc: card.cvc },
    billing: { name: billing.name, email: billing.email, ...(billing.phone ? { phone: billing.phone } : {}) },
  });
  const attached = await paymongoPublic(`/v1/payment_intents/${encodeURIComponent(intent.intentId)}/attach`, {
    payment_method: method.id, client_key: intent.clientKey, return_url: returnUrl,
  });
  if (attached.attributes.status === 'awaiting_next_action') {
    const url = attached.attributes.next_action?.redirect?.url;
    if (!url || !url.startsWith('https://')) throw new Error('PayMongo did not provide a secure authentication URL.');
    return url;
  }
  if (attached.attributes.status !== 'succeeded' && attached.attributes.status !== 'processing') {
    throw new Error(attached.attributes.last_payment_error?.detail || 'Payment could not be completed. Try another card.');
  }
  return null;
}
