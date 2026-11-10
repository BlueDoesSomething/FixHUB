describe('admin overview top technicians', () => {
  it('renders counts, recent requests and leaderboard from Supabase', () => {
    cy.intercept('POST', '**/rest/v1/rpc/admin_overview', {
      users: 12, technicians: 3, activeRepairs: 2, completed: 7, applications: 1,
      weekly: [{ day: '2026-11-10', total: 7 }],
      recent: [{ id: 'repair-1', reference: 'FH-TEST', device: 'Phone', brand: 'Samsung', status: 'pending', createdAt: new Date().toISOString(), customer: 'Test Customer' }],
      topTechnicians: [{ id: 'tech-1', name: 'Real Technician', specialty: 'Screens', repairs: 7, averageRating: 4.5, reviewCount: 2, score: 93 }],
    });
    cy.signIn('admin');
    cy.contains('.fx-stat', 'Total Users').should('contain', '12');
    cy.contains('.fx-stat', 'Completed').should('contain', '7');
    cy.get('[data-testid="top-technicians"] [data-technician-id="tech-1"]').should('contain', 'Real Technician');
    cy.contains('Recent Requests').parent().should('contain', 'FH-TEST');
  });
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
