<template>
  <ion-page>
    <ScreenHeader title="Verify Technicians" :show-back="false" />
    <ion-content>
      <div class="fx-page fx-page--wide">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Verify Technicians</h1>
            <p class="fx-page__sub">Review credentials and approve new technicians</p>
          </div>
          <span class="fx-pill fx-pill--progress">{{ pending.length }} pending</span>
        </div>

        <div v-if="loading" class="fx-page__sub" role="status">Loading applications…</div>

        <div v-if="error" class="fx-page__sub" role="alert">{{ error }}</div>

        <div class="fx-stack">
          <div class="fx-table">
            <h4 class="fx-table__title">Pending Verification</h4>
            <p v-if="!pending.length && !loading && !error" class="fx-page__sub">
              No verification records available.
            </p>
            <div
              v-for="app in pending"
              :key="app.id"
              class="fx-table__row apps__row"
              @click="openReview(app)"
            >
              <div class="fx-table__avatar">{{ initialsOf(app.applicant.fullName) }}</div>
              <div class="fx-table__info">
                <p class="fx-table__name">{{ app.applicant.fullName }}</p>
                <p class="fx-table__sub">{{ app.applicant.email }} • {{ app.professional.yearsExperience }} yr(s)</p>
              </div>
              <div class="fx-table__actions">
                <button class="fx-btn fx-btn-secondary fx-btn--sm" @click.stop="openReview(app)">Review Details</button>
                <button class="fx-btn fx-btn-primary fx-btn--sm" @click.stop="verify(app.id)">Verify</button>
                <button class="fx-btn fx-btn-ghost fx-btn--sm" @click.stop="reject(app.id)">Reject</button>
              </div>
            </div>
          </div>

          <div class="fx-table">
            <h4 class="fx-table__title">Verified Technicians</h4>
            <p v-if="approved.length === 0" class="fx-page__sub">
              No technician records available.
            </p>
            <div v-for="app in approved" :key="app.id" class="fx-table__row">
              <div class="fx-table__avatar" style="background: #15803d">{{ initialsOf(app.applicant.fullName) }}</div>
              <div class="fx-table__info">
                <p class="fx-table__name">{{ app.applicant.fullName }}</p>
                <p class="fx-table__sub">{{ app.applicant.email }} • {{ app.professional.specializations.join(', ') }}</p>
              </div>
              <span class="fx-pill fx-pill--success">Verified</span>
            </div>
          </div>
        </div>

        <ApplicationReviewModal v-if="selected" :application="selected" @close="selected = null" @updated="load" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import ApplicationReviewModal from '../../components/technician/ApplicationReviewModal.vue';
import {
  initialsOf,
  type TechnicianApplication,
} from '../../data/technicianApplication';
import { fetchAdminApplications } from '../../services/adminAnalytics';
import {
  approveApplication,
  rejectApplication,
} from '../../services/technicianApplications';

const pending = ref<TechnicianApplication[]>([]);
const approved = ref<TechnicianApplication[]>([]);
const loading = ref(false);
const error = ref('');
const selected = ref<TechnicianApplication | null>(null);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const apps = await fetchAdminApplications();
    pending.value = apps.filter(a => a.status === 'Pending');
    approved.value = apps.filter(a => a.status === 'Approved');
    if (selected.value) selected.value = apps.find(a => a.id === selected.value?.id) ?? null;
  } catch (cause) {
    pending.value = [];
    approved.value = [];
    error.value = cause instanceof Error ? cause.message : 'Unable to load applications.';
  } finally {
    loading.value = false;
  }
}

function openReview(app: TechnicianApplication) {
  selected.value = app;
}

async function verify(id: string) {
  try {
    await approveApplication(id);
    await load();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to verify technician.';
  }
}

async function reject(id: string) {
  const app = pending.value.find((a) => a.id === id);
  if (!app) return;
  const note = prompt('Reason for rejection (required):');
  if (!note || note.trim().length < 5) {
    alert('Please provide a reason (at least 5 characters).');
    return;
  }
  try {
    await rejectApplication(id, note.trim());
    await load();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to reject application.';
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.fx-stack { display: flex; flex-direction: column; gap: 20px; }
.fx-table__actions { display: flex; gap: 8px; margin-left: auto; }
.apps__row { cursor: pointer; }
.apps__row:hover { background: rgba(20, 99, 68, 0.03); }
.fx-btn-ghost { color: var(--text-dark); }
.fx-btn-ghost:hover { background: rgba(0, 0, 0, 0.04); }
</style>
