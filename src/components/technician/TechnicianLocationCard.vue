<template>
  <section class="fx-card technician-location" aria-labelledby="technician-location-title">
    <div class="technician-location__head">
      <div>
        <h2 id="technician-location-title" class="fx-section-title fx-section-title--lg">Your service location</h2>
        <p class="fx-page__sub">Your map automatically follows device GPS. Share live updates, or save a fixed shop/service location.</p>
      </div>
      <span class="fx-badge" :class="saved?.is_shared && !loadError ? 'fx-badge--green' : ''">{{ loading ? 'Checking location…' : loadError ? 'Status unavailable' : saved?.is_shared ? 'Location shared' : 'Not shared' }}</span>
    </div>

    <p v-if="loading" role="status">Loading your saved location…</p>
    <div v-if="loadError" class="technician-location__error" role="alert">{{ loadError }} <button type="button" class="fx-btn fx-btn-secondary fx-btn--sm" @click="refresh">Retry</button></div>
    <p v-if="loadError" class="technician-location__hint">You can still use GPS, search, or choose a map pin privately. Saving and sharing stay disabled until your saved-location status can be checked.</p>
    <LocationPicker ref="picker" id="technician-location" v-model="point" v-model:address="address" auto-locate :active="active" label="Set your technician service location" :disabled="loading || !!busy" @located="onLocated" @following="onFollowing" />
    <div>
      <label class="fx-label" for="technician-address">Service address or landmark (optional)</label>
      <input id="technician-address" v-model="address" class="fx-input" maxlength="500" :disabled="loading || !!busy" placeholder="Shop, building, street, or nearby landmark" />
      <p class="technician-location__hint">This labels the selected pin. Use Search above to find and move to an address.</p>
    </div>
    <p class="technician-location__hint">GPS stays private until you choose to share. Live sharing sends your exact position to signed-in customers every 15 seconds while this map is open. It stops when you leave or background the app; disconnected live pins expire within 90 seconds. No background tracking or location history is stored.</p>
    <p v-if="liveSharing" class="technician-location__notice" role="status">{{ publishing ? 'Updating live location…' : 'Live location sharing is on.' }}</p>
    <p v-if="saved" class="technician-location__hint">Last saved: {{ new Date(saved.updated_at).toLocaleString() }}{{ dirty ? ' · Unsaved changes' : '' }}. Customers see the last saved pin until you save again or stop sharing.</p>
    <p v-if="error" class="technician-location__error" role="alert">{{ error }}</p>
    <p v-if="notice" class="technician-location__notice" role="status">{{ notice }}</p>
    <div class="technician-location__actions">
      <button class="fx-btn fx-btn-primary" type="button" :disabled="!loaded || liveSharing || !followingGps || !latestGps || loading || !!busy || !!loadError" @click="startLive">Share live location</button>
      <button class="fx-btn fx-btn-primary" type="button" :disabled="!loaded || !point || loading || !!busy || !!loadError" @click="save">{{ busy === 'save' ? 'Saving…' : 'Save & share location' }}</button>
      <button v-if="saved?.is_shared || liveSharing" class="fx-btn fx-btn-secondary" type="button" :disabled="loading || !!busy || !!loadError" @click="stopSharing">{{ busy === 'hide' ? 'Stopping…' : 'Stop sharing' }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import LocationPicker from '../LocationPicker.vue';
import type { GeoPoint } from '../../types/map';
import type { LocatedPoint } from '../../services/geolocation';
import { fetchMyTechnicianLocation, saveMyTechnicianLocation, stopSharingMyTechnicianLocation, publishMyLiveLocation, type TechnicianLocation } from '../../services/technicianLocations';
import { usePageForeground } from '../../composables/usePageForeground';
import { useAuth } from '../../stores/auth';

const props = withDefaults(defineProps<{ active?: boolean }>(), { active: true });
const foreground = usePageForeground(() => props.active);
const auth = useAuth();
const owner = auth.state.session?.userId;

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
const liveSharing = ref(false);
const publishing = ref(false);
const followingGps = ref(false);
const latestGps = ref<{ point: LocatedPoint; receivedAt: number } | null>(null);
let heartbeat: ReturnType<typeof setInterval> | undefined;
let liveEpoch = 0;
let writeQueue: Promise<unknown> = Promise.resolve();
let selectionRevision = 0;
function queueWrite<T>(task: () => Promise<T>): Promise<T> {
  const write = writeQueue.catch(() => undefined).then(() => {
    if (auth.state.session?.userId !== owner) throw new Error('The signed-in account changed.');
    return task();
  });
  writeQueue = write;
  return write;
}
function disableLive() { liveSharing.value = false; liveEpoch += 1; clearInterval(heartbeat); heartbeat = undefined; }
function onLocated(value: LocatedPoint) { latestGps.value = { point: value, receivedAt: Date.now() }; }
function onFollowing(value: boolean) {
  followingGps.value = value;
  if (!value) {
    latestGps.value = null;
    if (liveSharing.value) void stopSharing();
  }
}
function startLive() {
  if (!loaded.value || loading.value || liveSharing.value || !foreground.value || !followingGps.value || !latestGps.value || busy.value || loadError.value) return;
  if (Date.now() - latestGps.value.receivedAt > 30000) {
    error.value = 'Wait for a fresh GPS update before sharing live location.';
    return;
  }
  liveSharing.value = true;
  error.value = '';
  notice.value = '';
  heartbeat = setInterval(() => { void publish(); }, 15000);
  void publish();
}
async function publish() {
  if (!liveSharing.value || !foreground.value || publishing.value) return;
  if (!latestGps.value || Date.now() - latestGps.value.receivedAt > 30000) {
    await stopSharing();
    error.value = 'Live sharing stopped because fresh GPS updates are unavailable. Use your current location to try again.';
    return;
  }
  const current = liveEpoch;
  const value = { lat: latestGps.value.point.lat, lng: latestGps.value.point.lng };
  publishing.value = true;
  try {
    const location = await queueWrite(() => current === liveEpoch && liveSharing.value ? publishMyLiveLocation(value) : Promise.resolve(null));
    if (current === liveEpoch && location) saved.value = location;
  } catch (cause) {
    if (current === liveEpoch) {
      disableLive();
      error.value = cause instanceof Error ? cause.message : 'Live location could not be updated.';
      // Reconcile a response lost after a successful write; otherwise TTL bounds visibility.
      void queueWrite(stopSharingMyTechnicianLocation).then(() => { if (saved.value?.location_mode === 'live') saved.value = { ...saved.value, is_shared: false }; }).catch(() => undefined);
    }
  } finally { publishing.value = false; }
}
let operation = 0;
const dirty = computed(() => !!point.value && (!saved.value || point.value.lat !== saved.value.latitude || point.value.lng !== saved.value.longitude || address.value !== saved.value.address));

async function refresh() {
  if (loading.value || busy.value || liveSharing.value || (loaded.value && dirty.value && !loadError.value)) return;
  const current = ++operation;
  const initialSelectionRevision = selectionRevision;
  const preserveSelection = dirty.value || (!loaded.value && (point.value !== null || !!address.value.trim()));
  loading.value = true;
  loadError.value = '';
  try {
    const location = await fetchMyTechnicianLocation();
    if (current !== operation) return;
    saved.value = location;
    // A retry must not replace a private pin/address chosen while the backend
    // was unavailable, or a newer selection made during the request.
    if (!preserveSelection && initialSelectionRevision === selectionRevision) {
      point.value = location ? { lat: location.latitude, lng: location.longitude } : null;
      address.value = location?.address ?? '';
    }
    loaded.value = true;
  } catch (cause) {
    if (current === operation) loadError.value = cause instanceof Error ? cause.message : 'Your location could not be loaded.';
  } finally {
    if (current === operation) loading.value = false;
  }
}

async function save() {
  if (!loaded.value || !point.value || loading.value || busy.value || loadError.value) return;
  const current = ++operation;
  disableLive();
  picker.value?.cancelPending?.();
  const selectedPoint = { ...point.value };
  const selectedAddress = address.value;
  busy.value = 'save';
  error.value = '';
  notice.value = '';
  try {
    const location = await queueWrite(() => saveMyTechnicianLocation(selectedPoint, selectedAddress));
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
  disableLive();
  const current = ++operation;
  busy.value = 'hide';
  error.value = '';
  notice.value = '';
  try {
    await queueWrite(stopSharingMyTechnicianLocation);
    if (current !== operation) return;
    if (saved.value) saved.value = { ...saved.value, is_shared: false };
    notice.value = 'Location sharing stopped. Your pin is no longer listed for customers.';
  } catch (cause) {
    if (current === operation) error.value = cause instanceof Error ? cause.message : 'Sharing could not be stopped.';
  } finally {
    if (current === operation) busy.value = '';
  }
}

watch([point, address], () => { selectionRevision += 1; if (!followingGps.value) notice.value = ''; }, { flush: 'sync' });
watch(foreground, value => { if (!value && liveSharing.value) void stopSharing(); }, { flush: 'sync' });
onMounted(refresh);
onBeforeUnmount(() => {
  const wasSharing = liveSharing.value;
  disableLive();
  if (wasSharing) void queueWrite(stopSharingMyTechnicianLocation).catch(() => undefined);
  operation += 1;
});
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
