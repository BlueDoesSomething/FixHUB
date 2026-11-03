/// <reference types="cypress" />
export type TestRole = 'client' | 'technician' | 'admin';

const accounts = {
  client: { email: 'customer@example.test', name: 'Test Customer', route: '/client/home' },
  technician: { email: 'technician@example.test', name: 'Test Technician', route: '/technician/dashboard' },
  admin: { email: 'admin@example.test', name: 'Test Administrator', route: '/admin/dashboard' },
};

// Network fixtures live only in Cypress, never in the app or hosted database.
Cypress.Commands.add('stubSupabase', (role: TestRole) => {
  const id = { client: '11111111-1111-4111-8111-111111111111', technician: '22222222-2222-4222-8222-222222222222', admin: '33333333-3333-4333-8333-333333333333' }[role];
  const { email, name } = accounts[role];
  const user = { id, email, aud: 'authenticated', role: 'authenticated', email_confirmed_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { full_name: name }, identities: [] };
  const claims = { sub: id, email, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) };
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.test-signature`;
  cy.intercept('POST', '**/auth/v1/token*', { access_token: token, refresh_token: 'test-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: claims.exp, user }).as('signIn');
  cy.intercept('GET', '**/auth/v1/user', user);
  cy.intercept('POST', '**/auth/v1/logout*', { statusCode: 204, body: '' });
  cy.intercept('POST', '**/rest/v1/rpc/get_my_account', { user_id: id, full_name: name, phone: '', city: '', role, created_at: user.created_at, updated_at: user.created_at });
});

Cypress.Commands.add('signIn', (role: TestRole = 'client') => {
  cy.stubSupabase(role);
  cy.visit('/', {
    onBeforeLoad(win) {
      for (const key of Object.keys(win.localStorage)) {
        if (/^sb-.*-auth-token/.test(key)) win.localStorage.removeItem(key);
      }
    },
  });
  cy.get('[data-testid="login-email"]').type(accounts[role].email);
  cy.get('[data-testid="login-password"]').type('test-password-123', { log: false });
  cy.contains('button', 'Login & Continue').click();
  cy.location('pathname').should('eq', accounts[role].route);
});

declare global {
  // Cypress extends its public types through a global namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      stubSupabase(role: TestRole): Chainable<void>;
      signIn(role?: TestRole): Chainable<void>;
    }
  }
}
