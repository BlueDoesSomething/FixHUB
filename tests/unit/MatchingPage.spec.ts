import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { signInTestUser, signOutTestUser } from './fixtures/accounts';
import { defineComponent, h } from 'vue';

const api = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('@/services/technicianLocations', () => ({ listLocatedTechnicians: api.list }));
vi.mock('@ionic/vue', () => ({
  IonPage: { template: '<div><slot /></div>' }, IonContent: { template: '<div><slot /></div>' },
  onIonViewWillEnter: vi.fn(), onIonViewDidEnter: vi.fn(), onIonViewDidLeave: vi.fn(),
}));
import MatchingPage from '@/views/client/MatchingPage.vue';

const PickerStub = defineComponent({
  emits: ['update:modelValue'],
  setup(_, { emit }) { return () => h('button', { 'data-testid': 'starting-point', onClick: () => emit('update:modelValue', { lat: 14.55, lng: 121.02 }) }, 'Set starting point'); },
});
const base = { specializations: ['Smartphone'], service_type: 'both', address: 'Shared shop', updated_at: '2026-11-04T00:00:00Z' };
const records = [
  { ...base, id: 'far', full_name: 'Far Technician', latitude: 15, longitude: 121.02 },
  { ...base, id: 'near', full_name: 'Near Technician', latitude: 14.56, longitude: 121.02 },
];
let wrapper: VueWrapper;
function render() { wrapper = mount(MatchingPage, { global: { stubs: { LocationPicker: PickerStub } } }); }
beforeEach(() => { vi.clearAllMocks(); signInTestUser(); api.list.mockResolvedValue(records); });
afterEach(() => { wrapper?.unmount(); signOutTestUser(); });

describe('customer technician map directory', () => {
  test('filters and sorts real shared technicians by the selected starting point and radius', async () => {
    render();
    await flushPromises();
    expect(wrapper.findAll('[data-testid="nearby-technician"]')).toHaveLength(2);
    await wrapper.get('[data-testid="starting-point"]').trigger('click');
    expect(wrapper.findAll('[data-testid="nearby-technician"]')).toHaveLength(1);
    expect(wrapper.text()).toContain('Near Technician');
    expect(wrapper.text()).not.toContain('Far Technician');
    await wrapper.get('#nearby-radius').setValue(100);
    const cards = wrapper.findAll('[data-testid="nearby-technician"]');
    expect(cards).toHaveLength(2);
    expect(cards[0].text()).toContain('Near Technician');
    const url = new URL(cards[0].get('a').attributes('href'));
    expect(url.origin).toBe('https://www.google.com');
    expect(url.searchParams.get('destination')).toBe('14.56,121.02');
    expect(url.searchParams.get('origin')).toBe('14.55,121.02');
    expect(wrapper.text()).toContain('straight-line');
  });
  test('distinguishes empty directories from backend errors', async () => {
    api.list.mockResolvedValue([]);
    render();
    await flushPromises();
    expect(wrapper.text()).toContain('No technicians have shared');
    api.list.mockRejectedValue(new Error('Connection failed'));
    await wrapper.findAll('button').find(item => item.text() === 'Refresh')!.trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('Connection failed');
    expect(wrapper.text()).not.toContain('No technicians have shared');
  });
  test('discards a previous account’s delayed directory response after sign-out', async () => {
    let resolve!: (value: typeof records) => void;
    api.list.mockImplementation(() => new Promise(done => { resolve = done; }));
    render();
    signOutTestUser();
    await flushPromises();
    resolve(records);
    await flushPromises();
    expect(wrapper.findAll('[data-testid="nearby-technician"]')).toHaveLength(0);
  });
});
