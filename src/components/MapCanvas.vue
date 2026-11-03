<template>
  <div class="map" :style="{ height }">
    <div
      ref="container"
      class="map__canvas"
      role="region"
      :aria-label="label"
      tabindex="0"
      @keydown.enter.self.prevent="selectCenter"
    />
    <div v-if="error" class="map__notice" role="status">
      <span>{{ error }}</span>
      <button v-if="tiles" type="button" @click="retryTiles">Retry</button>
    </div>
    <div v-if="$slots.default" class="map__overlay"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoPoint, MapMarker } from '../types/map';
import { DEFAULT_MAP_CENTER } from '../data/map';
import { isGeoPoint } from '../utils/map';

const props = withDefaults(defineProps<{
  height?: string;
  label?: string;
  center?: GeoPoint;
  zoom?: number;
  markers?: MapMarker[];
  route?: GeoPoint[];
  selectable?: boolean;
  fitMarkers?: boolean;
  paddingTop?: number;
  paddingBottom?: number;
}>(), {
  height: '360px',
  label: 'Interactive map',
  center: () => ({ ...DEFAULT_MAP_CENTER }),
  zoom: 14,
  markers: () => [],
  route: () => [],
  selectable: false,
  fitMarkers: true,
  paddingTop: 24,
  paddingBottom: 32,
});

const emit = defineEmits<{ select: [point: GeoPoint] }>();
const container = ref<HTMLDivElement | null>(null);
const error = ref('');
let map: L.Map | undefined;
let tiles: L.TileLayer | undefined;
let features: L.LayerGroup | undefined;
let observer: ResizeObserver | undefined;
let resizeFrame: number | undefined;

function position(point: GeoPoint): L.LatLngTuple {
  return [point.lat, point.lng];
}

function icon(marker: MapMarker): L.DivIcon {
  // Use DOM text rather than interpolated HTML for user-visible labels.
  const pin = document.createElement('span');
  pin.className = `fh-map-marker${marker.kind === 'pulse' ? ' fh-map-marker--pulse' : ''}`;
  const fallback = marker.kind === 'dest' ? '#ef4444' : '#146344';
  const color = marker.color && /^(#[\da-f]{3}|#[\da-f]{6}|#[\da-f]{8})$/i.test(marker.color)
    ? marker.color : fallback;
  pin.style.setProperty('--pin-color', color);
  pin.textContent = marker.label ?? (marker.kind === 'dest' ? '●' : 'T');
  return L.divIcon({ html: pin, className: 'fh-map-icon', iconSize: [36, 46], iconAnchor: [18, 46], tooltipAnchor: [0, -42] });
}

function fitFeatures() {
  if (!map || !props.fitMarkers) return;
  const size = map.getSize();
  // Do not zoom a cached Ionic page while its container is hidden.
  if (size.x <= 0 || size.y <= 0) return;
  const points = [...props.markers, ...props.route].filter(isGeoPoint).map(position);
  if (!points.length) return;
  map.fitBounds(L.latLngBounds(points), {
    paddingTopLeft: [24, props.paddingTop],
    paddingBottomRight: [60, props.paddingBottom],
    maxZoom: 16,
    animate: false,
  });
}

function drawFeatures() {
  if (!map || !features) return;
  features.clearLayers();
  const points = props.route.filter(isGeoPoint).map(position);
  if (points.length > 1) {
    // A supplied polyline is illustrative, not automatically a driving route.
    L.polyline(points, { color: '#146344', weight: 4, opacity: 0.75, dashArray: '8 8' }).addTo(features);
  }
  for (const item of props.markers.filter(isGeoPoint)) {
    const marker = L.marker(position(item), {
      icon: icon(item),
      title: item.title ?? item.label ?? (item.kind === 'dest' ? 'Selected location' : 'Technician'),
      draggable: props.selectable && Boolean(item.draggable),
    });
    if (item.title) {
      const tooltip = document.createElement('span');
      tooltip.textContent = item.title;
      marker.bindTooltip(tooltip);
    }
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      emitSelection({ lat, lng });
    });
    marker.addTo(features);
  }
  fitFeatures();
}

function resize() {
  map?.invalidateSize({ pan: false });
  fitFeatures();
}

function scheduleResize() {
  if (!map) return;
  if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => { resizeFrame = undefined; resize(); });
}

function selectCenter() {
  if (!map || !props.selectable) return;
  const { lat, lng } = map.getCenter();
  emitSelection({ lat, lng });
}

