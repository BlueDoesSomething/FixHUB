<template>
  <div class="fx-av" :class="smClass" :style="{ background: gradient, width: px, height: px, fontSize: fontPx, borderRadius: radius }">
    {{ initials }}
    <span v-if="verified" class="fx-av__verified" :style="{ width: badgePx, height: badgePx }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12" /></svg>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    initials: string;
    gradient?: string;
    size?: number;
    verified?: boolean;
  }>(),
  {
    gradient: 'linear-gradient(135deg, #146344, #1b7a54)',
    size: 38,
    verified: false,
  },
);

const px = computed(() => `${props.size}px`);
const fontPx = computed(() => `${Math.round(props.size * 0.36)}px`);
const radius = computed(() => (props.size >= 60 ? '22px' : '50%'));
const badgePx = computed(() => `${Math.round(props.size * 0.36)}px`);
const smClass = computed(() => (props.verified ? 'fx-av--has-badge' : ''));
</script>

<style scoped>
.fx-av {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
  position: relative;
}
.fx-av__verified {
  position: absolute;
  bottom: -3px;
  right: -3px;
  background: var(--success);
  border-radius: 50%;
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.fx-av__verified svg { width: 55%; height: 55%; }
</style>
