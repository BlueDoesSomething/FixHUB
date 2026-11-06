<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="fx-page">
        <section class="fx-hero">
          <div class="fx-hero-body matching-hero">
            <h3 class="matching-hero__title">Find a Technician</h3>
            <p class="matching-hero__sub">Locate nearby repair professionals and get directions to their shared service location.</p>
            <div class="factors">
              <span>📍 Distance</span>
              <span>🔧 Specialties</span>
              <span>🗺️ Shared locations</span>
              <span>↗ Directions</span>
            </div>
          </div>
        </section>

        <section class="fx-card nearby-picker">
          <h2 class="fx-section-title">Your starting point</h2>
          <p class="fx-page__sub">Search an address, select a pin, or use GPS to find technicians near you. Your starting point is not published.</p>
          <LocationPicker v-if="userId" :key="userId" ref="picker" id="nearby-location" v-model="point" v-model:address="address" label="Find technicians near your selected location" :extra-markers="markers" :fallback-center="fallbackCenter" />
        </section>

        <div class="nearby-heading">
          <h2 class="fx-section-title fx-section-title--lg">{{ point ? 'Nearby technicians' : 'Shared technician locations' }}</h2>
          <div class="nearby-controls">
            <label for="nearby-radius">Search radius</label>
            <select id="nearby-radius" v-model.number="radius" class="fx-input" :disabled="!point">
              <option v-for="km in [5, 10, 25, 50, 100]" :key="km" :value="km">{{ km }} km</option>
            </select>
            <button class="fx-btn fx-btn-secondary fx-btn--sm" type="button" :disabled="loading" @click="load">Refresh</button>
          </div>
        </div>
        <p v-if="error" class="nearby-error" role="alert">{{ error }}</p>
        <p v-if="loading" role="status">Loading technician locations…</p>
        <template v-else-if="!error">
          <p v-if="!point" class="fx-page__sub nearby-note">Set a starting point above to filter by distance. Only explicitly shared locations from active, approved technicians appear.</p>
          <p v-if="!nearby.length" class="fx-card" role="status">{{ point ? 'No technicians have shared a location within this radius. Try a larger radius or another starting point.' : 'No technicians have shared a service location yet.' }}</p>
          <div v-else class="fx-grid-2">
            <article v-for="tech in nearby" :key="tech.id" class="fx-card nearby-technician" data-testid="nearby-technician">
              <div class="nearby-technician__head"><h3>{{ tech.full_name }}</h3><strong v-if="tech.distance !== null">{{ tech.distance.toFixed(1) }} km away</strong></div>
              <p>{{ tech.specializations.join(' · ') }}</p>
              <p>{{ tech.service_type === 'both' ? 'Home service & drop-off' : tech.service_type === 'home' ? 'Home service' : 'Drop-off' }}</p>
              <p>{{ tech.address }}</p>
              <p class="nearby-note">Location updated {{ new Date(tech.updated_at).toLocaleString() }}. This is a saved location, not live tracking.</p>
              <a class="fx-btn fx-btn-secondary fx-btn--sm" :href="directions(tech)" target="_blank" rel="noopener noreferrer">Get directions ↗</a>
            </article>
          </div>
          <p v-if="point && nearby.length" class="nearby-note">Distances are straight-line estimates, not driving distances. Directions open in Google Maps.</p>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { IonPage, IonContent, onIonViewWillEnter, onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue';
import LocationPicker from '../../components/LocationPicker.vue';
import { useAuth } from '../../stores/auth';
import { listLocatedTechnicians, type LocatedTechnician } from '../../services/technicianLocations';
import type { GeoPoint, MapMarker } from '../../types/map';
import { DEFAULT_MAP_CENTER } from '../../data/map';
import { distanceKm } from '../../utils/map';

const { state: authState } = useAuth();
const userId = computed(() => authState.session?.userId);
const picker = ref<InstanceType<typeof LocationPicker> | null>(null);
const point = ref<GeoPoint | null>(null);
const address = ref('');
const radius = ref(25);
const technicians = ref<LocatedTechnician[]>([]);
const loading = ref(false);
const error = ref('');
let operation = 0;

const nearby = computed(() => technicians.value.map(tech => ({ ...tech,
  distance: point.value ? distanceKm(point.value, { lat: tech.latitude, lng: tech.longitude }) : null,
})).filter(tech => tech.distance === null || tech.distance <= radius.value)
  .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)));
const markers = computed<MapMarker[]>(() => nearby.value.map(tech => ({
  id: tech.id, lat: tech.latitude, lng: tech.longitude, title: tech.full_name, kind: 'tech',
})));
const fallbackCenter = computed(() => technicians.value[0]
  ? { lat: technicians.value[0].latitude, lng: technicians.value[0].longitude } : DEFAULT_MAP_CENTER);

function directions(tech: LocatedTechnician) {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', `${tech.latitude},${tech.longitude}`);
  if (point.value) url.searchParams.set('origin', `${point.value.lat},${point.value.lng}`);
  return url.toString();
}

async function load() {
  if (!userId.value || loading.value) return;
  const current = ++operation;
  loading.value = true;
  error.value = '';
  technicians.value = [];
  try {
    const data = await listLocatedTechnicians();
    if (current === operation) technicians.value = data;
  } catch (cause) {
    if (current === operation) error.value = cause instanceof Error ? cause.message : 'Technician locations could not be loaded.';
  } finally {
    if (current === operation) loading.value = false;
  }
}

watch(userId, () => {
  operation += 1;
  technicians.value = [];
  point.value = null;
  address.value = '';
  error.value = '';
  loading.value = false;
  void load();
}, { immediate: true });
onIonViewWillEnter(load);
onIonViewDidEnter(() => picker.value?.resize());
onIonViewDidLeave(() => picker.value?.cancelPending());
onBeforeUnmount(() => { operation += 1; });
</script>

<style scoped>
.matching-hero { text-align: center; }
.nearby-picker { margin-bottom: 28px; }
.nearby-picker > p { margin-bottom: 16px; }
.nearby-heading, .nearby-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.nearby-heading { justify-content: space-between; margin-bottom: 16px; }
.nearby-heading h2 { margin: 0; }
.nearby-controls { font-size: 13px; color: var(--text-muted); }
.nearby-controls select { width: auto; }
.nearby-technician { display: flex; flex-direction: column; gap: 10px; }
.nearby-technician__head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.nearby-technician h3 { font-size: 17px; margin: 0; }
.nearby-technician p { margin: 0; font-size: 13px; overflow-wrap: anywhere; }
.nearby-technician strong { font-size: 13px; color: var(--primary); }
.nearby-technician a { align-self: start; margin-top: auto; }
.nearby-note { color: var(--text-muted); font-size: 12px; line-height: 1.6; margin: 12px 0; }
.nearby-error { padding: 12px; border-radius: 10px; background: #fef2f2; color: #b91c1c; }
.spinner { width: 56px; height: 56px; margin: 0 auto 14px; position: relative; }
.spinner::before, .spinner::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.25);
}
.spinner::after { border-top-color: #fff; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.matching-hero__title { font-size: 22px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.3px; }
.matching-hero__sub { font-size: 14px; opacity: 0.88; margin: 0; }
.factors { display: flex; justify-content: center; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
.factors span {
  padding: 7px 14px; background: rgba(255, 255, 255, 0.18); border-radius: 999px;
  font-size: 13px; font-weight: 600;
}
</style>
