function loginForReports() {
  cy.signIn('admin');
}

describe('admin reports and brand repairs', () => {
  it('uses completed repair rows returned by Supabase', () => {
    cy.viewport(1280, 900);
    cy.intercept('GET', '**/rest/v1/repair_requests*', req => {
      req.reply([{ id: '11111111-1111-4111-8111-111111111111', brand: 'Samsung', status: 'completed',
        updated_at: new Date().toISOString(), service_type: 'home' }]);
    });
    loginForReports();
    cy.get('.fx-sidenav:visible a[href="/admin/reports"]').click();
    cy.get('[data-testid="report-total"]').should('have.text', '1');
    cy.get('[data-testid="report-top-brand"]').should('contain', 'Samsung');
  });
  it('filters totals and charts across daily, weekly, monthly, and yearly periods', () => {
    cy.viewport(1280, 900);
    loginForReports();
    cy.get('.fx-sidenav:visible a[href="/admin/reports"]').click();
    cy.get('[data-testid="report-total"]').should('have.text', '0');
    cy.get('[data-testid="report-top-brand"]').should('not.exist');
    cy.get('[data-testid="brand-donut"] svg').should('have.attr', 'role', 'img');
    for (const [period, total] of [['day', 0], ['week', 0], ['month', 0], ['year', 0]] as const) {
      cy.get(`[data-period="${period}"]`).click().should('have.attr', 'aria-pressed', 'true');
      cy.get('[data-testid="report-total"]').should('have.text', String(total));
      cy.get('[data-testid="brand-donut"] .donut-chart__center strong').should('have.text', String(total));
    }
    cy.get('[data-period="day"]').click();
    cy.get('[data-brand="Apple"]').should('not.exist');
    cy.get('#report-date').clear().type('2025-12-31').blur();
    cy.get('[data-testid="report-total"]').should('have.text', '0');
    cy.get('.donut-chart__segment').should('not.exist');
    cy.get('#report-date').clear().type('2030-01-01').blur();
    cy.get('[data-testid="report-total"]').should('have.text', '0');
    cy.get('.donut-chart__segment').should('not.exist');
    cy.contains('No completed repairs in this period.').should('exist');
    cy.get('#report-date').clear();
    cy.get('[role="alert"]').should('contain', 'valid date');
  });

  it('keeps date filters and the donut readable above the mobile bottom menu', () => {
    cy.viewport(320, 844);
    loginForReports();
    cy.get('.fx-tabbar:visible [data-nav-id="reports"]').click();
    cy.location('pathname').should('eq', '/admin/reports');
    cy.get('[data-period="week"]').click();
    cy.get('[data-testid="report-total"]').should('have.text', '0');
    cy.get('.reports__filters').should($filters => {
      expect($filters[0].scrollWidth).to.be.at.most($filters[0].clientWidth);
    });
    cy.get('[data-testid="brand-donut"]').then($chart => $chart[0].scrollIntoView({ block: 'start' }));
    cy.get('[data-testid="brand-donut"]').should($chart => {
      expect($chart[0].scrollWidth).to.be.at.most($chart[0].clientWidth);
    });
    cy.get('ion-content:visible').find('.fx-page').should($page => {
      expect($page[0].scrollWidth).to.be.at.most($page[0].clientWidth);
    });
    cy.get('.fx-tabbar:visible [data-nav-id="reports"]').should('have.class', 'fx-tab--active');
    cy.screenshot('admin-reports-mobile-brand-donut', { capture: 'viewport' });
  });
});
