import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const sdk = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: sdk.createClient }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_SUPABASE_URL', '');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
  sdk.createClient.mockReturnValue({ kind: 'supabase-client' });
});
afterEach(() => vi.unstubAllEnvs());

function configure(url = 'https://fixhub-example.supabase.co', key = 'sb_publishable_example_public_key') {
  vi.stubEnv('VITE_SUPABASE_URL', url);
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', key);
}

describe('Supabase client foundation', () => {
  test('importing the service does not initialize a client or change demo mode', async () => {
    await import('@/services/supabase');
    expect(sdk.createClient).not.toHaveBeenCalled();
  });

  test('missing configuration fails clearly without falling back to demo or Firebase', async () => {
    const { getSupabaseBackend } = await import('@/services/supabase');
    expect(() => getSupabaseBackend()).toThrow('Configure VITE_SUPABASE_URL');
    expect(sdk.createClient).not.toHaveBeenCalled();
  });

  test('creates and reuses one typed client with persistent PKCE sessions', async () => {
    configure(' https://fixhub-example.supabase.co/ ', ' sb_publishable_example_public_key ');
    const { getSupabaseBackend } = await import('@/services/supabase');
    expect(getSupabaseBackend()).toBe(getSupabaseBackend());
    expect(sdk.createClient).toHaveBeenCalledOnce();
    expect(sdk.createClient).toHaveBeenCalledWith('https://fixhub-example.supabase.co', 'sb_publishable_example_public_key', {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
    });
  });

  test.each(['sb_secret_never_use_this', `header.${btoa(JSON.stringify({ role: 'service_role' }))}.signature`, 'random-key'])('rejects non-public key %s', async key => {
    configure(undefined, key);
    const { getSupabaseBackend } = await import('@/services/supabase');
    expect(() => getSupabaseBackend()).toThrow('publishable key');
    expect(sdk.createClient).not.toHaveBeenCalled();
  });

  test('accepts the local CLI legacy anon-key format', async () => {
    configure('http://127.0.0.1:54321', `header.${btoa(JSON.stringify({ role: 'anon' }))}.signature`);
    const { readSupabaseConfig } = await import('@/services/supabase');
    expect(readSupabaseConfig().url).toBe('http://127.0.0.1:54321');
  });

  test.each(['postgresql://postgres:password@db.example.com:5432/postgres', 'not-a-url', 'https://name:password@example.com', 'https://example.com/rest/v1', 'https://example.com?key=private', 'https://example.com#token', 'http://example.com'])('rejects unsafe or incorrect API URL %s', async url => {
    configure(url);
    const { getSupabaseBackend } = await import('@/services/supabase');
    expect(() => getSupabaseBackend()).toThrow();
    expect(sdk.createClient).not.toHaveBeenCalled();
  });

  test('production refuses a local HTTP development endpoint', async () => {
    vi.stubEnv('DEV', false);
    configure('http://localhost:54321');
    const { getSupabaseBackend } = await import('@/services/supabase');
    expect(() => getSupabaseBackend()).toThrow('Local HTTP is allowed only for development');
  });
});
