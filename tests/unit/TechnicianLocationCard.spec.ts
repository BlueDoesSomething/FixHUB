import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const api = vi.hoisted(() => ({ fetch: vi.fn(), save: vi.fn(), hide: vi.fn() }));
vi.mock('@/services/technicianLocations', () => ({ fetchMyTechnicianLocation: api.fetch, saveMyTechnicianLocation: api.save, stopSharingMyTechnicianLocation: api.hide }));
import TechnicianLocationCard from '@/components/technician/TechnicianLocationCard.vue';

const point = { lat: 14.55, lng: 121.02 };
const saved = { technician_id: 'profile-uuid', latitude: point.lat, longitude: point.lng, address: 'Saved shop', is_shared: true, updated_at: '2026-11-04T00:00:00Z' };
const PickerStub = defineComponent({
  props: ['modelValue', 'disabled'], emits: ['update:modelValue', 'update:address'],
  setup(props, { emit }) {
    return () => h('button', { disabled: props.disabled, 'data-testid': 'choose-location', onClick: () => { emit('update:modelValue', point); emit('update:address', 'Chosen shop'); } }, 'Choose location');
  },
});
let wrapper: VueWrapper;
function render() { wrapper = mount(TechnicianLocationCard, { global: { stubs: { LocationPicker: PickerStub } } }); }
const button = (text: string) => wrapper.findAll('button').find(item => item.text() === text)!;
beforeEach(() => {
  vi.clearAllMocks();
  api.fetch.mockResolvedValue(null);
  api.save.mockImplementation(async (_point, address) => ({ ...saved, address }));
  api.hide.mockResolvedValue(undefined);
});
afterEach(() => wrapper?.unmount());

describe('technician dashboard location sharing', () => {
  test('requires a pin and saves only after an explicit share action', async () => {
    render();
    await flushPromises();
    expect(button('Save & share location').attributes('disabled')).toBeDefined();
    await wrapper.get('#technician-address').setValue('Typed address alone');
    expect(button('Save & share location').attributes('disabled')).toBeDefined();
    await wrapper.get('[data-testid="choose-location"]').trigger('click');
    expect(api.save).not.toHaveBeenCalled();
    await button('Save & share location').trigger('click');
    await flushPromises();
    expect(api.save).toHaveBeenCalledWith(point, 'Chosen shop');
    expect(wrapper.text()).toContain('Customers can now find');
    expect(wrapper.text()).toContain('Location shared');
  });

  test('restores the saved address and lets technicians stop sharing', async () => {
    api.fetch.mockResolvedValue(saved);
    render();
    await flushPromises();
    expect((wrapper.get('#technician-address').element as HTMLInputElement).value).toBe('Saved shop');
    await button('Stop sharing').trigger('click');
    await flushPromises();
    expect(api.hide).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('Not shared');
    expect(wrapper.text()).toContain('Location sharing stopped');
  });

  test('preserves the old shared status and draft after a failed save or stop-sharing request', async () => {
    api.fetch.mockResolvedValue(saved);
    api.save.mockRejectedValue(new Error('Saving failed'));
    api.hide.mockRejectedValue(new Error('Sharing could not be stopped'));
    render();
    await flushPromises();
    await wrapper.get('[data-testid="choose-location"]').trigger('click');
    await button('Save & share location').trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('Saving failed');
    expect(wrapper.text()).toContain('Unsaved changes');
    await button('Stop sharing').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Location shared');
    expect(wrapper.text()).toContain('Sharing could not be stopped');
  });

  test('shows load errors and retries instead of implying no location is shared', async () => {
    api.fetch.mockRejectedValueOnce(new Error('Connection failed')).mockResolvedValue(saved);
    render();
    await flushPromises();
    expect(wrapper.text()).toContain('Connection failed');
    expect(wrapper.text()).toContain('Status unavailable');
    expect(wrapper.text()).not.toContain('Not shared');
    expect(button('Save & share location').attributes('disabled')).toBeDefined();
    await button('Retry').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Location shared');
  });
});
