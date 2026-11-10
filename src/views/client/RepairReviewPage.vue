<template>
  <ion-page>
    <ScreenHeader title="Review Repair Request" default-href="/client/request/location" />
    <ion-content>
      <div class="fx-page">
        <RepairSteps :step="3" />
        <div class="fx-page__head"><div><h1 class="fx-page__title">Review your repair request</h1><p class="fx-page__sub">Check everything before sending your request to FIXHUB.</p></div></div>
        <RepairSaveStatus show-save-status />
        <p v-if="!state.ready" role="status">Loading your draft…</p>
        <template v-else>
          <div v-if="Object.keys(errors).length" class="review-errors" role="alert">
            <strong>This draft is not ready to submit.</strong>
            <ul><li v-for="(message, field) in errors" :key="field">{{ message }}</li></ul>
            <button type="button" class="fx-btn fx-btn-secondary fx-btn--sm" @click="router.push('/client/request')">Complete Device Details</button>
          </div>
          <div class="fx-split review-layout">
            <div>
              <section class="fx-card review-section">
                <div class="section-head"><h2 class="fx-section-title">Device & problem</h2><button class="fx-btn fx-btn-ghost fx-btn--sm" type="button" :disabled="state.submitting" @click="router.push('/client/request')">Edit Details</button></div>
                <dl class="review-list"><div><dt>Device</dt><dd>{{ draft.device }}</dd></div><div><dt>Brand</dt><dd>{{ draft.brand || 'Not provided' }}</dd></div><div><dt>Model</dt><dd>{{ draft.model || 'Not provided' }}</dd></div><div><dt>Service</dt><dd>{{ serviceLabel(draft.serviceType) }}</dd></div></dl>
                <h3 class="problem-title">Problem description</h3><p class="problem-text">{{ draft.problem || 'Not provided' }}</p>
              </section>
              <section class="fx-card review-section"><h2 class="fx-section-title">Photos ({{ draft.photos.length }})</h2><RepairPhotoGallery :photos="draft.photos" /><p v-if="!draft.photos.length" class="hint">No photos attached. Photos are optional.</p></section>
              <section class="fx-card review-section">
                <div class="section-head"><h2 class="fx-section-title">{{ draft.serviceType === 'home' ? 'Service location' : 'Starting location' }}</h2><button class="fx-btn fx-btn-ghost fx-btn--sm" type="button" :disabled="state.submitting" @click="router.push('/client/request/location')">Edit Location</button></div>
                <p class="address">{{ draft.location || 'Not confirmed' }}</p><p v-if="draft.coordinates" class="hint">{{ formatCoordinates(draft.coordinates) }}</p>
                <MapCanvas v-if="draft.coordinates" ref="mapRef" height="260px" label="Review your repair location" :markers="locationMarkers" />
                <p v-if="draft.serviceType === 'dropoff'" class="hint">This pin is your starting area, not a confirmed shop address. A technician and shop have not been assigned.</p>
              </section>
              <NearbyTechnicians v-if="draft.coordinates" :key="draft.id" id="review-nearby" :point="draft.coordinates" :active="active" :device="draft.device" :service-type="draft.serviceType" @markers="technicianMarkers = $event" />
            </div>
            <aside class="fx-card submit-panel">
              <h2 class="fx-section-title">Before you submit</h2>
              <p>No technician is assigned and no repair price has been agreed. Your request is saved on this device and sent to FIXHUB.</p>
              <label class="consent"><input id="review-confirm" v-model="confirmed" type="checkbox" :disabled="state.submitting" />I have checked the device details, photos, service type, and location.</label>
              <button class="fx-btn fx-btn-primary fx-btn--block" type="button" :disabled="!confirmed || !!Object.keys(errors).length || state.submitting" @click="submitRequest">{{ state.submitting ? 'Saving request…' : 'Submit Repair Request' }}</button>
              <p class="hint">You will receive a reference number and can reopen the request from Repair History. Nearby technicians can accept it — nothing is charged until a technician confirms the repair.</p>
            </aside>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, onIonViewDidEnter, onIonViewWillEnter, onIonViewDidLeave } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import MapCanvas from '../../components/MapCanvas.vue';
import NearbyTechnicians from '../../components/NearbyTechnicians.vue';
import RepairSteps from '../../components/repair/RepairSteps.vue';
import RepairSaveStatus from '../../components/repair/RepairSaveStatus.vue';
import RepairPhotoGallery from '../../components/repair/RepairPhotoGallery.vue';
import { serviceLabel, validateRepair } from '../../data/repair';
import { useRepairDraft } from '../../stores/repair';
import { formatCoordinates } from '../../utils/map';
import type { MapMarker } from '../../types/map';

const router = useRouter();
const { draft, state, initialize, submit } = useRepairDraft();
const confirmed = ref(false);
const active = ref(true);
const technicianMarkers = ref<MapMarker[]>([]);
const mapRef = ref<InstanceType<typeof MapCanvas> | null>(null);
const errors = computed(() => validateRepair(draft));
const locationMarkers = computed<MapMarker[]>(() => draft.coordinates ? [{ ...draft.coordinates, id: 'review', kind: 'dest', title: 'Your confirmed location' }, ...technicianMarkers.value] : []);
watch(draft, () => { confirmed.value = false; }, { deep: true });

async function submitRequest() {
  if (!confirmed.value || Object.keys(errors.value).length || state.submitting) return;
  try {
    const request = await submit();
    await router.replace({ name: 'client-request-details', params: { requestId: request.id }, query: { submitted: '1' } });
  } catch { /* Saving failures are shown by the shared notice; no success screen. */ }
}

onMounted(initialize);
onIonViewWillEnter(() => { active.value = true; confirmed.value = false; void initialize(); });
onIonViewDidEnter(() => mapRef.value?.resize());
onIonViewDidLeave(() => { active.value = false; });
</script>
<style scoped>
.fx-page { color: var(--text-dark); }
.review-section { margin-bottom: 20px; }
.section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
.section-head h2 { margin: 0; }
.review-list { margin: 0; }
.review-list > div { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--hairline); font-size: 14px; }
.review-list dt { color: var(--text-muted); }
.review-list dd { margin: 0; text-align: right; font-weight: 600; overflow-wrap: anywhere; }
.problem-title { font-size: 14px; font-weight: 700; margin: 18px 0 8px; }
.problem-text, .address { font-size: 14px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.7; }
.hint { font-size: 12px; color: var(--text-muted); line-height: 1.7; }
.submit-panel { position: sticky; top: 20px; }
.submit-panel > p { font-size: 13px; line-height: 1.7; }
.consent { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.7; margin: 20px 0; }
.consent input { margin-top: 5px; flex-shrink: 0; }
.review-errors { padding: 16px; background: #fef2f2; color: #b91c1c; border-radius: 12px; font-size: 13px; margin-bottom: 20px; }
button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
@media (max-width: 1100px) { .review-layout { grid-template-columns: 1fr; } .submit-panel { position: static; } }
</style>
