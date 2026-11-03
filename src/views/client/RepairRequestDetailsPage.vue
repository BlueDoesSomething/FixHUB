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
            <span class="fx-pill fx-pill--pending">Pending · local only</span>
          </div>
          <div class="fx-split details-layout">
            <div>
              <section class="fx-card details-section">
                <h2 class="fx-section-title">{{ request.brand }} {{ request.model }}</h2>
                <p>{{ request.device }} · {{ serviceLabel(request.serviceType) }}</p>
                <p class="problem">{{ request.problem }}</p>
                <p class="hint">Saved {{ formatDate(request.createdAt) }}. No technician is assigned; this request has not been sent to the network.</p>
              </section>
              <section class="fx-card details-section"><h2 class="fx-section-title">Photos ({{ request.photos.length }})</h2><RepairPhotoGallery :photos="request.photos" /><p v-if="!request.photos.length" class="hint">No photos attached.</p></section>
              <section class="fx-card details-section">
                <h2 class="fx-section-title">{{ request.serviceType === 'home' ? 'Service location' : 'Starting location' }}</h2><p class="problem">{{ request.location }}</p><p v-if="request.coordinates" class="hint">{{ formatCoordinates(request.coordinates) }}</p>
                <MapCanvas ref="mapRef" height="260px" label="Saved repair request location" :markers="markers" />
              </section>
            </div>
            <aside class="fx-card">
              <h2 class="fx-section-title">What happens next?</h2>
              <p class="hint">Technician matching, acceptance, and quotations are the next feature stage. This local request does not reserve a technician or authorize a repair charge.</p>
              <div class="details-actions"><button class="fx-btn fx-btn-primary fx-btn--block" @click="router.push('/client/history')">View Repair History</button><button class="fx-btn fx-btn-secondary fx-btn--block" @click="router.push('/client/request')">Start Another Request</button></div>
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
import { serviceLabel, type SubmittedRepairRequest } from '../../data/repair';
import { repairOwnerId } from '../../stores/repair';
import { getRepairRequest, repairStorageMessage } from '../../services/repairStorage';
import { formatCoordinates } from '../../utils/map';
import type { MapMarker } from '../../types/map';

const router = useRouter();
const route = useRoute();
const request = ref<SubmittedRepairRequest | null>(null);
const loading = ref(true);
const error = ref('');
const mapRef = ref<InstanceType<typeof MapCanvas> | null>(null);
let version = 0;
const markers = computed<MapMarker[]>(() => request.value?.coordinates ? [{ ...request.value.coordinates, id: 'saved', kind: 'dest', title: 'Saved request location' }] : []);
const formatDate = (date: string) => new Date(date).toLocaleString();

async function load() {
  const current = ++version;
  loading.value = true;
  error.value = '';
  try {
    const ownerId = repairOwnerId();
    const result = await getRepairRequest(ownerId, String(route.params.requestId));
    if (repairOwnerId() !== ownerId) return;
    if (current === version) request.value = result;
  } catch (cause) { if (current === version) error.value = repairStorageMessage(cause); }
  finally { if (current === version) loading.value = false; }
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
.details-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
@media (max-width: 1100px) { .details-layout { grid-template-columns: 1fr; } }
</style>
