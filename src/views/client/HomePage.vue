<template>
  <ion-page>
    <ion-content class="home-content">
      <div class="fx-page">
        <section class="fx-hero">
          <div class="fx-hero-body hero">
            <div class="hero__text">
              <p class="hero__eyebrow">Good morning 👋</p>
              <h1 class="hero__title">Hello, {{ firstName }}!</h1>
              <p class="hero__sub">What does your device need today?</p>
              <label class="hero__search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input placeholder="Search device or issue..." />
              </label>
            </div>
            <button class="fx-btn fx-btn-accent hero__cta" @click="router.push('/client/request')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              {{ hasDraft ? 'Continue Repair Draft' : 'Request a Repair' }}
            </button>
          </div>
        </section>

        <div class="fx-stat-grid intro-stats">
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <p class="fx-stat__value">{{ repairState.requests.length }}</p>
            <p class="fx-stat__label">Requests Saved Locally</p>
          </div>
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p class="fx-stat__value">{{ repairState.requests.length }}</p>
            <p class="fx-stat__label">Pending · Local Only</p>
          </div>
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--orange">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.6 5.8 21 7 14 2 9.3 9 8.5 12 2" /></svg>
            </div>
            <p class="fx-stat__value">{{ photoCount }}</p>
            <p class="fx-stat__label">Photos Attached</p>
          </div>
        </div>

        <section class="saved-requests">
          <h2 class="fx-section-title fx-section-title--lg">Your submitted requests</h2>
          <RepairSaveStatus />
          <LocalRepairRequests v-if="repairState.requests.length" :requests="repairState.requests.slice(0, 3)" />
          <p v-else class="saved-requests__empty">No local requests submitted yet. Start a repair request to save one here.</p>
        </section>

        <div class="fx-split">
          <div>
            <h3 class="fx-section-title fx-section-title--lg" style="margin-top: 28px">Device Categories</h3>
            <div class="fx-grid-3">
              <button v-for="c in categories" :key="c.name" class="fx-card fx-card--sm fx-card--interactive category" @click="startRequest(c.name)">
                <span class="category__icon" v-html="c.icon" />
                <span class="category__name">{{ c.name }}</span>
              </button>
            </div>
          </div>

          <aside>
            <div class="fx-card fx-card--interactive care-tile" @click="router.push('/client/care')">
              <div class="care-tile__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="4.93" y1="4.93" x2="9.17" y2="9.17" /><line x1="14.83" y1="14.83" x2="19.07" y2="19.07" /><line x1="14.83" y1="9.17" x2="19.07" y2="4.93" /><line x1="4.93" y1="19.07" x2="9.17" y2="14.83" /></svg>
              </div>
              <div class="care-tile__body">
                <p class="care-tile__title">FIXHUB Care</p>
                <p class="care-tile__desc">Step-by-step fixes for common problems</p>
              </div>
              <span class="care-tile__arrow">›</span>
            </div>

            <h3 class="fx-section-title fx-section-title--lg">Service Types</h3>
            <div class="services">
              <div class="fx-card fx-card--interactive service-tile" @click="startRequest(undefined, 'home')">
                <div class="service-tile__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                </div>
                <div>
                  <p class="service-tile__title">Home Service</p>
                  <p class="service-tile__desc">Verified technicians come to you</p>
                </div>
              </div>
              <div class="fx-card fx-card--interactive service-tile" @click="startRequest(undefined, 'dropoff')">
                <div class="service-tile__icon service-tile__icon--amber">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" /></svg>
                </div>
                <div>
                  <p class="service-tile__title">Drop-off</p>
                  <p class="service-tile__desc">Bring your device to the shop</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
import { useAuth } from '../../stores/auth';
import { categories } from '../../data/catalog';
import RepairSaveStatus from '../../components/repair/RepairSaveStatus.vue';
import LocalRepairRequests from '../../components/repair/LocalRepairRequests.vue';
import { useRepairDraft } from '../../stores/repair';
import type { ServiceType } from '../../data/repair';

