<template>
  <div class="donut-chart">
    <div class="donut-chart__graphic">
      <svg viewBox="0 0 120 120" role="img" :aria-labelledby="`${id}-title ${id}-description`">
        <title :id="`${id}-title`">{{ label }}</title>
        <desc :id="`${id}-description`">{{ description }}</desc>
        <circle cx="60" cy="60" r="44" fill="none" stroke="#e8eef0" stroke-width="15" />
        <circle v-for="segment in arcs" :key="segment.label" class="donut-chart__segment" cx="60" cy="60" r="44" fill="none" :stroke="segment.color" stroke-width="15" pathLength="100" :stroke-dasharray="`${segment.percentage} ${100 - segment.percentage}`" :stroke-dashoffset="-segment.offset" transform="rotate(-90 60 60)">
          <title>{{ segment.label }}: {{ segment.value }} {{ segment.value === 1 ? 'repair' : 'repairs' }} ({{ segment.percentage.toFixed(1) }}%)</title>
        </circle>
      </svg>
      <div class="donut-chart__center" aria-hidden="true"><strong>{{ total.toLocaleString() }}</strong><span>{{ total === 1 ? 'repair' : 'repairs' }}</span></div>
    </div>
    <ol v-if="arcs.length" class="donut-chart__legend" role="list" aria-label="Brand repair counts, highest first">
      <li v-for="segment in arcs" :key="segment.label" :data-brand="segment.label">
        <span class="donut-chart__swatch" :style="{ background: segment.color }" aria-hidden="true" />
        <span class="donut-chart__name">{{ segment.label }}</span>
        <strong>{{ segment.value.toLocaleString() }} <span class="donut-chart__sr-only">{{ segment.value === 1 ? 'repair' : 'repairs' }}</span></strong>
        <span class="donut-chart__percentage">{{ segment.percentage.toFixed(1) }}%</span>
      </li>
    </ol>
    <p v-else class="donut-chart__empty">No completed repairs in this period.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';

const props = defineProps<{ label: string; segments: readonly { label: string; value: number; color: string }[] }>();
const id = useId();
const positiveSegments = computed(() => props.segments.filter(segment => Number.isFinite(segment.value) && segment.value > 0)
  .slice().sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)));
const total = computed(() => positiveSegments.value.reduce((sum, segment) => sum + segment.value, 0));
const arcs = computed(() => {
  let offset = 0;
  return positiveSegments.value.map(segment => {
    const percentage = segment.value / total.value * 100;
    const result = { ...segment, percentage, offset };
    offset += percentage;
    return result;
  });
});
const description = computed(() => total.value
  ? `${total.value} completed repairs. ${arcs.value.map(segment => `${segment.label}: ${segment.value} (${segment.percentage.toFixed(1)}%)`).join('; ')}.`
  : 'No completed repairs in this period.');
</script>

<style scoped>
.donut-chart { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 24px; color: var(--text-dark); }
.donut-chart__graphic { position: relative; flex: 0 1 200px; width: 200px; max-width: 100%; aspect-ratio: 1; }
.donut-chart svg { display: block; width: 100%; height: 100%; }
.donut-chart__center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
.donut-chart__center strong { font-size: 32px; font-weight: 800; line-height: 1.2; }
.donut-chart__center span { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.donut-chart__legend { flex: 1 1 160px; min-width: 0; display: grid; gap: 14px; list-style: none; margin: 0; padding: 0; }
.donut-chart__legend li { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto 48px; gap: 9px; align-items: center; font-size: 13px; }
.donut-chart__swatch { width: 10px; height: 10px; border-radius: 3px; }
.donut-chart__name { overflow-wrap: anywhere; }
.donut-chart__legend strong { font-size: 14px; font-weight: 700; }
.donut-chart__percentage { font-size: 12px; color: var(--text-muted); text-align: right; }
.donut-chart__empty { flex: 1 1 160px; color: var(--text-muted); font-size: 14px; line-height: 1.8; margin: 0; }
.donut-chart__sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
