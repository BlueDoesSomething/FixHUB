<template>
  <ion-page>
  <div class="relative overflow-x-hidden h-screen overflow-y-auto text-slate-800 bg-gradient-to-br from-[#E8F5EE] via-[#F4FAF6] to-[#E8F5EE]">
    <div class="fixed inset-0 bg-pattern pointer-events-none z-0"></div>
    <div class="fixed top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>
    <div class="fixed bottom-0 left-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none"></div>

    <div id="top" class="relative z-10 min-h-full flex flex-col">
      <nav class="fixed top-0 w-full z-50 bg-brand-primary shadow-lg shadow-brand-primary/20 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-white shadow-lg">
              <i data-lucide="wrench" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-lg font-bold text-white tracking-tight">FIXHUB</span>
              <span class="block text-[9px] text-white/60 -mt-1 tracking-widest uppercase">Devices · Repairs</span>
            </div>
          </div>

          <div class="hidden md:flex items-center gap-8">
            <a href="#features" class="text-sm font-medium text-white/70 hover:text-white transition">Features</a>
            <a href="#how-it-works" class="text-sm font-medium text-white/70 hover:text-white transition">How it Works</a>
            <a href="#about" class="text-sm font-medium text-white/70 hover:text-white transition">About</a>
            <a href="#technicians" class="text-sm font-medium text-white/70 hover:text-white transition">Technicians</a>
          </div>

          <div class="hidden md:flex items-center gap-3">
            <RouterLink to="/become-a-technician" class="px-5 py-2.5 rounded-lg bg-white/10 border border-white/25 text-white text-sm font-bold hover:bg-white/20 transition-all">
              Become a Technician
            </RouterLink>
            <button @click="focusForm" class="px-5 py-2.5 rounded-lg bg-brand-accent text-white text-sm font-bold hover:bg-brand-accentHover transition-all shadow-lg shadow-brand-accent/30">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <LandingHero @get-started="focusForm">
        <template #form>
          <AuthForm />
        </template>
      </LandingHero>

      <section id="features" class="relative py-24 px-6 md:px-12 lg:px-20">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs font-bold text-brand-primary uppercase tracking-wider mb-4">
              WHY CHOOSE FIXHUB
            </div>
            <h2 class="text-3xl md:text-4xl font-extrabold text-brand-primaryDark mb-4">Everything You Need for Device Repair</h2>
            <p class="text-slate-600 max-w-2xl mx-auto text-lg">A complete ecosystem that makes device repair faster, clearer, and more connected.</p>
          </div>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="(feature, idx) in features" :key="idx" class="clean-card p-6 cursor-default">
              <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center mb-5', feature.bg]">
                <i :data-lucide="feature.icon" :class="['w-7 h-7', feature.color]"></i>
              </div>
              <h3 class="text-lg font-bold text-brand-primaryDark mb-2">{{ feature.title }}</h3>
              <p class="text-slate-600 text-sm leading-relaxed">{{ feature.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" class="relative py-24 px-6 md:px-12 lg:px-20">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-xs font-bold text-brand-accent uppercase tracking-wider mb-4">
              SIMPLE PROCESS
            </div>
            <h2 class="text-3xl md:text-4xl font-extrabold text-brand-primaryDark mb-4">How FIXHUB Works</h2>
            <p class="text-slate-600 max-w-2xl mx-auto text-lg">Get your device repaired in 4 simple steps.</p>
          </div>
          <div class="grid md:grid-cols-4 gap-8 relative">
            <div class="hidden md:block absolute top-10 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent opacity-20"></div>
            <div v-for="(step, idx) in steps" :key="idx" class="relative text-center group">
              <div class="w-20 h-20 rounded-full bg-white border-2 border-brand-primaryLight flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:bg-brand-primaryLight transition-colors">
                <i :data-lucide="step.icon" :class="['w-8 h-8', step.color]"></i>
              </div>
              <h3 class="text-lg font-bold text-brand-primaryDark mb-2">{{ step.title }}</h3>
              <p class="text-sm text-slate-600 px-4">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" class="relative py-24 px-6 md:px-12 lg:px-20">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-xs font-bold text-brand-accent uppercase tracking-wider mb-4">
              ABOUT US
            </div>
            <h2 class="text-3xl md:text-4xl font-extrabold text-brand-primaryDark mb-4">Making Device Repair Faster, Clearer, and More Connected</h2>
          </div>

          <div class="grid md:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
              <div class="clean-card p-6">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 rounded-xl bg-brand-primaryLight flex items-center justify-center"><i data-lucide="target" class="w-5 h-5 text-brand-primary"></i></div>
                  <h3 class="text-lg font-bold text-brand-primaryDark">Our Mission</h3>
                </div>
                <p class="text-slate-600 text-sm leading-relaxed">To eliminate the hassle of finding reliable device repair services by connecting customers with verified, skilled technicians through a transparent and smart digital platform.</p>
              </div>
              <div class="clean-card p-6">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center"><i data-lucide="eye" class="w-5 h-5 text-brand-accent"></i></div>
                  <h3 class="text-lg font-bold text-brand-primaryDark">Our Vision</h3>
                </div>
                <p class="text-slate-600 text-sm leading-relaxed">To become the leading and most trusted device repair marketplace in the Philippines, where quality service is just a tap away.</p>
              </div>
            </div>
            <div class="bg-brand-primary rounded-2xl p-8 relative overflow-hidden text-white shadow-xl shadow-brand-primary/20">
              <div class="absolute top-0 right-0 w-40 h-40 bg-brand-accent/20 rounded-full blur-3xl"></div>
              <h3 class="text-2xl font-bold mb-6 relative z-10">The FIXHUB Difference</h3>
              <ul class="space-y-4 relative z-10">
                <li class="flex items-start gap-3"><i data-lucide="check-circle" class="w-5 h-5 text-brand-accent mt-0.5 flex-shrink-0"></i><div><p class="font-semibold text-sm">No More Guesswork</p><p class="text-xs text-white/70">Smart matching ensures you get the right expert for your specific device.</p></div></li>
                <li class="flex items-start gap-3"><i data-lucide="check-circle" class="w-5 h-5 text-brand-accent mt-0.5 flex-shrink-0"></i><div><p class="font-semibold text-sm">Total Transparency</p><p class="text-xs text-white/70">Real-time tracking and clear pricing mean no hidden surprises.</p></div></li>
                <li class="flex items-start gap-3"><i data-lucide="check-circle" class="w-5 h-5 text-brand-accent mt-0.5 flex-shrink-0"></i><div><p class="font-semibold text-sm">Verified Professionals</p><p class="text-xs text-white/70">Every technician is background-checked and skill-verified.</p></div></li>
                <li class="flex items-start gap-3"><i data-lucide="check-circle" class="w-5 h-5 text-brand-accent mt-0.5 flex-shrink-0"></i><div><p class="font-semibold text-sm">Convenience First</p><p class="text-xs text-white/70">Choose between Home Service or Drop-off based on your schedule.</p></div></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="technicians" class="relative py-24 px-6 md:px-12 lg:px-20">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs font-bold text-brand-primary uppercase tracking-wider mb-4">
              OUR EXPERTS
            </div>
            <h2 class="text-3xl md:text-4xl font-extrabold text-brand-primaryDark mb-4">Meet Our Verified Technicians</h2>
            <p class="text-slate-600 max-w-2xl mx-auto text-lg">Skilled professionals ready to fix your devices. Filtered by smart matching based on your needs.</p>
          </div>

          <div class="flex flex-col md:flex-row gap-4 mb-10 justify-center items-center">
            <div class="relative w-full md:w-96">
              <i data-lucide="search" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input type="text" placeholder="Search by name or specialization..." class="w-full pl-11 pr-4 py-3 rounded-xl text-sm border border-slate-200 bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition text-slate-800">
            </div>
            <div class="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button class="px-4 py-2 rounded-lg bg-brand-primary text-white text-xs font-bold whitespace-nowrap shrink-0">All</button>
              <button class="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-bold whitespace-nowrap hover:border-brand-primary hover:text-brand-primary transition shrink-0">Smartphone</button>
              <button class="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-bold whitespace-nowrap hover:border-brand-primary hover:text-brand-primary transition shrink-0">Laptop</button>
              <button class="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-bold whitespace-nowrap hover:border-brand-primary hover:text-brand-primary transition shrink-0">Tablet</button>
            </div>
          </div>

          <p v-if="!technicians.length" class="clean-card p-6 text-center text-slate-600">No technicians are available to display.</p>
          <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="tech in technicians" :key="tech.id" class="clean-card p-6 relative">
              <div :class="['absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5', tech.available ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200']">
                <span :class="['w-1.5 h-1.5 rounded-full', tech.available ? 'bg-green-500 animate-pulse' : 'bg-slate-400']"></span>
                {{ tech.available ? 'Available' : 'Busy' }}
              </div>

              <div class="flex items-center gap-4 mb-4">
                <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg', tech.avatarBg]">
                  {{ tech.initials }}
                </div>
                <div>
                  <h3 class="text-lg font-bold text-brand-primaryDark">{{ tech.name }}</h3>
                  <p class="text-xs text-brand-primary font-medium">{{ tech.specialization }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div class="flex items-center gap-1 mb-1">
                    <i data-lucide="star" class="w-3 h-3 text-brand-accent fill-brand-accent"></i>
                    <span class="text-xs font-bold text-slate-700">{{ tech.rating }}</span>
                  </div>
                  <p class="text-[10px] text-slate-500">{{ tech.reviews }} reviews</p>
                </div>
                <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div class="flex items-center gap-1 mb-1">
                    <i data-lucide="map-pin" class="w-3 h-3 text-brand-primary"></i>
                    <span class="text-xs font-bold text-slate-700">{{ tech.distance }}</span>
                  </div>
                  <p class="text-[10px] text-slate-500">Away from you</p>
                </div>
              </div>

              <div class="flex items-center gap-2 mb-5 text-xs text-slate-500">
                <i data-lucide="briefcase" class="w-3.5 h-3.5"></i>
                <span>{{ tech.completed }} repairs completed</span>
              </div>

              <div class="flex gap-2">
                <button @click="openProfile(tech)" class="flex-1 py-2.5 rounded-xl border border-brand-primary/20 text-brand-primary text-xs font-bold hover:bg-brand-primaryLight transition">View Profile</button>
                <button @click="onRequest()" :disabled="!tech.available" :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1', tech.available ? 'bg-brand-primary text-white hover:bg-brand-primaryDark' : 'bg-slate-100 text-slate-400 cursor-not-allowed']">
                  {{ tech.available ? 'Request' : 'Unavailable' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="relative py-24 px-6 md:px-12 lg:px-20">
        <div class="max-w-5xl mx-auto">
          <div class="bg-brand-primary rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            <div class="absolute -top-20 -left-20 w-60 h-60 bg-brand-accent/20 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-20 -right-20 w-60 h-60 bg-brand-primaryDark/30 rounded-full blur-3xl"></div>
            <div class="relative z-10">
              <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-brand-accent uppercase tracking-wider mb-6">
                <i data-lucide="zap" class="w-4 h-4"></i> Get Started Today
              </div>
              <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">Ready to Fix Your Device?</h2>
              <p class="text-white/80 text-lg max-w-2xl mx-auto mb-10">Create your account to get started with FIXHUB.</p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button @click="focusForm" class="group px-8 py-4 rounded-2xl bg-brand-accent text-white font-bold text-base hover:bg-brand-accentHover transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/20">
                  Request a Repair Now <i data-lucide="arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform"></i>
                </button>
                <a href="#technicians" class="group px-8 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-white font-bold text-base hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                  Browse Technicians <i data-lucide="users" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="join" class="relative py-24 px-6 md:px-12 lg:px-20">
        <div class="max-w-5xl mx-auto">
          <div class="bg-white rounded-3xl border border-brand-primary/10 p-10 md:p-14 text-center shadow-xl shadow-brand-primary/5 relative overflow-hidden">
            <div class="absolute -top-16 -right-16 w-52 h-52 bg-brand-accent/10 rounded-full blur-3xl"></div>
            <div class="relative z-10">
              <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs font-bold text-brand-primary uppercase tracking-wider mb-6">
                <i data-lucide="badge-check" class="w-4 h-4"></i> For Technicians
              </div>
              <h2 class="text-3xl md:text-4xl font-extrabold text-brand-primaryDark mb-4">Are You a Repair Expert?</h2>
              <p class="text-slate-600 text-lg max-w-2xl mx-auto mb-8">Join FIXHUB as a verified technician, get matched with customers near you, and grow your repair business.</p>
              <RouterLink to="/become-a-technician" class="group inline-flex px-8 py-4 rounded-2xl bg-brand-primary text-white font-bold text-base hover:bg-brand-primaryDark transition-all items-center justify-center gap-3 shadow-lg shadow-brand-primary/25">
                Become a Technician <i data-lucide="arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform"></i>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <footer class="bg-brand-primaryDark pt-12 pb-28 md:pb-12 px-6 md:px-12 lg:px-20 mt-10">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center"><i data-lucide="wrench" class="w-4 h-4 text-white"></i></div>
              <span class="text-lg font-bold text-white">FIXHUB</span>
            </div>
            <div class="flex gap-6 text-sm text-white/60">
              <a href="#features" class="hover:text-white transition">Features</a>
              <a href="#how-it-works" class="hover:text-white transition">How it Works</a>
              <a href="#about" class="hover:text-white transition">About</a>
              <a href="#technicians" class="hover:text-white transition">Technicians</a>
            </div>
          </div>
          <div class="pt-8 border-t border-white/10 text-center">
            <p class="text-sm text-white/50">© 2026 FIXHUB. Your Device. Our Solution. Made with love in the Philippines.</p>
          </div>
        </div>
      </footer>
    </div>

    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-brand-primary/10 shadow-[0_-6px_20px_rgba(20,99,68,0.10)]">
      <div class="grid grid-cols-5 max-w-lg mx-auto">
        <template v-for="item in mobileNav" :key="item.label">
          <button v-if="item.action === 'login'" @click="showLogin = true" class="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-brand-accent">
            <i :data-lucide="item.icon" class="w-5 h-5"></i>
            <span>{{ item.label }}</span>
          </button>
          <a v-else :href="item.href" class="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-slate-500 hover:text-brand-primary transition">
            <i :data-lucide="item.icon" class="w-5 h-5"></i>
            <span>{{ item.label }}</span>
          </a>
        </template>
      </div>
    </nav>

    <TechnicianProfileModal :tech="selectedTech" @close="selectedTech = null" @request="onRequest" />
    <LoginModal :open="showLogin" @close="showLogin = false" />
  </div>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage } from '@ionic/vue'
import LandingHero from '../../components/landing/home/LandingHero.vue'
import AuthForm from '../../components/landing/home/AuthForm.vue'
import LoginModal from '../../components/landing/home/LoginModal.vue'
import TechnicianProfileModal from '../../components/landing/home/TechnicianProfileModal.vue'
import { features } from '../../data/landing/features'
import { steps } from '../../data/landing/steps'
import { technicians, type LandingTechnician } from '../../data/landing/technicians'
import { useAuth } from '../../stores/auth'

const router = useRouter()
const { state } = useAuth()

const selectedTech = ref<LandingTechnician | null>(null)
const showLogin = ref(false)

const mobileNav: { label: string; href: string; icon: string; action?: string }[] = [
  { label: 'Home', href: '#top', icon: 'home' },
  { label: 'Features', href: '#features', icon: 'layout-grid' },
  { label: 'Steps', href: '#how-it-works', icon: 'list-checks' },
  { label: 'Experts', href: '#technicians', icon: 'users' },
  { label: 'Login', action: 'login', href: '#form-container', icon: 'log-in' },
]

const focusForm = () => {
  const el = document.getElementById('form-container')
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const card = el?.querySelector('.glass-form') as HTMLElement | null
  if (card) {
    card.style.boxShadow = '0 0 40px rgba(20, 99, 68, 0.2)'
    setTimeout(() => (card.style.boxShadow = ''), 1000)
  }
}

const openProfile = (tech: LandingTechnician) => {
  selectedTech.value = tech
}

const onRequest = () => {
  if (!state.isAuthenticated) {
    selectedTech.value = null
    showLogin.value = true
    return
  }
  router.push('/client/request')
}

let iconTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons()
    iconTimer = setInterval(() => lucide.createIcons(), 500)
  }
})
onUnmounted(() => {
  if (iconTimer) clearInterval(iconTimer)
})
</script>

<style scoped>
section[id] { scroll-margin-top: 88px; }
</style>
