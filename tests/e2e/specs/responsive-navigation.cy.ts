const responsiveAccounts = [
  { role: 'client', email: 'alex.rivera@email.com', home: '/client/home', extra: '/client/care' },
  { role: 'technician', email: 'juan.dela@fixhub.com', home: '/technician/dashboard', extra: '/technician/reviews' },
  { role: 'admin', email: 'admin@fixhub.com', home: '/admin/dashboard', extra: '/admin/applications' },
];

function loginResponsive(email: string) {
  cy.signIn(email === 'admin@fixhub.com' ? 'admin' : email === 'juan.dela@fixhub.com' ? 'technician' : 'client');
}

function checkBottomMenu() {
  cy.get('.fx-sidenav').should('not.be.visible');
  cy.get('.fx-topbar').should('be.visible');
  cy.get('.fx-topbar__menu-toggle:visible').should('have.length', 1).and('have.attr', 'aria-expanded', 'false');
  cy.get('.fx-tabbar:visible').should('have.length', 1).should($bar => {
    const bar = $bar[0].getBoundingClientRect();
    const viewport = $bar[0].ownerDocument.defaultView!;
    expect(bar.bottom).to.be.closeTo(viewport.innerHeight, 2);
    expect(bar.left).to.be.closeTo(0, 1);
    expect(bar.right).to.be.closeTo(viewport.innerWidth, 1);
    expect($bar[0].scrollWidth).to.be.at.most($bar[0].clientWidth);
  });
  cy.get('.fx-tabbar:visible [data-nav-id]').should('have.length', 5).each($button => {
    const button = $button[0].getBoundingClientRect();
    const bar = $button[0].closest('.fx-tabbar')!.getBoundingClientRect();
    expect(button.width).to.be.at.least(44);
    expect(button.height).to.be.at.least(44);
    expect(button.top).to.be.at.least(bar.top);
    expect(button.bottom).to.be.at.most(bar.bottom);
    expect(button.left).to.be.at.least(bar.left);
    expect(button.right).to.be.at.most(bar.right);
  });
  cy.get('ion-content:visible').find('.fx-page').should($pages => {
    for (const page of $pages) expect(page.scrollWidth).to.be.at.most(page.clientWidth);
  });
}

