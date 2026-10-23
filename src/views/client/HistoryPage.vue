<template>
  <ion-page>
    <ScreenHeader title="Repair History" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Repair History</h1>
            <p class="fx-page__sub">Track every repair you have requested</p>
          </div>
        </div>

        <div class="filters">
          <button
            v-for="f in filters"
            :key="f"
            class="filter"
            :class="{ active: active === f }"
            @click="active = f"
          >
            {{ f }}
          </button>
        </div>

        <div class="fx-grid-2">
          <div v-for="h in filtered" :key="h.id" class="fx-card history">
            <div class="history__top">
              <div>
                <h4>{{ h.device }}</h4>
                <p>{{ h.problem }}</p>
              </div>
              <span class="fx-pill" :class="`fx-pill--${h.statusClass}`">{{ h.status }}</span>
            </div>
            <div class="history__meta">
              <span>👤 {{ h.tech }}</span>
              <span>📅 {{ h.date }}</span>
              <span>{{ h.type === 'Home' ? '🏠' : '📦' }} {{ h.type }}</span>
              <span class="history__rating">{{ h.rating || 'Rate ★' }}</span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { history } from '../../data/mock';

const filters = ['All', 'Completed', 'In Progress'] as const;
const active = ref<(typeof filters)[number]>('All');

const filtered = computed(() => {
  if (active.value === 'Completed') return history.filter((h) => h.statusClass === 'completed');
  if (active.value === 'In Progress') return history.filter((h) => h.statusClass === 'progress');
  return history;
});
</script>

<style scoped>
.filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 22px; }
.filter {
  padding: 9px 16px; border-radius: 999px; font-size: 13px; font-weight: 700;
  font-family: inherit; cursor: pointer; white-space: nowrap;
  background: var(--surface); color: var(--text-muted); border: 1.5px solid var(--hairline);
  transition: all 0.2s ease;
}
.filter:hover { border-color: var(--primary); color: var(--primary); }
.filter.active {
  background: var(--gradient); color: #fff; border-color: transparent;
  box-shadow: 0 6px 16px rgba(20, 99, 68, 0.22);
}

.history { margin: 0; }
.history__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.history__top h4 { font-size: 17px; font-weight: 700; color: var(--text-dark); margin: 0; }
.history__top p { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; }
.history__meta {
  display: flex; flex-wrap: wrap; gap: 14px;
  padding-top: 14px; border-top: 1px solid var(--hairline);
  font-size: 13px; color: var(--text-muted);
}
.history__rating { color: var(--warning); margin-left: auto; font-weight: 600; }
</style>
