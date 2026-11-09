import { beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';

const api = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(), channel: vi.fn(), on: vi.fn(), subscribe: vi.fn(), remove: vi.fn(), setAuth: vi.fn() }));
vi.mock('@/services/supabase', () => ({ getSupabaseBackend: () => ({ rpc: api.rpc, channel: api.channel, removeChannel: api.remove, realtime: { setAuth: api.setAuth } }) }));
import { fetchMyTechnicianLocation, saveMyTechnicianLocation, listLocatedTechnicians, stopSharingMyTechnicianLocation, publishMyLiveLocation, subscribeToTechnicianLocations } from '@/services/technicianLocations';
import { LocationSetupError } from '@/services/locationErrors';

beforeEach(() => {
  vi.clearAllMocks();
  api.rpc.mockReturnValue({ single: api.single, maybeSingle: api.maybeSingle });
  api.single.mockResolvedValue({ data: { technician_id: 'server-owned-id' }, error: null });
  api.maybeSingle.mockResolvedValue({ data: null, error: null });
  const channel = { on: api.on, subscribe: api.subscribe };
  api.channel.mockReturnValue(channel);
  api.on.mockReturnValue(channel);
  api.setAuth.mockResolvedValue(undefined);
  api.remove.mockResolvedValue('ok');
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

  test('allow-lists live coordinates, without caller identities or an expiry', async () => {
    await publishMyLiveLocation({ lat: 14.55, lng: 121.02 });
    expect(api.rpc).toHaveBeenCalledWith('publish_my_live_location', { p_latitude: 14.55, p_longitude: 121.02 });
    await expect(publishMyLiveLocation({ lat: Infinity, lng: 0 })).rejects.toThrow('valid GPS');
  });

  test('distinguishes a missing deployment from denied access or a network failure', async () => {
    api.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } });
    await expect(listLocatedTechnicians()).rejects.toBeInstanceOf(LocationSetupError);
    api.rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } });
    const denied = await listLocatedTechnicians().catch(error => error as Error);
    expect(denied).not.toBeInstanceOf(LocationSetupError);
    expect(denied.message).toContain('could not be loaded');
    api.rpc.mockResolvedValue({ data: null, error: null });
    expect(await listLocatedTechnicians()).toEqual([]);
  });

  test('shares one private subscription across panels and disposes only after the last consumer leaves', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const connection = vi.fn();
    const stopFirst = subscribeToTechnicianLocations(first, connection);
    const stopSecond = subscribeToTechnicianLocations(second, vi.fn());
    await flushPromises();
    expect(api.setAuth).toHaveBeenCalledOnce();
    expect(api.channel).toHaveBeenCalledWith('technician-directory', { config: { private: true } });
    const status = api.subscribe.mock.calls[0][0];
    status('SUBSCRIBED');
    expect(connection).toHaveBeenLastCalledWith(true);
    expect(first).toHaveBeenCalledOnce();
    const update = api.on.mock.calls[0][2];
    update();
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    stopFirst();
    expect(api.remove).not.toHaveBeenCalled();
    update();
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(3);
    stopSecond();
    expect(api.remove).toHaveBeenCalledOnce();
    update();
    expect(second).toHaveBeenCalledTimes(3);
    await flushPromises();
  });

  test('does not create a socket when a panel leaves during authentication setup', async () => {
    const stop = subscribeToTechnicianLocations(vi.fn(), vi.fn());
    stop();
    await flushPromises();
    expect(api.channel).not.toHaveBeenCalled();
  });
});
