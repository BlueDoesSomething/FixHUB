<template>
  <ion-page>
    <ScreenHeader title="Repair Status" default-href="/client/home" />
    <ion-content>
      <div class="fx-page">
        <h1 class="fx-page__title">Repair Status</h1>
        <div class="fx-card"><h2 class="fx-section-title">No repair selected</h2><p class="fx-page__sub">Open a saved request from Repair History to view its details.</p><RouterLink class="fx-btn fx-btn-primary" to="/client/history">View Repair History</RouterLink></div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { RouterLink } from 'vue-router';
import ScreenHeader from '../../components/ScreenHeader.vue';
</script>
