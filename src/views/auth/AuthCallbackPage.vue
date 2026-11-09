<template>
  <ion-page>
    <ion-content>
      <main class="fx-page auth-callback">
        <section class="fx-card">
          <h1 class="fx-page__title">{{ error ? 'Sign-in needs attention' : 'Finishing sign-in' }}</h1>
          <p v-if="error" class="auth-callback__error" role="alert">{{ error }}</p>
          <p v-else class="fx-page__sub" role="status">Verifying your link and loading your account…</p>
          <button v-if="error" type="button" class="fx-btn fx-btn-primary" @click="router.replace('/')">Back to sign in</button>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import { useAuth } from '../../stores/auth';
import { AUTH_CALLBACK_PATH, consumeAuthReturnPath } from '../../services/authRedirect';

const route = useRoute();
const router = useRouter();
const { finishAuthCallback } = useAuth();
const error = ref('');
let operation = 0;
let processed = false;

// Ionic caches pages. A later warm-app deep link must be processed too.
watch(() => route.fullPath, async () => {
  const current = ++operation;
  if (route.path !== AUTH_CALLBACK_PATH) return;
  const hasPayload = ['code', 'token_hash', 'error', 'error_code'].some(key => !!route.query[key]);
  if (processed && !hasPayload) return;
  processed = true;
  error.value = '';
  try {
    const result = await finishAuthCallback(new URL(route.fullPath, window.location.origin).toString());
    if (current !== operation) return;
    const returnPath = consumeAuthReturnPath();
    await router.replace(result.recovery ? '/auth/reset-password' : returnPath || result.profile.homeRoute);
  } catch (cause) {
    if (current !== operation) return;
    error.value = cause instanceof Error ? cause.message : 'Sign-in could not be completed. Please try again.';
    // Remove one-use codes/token hashes and provider errors from browser history.
    if (route.fullPath !== AUTH_CALLBACK_PATH) await router.replace(AUTH_CALLBACK_PATH);
  }
}, { immediate: true });

onBeforeUnmount(() => { operation += 1; });
</script>

<style scoped>
.auth-callback { min-height: 100%; max-width: 520px; display: grid; align-content: center; padding-top: max(32px, var(--ion-safe-area-top, 0px)); }
.auth-callback .fx-page__sub { margin-top: 18px; }
.auth-callback__error { color: #b91c1c; line-height: 1.7; margin: 20px 0; }
</style>
