describe('admin overview top technicians', () => {
  beforeEach(() => {
    cy.intercept('https://tile.openstreetmap.org/**', { fixture: 'map-tile.svg', headers: { 'content-type': 'image/svg+xml' } });
  });

  it('does not fabricate ranked technicians when no records are available', () => {
    cy.viewport(1280, 900);
    cy.signIn('admin');
    const leaderboard = '[data-testid="top-technicians"]';
    cy.get(leaderboard).should('contain', 'Top Technicians').and('contain', 'No technicians qualify yet');
    cy.get(`${leaderboard} [data-technician-id]`).should('not.exist');
    cy.get(`${leaderboard} summary`).click();
    cy.get(`${leaderboard} details`).should('contain', '70% average customer rating').and('contain', '30% completed repair volume');

    cy.get(leaderboard).should('not.contain', 'Demo');
  });

  it('keeps technician ranking and metrics readable on mobile without horizontal overflow', () => {
    cy.viewport(390, 844);
    cy.signIn('admin');
    // Native scrolling reaches Ionic's scroll container inside its shadow root.
    cy.get('[data-testid="top-technicians"]').then($section => $section[0].scrollIntoView({ block: 'start' }));
    cy.get('[data-testid="top-technicians"]').should('be.visible');
    cy.get('[data-testid="top-technicians"] [data-technician-id]').should('not.exist');
    cy.get('[data-testid="top-technicians"]').then($section => {
      expect($section[0].scrollWidth).to.be.at.most($section[0].clientWidth);
    });
  });
});
