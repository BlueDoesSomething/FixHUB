import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { reactive } from 'vue';
import AuthCallbackPage from '@/views/auth/AuthCallbackPage.vue';

const mocks = vi.hoisted(() => ({ route: { path: '/auth/callback', fullPath: '/auth/callback?code=first', query: {} as Record<string, string> }, replace: vi.fn(), finish: vi.fn(), consume: vi.fn() }));
vi.mock('vue-router', () => ({ useRoute: () => mocks.route, useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('@/stores/auth', () => ({ useAuth: () => ({ finishAuthCallback: mocks.finish }) }));
vi.mock('@/services/authRedirect', () => ({ AUTH_CALLBACK_PATH: '/auth/callback', consumeAuthReturnPath: mocks.consume }));
vi.mock('@ionic/vue', () => ({ IonPage: { template: '<div><slot /></div>' }, IonContent: { template: '<div><slot /></div>' } }));

let wrapper: VueWrapper | undefined;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.route = reactive({ path: '/auth/callback', fullPath: '/auth/callback?code=first', query: { code: 'first' } });
  mocks.finish.mockResolvedValue({ profile: { homeRoute: '/client/home' }, recovery: false });
});
afterEach(() => wrapper?.unmount());

describe('authentication callback page', () => {
  test('completes authentication and replaces the token-bearing URL with the account dashboard', async () => {
    wrapper = mount(AuthCallbackPage);
    await flushPromises();
    expect(mocks.finish).toHaveBeenCalledWith(`${window.location.origin}/auth/callback?code=first`);
    expect(mocks.replace).toHaveBeenCalledWith('/client/home');
  });

  test('preserves an approved internal return path after OAuth', async () => {
    mocks.consume.mockReturnValue('/become-a-technician');
    wrapper = mount(AuthCallbackPage);
    await flushPromises();
    expect(mocks.replace).toHaveBeenCalledWith('/become-a-technician');
  });

  test('routes a password recovery link to password entry, not to a dashboard', async () => {
    mocks.finish.mockResolvedValue({ profile: { homeRoute: '/admin/dashboard' }, recovery: true });
    wrapper = mount(AuthCallbackPage);
    await flushPromises();
    expect(mocks.replace).toHaveBeenCalledWith('/auth/reset-password');
  });

  test('shows errors and scrubs the callback payload instead of granting access', async () => {
    mocks.finish.mockRejectedValue(new Error('The email link has expired.'));
    wrapper = mount(AuthCallbackPage);
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('expired');
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith('/auth/callback');
  });

  test('handles a second callback when Ionic reuses the page', async () => {
    wrapper = mount(AuthCallbackPage);
    await flushPromises();
    mocks.route.fullPath = '/auth/callback?code=second';
    mocks.route.query = { code: 'second' };
    await flushPromises();
    expect(mocks.finish).toHaveBeenCalledTimes(2);
    expect(mocks.finish).toHaveBeenLastCalledWith(`${window.location.origin}/auth/callback?code=second`);
  });

  test('does not navigate after a callback finishes on a page the user has left', async () => {
    let finish!: (value: unknown) => void;
    mocks.finish.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    wrapper = mount(AuthCallbackPage);
    mocks.route.path = '/';
    mocks.route.fullPath = '/';
    await flushPromises();
    finish({ profile: { homeRoute: '/client/home' }, recovery: false });
    await flushPromises();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
