<template>
  <ion-header :translucent="false" class="fx-header">
    <ion-toolbar>
      <ion-buttons v-if="showBack" slot="start">
        <button class="fx-header__back" type="button" aria-label="Go back" @click="router.push(defaultHref)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
      </ion-buttons>
      <ion-title>{{ title }}</ion-title>
      <ion-buttons slot="end">
        <slot name="end" />
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/vue';
import { useRouter } from 'vue-router';

const router = useRouter();

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
.fx-header__back { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0; background: transparent; color: var(--primary); cursor: pointer; }
.fx-header__back:focus-visible { outline: 2px solid var(--primary); border-radius: 8px; }

/* Desktop uses the persistent top bar instead */
@media (min-width: 1024px) {
  .fx-header { display: none; }
}
</style>
