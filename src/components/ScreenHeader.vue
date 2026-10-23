<template>
  <ion-header :translucent="false" class="fx-header">
    <ion-toolbar>
      <ion-buttons v-if="showBack" slot="start">
        <ion-back-button :default-href="defaultHref" :text="''" />
      </ion-buttons>
      <ion-title>{{ title }}</ion-title>
      <ion-buttons slot="end">
        <slot name="end" />
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/vue';

withDefaults(
  defineProps<{
    title: string;
    defaultHref?: string;
    showBack?: boolean;
  }>(),
  {
    defaultHref: '/',
    showBack: true,
  },
);
</script>

<style scoped>
.fx-header ion-toolbar {
  --background: #ffffff;
  --border-color: var(--hairline);
  --min-height: 56px;
}
.fx-header ion-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
}
.fx-header ion-back-button {
  --color: var(--primary);
}

/* Desktop uses the persistent top bar instead */
@media (min-width: 768px) {
  .fx-header { display: none; }
}
</style>
