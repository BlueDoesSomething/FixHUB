describe('technician service locations', () => {
  const location = { technician_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', latitude: 14.55, longitude: 121.02, address: 'Example repair shop, Makati', is_shared: true, updated_at: '2026-11-04T00:00:00Z' };

  beforeEach(() => {
    cy.intercept('https://tile.openstreetmap.org/**', { fixture: 'map-tile.svg', headers: { 'content-type': 'image/svg+xml' } });
    // All service calls are fixtures. No hosted database or public geocoder is used.
    cy.intercept('POST', '**/rest/v1/rpc/get_my_technician_location', []);
  });

  it('searches for a shop, explicitly shares it, restores it, and stops sharing', () => {
    cy.viewport(1280, 900);
    let stored: typeof location | null = null;
    cy.intercept('POST', '**/rest/v1/rpc/get_my_technician_location', req => req.reply(stored ? [stored] : []));
    cy.intercept('https://nominatim.openstreetmap.org/search*', { body: [{ place_id: 1, lat: '14.55', lon: '121.02', display_name: location.address }] }).as('addressSearch');
    cy.intercept('POST', '**/rest/v1/rpc/save_my_technician_location', req => {
      expect(req.body).to.deep.equal({ p_latitude: 14.55, p_longitude: 121.02, p_address: location.address });
      stored = { ...location };
      req.reply(stored);
    }).as('saveLocation');
    cy.intercept('POST', '**/rest/v1/rpc/stop_sharing_my_technician_location', req => {
      stored = { ...location, is_shared: false };
      req.reply({ statusCode: 204, body: '' });
    });
    cy.signIn('technician');
    cy.contains('Your service location').should('be.visible');
    cy.contains('button', 'Save & share location').should('be.disabled');
    cy.get('#technician-location-search').type('Example repair shop, Makati');
    cy.contains('button', /^Search$/).click();
    cy.wait('@addressSearch');
    cy.contains('button', location.address).click();
    cy.get('[data-testid="selected-coordinates"]').should('contain', '14.55000, 121.02000');
    cy.contains('button', 'Save & share location').click();
    cy.wait('@saveLocation');
    cy.contains('Location saved.').should('be.visible');
    cy.reload();
    cy.get('#technician-address').should('have.value', location.address);
    cy.contains('Location shared').should('be.visible');
    cy.contains('button', 'Stop sharing').click();
    cy.contains('Location sharing stopped.').should('be.visible');
    cy.contains('Not shared').then($badge => $badge[0].scrollIntoView({ block: 'center' }));
    cy.contains('Not shared').should('be.visible');
  });

  it('uses GPS on mobile and still permits manual selection after permission denial', () => {
    cy.viewport(390, 844);
    cy.signIn('technician');
    cy.visit('/technician/dashboard', {
      onBeforeLoad(win) {
        let calls = 0;
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success: PositionCallback, failure?: PositionErrorCallback) => {
          calls += 1;
          if (calls === 1) success({ coords: { latitude: 14.55, longitude: 121.02, accuracy: 25 }, timestamp: Date.now() } as GeolocationPosition);
          else failure?.({ code: 1, message: 'Denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
        }).as('gps');
      },
    });
    cy.get('@gps').should('not.have.been.called');
    cy.contains('button', 'Use My Current Location').click();
    cy.get('[data-testid="selected-coordinates"]').should('contain', '14.55000, 121.02000');
    cy.contains('GPS accuracy: approximately ±25 m').should('exist');
    cy.contains('button', 'Use My Current Location').click();
    cy.get('[role="alert"]').should('contain', 'permission was denied');
    cy.get('.leaflet-container').scrollIntoView().focus().trigger('keydown', { key: 'Enter' });
    cy.get('[data-testid="selected-coordinates"]').should('exist');
    cy.contains('button', 'Save & share location').should('not.be.disabled');
    cy.window().then(win => expect(win.document.documentElement.scrollWidth).to.be.at.most(win.innerWidth));
  });

  it('lets a customer find a nearby technician and open directions', () => {
    cy.intercept('POST', '**/rest/v1/rpc/list_located_technicians', { body: [
      { id: location.technician_id, full_name: 'Nearby Repair Professional', specializations: ['Smartphone'], service_type: 'both', latitude: location.latitude, longitude: location.longitude, address: location.address, updated_at: location.updated_at },
    ] }).as('directory');
    cy.signIn('client');
    cy.contains('button', 'Find Technicians').click();
    cy.wait('@directory');
    cy.contains('Nearby Repair Professional').then($card => $card[0].scrollIntoView({ block: 'center' }));
    cy.contains('Nearby Repair Professional').should('be.visible');
    cy.contains('button', 'Use map center').click();
    cy.get('[data-testid="nearby-technician"]').should('contain', 'km away');
    cy.get('[data-testid="nearby-technician"] a').should('have.attr', 'href').and('include', 'destination=14.55%2C121.02');
    cy.get('.leaflet-marker-icon').should('have.length', 2);
  });
});
