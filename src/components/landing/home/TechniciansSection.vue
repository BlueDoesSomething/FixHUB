<template>
  <section id="technicians" class="relative py-24 px-6 md:px-12 lg:px-20 z-10">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-xs font-bold text-brand-blue uppercase tracking-wider mb-4">
          OUR EXPERTS
        </div>
        <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4">Meet Our Verified Technicians</h2>
        <p class="text-white/60 max-w-2xl mx-auto text-lg">Skilled professionals ready to fix your devices. Filtered by smart matching based on your needs.</p>
      </div>

      <div class="flex flex-col md:flex-row gap-4 mb-10 justify-center items-center">
        <div class="relative w-full md:w-96">
          <i data-lucide="search" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40"></i>
          <input type="text" placeholder="Search by name or specialization..." class="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm">
        </div>
        <div class="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <button class="px-4 py-2 rounded-lg bg-white text-brand-dark text-xs font-bold whitespace-nowrap">All</button>
          <button class="px-4 py-2 rounded-lg glass-input text-white text-xs font-bold whitespace-nowrap hover:bg-white/10">Smartphone</button>
          <button class="px-4 py-2 rounded-lg glass-input text-white text-xs font-bold whitespace-nowrap hover:bg-white/10">Laptop</button>
          <button class="px-4 py-2 rounded-lg glass-input text-white text-xs font-bold whitespace-nowrap hover:bg-white/10">Tablet</button>
        </div>
      </div>

      <p v-if="!technicians.length" class="text-center text-white/60">No technicians are available to display.</p>
      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TechnicianCard v-for="tech in technicians" :key="tech.id" :tech="tech" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { technicians } from '../../../data/landing/technicians'
import TechnicianCard from './TechnicianCard.vue'

onMounted(() => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
  }
})
</script>
