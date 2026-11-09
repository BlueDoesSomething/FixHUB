import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
const native = vi.hoisted(() => ({ isNative: vi.fn(() => false), check: vi.fn(), permissions: vi.fn(), get: vi.fn(), watch: vi.fn(), clear: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: native.isNative } }));
vi.mock('@capacitor/geolocation', () => ({ Geolocation: { checkPermissions: native.check, requestPermissions: native.permissions, getCurrentPosition: native.get, watchPosition: native.watch, clearWatch: native.clear } }));
import { getCurrentLocation, watchCurrentLocation } from '@/services/geolocation';

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.resetAllMocks();
  native.isNative.mockReturnValue(false);
  native.clear.mockResolvedValue(undefined);
  native.check.mockResolvedValue({ location: 'granted', coarseLocation: 'granted' });
  native.get.mockResolvedValue({ coords: { latitude: 14.6, longitude: 121, accuracy: 15 }, timestamp: Date.now() });
  native.watch.mockResolvedValue('native-watch');
});

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

  test('streams fresh browser positions and clears the watch without delivering late callbacks', () => {
    let receive!: PositionCallback;
    const clearWatch = vi.fn();
    const watchPosition = vi.fn(success => { receive = success; return 7; });
    vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch } });
    const onPoint = vi.fn();
    const stop = watchCurrentLocation(onPoint, vi.fn());
    const position = (lat: number, timestamp = Date.now()) => ({ coords: { latitude: lat, longitude: 121, accuracy: 20 }, timestamp } as GeolocationPosition);
    receive(position(14));
    receive(position(15));
    receive(position(16, Date.now() - 60000));
    expect(onPoint).toHaveBeenCalledTimes(2);
    expect(onPoint).toHaveBeenLastCalledWith({ lat: 15, lng: 121, accuracy: 20 });
    stop();
    receive(position(17));
    expect(onPoint).toHaveBeenCalledTimes(2);
    expect(clearWatch).toHaveBeenCalledWith(7);
  });

  test('clears a browser watch after permission denial', () => {
    const clearWatch = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { clearWatch, watchPosition: (_success: unknown, fail: PositionErrorCallback) => { fail({ code: 1 } as GeolocationPositionError); return 3; } } });
    const onError = vi.fn();
    watchCurrentLocation(vi.fn(), onError);
    expect(onError.mock.calls[0][0].message).toContain('permission was denied');
    expect(clearWatch).toHaveBeenCalledWith(3);
  });

  test('uses the native Android watch with approximate-location permission', async () => {
    native.isNative.mockReturnValue(true);
    native.check.mockResolvedValue({ location: 'denied', coarseLocation: 'granted' });
    const stop = watchCurrentLocation(vi.fn(), vi.fn());
    await flushPromises();
    expect(native.permissions).not.toHaveBeenCalled();
    expect(native.watch).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: false, timeout: 30000, maximumAge: 0, interval: 5000, enableLocationFallback: true }), expect.any(Function));
    stop();
    expect(native.clear).toHaveBeenCalledWith({ id: 'native-watch' });
  });

  test('cleans up a native watch whose ID arrives after page exit', async () => {
    native.isNative.mockReturnValue(true);
    native.permissions.mockResolvedValue({ location: 'granted', coarseLocation: 'granted' });
    let resolve!: (id: string) => void;
    native.watch.mockImplementation(() => new Promise(done => { resolve = done; }));
    const stop = watchCurrentLocation(vi.fn(), vi.fn());
    await flushPromises();
    stop();
    resolve('late-watch');
    await flushPromises();
    expect(native.clear).toHaveBeenCalledWith({ id: 'late-watch' });
  });

  test('uses native GPS for a one-shot APK request, without requiring browser geolocation or HTTPS', async () => {
    native.isNative.mockReturnValue(true);
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', { isSecureContext: false });
    await expect(getCurrentLocation()).resolves.toEqual({ lat: 14.6, lng: 121, accuracy: 15 });
    expect(native.permissions).not.toHaveBeenCalled();
    expect(native.get).toHaveBeenCalledWith({ enableHighAccuracy: true, timeout: 30000, maximumAge: 0, enableLocationFallback: true });
  });

  test('requests native permission when needed and respects an approximate grant', async () => {
    native.isNative.mockReturnValue(true);
    native.check.mockResolvedValue({ location: 'prompt', coarseLocation: 'prompt' });
    native.permissions.mockResolvedValue({ location: 'denied', coarseLocation: 'granted' });
    await expect(getCurrentLocation()).resolves.toMatchObject({ lat: 14.6 });
    expect(native.permissions).toHaveBeenCalledWith({ permissions: ['location'] });
    expect(native.get).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: false }));
  });

  test('does not start native GPS after permission denial', async () => {
    native.isNative.mockReturnValue(true);
    native.check.mockResolvedValue({ location: 'prompt', coarseLocation: 'prompt' });
    native.permissions.mockResolvedValue({ location: 'denied', coarseLocation: 'denied' });
    await expect(getCurrentLocation()).rejects.toThrow('device settings');
    const onError = vi.fn();
    watchCurrentLocation(vi.fn(), onError);
    await flushPromises();
    expect(onError.mock.calls[0][0].message).toContain('permission was denied');
    expect(native.get).not.toHaveBeenCalled();
    expect(native.watch).not.toHaveBeenCalled();
  });

  test.each([
    ['OS-PLUG-GLOC-0007', 'services are off'],
    ['OS-PLUG-GLOC-0009', 'declined'],
    ['OS-PLUG-GLOC-0010', 'timed out'],
    ['OS-PLUG-GLOC-0014', 'Google Play Services'],
    ['OS-PLUG-GLOC-0015', 'Google Play Services'],
    ['OS-PLUG-GLOC-0016', 'location settings'],
    ['OS-PLUG-GLOC-0017', 'network services are off'],
    ['OS-PLUG-GLOC-0018', 'latest FIXHUB APK'],
    ['UNIMPLEMENTED', 'latest FIXHUB APK'],
  ])('explains native error %s for single requests and watches', async (code, message) => {
    native.isNative.mockReturnValue(true);
    native.check.mockRejectedValue(Object.assign(new Error('Plugin failure'), { code }));
    await expect(getCurrentLocation()).rejects.toThrow(message);
    const onError = vi.fn();
    watchCurrentLocation(vi.fn(), onError);
    await flushPromises();
    expect(onError.mock.calls[0][0].message).toContain(message);
    expect(native.watch).not.toHaveBeenCalled();
  });

  test('does not start a native watch when the page exits during its permission prompt', async () => {
    native.isNative.mockReturnValue(true);
    native.check.mockResolvedValue({ location: 'prompt', coarseLocation: 'prompt' });
    let resolve!: (status: { location: string; coarseLocation: string }) => void;
    native.permissions.mockImplementation(() => new Promise(done => { resolve = done; }));
    const onPoint = vi.fn();
    const stop = watchCurrentLocation(onPoint, vi.fn());
    await flushPromises();
    stop();
    resolve({ location: 'granted', coarseLocation: 'granted' });
    await flushPromises();
    expect(native.watch).not.toHaveBeenCalled();
    expect(onPoint).not.toHaveBeenCalled();
  });

  test('does not open a permission prompt if the page exits during the native permission check', async () => {
    native.isNative.mockReturnValue(true);
    let resolve!: (status: { location: string; coarseLocation: string }) => void;
    native.check.mockImplementation(() => new Promise(done => { resolve = done; }));
    const stop = watchCurrentLocation(vi.fn(), vi.fn());
    stop();
    resolve({ location: 'prompt', coarseLocation: 'prompt' });
    await flushPromises();
    expect(native.permissions).not.toHaveBeenCalled();
    expect(native.watch).not.toHaveBeenCalled();
  });

  test('translates a native one-shot GPS timeout rather than exposing the plugin error', async () => {
    native.isNative.mockReturnValue(true);
    native.get.mockRejectedValue({ code: 'OS-PLUG-GLOC-0010' });
    await expect(getCurrentLocation()).rejects.toThrow('timed out');
  });

  test('delivers native fixes and cleans up on a native GPS error', async () => {
    native.isNative.mockReturnValue(true);
    const onPoint = vi.fn();
    const onError = vi.fn();
    watchCurrentLocation(onPoint, onError);
    await flushPromises();
    const receive = native.watch.mock.calls[0][1];
    const position = { coords: { latitude: 14, longitude: 121, accuracy: 20 }, timestamp: Date.now() };
    receive(position);
    expect(onPoint).toHaveBeenCalledWith({ lat: 14, lng: 121, accuracy: 20 });
    receive(null, { code: 'OS-PLUG-GLOC-0010' });
    receive(position);
    expect(onError.mock.calls[0][0].message).toContain('timed out');
    expect(onPoint).toHaveBeenCalledTimes(1);
    expect(native.clear).toHaveBeenCalledWith({ id: 'native-watch' });
  });

  test.each([NaN, -1, Infinity])('rejects invalid native accuracy %s', async accuracy => {
    native.isNative.mockReturnValue(true);
    native.get.mockResolvedValue({ coords: { latitude: 14, longitude: 121, accuracy } });
    await expect(getCurrentLocation()).rejects.toThrow('invalid location');
  });
});
