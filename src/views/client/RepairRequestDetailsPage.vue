<template>
  <ion-page>
    <ScreenHeader title="Repair Request" default-href="/client/history" />
    <ion-content>
      <div class="fx-page">
        <RepairSaveStatus />
        <p v-if="loading" role="status">Loading your saved request…</p>
        <div v-else-if="error" class="fx-card" role="alert"><h1 class="fx-page__title">Unable to load request</h1><p>{{ error }}</p><button class="fx-btn fx-btn-secondary" @click="load">Try Again</button></div>
        <div v-else-if="!request" class="fx-card"><h1 class="fx-page__title">Request not found on this device</h1><p>It may have been saved in a different browser or removed with site data.</p><button class="fx-btn fx-btn-primary" @click="router.push('/client/history')">View Repair History</button></div>
        <template v-else>
          <div class="fx-page__head">
            <div><h1 class="fx-page__title">{{ route.query.submitted === '1' ? 'Request saved on this device' : 'Repair request' }}</h1><p class="fx-page__sub">Reference <strong data-testid="request-reference">{{ request.reference }}</strong></p></div>
            <span class="fx-pill" :class="statusPillClass(request)">{{ request.synced ? request.status : 'Pending · local' }}</span>
          </div>
          <div class="fx-split details-layout">
            <div>
              <section class="fx-card details-section">
                <h2 class="fx-section-title">{{ request.brand }} {{ request.model }}</h2>
                <p>{{ request.device }} · {{ serviceLabel(request.serviceType) }}</p>
                <p class="problem">{{ request.problem }}</p>
                <p class="hint">Saved {{ formatDate(request.createdAt) }}. {{ deliveryNote }}</p>
                <p v-if="request.syncError" class="hint sync-warning" role="status">{{ request.syncError }} <button type="button" class="fx-btn fx-btn-secondary fx-btn--sm" :disabled="retrying" @click="retrySync">{{ retrying ? 'Sending…' : 'Send again' }}</button></p>
              </section>
              <section class="fx-card details-section"><h2 class="fx-section-title">Photos ({{ request.photos.length }})</h2><RepairPhotoGallery :photos="request.photos" /><p v-if="!request.photos.length" class="hint">No photos attached.</p></section>
              <section class="fx-card details-section">
                <h2 class="fx-section-title">{{ request.serviceType === 'home' ? 'Service location' : 'Starting location' }}</h2><p class="problem">{{ request.location }}</p><p v-if="request.coordinates" class="hint">{{ formatCoordinates(request.coordinates) }}</p>
                <MapCanvas ref="mapRef" height="260px" label="Saved repair request location" :markers="markers" />
              </section>
            </div>
            <aside class="fx-card">
              <h2 class="fx-section-title">What happens next?</h2>
              <p class="hint">{{ nextStepsNote }}</p>
              <div class="details-actions">
                <button class="fx-btn fx-btn-primary fx-btn--block" @click="router.push('/client/history')">View Repair History</button>
                <button class="fx-btn fx-btn-secondary fx-btn--block" @click="router.push('/client/request')">Start Another Request</button>
                <button v-if="canCancel" class="fx-btn fx-btn-ghost fx-btn--block" type="button" :disabled="cancelling" @click="cancelRequest">{{ cancelling ? 'Cancelling…' : 'Cancel Request' }}</button>
              </div>
            </aside>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonContent, onIonViewDidEnter, onIonViewWillEnter } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import MapCanvas from '../../components/MapCanvas.vue';
import RepairSaveStatus from '../../components/repair/RepairSaveStatus.vue';
import RepairPhotoGallery from '../../components/repair/RepairPhotoGallery.vue';
import { serviceLabel, statusPillClass, type SubmittedRepairRequest } from '../../data/repair';
import { repairOwnerId } from '../../stores/repair';
import { getRepairRequest, repairStorageMessage } from '../../services/repairStorage';
import { cancelRepairRequest, fetchRemoteRepairRequest, pushRepairRequest } from '../../services/repairSync';
import { isSupabaseConfigured } from '../../services/supabase';
import { formatCoordinates } from '../../utils/map';
import type { MapMarker } from '../../types/map';

