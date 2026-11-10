<template>
  <ion-page>
    <ScreenHeader title="Technician Subscription" :show-back="false" />
    <ion-content>
      <div class="fx-page subscription-page">
        <div class="fx-page__head">
          <div><h1 class="fx-page__title">Technician Subscription</h1>
            <p class="fx-page__sub">Your FIXHUB technician access on the website and app.</p></div>
        </div>

        <section class="fx-card subscription-card">
          <p class="subscription-card__eyebrow">PayMongo sandbox · Automatic monthly billing</p>
          <h2>₱{{ MONTHLY_TECHNICIAN_FEE }} <small>/ month</small></h2>
          <p>Apply for free. After approval, subscribe to accept new repair jobs. Existing jobs and account history remain accessible if billing stops.</p>
          <p>Test payments only. No real money is charged. Visa/Mastercard sandbox cards are supported here.</p>
          <p v-if="isNative" class="subscription-note">After PayMongo authentication, close the browser and return to FIXHUB to refresh your status.</p>
          <p v-if="subscription" class="subscription-status" data-testid="subscription-status">
            Status: <strong>{{ statusLabel }}</strong>
            <span v-if="subscription.nextBillingAt && subscription.status === 'active'"> · Next billing {{ subscription.nextBillingAt }}</span>
          </p>
          <p v-else-if="loading" role="status">Loading subscription status…</p>
          <p v-if="subscription && !subscription.enforced" class="subscription-note">Subscriptions are in sandbox setup. Job acceptance stays available until billing is activated by FIXHUB.</p>
          <p v-if="error" class="subscription-error" role="alert">{{ error }}</p>
          <button class="fx-btn fx-btn-secondary" type="button" :disabled="loading || busy" @click="refresh(true)">Refresh payment status</button>
        </section>

        <section v-if="subscription && subscription.status !== 'active' && subscription.status !== 'past_due' && subscription.status !== 'unpaid'" class="fx-card subscription-card" aria-label="Start subscription">
          <h2>Start your subscription</h2>
          <p>Enter a sandbox Visa or Mastercard. Card information is sent directly to PayMongo, not saved by FIXHUB. PayMongo handles future monthly renewals.</p>
          <form class="subscription-form" @submit.prevent="pay">
            <label>Card number
              <input v-model="card.number" autocomplete="cc-number" inputmode="numeric" placeholder="Sandbox card number" required minlength="12" maxlength="23" />
            </label>
            <div class="subscription-form__row">
              <label>Expiry month<input v-model.number="card.month" type="number" autocomplete="cc-exp-month" min="1" max="12" required /></label>
              <label>Expiry year<input v-model.number="card.year" type="number" autocomplete="cc-exp-year" :min="new Date().getFullYear()" required /></label>
              <label>CVC<input v-model="card.cvc" type="password" autocomplete="cc-csc" inputmode="numeric" minlength="3" maxlength="4" required /></label>
            </div>
            <button class="fx-btn fx-btn-primary" type="submit" :disabled="busy || loading">
              {{ busy ? 'Connecting to PayMongo…' : 'Subscribe for ₱150/month' }}
            </button>
          </form>
          <p class="subscription-note">For sandbox testing, PayMongo lists test cards in its dashboard. Your subscription activates only after PayMongo confirms payment.</p>
        </section>

        <section v-if="subscription && ['active', 'incomplete', 'past_due', 'unpaid'].includes(subscription.status)" class="fx-card subscription-card">
          <h2>Manage subscription</h2>
          <p>Cancellation takes effect immediately and stops future automatic charges. If billing is enforced, you will no longer be able to accept new jobs.</p>
          <button class="fx-btn fx-btn-secondary" type="button" :disabled="busy" @click="cancel">Cancel subscription</button>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { useAuth } from '../../stores/auth';
