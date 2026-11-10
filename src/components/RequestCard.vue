<template>
  <div class="req-card" :class="{ 'req-card--dropoff': request.serviceType !== 'home' }">
    <div class="req-card__top">
      <div class="req-card__customer">
        <InitialAvatar :initials="initials" gradient="linear-gradient(135deg, #146344, #1b7a54)" :size="38" />
        <div>
          <h4>{{ request.brand }} {{ request.model }}</h4>
          <p>{{ request.reference }} • {{ requestedTime }}</p>
        </div>
      </div>
      <span class="fx-pill" :class="request.serviceType === 'home' ? 'fx-pill--progress' : 'fx-pill--accent'">
        {{ request.serviceType === 'home' ? '🏠 Home' : '📦 Drop-off' }}
      </span>
    </div>
    <div class="req-card__details">
      <div><span>Device:</span><strong>{{ request.device }}</strong></div>
      <div><span>Problem:</span><strong>{{ request.problem }}</strong></div>
      <div><span>Location:</span><strong>{{ request.location }}</strong></div>
    </div>
    <div class="req-card__actions">
      <button class="rc-btn rc-btn--accept" type="button" :disabled="busy || locked" @click="emit('accept', request)">
        {{ locked ? 'Subscription required' : busy ? 'Accepting…' : 'Accept' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import InitialAvatar from './InitialAvatar.vue';
import type { AvailableRepairJob } from '../data/repair';

const props = defineProps<{ request: AvailableRepairJob; busy?: boolean; locked?: boolean }>();
const emit = defineEmits<{ accept: [req: AvailableRepairJob] }>();

const initials = computed(() => [props.request.brand, props.request.model]
  .map(part => part?.trim().charAt(0)).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'FH');
const requestedTime = computed(() => {
  const parsed = Date.parse(props.request.createdAt);
  if (!Number.isFinite(parsed)) return props.request.createdAt;
  const minutes = Math.round((Date.now() - parsed) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(parsed).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
});
</script>

<style scoped>
.req-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px;
  box-shadow: var(--shadow-sm);
  border-left: 4px solid var(--primary);
}
.req-card--dropoff { border-left-color: var(--accent); }
.req-card__top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; gap: 8px; }
.req-card__customer { display: flex; align-items: center; gap: 12px; }
.req-card__customer h4 { font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0; }
.req-card__customer p { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
.req-card__details {
  background: var(--bg); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; font-size: 13px;
}
.req-card__details div { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
.req-card__details div:last-child { margin-bottom: 0; }
.req-card__details span { color: var(--text-muted); }
.req-card__details strong { color: var(--text-dark); font-weight: 600; text-align: right; }
.req-card__actions { display: flex; gap: 10px; }
.rc-btn {
  flex: 1; padding: 11px; border-radius: 10px;
  font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; border: none;
  transition: all 0.2s ease;
}
.rc-btn--accept { background: var(--primary); color: #fff; }
.rc-btn--accept:hover:not(:disabled) { background: var(--primary-dark); }
.rc-btn--accept:disabled { opacity: 0.65; cursor: progress; }
</style>
