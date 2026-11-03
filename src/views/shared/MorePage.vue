<template>
  <ion-page>
    <ScreenHeader title="More" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">More</h1>
            <p class="fx-page__sub">{{ roleLabel }} tools, account settings, and more.</p>
          </div>
        </div>

        <div class="fx-grid-3">
          <a v-for="item in items" :key="item.id" :href="item.route" class="fx-card fx-card--interactive tile" @click.prevent="router.push(item.route)">
            <div class="tile__icon" aria-hidden="true" v-html="item.icon" />
            <div class="tile__name">{{ item.label }}</div>
            <span class="tile__arrow" aria-hidden="true">›</span>
          </a>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { moreNavItems, navConfig } from '../../data/navigation';
import type { Role } from '../../stores/auth';

const router = useRouter();
const props = withDefaults(defineProps<{ role?: Role }>(), { role: 'client' });
const items = computed(() => moreNavItems(navConfig[props.role]));
const roleLabel = computed(() => ({ client: 'Customer', technician: 'Technician', admin: 'Admin' })[props.role]);
</script>

<style scoped>
.tile { display: flex; align-items: center; gap: 14px; border: 1px solid var(--hairline); text-decoration: none; min-height: 88px; }
.tile:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }
.tile__icon {
  width: 48px; height: 48px; flex-shrink: 0; background: var(--gradient-soft);
  border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary);
}
.tile__name { flex: 1; min-width: 0; font-size: 15px; font-weight: 700; color: var(--text-dark); overflow-wrap: anywhere; }
.tile__arrow { color: var(--text-muted); font-size: 20px; }
</style>
