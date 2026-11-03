import { getSupabaseBackend } from './supabase';
import { fetchMySupabaseAccount, type SupabaseAccount } from './supabaseAccount';

export interface AuthSession {
  userId: string;
  email: string;
  account: SupabaseAccount;
}

/** Sign up a new customer with email/password. The DB trigger auto-creates their profile + client role. */
export async function supabaseSignUp(fullName: string, email: string, password: string): Promise<void> {
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');
  const client = getSupabaseBackend();
  const { data, error } = await client.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });
  if (error) throw new Error(friendlyAuthError(error));
  if (!data.session && data.user && !data.user.email_confirmed_at) {
    throw new Error('Check your email and click the confirmation link to finish creating your account.');
  }
}

/** Sign in with email/password. */
export async function supabaseSignIn(email: string, password: string): Promise<AuthSession> {
  const client = getSupabaseBackend();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(friendlyAuthError(error));
  if (!data.user) throw new Error('Sign-in failed. Please try again.');
  const session = await loadSession();
  if (!session) throw new Error('Your account profile could not be loaded. Check your database migrations.');
  return session;
}

/** Sign out and clear the local session. */
export async function supabaseSignOut(): Promise<void> {
  const { error } = await getSupabaseBackend().auth.signOut();
  if (error) throw new Error(friendlyAuthError(error));
}

/** Load the current session + account profile. Returns null if not signed in. */
export async function loadSession(): Promise<AuthSession | null> {
  const client = getSupabaseBackend();
  const { data: identity, error } = await client.auth.getUser();
  if (error || !identity.user) return null;
  try {
    const account = await fetchMySupabaseAccount();
    return { userId: identity.user.id, email: identity.user.email ?? '', account };
  } catch {
    return null;
  }
}

/** Subscribe to auth state changes (sign in, sign out, token refresh). */
export function onAuthChange(callback: (session: AuthSession | null) => void) {
  let revision = 0;
  return getSupabaseBackend().auth.onAuthStateChange((_event, session) => {
    const current = ++revision;
    if (!session?.user) {
      callback(null);
      return;
    }
    // Supabase holds its auth lock during this callback. Fetch the profile after
    // returning so an authenticated RPC cannot deadlock the sign-in operation.
    setTimeout(() => {
      void fetchMySupabaseAccount().then(account => {
        if (current === revision) callback({ userId: session.user.id, email: session.user.email ?? '', account });
      }).catch(() => { if (current === revision) callback(null); });
    }, 0);
  });
}

function friendlyAuthError(error: { message?: string; code?: string }): string {
  const msg = error.message ?? '';
  if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (msg.includes('Email not confirmed')) return 'Check your email and click the confirmation link before signing in.';
  if (msg.includes('already registered')) return 'An account with this email already exists. Try signing in instead.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  return msg || 'Something went wrong. Please try again.';
}
