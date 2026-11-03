<template>
  <ion-page>
    <ScreenHeader title="Messages" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head"><h1 class="fx-page__title">Messages</h1></div>
        <div class="fx-card"><h2 class="fx-section-title">No conversations available</h2><p class="fx-page__sub">Your repair conversations will appear here.</p></div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
</script>