const router = useRouter();
const route = useRoute();
const request = ref<SubmittedRepairRequest | null>(null);
const loading = ref(true);
const error = ref('');
const retrying = ref(false);
const cancelling = ref(false);
const mapRef = ref<InstanceType<typeof MapCanvas> | null>(null);
let version = 0;
const markers = computed<MapMarker[]>(() => request.value?.coordinates ? [{ ...request.value.coordinates, id: 'saved', kind: 'dest', title: 'Saved request location' }] : []);
const formatDate = (date: string) => new Date(date).toLocaleString();

const deliveryNote = computed(() => {
  const current = request.value;
  if (!current) return '';
  if (!current.synced) return 'It has not reached FIXHUB yet, so no technician can see it.';
  if (current.status === 'Pending') return 'It is in FIXHUB and waiting for a technician to accept it.';
  if (current.status === 'Cancelled') return 'It was cancelled and is no longer visible to technicians.';
  if (current.status === 'Completed') return 'The assigned technician marked this repair completed.';
  return `A technician accepted this repair — current status: ${current.status}.`;
});

const nextStepsNote = computed(() => {
  const current = request.value;
  if (!current) return '';
  if (!current.synced) return 'Send this request to FIXHUB so nearby technicians can accept it. No price is agreed until a technician replies.';
  if (current.status === 'Pending') return 'Nearby technicians can accept this request. No technician is assigned and no repair price has been agreed yet.';
  if (current.status === 'Cancelled') return 'This request was cancelled. Start another request whenever you need one.';
  return 'Follow the status above; the assigned technician controls the next steps. No repair price is authorized until a technician confirms it.';
});

const canCancel = computed(() => !!request.value?.synced && request.value?.status === 'Pending');

async function load() {
  const current = ++version;
  loading.value = true;
  error.value = '';
  try {
    const ownerId = repairOwnerId();
    const requestId = String(route.params.requestId);
    let result = await getRepairRequest(ownerId, requestId);
    if (!result && isSupabaseConfigured()) {
      // Another device (or cleared site data) may hold the only copy.
      result = await fetchRemoteRepairRequest(ownerId, requestId);
    }
    if (repairOwnerId() !== ownerId) return;
    if (current === version) request.value = result;
  } catch (cause) { if (current === version) error.value = repairStorageMessage(cause); }
  finally { if (current === version) loading.value = false; }
}

async function retrySync() {
  const current = request.value;
  if (!current || retrying.value) return;
  retrying.value = true;
  try {
    const synced = await pushRepairRequest(current, current.ownerId || repairOwnerId());
    if (synced) request.value = { ...current, synced: true, syncError: undefined };
    else request.value = { ...current, syncError: 'Still not sent to FIXHUB. Check your connection and try again.' };
  } catch {
    request.value = { ...current, syncError: 'Still not sent to FIXHUB. Check your connection and try again.' };
  } finally {
    retrying.value = false;
  }
}

async function cancelRequest() {
  const current = request.value;
  if (!current || !canCancel.value || cancelling.value) return;
  cancelling.value = true;
  try {
    const cancelled = await cancelRepairRequest(current.id);
    if (cancelled) request.value = { ...current, status: 'Cancelled', synced: true, syncError: undefined };
    else request.value = { ...current, syncError: 'The request could not be cancelled. It may already have been accepted.' };
  } catch {
    request.value = { ...current, syncError: 'The request could not be cancelled. It may already have been accepted.' };
  } finally {
    cancelling.value = false;
  }
}

onMounted(load);
onIonViewWillEnter(load);
onIonViewDidEnter(() => mapRef.value?.resize());
watch(() => route.params.requestId, () => { if (route.name === 'client-request-details') void load(); });
</script>
<style scoped>
.fx-page { color: var(--text-dark); }
.details-section { margin-bottom: 20px; }
.problem { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.7; font-size: 14px; }
.hint { color: var(--text-muted); font-size: 12px; line-height: 1.7; }
.sync-warning { color: #b45309; }
.details-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
@media (max-width: 1100px) { .details-layout { grid-template-columns: 1fr; } }
</style>
