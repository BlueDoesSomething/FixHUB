describe('repair request workflow', () => {
  let failNextSubmit = false;
  let failSubmissions = false;
  beforeEach(() => {
    failNextSubmit = false;
    failSubmissions = false;
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
    // The simulated backend is authoritative: a successful RPC creates a row,
    // while a failed RPC must never create a submitted request in the UI.
    const serverRows: Record<string, unknown>[] = [];
    const serverPhotos: Record<string, unknown>[] = [];
    cy.intercept('POST', '**/rest/v1/rpc/create_my_repair_request', req => {
      if (failSubmissions || failNextSubmit) {
        failNextSubmit = false;
        req.reply({ statusCode: 503, body: { code: 'TEMP', message: 'Backend unavailable' } });
        return;
      }
      const fields = req.body as Record<string, string | number>;
      const id = String(fields.p_request_id);
      if (!serverRows.some(row => row.id === id)) serverRows.push({
        id, customer_id: '11111111-1111-4111-8111-111111111111',
        reference: `FH-${id.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
        device: fields.p_device, brand: fields.p_brand, model: fields.p_model,
        problem: fields.p_problem, service_type: fields.p_service_type,
        location: fields.p_location, latitude: fields.p_latitude, longitude: fields.p_longitude,
        status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      req.reply(JSON.stringify(id));
    });
    cy.intercept('GET', '**/rest/v1/repair_requests*', req => {
      const id = new URL(req.url).searchParams.get('id')?.replace(/^eq\./, '');
      if (id) req.reply({ body: serverRows.find(row => row.id === id) ?? 'null', headers: { 'content-type': 'application/json' } });
      else req.reply(serverRows);
    });
    cy.intercept('POST', '**/rest/v1/repair_photos*', req => {
      const rows = (Array.isArray(req.body) ? req.body : [req.body]) as Record<string, unknown>[];
      for (const row of rows) serverPhotos.push({ id: crypto.randomUUID(), ...row });
      req.reply({ statusCode: 201, body: [] });
    });
    cy.intercept('GET', '**/rest/v1/repair_photos*', req => {
      const params = new URL(req.url).searchParams;
      const position = params.get('position')?.replace(/^eq\./, '');
      const rows = position === undefined ? serverPhotos : serverPhotos.filter(row => String(row.position) === position);
      req.reply(params.has('position') ? { body: rows[0] ?? 'null', headers: { 'content-type': 'application/json' } } : rows);
    });
    cy.intercept('POST', '**/storage/v1/object/sign/**', req => {
      const paths = (Array.isArray(req.body) ? req.body : req.body.paths) as string[];
      req.reply(paths.map(path => ({ path, signedURL: `/object/sign/repair-photos/${path}?token=fixture` })));
    });
    cy.intercept('GET', '**/storage/v1/object/sign/repair-photos/**', {
      fixture: 'map-tile.svg', headers: { 'content-type': 'image/svg+xml' },
    });
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
    cy.contains('Request sent to FIXHUB').should('exist');
    cy.get('[data-testid="request-reference"]').invoke('text').then(reference => {
      cy.reload();
      cy.get('[data-testid="request-reference"]').should('have.text', reference);
      cy.get('.photo-grid img[alt="device.png"]').should('exist');
      cy.contains('button', 'View Repair History').click();
      cy.get('[data-testid="saved-request"]').should('have.length', 1).and('contain', reference);
      cy.get('[data-testid="saved-request"]').contains('View Request').click();
      cy.location('pathname').then(path => cy.visit(path));
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
    cy.get('.ion-page:not(.ion-page-hidden) button').contains('Edit Details').click();
    cy.location('pathname').should('eq', '/client/request');
    cy.get('.ion-page:not(.ion-page-hidden) form #repair-model').scrollIntoView().clear().type('Galaxy Tab S9 FE');
    cy.contains('button', 'Continue to Location').click();
    cy.get('[data-testid="selected-coordinates"]').should('exist');
    cy.get('#service-address').should('have.value', 'Example building, Makati City');
    cy.contains('button', 'Confirm Starting Point').click();
    cy.contains('Galaxy Tab S9 FE').should('exist');
    cy.get('#review-confirm').should('not.be.checked');
    cy.get('#review-confirm').check();
    cy.contains('button', 'Submit Repair Request').click();
    cy.contains('Request sent to FIXHUB').should('exist');
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
    cy.contains('Request sent to FIXHUB').should('not.exist');
  });

  it('direct review access cannot submit an incomplete draft', () => {
    cy.visit('/client/request/review');
    cy.contains('This draft is not ready to submit.').should('exist');
    cy.get('#review-confirm').check();
    cy.contains('button', 'Submit Repair Request').should('be.disabled');
  });

  it('keeps the reviewed draft after a failed backend submission and sends once when retried', () => {
    cy.visit('/client/request');
    fillDetails();
    chooseLocation();
    cy.get('#review-confirm').check();
    failNextSubmit = true;
    cy.contains('button', 'Submit Repair Request').click();
    cy.get('[role="alert"]').should('contain', 'Could not send your repair request to FIXHUB');
    cy.location('pathname').should('eq', '/client/request/review');
    cy.contains('Galaxy Tab S9').should('exist');
    cy.visit('/client/history');
    cy.contains('No submitted requests yet').should('be.visible');
    cy.visit('/client/request/review');
    cy.get('#review-confirm').check();
    cy.contains('button', 'Submit Repair Request').click();
    cy.contains('Request sent to FIXHUB').should('exist');
    cy.contains('button', 'View Repair History').click();
    cy.get('[data-testid="saved-request"]').should('have.length', 1);
  });

  it('does not claim photos are saved if Storage fails and retries the same repair without losing the image', () => {
    let failUpload = true;
    cy.intercept('POST', '**/storage/v1/object/repair-photos/**', req => {
      expect(req.headers['x-upsert']).not.to.eq('true');
      req.reply(failUpload
        ? { statusCode: 403, body: { message: 'Storage unavailable' } }
        : { statusCode: 200, body: { Key: req.url } });
    }).as('photoUpload');
    cy.visit('/client/request');
    fillDetails();
    attachPhoto();
    chooseLocation();
    cy.get('#review-confirm').check();
    cy.contains('button', 'Submit Repair Request').click();
    cy.get('[role="alert"]').should('contain', 'photos could not be saved');
    cy.location('pathname').should('eq', '/client/request/review');
    cy.visit('/client/request');
    cy.contains('1 of 3 photos attached').should('exist');
    cy.visit('/client/request/review');
    cy.then(() => { failUpload = false; });
    cy.get('#review-confirm').check();
    cy.contains('button', 'Submit Repair Request').click();
    cy.contains('Request sent to FIXHUB').should('be.visible');
    cy.get('.photo-grid img[alt="device.png"]').should('be.visible').and($image => { expect(($image[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0); });
    cy.reload();
    cy.get('.photo-grid img[alt="device.png"]').should('be.visible').and($image => { expect(($image[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0); });
    cy.get('@photoUpload.all').should('have.length', 2);
  });

  it('never presents an older browser-only record as a submitted repair', () => {
    failSubmissions = true;
    cy.window().then(win => new Cypress.Promise<void>((resolve, reject) => {
      const open = win.indexedDB.open('fixhub-repairs-v1');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('requests', 'readwrite');
        tx.objectStore('requests').put({
          id: 'fb4f41ce-e7e9-40d1-a3ac-6d0c32f35dd2', ownerId: '11111111-1111-4111-8111-111111111111',
          reference: 'FH-FB4F41CEE7E9', device: 'Tablet', brand: 'Samsung', model: 'Galaxy',
          problem: 'The tablet screen is broken.', serviceType: 'dropoff', location: 'Makati City',
          coordinates: { lat: 14.6, lng: 121.0 }, photos: [], status: 'Pending', createdAt: new Date().toISOString(),
        });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      };
    }));
    cy.visit('/client/history');
    cy.get('[data-testid="saved-request"]').should('not.exist');
    cy.contains('earlier request(s) could not be delivered to FIXHUB').should('be.visible');
    cy.contains('No submitted requests yet').should('be.visible');
    cy.visit('/client/requests/fb4f41ce-e7e9-40d1-a3ac-6d0c32f35dd2');
    cy.contains('Request not found in FIXHUB').should('be.visible');
    cy.contains('Pending · local').should('not.exist');
  });
});
