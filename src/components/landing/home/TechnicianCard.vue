<template>
  <div class="glass-card rounded-2xl p-6 hover-lift relative group">
    <div :class="['absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5', tech.available ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30']">
      <span :class="['w-1.5 h-1.5 rounded-full', tech.available ? 'bg-green-400 animate-pulse' : 'bg-red-400']"></span>
      {{ tech.available ? 'Available' : 'Busy' }}
    </div>

    <div class="flex items-center gap-4 mb-4">
      <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg', tech.avatarBg]">
        {{ tech.initials }}
      </div>
      <div>
        <h3 class="text-lg font-bold text-white">{{ tech.name }}</h3>
        <p class="text-xs text-brand-teal font-medium">{{ tech.specialization }}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-white/5 rounded-xl p-3 border border-white/5">
        <div class="flex items-center gap-1 mb-1">
          <i data-lucide="star" class="w-3 h-3 text-yellow-400 fill-yellow-400"></i>
          <span class="text-xs font-bold text-white">{{ tech.rating }}</span>
        </div>
        <p class="text-[10px] text-white/50">{{ tech.reviews }} reviews</p>
      </div>
      <div class="bg-white/5 rounded-xl p-3 border border-white/5">
        <div class="flex items-center gap-1 mb-1">
          <i data-lucide="map-pin" class="w-3 h-3 text-brand-blue"></i>
          <span class="text-xs font-bold text-white">{{ tech.distance }}</span>
        </div>
        <p class="text-[10px] text-white/50">Away from you</p>
      </div>
    </div>

    <div class="flex items-center gap-2 mb-5 text-xs text-white/60">
      <i data-lucide="briefcase" class="w-3.5 h-3.5"></i>
      <span>{{ tech.completed }} repairs completed</span>
    </div>

    <div class="flex gap-2">
      <button class="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition">View Profile</button>
      <button :disabled="!tech.available" :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1', tech.available ? 'bg-gradient-to-r from-brand-blue to-brand-teal text-white hover:shadow-lg' : 'bg-white/5 text-white/30 cursor-not-allowed']">
        {{ tech.available ? 'Request' : 'Unavailable' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tech: {
    id: number
    name: string
    initials: string
    specialization: string
    rating: number
    reviews: number
    distance: string
    completed: number
    available: boolean
    avatarBg: string
  }
}>()
</script>