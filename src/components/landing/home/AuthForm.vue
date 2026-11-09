<template>
  <div class="glass-form relative p-8 w-full max-w-md">
    <div class="flex bg-white/50 p-1 rounded-full mb-6 border border-brand-primary/10">
      <button type="button" :disabled="state.loading" @click="setMode('login')" :class="['flex-1 py-2.5 rounded-full text-sm font-bold transition-all', mode !== 'signup' ? 'glass-tab active' : 'glass-tab']">Login</button>
      <button type="button" :disabled="state.loading" @click="setMode('signup')" :class="['flex-1 py-2.5 rounded-full text-sm font-bold transition-all', mode === 'signup' ? 'glass-tab active' : 'glass-tab']">Sign Up</button>
    </div>

    <transition name="fade" mode="out-in">
      <form v-if="mode === 'login'" key="login" class="space-y-5 relative z-10" novalidate @submit.prevent="handleLogin">
        <div class="text-center mb-2">
          <h2 class="text-2xl font-bold text-brand-primaryDark">Welcome Back</h2>
          <p class="text-sm text-slate-500 mt-1">Login to continue to FIXHUB.</p>
        </div>
        <div>
          <label :for="emailId" class="block text-xs font-bold text-brand-primaryDark/70 mb-2 uppercase tracking-wider">Email Address</label>
          <div class="relative">
            <i data-lucide="mail" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/40"></i>
            <input :id="emailId" v-model="loginForm.email" data-testid="login-email" type="email" autocomplete="username" placeholder="Your email address" :aria-invalid="!!loginError" @input="loginError = ''" class="block w-full pl-11 pr-4 py-3.5 rounded-xl text-sm placeholder-slate-400 bg-white/70 border border-brand-primary/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition text-brand-primaryDark">
          </div>
        </div>
        <div>
          <label :for="passwordId" class="block text-xs font-bold text-brand-primaryDark/70 mb-2 uppercase tracking-wider">Password</label>
          <div class="relative">
            <i data-lucide="lock" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/40"></i>
            <input :id="passwordId" v-model="loginForm.password" data-testid="login-password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Your password" required class="block w-full pl-11 pr-11 py-3.5 rounded-xl text-sm placeholder-slate-400 bg-white/70 border border-brand-primary/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition text-brand-primaryDark">
            <button type="button" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary transition">
              <i :data-lucide="showPassword ? 'eye-off' : 'eye'" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div class="flex flex-wrap justify-between items-center gap-3 text-xs">
          <button type="button" :disabled="state.loading" @click="handleResend" class="text-brand-primary hover:underline font-medium">Resend confirmation email</button>
          <button type="button" :disabled="state.loading" @click="setMode('reset')" class="text-brand-primary hover:underline font-medium">Forgot Password?</button>
        </div>
        <p v-if="loginMessage" role="status" class="text-sm text-brand-primary">{{ loginMessage }}</p>
        <p v-if="loginError" role="alert" class="text-sm text-red-700">{{ loginError }}</p>
        <button type="submit" :disabled="state.loading" @click.prevent="handleLogin" class="w-full py-4 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primaryDark transition-all flex items-center justify-center gap-2 group shadow-lg shadow-brand-primary/20">
          {{ state.loading ? 'Signing in…' : 'Login & Continue' }}
          <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
        </button>
        <div class="relative my-4">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-brand-primary/10"></div></div>
          <div class="relative flex justify-center text-xs"><span class="bg-[#E8F5EE]/0 px-3 text-slate-400">or continue with</span></div>
        </div>
        <button type="button" data-testid="google-sign-in" :disabled="state.loading" @click="handleGoogle" class="w-full py-3.5 rounded-xl bg-white text-brand-primaryDark font-semibold text-sm flex items-center justify-center gap-2 border border-brand-primary/10 hover:border-brand-primary/30 transition">
          <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google
        </button>
      </form>

      <form v-else-if="mode === 'signup'" key="signup" class="space-y-5 relative z-10" novalidate @submit.prevent="handleSignUp">
        <div class="text-center mb-2">
          <h2 class="text-2xl font-bold text-brand-primaryDark">Create Account</h2>
          <p class="text-sm text-slate-500 mt-1">Join FIXHUB and fix your devices.</p>
        </div>
        <div>
          <label :for="`${id}-signup-name`" class="block text-xs font-bold text-brand-primaryDark/70 mb-2 uppercase tracking-wider">Full Name</label>
          <div class="relative">
            <i data-lucide="user" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/40"></i>
            <input :id="`${id}-signup-name`" v-model="signUpForm.name" data-testid="signup-name" type="text" autocomplete="name" maxlength="120" placeholder="Your full name" class="block w-full pl-11 pr-4 py-3.5 rounded-xl text-sm placeholder-slate-400 bg-white/70 border border-brand-primary/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition text-brand-primaryDark">
          </div>
        </div>
        <div>
          <label :for="`${id}-signup-email`" class="block text-xs font-bold text-brand-primaryDark/70 mb-2 uppercase tracking-wider">Email Address</label>
          <div class="relative">
            <i data-lucide="mail" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/40"></i>
            <input :id="`${id}-signup-email`" v-model="signUpForm.email" data-testid="signup-email" type="email" autocomplete="email" placeholder="Your email address" class="block w-full pl-11 pr-4 py-3.5 rounded-xl text-sm placeholder-slate-400 bg-white/70 border border-brand-primary/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition text-brand-primaryDark">
          </div>
        </div>
        <div>
          <label :for="`${id}-signup-password`" class="block text-xs font-bold text-brand-primaryDark/70 mb-2 uppercase tracking-wider">Password</label>
          <div class="relative">
            <i data-lucide="lock" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/40"></i>
            <input :id="`${id}-signup-password`" v-model="signUpForm.password" data-testid="signup-password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="At least 12 characters" class="block w-full pl-11 pr-11 py-3.5 rounded-xl text-sm placeholder-slate-400 bg-white/70 border border-brand-primary/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition text-brand-primaryDark">
            <button type="button" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary transition">
              <i :data-lucide="showPassword ? 'eye-off' : 'eye'" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <p v-if="loginError" role="alert" class="text-sm text-red-700">{{ loginError }}</p>
        <button type="submit" :disabled="state.loading" @click.prevent="handleSignUp" class="w-full py-4 rounded-xl bg-brand-accent text-white font-bold text-sm hover:bg-brand-accentHover transition-all flex items-center justify-center gap-2 group shadow-lg shadow-brand-accent/20">
          {{ state.loading ? 'Creating account…' : 'Create Account' }}
          <i data-lucide="user-plus" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
        </button>
        <button type="button" data-testid="google-sign-in" :disabled="state.loading" @click="handleGoogle" class="w-full py-3.5 rounded-xl bg-white text-brand-primaryDark font-semibold text-sm border border-brand-primary/10">Continue with Google</button>
        <p class="text-xs text-slate-400 text-center mt-4">By signing up, you agree to our <a href="#" class="text-brand-primary hover:underline">Terms</a> and <a href="#" class="text-brand-primary hover:underline">Privacy Policy</a>.</p>
      </form>

      <form v-else key="reset" class="space-y-5 relative z-10" novalidate @submit.prevent="handlePasswordReset">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-brand-primaryDark">Reset your password</h2>
          <p class="text-sm text-slate-500 mt-1">We’ll email you a link to choose a new password.</p>
        </div>
        <div>
          <label :for="`${id}-reset-email`" class="block text-xs font-bold text-brand-primaryDark/70 mb-2">Email Address</label>
          <input :id="`${id}-reset-email`" v-model="loginForm.email" data-testid="reset-email" type="email" autocomplete="email" class="fx-input" placeholder="Your email address" />
        </div>
        <p v-if="loginMessage" role="status" class="text-sm text-brand-primary">{{ loginMessage }}</p>
        <p v-if="loginError" role="alert" class="text-sm text-red-700">{{ loginError }}</p>
        <button type="submit" :disabled="state.loading" @click.prevent="handlePasswordReset" class="w-full py-4 rounded-xl bg-brand-primary text-white font-bold text-sm">{{ state.loading ? 'Sending…' : 'Send reset link' }}</button>
        <button type="button" :disabled="state.loading" @click="setMode('login')" class="w-full text-sm text-brand-primary">Back to login</button>
      </form>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, useId } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../../stores/auth'
