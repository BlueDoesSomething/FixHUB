<template>
  <section id="about" class="relative py-24 px-6 md:px-12 lg:px-20 z-10">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-coral/10 border border-brand-coral/20 text-xs font-bold text-brand-coral uppercase tracking-wider mb-4">
          ABOUT US
        </div>
        <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4">Making Device Repair Faster, Clearer, and More Connected</h2>
      </div>

      <div class="grid md:grid-cols-2 gap-12 items-center">
        <div class="space-y-6">
          <div class="glass-card rounded-2xl p-6">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center"><i data-lucide="target" class="w-5 h-5 text-brand-blue"></i></div>
              <h3 class="text-xl font-bold text-white">Our Mission</h3>
            </div>
            <p class="text-white/70 text-sm leading-relaxed">To eliminate the hassle of finding reliable device repair services by connecting customers with verified, skilled technicians through a transparent and smart digital platform.</p>
          </div>
          <div class="glass-card rounded-2xl p-6">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-brand-teal/20 flex items-center justify-center"><i data-lucide="eye" class="w-5 h-5 text-brand-teal"></i></div>
              <h3 class="text-xl font-bold text-white">Our Vision</h3>
            </div>
            <p class="text-white/70 text-sm leading-relaxed">To become the leading and most trusted device repair marketplace in the Philippines, where quality service is just a tap away.</p>
          </div>
        </div>
        <div class="glass-card rounded-2xl p-8 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-40 h-40 bg-brand-blue/20 rounded-full blur-3xl"></div>
          <h3 class="text-2xl font-bold text-white mb-6 relative z-10">The FIXHUB Difference</h3>
          <ul class="space-y-4 relative z-10">
            <li class="flex items-start gap-3">
              <i data-lucide="check-circle" class="w-5 h-5 text-brand-teal mt-0.5 flex-shrink-0"></i>
              <div><p class="font-semibold text-white text-sm">No More Guesswork</p><p class="text-xs text-white/60">Smart matching ensures you get the right expert for your specific device.</p></div>
            </li>
            <li class="flex items-start gap-3">
              <i data-lucide="check-circle" class="w-5 h-5 text-brand-teal mt-0.5 flex-shrink-0"></i>
              <div><p class="font-semibold text-white text-sm">Total Transparency</p><p class="text-xs text-white/60">Real-time tracking and clear pricing mean no hidden surprises.</p></div>
            </li>
            <li class="flex items-start gap-3">
              <i data-lucide="check-circle" class="w-5 h-5 text-brand-teal mt-0.5 flex-shrink-0"></i>
              <div><p class="font-semibold text-white text-sm">Verified Professionals</p><p class="text-xs text-white/60">Every technician is background-checked and skill-verified.</p></div>
            </li>
            <li class="flex items-start gap-3">
              <i data-lucide="check-circle" class="w-5 h-5 text-brand-teal mt-0.5 flex-shrink-0"></i>
              <div><p class="font-semibold text-white text-sm">Convenience First</p><p class="text-xs text-white/60">Choose between Home Service or Drop-off based on your schedule.</p></div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
  }
})
</script>