import { MONTHLY_TECHNICIAN_FEE, cancelTechnicianSubscription, getTechnicianSubscription,
  payFirstSubscriptionInvoice, startTechnicianSubscription, type TechnicianSubscription } from '../../services/technicianSubscription';

const { profile } = useAuth();
const subscription = ref<TechnicianSubscription | null>(null);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
const card = reactive({ number: '', month: 0, year: 0, cvc: '' });
const isNative = Capacitor.isNativePlatform();
const handles: PluginListenerHandle[] = [];
const statusLabel = computed(() => ({
  none: 'Not subscribed', incomplete: 'Waiting for first payment', incomplete_cancelled: 'First payment expired',
  active: 'Active', past_due: 'Payment retry in progress', unpaid: 'Unpaid', cancelled: 'Cancelled',
})[subscription.value?.status ?? 'none']);

async function refresh(checkPayMongo = false) {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try { subscription.value = await getTechnicianSubscription(checkPayMongo); }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Unable to check subscription status.'; }
  finally { loading.value = false; }
}

async function pay() {
  if (busy.value) return;
  error.value = '';
  if (!/^\d{12,19}$/.test(card.number.replace(/\s/g, '')) || !card.month || !card.year || !/^\d{3,4}$/.test(card.cvc)) {
    error.value = 'Enter valid sandbox card details.';
    return;
  }
  busy.value = true;
  try {
    const intent = await startTechnicianSubscription();
    const account = profile();
    const redirect = await payFirstSubscriptionInvoice(intent, card,
      { name: account.name, email: account.email, phone: account.phone || undefined });
    card.number = ''; card.cvc = '';
    if (redirect) {
      if (Capacitor.isNativePlatform()) await Browser.open({ url: redirect });
      else window.location.assign(redirect);
    } else await refresh(true);
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'PayMongo payment could not be started.'; }
  finally { card.cvc = ''; busy.value = false; }
}

async function cancel() {
  if (busy.value || !window.confirm('Cancel your subscription immediately? Future monthly charges will stop.')) return;
  busy.value = true;
  error.value = '';
  try { await cancelTechnicianSubscription(); await refresh(); }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Cancellation failed.'; }
  finally { busy.value = false; }
}

onMounted(() => {
  void refresh(window.location.search.includes('return=1'));
  if (isNative) {
    void App.addListener('appStateChange', state => { if (state.isActive) void refresh(true); })
      .then(handle => handles.push(handle));
    void Browser.addListener('browserFinished', () => { void refresh(true); })
      .then(handle => handles.push(handle));
  }
});
onUnmounted(() => { for (const handle of handles) void handle.remove(); });
onIonViewWillEnter(() => { if (subscription.value) void refresh(true); });
</script>

<style scoped>
.subscription-page { display: grid; gap: 18px; align-content: start; color: var(--text-dark); }
.subscription-card { display: grid; gap: 12px; max-width: 750px; }
.subscription-card h2, .subscription-card p { margin: 0; }
.subscription-card h2 { font-size: 24px; }
.subscription-card h2 small { color: var(--text-muted); font-size: 15px; }
.subscription-card p { font-size: 14px; line-height: 1.6; }
.subscription-card__eyebrow { color: var(--primary); font-weight: 700; }
.subscription-status { padding: 12px; background: var(--gradient-soft); border-radius: 10px; }
.subscription-note { color: var(--text-muted); }
.subscription-error { padding: 12px; color: #7f1d1d; background: #fef2f2; border-radius: 10px; }
.subscription-card button { justify-self: start; }
.subscription-form { display: grid; gap: 16px; }
.subscription-form label { display: grid; gap: 6px; font-size: 13px; font-weight: 700; }
.subscription-form input { width: 100%; min-width: 0; padding: 12px; border: 1px solid var(--hairline); border-radius: 8px; font: inherit; }
.subscription-form__row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 430px) { .subscription-form__row { grid-template-columns: 1fr 1fr; } }
</style>
