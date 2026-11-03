import { beforeEach, describe, expect, test, vi } from 'vitest';

const api = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), getUser: vi.fn(), update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn() }));
vi.mock('@/services/supabase', () => ({ getSupabaseBackend: () => ({ rpc: api.rpc, from: api.from, auth: { getUser: api.getUser } }) }));
import { fetchMySupabaseAccount, updateMySupabaseProfile } from '@/services/supabaseAccount';

beforeEach(() => {
  vi.clearAllMocks();
  api.rpc.mockReturnValue({ single: api.single });
  api.from.mockReturnValue({ update: api.update });
  api.update.mockReturnValue({ eq: api.eq });
  api.eq.mockReturnValue({ select: api.select });
  api.select.mockReturnValue({ single: api.single });
  api.getUser.mockResolvedValue({ data: { user: { id: 'verified-auth-uuid' } }, error: null });
  api.single.mockResolvedValue({ data: { user_id: 'verified-auth-uuid', full_name: 'Alice Test', role: 'client' }, error: null });
});

describe('Supabase account API', () => {
  test('loads the current account through the RLS-protected RPC without a client-selected identity', async () => {
    const account = await fetchMySupabaseAccount();
    expect(account.role).toBe('client');
    expect(api.rpc).toHaveBeenCalledWith('get_my_account');
  });

  test('does not substitute a demo account after a backend read failure', async () => {
    api.single.mockResolvedValue({ data: null, error: { message: 'Permission denied' } });
    await expect(fetchMySupabaseAccount()).rejects.toThrow('could not be loaded');
  });

  test('updates only allowed fields using a verified Supabase user ID', async () => {
    const input = { fullName: '  Alice Test  ', phone: ' +63 917 123 4567 ', city: ' Makati ', role: 'admin', user_id: 'another-account' };
    await updateMySupabaseProfile(input);
    expect(api.update).toHaveBeenCalledWith({ full_name: 'Alice Test', phone: '+63 917 123 4567', city: 'Makati' });
    expect(api.eq).toHaveBeenCalledWith('user_id', 'verified-auth-uuid');
  });

  test('does not write a profile when signed out', async () => {
    api.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(updateMySupabaseProfile({ fullName: 'Alice Test', phone: '', city: '' })).rejects.toThrow('Sign in');
    expect(api.from).not.toHaveBeenCalled();
  });

  test('rejects invalid profile fields before requesting an update', async () => {
    await expect(updateMySupabaseProfile({ fullName: 'X', phone: '', city: '' })).rejects.toThrow('2–120');
    await expect(updateMySupabaseProfile({ fullName: 'Alice', phone: '1'.repeat(33), city: '' })).rejects.toThrow('32');
    expect(api.from).not.toHaveBeenCalled();
  });

  test('does not claim successful saving when PostgreSQL rejects the update', async () => {
    api.single.mockResolvedValue({ data: null, error: { message: 'Forbidden' } });
    await expect(updateMySupabaseProfile({ fullName: 'Alice', phone: '', city: '' })).rejects.toThrow('not been confirmed');
  });
});
