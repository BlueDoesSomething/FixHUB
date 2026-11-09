import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import ResetPasswordPage from '@/views/auth/ResetPasswordPage.vue';

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), update: vi.fn(), logout: vi.fn(), replace: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('@/stores/auth', () => ({ useAuth: () => ({ refreshSession: mocks.refresh, updatePassword: mocks.update, logout: mocks.logout }) }));
vi.mock('@ionic/vue', () => ({ IonPage: { template: '<div><slot /></div>' }, IonContent: { template: '<div><slot /></div>' }, onIonViewWillEnter: vi.fn() }));

let wrapper: VueWrapper | undefined;
beforeEach(() => { vi.resetAllMocks(); mocks.refresh.mockResolvedValue({ userId: 'test-user' }); });
afterEach(() => wrapper?.unmount());

describe('password recovery', () => {
  test('requires a valid session before allowing a password change', async () => {
    mocks.refresh.mockResolvedValue(null);
    wrapper = mount(ResetPasswordPage);
    await flushPromises();
    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain('expired');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  test('validates matching strong passwords before sending them', async () => {
    wrapper = mount(ResetPasswordPage);
    await flushPromises();
    await wrapper.get('#new-password').setValue('short');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.get('[role="alert"]').text()).toContain('12 characters');
    await wrapper.get('#new-password').setValue('new-password-123');
    await wrapper.get('#confirm-password').setValue('different-password');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.get('[role="alert"]').text()).toContain('do not match');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  test('updates the password, signs out, and asks the user to sign in with the new password', async () => {
    wrapper = mount(ResetPasswordPage);
    await flushPromises();
    await wrapper.get('#new-password').setValue('new-password-123');
    await wrapper.get('#confirm-password').setValue('new-password-123');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(mocks.update).toHaveBeenCalledWith('new-password-123');
    expect(mocks.logout).toHaveBeenCalledOnce();
    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.get('[role="status"]').text()).toContain('new password');
  });

  test('keeps password entry available when the server rejects the change', async () => {
    mocks.update.mockRejectedValue(new Error('The session expired. Request a new reset link.'));
    wrapper = mount(ResetPasswordPage);
    await flushPromises();
    await wrapper.get('#new-password').setValue('new-password-123');
    await wrapper.get('#confirm-password').setValue('new-password-123');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('expired');
    expect(wrapper.find('form').exists()).toBe(true);
    expect(mocks.logout).not.toHaveBeenCalled();
  });
});
