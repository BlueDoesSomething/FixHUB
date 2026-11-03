import { useAuth, type Role } from '@/stores/auth';
import type { AuthSession } from '@/services/supabaseAuth';

export function accountSession(role: Role = 'client'): AuthSession {
  const names = { client: 'Alex Rivera', technician: 'Juan Dela Cruz', admin: 'Admin User' };
  const emails = { client: 'alex.rivera@email.com', technician: 'juan.dela@fixhub.com', admin: 'admin@fixhub.com' };
  return {
    userId: `test-${role}`, email: emails[role],
    account: { user_id: `test-${role}`, full_name: names[role], phone: '', city: '', role, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  };
}

// Test setup only: production code has no password-free sign-in or role selector.
export function signInTestUser(role: Role = 'client') {
  Object.assign(useAuth().state, { session: accountSession(role), role, isAuthenticated: true, loading: false, error: '' });
}

export function signOutTestUser() {
  Object.assign(useAuth().state, { session: null, role: 'client', isAuthenticated: false, loading: false, error: '' });
}
