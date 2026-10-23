<template>
  <ion-page>
    <ScreenHeader title="Repair Status" default-href="/client/home" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Repair Status</h1>
            <p class="fx-page__sub">Track the progress of your repair</p>
          </div>
        </div>

        <div class="fx-split">
          <div class="status-main">
            <div class="fx-card device-card">
              <div class="device-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" /></svg>
              </div>
              <div>
                <div class="device-card__label">DEVICE</div>
                <div class="device-card__name">iPhone 13</div>
                <div class="device-card__sub">Apple • 128GB</div>
              </div>
            </div>

            <div class="fx-card">
              <h4 class="fx-section-title">Details</h4>
              <div class="fx-info-row"><span class="fx-info-label">Problem</span><span class="fx-info-value">Not charging</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Technician</span><span class="fx-info-value">Juan Dela Cruz ★ 4.9</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Service</span><span class="fx-info-value service-value">🏠 Home</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Status</span><span class="fx-info-value status-value">● In Progress</span></div>
            </div>
          </div>

          <aside>
            <div class="fx-card">
              <h3 class="fx-section-title">Actions</h3>
              <div class="actions">
                <button class="fx-btn fx-btn-secondary" @click="router.push('/client/messages/chat')">💬 Chat</button>
                <button class="fx-btn fx-btn-primary">📞 Call</button>
              </div>
            </div>
          </aside>
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
</script>

<style scoped>
.status-main { display: flex; flex-direction: column; gap: 20px; }
.device-card { background: var(--gradient-soft); display: flex; align-items: center; gap: 16px; }
.device-card__icon {
  width: 56px; height: 56px; background: #fff; border-radius: 14px; color: var(--primary);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.device-card__label { font-size: 12px; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px; }
.device-card__name { font-size: 18px; font-weight: 800; color: var(--text-dark); margin-top: 2px; }
.device-card__sub { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.service-value { color: var(--primary); }
.status-value { color: var(--accent); }
.actions { display: flex; gap: 12px; }
.actions .fx-btn { flex: 1; }
</style>
