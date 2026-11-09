<template>
  <div class="location-picker">
    <form class="location-picker__search" @submit.prevent="search">
      <label class="fx-label" :for="`${id}-search`">Search an address or landmark</label>
      <div class="location-picker__search-row">
        <input :id="`${id}-search`" v-model="query" class="fx-input" maxlength="500" placeholder="Street, barangay, city, or landmark" :disabled="disabled" @input="cancelPending" />
        <button class="fx-btn fx-btn-secondary" type="submit" :disabled="disabled || searching || query.trim().length < 3">{{ searching ? 'Searching…' : 'Search' }}</button>
      </div>
    </form>
    <p class="location-picker__hint">{{ SEARCH_ATTRIBUTION }}. The address is sent to the search provider only when you press Search.</p>
    <ul v-if="results.length" class="location-picker__results" aria-label="Address search results">
      <li v-for="result in results" :key="result.id"><button type="button" :disabled="disabled" @click="choose(result, result.label)">{{ result.label }}</button></li>
    </ul>
    <p v-if="searched && !searching && !results.length" class="location-picker__hint" role="status">No matching addresses. Try adding the city, use GPS, or select a map pin.</p>
    <p v-if="error" class="location-picker__error" role="alert">{{ error }}</p>

    <div class="location-picker__map">
      <MapCanvas ref="mapRef" height="360px" :label="label" :center="modelValue ?? fallbackCenter" :zoom="15" :markers="markers" :fit-markers="false" :selectable="!disabled" @select="choose($event)" />
    </div>
    <div class="location-picker__actions">
      <button class="fx-btn fx-btn-secondary fx-btn--sm" type="button" :disabled="disabled || locating" @click="locate">{{ locating ? 'Finding your location…' : 'Use My Current Location' }}</button>
      <button v-if="running" class="fx-btn fx-btn-secondary fx-btn--sm" type="button" @click="stopFollowing">Stop following GPS</button>
      <button class="fx-btn fx-btn-secondary fx-btn--sm" type="button" :disabled="disabled" @click="mapRef?.selectCenter()">Use map center</button>
    </div>
    <p class="location-picker__hint">Click the map or drag the pin to adjust it. Keyboard: focus the map, move with arrow keys, then press Enter.</p>
    <p class="location-picker__hint" role="status">{{ running ? 'Following device location while this map is open. Choosing a pin stops GPS updates.' : 'Manual location. Use your current location to resume GPS updates.' }}</p>
    <p v-if="gpsError" class="location-picker__error" role="alert">{{ gpsError }}</p>
    <div class="location-picker__selection" aria-live="polite">
      <p v-if="modelValue" data-testid="selected-coordinates">Selected: {{ formatCoordinates(modelValue) }}</p>
      <p v-else>No location selected. Search for an address, use GPS, or place a pin.</p>
      <p v-if="modelValue && address">{{ address }}</p>
      <p v-if="accuracy !== null">GPS accuracy: approximately ±{{ Math.round(accuracy) }} m. Adjust the pin if needed.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import MapCanvas from './MapCanvas.vue';
import { DEFAULT_MAP_CENTER } from '../data/map';
import type { GeoPoint, MapMarker } from '../types/map';
import { formatCoordinates, isGeoPoint } from '../utils/map';
import type { LocatedPoint } from '../services/geolocation';
import { useDeviceLocation } from '../composables/useDeviceLocation';
import { searchAddresses, SEARCH_ATTRIBUTION, type AddressResult } from '../services/geocoding';

