<template>
  <ion-page>
    <ion-content>
      <div class="fx-page fx-page--wide">
        <section class="fx-hero">
          <div class="fx-hero-body hero">
            <div>
              <p class="hero__eyebrow">Admin Control Center</p>
              <h1 class="hero__title">Admin Dashboard</h1>
              <p class="hero__sub">FIXHUB network at a glance</p>
            </div>
            <InitialAvatar :initials="profile.initials" :gradient="profile.color" :size="56" />
          </div>
        </section>

        <div class="fx-stat-grid dashboard__stats">
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            </div>
            <p class="fx-stat__value">{{ overview?.users ?? '—' }}</p>
            <p class="fx-stat__label">Total Users</p>
          </div>
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--teal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6" /></svg>
            </div>
            <p class="fx-stat__value">{{ overview?.technicians ?? '—' }}</p>
            <p class="fx-stat__label">Technicians</p>
          </div>
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--orange">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <p class="fx-stat__value">{{ overview?.activeRepairs ?? '—' }}</p>
            <p class="fx-stat__label">Active Repairs</p>
          </div>
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p class="fx-stat__value">{{ overview?.completed ?? '—' }}</p>
            <p class="fx-stat__label">Completed</p>
          </div>
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--orange">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="15" y2="16" /></svg>
            </div>
            <p class="fx-stat__value">{{ overview?.applications ?? '—' }}</p>
            <p class="fx-stat__label">Applications</p>
          </div>
        </div>

        <div v-if="overviewError || applicationsError" class="dashboard__error" role="alert">
          <p v-if="overviewError">{{ overviewError }}</p>
          <p v-if="applicationsError">{{ applicationsError }}</p>
          <button type="button" class="fx-btn fx-btn-secondary fx-btn--sm" @click="load">Retry</button>
        </div>
        <p v-if="loading" role="status" class="dashboard__loading">Loading dashboard from Supabase…</p>
        <TopTechnicians class="dashboard__section" :technicians="overview?.topTechnicians ?? []" :loading="!overview" />

        <div class="fx-grid-2 dashboard__section">
          <div class="fx-card">
            <h4 class="chart-title">Weekly Repairs</h4>
            <div v-if="overview?.weekly.some(day => day.total)" class="weekly-chart">
              <div v-for="day in overview.weekly" :key="day.day" class="weekly-chart__day">
                <strong>{{ day.total }}</strong>
                <div class="weekly-chart__bar" :style="{ height: `${Math.max(8, day.total / weeklyMax * 100)}%` }" />
                <span>{{ day.day.slice(5, 10) }}</span>
              </div>
            </div>
            <p v-else-if="overview" class="apps-empty">No repair activity available.</p>
          </div>

          <div class="fx-table">
            <h4 class="fx-table__title">Recent Requests</h4>
            <p v-if="overview && !overview.recent.length" class="apps-empty">No requests available.</p>
            <div v-for="request in overview?.recent ?? []" :key="request.id" class="fx-table__row">
              <div class="fx-table__info"><p class="fx-table__name">{{ request.brand }} {{ request.device }}</p>
                <p class="fx-table__sub">{{ request.reference }} · {{ request.customer }} · {{ new Date(request.createdAt).toLocaleDateString('en-PH') }}</p></div>
              <span class="fx-pill">{{ request.status.replaceAll('_', ' ') }}</span>
            </div>
          </div>
        </div>

        <div class="fx-table dashboard__section">
          <h4 class="fx-table__title">Technician Applications <span class="see-all" @click="router.push('/admin/applications')">View All</span></h4>
          <div v-if="!applicationsError && !loading && pendingApps.length === 0" class="apps-empty">No applications waiting for review.</div>
          <div v-for="app in pendingApps" :key="app.id" class="fx-table__row">
            <div class="fx-table__avatar">{{ initialsOf(app.applicant.fullName) }}</div>
            <div class="fx-table__info">
              <p class="fx-table__name">{{ app.applicant.fullName }}</p>
              <p class="fx-table__sub">{{ app.applicant.city }} · {{ app.professional.yearsExperience }} yr(s) · {{ app.service.serviceType }}</p>
            </div>
            <span class="fx-pill" :class="STATUS_META[app.status].pill">{{ app.status }}</span>
            <button class="fx-btn fx-btn-secondary fx-btn--sm" @click="router.push('/admin/applications')">Review</button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import InitialAvatar from '../../components/InitialAvatar.vue';
import TopTechnicians from '../../components/admin/TopTechnicians.vue';
import { STATUS_META, initialsOf } from '../../data/technicianApplication';
import { fetchAdminApplications, fetchOverview, type Overview } from '../../services/adminAnalytics';
import type { TechnicianApplication } from '../../data/technicianApplication';
import { useAuth } from '../../stores/auth';

const router = useRouter();
const overview = ref<Overview | null>(null);
const applications = ref<TechnicianApplication[]>([]);
const overviewError = ref('');
const applicationsError = ref('');
const loading = ref(false);
const profile = computed(() => useAuth().profile());
const weeklyMax = computed(() => Math.max(1, ...(overview.value?.weekly.map(day => day.total) ?? [])));

async function load() {
  loading.value = true;
  overviewError.value = '';
  applicationsError.value = '';
  const [summary, apps] = await Promise.allSettled([fetchOverview(), fetchAdminApplications()]);
  if (summary.status === 'fulfilled') overview.value = summary.value;
  else overviewError.value = 'Unable to load Overview from Supabase. Please retry or check that the database migrations are deployed.';
  if (apps.status === 'fulfilled') applications.value = apps.value;
  else applicationsError.value = 'Unable to load applications from Supabase. Please retry or check the application documents bucket.';
  loading.value = false;
}

onMounted(() => { void load(); });

const pendingApps = computed(() =>
  applications.value
    .filter((a) => a.status === 'Pending' || a.status === 'Under Review')
    .slice(0, 4),
);
</script>

<style scoped>
.hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.hero > div:first-child { flex: 1; min-width: 0; }
.hero__eyebrow { font-size: 14px; opacity: 0.85; margin: 0 0 4px; }
.hero__title { font-size: 30px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
.hero__sub { font-size: 15px; opacity: 0.85; margin: 6px 0 0; }

.dashboard__stats { margin-bottom: 24px; }
.dashboard__section { margin-bottom: 12px; }
.dashboard__section + .dashboard__section { margin-top: 12px; }
.apps-empty { padding: 28px 0; text-align: center; color: var(--text-muted); font-size: 14px; }
.dashboard__error { padding: 14px 18px; margin-bottom: 16px; color: #7f1d1d; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; }
.dashboard__error p { margin: 0 0 8px; }
.dashboard__loading { color: var(--text-dark); margin-bottom: 16px; }

.chart-title { display: flex; align-items: center; justify-content: space-between; font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0 0 16px; }
.chart-title span { color: var(--success); font-size: 13px; font-weight: 700; }
.weekly-chart { display: flex; gap: 8px; height: 165px; align-items: end; }
.weekly-chart__day { flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: end; gap: 5px; font-size: 11px; color: var(--text-muted); }
.weekly-chart__bar { width: 100%; max-width: 40px; min-height: 8px; background: var(--primary); border-radius: 4px 4px 0 0; }

@media (max-width: 767px) {
  .hero { gap: 16px; align-items: flex-start; }
  .hero__title { font-size: 24px; }
  .hero__sub { font-size: 13px; line-height: 1.7; }
}
</style>
