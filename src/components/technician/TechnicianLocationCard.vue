<template>
  <section class="fx-card technician-location" aria-labelledby="technician-location-title">
    <div class="technician-location__head">
      <div>
        <h2 id="technician-location-title" class="fx-section-title fx-section-title--lg">Your service location</h2>
        <p class="fx-page__sub">Help nearby customers find you. Choose your shop or service base, then save to share it.</p>
      </div>
      <span class="fx-badge" :class="saved?.is_shared && !loadError ? 'fx-badge--green' : ''">{{ loading ? 'Checking location…' : loadError ? 'Status unavailable' : saved?.is_shared ? 'Location shared' : 'Not shared' }}</span>
    </div>

    <p v-if="loading" role="status">Loading your saved location…</p>
    <div v-if="loadError" class="technician-location__error" role="alert">{{ loadError }} <button type="button" class="fx-btn fx-btn-secondary fx-btn--sm" @click="refresh">Retry</button></div>
    <LocationPicker ref="picker" id="technician-location" v-model="point" v-model:address="address" label="Set your technician service location" :disabled="loading || !!busy || !!loadError" />
    <div>
      <label class="fx-label" for="technician-address">Service address or landmark (optional)</label>
      <input id="technician-address" v-model="address" class="fx-input" maxlength="500" :disabled="loading || !!busy || !!loadError" placeholder="Shop, building, street, or nearby landmark" />
      <p class="technician-location__hint">This labels the selected pin. Use Search above to find and move to an address.</p>
    </div>
    <p class="technician-location__hint">Saving shares this exact pin and address with signed-in customers. GPS is used only on request; this is not live tracking. Only share a location you are comfortable making visible.</p>
    <p v-if="saved" class="technician-location__hint">Last saved: {{ new Date(saved.updated_at).toLocaleString() }}{{ dirty ? ' · Unsaved changes' : '' }}. Customers see the last saved pin until you save again or stop sharing.</p>
    <p v-if="error" class="technician-location__error" role="alert">{{ error }}</p>
    <p v-if="notice" class="technician-location__notice" role="status">{{ notice }}</p>
    <div class="technician-location__actions">
      <button class="fx-btn fx-btn-primary" type="button" :disabled="!point || loading || !!busy || !!loadError" @click="save">{{ busy === 'save' ? 'Saving…' : 'Save & share location' }}</button>
      <button v-if="saved?.is_shared" class="fx-btn fx-btn-secondary" type="button" :disabled="loading || !!busy || !!loadError" @click="stopSharing">{{ busy === 'hide' ? 'Stopping…' : 'Stop sharing' }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import LocationPicker from '../LocationPicker.vue';
import type { GeoPoint } from '../../types/map';
import { fetchMyTechnicianLocation, saveMyTechnicianLocation, stopSharingMyTechnicianLocation, type TechnicianLocation } from '../../services/technicianLocations';

const picker = ref<InstanceType<typeof LocationPicker> | null>(null);
const point = ref<GeoPoint | null>(null);
const address = ref('');
const saved = ref<TechnicianLocation | null>(null);
const loading = ref(false);
const loaded = ref(false);
const loadError = ref('');
const busy = ref<'' | 'save' | 'hide'>('');
const error = ref('');
const notice = ref('');
let operation = 0;
const dirty = computed(() => !!point.value && (!saved.value || point.value.lat !== saved.value.latitude || point.value.lng !== saved.value.longitude || address.value !== saved.value.address));

async function refresh() {
  if (loading.value || busy.value || (loaded.value && dirty.value)) return;
  const current = ++operation;
  loading.value = true;
  loadError.value = '';
  try {
    const location = await fetchMyTechnicianLocation();
    if (current !== operation) return;
    saved.value = location;
    point.value = location ? { lat: location.latitude, lng: location.longitude } : null;
    address.value = location?.address ?? '';
    loaded.value = true;
  } catch (cause) {
    if (current === operation) loadError.value = cause instanceof Error ? cause.message : 'Your location could not be loaded.';
  } finally {
    if (current === operation) loading.value = false;
  }
}

async function save() {
  if (!point.value || loading.value || busy.value || loadError.value) return;
  const current = ++operation;
  busy.value = 'save';
  error.value = '';
  notice.value = '';
  try {
    const location = await saveMyTechnicianLocation({ ...point.value }, address.value);
    if (current !== operation) return;
    saved.value = location;
    address.value = location.address;
    notice.value = 'Location saved. Customers can now find your shared service location.';
  } catch (cause) {
    if (current === operation) error.value = cause instanceof Error ? cause.message : 'Your location could not be saved.';
  } finally {
    if (current === operation) busy.value = '';
  }
}

async function stopSharing() {
  if (loading.value || busy.value || loadError.value) return;
  const current = ++operation;
  busy.value = 'hide';
  error.value = '';
  notice.value = '';
  try {
    await stopSharingMyTechnicianLocation();
    if (current !== operation) return;
    if (saved.value) saved.value = { ...saved.value, is_shared: false };
    notice.value = 'Location sharing stopped. Your pin is no longer listed for customers.';
  } catch (cause) {
    if (current === operation) error.value = cause instanceof Error ? cause.message : 'Sharing could not be stopped.';
  } finally {
    if (current === operation) busy.value = '';
  }
}

watch([point, address], () => { notice.value = ''; }, { flush: 'sync' });
onMounted(refresh);
onBeforeUnmount(() => { operation += 1; });
defineExpose({ refresh, resize: () => picker.value?.resize(), cancelPending: () => picker.value?.cancelPending() });
</script>

<style scoped>
.technician-location { display: flex; flex-direction: column; gap: 16px; margin-bottom: 28px; }
.technician-location__head { display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 12px; }
.technician-location__head h2 { margin-bottom: 6px; }
.technician-location__hint { margin: 6px 0 0; font-size: 12px; color: var(--text-muted); line-height: 1.6; }
.technician-location__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.technician-location__error { padding: 12px; margin: 0; background: #fef2f2; color: #b91c1c; border-radius: 10px; font-size: 13px; }
.technician-location__notice { margin: 0; font-size: 13px; color: var(--primary); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
