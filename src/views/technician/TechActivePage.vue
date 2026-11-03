<template>
  <ion-page>
    <ScreenHeader title="Active Repairs" default-href="/technician/requests" />
    <ion-content>
      <div class="fx-page">
        <h1 class="fx-page__title">Active Repairs</h1>
        <div class="fx-card"><h2 class="fx-section-title">No active repair available</h2><p class="fx-page__sub">Assigned repairs will appear here when available.</p></div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
</script>
