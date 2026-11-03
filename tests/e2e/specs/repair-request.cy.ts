describe('repair request workflow', () => {
  beforeEach(() => {
    cy.intercept('https://tile.openstreetmap.org/**', { fixture: 'map-tile.svg', headers: { 'content-type': 'image/svg+xml' } });
    cy.visit('/');
    // Test browser storage only; no production Firebase project is involved.
    cy.window().then(win => new Cypress.Promise<void>((resolve, reject) => {
      const request = win.indexedDB.deleteDatabase('fixhub-repairs-v1');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Test database is still in use.'));
    }));
    cy.signIn('client');
  });

  function fillDetails() {
    cy.get('#repair-brand').type('Dell');
    cy.get('#repair-model').type('XPS 13');
    cy.get('#repair-problem').type('The laptop stops charging after a few minutes.');
    cy.contains('button', 'Laptop').click();
  }

  function chooseLocation(dropoff = false) {
    cy.contains('button', 'Continue to Location').click();
    cy.location('pathname').should('eq', '/client/request/location');
    cy.get('.leaflet-container:visible').click(150, 140);
    cy.get('#service-address').type('Example building, Makati City');
    cy.contains('button', dropoff ? 'Confirm Starting Point' : 'Confirm Location').click();
    cy.location('pathname').should('eq', '/client/request/review');
  }

  function attachPhoto() {
    cy.window().then(win => {
      const canvas = win.document.createElement('canvas');
      canvas.width = 8;
      canvas.height = 8;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#146344';
      context.fillRect(0, 0, 8, 8);
      const bytes = Cypress.Buffer.from(canvas.toDataURL('image/png').split(',')[1], 'base64');
      cy.get('#repair-photos').selectFile({ contents: bytes, fileName: 'device.png', mimeType: 'image/png' });
    });
    cy.contains('1 of 3 photos attached').should('exist');
    cy.get('.photo-grid img[alt="device.png"]').should('be.visible');
  }

  it('validates missing details instead of navigating to a location', () => {
    cy.visit('/client/request');
    cy.contains('button', 'Continue to Location').click();
    cy.get('[role="alert"]').should('contain', 'correct the highlighted fields');
    cy.get('#repair-brand').should('have.attr', 'aria-invalid', 'true');
    cy.get('#repair-model').should('have.attr', 'aria-invalid', 'true');
    cy.get('#repair-problem').should('have.attr', 'aria-invalid', 'true');
    cy.location('pathname').should('eq', '/client/request');
  });

  it('persists a draft and real photo, reviews, submits once, and reopens the saved request', () => {
    cy.viewport(1280, 900);
    cy.visit('/client/request');
    fillDetails();
    attachPhoto();
    cy.contains('Draft saved on this device').should('exist');
    cy.reload();
    cy.get('#repair-brand').should('have.value', 'Dell');
    cy.get('#repair-model').should('have.value', 'XPS 13');
    cy.get('.photo-grid img[alt="device.png"]').should('exist');
    chooseLocation();
    cy.contains('Review your repair request').should('exist');
    cy.contains('Dell').should('exist');
    cy.contains('XPS 13').should('exist');
    cy.contains('Example building, Makati City').should('exist');
    cy.get('.photo-grid img:visible').should('have.length', 1);
    cy.contains('button', 'Submit Repair Request').should('be.disabled');
    cy.get('#review-confirm').check();
    cy.contains('button', 'Submit Repair Request').click();
    cy.location('pathname').should('match', /^\/client\/requests\/[^/]+$/);
    cy.contains('Request saved on this device').should('exist');
    cy.get('[data-testid="request-reference"]').invoke('text').then(reference => {
      cy.reload();
      cy.get('[data-testid="request-reference"]').should('have.text', reference);
      cy.get('.photo-grid img[alt="device.png"]').should('exist');
      cy.contains('button', 'View Repair History').click();
      cy.get('[data-testid="saved-request"]').should('have.length', 1).and('contain', reference);
      cy.get('[data-testid="saved-request"]').contains('View Request').click();
      cy.get('[data-testid="request-reference"]').should('have.text', reference);
      cy.contains('button', 'Start Another Request').click();
      cy.get('#repair-brand').should('have.value', '');
      cy.get('#repair-model').should('have.value', '');
      cy.get('#repair-problem').should('have.value', '');
      cy.contains('0 of 3 photos attached').should('exist');
    });
  });

  it('supports drop-off, back/edit navigation, and retains a confirmed pin', () => {
    cy.viewport(390, 844);
    cy.visit('/client/request');
    fillDetails();
    cy.contains('button', 'Drop-off').click();
    chooseLocation(true);
    cy.contains('Starting location').should('exist');
    cy.contains('not a confirmed shop address').should('exist');
    cy.contains('button', 'Edit Details').click();
    cy.get('#repair-model').clear().type('XPS 15');
    cy.contains('button', 'Continue to Location').click();
    cy.get('[data-testid="selected-coordinates"]').should('exist');
    cy.get('#service-address').should('have.value', 'Example building, Makati City');
    cy.contains('button', 'Confirm Starting Point').click();
    cy.contains('XPS 15').should('exist');
    cy.get('#review-confirm').should('not.be.checked');
    cy.get('#review-confirm').check();
    cy.contains('button', 'Submit Repair Request').click();
    cy.contains('Request saved on this device').should('exist');
    cy.contains('Drop-off').should('exist');
  });

  it('rejects invalid attachments and supports removing valid photos', () => {
    cy.visit('/client/request');
    cy.get('#repair-photos').selectFile({ contents: Cypress.Buffer.from('<svg/>'), fileName: 'bad.svg', mimeType: 'image/svg+xml' });
    cy.get('.photo-errors').should('contain', 'JPG, PNG, or WebP');
    cy.contains('0 of 3 photos attached').should('exist');
    attachPhoto();
    cy.get('button[aria-label="Remove device.png"]').click();
    cy.contains('0 of 3 photos attached').should('exist');
    cy.get('.photo-grid img').should('not.exist');
  });

  it('does not advance or claim success if browser storage is blocked', () => {
    cy.visit('/client/request', {
      onBeforeLoad(win) { cy.stub(win.indexedDB, 'open').throws(new DOMException('Blocked', 'SecurityError')); },
    });
    fillDetails();
    cy.contains('button', 'Continue to Location').click();
    cy.get('[role="alert"]').should('contain', 'Could not save on this device');
    cy.location('pathname').should('eq', '/client/request');
    cy.get('#repair-model').should('have.value', 'XPS 13');
    cy.contains('Request saved on this device').should('not.exist');
  });

  it('direct review access cannot submit an incomplete draft', () => {
    cy.visit('/client/request/review');
    cy.contains('This draft is not ready to submit.').should('exist');
    cy.get('#review-confirm').check();
    cy.contains('button', 'Submit Repair Request').should('be.disabled');
  });

  it('keeps the reviewed draft after a failed submission and saves once when retried', () => {
    cy.visit('/client/request');
    fillDetails();
    chooseLocation();
    cy.get('#review-confirm').check();
    cy.window().then(win => {
      const original = win.IDBObjectStore.prototype.add;
      cy.stub(win.IDBObjectStore.prototype, 'add').callsFake(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
        if (this.name === 'requests') throw new DOMException('Full', 'QuotaExceededError');
        return key === undefined ? original.call(this, value) : original.call(this, value, key);
      }).as('failedWrite');
    });
    cy.contains('button', 'Submit Repair Request').click();
    cy.get('[role="alert"]').should('contain', 'device storage is full');
    cy.location('pathname').should('eq', '/client/request/review');
    cy.contains('XPS 13').should('exist');
    cy.get('@failedWrite').then(stub => (stub as unknown as { restore: () => void }).restore());
    cy.contains('button', 'Submit Repair Request').click();
    cy.contains('Request saved on this device').should('exist');
    cy.contains('button', 'View Repair History').click();
    cy.get('[data-testid="saved-request"]').should('have.length', 1);
  });
});
