<template>
  <ion-page>
    <ScreenHeader title="Live Tracking" default-href="/client/home">
      <template #end>
        <ion-button fill="clear" size="small" @click="router.push('/client/messages/chat')">
          <ion-icon slot="icon-only" :icon="chatbubbleOutline" />
        </ion-button>
      </template>
    </ScreenHeader>
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Live Tracking</h1>
            <p class="fx-page__sub">Follow your technician in real time</p>
          </div>
        </div>

        <div class="fx-split">
          <div class="map-wrap">
            <MapCanvas
              :vh="300"
              height="300px"
              route="M 100 80 L 100 150 L 200 150 L 200 220"
              :markers="markers"
            >
              <div class="track-card">
                <div class="fx-avatar">JD</div>
                <div class="track-card__text">
                  <h4>Juan Dela Cruz</h4>
                  <p class="track-card__status">On the way</p>
                  <p class="track-card__dist">1.5 km away</p>
                </div>
                <div class="track-card__btn" @click="router.push('/client/messages/chat')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
              </div>
            </MapCanvas>
          </div>

          <aside class="track-aside">
            <div class="fx-card eta">
              <div class="eta__item"><div class="eta__v">1.5 km</div><div class="eta__l">Distance</div></div>
              <div class="eta__div" />
              <div class="eta__item"><div class="eta__v">~12 min</div><div class="eta__l">ETA</div></div>
              <div class="eta__div" />
              <div class="eta__item"><div class="eta__v">9:53</div><div class="eta__l">Arrival</div></div>
            </div>

            <div class="fx-card">
              <h3 class="fx-section-title">Progress</h3>
              <StatusTimeline :items="repairTimeline" />
            </div>
          </aside>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonButton, IonIcon } from '@ionic/vue';
import { chatbubbleOutline } from 'ionicons/icons';
import ScreenHeader from '../../components/ScreenHeader.vue';
import MapCanvas from '../../components/MapCanvas.vue';
import type { MapMarker } from '../../types/map';
import StatusTimeline from '../../components/StatusTimeline.vue';
import { repairTimeline } from '../../data/mock';

const router = useRouter();
const markers: MapMarker[] = [
  { x: 200, y: 220, kind: 'dest' },
  { x: 100, y: 150, kind: 'pulse', label: 'JD', color: '#146344' },
];
</script>

<style scoped>
.map-wrap {
  border-radius: 16px; overflow: hidden;
  border: 1px solid var(--hairline); box-shadow: var(--shadow-sm);
}

.track-card {
  position: absolute; top: 16px; left: 16px; right: 16px;
  background: #fff; border-radius: 14px; padding: 14px 16px;
  box-shadow: var(--shadow-md);
  display: flex; align-items: center; gap: 14px;
}
.track-card .fx-avatar {
  width: 44px; height: 44px; font-size: 15px; background: var(--gradient);
}
.track-card__text { flex: 1; }
.track-card__text h4 { font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0; }
.track-card__status {
  font-size: 13px; color: var(--accent); font-weight: 700; margin: 3px 0;
  display: flex; align-items: center; gap: 6px;
}
.track-card__status::before { content: ''; width: 7px; height: 7px; background: var(--accent); border-radius: 50%; }
.track-card__dist { font-size: 13px; color: var(--text-muted); margin: 0; }
.track-card__btn {
  width: 40px; height: 40px; background: var(--primary-light); border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: var(--primary); cursor: pointer;
}
.track-card__btn:hover { background: var(--primary-muted); }

.track-aside { display: flex; flex-direction: column; gap: 20px; }
.eta {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--gradient-soft);
}
.eta__item { text-align: center; flex: 1; }
.eta__v { font-size: 20px; font-weight: 800; color: var(--primary); }
.eta__l { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.eta__div { width: 1px; height: 32px; background: var(--hairline); }
</style>
