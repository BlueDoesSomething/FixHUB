<template>
  <ion-page>
    <ScreenHeader title="New Requests" :show-back="false" />
    <ion-content class="req-content">
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">New Requests</h1>
            <p class="fx-page__sub">Review and respond to incoming repair jobs.</p>
          </div>
          <div class="requests-head-actions">
            <span class="fx-pill fx-pill--progress">{{ jobs.length }} pending</span>
            <button class="fx-btn fx-btn-secondary fx-btn--sm" type="button" :disabled="loading" @click="refresh">
              {{ loading ? 'Refreshing…' : 'Refresh' }}
            </button>
          </div>
        </div>

        <p v-if="loading" role="status">Loading available repairs…</p>
        <div v-if="subscription?.enforced && subscription.status !== 'active'" class="fx-card requests-subscription" role="status">
          <p>An active ₱150/month technician subscription is required to accept new requests.</p>
          <button class="fx-btn fx-btn-primary fx-btn--sm" type="button" @click="router.push('/technician/subscription')">Manage Subscription</button>
        </div>
        <p v-if="billingError" class="requests-billing-error" role="alert">{{ billingError }}</p>
        <div v-else-if="error" class="fx-card" role="alert">
          <h2 class="fx-section-title">New requests could not be loaded</h2>
          <p>{{ error }}</p>
          <button class="fx-btn fx-btn-secondary" type="button" @click="refresh">Try Again</button>
        </div>
        <p v-if="notice" class="requests-notice" role="status">{{ notice }}</p>
        <button v-if="notice" class="fx-btn fx-btn-secondary fx-btn--sm" type="button" @click="router.push('/technician/messages')">Open Messages</button>

        <div v-if="!loading && !error && jobs.length" class="fx-grid-2">
          <RequestCard
            v-for="job in jobs"
            :key="job.id"
            :request="job"
            :busy="busyId === job.id"
            :locked="!!billingError || !subscription || (subscription.enforced && subscription.status !== 'active')"
            @accept="accept"
          />
        </div>
        <p v-else-if="!loading && !error" class="empty">No new requests right now. Customers must submit a repair request to FIXHUB before it appears here; sharing your map location alone does not create a job.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import RequestCard from '../../components/RequestCard.vue';
import type { AvailableRepairJob } from '../../data/repair';
import { acceptRepairJob, fetchAvailableRepairs } from '../../services/technicianRepairs';
import { getTechnicianSubscription, type TechnicianSubscription } from '../../services/technicianSubscription';

const router = useRouter();
const jobs = ref<AvailableRepairJob[]>([]);
const subscription = ref<TechnicianSubscription | null>(null);
const billingError = ref('');
const loading = ref(true);
const error = ref('');
const notice = ref('');
const busyId = ref<string | null>(null);

async function refresh() {
  loading.value = !jobs.value.length;
  error.value = '';
  notice.value = '';
  billingError.value = '';
  const billing = getTechnicianSubscription().then(value => { subscription.value = value; })
    .catch(() => { billingError.value = 'Subscription status could not be checked. Please retry before accepting a job.'; });
  try {
    jobs.value = await fetchAvailableRepairs();
  } catch (cause) {
    jobs.value = [];
    error.value = cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string'
      ? cause.message : 'FIXHUB could not be reached. Check the connection and try again.';
  }
  await billing;
  loading.value = false;
}

async function accept(job: AvailableRepairJob) {
  if (busyId.value || billingError.value || !subscription.value || (subscription.value.enforced && subscription.value.status !== 'active')) return;
  busyId.value = job.id;
  notice.value = '';
  error.value = '';
  try {
    const accepted = await acceptRepairJob(job.id);
    if (accepted) {
      jobs.value = jobs.value.filter(item => item.id !== job.id);
       notice.value = `Accepted ${job.reference} from ${job.customerName}. The conversation is now in Messages.`;
    } else {
      error.value = 'This request was already taken by another technician or could not be accepted. Refresh to see the current queue.';
    }
  } finally {
    busyId.value = null;
  }
}

onMounted(() => { void refresh(); });
onIonViewWillEnter(() => { void refresh(); });
</script>

<style scoped>
.requests-head-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.requests-notice { margin: 0 0 16px; padding: 12px 16px; border-radius: 12px; background: var(--gradient-soft); color: var(--primary); font-size: 14px; }
.empty { color: var(--text-dark); line-height: 1.7; }
.requests-subscription { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 0 0 16px; color: var(--text-dark); }
.requests-subscription p { margin: 0; }
.requests-billing-error { color: #7f1d1d; background: #fef2f2; padding: 12px; border-radius: 10px; }
</style>
