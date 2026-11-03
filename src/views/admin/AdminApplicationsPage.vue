<template>
  <ion-page>
    <ScreenHeader title="Technician Applications" :show-back="false" />
    <ion-content>
      <div class="fx-page fx-page--wide">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Technician Applications</h1>
            <p class="fx-page__sub">Review, request information, and approve technician applications</p>
          </div>
          <span class="fx-pill fx-pill--accent">{{ store.all().length }} total</span>
        </div>

        <div class="fx-stat-grid apps__stats">
          <div v-for="s in STATUS_ORDER" :key="s" class="fx-stat">
            <div class="fx-stat__icon" :class="STATUS_META[s].pill">
              <i :data-lucide="STATUS_META[s].icon"></i>
            </div>
            <p class="fx-stat__value">{{ counts[s] }}</p>
            <p class="fx-stat__label">{{ s }}</p>
          </div>
        </div>

        <div class="apps__toolbar">
          <div class="apps__search">
            <i data-lucide="search" class="apps__search-ico"></i>
            <input v-model="query" type="text" placeholder="Search by name, email, or reference…" />
          </div>
          <div class="apps__filters">
            <button
              v-for="f in filters"
              :key="f"
              class="chip"
              :class="{ 'chip--on': filter === f }"
              @click="filter = f"
            >{{ f }}</button>
          </div>
        </div>

        <div class="fx-table">
          <div v-if="filtered.length === 0" class="apps__empty">
            <i data-lucide="inbox" class="apps__empty-ico"></i>
            <p>No applications match your filters.</p>
          </div>
          <div v-for="app in filtered" :key="app.id" class="fx-table__row apps__row" @click="open(app)">
            <div class="fx-table__avatar">{{ initialsOf(app.applicant.fullName) }}</div>
            <div class="fx-table__info">
              <p class="fx-table__name">{{ app.applicant.fullName }}</p>
              <p class="fx-table__sub">{{ app.applicant.email }} · {{ app.applicant.city }}</p>
            </div>
            <div class="apps__meta">
              <p class="apps__meta-top">{{ app.professional.yearsExperience }} yr(s) · {{ app.service.serviceType }}</p>
              <p class="apps__meta-sub">Submitted {{ formatDate(app.createdAt) }}</p>
            </div>
            <span class="fx-pill" :class="STATUS_META[app.status].pill">{{ app.status }}</span>
            <button class="fx-btn fx-btn-secondary fx-btn--sm" @click.stop="open(app)">Review</button>
          </div>
        </div>
      </div>
    </ion-content>

    <ApplicationReviewModal :application="selected" @close="selected = null" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import ApplicationReviewModal from '../../components/technician/ApplicationReviewModal.vue';
import {
  STATUS_META,
  STATUS_ORDER,
  formatDate,
  initialsOf,
  type ApplicationStatus,
  type TechnicianApplication,
} from '../../data/technicianApplication';
import { useTechnicianApplications } from '../../stores/technicianApplications';

const store = useTechnicianApplications();

const query = ref('');
const selected = ref<TechnicianApplication | null>(null);

type Filter = 'All' | ApplicationStatus;
const filters: Filter[] = ['All', ...STATUS_ORDER];
const filter = ref<Filter>('All');

const counts = computed(() => store.counts());

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return store
    .all()
    .filter((a) => (filter.value === 'All' ? true : a.status === filter.value))
    .filter((a) => {
      if (!q) return true;
      return (
        a.applicant.fullName.toLowerCase().includes(q) ||
        a.applicant.email.toLowerCase().includes(q) ||
        a.applicant.city.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    });
});

function open(app: TechnicianApplication) {
  selected.value = app;
}

let iconTimer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
    iconTimer = setInterval(() => lucide.createIcons(), 600);
  }
});
onUnmounted(() => {
  if (iconTimer) clearInterval(iconTimer);
});
</script>

<style scoped>
.apps__stats { margin-bottom: 22px; }
.fx-stat__icon :deep(svg) { width: 18px; height: 18px; }
.apps__toolbar { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.apps__search { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid var(--hairline); border-radius: 12px; padding: 10px 14px; min-width: min(280px, 100%); flex: 1; max-width: 420px; }
.apps__search-ico { width: 16px; height: 16px; color: var(--text-muted); }
.apps__search input { min-width: 0; border: none; outline: none; background: transparent; font-family: inherit; font-size: 14px; width: 100%; color: var(--text-dark); }
.apps__filters { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 8px 14px; border-radius: 999px; border: 1.5px solid var(--hairline); background: #fff; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--text-dark); cursor: pointer; transition: all 0.15s ease; }
.chip:hover { border-color: rgba(20, 99, 68, 0.35); }
.chip--on { background: var(--primary); border-color: var(--primary); color: #fff; }
.apps__row { cursor: pointer; }
.apps__row:hover { background: rgba(20, 99, 68, 0.03); }
.apps__meta { text-align: right; min-width: 150px; }
.apps__meta-top { font-size: 13px; font-weight: 600; color: var(--text-dark); margin: 0; }
.apps__meta-sub { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
.apps__empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 20px; color: var(--text-muted); font-size: 14px; }
.apps__empty-ico { width: 32px; height: 32px; }

@media (max-width: 767px) {
  .apps__meta { display: none; }
  .apps__search { max-width: none; }
}
</style>
