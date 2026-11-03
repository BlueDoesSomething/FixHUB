describe('authenticated dashboard access', () => {
  beforeEach(() => {
    cy.intercept('https://tile.openstreetmap.org/**', { fixture: 'map-tile.svg', headers: { 'content-type': 'image/svg+xml' } });
  });

  it('opens the admin dashboard and application review with a server-assigned role', () => {
    cy.viewport(1280, 900);
    cy.signIn('admin');
    cy.location('pathname').should('eq', '/admin/dashboard');
    cy.get('.fx-sidenav:visible .fx-sidenav__user-name').should('have.text', 'Test Administrator');
    cy.get('.fx-sidenav:visible a[href="/admin/applications"]').click();
    cy.location('pathname').should('eq', '/admin/applications');
    cy.get('.fx-page__title:visible').should('contain', 'Technician Applications');
  });

  it('opens the technician dashboard and job requests after authentication', () => {
    cy.viewport(1280, 900);
    cy.signIn('technician');
    cy.location('pathname').should('eq', '/technician/dashboard');
    cy.get('.fx-sidenav:visible .fx-sidenav__user-name').should('have.text', 'Test Technician');
    cy.get('.fx-sidenav:visible a[href="/technician/requests"]').click();
    cy.get('.fx-page__title:visible').should('contain', 'New Requests');
  });

  it('restores the customer session after refreshing', () => {
    cy.signIn('client');
    cy.reload();
    cy.location('pathname').should('eq', '/client/home');
    cy.contains('Hello, Test!').should('exist');
  });

  it('also selects the correct role from the mobile login modal', () => {
    cy.viewport(390, 844);
    cy.stubSupabase('admin');
    cy.visit('/');
    cy.get('nav').contains('button', /^Login$/).click();
    cy.get('.login-overlay').within(() => {
      cy.get('[data-testid="login-email"]').type('admin@example.test');
      cy.get('[data-testid="login-password"]').type('test-password-123', { log: false });
      cy.contains('button', 'Login & Continue').click();
    });
    cy.location('pathname').should('eq', '/admin/dashboard');
  });

  it('does not offer password-free access or example accounts', () => {
    cy.visit('/');
    cy.get('[data-testid="login-email"]').type('admin@fixhub.com');
    cy.contains('button', 'Login & Continue').click();
    cy.get('[role="alert"]').should('contain', 'Enter your password');
    cy.location('pathname').should('eq', '/');
    cy.get('[data-testid="demo-accounts"]').should('not.exist');
  });
});
