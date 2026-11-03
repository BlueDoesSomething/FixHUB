import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { onAuthChange } from '@/services/supabaseAuth';

type Listener = (event: string, session: { user: { id: string; email: string } } | null) => unknown;
const mocks = vi.hoisted(() => ({ subscribe: vi.fn(), account: vi.fn() }));
vi.mock('@/services/supabase', () => ({ getSupabaseBackend: () => ({ auth: { onAuthStateChange: mocks.subscribe } }) }));
vi.mock('@/services/supabaseAccount', () => ({ fetchMySupabaseAccount: mocks.account }));

let listener: Listener;
const session = { user: { id: 'test-user', email: 'user@example.test' } };
const account = { user_id: 'test-user', full_name: 'Test User', role: 'client' };
beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  mocks.subscribe.mockImplementation((callback: Listener) => { listener = callback; return { data: { subscription: {} } }; });
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

describe('auth state notifications', () => {
  test('releases the auth callback before making an authenticated account request', async () => {
    const callback = vi.fn();
    mocks.account.mockResolvedValue(account);
    onAuthChange(callback);
    expect(listener('SIGNED_IN', session)).toBeUndefined();
    expect(mocks.account).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledWith({ userId: 'test-user', email: session.user.email, account });
  });

  test('cannot restore a stale account after sign-out while its profile is loading', async () => {
    const callback = vi.fn();
    let finish!: (value: unknown) => void;
    mocks.account.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    onAuthChange(callback);
    listener('SIGNED_IN', session);
    await vi.advanceTimersByTimeAsync(0);
    listener('SIGNED_OUT', null);
    finish(account);
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledExactlyOnceWith(null);
  });

  test('does not substitute an example account when its profile cannot be read', async () => {
    const callback = vi.fn();
    mocks.account.mockRejectedValue(new Error('Unavailable'));
    onAuthChange(callback);
    listener('SIGNED_IN', session);
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledExactlyOnceWith(null);
  });
});
