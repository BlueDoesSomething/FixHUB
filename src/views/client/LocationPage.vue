<template>
  <ion-page>
    <ScreenHeader :title="isHome ? 'Set Location' : 'Find Technicians'" default-href="/client/request" />
    <ion-content>
      <div class="fx-page">
        <RepairSteps :step="2" />
        <RepairSaveStatus show-save-status />
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">{{ isHome ? 'Choose your service location' : 'Choose your starting location' }}</h1>
            <p class="fx-page__sub">Click the map, drag your pin, or use your device location.</p>
          </div>
          <button class="fx-btn fx-btn-secondary" type="button" :disabled="locating || !repairState.ready" @click="locate">
            {{ locating ? 'Finding your location…' : 'Use My Current Location' }}
          </button>
        </div>

        <p v-if="locationError" class="location-error" role="alert">{{ locationError }}</p>
        <p class="address-hint" role="status">{{ running ? 'Following your device location. Choose a pin to stop automatic updates.' : 'Allow device location or select a pin manually.' }} Your location is not published to the technician directory.</p>
        <button v-if="running" class="fx-btn fx-btn-secondary fx-btn--sm" type="button" @click="gps.stop">Stop following GPS</button>

        <div class="fx-split location-layout">
          <div>
            <p v-if="!repairState.ready" role="status">Loading your saved location…</p>
            <div v-else class="location-map">
              <MapCanvas
                ref="mapRef"
                height="400px"
                label="Select your repair service location"
                :center="center"
                :zoom="15"
                :markers="markers"
                :fit-markers="false"
                selectable
                @select="selectLocation"
              />
            </div>
            <div class="map-help">
              <p>Use + / − to zoom. You can also focus the map, use the arrow keys to move, and press Enter to place a pin.</p>
              <button class="fx-btn fx-btn-secondary fx-btn--sm" type="button" @click="mapRef?.selectCenter()">Use map center</button>
            </div>
          </div>

          <aside class="fx-card location-details">
            <h2 class="fx-section-title">{{ isHome ? 'Service address' : 'Your starting point' }}</h2>
            <div class="location-selection" aria-live="polite">
              <template v-if="selected">
                <strong>Location selected</strong>
                <p data-testid="selected-coordinates">{{ formatCoordinates(selected) }}</p>
                <p v-if="accuracy !== null" class="location-accuracy">GPS accuracy: approximately ±{{ Math.round(accuracy) }} m. Adjust the pin if needed.</p>
              </template>
              <p v-else>No location selected yet. Place a pin before continuing.</p>
            </div>

            <label class="fx-label" for="service-address">Street address or landmark (optional)</label>
            <textarea
              id="service-address"
              v-model="address"
              class="fx-input"
              rows="3"
              maxlength="500"
              placeholder="Building, street, barangay, city, or nearby landmark"
            />
            <p class="address-hint">This helps the technician find you. Typing an address does not move the pin or search the map.</p>

            <button class="fx-btn fx-btn-primary fx-btn--block" type="button" :disabled="!selected || confirming || !repairState.ready" @click="confirmLocation">
              {{ confirming ? 'Saving location…' : isHome ? 'Confirm Location' : 'Confirm Starting Point' }}
            </button>
            <p class="address-hint">Next: review your device details, photos, and selected location before submitting.</p>
            <button class="fx-btn fx-btn-secondary fx-btn--block" type="button" :disabled="confirming" @click="router.push('/client/request')">Edit Device Details</button>
          </aside>
        </div>
        <NearbyTechnicians v-if="repairState.ready" :key="draft.id" id="request-nearby" :point="selected" :active="active" :device="draft.device" :service-type="draft.serviceType" @markers="technicianMarkers = $event" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, onIonViewDidEnter, onIonViewDidLeave, onIonViewWillEnter } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import RepairSteps from '../../components/repair/RepairSteps.vue';
import RepairSaveStatus from '../../components/repair/RepairSaveStatus.vue';
import MapCanvas from '../../components/MapCanvas.vue';
import NearbyTechnicians from '../../components/NearbyTechnicians.vue';
import type { GeoPoint, MapMarker } from '../../types/map';
import { DEFAULT_MAP_CENTER } from '../../data/map';
import { useRepairDraft } from '../../stores/repair';
import { useDeviceLocation } from '../../composables/useDeviceLocation';
import { formatCoordinates, isGeoPoint } from '../../utils/map';

