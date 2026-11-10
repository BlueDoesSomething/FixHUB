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

        <ApplicationReviewModal v-if="selected" :application="selected" @close="selected = null" />
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
  type ApplicationStatus,
  type TechnicianApplication,
} from '../../data/technicianApplication';
import { useTechnicianApplications } from '../../stores/technicianApplications';
import {
  approveApplication,
  rejectApplication,
  fetchTechnicianApplications,
} from '../../services/technicianApplications';

const store = useTechnicianApplications();
const pending = ref<TechnicianApplication[]>([]);
const approved = ref<TechnicianApplication[]>([]);
const loading = ref(false);
const error = ref('');
const selected = ref<TechnicianApplication | null>(null);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    // Supabase is the source of truth for applications submitted through the backend.
    const supabaseApps = await fetchTechnicianApplications();
    // Map Supabase rows to the store's shape where possible.
    const fromSupabase = supabaseApps.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: (row.status.charAt(0).toUpperCase() + row.status.slice(1)) as ApplicationStatus,
      applicant: {
        userId: row.applicant_id,
        fullName: row.full_name,
        email: row.email,
        contactNumber: row.contact_number,
        city: row.city,
      },
      professional: {
        yearsExperience: String(row.years_experience),
        brands: row.brands,
        specializations: row.specializations,
        experienceDescription: row.experience_description,
      },
      service: {
        serviceType: row.service_type,
        coverageArea: row.coverage_area,
        workingDays: row.working_days,
        workingHours: row.working_hours,
      },
      documents: { certificates: [], workPhotos: [] },
      review: {
        reviewer: row.reviewer_id ?? undefined,
        reviewedAt: row.reviewed_at ?? undefined,
        feedback: row.feedback ?? undefined,
      },
      history: [],
    }));
    // Also include locally stored applications (submitted via the app before Supabase wiring).
    const localApps = store.all().filter((a) => a.status === 'Pending' || a.status === 'Approved');
    const allApps = [...fromSupabase, ...localApps];
    // Deduplicate by ID (Supabase takes precedence).
    const seen = new Set<string>();
    const unique = allApps.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    pending.value = unique.filter((a) => a.status === 'Pending');
    approved.value = unique.filter((a) => a.status === 'Approved');
  } catch (cause) {
    // If Supabase is not yet wired for applications, fall back to localStorage only.
    pending.value = store.all().filter((a) => a.status === 'Pending');
    approved.value = store.all().filter((a) => a.status === 'Approved');
    error.value = cause instanceof Error ? cause.message : 'Unable to load applications.';
  } finally {
    loading.value = false;
  }
}

function openReview(app: TechnicianApplication) {
  selected.value = app;
}

async function verify(id: string) {
  const updated = store.review(id, 'approve', 'Approved via Verify Technicians', 'Admin');
  if (!updated) return;
  try {
    await approveApplication(id);
  } catch {
    // Supabase row may not exist yet (local-only application); local approval is still valid.
  }
  pending.value = pending.value.filter((a) => a.id !== id);
  approved.value.push(updated);
}

async function reject(id: string) {
  const app = pending.value.find((a) => a.id === id);
  if (!app) return;
  const note = prompt('Reason for rejection (required):');
  if (!note || note.trim().length < 5) {
    alert('Please provide a reason (at least 5 characters).');
    return;
  }
  const updated = store.review(id, 'reject', note.trim(), 'Admin');
  if (!updated) return;
  try {
    await rejectApplication(id, note.trim());
  } catch {
    // Supabase row may not exist yet; local rejection is still valid.
  }
  pending.value = pending.value.filter((a) => a.id !== id);
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
