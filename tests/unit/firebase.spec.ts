import { beforeEach, describe, expect, test, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  getApps: vi.fn(),
  initializeApp: vi.fn(),
  getAuth: vi.fn(),
  getDataConnect: vi.fn(),
  connectAuthEmulator: vi.fn(),
  connectDataConnectEmulator: vi.fn(),
}));

vi.mock('firebase/app', () => ({ getApps: sdk.getApps, initializeApp: sdk.initializeApp }));
vi.mock('firebase/auth', () => ({ getAuth: sdk.getAuth, connectAuthEmulator: sdk.connectAuthEmulator }));
vi.mock('firebase/data-connect', () => ({
  getDataConnect: sdk.getDataConnect,
  connectDataConnectEmulator: sdk.connectDataConnectEmulator,
}));
vi.mock('@/dataconnect-generated', () => ({
  connectorConfig: { service: 'fixhub', connector: 'main', location: 'asia-southeast1' },
}));

import { getFirebaseBackend } from '@/services/firebase';

describe('Firebase backend initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_FIREBASE_USE_EMULATORS', 'false');
    for (const key of ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'APP_ID']) {
      vi.stubEnv(`VITE_FIREBASE_${key}`, '');
    }
    sdk.getApps.mockReturnValue([]);
    sdk.initializeApp.mockReturnValue({ name: 'fixhub-backend' });
    sdk.getAuth.mockReturnValue({ name: 'auth' });
    sdk.getDataConnect.mockReturnValue({ name: 'data-connect' });
  });

  test('does not silently fall back to demo mode when cloud configuration is missing', () => {
    expect(() => getFirebaseBackend()).toThrow('Configure Firebase');
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });

  test('local emulator mode always uses the demo project, even with real environment values', () => {
    vi.stubEnv('VITE_FIREBASE_USE_EMULATORS', 'true');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'some-real-project');
    getFirebaseBackend();
    expect(sdk.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'demo-fixhub' }), 'fixhub-backend',
    );
    expect(sdk.connectAuthEmulator).toHaveBeenCalledWith(
      { name: 'auth' }, 'http://127.0.0.1:9099', { disableWarnings: true },
    );
    expect(sdk.connectDataConnectEmulator).toHaveBeenCalledWith({ name: 'data-connect' }, '127.0.0.1', 9399);
  });

  test('production builds refuse emulator mode', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_FIREBASE_USE_EMULATORS', 'true');
    expect(() => getFirebaseBackend()).toThrow('production build');
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });

  test('cloud mode requires real configuration and does not attach emulators', () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'public-web-api-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'fixhub-example.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'fixhub-example');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'public-web-app-id');
    getFirebaseBackend();
    expect(sdk.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'fixhub-example' }), 'fixhub-backend',
    );
    expect(sdk.connectAuthEmulator).not.toHaveBeenCalled();
    expect(sdk.connectDataConnectEmulator).not.toHaveBeenCalled();
  });

  test('hot reload does not reconnect already initialized emulators', () => {
    vi.stubEnv('VITE_FIREBASE_USE_EMULATORS', 'true');
    sdk.getApps.mockReturnValue([{ name: 'fixhub-backend' }]);
    getFirebaseBackend();
    expect(sdk.initializeApp).not.toHaveBeenCalled();
    expect(sdk.connectAuthEmulator).not.toHaveBeenCalled();
    expect(sdk.connectDataConnectEmulator).not.toHaveBeenCalled();
  });
});
