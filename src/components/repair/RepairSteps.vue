<template>
  <ol class="repair-steps" aria-label="Repair request progress">
    <li v-for="(label, index) in labels" :key="label" :class="{ current: step === index + 1, done: step > index + 1 }" :aria-current="step === index + 1 ? 'step' : undefined">
      <span>{{ index + 1 }}</span>{{ label }}
    </li>
  </ol>
</template>
<script setup lang="ts">
defineProps<{ step: number }>();
const labels = ['Device & service', 'Location', 'Review & submit'];
</script>
<style scoped>
.repair-steps { display: flex; flex-wrap: wrap; gap: 12px 24px; padding: 0; margin: 0 0 24px; list-style: none; }
.repair-steps li { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: var(--text-muted); }
.repair-steps span { display: grid; place-items: center; width: 25px; height: 25px; border: 1px solid var(--hairline); border-radius: 50%; }
.repair-steps .current { color: var(--primary); font-weight: 800; }
.repair-steps .current span, .repair-steps .done span { color: white; background: var(--primary); border-color: var(--primary); }
</style>
