import { afterEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn() }));
vi.mock('../../src/services/supabase', () => ({
  getSupabaseBackend: () => ({ rpc: api.rpc, functions: { invoke: api.invoke } }),
}));
import { getTechnicianSubscription, payFirstSubscriptionInvoice, startTechnicianSubscription } from '../../src/services/technicianSubscription';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('technician subscription client', () => {
  it('reads the server rollout switch and refreshes provider state before showing paid status', async () => {
    api.invoke.mockResolvedValue({ data: { status: 'active' }, error: null });
    api.rpc.mockResolvedValue({ data: [{ status: 'active', next_billing_at: '2026-12-10', enforced: true }], error: null });
    expect(await getTechnicianSubscription(true)).toEqual({ status: 'active', nextBillingAt: '2026-12-10', enforced: true });
    expect(api.invoke).toHaveBeenCalledWith('technician-subscription', { body: { action: 'status' } });
    expect(api.rpc).toHaveBeenCalledWith('my_technician_subscription');
  });

  it('never pretends an incomplete provider subscription is active', async () => {
    api.invoke.mockResolvedValue({ data: { status: 'incomplete', intentId: 'pi_test', clientKey: 'pi_test_client' }, error: null });
    expect(await startTechnicianSubscription()).toEqual({ intentId: 'pi_test', clientKey: 'pi_test_client' });
  });

  it('sends sandbox card details only to PayMongo and handles 3DS redirects', async () => {
    vi.stubEnv('VITE_PAYMONGO_PUBLIC_KEY', 'pk_test_public');
    vi.stubEnv('VITE_PAYMONGO_RETURN_URL', 'https://fixhub.example/technician/subscription?return=1');
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 'pm_test' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: {
        attributes: { status: 'awaiting_next_action', next_action: { redirect: { url: 'https://paymongo.example/auth' } } },
      } }) });
    vi.stubGlobal('fetch', fetcher);
    const redirect = await payFirstSubscriptionInvoice(
      { intentId: 'pi_test', clientKey: 'client_test' },
      { number: '4242 4242 4242 4242', month: 12, year: 2028, cvc: '123' },
      { name: 'Test Technician', email: 'tech@example.test' },
    );
    expect(redirect).toBe('https://paymongo.example/auth');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][0]).toBe('https://api.paymongo.com/v1/payment_methods');
    expect(fetcher.mock.calls[1][0]).toBe('https://api.paymongo.com/v1/payment_intents/pi_test/attach');
    expect(JSON.parse(fetcher.mock.calls[1][1].body).data.attributes.client_key).toBe('client_test');
    expect(api.invoke).not.toHaveBeenCalled();
  });
});
