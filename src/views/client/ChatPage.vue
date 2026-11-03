<template>
  <ion-page>
    <ScreenHeader title="Conversation" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-card"><h1 class="fx-page__title">No conversation selected</h1><p class="fx-page__sub">Open an existing conversation from Messages to continue.</p></div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
</script>