import { safeAuthReturnPath } from '../../../services/authRedirect'

const router = useRouter()
const { loginWithEmail, loginWithGoogle, signUp, requestPasswordReset, resendConfirmation, state } = useAuth()

const props = defineProps<{ redirect?: string }>()
const id = useId()
const emailId = `${id}-login-email`
const passwordId = `${id}-login-password`

type FormMode = 'login' | 'signup' | 'reset'
const mode = ref<FormMode>('login')
const showPassword = ref(false)
const loginForm = ref({ email: '', password: '' })
const signUpForm = ref({ name: '', email: '', password: '' })
const loginError = ref('')
const loginMessage = ref('')

function setMode(value: FormMode) {
  mode.value = value
  loginError.value = ''
  loginMessage.value = ''
  showPassword.value = false
}

function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) }

const handleLogin = () => {
  if (state.loading) return
  const email = loginForm.value.email.trim()
  if (!validEmail(email)) {
    loginError.value = 'Please enter a valid email address.'
    return
  }
  loginError.value = ''
  loginMessage.value = ''

  if (!loginForm.value.password) {
    loginError.value = 'Enter your password.'
    return
  }
  void loginWithEmail(email, loginForm.value.password)
    .then(user => router.push(safeAuthReturnPath(props.redirect) || user.homeRoute))
    .catch(err => { loginError.value = err instanceof Error ? err.message : 'Sign-in failed.' })
}

