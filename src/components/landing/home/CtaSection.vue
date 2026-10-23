<template>
  <section class="relative py-24 px-6 md:px-12 lg:px-20 z-10">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    <div class="max-w-5xl mx-auto">
      <div class="glass-card rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
        <div class="absolute -top-20 -left-20 w-60 h-60 bg-brand-blue/20 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-20 -right-20 w-60 h-60 bg-brand-teal/20 rounded-full blur-3xl"></div>
        <div class="relative z-10">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-brand-coral uppercase tracking-wider mb-6">
            <i data-lucide="zap" class="w-4 h-4"></i> Get Started Today
          </div>
          <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">Ready to Fix Your Device?</h2>
          <p class="text-white/70 text-lg max-w-2xl mx-auto mb-10">Join thousands of satisfied customers who trust FIXHUB for their device repair needs.</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button @click="$emit('get-started')" class="group px-8 py-4 rounded-2xl bg-white text-brand-dark font-bold text-base hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-3">
              Request a Repair Now <i data-lucide="arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform"></i>
            </button>
            <a href="#technicians" class="group px-8 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-white font-bold text-base hover:bg-white/20 transition-all flex items-center justify-center gap-3">
              Browse Technicians <i data-lucide="users" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
            </a>
          </div>
          <div class="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div><div class="text-3xl font-extrabold text-white">5,291+</div><div class="text-xs text-white/60 mt-1">Repairs Completed</div></div>
            <div><div class="text-3xl font-extrabold text-white">184</div><div class="text-xs text-white/60 mt-1">Verified Technicians</div></div>
            <div><div class="text-3xl font-extrabold text-white flex items-center justify-center gap-1">4.9 <i data-lucide="star" class="w-5 h-5 text-yellow-400 fill-yellow-400"></i></div><div class="text-xs text-white/60 mt-1">Average Rating</div></div>
          </div>
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

defineEmits(['get-started'])
</script>