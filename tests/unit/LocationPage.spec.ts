import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useRepairDraft } from '@/stores/repair';
import type { LocatedPoint } from '@/services/geolocation';
import { signInTestUser } from './fixtures/accounts';

const mocks = vi.hoisted(() => ({
  push: vi.fn(), locate: vi.fn(),
  leave: undefined as (() => void) | undefined,
}));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/services/geolocation', () => ({ getCurrentLocation: mocks.locate }));
vi.mock('@ionic/vue', () => ({
  IonPage: { template: '<div><slot /></div>' },
  IonContent: { template: '<div><slot /></div>' },
  onIonViewDidEnter: vi.fn(),
  onIonViewWillEnter: vi.fn(),
  onIonViewDidLeave: (callback: () => void) => { mocks.leave = callback; },
}));

import LocationPage from '@/views/client/LocationPage.vue';

const point = { lat: 14.5547, lng: 121.0244 };
const MapStub = defineComponent({
  emits: ['select'],
  setup(_, { emit, expose }) {
    expose({ resize: vi.fn(), selectCenter: () => emit('select', point) });
    return () => h('button', { 'data-testid': 'map-select', onClick: () => emit('select', point) }, 'Choose map pin');
  },
});

let wrapper: VueWrapper | undefined;
function render() {
  wrapper = mount(LocationPage, { global: { stubs: { ScreenHeader: true, MapCanvas: MapStub } } });
  return wrapper;
}
function confirm() {
  return wrapper!.findAll('button').find(button => button.text() === 'Confirm Location')!;
}
function gps() {
  return wrapper!.findAll('button').find(button => /Current Location|Finding your location/.test(button.text()))!;
}

beforeEach(async () => {
  vi.clearAllMocks();
  signInTestUser();
  const { draft, reset, initialize } = useRepairDraft();
  await initialize();
  reset();
  draft.serviceType = 'home';
});
afterEach(async () => {
  wrapper?.unmount();
  wrapper = undefined;
  await useRepairDraft().saveDraft();
});

describe('repair location selection', () => {
  test('requires a pin, then saves coordinates and the supplied street address', async () => {
    render();
    expect(confirm().attributes('disabled')).toBeDefined();
    await wrapper!.get('#service-address').setValue('Example building, Makati');
    expect(confirm().attributes('disabled')).toBeDefined();
    expect(mocks.locate).not.toHaveBeenCalled();
    await wrapper!.get('[data-testid="map-select"]').trigger('click');
    await confirm().trigger('click');
    const { draft } = useRepairDraft();
    expect(draft.coordinates).toEqual(point);
    expect(draft.location).toBe('Example building, Makati');
    await vi.waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/client/request/review'));
  });

  test('uses a coordinate label when no street address is supplied', async () => {
    render();
    await wrapper!.get('[data-testid="map-select"]').trigger('click');
    await confirm().trigger('click');
    expect(useRepairDraft().draft.location).toBe('Pinned location (14.55470, 121.02440)');
  });

  test('restores a previously confirmed pin and address', () => {
    const { draft } = useRepairDraft();
    draft.coordinates = point;
    draft.location = 'Saved address';
    render();
    expect(wrapper!.get('[data-testid="selected-coordinates"]').text()).toBe('14.55470, 121.02440');
    expect((wrapper!.get('#service-address').element as HTMLTextAreaElement).value).toBe('Saved address');
    expect(confirm().attributes('disabled')).toBeUndefined();
  });

  test('selects device coordinates and shows reported GPS accuracy', async () => {
    mocks.locate.mockResolvedValue({ lat: 14.5995, lng: 120.9842, accuracy: 30 });
    render();
    await gps().trigger('click');
    await flushPromises();
    expect(wrapper!.text()).toContain('14.59950, 120.98420');
    expect(wrapper!.text()).toContain('±30 m');
    expect(gps().attributes('disabled')).toBeUndefined();
  });

  test('shows GPS failures without preventing manual selection', async () => {
    mocks.locate.mockRejectedValue(new Error('Location permission was denied.'));
    render();
    await gps().trigger('click');
    await flushPromises();
    expect(wrapper!.get('[role="alert"]').text()).toContain('denied');
    await wrapper!.get('[data-testid="map-select"]').trigger('click');
    expect(wrapper!.find('[role="alert"]').exists()).toBe(false);
    expect(confirm().attributes('disabled')).toBeUndefined();
  });

  test('does not overwrite a manually chosen pin with a delayed GPS result', async () => {
    let resolveLocation!: (point: LocatedPoint) => void;
    mocks.locate.mockImplementation(() => new Promise<LocatedPoint>(resolve => { resolveLocation = resolve; }));
    render();
    await gps().trigger('click');
    await wrapper!.get('[data-testid="map-select"]').trigger('click');
    resolveLocation({ lat: 15, lng: 120, accuracy: 10 });
    await flushPromises();
    expect(wrapper!.get('[data-testid="selected-coordinates"]').text()).toBe('14.55470, 121.02440');
  });

  test('discards GPS results after leaving the cached Ionic page', async () => {
    let resolveLocation!: (point: LocatedPoint) => void;
    mocks.locate.mockImplementation(() => new Promise<LocatedPoint>(resolve => { resolveLocation = resolve; }));
    render();
    await gps().trigger('click');
    mocks.leave?.();
    resolveLocation({ lat: 15, lng: 120, accuracy: 10 });
    await flushPromises();
    expect(wrapper!.find('[data-testid="selected-coordinates"]').exists()).toBe(false);
  });
});
