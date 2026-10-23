<template>
  <ion-page>
    <ScreenHeader title="Active Repair" default-href="/technician/requests" />
    <ion-content class="active-content">
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Active Repair</h1>
            <p class="fx-page__sub">Track your current job and update its progress.</p>
          </div>
          <span class="fx-pill fx-pill--progress">In Progress</span>
        </div>

        <div class="fx-split">
          <div>
            <MapCanvas
              :vh="200"
              height="200px"
              route="M 80 60 L 80 100 L 200 100 L 200 150"
              :markers="markers"
            >
              <div class="nav-card">
                <div class="nav-card__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                </div>
                <div class="nav-card__text">
                  <h4>Navigate to Customer</h4>
                  <p>1.2 km • ~12 min</p>
                </div>
                <div class="nav-card__go">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                </div>
              </div>
            </MapCanvas>

            <div class="fx-grid-2 active-cards">
              <div class="fx-card">
                <h4 class="card-title">Customer</h4>
                <div class="fx-info-row"><span class="fx-info-label">Name</span><span class="fx-info-value">Alex Rivera</span></div>
                <div class="fx-info-row"><span class="fx-info-label">Phone</span><span class="fx-info-value">+63 917 123 4567</span></div>
                <div class="fx-info-row"><span class="fx-info-label">Address</span><span class="fx-info-value">123 Mabini St</span></div>
              </div>
              <div class="fx-card">
                <h4 class="card-title">Device</h4>
                <div class="fx-info-row"><span class="fx-info-label">Device</span><span class="fx-info-value">iPhone 13</span></div>
                <div class="fx-info-row"><span class="fx-info-label">Problem</span><span class="fx-info-value">Not charging</span></div>
                <div class="fx-info-row"><span class="fx-info-label">Service</span><span class="fx-info-value" style="color: var(--secondary)">🏠 Home</span></div>
              </div>
            </div>
          </div>

          <aside>
            <div class="fx-card">
              <h4 class="card-title">Update Status</h4>
              <div class="status-actions">
                <button class="status-btn status-btn--primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                  On the Way
                </button>
                <button class="status-btn status-btn--secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /></svg>
                  Arrived
                </button>
                <button class="status-btn status-btn--secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /></svg>
                  Diagnosing
                </button>
                <button class="status-btn status-btn--secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6" /></svg>
                  Repairing
                </button>
                <button class="status-btn status-btn--success" @click="router.replace('/technician/dashboard')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  Mark Completed
                </button>
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
import MapCanvas from '../../components/MapCanvas.vue';
import type { MapMarker } from '../../types/map';

const router = useRouter();
const markers: MapMarker[] = [
  { x: 80, y: 60, kind: 'pulse', label: 'JD', color: '#146344' },
  { x: 200, y: 150, kind: 'dest' },
];
</script>

<style scoped>
.active-content { --background: var(--bg); }

.nav-card {
  position: absolute; top: 12px; left: 12px; right: 12px;
  background: #fff; border-radius: 14px; padding: 12px 14px;
  box-shadow: var(--shadow-md); display: flex; align-items: center; gap: 12px;
}
.nav-card__icon {
  width: 38px; height: 38px; background: var(--gradient-soft); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0;
}
.nav-card__text { flex: 1; min-width: 0; }
.nav-card__text h4 { font-size: 14px; font-weight: 700; color: var(--text-dark); margin: 0; }
.nav-card__text p { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
.nav-card__go {
  width: 36px; height: 36px; background: var(--gradient); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0;
}

.active-cards { margin-top: 20px; }
.card-title { font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0 0 10px; }

.status-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.status-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 10px; border-radius: 12px; font-size: 13px; font-weight: 700;
  font-family: inherit; cursor: pointer; border: 1.5px solid transparent;
  transition: all 0.2s ease;
}
.status-btn--primary { background: var(--primary); color: #fff; box-shadow: 0 6px 16px rgba(20, 99, 68, 0.22); }
.status-btn--primary:hover { background: var(--primary-dark); }
.status-btn--secondary { background: #fff; color: var(--primary); border-color: var(--hairline); }
.status-btn--secondary:hover { border-color: var(--primary); color: var(--primary-dark); }
.status-btn--success { grid-column: span 2; background: var(--success); color: #fff; }
.status-btn--success:hover { background: #128a3f; }

@media (max-width: 767px) {
  .status-actions { grid-template-columns: 1fr; }
  .status-btn--success { grid-column: auto; }
}
</style>
