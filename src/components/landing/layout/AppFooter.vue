<template>
  <footer class="relative z-10 border-t border-white/10 py-12 px-6 md:px-12 lg:px-20 mt-10">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <i data-lucide="wrench" class="w-4 h-4"></i>
        </div>
        <span class="text-lg font-bold text-white">FIXHUB</span>
      </div>
      <p class="text-sm text-white/50">© 2026 FIXHUB. Your Device. Our Solution. Made with ❤️ in the Philippines.</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
  }
})
</script>