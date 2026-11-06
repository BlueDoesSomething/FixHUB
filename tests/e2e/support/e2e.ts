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
  cy.intercept('https://tile.openstreetmap.org/**', { fixture: 'map-tile.svg', headers: { 'content-type': 'image/svg+xml' } });
  cy.intercept('POST', '**/rest/v1/rpc/get_my_technician_location', []);
  cy.intercept('POST', '**/rest/v1/rpc/list_located_technicians', []);
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
