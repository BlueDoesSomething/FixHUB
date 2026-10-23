<template>
  <div class="timeline">
    <div v-for="(item, i) in items" :key="i" class="timeline__item" :class="`is-${item.state}`">
      <div class="timeline__dot">
        <svg v-if="item.state === 'done'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg v-else-if="item.state === 'active'" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="4" />
        </svg>
      </div>
      <div class="timeline__title">{{ item.title }}</div>
      <div class="timeline__time">{{ item.time }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TimelineItem {
  title: string;
  time: string;
  state: 'done' | 'active' | 'pending';
}

defineProps<{ items: TimelineItem[] }>();
</script>

<style scoped>
.timeline { position: relative; padding-left: 30px; }
.timeline::before {
  content: '';
  position: absolute;
  left: 10px; top: 6px; bottom: 6px;
  width: 2px;
  background: var(--hairline);
}
.timeline__item { position: relative; padding-bottom: 16px; }
.timeline__item:last-child { padding-bottom: 0; }
.timeline__dot {
  position: absolute;
  left: -30px; top: 1px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--hairline);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted);
}
.timeline__dot svg { width: 11px; height: 11px; }
.timeline__item.is-done .timeline__dot { background: var(--success); border-color: var(--success); color: #fff; }
.timeline__item.is-active .timeline__dot {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  animation: pulse-ring 2s infinite;
}
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(20, 99, 68, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(20, 99, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(20, 99, 68, 0); }
}
.timeline__title { font-size: 14px; font-weight: 700; color: var(--text-dark); }
.timeline__item.is-pending .timeline__title { color: var(--text-muted); font-weight: 600; }
.timeline__time { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
</style>
