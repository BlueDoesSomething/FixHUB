<template>
  <ion-tab-bar slot="bottom" class="fx-tabbar">
    <ion-tab-button
      v-for="item in items"
      :key="item.id"
      :tab="item.tab"
      :href="item.route"
      class="fx-tab"
      :class="{ 'fx-tab--fab': item.fab }"
    >
      <span class="fx-tab__icon" v-html="item.icon" />
      <ion-label class="fx-tab__label">{{ item.label }}</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonLabel } from '@ionic/vue';
import type { NavItem } from '../data/navigation';

defineProps<{ items: NavItem[] }>();
</script>

<style scoped>
.fx-tabbar {
  --background: #fff;
  --border: none;
  box-shadow: 0 -4px 16px rgba(20, 99, 68, 0.08);
  height: 66px;
  padding: 6px 4px;
}
.fx-tab {
  --color: var(--text-muted);
  --color-selected: var(--primary);
  --padding-top: 4px;
  --padding-bottom: 4px;
}
.fx-tab__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  transition: all 0.2s ease;
}
.fx-tab.tab-selected .fx-tab__icon { background: var(--primary-light); color: var(--primary); }
.fx-tab__label { font-size: 10px; font-weight: 700; margin-top: 2px; }

.fx-tab--fab { --padding-top: 0; }
.fx-tab--fab .fx-tab__icon {
  width: 48px;
  height: 48px;
  margin-top: -22px;
  border-radius: 15px;
  background: var(--gradient);
  color: #fff;
  box-shadow: 0 8px 18px rgba(20, 99, 68, 0.35);
}
.fx-tab--fab.tab-selected .fx-tab__icon { background: var(--gradient); color: #fff; }
.fx-tab--fab .fx-tab__label { margin-top: 0; }

/* Hide bottom navigation bar on desktop/web view */
@media (min-width: 768px) {
  .fx-tabbar { display: none !important; }
}
</style>
