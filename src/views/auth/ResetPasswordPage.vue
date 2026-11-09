<template>
  <ion-page>
    <ion-content>
      <main class="fx-page reset-password">
        <section class="fx-card">
          <h1 class="fx-page__title">{{ success ? 'Password updated' : 'Choose a new password' }}</h1>
          <p v-if="checking" class="fx-page__sub" role="status">Checking your password reset session…</p>
          <p v-if="success" class="fx-page__sub" role="status">Your password has been updated. Sign in with your new password.</p>
          <p v-if="error" class="reset-password__error" role="alert">{{ error }}</p>
          <form v-if="ready" novalidate @submit.prevent="save">
            <div class="fx-field">
              <label for="new-password" class="fx-label">New password</label>
              <input id="new-password" v-model="password" class="fx-input" type="password" autocomplete="new-password" placeholder="At least 12 characters" :disabled="saving" />
            </div>
            <div class="fx-field">
              <label for="confirm-password" class="fx-label">Confirm new password</label>
              <input id="confirm-password" v-model="confirmation" class="fx-input" type="password" autocomplete="new-password" :disabled="saving" />
            </div>
            <button class="fx-btn fx-btn-primary fx-btn--block" type="submit" :disabled="saving">{{ saving ? 'Updating…' : 'Update password' }}</button>
          </form>
          <button class="fx-btn fx-btn-secondary fx-btn--block reset-password__back" type="button" :disabled="saving" @click="router.replace('/')">Back to sign in</button>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
import { useAuth } from '../../stores/auth';

const router = useRouter();
const { refreshSession, updatePassword, logout } = useAuth();
const password = ref('');
const confirmation = ref('');
const checking = ref(false);
const saving = ref(false);
const ready = ref(false);
const success = ref(false);
const error = ref('');

async function checkSession() {
  if (checking.value || saving.value) return;
  checking.value = true;
  ready.value = false;
  success.value = false;
  error.value = '';
  password.value = '';
  confirmation.value = '';
  try {
    ready.value = !!(await refreshSession());
    if (!ready.value) error.value = 'Your reset session is missing or has expired. Go back to sign in and request a new password reset email.';
  } catch {
    error.value = 'Your reset session could not be checked. Check your connection and open the email link again.';
  } finally { checking.value = false; }
}

async function save() {
  if (!ready.value || saving.value) return;
  error.value = '';
  if (password.value.length < 12) { error.value = 'Password must be at least 12 characters.'; return; }
  if (password.value !== confirmation.value) { error.value = 'Passwords do not match.'; return; }
  saving.value = true;
  try {
    await updatePassword(password.value);
    await logout();
    password.value = '';
    confirmation.value = '';
    ready.value = false;
    success.value = true;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Your password could not be updated. Try again.';
  } finally { saving.value = false; }
}

onMounted(checkSession);
onIonViewWillEnter(checkSession);
</script>

<style scoped>
.reset-password { min-height: 100%; max-width: 520px; display: grid; align-content: center; padding-top: max(32px, var(--ion-safe-area-top, 0px)); }
.reset-password form, .reset-password .fx-page__sub { margin-top: 20px; }
.reset-password__error { color: #b91c1c; line-height: 1.7; margin: 20px 0; }
.reset-password__back { margin-top: 16px; }
</style>
