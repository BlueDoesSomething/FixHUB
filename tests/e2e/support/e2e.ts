// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Dashboard navigation now loads a map and saved service locations. Keep all
// browser tests offline from public map servers and hosted location data by
// default; individual specs can register more specific fixtures afterward.
beforeEach(() => {
  cy.on('window:before:load', win => {
    // Never request the test runner's actual GPS or connect fixture JWTs to a
    // hosted Realtime socket. Individual specs replace these plain functions.
    let timer: number | undefined;
    Object.defineProperty(win.navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition: (_success: PositionCallback, failure?: PositionErrorCallback) => failure?.({ code: 1 } as GeolocationPositionError),
      watchPosition: (_success: PositionCallback, failure?: PositionErrorCallback) => {
        timer = win.setTimeout(() => failure?.({ code: 1 } as GeolocationPositionError), 0);
        return timer;
      },
      clearWatch: () => { if (timer !== undefined) win.clearTimeout(timer); },
    } });
    const OriginalWebSocket = win.WebSocket;
    class OfflineSocket {
      readyState = 0;
      binaryType = 'arraybuffer';
      send() { /* No network traffic for fixture subscriptions. */ }
      close() { this.readyState = 3; }
      addEventListener() { /* Offline transport. */ }
      removeEventListener() { /* Offline transport. */ }
    }
    win.WebSocket = new Proxy(OriginalWebSocket, { construct(target, args) {
      return String(args[0]).includes('/realtime/v1/') ? new OfflineSocket() : Reflect.construct(target, args);
    } });
  });
  cy.intercept('https://tile.openstreetmap.org/**', { fixture: 'map-tile.svg', headers: { 'content-type': 'image/svg+xml' } });
  cy.intercept('POST', '**/rest/v1/rpc/get_my_technician_location', []);
  cy.intercept('POST', '**/rest/v1/rpc/list_located_technicians', []);
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
