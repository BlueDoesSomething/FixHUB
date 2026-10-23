<template>
  <div class="glass-form relative p-8 w-full max-w-md">
    <div class="flex bg-white/50 p-1 rounded-full mb-6 border border-brand-primary/10">
      <button @click="isSignUp = false" :class="['flex-1 py-2.5 rounded-full text-sm font-bold transition-all', !isSignUp ? 'glass-tab active' : 'glass-tab']">Login</button>
      <button @click="isSignUp = true" :class="['flex-1 py-2.5 rounded-full text-sm font-bold transition-all', isSignUp ? 'glass-tab active' : 'glass-tab']">Sign Up</button>
    </div>

    <transition name="fade" mode="out-in">
      <div v-if="!isSignUp" key="login" class="space-y-5 relative z-10">
        <div class="text-center mb-2">
          <h2 class="text-2xl font-bold text-brand-primaryDark">Welcome Back</h2>
          <p class="text-sm text-slate-500 mt-1">Login to continue to FIXHUB.</p>
        </div>
        <div>
          <label class="block text-xs font-bold text-brand-primaryDark/70 mb-2 uppercase tracking-wider">Email Address</label>
          <div class="relative">
            <i data-lucide="mail" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/40"></i>
            <input v-model="loginForm.email" type="email" placeholder="alex@email.com" class="block w-full pl-11 pr-4 py-3.5 rounded-xl text-sm placeholder-slate-400 bg-white/70 border border-brand-primary/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition text-brand-primaryDark">
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-brand-primaryDark/70 mb-2 uppercase tracking-wider">Password</label>
          <div class="relative">
            <i data-lucide="lock" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/40"></i>
            <input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" class="block w-full pl-11 pr-11 py-3.5 rounded-xl text-sm placeholder-slate-400 bg-white/70 border border-brand-primary/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition text-brand-primaryDark">
            <button type="button" @click="showPassword = !showPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary transition">
              <i :data-lucide="showPassword ? 'eye-off' : 'eye'" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div class="flex justify-between items-center text-xs">
          <label class="flex items-center gap-2 text-slate-500 cursor-pointer">
            <input type="checkbox" class="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"> Remember me
          </label>
          <a href="#" class="text-brand-primary hover:text-brand-primaryDark transition font-medium">Forgot Password?</a>
        </div>
        <button @click="handleLogin" class="w-full py-4 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primaryDark transition-all flex items-center justify-center gap-2 group shadow-lg shadow-brand-primary/20">
          Login & Continue
          <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
        </button>
        <div class="relative my-4">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-brand-primary/10"></div></div>
          <div class="relative flex justify-center text-xs"><span class="bg-[#E8F5EE]/0 px-3 text-slate-400">or continue with</span></div>
        </div>
        <button class="w-full py-3.5 rounded-xl bg-white text-brand-primaryDark font-semibold text-sm flex items-center justify-center gap-2 border border-brand-primary/10 hover:border-brand-primary/30 transition">
          <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google
        </button>
      </div>

      <div v-else key="signup" class="space-y-5 relative z-10">
        <div class="text-center mb-2">
          <h2 class="text-2xl font-bold text-brand-primaryDark">Create Account</h2>
          <p class="text-sm text-slate-500 mt-1">Join FIXHUB and fix your devices.</p>
        </div>
        <div>
          <label class="block text-xs font-bold text-brand-primaryDark/70 mb-2 uppercase tracking-wider">Full Name</label>
          <div class="relative">
            <i data-lucide="user" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/40"></i>
            <input v-model="signUpForm.name" type="text" placeholder="Juan Dela Cruz" class="block w-full pl-11 pr-4 py-3.5 rounded-xl text-sm placeholder-slate-400 bg-white/70 border border-brand-primary/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition text-brand-primaryDark">
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-brand-primaryDark/70 mb-2 uppercase tracking-wider">Email Address</label>
          <div class="relative">
            <i data-lucide="mail" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/40"></i>
            <input v-model="signUpForm.email" type="email" placeholder="juan@email.com" class="block w-full pl-11 pr-4 py-3.5 rounded-xl text-sm placeholder-slate-400 bg-white/70 border border-brand-primary/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition text-brand-primaryDark">
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-brand-primaryDark/70 mb-2 uppercase tracking-wider">Password</label>
          <div class="relative">
            <i data-lucide="lock" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/40"></i>
            <input v-model="signUpForm.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" class="block w-full pl-11 pr-11 py-3.5 rounded-xl text-sm placeholder-slate-400 bg-white/70 border border-brand-primary/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition text-brand-primaryDark">
            <button type="button" @click="showPassword = !showPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary transition">
              <i :data-lucide="showPassword ? 'eye-off' : 'eye'" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <button @click="handleSignUp" class="w-full py-4 rounded-xl bg-brand-accent text-white font-bold text-sm hover:bg-brand-accentHover transition-all flex items-center justify-center gap-2 group shadow-lg shadow-brand-accent/20">
          Create Account
          <i data-lucide="user-plus" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
        </button>
        <p class="text-xs text-slate-400 text-center mt-4">By signing up, you agree to our <a href="#" class="text-brand-primary hover:underline">Terms</a> and <a href="#" class="text-brand-primary hover:underline">Privacy Policy</a>.</p>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../../stores/auth'

const router = useRouter()
const { login } = useAuth()

const props = withDefaults(defineProps<{ redirect?: string }>(), { redirect: '/client/home' })

const isSignUp = ref(false)
const showPassword = ref(false)
const loginForm = ref({ email: '', password: '' })
const signUpForm = ref({ name: '', email: '', password: '' })

const handleLogin = () => {
  if (!loginForm.value.email) { alert('Please enter an email.'); return }
  login('client')
  router.push(props.redirect)
}

const handleSignUp = () => {
  if (!signUpForm.value.email || !signUpForm.value.name) { alert('Please fill in all fields.'); return }
  alert('Account created successfully! (Demo)')
  isSignUp.value = false
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