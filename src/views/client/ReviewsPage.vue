<template>
  <ion-page>
    <ScreenHeader title="My Reviews" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head"><div><h1 class="fx-page__title">My Reviews</h1><p class="fx-page__sub">Share your repair experience and hear back from your technician.</p></div><button class="fx-btn fx-btn-secondary" @click="router.push('/client/history')">Repair History</button></div>
        <p v-if="success" class="review-success" role="status">{{ success }}</p>
        <div class="reviews-layout">
          <section>
            <h2 class="fx-section-title fx-section-title--lg">To review <span class="review-count">{{ pending.length }}</span></h2>
            <form v-if="pending.length" class="fx-card review-form" @submit.prevent="submit">
              <label for="review-repair">Completed repair</label>
              <select id="review-repair" v-model="repairId" data-testid="review-repair">
                <option value="" disabled>Choose a completed repair</option>
                <option v-for="repair in pending" :key="repair.id" :value="repair.id">{{ repair.device }} · {{ repair.technicianName }} · {{ repair.date }}</option>
              </select>
              <p v-if="selected" class="review-form__detail">{{ selected.problem }} · Completed repair</p>
              <StarRating v-model="rating" />
              <label for="review-comment">Your review <span>(optional)</span></label>
              <textarea id="review-comment" v-model="comment" rows="5" :maxlength="MAX_REVIEW_LENGTH" placeholder="What went well? What could be better?" aria-describedby="review-character-count" />
              <small id="review-character-count">{{ comment.length }} / {{ MAX_REVIEW_LENGTH }} characters</small>
              <p class="review-form__detail">One review per completed repair. Please avoid sharing personal or contact information.</p>
              <p v-if="error" role="alert" class="review-error">{{ error }}</p>
              <button class="fx-btn fx-btn-primary" type="submit" data-testid="submit-review">Submit review</button>
            </form>
            <div v-else class="fx-card review-empty"><h3>You're all caught up</h3><p>No completed repairs are waiting for a review.</p></div>
          </section>
          <section>
            <h2 class="fx-section-title fx-section-title--lg">My reviews <span class="review-count">{{ written.length }}</span></h2>
            <div class="written-reviews">
              <div v-if="!written.length" class="fx-card review-empty"><h3>No reviews yet</h3><p>Complete a repair to leave your first review. Technician responses will appear here too.</p></div>
              <ReviewCard v-for="review in written" :key="review.id" :review="review" show-technician />
            </div>
          </section>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import StarRating from '../../components/reviews/StarRating.vue';
import ReviewCard from '../../components/reviews/ReviewCard.vue';
import { MAX_REVIEW_LENGTH } from '../../data/reviews';
import { useReviews } from '../../stores/reviews';

const route = useRoute();
const router = useRouter();
const { mine, pendingRepairs, submitReview, refresh } = useReviews();
// Completed repairs and shared reviews live in FIXHUB, not only in this browser.
onMounted(() => { void refresh(); });
const pending = computed(pendingRepairs);
const written = computed(() => [...mine()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
const repairId = ref('');
const selected = computed(() => pending.value.find(repair => repair.id === repairId.value));
const rating = ref(0);
const comment = ref('');
const error = ref('');
const success = ref('');
watch(() => route.query.repair, value => {
  if (typeof value === 'string' && pending.value.some(repair => repair.id === value)) repairId.value = value;
}, { immediate: true });

function submit() {
  error.value = '';
  success.value = '';
  try {
    submitReview(repairId.value, rating.value, comment.value);
    repairId.value = '';
    rating.value = 0;
    comment.value = '';
    success.value = 'Thank you! Your review was saved on this device.';
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Your review could not be saved. Please try again.'; }
}
</script>
<style scoped>
.reviews-layout { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); align-items: start; gap: 28px; }
.review-count { font-size: 12px; background: var(--gradient-soft); color: var(--primary); border-radius: 20px; padding: 4px 9px; margin-left: 6px; }
.review-form { display: grid; gap: 12px; color: var(--text-dark); }
.review-form > label { font-size: 14px; font-weight: 700; }
.review-form > label span { font-weight: 400; color: var(--text-muted); }
.review-form select, .review-form textarea { width: 100%; min-width: 0; padding: 12px; border: 1px solid var(--hairline); border-radius: 10px; background: #fff; color: var(--text-dark); font: inherit; font-size: 14px; }
.review-form textarea { resize: vertical; }
.review-form select:focus, .review-form textarea:focus { outline: 2px solid var(--primary); outline-offset: 2px; }
.review-form__detail, .review-form small { color: var(--text-muted); font-size: 12px; line-height: 1.7; margin: 0; }
.review-empty h3 { font-size: 16px; margin: 0 0 8px; color: var(--text-dark); }
.review-empty p { color: var(--text-muted); font-size: 14px; line-height: 1.7; margin: 0; }
.written-reviews { display: grid; gap: 16px; }
.review-error { margin: 0; color: var(--danger); font-size: 13px; }
.review-success { margin: 0 0 24px; padding: 14px 18px; border-radius: 12px; background: var(--gradient-soft); color: var(--primary); font-size: 14px; line-height: 1.7; }
@media (max-width: 1000px) { .reviews-layout { grid-template-columns: minmax(0, 1fr); } }
</style>
