<template>
  <ion-page>
    <ScreenHeader title="More" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">More</h1>
            <p class="fx-page__sub">Access your account and active services</p>
          </div>
        </div>

        <div class="fx-grid-3">
          <div v-for="item in items" :key="item.label" class="fx-card fx-card--interactive tile" @click="router.push(item.route)">
            <div class="tile__icon" v-html="item.icon" />
            <div class="tile__name">{{ item.label }}</div>
            <span class="tile__arrow">›</span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';

const router = useRouter();

const svg = (paths: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${paths}</svg>`;

const items = [
  { label: 'Profile', route: '/client/profile', icon: svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>') },
  { label: 'FIXHUB Care', route: '/client/care', icon: svg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>') },
  { label: 'Repair Status', route: '/client/home/status', icon: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>') },
  { label: 'Live Tracking', route: '/client/home/tracking', icon: svg('<polygon points="3 11 22 2 13 21 11 13 3 11"/>') },
  { label: 'Location', route: '/client/request/location', icon: svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>') },
  { label: 'Become a Technician', route: '/become-a-technician', icon: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>') },
];
</script>

<style scoped>
.tile { display: flex; align-items: center; gap: 14px; border: 1px solid var(--hairline); }
.tile__icon {
  width: 48px; height: 48px; flex-shrink: 0; background: var(--gradient-soft);
  border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary);
}
.tile__name { flex: 1; font-size: 15px; font-weight: 700; color: var(--text-dark); }
.tile__arrow { color: var(--text-muted); font-size: 20px; }
</style>
