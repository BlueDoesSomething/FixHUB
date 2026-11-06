import { beforeEach, describe, expect, test, vi } from 'vitest';

const api = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() }));
vi.mock('@/services/supabase', () => ({ getSupabaseBackend: () => ({ rpc: api.rpc }) }));
import { fetchMyTechnicianLocation, saveMyTechnicianLocation, listLocatedTechnicians, stopSharingMyTechnicianLocation } from '@/services/technicianLocations';

beforeEach(() => {
  vi.clearAllMocks();
  api.rpc.mockReturnValue({ single: api.single, maybeSingle: api.maybeSingle });
  api.single.mockResolvedValue({ data: { technician_id: 'server-owned-id' }, error: null });
  api.maybeSingle.mockResolvedValue({ data: null, error: null });
});

describe('technician location API', () => {
  test('reads the current technician without a caller-selected identity', async () => {
    expect(await fetchMyTechnicianLocation()).toBeNull();
    expect(api.rpc).toHaveBeenCalledWith('get_my_technician_location');
  });
  test('validates GPS and allow-lists fields while supplying a fallback coordinate label', async () => {
    await expect(saveMyTechnicianLocation({ lat: 91, lng: 0 }, 'Shop')).rejects.toThrow('valid');
    await expect(saveMyTechnicianLocation({ lat: 0, lng: 0 }, 'x'.repeat(501))).rejects.toThrow('500');
    expect(api.rpc).not.toHaveBeenCalled();
    await saveMyTechnicianLocation({ lat: 0, lng: 0, userId: 'forged' } as { lat: number; lng: number }, ' ');
    expect(api.rpc).toHaveBeenCalledWith('save_my_technician_location', { p_latitude: 0, p_longitude: 0, p_address: 'Pinned location (0.00000, 0.00000)' });
  });
  test('does not confirm unsuccessful writes or failed stop-sharing requests', async () => {
    api.single.mockResolvedValue({ data: null, error: { message: 'Denied' } });
    await expect(saveMyTechnicianLocation({ lat: 0, lng: 0 }, 'Shop')).rejects.toThrow('not been confirmed');
    api.rpc.mockResolvedValue({ error: { message: 'Denied' } });
    await expect(stopSharingMyTechnicianLocation()).rejects.toThrow('could not be stopped');
  });
  test('uses only real, valid directory coordinates and surfaces read failures', async () => {
    api.rpc.mockResolvedValue({ data: [{ id: 'valid', latitude: 14, longitude: 121 }, { id: 'invalid', latitude: null, longitude: 121 }], error: null });
    expect((await listLocatedTechnicians()).map(item => item.id)).toEqual(['valid']);
    api.rpc.mockResolvedValue({ data: null, error: { message: 'Offline' } });
    await expect(listLocatedTechnicians()).rejects.toThrow('could not be loaded');
  });
});