const handleSignUp = async () => {
  if (state.loading) return
  const name = signUpForm.value.name.trim()
  if (name.length < 2 || name.length > 120) {
    loginError.value = 'Use a full name of 2–120 characters.'
    return
  }
  if (!validEmail(signUpForm.value.email)) {
    loginError.value = 'Please enter a valid email address.'
    return
  }
  if (signUpForm.value.password.length < 12) {
    loginError.value = 'Password must be at least 12 characters.'
    return
  }
  loginError.value = ''
  loginMessage.value = ''

  try {
    const user = await signUp(name, signUpForm.value.email.trim(), signUpForm.value.password)
    if (user) {
      await router.push(safeAuthReturnPath(props.redirect) || user.homeRoute)
    } else {
      loginForm.value.email = signUpForm.value.email.trim()
      loginForm.value.password = ''
      mode.value = 'login'
      loginMessage.value = 'Check your email and click the confirmation link to finish creating your account. Check Spam too. You can resend the link below.'
    }
    signUpForm.value.password = ''
  } catch (err) {
    loginError.value = err instanceof Error ? err.message : 'Sign-up failed.'
  }
}

async function handleGoogle() {
  if (state.loading) return
  loginError.value = ''
  loginMessage.value = ''
  try { await loginWithGoogle(safeAuthReturnPath(props.redirect)) }
  catch (error) { loginError.value = error instanceof Error ? error.message : 'Google sign-in could not be started.' }
}

async function handleResend() {
  if (state.loading) return
  loginError.value = ''
  loginMessage.value = ''
  if (!validEmail(loginForm.value.email)) { loginError.value = 'Enter your email address above first.'; return }
  try {
    await resendConfirmation(loginForm.value.email.trim())
    loginMessage.value = 'If this address has an account awaiting confirmation, a new link has been sent. Check your inbox and Spam folder.'
  } catch (error) { loginError.value = error instanceof Error ? error.message : 'The confirmation email could not be sent.' }
}

async function handlePasswordReset() {
  if (state.loading) return
  loginError.value = ''
  loginMessage.value = ''
  if (!validEmail(loginForm.value.email)) { loginError.value = 'Please enter a valid email address.'; return }
  try {
    await requestPasswordReset(loginForm.value.email.trim())
    loginMessage.value = 'If this address has an account, a password reset link has been sent. Check your inbox and Spam folder.'
  } catch (error) { loginError.value = error instanceof Error ? error.message : 'The password reset email could not be sent.' }
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