const props = withDefaults(defineProps<{
  id: string;
  modelValue: GeoPoint | null;
  address?: string;
  label?: string;
  disabled?: boolean;
  active?: boolean;
  autoLocate?: boolean;
  extraMarkers?: MapMarker[];
  fallbackCenter?: GeoPoint;
}>(), {
  address: '', label: 'Choose a location', disabled: false, active: true, autoLocate: false,
  extraMarkers: () => [], fallbackCenter: () => ({ ...DEFAULT_MAP_CENTER }),
});
const emit = defineEmits<{ 'update:modelValue': [point: GeoPoint]; 'update:address': [address: string]; located: [point: LocatedPoint]; following: [following: boolean] }>();
const mapRef = ref<InstanceType<typeof MapCanvas> | null>(null);
const query = ref('');
const results = ref<AddressResult[]>([]);
const searching = ref(false);
const searched = ref(false);
const accuracy = ref<number | null>(null);
const error = ref('');
let operation = 0;
let controller: AbortController | undefined;
let hasGpsSelection = false;
const gps = useDeviceLocation(() => props.active && !props.disabled, props.autoLocate, point => {
  accuracy.value = point.accuracy;
  emit('update:modelValue', { lat: point.lat, lng: point.lng });
  if (!hasGpsSelection) emit('update:address', '');
  hasGpsSelection = true;
  emit('located', point);
});
const { locating, running, error: gpsError } = gps;
watch(running, value => emit('following', value), { immediate: true, flush: 'sync' });

function stopFollowing() { gps.stop(); hasGpsSelection = false; accuracy.value = null; }

const markers = computed<MapMarker[]>(() => [
  ...props.extraMarkers,
  ...(props.modelValue ? [{ ...props.modelValue, id: 'selected-location', kind: 'dest' as const, label: 'You', title: 'Your selected location', draggable: true }] : []),
]);

function cancelPending() {
  operation += 1;
  controller?.abort();
  controller = undefined;
  searching.value = false;
  searched.value = false;
  results.value = [];
  error.value = '';
}

function choose(point: GeoPoint, address = '') {
  if (props.disabled || !isGeoPoint(point)) return;
  cancelPending();
  stopFollowing();
  accuracy.value = null;
  emit('update:modelValue', { lat: point.lat, lng: point.lng });
  // A moved pin must not retain an unrelated search-result address.
  emit('update:address', address.slice(0, 500));
}

async function search() {
  if (props.disabled || searching.value) return;
  cancelPending();
  stopFollowing();
  const current = operation;
  controller = new AbortController();
  searching.value = true;
  try {
    const found = await searchAddresses(query.value, controller.signal);
    if (current !== operation) return;
    results.value = found;
    searched.value = true;
  } catch (cause) {
    if (current === operation) error.value = cause instanceof Error ? cause.message : 'Address search failed. Try a map pin instead.';
  } finally {
    if (current === operation) searching.value = false;
  }
}

function locate() {
  if (props.disabled || locating.value) return;
  cancelPending();
  hasGpsSelection = false;
  gps.start();
}

watch(() => props.disabled || !props.active, value => { if (value) cancelPending(); });
onBeforeUnmount(cancelPending);
defineExpose({ resize: () => mapRef.value?.resize(), cancelPending: () => { cancelPending(); gps.stop(); }, locate });
</script>

<style scoped>
.location-picker { display: flex; flex-direction: column; gap: 12px; }
.location-picker__search-row { display: flex; gap: 10px; }
.location-picker__search-row input { min-width: 0; flex: 1; }
.location-picker__map { border: 1px solid var(--hairline); border-radius: 14px; overflow: hidden; }
.location-picker__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.location-picker__hint { margin: 0; color: var(--text-muted); font-size: 12px; line-height: 1.6; }
.location-picker__selection { padding: 12px 14px; background: var(--primary-light); color: var(--primary-dark); border-radius: 12px; font-size: 13px; }
.location-picker__selection p { margin: 0; line-height: 1.6; overflow-wrap: anywhere; }
.location-picker__error { margin: 0; padding: 12px; border-radius: 10px; background: #fef2f2; color: #b91c1c; font-size: 13px; }
.location-picker__results { list-style: none; margin: 0; padding: 0; border: 1px solid var(--hairline); border-radius: 10px; overflow: hidden; }
.location-picker__results button { width: 100%; padding: 12px; text-align: left; font: inherit; font-size: 13px; color: var(--text-dark); background: var(--surface, #fff); border: 0; cursor: pointer; }
.location-picker__results li + li { border-top: 1px solid var(--hairline); }
.location-picker__results button:hover, .location-picker__results button:focus-visible { background: var(--primary-light); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 480px) { .location-picker__search-row { flex-direction: column; } }
</style>
