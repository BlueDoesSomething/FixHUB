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

  it('shows a review only after FIXHUB accepts it, including after reloading', () => {
    const repairId = '11111111-1111-4111-8111-111111111111';
    const technicianId = '22222222-2222-4222-8222-222222222222';
    const written: Record<string, unknown>[] = [];
    let rejectNext = true;
    cy.intercept('POST', '**/rest/v1/rpc/list_my_reviewable_repairs', [{
      repair_id: repairId, technician_id: technicianId, device: 'Phone', brand: 'Samsung', model: 'Galaxy',
      problem: 'Broken screen', completed_at: '2026-11-10T00:00:00.000Z', technician_name: 'Test Technician',
    }]);
    cy.intercept('POST', '**/rest/v1/rpc/list_reviews', req => { req.reply(written); });
    cy.intercept('GET', '**/rest/v1/reviews*', { body: 'null', headers: { 'content-type': 'application/json' } });
    cy.intercept('POST', '**/rest/v1/reviews*', req => {
      if (rejectNext) {
        rejectNext = false;
        req.reply({ statusCode: 503, body: { message: 'FIXHUB unavailable' } });
        return;
      }
      const input = req.body;
      const id = '33333333-3333-4333-8333-333333333333';
      written.push({ id, repair_id: input.repair_id, customer_id: input.customer_id,
        customer_name: 'Test Customer', technician_id: input.technician_id,
        technician_name: 'Test Technician', device: 'Samsung Galaxy', rating: input.rating,
        comment: input.comment, created_at: new Date().toISOString(), reply_comment: null, reply_created_at: null });
      req.reply({ statusCode: 201, body: { id } });
    });
    cy.signIn('client');
    cy.visit('/client/reviews');
    cy.get('#review-repair').select(repairId);
    cy.get('input[value="5"]').check({ force: true });
    cy.get('#review-comment').type('Fixed perfectly, thank you.');
    cy.get('[data-testid="submit-review"]').click();
    cy.contains('Your review could not be sent to FIXHUB').should('be.visible');
    cy.get('[data-review-id]').should('not.exist');
    cy.get('#review-comment').should('have.value', 'Fixed perfectly, thank you.');
    cy.get('[data-testid="submit-review"]').click();
    cy.get('.review-success').should('contain', 'Your review was sent to FIXHUB');
    cy.get('[data-review-id]').should('have.length', 1);
    cy.reload();
    cy.get('[data-review-id]').should('have.length', 1).and('contain', 'Fixed perfectly');
  });
});
