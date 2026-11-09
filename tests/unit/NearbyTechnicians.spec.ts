import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { signInTestUser, signOutTestUser } from './fixtures/accounts';
const api = vi.hoisted(() => ({ list: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn(), refresh: undefined as (() => void) | undefined }));
vi.mock('@/services/technicianLocations', () => ({ listLocatedTechnicians: api.list, subscribeToTechnicianLocations: api.subscribe }));
import NearbyTechnicians from '@/components/NearbyTechnicians.vue';
import { LocationSetupError } from '@/services/locationErrors';

const point = { lat: 14.55, lng: 121.02 };
const base = { full_name: 'Phone Technician', specializations: ['Smartphone'], service_type: 'both', latitude: 14.56, longitude: 121.02, address: 'Shop', updated_at: new Date().toISOString(), location_mode: 'manual', live_expires_at: null };
let wrapper: VueWrapper;
beforeEach(() => {
  vi.clearAllMocks(); signInTestUser();
  api.list.mockResolvedValue([{ ...base, id: 'phone' }]);
  api.subscribe.mockImplementation((refresh, connection) => { api.refresh = refresh; connection(true); return api.unsubscribe; });
});
afterEach(() => { wrapper?.unmount(); signOutTestUser(); vi.useRealTimers(); vi.restoreAllMocks(); });
function render() { wrapper = mount(NearbyTechnicians, { props: { id: 'test', point, device: 'Smartphone', serviceType: 'home' } }); }

test('automatically filters by distance, device, service type, and live expiry', async () => {
  api.list.mockResolvedValue([
    { ...base, id: 'phone' },
    { ...base, id: 'far', full_name: 'Far away', latitude: 17 },
    { ...base, id: 'wrong-device', full_name: 'Laptop only', specializations: ['Laptop'] },
    { ...base, id: 'wrong-service', full_name: 'Drop-off only', service_type: 'dropoff' },
    { ...base, id: 'expired', full_name: 'Expired GPS', location_mode: 'live', live_expires_at: new Date(Date.now() - 1000).toISOString() },
  ]);
  render(); await flushPromises();
  expect(wrapper.findAll('[data-testid="nearby-technician"]')).toHaveLength(1);
  expect(wrapper.text()).toContain('Phone Technician');
  expect(wrapper.text()).toContain('Connected to live technician updates');
  expect(wrapper.emitted('markers')?.at(-1)?.[0]).toHaveLength(1);
});

test('refetches a safe snapshot after real-time updates and removes a hidden technician', async () => {
  render(); await flushPromises();
  api.list.mockResolvedValue([]);
  api.refresh?.(); await flushPromises();
  expect(wrapper.findAll('[data-testid="nearby-technician"]')).toHaveLength(0);
  expect(wrapper.text()).toContain('No matching technicians');
});

test('does not exclude real application repair skills that are not device categories', async () => {
  api.list.mockResolvedValue([{ ...base, id: 'skills', specializations: ['Screen Replacement', 'Battery Replacement'] }]);
  render(); await flushPromises();
  expect(wrapper.findAll('[data-testid="nearby-technician"]')).toHaveLength(1);
  expect(wrapper.text()).toContain('Confirm device support');
});

test('coalesces events during a pending snapshot without dropping the last update', async () => {
  let resolve!: (value: unknown[]) => void;
  api.list.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  render();
  api.refresh?.(); api.refresh?.();
  api.list.mockResolvedValue([]);
  resolve([{ ...base, id: 'old' }]);
  await flushPromises();
  expect(api.list).toHaveBeenCalledTimes(2);
  expect(wrapper.findAll('[data-testid="nearby-technician"]')).toHaveLength(0);
});

test('expires disconnected live pins and polls when real-time transport is unavailable', async () => {
  vi.useFakeTimers();
  api.subscribe.mockImplementation(() => api.unsubscribe);
  api.list.mockResolvedValue([{ ...base, id: 'live', location_mode: 'live', live_expires_at: new Date(Date.now() + 10000).toISOString() }]);
  render(); await flushPromises();
  expect(wrapper.text()).toContain('live connection unavailable');
  expect(wrapper.findAll('[data-testid="nearby-technician"]')).toHaveLength(1);
  await vi.advanceTimersByTimeAsync(15000);
  expect(api.list).toHaveBeenCalledTimes(2);
  expect(wrapper.findAll('[data-testid="nearby-technician"]')).toHaveLength(0);
});

test('pauses automatic polls when location functions are missing and resumes on manual refresh', async () => {
  vi.useFakeTimers();
  api.list.mockRejectedValueOnce(new LocationSetupError());
  render(); await flushPromises();
  expect(wrapper.text()).toContain('Automatic refresh is paused');
  expect(wrapper.text()).toContain('not configured on this server');
  expect(wrapper.text()).not.toContain('Connected to live technician updates');
  api.list.mockResolvedValue([{ ...base, id: 'phone' }]);
  await vi.advanceTimersByTimeAsync(30000);
  expect(api.list).toHaveBeenCalledTimes(1);
  await wrapper.findAll('button').find(item => item.text() === 'Refresh')!.trigger('click');
  await flushPromises();
  expect(api.list).toHaveBeenCalledTimes(2);
  expect(wrapper.text()).toContain('Phone Technician');
  expect(wrapper.text()).toContain('Connected to live technician updates');
  expect(api.subscribe).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(15000);
  expect(api.list).toHaveBeenCalledTimes(3);
});

test('pauses inactive pages and discards old account responses', async () => {
  vi.useFakeTimers();
  let resolve!: (value: unknown[]) => void;
  api.list.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  render();
  await wrapper.setProps({ active: false });
  resolve([{ ...base, id: 'old' }]);
  await flushPromises();
  expect(api.unsubscribe).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(30000);
  expect(api.list).toHaveBeenCalledOnce();
  expect(wrapper.findAll('[data-testid="nearby-technician"]')).toHaveLength(0);
});
