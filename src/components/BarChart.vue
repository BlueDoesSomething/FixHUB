<template>
  <div class="bar-chart" :style="{ height: chartHeight + 'px' }">
    <div
      v-for="(bar, i) in data"
      :key="i"
      class="bar"
      :style="{ height: bar.height + '%', background: bar.color }"
    >
      <span class="bar__label">{{ bar.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Bar {
  label: string;
  height: number;
  color?: string;
}

withDefaults(defineProps<{ data: Bar[]; chartHeight?: number }>(), {
  chartHeight: 80,
});
</script>

<style scoped>
.bar-chart {
  display: flex; align-items: flex-end; gap: 6px;
  padding: 6px 0 18px;
}
.bar {
  flex: 1;
  background: var(--gradient);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 8px;
  transition: height 0.4s ease;
}
.bar__label {
  position: absolute;
  bottom: -18px; left: 0; right: 0;
  text-align: center;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
