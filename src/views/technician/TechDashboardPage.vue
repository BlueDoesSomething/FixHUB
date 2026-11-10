<template>
  <ion-page>
    <ion-content :fullscreen="true" class="tech-content">
      <div class="fx-page">
        <section class="fx-hero">
          <div class="fx-hero-body dash-hero">
            <div class="dash-hero__text">
              <p class="dash-hero__eyebrow">Good Morning 👋</p>
              <h1 class="dash-hero__name">{{ profile.name }}</h1>
              <p class="dash-hero__role">Field Technician · FIXHUB</p>
            </div>
          </div>
        </section>

        <div class="fx-stat-grid dash-stats">
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <p class="fx-stat__value">—</p>
            <p class="fx-stat__label">Jobs Today</p>
          </div>
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--orange">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
            </div>
            <p class="fx-stat__value">—</p>
            <p class="fx-stat__label">Pending Requests</p>
          </div>
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.6 5.8 21 7 14 2 9.3 9 8.5 12 2" /></svg>
            </div>
            <p class="fx-stat__value">{{ reviewSummary.average?.toFixed(1) ?? '—' }}★</p>
            <p class="fx-stat__label">Avg. Rating · {{ reviewSummary.total }} reviews</p>
          </div>
        </div>

        <TechnicianLocationCard v-if="authState.session" :key="authState.session.userId" ref="locationCard" :active="active" />

        <div class="fx-split dash-split">
          <div>
            <h3 class="fx-section-title fx-section-title--lg">Incoming Requests</h3>
            <div class="fx-table">
              <p class="fx-page__sub">No incoming requests available.</p>
            </div>
            <button class="fx-btn fx-btn-primary requests-cta" @click="router.push('/technician/requests')">View All Requests</button>
          </div>

          <aside>
            <h3 class="fx-section-title fx-section-title--lg">Quick Actions</h3>
            <button class="fx-btn fx-btn-primary fx-btn--block" @click="router.push('/technician/requests')">View New Requests</button>
            <button class="fx-btn fx-btn-secondary fx-btn--block action-secondary" @click="router.push('/technician/reviews')">Customer Reviews</button>

            <h3 class="fx-section-title fx-section-title--lg recent-title">Recent Activity</h3>
            <div class="fx-card"><p class="fx-page__sub">No recent activity available.</p></div>
          </aside>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, onIonViewWillEnter, onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue';
import { useAuth } from '../../stores/auth';
import { technicians } from '../../data/catalog';
import { useReviews } from '../../stores/reviews';
import TechnicianLocationCard from '../../components/technician/TechnicianLocationCard.vue';

const router = useRouter();
const { profile: getProfile, state: authState } = useAuth();
const locationCard = ref<InstanceType<typeof TechnicianLocationCard> | null>(null);
const active = ref(true);
const profile = computed(getProfile);
const { summary, refresh, state: reviewState } = useReviews();
const reviewSummary = computed(() => summary(
  technicians.find(tech => tech.name === profile.value.name)?.id
  ?? reviewState.myTechnicianProfileId
  ?? -1,
));
onIonViewWillEnter(() => {
  active.value = true;
  void locationCard.value?.refresh();
  // Shared ratings arrive from FIXHUB; the computed summary follows reviewState.
  void refresh();
});
onIonViewDidEnter(() => locationCard.value?.resize());
onIonViewDidLeave(() => { active.value = false; });
</script>

<style scoped>
.tech-content { --background: var(--bg); }

.dash-hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.dash-hero__eyebrow { font-size: 14px; opacity: 0.85; margin: 0 0 4px; }
.dash-hero__name { font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
.dash-hero__role { font-size: 14px; opacity: 0.85; margin: 6px 0 0; }

.avail {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 16px 8px 8px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.18); cursor: pointer;
  font-size: 13px; font-weight: 700; color: #fff;
  transition: background 0.2s ease;
}
.avail:hover { background: rgba(255, 255, 255, 0.28); }
.avail--off { opacity: 0.9; }
.switch {
  width: 44px; height: 24px; background: var(--success);
  border-radius: 999px; position: relative; transition: background 0.2s ease; flex-shrink: 0;
}
.switch::after {
  content: ''; position: absolute; width: 18px; height: 18px; background: #fff;
  border-radius: 50%; top: 3px; right: 3px; transition: all 0.2s ease;
}
.switch.off { background: rgba(255, 255, 255, 0.45); }
.switch.off::after { right: 23px; }

.dash-stats { margin-bottom: 28px; }

.requests-cta { margin-top: 16px; }
.action-secondary { margin-top: 10px; }
.recent-title { margin-top: 28px; }

.activity { border-left: 4px solid var(--success); }
.activity__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.activity__user { display: flex; align-items: center; gap: 12px; }
.activity__user h4 { font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0; }
.activity__user p { font-size: 13px; color: var(--text-muted); margin: 3px 0 0; }
.activity__details { background: var(--bg); border-radius: 12px; padding: 12px 14px; }
.activity__details div { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; padding: 5px 0; }
.activity__details span { color: var(--text-muted); }
.activity__details strong { color: var(--text-dark); font-weight: 700; }

@media (max-width: 767px) {
  .dash-hero__name { font-size: 24px; }
}
</style>
