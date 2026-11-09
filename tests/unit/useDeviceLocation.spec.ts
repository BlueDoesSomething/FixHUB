import { defineComponent, h, ref } from 'vue';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { LocatedPoint } from '@/services/geolocation';

const api = vi.hoisted(() => ({
  watch: vi.fn(), stop: vi.fn(), addListener: vi.fn(), remove: vi.fn(), getState: vi.fn(),
  state: undefined as ((value: { isActive: boolean }) => void) | undefined,
  receive: undefined as ((point: LocatedPoint) => void) | undefined,
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/app', () => ({ App: { addListener: api.addListener, getState: api.getState } }));
vi.mock('@/services/geolocation', () => ({ watchCurrentLocation: api.watch }));
import { useDeviceLocation } from '@/composables/useDeviceLocation';

let wrapper: VueWrapper;
let gps: ReturnType<typeof useDeviceLocation>;
const active = ref(true);
const receive = vi.fn();
beforeEach(() => {
  vi.clearAllMocks(); active.value = true;
  api.watch.mockImplementation(onPoint => { api.receive = onPoint; return api.stop; });
  api.addListener.mockImplementation((_event, callback) => { api.state = callback; return Promise.resolve({ remove: api.remove }); });
  api.getState.mockResolvedValue({ isActive: true });
});
afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks(); });
function render() {
  wrapper = mount(defineComponent({ setup() {
    gps = useDeviceLocation(() => active.value, true, receive);
    return () => h('div', gps.error.value);
  } }));
}

test('native app backgrounding clears GPS and rejects late fixes, then resumes private following', async () => {
  render(); await flushPromises();
  const delayed = api.receive;
  api.state?.({ isActive: false });
  delayed?.({ lat: 14, lng: 121, accuracy: 10 });
  expect(api.stop).toHaveBeenCalledOnce();
  expect(receive).not.toHaveBeenCalled();
  api.state?.({ isActive: true });
  expect(api.watch).toHaveBeenCalledTimes(2);
  api.receive?.({ lat: 15, lng: 121, accuracy: 10 });
  expect(receive).toHaveBeenCalledOnce();
  wrapper.unmount();
  expect(api.remove).toHaveBeenCalledOnce();
});

test('manual selection disables following across native foreground and cached-page transitions', async () => {
  render(); await flushPromises();
  gps.stop();
  api.state?.({ isActive: false });
  api.state?.({ isActive: true });
  active.value = false;
  active.value = true;
  expect(api.watch).toHaveBeenCalledOnce();
  gps.start();
  expect(api.watch).toHaveBeenCalledTimes(2);
});

test('document visibility also suspends native GPS', async () => {
  render(); await flushPromises();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
  expect(api.stop).toHaveBeenCalledOnce();
  expect(gps.running.value).toBe(false);
});
