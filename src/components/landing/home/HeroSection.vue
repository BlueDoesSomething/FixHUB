<template>
  <main class="flex-1 flex items-center px-6 md:px-12 lg:px-20 pt-32 pb-10 relative z-10">
    <div class="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

      <div class="space-y-8 order-2 lg:order-1">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-bold text-brand-teal uppercase tracking-wider">
          <span class="w-2 h-2 rounded-full bg-brand-teal animate-pulse"></span>
          Smart Repair Marketplace
        </div>

        <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
          Your Device. <br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-brand-blue">Our Solution.</span>
        </h1>

        <p class="text-lg text-white/70 max-w-md leading-relaxed">
          Connect with verified technicians, track repairs in real-time, and get your gadgets fixed at home or via drop-off.
        </p>

        <div class="flex flex-col sm:flex-row gap-4">
          <button @click="$emit('get-started')" class="group px-8 py-4 rounded-2xl bg-white text-brand-dark font-bold text-base hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-3">
            Get Started
            <i data-lucide="arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform"></i>
          </button>
          <a href="#technicians" class="group px-8 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-white font-bold text-base hover:bg-white/20 transition-all flex items-center justify-center gap-3 text-center">
            Find a Technician
            <i data-lucide="search" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
          </a>
        </div>

        <div class="relative mt-8 hidden lg:block">
          <div class="absolute inset-0 bg-gradient-to-tr from-brand-teal/20 to-brand-blue/20 rounded-[2rem] blur-2xl"></div>
          <div class="relative grid grid-cols-3 gap-4 items-center">
            <div class="app-card p-4 float-slow">
              <div class="app-card-inner p-4 flex flex-col items-center">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-dark flex items-center justify-center mb-3 shadow-lg">
                  <i data-lucide="smartphone" class="w-8 h-8 text-white"></i>
                </div>
                <h4 class="font-bold text-brand-dark text-sm">iPhone 13 Pro</h4>
                <p class="text-xs text-slate-500 mb-3">Battery Replacement</p>
                <div class="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                  <div class="progress-bar h-1.5 rounded-full" style="width: 75%"></div>
                </div>
                <p class="text-xs font-bold text-brand-blue">75% Complete</p>
              </div>
            </div>
            <div class="app-card p-5 float-img relative">
              <div class="absolute -top-3 -right-3 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 border border-slate-100 z-10">
                <div class="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center"><i data-lucide="check" class="w-4 h-4 text-green-600"></i></div>
                <div><p class="text-xs font-bold text-brand-dark leading-tight">Verified</p><p class="text-[9px] text-slate-500">Background Check</p></div>
              </div>
              <div class="absolute -bottom-3 -left-3 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 border border-slate-100 z-10">
                <div class="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center"><i data-lucide="star" class="w-4 h-4 text-yellow-500 fill-yellow-500"></i></div>
                <div><p class="text-xs font-bold text-brand-dark leading-tight">4.9 Rating</p><p class="text-[9px] text-slate-500">247 Reviews</p></div>
              </div>
              <div class="flex flex-col items-center py-4">
                <div class="w-32 h-32 rounded-full mint-bg flex items-center justify-center">
                  <div class="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-brand-blue to-brand-dark flex items-center justify-center">
                      <i data-lucide="wrench" class="w-8 h-8 text-white"></i>
                    </div>
                  </div>
                </div>
                <h4 class="font-bold text-brand-dark text-sm mt-4">Expert Repair</h4>
                <p class="text-xs text-slate-500">At Your Doorstep</p>
              </div>
            </div>
            <div class="app-card p-4 float-fast">
              <div class="app-card-inner mint-bg p-4 flex flex-col items-center relative h-full">
                <div class="absolute inset-0 flex items-center justify-center opacity-30">
                  <div class="w-24 h-24 border-2 border-brand-blue rounded-full"></div>
                  <div class="absolute w-16 h-16 border-2 border-brand-teal rounded-full"></div>
                </div>
                <div class="relative z-10 flex flex-col items-center py-4">
                  <div class="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center mb-2 shadow-lg"><i data-lucide="map-pin" class="w-6 h-6 text-white"></i></div>
                  <h4 class="font-bold text-brand-dark text-sm">Technician Nearby</h4>
                  <p class="text-xs text-slate-600 mb-3">1.2 km away</p>
                  <div class="bg-white rounded-lg px-4 py-1.5 shadow-sm"><p class="text-xs font-bold text-brand-blue">ETA: 8 mins</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="order-1 lg:order-2 flex justify-center lg:justify-end" id="form-container">
        <AuthForm />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AuthForm from './AuthForm.vue'

onMounted(() => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
  }
})

defineEmits(['get-started'])
</script>