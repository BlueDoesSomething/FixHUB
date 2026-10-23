<template>
  <ion-page>
  <div class="bt relative h-screen overflow-y-auto overflow-x-hidden text-slate-800 bg-gradient-to-br from-[#E8F5EE] via-[#F4FAF6] to-[#E8F5EE]">
    <div class="fixed inset-0 bg-pattern pointer-events-none z-0"></div>

    <nav class="fixed top-0 w-full z-50 bg-brand-primary shadow-lg shadow-brand-primary/20">
      <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-white shadow-lg">
            <i data-lucide="wrench" class="w-4 h-4"></i>
          </div>
          <div>
            <span class="text-lg font-bold text-white tracking-tight">FIXHUB</span>
            <span class="block text-[9px] text-white/60 -mt-1 tracking-widest uppercase">Devices · Repairs</span>
          </div>
        </RouterLink>
        <RouterLink to="/" class="px-5 py-2.5 rounded-lg bg-white/10 border border-white/25 text-white text-sm font-bold hover:bg-white/20 transition-all">
          Back to Home
        </RouterLink>
      </div>
    </nav>

    <div class="relative z-10">
      <header class="max-w-6xl mx-auto px-6 pt-32 pb-10 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/25 text-xs font-bold text-brand-accent uppercase tracking-wider mb-5">
          <i data-lucide="badge-check" class="w-4 h-4"></i> Join Our Network
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold text-brand-primaryDark leading-tight mb-4">
          Become a FIXHUB Technician
        </h1>
        <p class="text-slate-600 text-lg max-w-2xl mx-auto mb-8">
          Turn your repair skills into steady income. Get matched with customers near you, manage jobs from one
          dashboard, and grow a trusted reputation.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button class="px-8 py-4 rounded-2xl bg-brand-primary text-white font-bold text-base hover:bg-brand-primaryDark transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/25" @click="goApply">
            Apply Now <i data-lucide="arrow-right" class="w-5 h-5"></i>
          </button>
          <a href="#benefits" class="px-8 py-4 rounded-2xl bg-white border border-brand-primary/15 text-brand-primary font-bold text-base hover:border-brand-primary transition-all flex items-center justify-center gap-3">
            Why Join? <i data-lucide="sparkles" class="w-5 h-5"></i>
          </a>
        </div>
        <div class="mt-10 grid grid-cols-3 gap-4 max-w-xl mx-auto">
          <div><div class="text-3xl font-extrabold text-brand-primary">184</div><div class="text-xs text-slate-500 mt-1">Verified Technicians</div></div>
          <div><div class="text-3xl font-extrabold text-brand-primary">5,291+</div><div class="text-xs text-slate-500 mt-1">Repairs Completed</div></div>
          <div><div class="text-3xl font-extrabold text-brand-primary">4.9</div><div class="text-xs text-slate-500 mt-1">Average Rating</div></div>
        </div>
      </header>

      <section id="apply" class="max-w-3xl mx-auto px-6 py-12">
        <div v-if="!isAuthenticated" class="gate">
          <div class="gate__copy">
            <div class="gate__ico"><i data-lucide="lock"></i></div>
            <h2 class="gate__title">Sign in to start your application</h2>
            <p class="gate__text">
              Use your FIXHUB account to apply. If you already have one, log in below — otherwise create a customer
              account first. Your application will be linked to this account so you can track its status anytime.
            </p>
          </div>
          <AuthForm redirect="/become-a-technician" />
        </div>

        <template v-else>
          <div v-if="justSubmitted" class="alert">
            <i data-lucide="check-circle" class="alert__ico"></i>
            <div>
              <p class="alert__title">Application submitted</p>
              <p class="alert__text">Thank you! Our team will review your details and update the status below.</p>
            </div>
          </div>

          <template v-if="myApp && !editing">
            <div class="apply__head">
              <h2 class="apply__title">Your Technician Application</h2>
              <p class="apply__sub">Track your verification progress and respond to reviewer requests.</p>
            </div>
            <ApplicationStatusCard :application="myApp" @edit="editing = true" @reapply="editing = true" />
          </template>

          <template v-else>
            <div class="apply__head">
              <h2 class="apply__title">{{ editing ? 'Update your application' : 'Technician Application' }}</h2>
              <p class="apply__sub">
                {{ editing ? 'Make the requested changes and resubmit for review.' : 'Complete the form below. It only takes a few minutes.' }}
              </p>
            </div>
            <TechnicianApplicationForm
              :existing="editing ? myApp : null"
              :profile-name="me.name"
              :profile-email="me.email"
              :profile-phone="me.phone"
              @submitted="onSubmitted"
              @cancel="editing = false"
            />
          </template>
        </template>
      </section>

      <section id="benefits" class="max-w-6xl mx-auto px-6 py-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-extrabold text-brand-primaryDark mb-3">Why Technicians Choose FIXHUB</h2>
          <p class="text-slate-600 max-w-2xl mx-auto">Everything you need to run a modern repair business.</p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="b in benefits" :key="b.title" class="clean-card p-6">
            <div class="w-12 h-12 rounded-2xl bg-brand-primaryLight flex items-center justify-center mb-4">
              <i :data-lucide="b.icon" class="w-6 h-6 text-brand-primary"></i>
            </div>
            <h3 class="text-lg font-bold text-brand-primaryDark mb-1">{{ b.title }}</h3>
            <p class="text-slate-600 text-sm">{{ b.desc }}</p>
          </div>
        </div>
      </section>

      <section class="max-w-6xl mx-auto px-6 py-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-extrabold text-brand-primaryDark mb-3">How to Get Verified</h2>
          <p class="text-slate-600 max-w-2xl mx-auto">Four simple steps from application to your first repair job.</p>
        </div>
        <div class="grid md:grid-cols-4 gap-6">
          <div v-for="(s, i) in steps" :key="s.title" class="clean-card p-6">
            <div class="text-3xl font-extrabold text-brand-accent mb-3">{{ i + 1 }}</div>
            <h3 class="text-base font-bold text-brand-primaryDark mb-1">{{ s.title }}</h3>
            <p class="text-slate-600 text-sm">{{ s.desc }}</p>
          </div>
        </div>
      </section>

      <section class="max-w-4xl mx-auto px-6 pb-24">
        <div class="clean-card p-8">
          <h2 class="text-2xl font-extrabold text-brand-primaryDark mb-6">What You'll Need</h2>
          <ul class="grid sm:grid-cols-2 gap-4">
            <li v-for="r in requirements" :key="r" class="flex items-start gap-3 text-sm text-slate-700">
              <i data-lucide="check-circle" class="w-5 h-5 text-brand-primary flex-shrink-0"></i>
              <span>{{ r }}</span>
            </li>
          </ul>
          <div class="mt-8 text-center">
            <button class="px-8 py-4 rounded-2xl bg-brand-primary text-white font-bold text-base hover:bg-brand-primaryDark transition-all inline-flex items-center gap-3 shadow-lg shadow-brand-primary/25" @click="goApply">
              Start My Application <i data-lucide="arrow-right" class="w-5 h-5"></i>
            </button>
          </div>
        </div>
      </section>

      <footer class="bg-brand-primaryDark py-8 px-6 text-center">
        <p class="text-sm text-white/50">© 2026 FIXHUB. Your Device. Our Solution. Made with love in the Philippines.</p>
      </footer>
    </div>
  </div>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { IonPage } from '@ionic/vue';
