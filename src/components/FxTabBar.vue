<template>
  <ion-tab-bar slot="bottom" class="fx-tabbar" aria-label="Main navigation">
    <ion-tab-button
      v-for="item in visibleItems"
      :key="item.id"
      :tab="item.tab"
      :href="item.route"
      class="fx-tab"
      :class="{ 'fx-tab--fab': item.fab, 'fx-tab--active': activeItem?.id === item.id }"
      :aria-current="activeItem?.id === item.id ? 'page' : undefined"
      :data-nav-id="item.id"
    >
      <span class="fx-tab__icon" aria-hidden="true" v-html="item.icon" />
      <ion-label class="fx-tab__label">{{ item.mobileLabel || item.label }}</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonLabel } from '@ionic/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { activeMobileNavItem, mobileNavItems, type NavItem } from '../data/navigation';

const props = defineProps<{ items: NavItem[] }>();
const route = useRoute();
const visibleItems = computed(() => mobileNavItems(props.items));
const activeItem = computed(() => activeMobileNavItem(props.items, route.path));
</script>

<style scoped>
.fx-tabbar {
  --background: #fff;
  --border: 1px solid var(--hairline);
  /* Ionic enforces content-box: 59px content + 12px padding + 1px border. */
  box-sizing: content-box;
  flex: 0 0 auto;
  position: relative;
  z-index: 20;
  align-self: stretch;
  width: auto;
  height: 59px;
  padding: 6px max(8px, var(--ion-safe-area-right, 0px)) calc(6px + var(--ion-safe-area-bottom, env(safe-area-inset-bottom, 0px))) max(8px, var(--ion-safe-area-left, 0px));
  box-shadow: 0 -4px 20px rgba(20, 99, 68, 0.08);
}
.fx-tab {
  --color: var(--text-muted);
  --color-selected: var(--primary);
  --padding-top: 2px;
  --padding-bottom: 2px;
  --padding-start: 2px;
  --padding-end: 2px;
  flex: 1 1 0;
  min-width: 0;
  max-width: 160px;
  height: 58px;
  min-height: 44px;
}
.fx-tab--active { --color: var(--primary); }
.fx-tab::part(native):focus-visible { outline: 2px solid var(--primary); outline-offset: -3px; border-radius: 12px; }
.fx-tab__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  transition: all 0.2s ease;
}
.fx-tab--active .fx-tab__icon { background: var(--primary-light); color: var(--primary); }
.fx-tab__label { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; line-height: 14px; font-weight: 700; margin-top: 3px; }

.fx-tab--fab { --padding-top: 0; }
.fx-tab--fab .fx-tab__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--gradient);
  color: #fff;
  box-shadow: 0 8px 18px rgba(20, 99, 68, 0.35);
}
.fx-tab--fab.fx-tab--active .fx-tab__icon { background: var(--gradient); color: #fff; }
.fx-tab--fab .fx-tab__label { margin-top: 3px; }

/* Hide bottom navigation bar on desktop/web view */
@media (min-width: 1024px) {
  .fx-tabbar { display: none !important; }
}
@media (prefers-reduced-motion: reduce) { .fx-tab__icon { transition: none; } }
</style>
