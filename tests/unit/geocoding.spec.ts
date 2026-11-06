import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const fetchMock = vi.fn();
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('VITE_MAP_SEARCH_URL', '');
  vi.stubEnv('VITE_MAP_SEARCH_ATTRIBUTION', '');
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('explicit address geocoding', () => {
  test('encodes the query, validates results, and caches identical searches', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [
      { place_id: 1, lat: '14.55', lon: '121.02', display_name: 'Example & shop' },
      { place_id: 2, lat: 'invalid', lon: '121', display_name: 'Invalid' },
      { place_id: 3, lat: null, lon: '121', display_name: 'Missing latitude' },
    ] });
    const { searchAddresses } = await import('@/services/geocoding');
    const result = await searchAddresses('  Example & shop  ');
    expect(result).toEqual([{ id: '1', lat: 14.55, lng: 121.02, label: 'Example & shop' }]);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get('q')).toBe('Example & shop');
    expect(url.searchParams.get('format')).toBe('jsonv2');
    expect(await searchAddresses('example & SHOP')).toEqual(result);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  test('validates input and aborts before sending cancelled queries', async () => {
    const { searchAddresses } = await import('@/services/geocoding');
    await expect(searchAddresses('ab')).rejects.toThrow('3–500');
    const controller = new AbortController();
    controller.abort();
    await expect(searchAddresses('Makati', controller.signal)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  test('surfaces network/provider failures instead of inventing coordinates', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const { searchAddresses } = await import('@/services/geocoding');
    await expect(searchAddresses('Makati')).rejects.toThrow('place a pin');
  });
  test('spaces uncached public-service requests at least one second apart', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
    const { searchAddresses } = await import('@/services/geocoding');
    await searchAddresses('Makati');
    const next = searchAddresses('Manila');
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(100);
    await next;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