describe('responsive app navigation', () => {
  beforeEach(() => {
    cy.intercept('https://tile.openstreetmap.org/**', { fixture: 'map-tile.svg', headers: { 'content-type': 'image/svg+xml' } });
  });

  for (const account of responsiveAccounts) {
    it(`provides a persistent ${account.role} top menu with direct access to secondary pages`, () => {
      cy.viewport(390, 844);
      loginResponsive(account.email);
      cy.get('.fx-topbar__menu-toggle:visible').click().should('have.attr', 'aria-expanded', 'true');
      cy.get('.fx-topbar__menu:visible').should('have.attr', 'aria-label').and('contain', 'navigation');
      cy.get(`.fx-topbar__menu:visible a[href="${account.home}"]`).should('have.attr', 'aria-current', 'page');
      cy.get(`.fx-topbar__menu:visible a[href="${account.extra}"]`).click();
      cy.location('pathname').should('eq', account.extra);
      cy.get('.fx-topbar__menu').should('not.exist');
      checkBottomMenu();
      cy.get('.fx-topbar__menu-toggle:visible').click();
      cy.get(`.fx-topbar__menu:visible a[href="${account.extra}"]`).should('have.attr', 'aria-current', 'page');
      cy.get(`.fx-topbar__menu:visible a[href="${account.home}"]`).click();
      cy.location('pathname').should('eq', account.home);
      cy.get('ion-content:visible').shadow().find('.inner-scroll').scrollTo('bottom');
      cy.get('.fx-topbar__menu-toggle:visible').should('be.visible').click();
      cy.get('.fx-topbar__menu:visible').should($menu => {
        const bounds = $menu[0].getBoundingClientRect();
        expect(bounds.left).to.be.at.least(0);
        expect(bounds.right).to.be.at.most(390);
        expect(bounds.bottom).to.be.below(772);
      });
      cy.get('.fx-topbar__menu-toggle:visible').trigger('keydown', { key: 'Escape' }).should('have.attr', 'aria-expanded', 'false');
    });

    for (const width of [320, 768]) {
      it(`keeps the ${account.role} bottom menu usable at ${width}px and exposes secondary tools`, () => {
        cy.viewport(width, 844);
        loginResponsive(account.email);
        cy.location('pathname').should('eq', account.home);
        checkBottomMenu();
        if (account.role === 'admin' && width === 320) cy.screenshot('admin-phone-bottom-menu', { capture: 'viewport' });
        cy.get('.fx-tabbar:visible [data-nav-id="more"]').click();
        cy.location('pathname').should('eq', `/${account.role}/more`);
        cy.get(`.tile:visible[href="${account.extra}"]`).click();
        cy.location('pathname').should('eq', account.extra);
        cy.get('.fx-tabbar:visible .fx-tab--active').should('have.attr', 'data-nav-id', 'more').and('have.attr', 'aria-current', 'page');
        checkBottomMenu();
      });
    }
  }

  it('switches between desktop and bottom navigation at 1024px without losing the current page', () => {
    cy.viewport(1280, 900);
    loginResponsive('admin@fixhub.com');
    cy.get('.fx-sidenav').should('be.visible');
    cy.get('.fx-topbar').should('be.visible');
    cy.get('.fx-tabbar').should('not.be.visible');
    cy.get('.fx-sidenav a[href="/admin/more"]').should('not.exist');
    cy.get('.fx-sidenav a[href="/admin/applications"]').click();
    cy.viewport(1023, 768);
    checkBottomMenu();
    cy.location('pathname').should('eq', '/admin/applications');
    cy.get('.fx-tabbar:visible [data-nav-id="more"]').should('have.class', 'fx-tab--active');
    cy.viewport(1024, 768);
    cy.get('.fx-sidenav').should('be.visible');
    cy.get('.fx-topbar').should('be.visible');
    cy.get('.fx-tabbar').should('not.be.visible');
    cy.location('pathname').should('eq', '/admin/applications');
    cy.viewport(844, 390);
    checkBottomMenu();
  });

  it('reserves safe-area space and keeps the last overview section above the bottom menu after scrolling', () => {
    cy.viewport(390, 844);
    loginResponsive('admin@fixhub.com');
    cy.window().then(win => {
      const style = win.document.documentElement.style;
      style.setProperty('--ion-safe-area-top', '28px');
      style.setProperty('--ion-safe-area-bottom', '24px');
      style.setProperty('--ion-safe-area-left', '20px');
      style.setProperty('--ion-safe-area-right', '20px');
    });
    cy.get('.fx-tabbar:visible').should($bar => {
      expect($bar[0].getBoundingClientRect().height).to.be.closeTo(96, 1);
    });
    cy.get('.fx-topbar:visible').should($bar => {
      expect($bar[0].getBoundingClientRect().height).to.be.closeTo(92, 1);
    });
    cy.get('ion-content:visible').shadow().find('.inner-scroll').scrollTo('bottom');
    cy.get('.dashboard__section:visible').last().should($section => {
      const bottom = $section[0].getBoundingClientRect().bottom;
      const bar = $section[0].closest('.app-shell')!.querySelector('.fx-tabbar')!;
      expect(bottom).to.be.at.most(bar.getBoundingClientRect().top);
    });
    checkBottomMenu();
    cy.get('.fx-tabbar:visible [data-nav-id="users"]').click();
    cy.location('pathname').should('eq', '/admin/users');
    checkBottomMenu();
  });

  it('shows an empty inbox without fabricated conversations on a narrow phone', () => {
    cy.viewport(320, 740);
    loginResponsive('alex.rivera@email.com');
    cy.get('.fx-tabbar:visible [data-nav-id="messages"]').click();
    cy.location('pathname').should('eq', '/client/messages');
    cy.get('.fx-tabbar:visible [data-nav-id="messages"]').should('have.class', 'fx-tab--active');
    cy.contains('No conversations available').should('be.visible');
    cy.get('.convo').should('not.exist');
    checkBottomMenu();
  });
});
