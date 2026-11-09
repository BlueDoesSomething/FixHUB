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
        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((success: PositionCallback, failure?: PositionErrorCallback) => {
          calls += 1;
          if (calls === 1) success({ coords: { latitude: 14.55, longitude: 121.02, accuracy: 25 }, timestamp: Date.now() } as GeolocationPosition);
          else failure?.({ code: 1, message: 'Denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
          return 1;
        }).as('gps');
      },
    });
    cy.get('@gps').should('have.been.calledOnce');
    cy.get('[data-testid="selected-coordinates"]').should('contain', '14.55000, 121.02000');
    cy.contains('GPS accuracy: approximately ±25 m').should('exist');
    cy.contains('button', 'Use My Current Location').click();
    cy.get('[role="alert"]').should('contain', 'permission was denied');
    cy.get('.leaflet-container').scrollIntoView().focus().trigger('keydown', { key: 'Enter' });
    cy.get('[data-testid="selected-coordinates"]').should('exist');
    cy.contains('button', 'Save & share location').should('not.be.disabled');
    cy.window().then(win => expect(win.document.documentElement.scrollWidth).to.be.at.most(win.innerWidth));
  });

  it('keeps the map private and pauses polling when the location backend is not deployed', () => {
    let attempts = 0;
    cy.intercept('POST', '**/rest/v1/rpc/list_located_technicians', req => {
      attempts += 1;
      if (attempts === 1) {
        req.reply({ statusCode: 404, body: { code: 'PGRST202', message: 'Could not find the function public.list_located_technicians', details: null, hint: null } });
      } else {
        req.reply({ body: [{ id: location.technician_id, full_name: 'Restored Repair Professional', specializations: ['Smartphone'], service_type: 'both', latitude: location.latitude, longitude: location.longitude, address: location.address, updated_at: location.updated_at, location_mode: 'manual', live_expires_at: null }] });
      }
    }).as('directory');
    cy.signIn('client');
    cy.contains('button', 'Find Technicians').click();
    cy.wait('@directory');
    cy.get('.nearby-error').scrollIntoView().should('contain', 'not configured on this server');
    cy.get('.nearby-note').should('contain', 'Automatic refresh is paused');
    cy.get('.leaflet-container').should('exist');
    cy.contains('button', 'Use map center').scrollIntoView().click();
    cy.get('[data-testid="selected-coordinates"]').should('exist');
    cy.contains('button', 'Refresh').scrollIntoView().click();
    cy.wait('@directory');
    cy.contains('Restored Repair Professional').should('exist');
    cy.contains('Automatic refresh is paused').should('not.exist');
  });

  it('lets a customer find a nearby technician and open directions', () => {    cy.intercept('POST', '**/rest/v1/rpc/list_located_technicians', { body: [
      { id: location.technician_id, full_name: 'Nearby Repair Professional', specializations: ['Smartphone'], service_type: 'both', latitude: location.latitude, longitude: location.longitude, address: location.address, updated_at: location.updated_at },
    ] }).as('directory');
    cy.signIn('client');
    cy.contains('button', 'Find Technicians').click();
    cy.wait('@directory');
    cy.contains('button', 'Use map center').click();
    cy.contains('Nearby Repair Professional').then($card => $card[0].scrollIntoView({ block: 'center' }));
    cy.contains('Nearby Repair Professional').should('be.visible');
    cy.get('[data-testid="nearby-technician"]').should('contain', 'km away');
    cy.get('[data-testid="nearby-technician"] a').should('have.attr', 'href').and('include', 'destination=14.55%2C121.02');
    cy.get('.leaflet-marker-icon').should('have.length', 2);
  });

  it('automatically locates a reporting client and recommends a nearby technician without a manual search', () => {
    cy.intercept('POST', '**/rest/v1/rpc/list_located_technicians', [
      { id: location.technician_id, full_name: 'Nearby Screen Repair', specializations: ['Screen Replacement'], service_type: 'home', latitude: 14.551, longitude: 121.02, address: location.address, updated_at: location.updated_at, location_mode: 'manual', live_expires_at: null },
    ]);
    cy.signIn('client');
    cy.visit('/client/request/location', {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((success: PositionCallback) => {
          success({ coords: { latitude: 14.55, longitude: 121.02, accuracy: 15 }, timestamp: Date.now() } as GeolocationPosition);
          return 1;
        });
      },
    });
    cy.get('[data-testid="selected-coordinates"]').should('have.text', '14.55000, 121.02000');
    cy.get('[data-testid="nearby-technician"]').should('contain', 'Nearby Screen Repair').and('contain', 'km away');
    cy.get('.leaflet-marker-icon').should('have.length', 2);
    cy.contains('button', 'Confirm Location').click();
    cy.location('pathname').should('eq', '/client/request/review');
    cy.get('[data-testid="nearby-technician"]:visible').should('contain', 'Nearby Screen Repair');
  });

  it('publishes a technician GPS point only after explicit live-sharing consent, and stops it', () => {
    cy.intercept('POST', '**/rest/v1/rpc/publish_my_live_location', req => {
      expect(req.body).to.deep.equal({ p_latitude: 14.55, p_longitude: 121.02 });
      req.reply({ ...location, address: 'Live GPS location', location_mode: 'live', live_expires_at: new Date(Date.now() + 90000).toISOString() });
    }).as('publishLive');
    cy.intercept('POST', '**/rest/v1/rpc/stop_sharing_my_technician_location', { statusCode: 204, body: '' }).as('stopLive');
    cy.signIn('technician');
    cy.visit('/technician/dashboard', {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, 'watchPosition').callsFake((success: PositionCallback) => {
          success({ coords: { latitude: 14.55, longitude: 121.02, accuracy: 15 }, timestamp: Date.now() } as GeolocationPosition);
          return 1;
        });
      },
    });
    cy.get('[data-testid="selected-coordinates"]').should('contain', '14.55000, 121.02000');
    cy.get('@publishLive.all').should('have.length', 0);
    cy.contains('button', 'Share live location').click();
    cy.wait('@publishLive');
    cy.contains('Live location sharing is on.').then($notice => $notice[0].scrollIntoView({ block: 'center' }));
    cy.contains('Live location sharing is on.').should('be.visible');
    cy.contains('button', 'Stop sharing').click();
    cy.wait('@stopLive');
    cy.contains('Location sharing stopped.').then($notice => $notice[0].scrollIntoView({ block: 'center' }));
    cy.contains('Location sharing stopped.').should('be.visible');
  });
});
