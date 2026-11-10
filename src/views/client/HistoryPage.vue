<template>
  <ion-page>
    <ScreenHeader title="Repair History" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head"><div><h1 class="fx-page__title">Repair History</h1><p class="fx-page__sub">Your submitted repair requests, on this device and in FIXHUB.</p></div><div class="history-actions"><button class="fx-btn fx-btn-secondary" @click="router.push('/client/reviews')">My Reviews</button><button class="fx-btn fx-btn-primary" @click="router.push('/client/request')">Request a Repair</button></div></div>
        <RepairSaveStatus />
        <p v-if="loading" role="status">Loading your requests…</p>
        <p v-else-if="loadError" role="alert">{{ loadError }}</p>
        <div v-else-if="!state.requests.length" class="fx-card empty"><h2>No submitted requests yet</h2><p>Complete the device details, choose a location, and submit from the review screen.</p></div>
        <LocalRepairRequests v-else :requests="state.requests" />

      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import RepairSaveStatus from '../../components/repair/RepairSaveStatus.vue';
import LocalRepairRequests from '../../components/repair/LocalRepairRequests.vue';
import { useRepairDraft } from '../../stores/repair';
const router = useRouter();
const { state, refreshRequests } = useRepairDraft();
const loading = ref(true);
const loadError = ref('');
async function load() {
  loading.value = true;
  loadError.value = '';
  try { await refreshRequests(); }
  catch { loadError.value = 'Your saved requests could not be loaded. Check browser storage permissions and try refreshing.'; }
  finally { loading.value = false; }
}
onMounted(load);
onIonViewWillEnter(load);
</script>
<style scoped>
.fx-page { color: var(--text-dark); }
.empty h2 { margin: 0; font-size: 18px; }
.empty p, .hint { color: var(--text-muted); font-size: 13px; line-height: 1.7; }
.history-actions { display: flex; gap: 10px; flex-wrap: wrap; }
@media (max-width: 400px) { .fx-grid-2 { grid-template-columns: minmax(0, 1fr); } }
</style>
