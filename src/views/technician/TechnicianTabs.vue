<template>
  <ion-page>
    <div class="app-shell">
      <FxSideNav :items="items" role="technician" />
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
import FxTabBar from '../../components/FxTabBar.vue';
import FxSideNav from '../../components/FxSideNav.vue';
import FxTopBar from '../../components/FxTopBar.vue';
import { navConfig } from '../../data/navigation';

const items = navConfig.technician;
</script>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  background: var(--bg);
}

.app-shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
}

.app-shell__body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.app-shell__body ion-tabs {
  position: relative;
  flex: 1;
  height: auto;
  min-height: 0;
}

@media (max-width: 767px) {
  .app-shell {
    flex-direction: column;
  }
}
</style>
