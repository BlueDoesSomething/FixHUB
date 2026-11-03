import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '../dataconnect-generated';

/** Legacy Firebase integration, retained for isolated emulator tests. */
export function getFirebaseBackend() {
  const useEmulators = import.meta.env.VITE_FIREBASE_USE_EMULATORS === 'true';
  if (useEmulators && !import.meta.env.DEV) {
    throw new Error('Firebase emulators must not be enabled in a production build.');
  }

  const config: FirebaseOptions = useEmulators
    ? { projectId: 'demo-fixhub', apiKey: 'demo-api-key', appId: 'demo-app-id' }
    : {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

  if (!config.apiKey || !config.projectId || !config.appId || (!useEmulators && !config.authDomain)) {
    throw new Error('Configure Firebase in .env.local. See docs/firebase-postgresql-setup.md.');
  }
  if (!useEmulators && config.projectId.startsWith('demo-')) {
    throw new Error('A demo Firebase project can only be used with local emulators.');
  }

  const existing = getApps().find(app => app.name === 'fixhub-backend');
  const app = existing ?? initializeApp(config, 'fixhub-backend');
  const auth = getAuth(app);
  const dataConnect = getDataConnect(app, connectorConfig);

  // Only connect once, including when Vite reloads this module during development.
  if (useEmulators && !existing) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectDataConnectEmulator(dataConnect, '127.0.0.1', 9399);
  }

  return { app, auth, dataConnect };
}
