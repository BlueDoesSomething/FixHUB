import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { authPathFromDeepLink, authRedirectUrl, consumeAuthReturnPath, installNativeAuthLinks, rememberAuthReturnPath, safeAuthReturnPath } from '@/services/authRedirect';

const native = vi.hoisted(() => ({ isNative: vi.fn(() => false), listen: vi.fn(), launch: vi.fn(), close: vi.fn(), remove: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: native.isNative } }));
vi.mock('@capacitor/app', () => ({ App: { addListener: native.listen, getLaunchUrl: native.launch } }));
vi.mock('@capacitor/browser', () => ({ Browser: { close: native.close } }));

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  native.isNative.mockReturnValue(false);
  native.listen.mockResolvedValue({ remove: native.remove });
  native.launch.mockResolvedValue(undefined);
});
afterEach(() => vi.useRealTimers());

describe('authentication redirects', () => {
  test('uses explicit web and Android callback URLs', () => {
    expect(authRedirectUrl()).toBe(`${window.location.origin}/auth/callback`);
    expect(authRedirectUrl(true)).toBe(`${window.location.origin}/auth/callback?flow=recovery`);
    native.isNative.mockReturnValue(true);
    expect(authRedirectUrl()).toBe('com.fixhub.app://auth/callback');
    expect(authRedirectUrl(true)).toBe('com.fixhub.app://auth/callback?flow=recovery');
  });

  test.each(['https://untrusted.example', '//untrusted.example', '/\\untrusted.example', '/auth/callback', '/client/home?next=https://untrusted.example', 'javascript:alert(1)'])('refuses unsafe or looping return path %s', path => {
    expect(safeAuthReturnPath(path)).toBeUndefined();
    rememberAuthReturnPath(path);
    expect(consumeAuthReturnPath()).toBeUndefined();
  });

  test('consumes an internal return path only once and expires stale values', () => {
    rememberAuthReturnPath('/become-a-technician');
    expect(consumeAuthReturnPath()).toBe('/become-a-technician');
    expect(consumeAuthReturnPath()).toBeUndefined();
    vi.useFakeTimers();
    rememberAuthReturnPath('/client/history');
    vi.advanceTimersByTime(3600001);
    expect(consumeAuthReturnPath()).toBeUndefined();
  });

  test.each(['https://untrusted.example/auth/callback?code=bad', 'com.fixhub.app://evil/callback?code=bad', 'com.fixhub.app://auth/another-path', 'com.fixhub.app://user@auth/callback', 'com.fixhub.app://auth/callback#access_token=bad', 'not a URL'])('ignores unexpected Android deep link %s', url => {
    expect(authPathFromDeepLink(url)).toBeUndefined();
  });

  test('maps only the expected native callback into the local router', () => {
    expect(authPathFromDeepLink('com.fixhub.app://auth/callback?code=one-use-code&flow=recovery')).toBe('/auth/callback?code=one-use-code&flow=recovery');
  });

  test('does not register native plugins in a browser', async () => {
    await installNativeAuthLinks(vi.fn());
    expect(native.listen).not.toHaveBeenCalled();
  });

  test('processes cold and warm Android callbacks, deduplicates events, and removes its listener', async () => {
    native.isNative.mockReturnValue(true);
    native.launch.mockResolvedValue({ url: 'com.fixhub.app://auth/callback?code=cold-start' });
    native.close.mockRejectedValue(new Error('close is not implemented on Android'));
    const navigate = vi.fn().mockResolvedValue(undefined);
    const dispose = await installNativeAuthLinks(navigate);
    expect(navigate).toHaveBeenCalledWith('/auth/callback?code=cold-start');
    const receive = native.listen.mock.calls[0][1];
    receive({ url: 'com.fixhub.app://auth/callback?code=cold-start' });
    receive({ url: 'com.fixhub.app://evil/callback?code=bad' });
    receive({ url: 'com.fixhub.app://auth/callback?code=warm-start' });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(2));
    expect(navigate).toHaveBeenLastCalledWith('/auth/callback?code=warm-start');
    dispose();
    expect(native.remove).toHaveBeenCalledOnce();
  });
});
