import { getSupabaseBackend } from './supabase';
import { fetchMySupabaseAccount, type SupabaseAccount } from './supabaseAccount';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { authRedirectUrl, rememberAuthReturnPath } from './authRedirect';

export interface AuthSession {
  userId: string;
  email: string;
  account: SupabaseAccount;
}

function normalizedEmail(email: string): string {
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Please enter a valid email address.');
  return value;
}

export interface SignUpResult { session: AuthSession | null; confirmationRequired: boolean }

/** Sign up a customer. Confirmation pending is a success, not a failed signup. */
export async function supabaseSignUp(fullName: string, email: string, password: string): Promise<SignUpResult> {
  const name = fullName.trim();
  if (name.length < 2 || name.length > 120) throw new Error('Use a full name of 2–120 characters.');
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');
  const client = getSupabaseBackend();
  const { data, error } = await client.auth.signUp({
    email: normalizedEmail(email),
    password,
    options: { data: { full_name: name }, emailRedirectTo: authRedirectUrl() },
  });
  if (error) throw new Error(friendlyAuthError(error));
  if (data.session) {
    const session = await loadSession();
    if (!session) throw new Error('Your account profile could not be loaded. Check your database migrations.');
    return { session, confirmationRequired: false };
  }
  return { session: null, confirmationRequired: true };
}

/** Sign in with email/password. */
export async function supabaseSignIn(email: string, password: string): Promise<AuthSession> {
  if (!password) throw new Error('Enter your password.');
  const client = getSupabaseBackend();
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizedEmail(email),
    password,
  });
  if (error) throw new Error(friendlyAuthError(error));
  if (!data.user) throw new Error('Sign-in failed. Please try again.');
  const session = await loadSession();
  if (!session) throw new Error('Your account profile could not be loaded. Check your database migrations.');
  return session;
}

export async function supabaseSignInWithGoogle(returnPath?: string): Promise<void> {
  rememberAuthReturnPath(returnPath);
  const native = Capacitor.isNativePlatform();
  const { data, error } = await getSupabaseBackend().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: authRedirectUrl(), skipBrowserRedirect: native, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw new Error(friendlyAuthError(error));
  if (!data.url) throw new Error('Google sign-in could not be started. Please try again.');
  if (native) await Browser.open({ url: data.url });
}

export async function supabaseResendConfirmation(email: string): Promise<void> {
  const { error } = await getSupabaseBackend().auth.resend({
    type: 'signup', email: normalizedEmail(email), options: { emailRedirectTo: authRedirectUrl() },
  });
  if (error) throw new Error(friendlyAuthError(error));
}

export async function supabaseRequestPasswordReset(email: string): Promise<void> {
  const { error } = await getSupabaseBackend().auth.resetPasswordForEmail(normalizedEmail(email), { redirectTo: authRedirectUrl(true) });
  if (error) throw new Error(friendlyAuthError(error));
}

export async function supabaseUpdatePassword(password: string): Promise<void> {
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');
  const { error } = await getSupabaseBackend().auth.updateUser({ password });
  if (error) throw new Error(friendlyAuthError(error));
}

/** Only one-use PKCE codes or email token hashes are accepted, never URL sessions. */
export async function completeAuthCallback(value: string): Promise<{ session: AuthSession; recovery: boolean }> {
  const url = new URL(value);
  const params = url.searchParams;
  const failure = params.get('error_code') || params.get('error');
  if (failure) {
    if (failure === 'provider_disabled' || failure === 'unsupported_provider') throw new Error(friendlyAuthError({ code: 'provider_disabled' }));
    if (failure === 'access_denied') throw new Error('Sign-in was cancelled or the link was not approved. Try again.');
    if (failure === 'otp_expired') throw new Error('This email link has expired or was already used. Request a new one.');
    throw new Error('Authentication could not be completed. Try signing in again or request a new email link.');
  }
  const client = getSupabaseBackend();
  const code = params.get('code');
  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  const recovery = params.get('flow') === 'recovery' || type === 'recovery';
  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw new Error('This sign-in link has expired, was already used, or was opened on a different device. Start again in FIXHUB and use the newest link on the same device.');
    if (!data.session) throw new Error('The sign-in link did not create a session. Please try again.');
  } else if (tokenHash && (type === 'signup' || type === 'email' || type === 'recovery')) {
    const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error || !data.session) throw new Error('This email link has expired or was already used. Request a new one.');
  } else {
    throw new Error('This sign-in link is incomplete. Start again in FIXHUB or request a new email link.');
  }
  const session = await loadSession();
  if (!session) throw new Error('Your account profile could not be loaded. Check your database migrations.');
  return { session, recovery };
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
  if (error.code === 'provider_disabled' || /provider is not enabled|unsupported provider/i.test(msg)) return 'Google sign-in is not enabled for this Supabase project. Ask the administrator to configure the Google provider.';
  if (error.code === 'email_address_not_authorized') return 'Email delivery is restricted to test addresses. Ask the administrator to configure SMTP for this Supabase project.';
  if (error.code === 'over_email_send_rate_limit') return 'Too many emails requested. Wait a few minutes before requesting another link.';
  if (error.code === 'email_provider_disabled') return 'Email sign-in is disabled for this Supabase project. Ask the administrator to enable it.';
  if (error.code === 'weak_password') return 'Choose a stronger password with at least 12 characters.';
  if (/fetch|network/i.test(msg)) return 'Cannot reach the sign-in service. Check your internet connection and try again.';
  if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (msg.includes('Email not confirmed')) return 'Check your email and click the confirmation link before signing in.';
  if (msg.includes('already registered')) return 'An account with this email already exists. Try signing in instead.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  return msg || 'Something went wrong. Please try again.';
}
