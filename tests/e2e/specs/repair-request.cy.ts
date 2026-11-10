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
    // Electron 118 headless crashes (0xC0000005) while typing into an input
    // with a <datalist>; detach the suggestions so the workflow stays testable.
    cy.get('#repair-brand').invoke('removeAttr', 'list');
    cy.get('#repair-brand').type('Samsung');
    cy.get('#repair-model').type('Galaxy Tab S9');
    cy.get('#repair-problem').type('The tablet stops charging after a few minutes.');
    cy.contains('button', 'Tablet').click();
  }

  function chooseLocation(dropoff = false) {
    cy.contains('button', 'Continue to Location').click();
    cy.location('pathname').should('eq', '/client/request/location');
    cy.contains('button', 'Use map center').click();
    cy.get('[data-testid="selected-coordinates"]').should('exist');
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

  it('offers only supported device categories on the dashboard and repair form', () => {
    cy.get('.category__name').should($labels => {
      expect([...$labels].map(label => label.textContent?.trim())).to.deep.eq(['Smartphone', 'Tablet', 'Other']);
    });
    cy.visit('/client/request');
    cy.get('.device-option').should($buttons => {
      expect([...$buttons].map(button => button.lastElementChild?.textContent?.trim())).to.deep.eq(['Smartphone', 'Tablet', 'Other']);
    });
    cy.get('#repair-brands option').should($options => {
      const brands = [...$options].map(option => option.getAttribute('value'));
      expect(brands).not.to.include.members(['Dell', 'HP', 'Nintendo']);
    });
  });

  it('preserves an old unsupported draft and asks the user to choose a supported device', () => {
    cy.window().then(win => new Cypress.Promise<void>((resolve, reject) => {
      const request = win.indexedDB.open('fixhub-repairs-v1');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('drafts', 'readwrite');
        tx.objectStore('drafts').put({ ownerId: '11111111-1111-4111-8111-111111111111', draft: {
          id: 'legacy-draft', device: 'Laptop', brand: 'Saved brand', model: 'Saved model', problem: 'Saved issue description.', photos: [], serviceType: 'home', location: '', coordinates: null,
        } });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      };
    }));
    cy.visit('/client/request');
    cy.get('[data-testid="unsupported-device"]').should('contain', 'no longer support');
    cy.get('#repair-brand').should('have.value', 'Saved brand');
    cy.get('#repair-model').should('have.value', 'Saved model');
    cy.contains('button', 'Continue to Location').click();
    cy.location('pathname').should('eq', '/client/request');
    cy.contains('button', 'Tablet').click();
    cy.get('[data-testid="unsupported-device"]').should('not.exist');
    cy.get('#repair-model').should('have.value', 'Saved model');
  });

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
    cy.get('#repair-brand').should('have.value', 'Samsung');
    cy.get('#repair-model').should('have.value', 'Galaxy Tab S9');
    cy.get('.photo-grid img[alt="device.png"]').should('exist');
    chooseLocation();
    cy.contains('Review your repair request').should('exist');
    cy.contains('Samsung').should('exist');
    cy.contains('Galaxy Tab S9').should('exist');
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
    cy.get('#repair-model').clear().type('Galaxy Tab S9 FE');
    cy.contains('button', 'Continue to Location').click();
    cy.get('[data-testid="selected-coordinates"]').should('exist');
    cy.get('#service-address').should('have.value', 'Example building, Makati City');
    cy.contains('button', 'Confirm Starting Point').click();
    cy.contains('Galaxy Tab S9 FE').should('exist');
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
    cy.get('#repair-model').should('have.value', 'Galaxy Tab S9');
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
    cy.contains('Galaxy Tab S9').should('exist');
    cy.get('@failedWrite').then(stub => (stub as unknown as { restore: () => void }).restore());
    cy.contains('button', 'Submit Repair Request').click();
    cy.contains('Request saved on this device').should('exist');
    cy.contains('button', 'View Repair History').click();
    cy.get('[data-testid="saved-request"]').should('have.length', 1);
  });
});
