<template>
  <div class="brand" :class="{ 'brand--sm': small }">
    <div class="brand__logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    </div>
    <div class="brand__text">
      <h1>FIXHUB</h1>
      <p v-if="!small">Device Repair Marketplace</p>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ small?: boolean }>(), { small: false });
</script>

<style scoped>
.brand { display: flex; align-items: center; gap: 10px; }
.brand__logo {
  width: 42px; height: 42px;
  border-radius: 12px;
  background: var(--gradient);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 18px rgba(20, 99, 68, 0.28);
}
.brand--sm .brand__logo { width: 34px; height: 34px; border-radius: 10px; }
.brand__logo svg { width: 22px; height: 22px; }
.brand--sm .brand__logo svg { width: 18px; height: 18px; }
.brand__text h1 {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: var(--text-dark);
  letter-spacing: -0.5px;
}
.brand--sm .brand__text h1 { font-size: 16px; }
.brand__text p { margin: 1px 0 0; font-size: 11px; color: var(--text-muted); font-weight: 500; }
</style>
