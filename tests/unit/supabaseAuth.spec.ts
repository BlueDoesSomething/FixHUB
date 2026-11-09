import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  onAuthChange, supabaseSignUp, supabaseSignIn, supabaseSignInWithGoogle,
  supabaseRequestPasswordReset, supabaseResendConfirmation, supabaseUpdatePassword, completeAuthCallback,
} from '@/services/supabaseAuth';

type Listener = (event: string, session: { user: { id: string; email: string } } | null) => unknown;
const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(), account: vi.fn(), native: vi.fn(() => false), open: vi.fn(),
  signup: vi.fn(), signin: vi.fn(), oauth: vi.fn(), reset: vi.fn(), resend: vi.fn(), update: vi.fn(), user: vi.fn(), exchange: vi.fn(), verify: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: mocks.native } }));
vi.mock('@capacitor/browser', () => ({ Browser: { open: mocks.open } }));
vi.mock('@/services/supabase', () => ({ getSupabaseBackend: () => ({ auth: {
  onAuthStateChange: mocks.subscribe, signUp: mocks.signup, signInWithPassword: mocks.signin,
  signInWithOAuth: mocks.oauth, resetPasswordForEmail: mocks.reset, resend: mocks.resend,
  updateUser: mocks.update, getUser: mocks.user, exchangeCodeForSession: mocks.exchange, verifyOtp: mocks.verify,
} }) }));
vi.mock('@/services/supabaseAccount', () => ({ fetchMySupabaseAccount: mocks.account }));

let listener: Listener;
const session = { user: { id: 'test-user', email: 'user@example.test' } };
const account = { user_id: 'test-user', full_name: 'Test User', role: 'client' };
beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  mocks.native.mockReturnValue(false);
  mocks.user.mockResolvedValue({ data: session, error: null });
  mocks.account.mockResolvedValue(account);
  mocks.subscribe.mockImplementation((callback: Listener) => { listener = callback; return { data: { subscription: {} } }; });
});

