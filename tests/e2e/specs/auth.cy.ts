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

  it('creates an email account, shows confirmation as success, resends it, and completes the callback', () => {
    cy.viewport(390, 844);
    cy.stubSupabase('client');
    cy.intercept('POST', '**/auth/v1/signup*', req => {
      expect(req.body.email).to.eq('new@example.test');
      expect(req.body.data).to.deep.eq({ full_name: 'New Customer' });
      expect(req.body.code_challenge).to.be.a('string');
      expect(new URL(req.url).searchParams.get('redirect_to')).to.eq('http://localhost:5173/auth/callback');
      req.reply({ id: '11111111-1111-4111-8111-111111111111', email: 'new@example.test', identities: [] });
    }).as('signup');
    cy.intercept('POST', '**/auth/v1/resend*', { body: {} }).as('resend');
    cy.visit('/');
    cy.contains('button', /^Sign Up$/).click();
    cy.get('[data-testid="signup-name"]').type('New Customer');
    cy.get('[data-testid="signup-email"]').type('new@example.test');
    cy.get('[data-testid="signup-password"]').type('test-password-123', { log: false });
    cy.contains('button', 'Create Account').click();
    cy.wait('@signup');
    cy.get('[role="status"]').should('contain', 'confirmation link');
    cy.get('[role="alert"]').should('not.exist');
    cy.contains('button', 'Resend confirmation email').click();
    cy.wait('@resend').its('request.body').should('include', { type: 'signup', email: 'new@example.test' });
    cy.get('[role="status"]').should('contain', 'If this address');
    cy.visit('/auth/callback?code=email-confirmation-code');
    cy.wait('@signIn').its('request.body').should('include', { auth_code: 'email-confirmation-code' });
    cy.location('pathname').should('eq', '/client/home');
    cy.location('search').should('eq', '');
  });

  it('requests a recovery email and changes the password only after a valid callback', () => {
    cy.viewport(390, 844);
    cy.stubSupabase('client');
    cy.intercept('POST', '**/auth/v1/recover*', req => {
      expect(req.body.email).to.eq('customer@example.test');
      expect(req.body).not.to.have.property('password');
      expect(new URL(req.url).searchParams.get('redirect_to')).to.eq('http://localhost:5173/auth/callback?flow=recovery');
      req.reply({ body: {} });
    }).as('recovery');
    cy.intercept('PUT', '**/auth/v1/user', req => {
      expect(req.body.password).to.eq('new-password-123');
      req.reply({ id: '11111111-1111-4111-8111-111111111111', email: 'customer@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' });
    }).as('updatePassword');
    cy.visit('/');
    cy.get('[data-testid="login-email"]').type('customer@example.test');
    cy.contains('button', 'Forgot Password?').click();
    cy.contains('button', 'Send reset link').click();
    cy.wait('@recovery');
    cy.get('[role="status"]').should('contain', 'If this address');
    cy.visit('/auth/callback?code=recovery-code&flow=recovery');
    cy.location('pathname').should('eq', '/auth/reset-password');
    cy.location('search').should('eq', '');
    cy.get('#new-password').type('new-password-123', { log: false });
    cy.get('#confirm-password').type('new-password-123', { log: false });
    cy.contains('button', 'Update password').click();
    cy.wait('@updatePassword');
    cy.contains('Password updated').should('be.visible');
    cy.contains('button', 'Back to sign in').click();
    cy.location('pathname').should('eq', '/');
  });

  it('starts Google authorization and handles its return without contacting Google in tests', () => {
    cy.stubSupabase('client');
    cy.intercept('GET', '**/auth/v1/authorize*', req => {
      const params = new URL(req.url).searchParams;
      expect(params.get('provider')).to.eq('google');
      expect(params.get('redirect_to')).to.eq('http://localhost:5173/auth/callback');
      expect(params.get('code_challenge')).to.be.a('string');
      req.redirect('http://localhost:5173/auth/callback?code=google-code');
    }).as('googleAuthorize');
    cy.visit('/');
    cy.get('[data-testid="google-sign-in"]').click();
    cy.wait('@googleAuthorize');
    cy.wait('@signIn').its('request.body').should('include', { auth_code: 'google-code' });
    cy.location('pathname').should('eq', '/client/home');
    cy.location('search').should('eq', '');
  });

  it('explains an expired email link and removes the error parameters from the URL', () => {
    cy.visit('/auth/callback?error_code=otp_expired&error_description=untrusted-details');
    cy.get('[role="alert"]').should('contain', 'expired').and('not.contain', 'untrusted-details');
    cy.location('search').should('eq', '');
    cy.contains('button', 'Back to sign in').click();
    cy.location('pathname').should('eq', '/');
  });
});
