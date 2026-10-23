<template>
  <div class="map" :style="{ height: height }">
    <svg class="map__svg" :viewBox="`0 0 400 ${vh}`" preserveAspectRatio="xMidYMid slice">
      <rect width="400" :height="vh" fill="#EAF3EE" />
      <rect x="20" y="30" width="90" height="70" fill="#CFE6D8" rx="4" />
      <rect x="280" y="240" width="90" height="70" fill="#CFE6D8" rx="4" />
      <rect x="30" y="120" width="50" height="40" fill="#E2ECE6" rx="2" />
      <rect x="220" y="110" width="60" height="50" fill="#E2ECE6" rx="2" />
      <rect x="30" y="200" width="50" height="50" fill="#E2ECE6" rx="2" />
      <rect x="220" y="200" width="60" height="50" fill="#E2ECE6" rx="2" />

      <line x1="0" :y1="vh / 2" x2="400" :y2="vh / 2" stroke="#F7FBF9" stroke-width="10" />
      <line x1="200" y1="0" x2="200" :y2="vh" stroke="#F7FBF9" stroke-width="10" />
      <line x1="0" :y1="vh / 4" x2="400" :y2="vh / 4" stroke="#F7FBF9" stroke-width="6" />
      <line x1="0" :y1="(vh / 4) * 3" x2="400" :y2="(vh / 4) * 3" stroke="#F7FBF9" stroke-width="6" />
      <line x1="100" y1="0" x2="100" :y2="vh" stroke="#F7FBF9" stroke-width="6" />
      <line x1="300" y1="0" x2="300" :y2="vh" stroke="#F7FBF9" stroke-width="6" />

      <path v-if="route" :d="route" stroke="#146344" stroke-width="4" fill="none" stroke-dasharray="6,3" opacity="0.5" />
      <path v-if="route" :d="route" stroke="#146344" stroke-width="2.5" fill="none" />

      <g v-for="(m, i) in markers" :key="i" :transform="`translate(${m.x}, ${m.y})`">
        <template v-if="m.kind === 'dest'">
          <circle r="18" fill="#EF4444" opacity="0.15" />
          <path d="M 0 -13 C -7 -13 -10 -7 -10 -2 C -10 5 0 13 0 13 C 0 13 10 5 10 -2 C 10 -7 7 -13 0 -13 Z" fill="#EF4444" />
          <circle cy="-3" r="3.5" fill="white" />
        </template>
        <template v-else-if="m.kind === 'pulse'">
          <circle r="18" :fill="m.color" opacity="0.2">
            <animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r="12" :fill="m.color" />
          <text text-anchor="middle" y="4" fill="white" font-size="10" font-weight="bold">{{ m.label }}</text>
        </template>
        <template v-else>
          <circle r="14" :fill="m.color" opacity="0.2" />
          <circle r="9" :fill="m.color" />
          <text text-anchor="middle" y="3" fill="white" font-size="9" font-weight="bold">{{ m.label }}</text>
        </template>
      </g>
    </svg>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { MapMarker } from '../types/map';

withDefaults(
  defineProps<{
    height?: string;
    vh?: number;
    route?: string;
    markers?: MapMarker[];
  }>(),
  {
    height: '360px',
    vh: 360,
    markers: () => [],
  },
);
</script>

<style scoped>
.map { position: relative; width: 100%; background: #EAF3EE; overflow: hidden; }
.map__svg { width: 100%; height: 100%; display: block; }
</style>
