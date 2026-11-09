import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

export const AUTH_CALLBACK_PATH = '/auth/callback';
export const NATIVE_AUTH_CALLBACK = 'com.fixhub.app://auth/callback';
const RETURN_PATH_KEY = 'fixhub.auth.return-path';

export function authRedirectUrl(recovery = false): string {
  const base = import.meta.env.BASE_URL || '/';
  const url = Capacitor.isNativePlatform()
    ? new URL(NATIVE_AUTH_CALLBACK)
    : new URL(`${base.replace(/\/$/, '')}${AUTH_CALLBACK_PATH}`, window.location.origin);
  if (recovery) url.searchParams.set('flow', 'recovery');
  return url.toString();
}

/** Never carry an external URL or a client-selected role through authentication. */
export function safeAuthReturnPath(path?: string | null): string | undefined {
  if (typeof path !== 'string') return undefined;
  if (path === '/become-a-technician' || /^\/(client|technician|admin)\/[a-zA-Z0-9/_-]+$/.test(path)) return path;
  return undefined;
}

export function rememberAuthReturnPath(path?: string) {
  try {
    const safe = safeAuthReturnPath(path);
    if (safe) localStorage.setItem(RETURN_PATH_KEY, JSON.stringify({ path: safe, createdAt: Date.now() }));
    else localStorage.removeItem(RETURN_PATH_KEY);
  } catch { /* A return path is optional; auth must still work without storage. */ }
}

export function consumeAuthReturnPath(): string | undefined {
  try {
    const value = localStorage.getItem(RETURN_PATH_KEY);
    localStorage.removeItem(RETURN_PATH_KEY);
    if (!value) return undefined;
    const saved = JSON.parse(value);
    const age = Date.now() - saved.createdAt;
    return Number.isFinite(age) && age >= 0 && age < 3600000 ? safeAuthReturnPath(saved.path) : undefined;
  } catch { return undefined; }
}

export function authPathFromDeepLink(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'com.fixhub.app:' || url.hostname !== 'auth' || url.pathname !== '/callback'
      || url.username || url.password || url.port || url.hash) return undefined;
    return `${AUTH_CALLBACK_PATH}${url.search}`;
  } catch { return undefined; }
}

/** Handle both a running APK and an APK opened by an email/Google callback. */
export async function installNativeAuthLinks(navigate: (path: string) => Promise<unknown>): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  let lastUrl = '';
  const handle = async (url: string) => {
    const path = authPathFromDeepLink(url);
    if (!path || url === lastUrl) return;
    lastUrl = url;
    // Android's custom tab normally closes on return; close() is iOS-only on
    // some plugin versions, so an unsupported close must not lose the callback.
    try { await Browser.close(); } catch { /* Continue into the app. */ }
    await navigate(path);
  };
  const listener = await App.addListener('appUrlOpen', event => { void handle(event.url).catch(() => undefined); });
  try {
    const launch = await App.getLaunchUrl();
    if (launch?.url) await handle(launch.url);
  } catch {
    await listener.remove();
    throw new Error('The sign-in link could not be opened. Return to FIXHUB and try again.');
  }
  return () => { void listener.remove(); };
}
