<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false" class="splash-content">
      <div class="splash">
        <div class="splash__logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <h1>FIXHUB</h1>
        <p class="splash__tagline">Your Device. Our Solution.</p>
        <div class="splash__loader"></div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';

const router = useRouter();

onMounted(() => {
  setTimeout(() => router.replace('/'), 1800);
});
</script>

<style scoped>
.splash-content { --background: var(--gradient); }
.splash {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: relative;
  overflow: hidden;
}
.splash::before {
  content: '';
  position: absolute;
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(18, 200, 192, 0.3) 0%, transparent 70%);
  top: -90px; right: -90px;
  border-radius: 50%;
}
.splash__logo {
  width: 92px; height: 92px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 26px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
  animation: pulse 2.5s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
.splash__logo svg { width: 48px; height: 48px; }
.splash h1 { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin: 0; }
.splash__tagline { font-size: 13px; opacity: 0.9; margin-top: 6px; }
.splash__loader {
  margin-top: 40px; width: 40px; height: 4px;
  background: rgba(255, 255, 255, 0.2); border-radius: 2px; overflow: hidden;
}
.splash__loader::after {
  content: ''; display: block; width: 50%; height: 100%;
  background: #fff; border-radius: 2px;
  animation: loading 1.5s ease-in-out infinite;
}
@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
</style>
