<template>
  <ion-page>
    <ScreenHeader
      :title="isHome ? 'Set Location' : 'Find Technicians'"
      default-href="/client/request"
    />
    <ion-content>
      <MapCanvas :vh="360" height="calc(100vh - 52px)" :markers="markers">
        <div class="map-top">
          <div class="map-top__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search location
          </div>
        </div>
        <div class="sheet">
          <div class="sheet__handle" />
          <div class="location">
            <div class="location__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <div class="location__label">{{ isHome ? 'Your Location' : 'Nearby Technicians' }}</div>
              <div class="location__address">{{ isHome ? '123 Mabini Street' : '3 technicians nearby' }}</div>
              <div class="location__sub">Makati City</div>
            </div>
          </div>
          <button v-if="isHome" class="gps-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
            </svg>
            Use My Current Location
          </button>
          <button class="fx-btn fx-btn-primary fx-btn--block" @click="router.push('/client/request/matching')">
            {{ isHome ? 'Confirm Location' : 'View Technicians' }}
          </button>
        </div>
      </MapCanvas>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import MapCanvas from '../../components/MapCanvas.vue';
import type { MapMarker } from '../../types/map';
import { useRepairDraft } from '../../stores/repair';

const router = useRouter();
const { draft } = useRepairDraft();
const isHome = computed(() => draft.serviceType === 'home');

const markers = computed<MapMarker[]>(() =>
  isHome.value
    ? [{ x: 200, y: 180, kind: 'dest' }]
    : [
        { x: 130, y: 130, kind: 'tech', label: 'JD', color: '#146344' },
        { x: 280, y: 160, kind: 'tech', label: 'MS', color: '#12C8C0' },
        { x: 80, y: 230, kind: 'tech', label: 'RC', color: '#146344' },
      ],
);
</script>

<style scoped>
.map-top { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: min(520px, calc(100% - 36px)); display: flex; gap: 8px; z-index: 10; }
.map-top__search {
  flex: 1; background: #fff; border-radius: 12px; padding: 13px 16px;
  display: flex; align-items: center; gap: 10px; color: var(--text-muted);
  box-shadow: var(--shadow-md); font-size: 14px;
}

.sheet {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: #fff; border-radius: 22px 22px 0 0;
  padding: 18px 24px 24px; box-shadow: 0 -6px 22px rgba(20, 99, 68, 0.12);
  max-width: 560px; margin: 0 auto;
}
.sheet__handle { width: 40px; height: 4px; background: var(--hairline); border-radius: 2px; margin: 0 auto 16px; }
.location { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
.location__icon {
  width: 44px; height: 44px; background: var(--gradient-soft); border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0;
}
.location__label { font-size: 13px; color: var(--text-muted); font-weight: 600; }
.location__address { font-size: 16px; font-weight: 700; color: var(--text-dark); margin: 4px 0; }
.location__sub { font-size: 13px; color: var(--text-muted); }

.gps-btn {
  width: 100%; padding: 13px; margin-bottom: 12px;
  background: var(--primary-light); border: 1.5px solid rgba(20, 99, 68, 0.2); border-radius: 12px;
  color: var(--primary); font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.gps-btn:hover { background: var(--primary-muted); }
</style>
