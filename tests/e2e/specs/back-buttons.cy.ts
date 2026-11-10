describe('in-app back buttons', () => {
  it('returns to the correct repair step on a phone even after a direct page load', () => {
    cy.viewport(390, 844);
    cy.signIn('client');
    cy.visit('/client/request/review');
    cy.contains('ion-title', 'Review Repair Request').closest('ion-header').find('.fx-header__back').click();
    cy.location('pathname').should('eq', '/client/request/location');
    cy.contains('ion-title', 'Set Location').closest('ion-header').find('.fx-header__back').click();
    cy.location('pathname').should('eq', '/client/request');
  });

  it('returns a direct request link to repair history on desktop, not the login screen', () => {
    cy.viewport(1280, 900);
    cy.signIn('client');
    cy.visit('/client/requests/11111111-1111-4111-8111-111111111111');
    cy.get('.fx-topbar__back:visible').click();
    cy.location('pathname').should('eq', '/client/history');
  });
});