describe('email and Google authentication', () => {
  test('treats a signup awaiting confirmation as success and sets an explicit email callback', async () => {
    mocks.signup.mockResolvedValue({ data: { user: session.user, session: null }, error: null });
    await expect(supabaseSignUp(' New Customer ', ' NEW@Example.test ', 'test-password-123')).resolves.toEqual({ session: null, confirmationRequired: true });
    expect(mocks.signup).toHaveBeenCalledWith({ email: 'new@example.test', password: 'test-password-123', options: {
      data: { full_name: 'New Customer' }, emailRedirectTo: `${window.location.origin}/auth/callback`,
    } });
  });

  test('returns the real account when email confirmation is disabled and signup creates a session', async () => {
    mocks.signup.mockResolvedValue({ data: { user: session.user, session }, error: null });
    await expect(supabaseSignUp('New Customer', session.user.email, 'test-password-123')).resolves.toMatchObject({
      confirmationRequired: false, session: { userId: 'test-user', account },
    });
  });

  test.each([
    [' ', 'person@example.test', 'test-password-123', 'full name'],
    ['New Customer', 'invalid', 'test-password-123', 'valid email'],
    ['New Customer', 'person@example.test', 'short', '12 characters'],
  ])('rejects invalid signup fields locally', async (name, email, password, message) => {
    await expect(supabaseSignUp(name, email, password)).rejects.toThrow(message);
    expect(mocks.signup).not.toHaveBeenCalled();
  });

  test('normalizes email sign-in and loads only the server-assigned profile', async () => {
    mocks.signin.mockResolvedValue({ data: session, error: null });
    await expect(supabaseSignIn(' USER@Example.test ', 'test-password-123')).resolves.toMatchObject({ account, userId: 'test-user' });
    expect(mocks.signin).toHaveBeenCalledWith({ email: 'user@example.test', password: 'test-password-123' });
  });

  test.each([
    [{ message: 'Invalid login credentials' }, 'Incorrect email or password'],
    [{ message: 'Email not confirmed' }, 'confirmation link'],
    [{ code: 'email_address_not_authorized' }, 'SMTP'],
    [{ code: 'over_email_send_rate_limit' }, 'Too many emails'],
    [{ code: 'email_provider_disabled' }, 'Email sign-in is disabled'],
    [{ message: 'Failed to fetch' }, 'internet connection'],
  ])('shows an actionable authentication error', async (error, message) => {
    mocks.signin.mockResolvedValue({ data: {}, error });
    await expect(supabaseSignIn('user@example.test', 'test-password-123')).rejects.toThrow(message);
  });

  test('starts web Google OAuth using PKCE and the web callback', async () => {
    mocks.oauth.mockResolvedValue({ data: { url: 'https://example.supabase.co/auth/v1/authorize' }, error: null });
    await supabaseSignInWithGoogle();
    expect(mocks.oauth).toHaveBeenCalledWith({ provider: 'google', options: {
      redirectTo: `${window.location.origin}/auth/callback`, skipBrowserRedirect: false, queryParams: { prompt: 'select_account' },
    } });
    expect(mocks.open).not.toHaveBeenCalled();
  });

  test('opens Android Google OAuth in the system browser with a native callback', async () => {
    mocks.native.mockReturnValue(true);
    mocks.oauth.mockResolvedValue({ data: { url: 'https://example.supabase.co/auth/v1/authorize' }, error: null });
    await supabaseSignInWithGoogle('/become-a-technician');
    expect(mocks.oauth).toHaveBeenCalledWith(expect.objectContaining({ options: expect.objectContaining({ redirectTo: 'com.fixhub.app://auth/callback', skipBrowserRedirect: true }) }));
    expect(mocks.open).toHaveBeenCalledWith({ url: 'https://example.supabase.co/auth/v1/authorize' });
  });

  test('explains when the hosted Google provider is disabled', async () => {
    mocks.oauth.mockResolvedValue({ data: {}, error: { code: 'provider_disabled' } });
    await expect(supabaseSignInWithGoogle()).rejects.toThrow('configure the Google provider');
  });

  test('sends confirmation and password reset emails with the correct callbacks', async () => {
    mocks.resend.mockResolvedValue({ error: null });
    mocks.reset.mockResolvedValue({ error: null });
    await supabaseResendConfirmation(' USER@Example.test ');
    await supabaseRequestPasswordReset(' USER@Example.test ');
    expect(mocks.resend).toHaveBeenCalledWith({ type: 'signup', email: 'user@example.test', options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    expect(mocks.reset).toHaveBeenCalledWith('user@example.test', { redirectTo: `${window.location.origin}/auth/callback?flow=recovery` });
  });

  test('exchanges a callback code before loading the authoritative account', async () => {
    mocks.exchange.mockResolvedValue({ data: { session }, error: null });
    await expect(completeAuthCallback('http://localhost/auth/callback?code=one-use-code')).resolves.toEqual({
      session: { userId: 'test-user', email: session.user.email, account }, recovery: false,
    });
    expect(mocks.exchange).toHaveBeenCalledExactlyOnceWith('one-use-code');
  });

  test('distinguishes recovery and supports token-hash email templates across devices', async () => {
    mocks.verify.mockResolvedValue({ data: { session }, error: null });
    await expect(completeAuthCallback('http://localhost/auth/callback?token_hash=one-use-hash&type=recovery')).resolves.toMatchObject({ recovery: true });
    expect(mocks.verify).toHaveBeenCalledWith({ token_hash: 'one-use-hash', type: 'recovery' });
    mocks.exchange.mockResolvedValue({ data: { session }, error: null });
    await expect(completeAuthCallback('http://localhost/auth/callback?code=code&flow=recovery')).resolves.toMatchObject({ recovery: true });
  });

  test.each([
    ['?error=access_denied&error_description=do-not-display-this', 'cancelled'],
    ['?error_code=otp_expired', 'expired'],
    ['?error_code=provider_disabled', 'configure the Google provider'],
    ['', 'incomplete'],
    ['#access_token=untrusted-token&refresh_token=untrusted-token', 'incomplete'],
    ['?token_hash=hash&type=invite', 'incomplete'],
  ])('rejects incomplete, cancelled, expired, and unsupported links', async (query, message) => {
    await expect(completeAuthCallback(`http://localhost/auth/callback${query}`)).rejects.toThrow(message);
    expect(mocks.exchange).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  test('explains expired PKCE codes and cross-device verifier failures', async () => {
    mocks.exchange.mockResolvedValue({ data: {}, error: { code: 'flow_state_not_found' } });
    await expect(completeAuthCallback('http://localhost/auth/callback?code=expired')).rejects.toThrow('same device');
  });

  test('updates only the password and enforces minimum length', async () => {
    mocks.update.mockResolvedValue({ error: null });
    await expect(supabaseUpdatePassword('short')).rejects.toThrow('12 characters');
    expect(mocks.update).not.toHaveBeenCalled();
    await supabaseUpdatePassword('new-password-123');
    expect(mocks.update).toHaveBeenCalledWith({ password: 'new-password-123' });
  });
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

describe('auth state notifications', () => {
  test('releases the auth callback before making an authenticated account request', async () => {
    const callback = vi.fn();
    mocks.account.mockResolvedValue(account);
    onAuthChange(callback);
    expect(listener('SIGNED_IN', session)).toBeUndefined();
    expect(mocks.account).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledWith({ userId: 'test-user', email: session.user.email, account });
  });

  test('cannot restore a stale account after sign-out while its profile is loading', async () => {
    const callback = vi.fn();
    let finish!: (value: unknown) => void;
    mocks.account.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    onAuthChange(callback);
    listener('SIGNED_IN', session);
    await vi.advanceTimersByTimeAsync(0);
    listener('SIGNED_OUT', null);
    finish(account);
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledExactlyOnceWith(null);
  });

  test('does not substitute an example account when its profile cannot be read', async () => {
    const callback = vi.fn();
    mocks.account.mockRejectedValue(new Error('Unavailable'));
    onAuthChange(callback);
    listener('SIGNED_IN', session);
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledExactlyOnceWith(null);
  });
});
