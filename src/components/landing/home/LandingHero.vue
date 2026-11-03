<template>
  <main class="flex-1 flex items-center px-6 md:px-12 lg:px-20 pt-32 pb-10 relative z-10">
    <div class="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

      <div class="space-y-8 order-2 lg:order-1">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primaryLight border border-brand-primary/10 text-xs font-bold text-brand-primary uppercase tracking-wider">
          <span class="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
          Smart Repair Marketplace
        </div>

        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-brand-primaryDark">
          Your Device. <br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">Our Solution.</span>
        </h1>

        <p class="text-lg text-slate-600 max-w-md leading-relaxed">
          Connect with verified technicians, track repairs in real-time, and get your gadgets fixed at home or via drop-off.
        </p>

        <div class="flex flex-col sm:flex-row gap-4">
          <button @click="$emit('get-started')" class="group px-8 py-4 rounded-2xl bg-brand-primary text-white font-bold text-base hover:bg-brand-primaryDark transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/30">
            Get Started
            <i data-lucide="arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform"></i>
          </button>
          <a href="#technicians" class="group px-8 py-4 rounded-2xl bg-white text-brand-primaryDark font-bold text-base border border-brand-primary/10 hover:border-brand-primary/30 transition-all flex items-center justify-center gap-3 text-center shadow-sm">
            Find a Technician
            <i data-lucide="search" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
          </a>
        </div>

        <div class="relative mt-8 hidden lg:block">
          <div class="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-brand-accent/10 rounded-[2rem] blur-2xl"></div>
          <div class="relative grid grid-cols-3 gap-4 items-center">
            <div class="app-card p-4 float-slow">
              <div class="app-card-inner p-4 flex flex-col items-center">
                <div class="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center mb-3 shadow-lg">
                  <i data-lucide="smartphone" class="w-8 h-8 text-white"></i>
                </div>
                <h4 class="font-bold text-brand-primaryDark text-sm">Device Repairs</h4>
                <p class="text-xs text-slate-500 mb-3">Describe your device issue</p>
              </div>
            </div>
            <div class="app-card p-5 float-img relative">
              <div class="absolute -top-3 -right-3 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 border border-slate-100 z-10">
                <div class="w-7 h-7 rounded-full bg-brand-primaryLight flex items-center justify-center"><i data-lucide="check" class="w-4 h-4 text-brand-primary"></i></div>
                <div><p class="text-xs font-bold text-brand-primaryDark leading-tight">Verified</p><p class="text-[9px] text-slate-500">Background Check</p></div>
              </div>
              <div class="absolute -bottom-3 -left-3 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 border border-slate-100 z-10">
                <div class="w-7 h-7 rounded-full bg-brand-accent/20 flex items-center justify-center"><i data-lucide="star" class="w-4 h-4 text-brand-accent fill-brand-accent"></i></div>
                <div><p class="text-xs font-bold text-brand-primaryDark leading-tight">Customer Feedback</p><p class="text-[9px] text-slate-500">Repair reviews</p></div>
              </div>
              <div class="flex flex-col items-center py-4">
                <div class="w-32 h-32 rounded-full mint-bg flex items-center justify-center">
                  <div class="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md">
                    <div class="w-16 h-16 rounded-full bg-brand-primary flex items-center justify-center">
                      <i data-lucide="wrench" class="w-8 h-8 text-white"></i>
                    </div>
                  </div>
                </div>
                <h4 class="font-bold text-brand-primaryDark text-sm mt-4">Expert Repair</h4>
                <p class="text-xs text-slate-500">At Your Doorstep</p>
              </div>
            </div>
            <div class="app-card p-4 float-fast">
              <div class="app-card-inner mint-bg p-4 flex flex-col items-center relative h-full">
                <div class="absolute inset-0 flex items-center justify-center opacity-30">
                  <div class="w-24 h-24 border-2 border-brand-primary rounded-full"></div>
                  <div class="absolute w-16 h-16 border-2 border-brand-accent rounded-full"></div>
                </div>
                <div class="relative z-10 flex flex-col items-center py-4">
                  <div class="w-12 h-12 rounded-full bg-brand-accent flex items-center justify-center mb-2 shadow-lg"><i data-lucide="map-pin" class="w-6 h-6 text-white"></i></div>
                  <h4 class="font-bold text-brand-primaryDark text-sm">Service Location</h4>
                  <p class="text-xs text-slate-600 mb-3">Choose your location</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="order-1 lg:order-2 flex justify-center lg:justify-end" id="form-container">
        <slot name="form" />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
defineEmits(['get-started'])
onMounted(() => {
  if (typeof lucide !== 'undefined') lucide.createIcons()
})
</script>
