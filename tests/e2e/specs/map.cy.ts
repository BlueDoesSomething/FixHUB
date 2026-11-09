describe('Leaflet maps', () => {
  beforeEach(() => {
    // Never send automated pan/zoom traffic to community-funded tile servers.
    cy.intercept('https://tile.openstreetmap.org/**', {
      fixture: 'map-tile.svg', headers: { 'content-type': 'image/svg+xml' },
    }).as('mapTiles');
    cy.visit('/');
    cy.window().then(win => new Cypress.Promise<void>((resolve, reject) => {
      const request = win.indexedDB.deleteDatabase('fixhub-repairs-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Test database is still in use.'));
    }));
    cy.signIn('client');
  });

  it('renders tiles, selects a pin, and keeps the map working after back navigation', () => {
    cy.viewport(1280, 900);
    cy.visit('/client/request/location');
    cy.get('.leaflet-container').should('be.visible');
    cy.wait('@mapTiles');
    cy.get('.leaflet-tile-loaded').should('have.length.greaterThan', 0);
    cy.get('.leaflet-control-attribution').should('contain', 'OpenStreetMap');
    cy.contains('button', 'Confirm Location').should('be.disabled');
    cy.get('.leaflet-container').click(160, 160);
    cy.get('.leaflet-marker-icon').should('have.length', 1);
    cy.get('[data-testid="selected-coordinates"]').should('be.visible');
    cy.get('#service-address').type('Example building, Makati City');
    cy.contains('button', 'Confirm Location').click();
    cy.location('pathname').should('eq', '/client/request/review');
    cy.go('back');
    cy.location('pathname').should('eq', '/client/request/location');
    cy.get('.leaflet-container:visible').should('have.length', 1);
    cy.get('.leaflet-container:visible .leaflet-marker-icon').should('have.length', 1);
    cy.contains('button', 'Confirm Location').should('not.be.disabled');
  });

  it('uses browser GPS coordinates on a mobile-sized screen', () => {
    cy.viewport(390, 844);
    cy.visit('/client/request/location', {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((success: PositionCallback) => {
          success({
            coords: { latitude: 14.5995, longitude: 120.9842, accuracy: 25, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
            timestamp: Date.now(),
          } as GeolocationPosition);
          return 1;
        }).as('gps');
      },
    });
    cy.get('@gps').should('have.been.calledOnce');
    cy.get('[data-testid="selected-coordinates"]').should('have.text', '14.59950, 120.98420');
    cy.contains('GPS accuracy: approximately ±25 m').should('exist');
    cy.get('.leaflet-marker-icon').should('have.length', 1);
    cy.contains('button', 'Confirm Location').should('not.be.disabled');
  });

  it('allows keyboard pin placement after GPS permission is denied', () => {
    cy.visit('/client/request/location', {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((_success: PositionCallback, failure?: PositionErrorCallback) => {
          failure?.({ code: 1, message: 'Denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
          return 1;
        });
      },
    });
    cy.get('[role="alert"]').should('contain', 'permission was denied');
    cy.get('.leaflet-container').focus().trigger('keydown', { key: 'Enter' });
    cy.get('[data-testid="selected-coordinates"]').should('exist');
    cy.contains('button', 'Confirm Location').should('not.be.disabled');
  });

  it('does not invent technician locations or an active repair', () => {
    cy.visit('/client/home/tracking');
    cy.contains('Tracking unavailable').should('exist');
    cy.get('.leaflet-marker-icon').should('not.exist');
    cy.signIn('technician');
    cy.visit('/technician/active');
    cy.contains('No active repair available').should('exist');
    cy.get('.leaflet-marker-icon').should('not.exist');
  });

  it('shows an empty directory instead of fictional profiles and map markers', () => {
    cy.visit('/');
    cy.contains('No technicians are available to display').should('exist');
    cy.contains('button', 'View Profile').should('not.exist');
  });
});
