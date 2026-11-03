import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { useAuth, type Role } from '@/stores/auth';
import { accountSession, signOutTestUser } from './fixtures/accounts';

const mocks = vi.hoisted(() => ({ push: vi.fn(), signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/services/supabaseAuth', () => ({
  supabaseSignIn: mocks.signIn, supabaseSignUp: mocks.signUp, supabaseSignOut: mocks.signOut,
  loadSession: vi.fn(), onAuthChange: vi.fn(),
}));
import AuthForm from '@/components/landing/home/AuthForm.vue';

let wrapper: VueWrapper | undefined;
const auth = useAuth();
beforeEach(() => { vi.resetAllMocks(); signOutTestUser(); });
afterEach(() => { wrapper?.unmount(); wrapper = undefined; signOutTestUser(); });

async function signIn(email: string, password = '', redirect?: string) {
  wrapper = mount(AuthForm, { props: redirect ? { redirect } : {} });
  await wrapper.get('[data-testid="login-email"]').setValue(email);
  await wrapper.get('[data-testid="login-password"]').setValue(password);
  await wrapper.findAll('button').find(button => button.text().includes('Login & Continue'))!.trigger('click');
  await flushPromises();
}

describe('Supabase sign-in', () => {
  test.each<Role>(['client', 'technician', 'admin'])('uses the server-assigned %s role and account details', async role => {
    const session = accountSession(role);
    mocks.signIn.mockResolvedValue(session);
    await signIn(session.email, 'test-password-123');
    expect(mocks.signIn).toHaveBeenCalledWith(session.email, 'test-password-123');
    expect(auth.state.isAuthenticated).toBe(true);
    expect(auth.state.role).toBe(role);
    expect(auth.profile().name).toBe(session.account.full_name);
    expect(mocks.push).toHaveBeenCalledWith(auth.profile().homeRoute);
  });

  test('does not infer administrator privileges from an email address', async () => {
    mocks.signIn.mockResolvedValue({ ...accountSession('client'), email: 'admin@fixhub.com' });
    await signIn('admin@fixhub.com', 'test-password-123');
    expect(auth.state.role).toBe('client');
    expect(mocks.push).toHaveBeenCalledWith('/client/home');
  });

  test.each(['', '   ', 'not-an-email'])('rejects invalid email %j', async email => {
    await signIn(email, 'test-password-123');
    expect(wrapper!.get('[role="alert"]').text()).toContain('valid email');
    expect(mocks.signIn).not.toHaveBeenCalled();
    expect(auth.state.isAuthenticated).toBe(false);
  });

  test('requires a password even for a formerly recognized email', async () => {
    await signIn('admin@fixhub.com');
    expect(wrapper!.get('[role="alert"]').text()).toContain('Enter your password');
    expect(mocks.signIn).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  test('does not grant access when the backend is missing or rejects credentials', async () => {
    mocks.signIn.mockRejectedValue(new Error('Sign-in is unavailable.'));
    await signIn('person@example.com', 'wrong-password');
    expect(wrapper!.get('[role="alert"]').text()).toContain('unavailable');
    expect(auth.state.isAuthenticated).toBe(false);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  test('honors a return path after successful authentication', async () => {
    mocks.signIn.mockResolvedValue(accountSession());
    await signIn('person@example.com', 'test-password-123', '/become-a-technician');
    expect(mocks.push).toHaveBeenCalledWith('/become-a-technician');
  });

  test('has no account shortcuts or password-free reminders', () => {
    wrapper = mount(AuthForm);
    expect(wrapper.text()).not.toMatch(/demo|prototype|no password|optional/i);
    expect(wrapper.find('[data-testid="demo-accounts"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="login-password"]').attributes('required')).toBeDefined();
  });

  test('shows signup failures instead of pretending an account was created', async () => {
    mocks.signUp.mockRejectedValue(new Error('Connection unavailable.'));
    wrapper = mount(AuthForm);
    await wrapper.findAll('button').find(button => button.text() === 'Sign Up')!.trigger('click');
    const fields = wrapper.findAll('input');
    await fields[0].setValue('New Customer');
    await fields[1].setValue('new@example.com');
    await fields[2].setValue('test-password-123');
    await wrapper.findAll('button').find(button => button.text().includes('Create Account'))!.trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('Connection unavailable');
    expect(auth.state.isAuthenticated).toBe(false);
  });
});
