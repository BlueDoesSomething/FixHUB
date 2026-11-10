describe('technician repair queue', () => {
  it('shows a submitted pending repair and lets a technician accept it', () => {
    cy.viewport(1280, 900);
    cy.intercept('POST', '**/rest/v1/rpc/list_available_repairs', [{
      id: '22222222-2222-4222-8222-222222222222', reference: 'FH-REALREQUEST',
      device: 'Phone', brand: 'Samsung', model: 'Galaxy', problem: 'Broken screen',
      service_type: 'home', location: 'Quezon City, Philippines', latitude: 14.6,
      longitude: 121.0, created_at: new Date().toISOString(),
    }]);
    cy.signIn('technician');
    cy.get('.fx-sidenav:visible a[href="/technician/requests"]').click();
    cy.contains('.req-card', 'FH-REALREQUEST').should('contain', 'Quezon City');
    cy.contains('.fx-pill', '1 pending').should('exist');
    cy.contains('.req-card', 'FH-REALREQUEST').contains('button', 'Accept').click();
    cy.contains('Accepted FH-REALREQUEST').should('exist');
    cy.contains('.req-card', 'FH-REALREQUEST').should('not.exist');
  });

  it('explains why a map location does not create a repair request', () => {
    cy.viewport(1280, 900);
    cy.signIn('technician');
    cy.get('.fx-sidenav:visible a[href="/technician/requests"]').click();
    cy.contains('sharing your map location alone does not create a job').should('be.visible');
  });
});
