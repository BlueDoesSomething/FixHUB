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
  cy.intercept('POST', '**/rest/v1/rpc/admin_list_applications', []);
  cy.intercept('POST', '**/rest/v1/rpc/admin_overview', {
    users: 0, technicians: 0, activeRepairs: 0, completed: 0, applications: 0,
    weekly: [], recent: [], topTechnicians: [],
  });

  // Repair-request and review sync stay offline by default: every test starts
  // from the browser's own records and specs add fixtures when they need rows.
  // Specs may register more specific fixtures afterwards and win the match.
  cy.intercept('POST', '**/rest/v1/rpc/list_reviews', []);
  cy.intercept('POST', '**/rest/v1/rpc/list_my_reviewable_repairs', []);
  // A technician without a profile id (the common case in tests) gets JSON null.
  cy.intercept('POST', '**/rest/v1/rpc/my_technician_profile_id', req => {
    req.reply({ statusCode: 200, headers: { 'content-type': 'application/json' }, body: null });
  });
  cy.intercept('POST', '**/rest/v1/rpc/list_available_repairs', []);
  cy.intercept('POST', '**/rest/v1/rpc/list_my_assigned_repairs', []);
  cy.intercept('POST', '**/rest/v1/rpc/create_my_repair_request', req => req.reply(String(req.body?.p_request_id ?? '11111111-1111-4111-8111-111111111111')));
  cy.intercept('POST', '**/rest/v1/rpc/accept_repair_request', { statusCode: 204, body: '' });
  cy.intercept('POST', '**/rest/v1/rpc/advance_repair_status', { statusCode: 204, body: '' });
  cy.intercept('POST', '**/rest/v1/rpc/cancel_my_repair_request', { statusCode: 204, body: '' });
  cy.intercept('GET', '**/rest/v1/repair_requests*', []);
  cy.intercept('GET', '**/rest/v1/repair_photos*', []);
  cy.intercept('POST', '**/rest/v1/repair_photos*', { statusCode: 201, body: '' });
  cy.intercept('POST', '**/rest/v1/reviews*', { statusCode: 201, body: '' });
  cy.intercept('POST', '**/rest/v1/review_replies*', { statusCode: 201, body: '' });
  cy.intercept('POST', '**/storage/v1/object/**', { statusCode: 200, body: { Key: 'repair-photos/test/photo.png' } });
  cy.intercept('POST', '**/storage/v1/object/list/**', []);
  cy.intercept('POST', '**/storage/v1/object/sign/**', { statusCode: 200, body: [{ signedURL: '/object/sign/repair-photos/test/photo.png' }] });
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
