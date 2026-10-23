<template>
  <section id="how-it-works" class="relative py-24 px-6 md:px-12 lg:px-20 z-10">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-xs font-bold text-brand-blue uppercase tracking-wider mb-4">
          SIMPLE PROCESS
        </div>
        <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4">How FIXHUB Works</h2>
        <p class="text-white/60 max-w-2xl mx-auto text-lg">Get your device repaired in 4 simple steps.</p>
      </div>
      <div class="grid md:grid-cols-4 gap-8 relative">
        <div class="hidden md:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-brand-blue via-brand-teal to-brand-coral opacity-30"></div>
        <div v-for="(step, idx) in steps" :key="idx" class="relative text-center group">
          <div :class="['w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 glass-card group-hover:scale-110 transition-transform duration-300', step.bgHover]">
            <i :data-lucide="step.icon" :class="['w-12 h-12', step.color]"></i>
            <div :class="['absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg', step.badge]">{{ idx + 1 }}</div>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">{{ step.title }}</h3>
          <p class="text-sm text-white/60 px-4">{{ step.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { steps } from '../../../data/landing/steps'

onMounted(() => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
  }
})
</script>