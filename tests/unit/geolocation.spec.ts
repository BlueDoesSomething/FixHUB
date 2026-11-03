import { afterEach, describe, expect, test, vi } from 'vitest';
import { getCurrentLocation } from '@/services/geolocation';

afterEach(() => vi.unstubAllGlobals());

describe('device location', () => {
  test('uses a bounded, user-triggered browser location request', async () => {
    const getCurrentPosition = vi.fn(success => success({ coords: { latitude: 14.5995, longitude: 120.9842, accuracy: 25 } }));
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    await expect(getCurrentLocation()).resolves.toEqual({ lat: 14.5995, lng: 120.9842, accuracy: 25 });
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 30000,
    });
  });

  test.each([
    [1, 'permission was denied'],
    [2, 'could not be found'],
    [3, 'timed out'],
  ])('explains browser error %s and offers manual map selection', async (code, message) => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (_success: unknown, failure: (error: { code: number }) => void) => failure({ code }) } });
    await expect(getCurrentLocation()).rejects.toThrow(message);
  });

  test('handles unsupported browsers', async () => {
    vi.stubGlobal('navigator', {});
    await expect(getCurrentLocation()).rejects.toThrow('not available');
  });

  test('rejects invalid coordinates returned by a device', async () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (success: (position: unknown) => void) => success({ coords: { latitude: Infinity, longitude: 121, accuracy: 0 } }) } });
    await expect(getCurrentLocation()).rejects.toThrow('invalid location');
  });

  test('explains the HTTPS requirement without requesting location', async () => {
    const getCurrentPosition = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    vi.stubGlobal('window', { isSecureContext: false });
    await expect(getCurrentLocation()).rejects.toThrow('HTTPS or localhost');
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});
