<template>
  <ion-page>
    <ScreenHeader title="Request Repair" default-href="/client/home" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Request a Repair</h1>
            <p class="fx-page__sub">Tell us about your device and the problem</p>
          </div>
        </div>

        <div class="fx-split">
          <div class="form-main">
            <div class="fx-card section">
              <h3 class="fx-section-title">Select Device</h3>
              <div class="device-grid">
                <div
                  v-for="d in devices"
                  :key="d.name"
                  class="device-option"
                  :class="{ selected: draft.device === d.name }"
                  @click="draft.device = d.name"
                >
                  <div class="device-option__icon">{{ d.icon }}</div>
                  <div class="device-option__name">{{ d.name }}</div>
                </div>
              </div>
            </div>

            <div class="fx-card section">
              <h3 class="fx-section-title">Device Details</h3>
              <div class="fx-field">
                <label class="fx-label">Device Brand</label>
                <select class="fx-input" v-model="draft.brand">
                  <option>Apple</option>
                  <option>Samsung</option>
                  <option>Xiaomi</option>
                  <option>Other</option>
                </select>
              </div>
              <div class="fx-field">
                <label class="fx-label">Device Model</label>
                <input class="fx-input" v-model="draft.model" placeholder="e.g. iPhone 13" />
              </div>
              <div class="fx-field section__last">
                <label class="fx-label">Describe the Problem</label>
                <textarea class="fx-input" v-model="draft.problem" placeholder="Phone is not charging." />
              </div>
            </div>

            <div class="fx-card section">
              <h3 class="fx-section-title">Upload Photo / Video</h3>
              <div class="upload">
                <div class="upload__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </div>
                <p><strong>Click to upload</strong> or drag and drop your files here</p>
              </div>
            </div>

            <div class="fx-card section">
              <h3 class="fx-section-title">Select Service Type</h3>
              <div class="service-type-grid">
                <div class="service-card service-card--home" :class="{ selected: draft.serviceType === 'home' }" @click="draft.serviceType = 'home'">
                  <span class="service-card__check">✓</span>
                  <div class="service-card__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                  </div>
                  <p class="service-card__title">Home Service</p>
                  <p class="service-card__desc">Technician comes to you</p>
                </div>
                <div class="service-card service-card--dropoff" :class="{ selected: draft.serviceType === 'dropoff' }" @click="draft.serviceType = 'dropoff'">
                  <span class="service-card__check">✓</span>
                  <div class="service-card__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                  </div>
                  <p class="service-card__title">Drop-off</p>
                  <p class="service-card__desc">Bring device to shop</p>
                </div>
              </div>
            </div>
          </div>

          <aside class="form-aside">
            <div class="fx-card">
              <h3 class="fx-section-title">Summary</h3>
              <div class="fx-info-row"><span class="fx-info-label">Device</span><span class="fx-info-value">{{ draft.device }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Brand</span><span class="fx-info-value">{{ draft.brand }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Model</span><span class="fx-info-value">{{ draft.model || '—' }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Service</span><span class="fx-info-value">{{ draft.serviceType === 'home' ? 'Home Service' : 'Drop-off' }}</span></div>
            </div>
            <button class="fx-btn fx-btn-primary fx-btn--block continue-btn" @click="router.push('/client/request/location')">Continue</button>
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
import { devices } from '../../data/mock';
import { useRepairDraft } from '../../stores/repair';

const router = useRouter();
const { draft } = useRepairDraft();
</script>

<style scoped>
.section { margin-bottom: 20px; }
.section__last { margin-bottom: 0; }

.device-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
.device-option {
  background: var(--surface); border: 1.5px solid var(--hairline);
  border-radius: 14px; padding: 16px 8px; text-align: center; cursor: pointer;
  transition: all 0.2s ease;
}
.device-option:hover { border-color: var(--primary); }
.device-option.selected { background: var(--gradient-soft); border-color: var(--primary); box-shadow: 0 6px 16px rgba(20, 99, 68, 0.12); }
.device-option__icon { font-size: 26px; margin-bottom: 6px; }
.device-option__name { font-size: 13px; font-weight: 700; color: var(--primary); }

.upload {
  background: var(--surface); border: 1.5px dashed rgba(20, 99, 68, 0.3);
  border-radius: 14px; padding: 22px; text-align: center; cursor: pointer;
  color: var(--text-muted);
}
.upload:hover { border-color: var(--primary); background: var(--primary-light); }
.upload__icon {
  width: 44px; height: 44px; margin: 0 auto 10px;
  background: var(--gradient-soft); border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: var(--primary);
}
.upload p { margin: 0; font-size: 13px; }
.upload strong { color: var(--primary); }

.service-type-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.service-card {
  background: var(--surface); border: 2px solid var(--hairline);
  border-radius: var(--radius-md); padding: 20px 14px; text-align: center;
  cursor: pointer; position: relative; transition: all 0.2s ease;
}
.service-card:hover { border-color: var(--primary); }
.service-card.selected { border-color: var(--primary); background: var(--gradient-soft); box-shadow: 0 6px 16px rgba(20, 99, 68, 0.15); }
.service-card__check {
  position: absolute; top: 12px; right: 12px;
  width: 22px; height: 22px; background: var(--primary); color: #fff;
  border-radius: 50%; display: none; align-items: center; justify-content: center; font-size: 12px;
}
.service-card.selected .service-card__check { display: flex; }
.service-card__icon {
  width: 48px; height: 48px; margin: 0 auto 10px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.service-card--home .service-card__icon { background: var(--primary); }
.service-card--dropoff .service-card__icon { background: var(--accent); }
.service-card__title { font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0 0 4px; }
.service-card__desc { font-size: 12px; color: var(--text-muted); margin: 0; line-height: 1.4; }

.form-aside { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 20px; }
.continue-btn { width: 100%; }

@media (max-width: 767px) {
  .form-aside { position: static; }
}
</style>