import { useAuth } from '../../stores/auth';
import { useTechnicianApplications } from '../../stores/technicianApplications';
import AuthForm from '../../components/landing/home/AuthForm.vue';
import TechnicianApplicationForm from '../../components/technician/TechnicianApplicationForm.vue';
import ApplicationStatusCard from '../../components/technician/ApplicationStatusCard.vue';

const { state, profile } = useAuth();
const store = useTechnicianApplications();

const editing = ref(false);
const justSubmitted = ref(false);

const me = computed(() => profile());
const isAuthenticated = computed(() => state.isAuthenticated);
const myApp = computed(() => store.mine(me.value.email));

const benefits = [
  { title: 'More Repair Jobs', icon: 'trending-up', desc: 'Get matched with customers in your area who need your exact skills.' },
  { title: 'Flexible Schedule', icon: 'calendar', desc: 'Set your own working days and hours — home service or drop-off.' },
  { title: 'Verified Badge', icon: 'badge-check', desc: 'Stand out with a verified profile customers can trust.' },
  { title: 'Fast Payouts', icon: 'wallet', desc: 'Transparent earnings with reliable, on-time payouts.' },
  { title: 'Grow Your Reputation', icon: 'star', desc: 'Collect ratings and reviews that help you win more jobs.' },
  { title: 'Training & Support', icon: 'life-buoy', desc: 'Access resources and a support team whenever you need help.' },
];

const steps = [
  { title: 'Create or log in', desc: 'Use your FIXHUB account to access the application.' },
  { title: 'Submit your application', desc: 'Add your experience, service details, and documents.' },
  { title: 'Get verified', desc: 'Our team reviews your credentials, usually within 2–3 days.' },
  { title: 'Start repairing', desc: 'Once approved, receive and manage job requests.' },
];

const requirements = [
  'At least 1 year of hands-on device repair experience',
  'Your own tools and a reliable contact number',
  'A valid government-issued ID',
  'A serviceable city or coverage area',
  'Willingness to follow FIXHUB service standards',
  'Good communication with customers',
];

function goApply() {
  const el = document.getElementById('apply');
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onSubmitted() {
  justSubmitted.value = true;
  editing.value = false;
  if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}

let iconTimer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
    iconTimer = setInterval(() => lucide.createIcons(), 600);
  }
});
onUnmounted(() => {
  if (iconTimer) clearInterval(iconTimer);
});
</script>

<style scoped>
.gate { display: grid; gap: 28px; align-items: center; }
@media (min-width: 900px) { .gate { grid-template-columns: 1fr 1fr; } }
.gate__copy { text-align: center; }
@media (min-width: 900px) { .gate__copy { text-align: left; } }
.gate__ico { width: 60px; height: 60px; border-radius: 18px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; background: var(--primary-light); color: var(--primary); }
@media (min-width: 900px) { .gate__ico { margin: 0 0 16px; } }
.gate__ico :deep(svg) { width: 28px; height: 28px; }
.gate__title { font-size: 26px; font-weight: 800; color: var(--text-dark); margin: 0 0 10px; }
.gate__text { font-size: 15px; color: var(--text-muted); margin: 0; line-height: 1.6; }
.gate :deep(.glass-form) { margin: 0 auto; }

.alert { display: flex; gap: 12px; align-items: flex-start; padding: 16px 18px; border-radius: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; margin-bottom: 22px; }
.alert__ico { width: 20px; height: 20px; color: #15803d; flex-shrink: 0; }
.alert__title { font-weight: 800; color: #15803d; margin: 0; font-size: 14px; }
.alert__text { color: #166534; margin: 2px 0 0; font-size: 13px; }

.apply__head { margin-bottom: 18px; }
.apply__title { font-size: 24px; font-weight: 800; color: var(--text-dark); margin: 0; }
.apply__sub { font-size: 14px; color: var(--text-muted); margin: 4px 0 0; }

.bt section[id] { scroll-margin-top: 90px; }
</style>
