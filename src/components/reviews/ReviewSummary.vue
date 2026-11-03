<template>
  <section class="fx-card review-summary" aria-label="Rating summary">
    <div class="review-summary__score">
      <strong>{{ summary.average?.toFixed(1) ?? '—' }}</strong>
      <StarRating v-if="summary.average !== null" :model-value="Number(summary.average.toFixed(1))" readonly />
      <p>{{ summary.total }} {{ summary.total === 1 ? 'review' : 'reviews' }}</p>
    </div>
    <div class="review-summary__bars">
      <div v-for="row in summary.distribution" :key="row.rating" class="review-summary__row">
        <span>{{ row.rating }} <span aria-hidden="true">★</span></span>
        <progress :value="row.count" :max="summary.total || 1" :aria-label="`${row.rating} stars: ${row.count} reviews`" />
        <span>{{ row.count }}</span>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { summarizeReviews, type RepairReview } from '../../data/reviews';
import StarRating from './StarRating.vue';
const props = defineProps<{ reviews: readonly RepairReview[] }>();
const summary = computed(() => summarizeReviews(props.reviews));
</script>
<style scoped>
.review-summary { display: flex; align-items: center; gap: 32px; color: var(--text-dark); }
.review-summary__score { display: grid; justify-items: center; gap: 6px; min-width: 100px; }
.review-summary__score strong { font-size: 42px; line-height: 1; font-weight: 800; }
.review-summary__score p { margin: 0; font-size: 13px; color: var(--text-muted); }
.review-summary__bars { flex: 1; display: grid; gap: 8px; }
.review-summary__row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.review-summary__row > span:first-child { min-width: 26px; }
.review-summary__row > span:last-child { min-width: 20px; text-align: right; color: var(--text-muted); }
progress { flex: 1; width: 100%; min-width: 0; height: 8px; border: none; border-radius: 20px; overflow: hidden; background: var(--bg); }
progress::-webkit-progress-bar { background: var(--bg); border-radius: 20px; }
progress::-webkit-progress-value { background: #b77908; border-radius: 20px; }
progress::-moz-progress-bar { background: #b77908; border-radius: 20px; }
@media (max-width: 400px) { .review-summary { gap: 16px; } .review-summary__score { min-width: 72px; } }
</style>
