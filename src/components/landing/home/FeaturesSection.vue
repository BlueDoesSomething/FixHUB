<template>
  <section id="features" class="relative py-24 px-6 md:px-12 lg:px-20 z-10">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-xs font-bold text-brand-teal uppercase tracking-wider mb-4">
          WHY CHOOSE FIXHUB
        </div>
        <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4">Everything You Need for Device Repair</h2>
        <p class="text-white/60 max-w-2xl mx-auto text-lg">A complete ecosystem that makes device repair faster, clearer, and more connected.</p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard v-for="(feature, idx) in features" :key="idx" :feature="feature" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { features } from '../../../data/landing/features'
import FeatureCard from './FeatureCard.vue'

onMounted(() => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
  }
})
</script>