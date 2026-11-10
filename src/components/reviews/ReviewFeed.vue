<template>
  <div class="review-feed">
    <ReviewSummary :reviews="reviews" />
    <div class="review-feed__filters">
      <label>Rating<select v-model.number="rating"><option :value="0">All ratings</option><option v-for="stars in [5, 4, 3, 2, 1]" :key="stars" :value="stars">{{ stars }} {{ stars === 1 ? 'star' : 'stars' }}</option></select></label>
      <label>Sort by<select v-model="sort"><option value="newest">Newest first</option><option value="highest">Highest rated</option><option value="lowest">Lowest rated</option></select></label>
    </div>
    <p v-if="!filtered.length" class="fx-card review-feed__empty">{{ reviews.length ? 'No reviews match this rating. Choose another rating to see more.' : 'No reviews yet. Customer feedback will appear here after a completed repair is reviewed.' }}</p>
    <ReviewCard v-for="review in filtered" :key="review.id" :review="review" :can-reply="canReply" />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useReviews } from '../../stores/reviews';
import ReviewCard from './ReviewCard.vue';
import ReviewSummary from './ReviewSummary.vue';
const props = defineProps<{ technicianId: number | string; canReply?: boolean }>();
const { forTechnician, refresh } = useReviews();
// Shared reviews live in FIXHUB; pull them in whenever a feed is shown.
onMounted(() => { void refresh(); });
const rating = ref(0);
const sort = ref('newest');
const reviews = computed(() => forTechnician(props.technicianId));
const filtered = computed(() => reviews.value.filter(review => !rating.value || review.rating === rating.value).sort((a, b) => {
  const difference = sort.value === 'highest' ? b.rating - a.rating : sort.value === 'lowest' ? a.rating - b.rating : 0;
  return difference || Date.parse(b.createdAt) - Date.parse(a.createdAt);
}));
</script>
<style scoped>
.review-feed { display: grid; gap: 16px; }
.review-feed__filters { display: flex; gap: 14px; flex-wrap: wrap; }
.review-feed__filters label { display: grid; gap: 6px; flex: 1; min-width: 130px; font-size: 12px; font-weight: 700; color: var(--text-muted); }
.review-feed__filters select { width: 100%; background: #fff; color: var(--text-dark); border: 1px solid var(--hairline); padding: 10px 12px; border-radius: 10px; font: inherit; }
.review-feed__filters select:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.review-feed__empty { margin: 0; color: var(--text-muted); font-size: 14px; line-height: 1.7; }
</style>
