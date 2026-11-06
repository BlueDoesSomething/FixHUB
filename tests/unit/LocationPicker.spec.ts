import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { LocatedPoint } from '@/services/geolocation';

const mocks = vi.hoisted(() => ({ locate: vi.fn(), search: vi.fn() }));
vi.mock('@/services/geolocation', () => ({ getCurrentLocation: mocks.locate }));
vi.mock('@/services/geocoding', () => ({ searchAddresses: mocks.search, SEARCH_ATTRIBUTION: 'Test search provider' }));
import LocationPicker from '@/components/LocationPicker.vue';

const pin = { lat: 14.55, lng: 121.02 };
const MapStub = defineComponent({
  emits: ['select'],
  setup(_, { emit, expose }) {
    expose({ resize: vi.fn(), selectCenter: () => emit('select', pin) });
    return () => h('button', { 'data-testid': 'map-pin', onClick: () => emit('select', pin) }, 'Choose pin');
  },
});
const Harness = defineComponent({
  components: { LocationPicker },
  setup: () => ({ point: ref(null), address: ref('') }),
  template: '<LocationPicker id="test-location" v-model="point" v-model:address="address" />',
});
let wrapper: VueWrapper;
const button = (text: string) => wrapper.findAll('button').find(item => item.text() === text)!;
function render() { wrapper = mount(Harness, { global: { stubs: { MapCanvas: MapStub } } }); }

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { wrapper?.unmount(); });

describe('address and GPS location picker', () => {
  test('does not request GPS or search automatically and requires choosing a search result', async () => {
    mocks.search.mockResolvedValue([{ ...pin, id: 'one', label: 'Example shop, Makati' }]);
    render();
    expect(mocks.locate).not.toHaveBeenCalled();
    await wrapper.get('input').setValue('Makati');
    expect(mocks.search).not.toHaveBeenCalled();
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('[data-testid="selected-coordinates"]').exists()).toBe(false);
    await button('Example shop, Makati').trigger('click');
    expect(wrapper.text()).toContain('14.55000, 121.02000');
    expect(wrapper.findComponent(LocationPicker).props('address')).toBe('Example shop, Makati');
    await wrapper.get('[data-testid="map-pin"]').trigger('click');
    expect(wrapper.findComponent(LocationPicker).props('address')).toBe('');
  });

  test('handles no results and unavailable search without losing manual selection', async () => {
    mocks.search.mockResolvedValue([]);
    render();
    await wrapper.get('input').setValue('Missing address');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('No matching addresses');
    mocks.search.mockRejectedValue(new Error('Address search is unavailable.'));
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('unavailable');
    await wrapper.get('[data-testid="map-pin"]').trigger('click');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('14.55000, 121.02000');
  });

  test('uses GPS with accuracy and lets permission-denied users place a pin', async () => {
    mocks.locate.mockResolvedValue({ lat: 15, lng: 120, accuracy: 24 });
    render();
    await button('Use My Current Location').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('15.00000, 120.00000');
    expect(wrapper.text()).toContain('±24 m');
    mocks.locate.mockRejectedValue(new Error('Location permission was denied.'));
    await button('Use My Current Location').trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('denied');
    await wrapper.get('[data-testid="map-pin"]').trigger('click');
    expect(wrapper.text()).not.toContain('±24 m');
  });

  test('ignores late GPS and search responses after manual selection or page exit', async () => {
    let resolveGps!: (point: LocatedPoint) => void;
    mocks.locate.mockImplementation(() => new Promise(resolve => { resolveGps = resolve; }));
    render();
    await button('Use My Current Location').trigger('click');
    await wrapper.get('[data-testid="map-pin"]').trigger('click');
    resolveGps({ lat: 15, lng: 120, accuracy: 10 });
    await flushPromises();
    expect(wrapper.text()).toContain('14.55000, 121.02000');
    let resolveSearch!: (results: unknown[]) => void;
    mocks.search.mockImplementation(() => new Promise(resolve => { resolveSearch = resolve; }));
    await wrapper.get('input').setValue('Makati');
    await wrapper.get('form').trigger('submit');
    const picker = wrapper.findComponent(LocationPicker);
    (picker.vm as unknown as { cancelPending: () => void }).cancelPending();
    resolveSearch([{ ...pin, id: 'late', label: 'Late result' }]);
    await flushPromises();
    expect(wrapper.text()).not.toContain('Late result');
  });
});
