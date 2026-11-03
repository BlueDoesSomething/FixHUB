<template>
  <ion-page>
    <div class="app-shell">
      <FxSideNav :items="sideItems" role="technician" />
      <div class="app-shell__main">
        <FxTopBar :items="items" role="technician" />
        <div class="app-shell__body">
          <ion-tabs>
            <ion-router-outlet />
            <FxTabBar :items="items" />
          </ion-tabs>
        </div>
      </div>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonRouterOutlet } from '@ionic/vue';
import { computed } from 'vue';
import FxTabBar from '../../components/FxTabBar.vue';
import FxSideNav from '../../components/FxSideNav.vue';
import FxTopBar from '../../components/FxTopBar.vue';
import { navConfig } from '../../data/navigation';

const items = navConfig.technician;
const sideItems = computed(() => items.filter(item => !item.mobileOnly));
</script>