const router = useRouter();
const { profile: getProfile } = useAuth();
const firstName = computed(() => getProfile().name.split(' ')[0]);
const { draft, state: repairState, initialize } = useRepairDraft();
const hasDraft = computed(() => !!(draft.brand || draft.model || draft.problem || draft.photos.length));
const photoCount = computed(() => repairState.requests.reduce((total, request) => total + request.photos.length, 0));
async function startRequest(device?: string, service?: ServiceType) {
  await initialize();
  if (device) draft.device = device;
  if (service) draft.serviceType = service;
  router.push('/client/request');
}
onMounted(initialize);
onIonViewWillEnter(initialize);
</script>

<style scoped>
.home-content { --background: var(--bg); }

.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.hero__eyebrow { font-size: 14px; opacity: 0.85; margin: 0 0 4px; }
.hero__title { font-size: 30px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
.hero__sub { font-size: 15px; opacity: 0.85; margin: 6px 0 18px; }
.hero__search {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255, 255, 255, 0.95); border-radius: 12px;
  padding: 12px 16px; max-width: 420px; color: var(--text-muted);
}
.hero__search input { flex: 1; border: none; outline: none; background: transparent; font-family: inherit; font-size: 14px; color: var(--text-dark); }
.hero__cta { flex-shrink: 0; }

.intro-stats { margin: 24px 0 32px; }
.saved-requests { margin-bottom: 32px; }
.saved-requests__empty { font-size: 13px; color: var(--text-muted); }

.active-card { cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.active-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.active-card__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.active-card__device { font-size: 20px; font-weight: 800; color: var(--text-dark); margin: 10px 0 4px; }
.active-card__status { font-size: 13px; color: var(--text-muted); }
.active-card__view { font-size: 13px; font-weight: 700; color: var(--primary); }
.active-card__bar { height: 8px; background: rgba(20, 99, 68, 0.08); border-radius: 999px; overflow: hidden; margin: 6px 0 16px; }
.active-card__bar span { display: block; height: 100%; width: 62%; background: var(--gradient); border-radius: 999px; }
.active-card__foot { display: flex; align-items: center; justify-content: space-between; }
.active-card__tech { display: flex; align-items: center; gap: 10px; }
.active-card__tech-name { font-size: 14px; font-weight: 700; color: var(--text-dark); margin: 0; }
.active-card__tech-sub { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }

.category { display: flex; align-items: center; gap: 12px; text-align: left; border: 1px solid var(--hairline); }
.category__icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  background: var(--gradient-soft); color: var(--primary);
  display: flex; align-items: center; justify-content: center;
}
.category__name { font-size: 14px; font-weight: 700; color: var(--text-dark); }

.services { display: flex; flex-direction: column; gap: 14px; }
.service-tile { display: flex; align-items: center; gap: 14px; cursor: pointer; }
.service-tile__icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  background: var(--primary-light); color: var(--primary);
  display: flex; align-items: center; justify-content: center;
}
.service-tile__icon--amber { background: rgba(247, 157, 31, 0.15); color: var(--accent); }
.service-tile__title { font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0 0 2px; }
.service-tile__desc { font-size: 13px; color: var(--text-muted); margin: 0; }

.care-tile { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; border: 1px solid rgba(20, 99, 68, 0.16); background: var(--gradient-soft, var(--primary-light)); }
.care-tile__icon {
  width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
  background: var(--gradient); color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.care-tile__body { flex: 1; min-width: 0; }
.care-tile__title { font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0 0 2px; }
.care-tile__desc { font-size: 13px; color: var(--text-muted); margin: 0; }
.care-tile__arrow { color: var(--primary); font-size: 20px; }

@media (max-width: 767px) {
  .hero__title { font-size: 24px; }
  .hero__cta { width: 100%; }
}
</style>
