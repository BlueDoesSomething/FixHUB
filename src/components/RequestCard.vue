<template>
  <div class="req-card" :class="{ 'req-card--dropoff': request.type === 'Drop-off' }">
    <div class="req-card__top">
      <div class="req-card__customer">
        <InitialAvatar :initials="request.initials" :gradient="request.color" :size="38" />
        <div>
          <h4>{{ request.customer }}</h4>
          <p>{{ request.time }} • {{ request.distance }}</p>
        </div>
      </div>
      <span class="fx-pill" :class="request.type === 'Home' ? 'fx-pill--progress' : 'fx-pill--accent'">
        {{ request.type === 'Home' ? '🏠 Home' : '📦 Drop-off' }}
      </span>
    </div>
    <div class="req-card__details">
      <div><span>Device:</span><strong>{{ request.device }}</strong></div>
      <div><span>Problem:</span><strong>{{ request.problem }}</strong></div>
    </div>
    <div class="req-card__actions">
      <button class="rc-btn rc-btn--reject" @click="emit('reject', request)">Reject</button>
      <button class="rc-btn rc-btn--accept" @click="emit('accept', request)">Accept</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import InitialAvatar from './InitialAvatar.vue';
import type { ServiceRequest } from '../data/catalog';

defineProps<{ request: ServiceRequest }>();
const emit = defineEmits<{ accept: [req: ServiceRequest]; reject: [req: ServiceRequest] }>();
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
.rc-btn--accept:hover { background: var(--primary-dark); }
.rc-btn--reject { background: var(--bg); color: var(--text-muted); }
.rc-btn--reject:hover { background: rgba(20, 99, 68, 0.08); color: var(--primary); }
</style>
