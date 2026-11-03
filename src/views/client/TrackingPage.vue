<template>
  <ion-page>
    <ScreenHeader title="Live Tracking" default-href="/client/home" />
    <ion-content>
      <div class="fx-page">
        <h1 class="fx-page__title">Live Tracking</h1>
        <div class="fx-card"><h2 class="fx-section-title">Tracking unavailable</h2><p class="fx-page__sub">No live technician location is available for a repair.</p></div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
</script>