const router = useRouter();
const { draft, state: repairState, initialize, saveDraft } = useRepairDraft();
const mapRef = ref<InstanceType<typeof MapCanvas> | null>(null);
const isHome = computed(() => draft.serviceType === 'home');
const selected = ref<GeoPoint | null>(draft.coordinates ? { ...draft.coordinates } : null);
const address = ref(draft.coordinates ? draft.location : '');
const center = computed(() => selected.value ?? DEFAULT_MAP_CENTER);
const accuracy = ref<number | null>(null);
const confirming = ref(false);
const active = ref(true);
const technicianMarkers = ref<MapMarker[]>([]);
const gps = useDeviceLocation(() => active.value && repairState.ready && !confirming.value, !draft.coordinates, point => {
  selected.value = { lat: point.lat, lng: point.lng };
  accuracy.value = point.accuracy;
});
const { locating, running, error: locationError } = gps;

const markers = computed<MapMarker[]>(() => {
  const points: MapMarker[] = [...technicianMarkers.value];
  if (selected.value) {
    points.push({ ...selected.value, id: 'selected', kind: 'dest', label: 'You', title: 'Your selected location', draggable: true });
  }
  return points;
});

function selectLocation(point: GeoPoint) {
  if (!isGeoPoint(point)) return;
  // Discard a pending GPS response if the user chooses a pin manually instead.
  gps.stop();
  accuracy.value = null;
  selected.value = { ...point };
}

function locate() { address.value = ''; gps.start(); }

async function confirmLocation() {
  if (!selected.value || !isGeoPoint(selected.value) || confirming.value) return;
  confirming.value = true;
  gps.stop();
  draft.coordinates = { ...selected.value };
  draft.location = address.value.trim() || `Pinned location (${formatCoordinates(selected.value)})`;
  try { await saveDraft(); await router.push('/client/request/review'); }
  catch { /* The shared notice keeps storage errors visible and preserves the pin. */ }
  finally { confirming.value = false; }
}

function cancelLocationRequest() {
  active.value = false;
}

async function restoreLocation() {
  await initialize();
  if (!selected.value && draft.coordinates) {
    gps.stop();
    selected.value = { ...draft.coordinates };
    address.value = draft.location;
  }
}

watch(() => draft.id, () => {
  selected.value = draft.coordinates ? { ...draft.coordinates } : null;
  address.value = draft.coordinates ? draft.location : '';
  gps.stop();
  technicianMarkers.value = [];
  if (!draft.coordinates) gps.start();
});
onMounted(restoreLocation);
onIonViewWillEnter(() => { active.value = true; void restoreLocation(); });
onIonViewDidEnter(() => mapRef.value?.resize());
onIonViewDidLeave(cancelLocationRequest);
onBeforeUnmount(cancelLocationRequest);
</script>

<style scoped>
.location-layout { align-items: start; }
.location-map { overflow: hidden; border: 1px solid var(--hairline); border-radius: 16px; box-shadow: var(--shadow-sm); }
.location-details { display: flex; flex-direction: column; gap: 12px; }
.location-details h2 { margin-bottom: 0; }
.location-selection { padding: 14px; border-radius: 12px; background: var(--primary-light); color: var(--primary-dark); font-size: 14px; }
.location-selection p { margin: 4px 0 0; overflow-wrap: anywhere; }
.location-selection .location-accuracy { font-size: 12px; margin-top: 8px; }
.location-details label { margin: 0; }
.address-hint, .map-help p { font-size: 12px; color: var(--text-muted); line-height: 1.6; margin: 0; }
.map-help { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 12px; }
.map-help p { flex: 1; min-width: 180px; }
.map-help button { flex-shrink: 0; }
.location-error { padding: 12px 16px; margin: 0 0 16px; border-radius: 12px; background: #fef2f2; color: #b91c1c; font-size: 14px; }
button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
@media (max-width: 1100px) { .location-layout { grid-template-columns: 1fr; } }
</style>
