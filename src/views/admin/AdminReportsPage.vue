<template>
  <ion-page>
    <ScreenHeader title="Reports & Analytics" :show-back="false" />
    <ion-content>
      <div class="fx-page fx-page--wide">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Reports &amp; Analytics</h1>
            <p class="fx-page__sub">Revenue and repair performance overview</p>
          </div>
        </div>

        <div class="fx-stat-grid reports__stats">
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p class="fx-stat__value">₱125K</p>
            <p class="fx-stat__label">Monthly Revenue</p>
          </div>
          <div class="fx-stat">
            <div class="fx-stat__icon fx-stat__icon--blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6" /></svg>
            </div>
            <p class="fx-stat__value">842</p>
            <p class="fx-stat__label">Total Repairs</p>
          </div>
        </div>

        <div class="fx-card reports__chart">
          <h4 class="chart-title">Service Type Distribution</h4>
          <BarChart :data="distribution" :chart-height="220" />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import BarChart from '../../components/BarChart.vue';

const distribution = [
  { label: 'Home', height: 70, color: 'var(--secondary)' },
  { label: 'Drop-off', height: 50, color: 'var(--accent)' },
];
</script>

<style scoped>
.reports__stats { margin-bottom: 20px; }
.chart-title { font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0 0 16px; }
</style>
