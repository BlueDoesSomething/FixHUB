describe('technician subscription placement', () => {
  it('shows the ₱150 monthly sandbox plan in the technician menu without charging applicants', () => {
    cy.viewport(1280, 900);
    cy.signIn('technician');
    cy.get('.fx-sidenav:visible a[href="/technician/subscription"]').click();
    cy.contains('₱150').should('be.visible');
    cy.contains('PayMongo sandbox').should('be.visible');
    cy.get('[data-testid="subscription-status"]').should('contain', 'Not subscribed');
    cy.contains('Apply for free').should('be.visible');
    cy.contains('button', 'Subscribe for ₱150/month').should('be.visible');
  });

  it('locks accepting new jobs when the server enforces an unpaid subscription', () => {
    cy.viewport(1280, 900);
    cy.intercept('POST', '**/rest/v1/rpc/my_technician_subscription', [{ status: 'none', next_billing_at: null, enforced: true }]);
    cy.intercept('POST', '**/rest/v1/rpc/list_available_repairs', [{
      id: '22222222-2222-4222-8222-222222222222', reference: 'FH-TESTJOB', device: 'Phone',
      brand: 'Samsung', model: 'Galaxy', problem: 'Broken screen', service_type: 'home',
      location: 'Quezon City', latitude: 14.6, longitude: 121.0, created_at: new Date().toISOString(),
    }]);
    cy.signIn('technician');
    cy.get('.fx-sidenav:visible a[href="/technician/requests"]').click();
    cy.contains('₱150/month technician subscription is required').should('be.visible');
    cy.contains('.req-card', 'FH-TESTJOB').find('button').should('be.disabled').and('contain', 'Subscription required');
    cy.contains('button', 'Manage Subscription').click();
    cy.location('pathname').should('eq', '/technician/subscription');
  });
});
