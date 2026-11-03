function loginForReviews(email: string) {
  cy.signIn(email === 'juan.dela@fixhub.com' ? 'technician' : 'client');
}

describe('customer and technician reviews', () => {
  beforeEach(() => {
    cy.intercept('https://tile.openstreetmap.org/**', { fixture: 'map-tile.svg', headers: { 'content-type': 'image/svg+xml' } });
  });

  it('shows empty customer and technician feeds without offering fictional completed repairs', () => {
    cy.viewport(1280, 900);
    loginForReviews('alex.rivera@email.com');
    cy.get('.fx-sidenav:visible a[href="/client/reviews"]').click();
    cy.contains("You're all caught up").should('exist');
    cy.contains('No reviews yet').should('exist');
    cy.get('[data-testid="review-repair"]').should('not.exist');
    cy.get('[data-review-id]').should('not.exist');

    loginForReviews('juan.dela@fixhub.com');
    cy.get('.fx-sidenav:visible a[href="/technician/reviews"]').click();
    cy.contains('No customer reviews yet').should('exist');
    cy.get('[data-review-id]').should('not.exist');
    cy.reload();
    cy.contains('No customer reviews yet').should('exist');

    loginForReviews('alex.rivera@email.com');
    cy.get('.fx-sidenav:visible a[href="/client/reviews"]').click();
    cy.visit('/client/request/technician?id=1');
    cy.contains('Technician not found').should('exist');
  });

  it('makes both review pages reachable on mobile without adding crowded bottom tabs', () => {
    cy.viewport(390, 844);
    loginForReviews('alex.rivera@email.com');
    cy.contains('.fx-tabbar:visible .fx-tab', 'More').click();
    cy.get('.tile:visible').contains('My Reviews').click();
    cy.location('pathname').should('eq', '/client/reviews');
    cy.get('.fx-page__title:visible').should('contain', 'My Reviews');

    loginForReviews('juan.dela@fixhub.com');
    cy.contains('.fx-tabbar:visible .fx-tab', 'More').click();
    cy.get('.tile:visible').contains('Reviews').click();
    cy.location('pathname').should('eq', '/technician/reviews');
    cy.get('.fx-page__title:visible').should('contain', 'Customer Reviews');
    cy.get('.fx-tabbar:visible ion-tab-button').should('have.length', 5);
    cy.get('.fx-page:visible').then($page => {
      expect($page[0].scrollWidth).to.be.at.most($page[0].clientWidth);
    });
  });
});
