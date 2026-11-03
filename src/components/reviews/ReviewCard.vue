<template>
  <article class="fx-card review-card" :data-review-id="review.id">
    <header class="review-card__header">
      <InitialAvatar :initials="initials" gradient="linear-gradient(135deg, #146344, #1b7a54)" :size="40" />
      <div class="review-card__identity"><h3>{{ review.customerName }}</h3><time :datetime="review.createdAt">{{ formatDate(review.createdAt) }}</time></div>
    </header>
    <StarRating :model-value="review.rating" readonly />
    <p v-if="showTechnician" class="review-card__technician">Review for {{ technician?.name }}</p>
    <p class="review-card__device">{{ review.device }}</p>
    <p v-if="review.comment" class="review-card__comment">{{ review.comment }}</p>
    <div v-if="review.reply" class="review-card__reply">
      <h4>Response from {{ technician?.name }}</h4>
      <time :datetime="review.reply.createdAt">{{ formatDate(review.reply.createdAt) }}</time>
      <p class="review-card__comment">{{ review.reply.comment }}</p>
    </div>
    <form v-if="canReply && editing" class="reply-form" @submit.prevent="submitReply">
      <label :for="`reply-${review.id}`">Your response</label>
      <textarea :id="`reply-${review.id}`" v-model="replyText" :maxlength="MAX_REVIEW_LENGTH" rows="4" required :aria-describedby="`reply-count-${review.id}`" />
      <small :id="`reply-count-${review.id}`">{{ replyText.length }} / {{ MAX_REVIEW_LENGTH }} characters</small>
      <p v-if="error" role="alert" class="review-card__error">{{ error }}</p>
      <div class="reply-form__actions"><button class="fx-btn fx-btn-primary" type="submit">Save reply</button><button class="fx-btn fx-btn-secondary" type="button" @click="editing = false">Cancel</button></div>
    </form>
    <button v-else-if="canReply" class="fx-btn fx-btn-secondary reply-button" type="button" @click="openReply">{{ review.reply ? 'Edit reply' : 'Reply to review' }}</button>
    <p v-if="success" role="status" class="review-card__success">{{ success }}</p>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import InitialAvatar from '../InitialAvatar.vue';
import StarRating from './StarRating.vue';
import { MAX_REVIEW_LENGTH, type RepairReview } from '../../data/reviews';
import { technicians } from '../../data/catalog';
import { useReviews } from '../../stores/reviews';

const props = defineProps<{ review: RepairReview; canReply?: boolean; showTechnician?: boolean }>();
const { saveReply } = useReviews();
const technician = computed(() => technicians.find(tech => tech.id === props.review.technicianId));
const initials = computed(() => props.review.customerName.split(/\s+/).map(part => part[0]).slice(0, 2).join(''));
const editing = ref(false);
const replyText = ref('');
const error = ref('');
const success = ref('');
const formatDate = (date: string) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function openReply() {
  replyText.value = props.review.reply?.comment ?? '';
  error.value = '';
  success.value = '';
  editing.value = true;
}
function submitReply() {
  error.value = '';
  try {
    saveReply(props.review.id, replyText.value);
    editing.value = false;
    success.value = 'Your response was saved in this browser.';
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Your response could not be saved. Please try again.'; }
}
</script>

<style scoped>
.review-card { color: var(--text-dark); min-width: 0; }
.review-card__header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.review-card__identity { flex: 1; min-width: 100px; }
.review-card__identity h3 { margin: 0 0 3px; font-size: 14px; font-weight: 700; }
.review-card time, .review-card__device { font-size: 12px; color: var(--text-muted); }
.review-card__device { margin: 6px 0; }
.review-card__technician { font-size: 13px; font-weight: 700; margin: 10px 0 0; }
.review-card__comment { font-size: 14px; line-height: 1.7; margin: 10px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.review-card__reply { margin-top: 18px; padding: 14px 16px; background: var(--bg); border-left: 3px solid var(--primary); border-radius: 0 10px 10px 0; }
.review-card__reply h4 { font-size: 13px; font-weight: 700; margin: 0 0 4px; }
.reply-button { margin-top: 16px; }
.reply-form { display: grid; gap: 8px; margin-top: 18px; }
.reply-form label { font-size: 13px; font-weight: 700; }
.reply-form textarea { width: 100%; padding: 12px; border: 1px solid var(--hairline); border-radius: 10px; background: #fff; color: var(--text-dark); font: inherit; resize: vertical; }
.reply-form textarea:focus { outline: 2px solid var(--primary); outline-offset: 2px; }
.reply-form small { font-size: 12px; color: var(--text-muted); }
.reply-form__actions { display: flex; gap: 10px; flex-wrap: wrap; }
.review-card__error { color: var(--danger); font-size: 13px; }
.review-card__success { color: var(--primary); font-size: 13px; }
</style>
