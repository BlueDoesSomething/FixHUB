<template>
  <nav class="fixed top-0 w-full z-50 bg-[#12211a]/90 backdrop-blur-md border-b border-white/10 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-teal flex items-center justify-center text-white shadow-lg">
          <i data-lucide="wrench" class="w-4 h-4"></i>
        </div>
        <span class="text-lg font-bold text-white tracking-tight">FIXHUB</span>
      </div>

      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-sm font-medium text-white/70 hover:text-white transition">Features</a>
        <a href="#how-it-works" class="text-sm font-medium text-white/70 hover:text-white transition">How it Works</a>
        <a href="#about" class="text-sm font-medium text-white/70 hover:text-white transition">About</a>
        <a href="#technicians" class="text-sm font-medium text-white/70 hover:text-white transition">Technicians</a>
      </div>

      <button @click="$emit('get-started')" class="hidden md:block px-5 py-2 rounded-lg bg-white text-brand-dark text-sm font-bold hover:bg-white/90 transition-all">
        Get Started
      </button>
    </div>
  </nav>
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