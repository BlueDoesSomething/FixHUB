import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import type { MapMarker } from '@/types/map';

const leaflet = vi.hoisted(() => {
  const handlers: Record<string, (...args: any[]) => void> = {};
  const tileHandlers: Record<string, () => void> = {};
  const pins: { on: ReturnType<typeof vi.fn>; getLatLng: ReturnType<typeof vi.fn>; handlers: Record<string, () => void> }[] = [];
  const map = {
    setView: vi.fn().mockReturnThis(), fitBounds: vi.fn(), invalidateSize: vi.fn(),
    on: vi.fn((name: string, handler: (...args: any[]) => void) => { handlers[name] = handler; }),
    getCenter: vi.fn(() => ({ lat: 14.55, lng: 121.02 })), off: vi.fn(), remove: vi.fn(),
    getSize: vi.fn(() => ({ x: 500, y: 400 })),
  };
  const tiles = {
    addTo: vi.fn().mockReturnThis(), off: vi.fn(), redraw: vi.fn(),
    on: vi.fn((name: string, handler: () => void) => { tileHandlers[name] = handler; }),
  };
  const layers = { addTo: vi.fn().mockReturnThis(), clearLayers: vi.fn() };
  return {
    handlers, tileHandlers, pins, map, tiles, layers,
    createMap: vi.fn(() => map), tileLayer: vi.fn(() => tiles),
    layerGroup: vi.fn(() => layers), zoom: vi.fn(() => ({ addTo: vi.fn() })),
    latLngBounds: vi.fn(points => points), divIcon: vi.fn(options => options),
    polyline: vi.fn(() => ({ addTo: vi.fn() })),
    marker: vi.fn(() => {
      const pin = {
        addTo: vi.fn().mockReturnThis(), bindTooltip: vi.fn().mockReturnThis(),
        getLatLng: vi.fn(() => ({ lat: 14.56, lng: 121.03 })),
        handlers: {} as Record<string, () => void>,
        on: vi.fn((name: string, handler: () => void) => { pin.handlers[name] = handler; }),
      };
      pins.push(pin);
      return pin;
    }),
  };
});

vi.mock('leaflet', () => ({
  map: leaflet.createMap, tileLayer: leaflet.tileLayer, layerGroup: leaflet.layerGroup,
  control: { zoom: leaflet.zoom }, latLngBounds: leaflet.latLngBounds,
  marker: leaflet.marker, divIcon: leaflet.divIcon, polyline: leaflet.polyline,
}));

import MapCanvas from '@/components/MapCanvas.vue';

let wrapper: VueWrapper | undefined;
const disconnect = vi.fn();
const selected: MapMarker = { id: 'customer', lat: 14.5547, lng: 121.0244, kind: 'dest', title: 'Selected location', draggable: true };

beforeEach(() => {
  vi.clearAllMocks();
  leaflet.pins.length = 0;
  vi.stubEnv('VITE_MAP_TILE_URL', '');
  vi.stubEnv('VITE_MAP_TILE_ATTRIBUTION', '');
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); disconnect = disconnect; });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Leaflet map component', () => {
  test('loads real map tiles with attribution and geographic markers', async () => {
    wrapper = mount(MapCanvas, { props: { markers: [selected] } });
    await nextTick();
    expect(leaflet.tileLayer).toHaveBeenCalledWith('https://tile.openstreetmap.org/{z}/{x}/{y}.png', expect.objectContaining({ attribution: expect.stringContaining('OpenStreetMap') }));
    expect(leaflet.marker).toHaveBeenCalledWith([14.5547, 121.0244], expect.objectContaining({ draggable: false }));
    expect(leaflet.map.fitBounds).toHaveBeenCalled();
  });

  test('emits map clicks only when location selection is enabled', async () => {
    wrapper = mount(MapCanvas);
    await nextTick();
    leaflet.handlers.click({ latlng: { lat: 14.6, lng: 121.1 } });
    expect(wrapper.emitted('select')).toBeUndefined();
    await wrapper.setProps({ selectable: true });
    leaflet.handlers.click({ latlng: { lat: 14.6, lng: 121.1 } });
    expect(wrapper.emitted('select')?.[0]).toEqual([{ lat: 14.6, lng: 121.1 }]);
    await wrapper.get('[role="region"]').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('select')?.[1]).toEqual([{ lat: 14.55, lng: 121.02 }]);
  });

  test('emits the updated position after dragging a selectable marker', async () => {
    wrapper = mount(MapCanvas, { props: { selectable: true, markers: [selected], fitMarkers: false } });
    await nextTick();
    expect(leaflet.marker).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ draggable: true }));
    leaflet.pins[0].handlers.dragend();
    expect(wrapper.emitted('select')?.[0]).toEqual([{ lat: 14.56, lng: 121.03 }]);
    expect(leaflet.map.fitBounds).not.toHaveBeenCalled();
  });

  test('normalizes longitudes when selecting a repeated world copy', async () => {
    wrapper = mount(MapCanvas, { props: { selectable: true } });
    await nextTick();
    leaflet.handlers.click({ latlng: { lat: 14.6, lng: 481 } });
    expect(wrapper.emitted('select')?.[0]).toEqual([{ lat: 14.6, lng: 121 }]);
  });

  test('updates geographic routes and markers reactively', async () => {
    wrapper = mount(MapCanvas, { props: { markers: [selected] } });
    await wrapper.setProps({
      markers: [{ ...selected, lat: 14.6 }],
      route: [{ lat: 14.6, lng: 121.02 }, { lat: 14.7, lng: 121.03 }],
    });
    expect(leaflet.layers.clearLayers).toHaveBeenCalledTimes(2);
    expect(leaflet.polyline).toHaveBeenCalledWith([[14.6, 121.02], [14.7, 121.03]], expect.objectContaining({ dashArray: '8 8' }));
    expect(leaflet.marker).toHaveBeenLastCalledWith([14.6, 121.0244], expect.any(Object));
  });

  test('shows tile failures and supports retry', async () => {
    wrapper = mount(MapCanvas);
    await nextTick();
    leaflet.tileHandlers.tileerror();
    await nextTick();
    expect(wrapper.get('[role="status"]').text()).toContain('could not load');
    await wrapper.get('button').trigger('click');
    expect(leaflet.tiles.redraw).toHaveBeenCalledOnce();
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  test('treats marker labels as text rather than executable HTML', async () => {
    wrapper = mount(MapCanvas, { props: { markers: [{ ...selected, label: '<img src=x onerror=alert(1)>' }] } });
    await nextTick();
    const element = leaflet.divIcon.mock.calls[0][0].html as HTMLElement;
    expect(element.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(element.querySelector('img')).toBeNull();
  });

  test('requires attribution when configuring a different tile provider', async () => {
    vi.stubEnv('VITE_MAP_TILE_URL', 'https://tiles.example.test/{z}/{x}/{y}.png');
    wrapper = mount(MapCanvas);
    await nextTick();
    expect(wrapper.get('[role="status"]').text()).toContain('VITE_MAP_TILE_ATTRIBUTION');
    expect(leaflet.createMap).not.toHaveBeenCalled();
  });

  test('releases map listeners, observers and animation frames on unmount', async () => {
    wrapper = mount(MapCanvas);
    await nextTick();
    wrapper.unmount();
    wrapper = undefined;
    expect(disconnect).toHaveBeenCalledOnce();
    expect(leaflet.tiles.off).toHaveBeenCalledOnce();
    expect(leaflet.map.off).toHaveBeenCalledOnce();
    expect(leaflet.map.remove).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
