<template>
  <ion-page>
    <ScreenHeader title="Active Repairs" default-href="/technician/requests" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Active Repairs</h1>
            <p class="fx-page__sub">Repairs assigned to you and their current status.</p>
          </div>
          <button class="fx-btn fx-btn-secondary fx-btn--sm" type="button" :disabled="loading" @click="refresh">
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>

        <p v-if="loading" role="status">Loading your assigned repairs…</p>
        <div v-else-if="error" class="fx-card" role="alert">
          <h2 class="fx-section-title">Assigned repairs could not be loaded</h2>
          <p>{{ error }}</p>
          <button class="fx-btn fx-btn-secondary" type="button" @click="refresh">Try Again</button>
        </div>
        <div v-else-if="!assigned.length" class="fx-card">
          <h2 class="fx-section-title">No active repair available</h2>
          <p class="fx-page__sub">Assigned repairs will appear here when available.</p>
        </div>

        <div v-else class="active-repairs">
          <article
            v-for="job in assigned"
            :key="job.id"
            class="fx-card active-repair"
            data-testid="active-repair"
          >
            <header class="active-repair__head">
              <div>
                <h2 class="active-repair__title">{{ job.brand }} {{ job.model }}</h2>
                <p class="active-repair__meta">{{ job.reference }} • {{ job.device }}</p>
              </div>
              <span class="fx-pill" :class="statusPillClass({ status: job.status, synced: true })">{{ job.status }}</span>
            </header>

            <div class="active-repair__details">
              <div><span>Customer:</span><strong>{{ job.customerName }}</strong></div>
              <div><span>Type:</span><strong>{{ job.serviceType === 'dropoff' ? 'Drop-off' : 'Home service' }}</strong></div>
              <div><span>Location:</span><strong>{{ job.location }}</strong></div>
              <div><span>Requested:</span><strong>{{ formatDate(job.createdAt) }}</strong></div>
            </div>

            <p class="active-repair__problem">{{ job.problem }}</p>
            <p v-if="job.cancellationReason" class="active-repair__cancelled" role="status">
              Cancellation reason: {{ job.cancellationReason }}
            </p>

            <div class="active-repair__actions">
              <button
                v-if="stepFor(job) && !job.cancellationReason"
                class="fx-btn fx-btn-primary"
                type="button"
                :disabled="busyId === job.id"
                @click="advance(job)"
              >
                {{ busyId === job.id ? 'Saving…' : stepFor(job)?.label }}
              </button>
              <p v-if="messages[job.id]" class="active-repair__message" role="alert">{{ messages[job.id] }}</p>
            </div>
          </article>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { nextRepairStep, remoteStatusLabel, statusPillClass, type AssignedRepairJob } from '../../data/repair';
import { advanceRepairJob, fetchAssignedRepairs } from '../../services/technicianRepairs';

const assigned = ref<AssignedRepairJob[]>([]);
const loading = ref(true);
const error = ref('');
const busyId = ref<string | null>(null);
const messages = reactive<Record<string, string>>({});

/** Each repair shows only its own next step, if the workflow allows one. */
const stepFor = computed(() => (job: AssignedRepairJob) => nextRepairStep(job.dbStatus));
const formatDate = (date: string) => {
  const parsed = Date.parse(date);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : date;
};

async function refresh() {
  loading.value = !assigned.value.length;
  error.value = '';
  const repairs = await fetchAssignedRepairs();
  if (repairs === null) {
    error.value = 'FIXHUB could not be reached. Check the connection and try again.';
  } else {
    assigned.value = repairs;
  }
  loading.value = false;
}

async function advance(job: AssignedRepairJob) {
  const step = nextRepairStep(job.dbStatus);
  if (!step || busyId.value) return;
  busyId.value = job.id;
  delete messages[job.id];
  try {
    const moved = await advanceRepairJob(job.id, step.dbStatus);
    if (moved) {
      const updated: AssignedRepairJob = { ...job, dbStatus: step.dbStatus, status: remoteStatusLabel(step.dbStatus) };
      const refreshed = await fetchAssignedRepairs();
      assigned.value = refreshed ?? assigned.value.map(item => (item.id === job.id ? updated : item));
      if (refreshed === null) error.value = 'Status saved, but the refreshed list could not be loaded.';
    } else {
      messages[job.id] = 'The status could not be changed. Refresh to see the current state of this repair.';
    }
  } finally {
    busyId.value = null;
  }
}

onMounted(() => { void refresh(); });
onIonViewWillEnter(() => { void refresh(); });
</script>

<style scoped>
.active-repairs { display: grid; gap: 16px; }
.active-repair { display: grid; gap: 14px; }
.active-repair__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.active-repair__title { font-size: 17px; font-weight: 700; color: var(--text-dark); margin: 0; }
.active-repair__meta { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
.active-repair__details { background: var(--bg); border-radius: 12px; padding: 12px 14px; font-size: 13px; display: grid; gap: 6px; }
.active-repair__details div { display: flex; justify-content: space-between; gap: 12px; }
.active-repair__details span { color: var(--text-muted); }
.active-repair__details strong { color: var(--text-dark); font-weight: 600; text-align: right; }
.active-repair__problem { font-size: 14px; line-height: 1.7; color: var(--text-dark); margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.active-repair__cancelled { font-size: 13px; color: var(--danger); margin: 0; }
.active-repair__actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.active-repair__message { font-size: 13px; color: var(--danger); margin: 0; }
</style>