function emitSelection(point: GeoPoint) {
  // Leaflet permits panning through repeated world copies; save canonical GPS.
  const lng = point.lng < -180 || point.lng > 180
    ? ((point.lng + 180) % 360 + 360) % 360 - 180 : point.lng;
  const normalized = { lat: point.lat, lng };
  if (props.selectable && isGeoPoint(normalized)) emit('select', normalized);
}

function retryTiles() {
  error.value = '';
  tiles?.redraw();
}

onMounted(async () => {
  if (!container.value) return;
  const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = import.meta.env.VITE_MAP_TILE_ATTRIBUTION
    || '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
  if (import.meta.env.VITE_MAP_TILE_URL && !import.meta.env.VITE_MAP_TILE_ATTRIBUTION) {
    error.value = 'The custom map provider needs VITE_MAP_TILE_ATTRIBUTION configured.';
    return;
  }

  try {
    map = L.map(container.value, { zoomControl: false, scrollWheelZoom: false, trackResize: false })
      .setView(position(isGeoPoint(props.center) ? props.center : DEFAULT_MAP_CENTER), props.zoom);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    tiles = L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);
    tiles.on('tileerror', () => { error.value = 'Some map tiles could not load. Check your connection or retry.'; });
    tiles.on('loading', () => { error.value = ''; });
    features = L.layerGroup().addTo(map);
    map.on('click', (event: L.LeafletMouseEvent) => {
      emitSelection({ lat: event.latlng.lat, lng: event.latlng.lng });
    });
    drawFeatures();
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleResize);
      observer.observe(container.value);
    }
    window.addEventListener('resize', scheduleResize);
    await nextTick();
    scheduleResize();
  } catch {
    error.value = 'The map could not be initialized. Refresh this page to try again.';
  }
});

watch(() => [props.markers, props.route, props.selectable, props.fitMarkers], drawFeatures, { deep: true });
watch(() => [props.center, props.zoom], () => {
  if (isGeoPoint(props.center)) map?.setView(position(props.center), props.zoom);
}, { deep: true });
onActivated(scheduleResize);
onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener('resize', scheduleResize);
  if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame);
  tiles?.off();
  map?.off();
  map?.remove();
  map = undefined;
});

// Ionic caches routed pages; pages call resize again after their enter transition.
defineExpose({ resize, selectCenter });
</script>

<style scoped>
.map { position: relative; width: 100%; background: #eaf3ee; isolation: isolate; }
.map__canvas { width: 100%; height: 100%; z-index: 0; font-family: inherit; }
.map__canvas:focus-visible { outline: 3px solid var(--accent, #f79d1f); outline-offset: -3px; }
.map__overlay { position: absolute; inset: 0; z-index: 500; pointer-events: none; }
.map__overlay > :deep(*) { pointer-events: auto; }
.map__notice { position: absolute; z-index: 600; bottom: 30px; left: 10px; right: 60px; padding: 10px 12px; border-radius: 10px; background: #fff; box-shadow: 0 2px 10px #0002; color: #9a3412; font-size: 12px; display: flex; align-items: center; gap: 10px; }
.map__notice button { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 6px 10px; cursor: pointer; color: #9a3412; }
.map :deep(.leaflet-control-attribution) { color: #334155; background: #fffffff0; font-size: 10px; }
.map :deep(.leaflet-control-attribution a) { color: #146344; }
.map :deep(.fh-map-icon) { background: none; border: 0; }
.map :deep(.fh-map-marker) { position: relative; display: flex; justify-content: center; align-items: center; width: 36px; height: 36px; border: 2px solid white; border-radius: 50%; background: var(--pin-color); color: #fff; font-family: inherit; font-size: 11px; font-weight: 700; line-height: 1; box-shadow: 0 2px 8px #0004; }
.map :deep(.fh-map-marker::after) { content: ''; position: absolute; top: 31px; left: 9px; border: 7px solid transparent; border-top: 11px solid var(--pin-color); }
.map :deep(.fh-map-marker--pulse::before) { content: ''; position: absolute; inset: -8px; border: 3px solid var(--pin-color); border-radius: 50%; animation: pin-pulse 2s ease-out infinite; pointer-events: none; }
@keyframes pin-pulse { from { transform: scale(0.8); opacity: 0.6; } to { transform: scale(1.4); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .map :deep(.fh-map-marker--pulse::before) { animation: none; } }
</style>
