<template>
  <div class="glass-card rounded-2xl p-6 hover-lift group cursor-default">
    <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform', feature.bg]">
      <i :data-lucide="feature.icon" :class="['w-7 h-7', feature.color]"></i>
    </div>
    <h3 class="text-xl font-bold text-white mb-2">{{ feature.title }}</h3>
    <p class="text-white/60 text-sm leading-relaxed">{{ feature.desc }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  feature: {
    title: string
    desc: string
    icon: string
    bg: string
    color: string
  }
}>()
</script>