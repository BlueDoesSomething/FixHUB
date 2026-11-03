<template>
  <span v-if="readonly" class="stars stars--readonly" role="img" :aria-label="`${modelValue} out of 5 stars`">
    <span v-for="star in 5" :key="star" :class="{ filled: star <= Math.round(modelValue) }" aria-hidden="true">★</span>
  </span>
  <fieldset v-else class="rating">
    <legend>{{ label || 'Your rating' }}</legend>
    <div class="stars">
      <label v-for="star in 5" :key="star" class="star-choice" :class="{ filled: star <= modelValue }">
        <input type="radio" :name="id" :value="star" :checked="modelValue === star" @change="emit('update:modelValue', star)">
        <span aria-hidden="true">★</span>
        <span class="sr-only">{{ star }} {{ star === 1 ? 'star' : 'stars' }}</span>
      </label>
      <span class="rating__value">{{ modelValue ? `${modelValue} / 5` : 'Select a rating' }}</span>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { useId } from 'vue';
defineProps<{ modelValue: number; readonly?: boolean; label?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const id = useId();
</script>

<style scoped>
.rating { border: 0; padding: 0; margin: 0; min-width: 0; }
.rating legend { font-size: 14px; font-weight: 700; margin-bottom: 8px; color: var(--text-dark); }
.stars { display: inline-flex; align-items: center; gap: 4px; color: #cbd5e1; }
.filled { color: #b77908; }
.star-choice { position: relative; cursor: pointer; display: grid; place-items: center; width: 44px; height: 44px; font-size: 34px; border-radius: 8px; }
.star-choice:hover { background: #fef3c7; }
.star-choice:has(input:focus-visible) { outline: 2px solid var(--primary); outline-offset: 2px; }
.star-choice input, .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.rating__value { font-size: 12px; color: var(--text-muted); margin-left: 8px; }
.stars--readonly { font-size: 18px; gap: 2px; }
@media (max-width: 380px) { .rating__value { display: none; } }
</style>
