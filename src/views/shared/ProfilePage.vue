<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Profile</h1>
            <p class="fx-page__sub">Manage your account and preferences</p>
          </div>
        </div>

        <div class="fx-split">
          <div class="profile-main">
            <div class="fx-card identity">
              <InitialAvatar :initials="profile.initials" :gradient="profile.color" :size="72" />
              <div>
                <h3 class="identity__name">{{ profile.name }}</h3>
                <p class="identity__email">{{ profile.email }}</p>
              </div>
            </div>

            <div class="fx-card menu-card">
              <button v-if="reviewsRoute" type="button" class="menu-item reviews-link" @click="router.push(reviewsRoute)">
                <span class="menu-icon" aria-hidden="true">★</span>
                <span class="menu-text">{{ route.path.startsWith('/technician') ? 'Customer Reviews' : 'My Reviews' }}</span>
                <span class="menu-arrow" aria-hidden="true">›</span>
              </button>
              <div class="menu-item">
                <div class="menu-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07" /></svg>
                </div>
                <span class="menu-text">{{ profile.phone }}</span>
                <span class="menu-arrow">›</span>
              </div>
              <div class="menu-item">
                <div class="menu-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" /></svg>
                </div>
                <span class="menu-text">Settings</span>
                <span class="menu-arrow">›</span>
              </div>
            </div>
          </div>

          <aside>
            <div class="fx-card menu-card">
              <div class="menu-item danger" @click="onLogout">
                <div class="menu-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /></svg>
                </div>
                <span class="menu-text">Logout</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import InitialAvatar from '../../components/InitialAvatar.vue';
import { useAuth } from '../../stores/auth';

const router = useRouter();
const route = useRoute();
const reviewsRoute = computed(() => route.path.startsWith('/technician') ? '/technician/reviews' : route.path.startsWith('/client') ? '/client/reviews' : '');
const { profile: getProfile, logout } = useAuth();
const profile = computed(getProfile);

function onLogout() {
  logout();
  router.replace('/');
}
</script>

<style scoped>
.profile-main { display: flex; flex-direction: column; gap: 20px; }

.identity { display: flex; align-items: center; gap: 20px; }
.identity__name { font-size: 22px; font-weight: 800; color: var(--text-dark); margin: 0; letter-spacing: -0.3px; }
.identity__email { font-size: 14px; color: var(--text-muted); margin: 5px 0 0; }

.menu-card { padding: 6px 20px; }
.menu-item {
  padding: 16px 0; display: flex; align-items: center; gap: 14px;
  cursor: pointer; border-bottom: 1px solid var(--hairline);
}
.menu-item:last-child { border-bottom: none; }
.reviews-link { width: 100%; border: none; border-bottom: 1px solid var(--hairline); background: transparent; text-align: left; font: inherit; }
.reviews-link:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.menu-icon {
  width: 38px; height: 38px; background: var(--gradient-soft); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0;
}
.menu-text { flex: 1; font-size: 14px; font-weight: 600; color: var(--text-dark); }
.menu-arrow { color: var(--text-muted); font-size: 18px; }
.menu-item.danger .menu-icon { background: #fee2e2; color: var(--danger); }
.menu-item.danger .menu-text { color: var(--danger); }
</style>
