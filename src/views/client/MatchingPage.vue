<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="fx-page">
        <section class="fx-hero">
          <div class="fx-hero-body matching-hero">
            <div class="spinner" />
            <h3 class="matching-hero__title">{{ loading ? 'Finding best technician...' : 'Technicians matched!' }}</h3>
            <p class="matching-hero__sub">Analyzing skills &amp; distance</p>
            <div class="factors">
              <span>📍 Distance</span>
              <span>🔧 Skills</span>
              <span>⭐ Rating</span>
              <span>✓ Available</span>
            </div>
          </div>
        </section>

        <h3 class="fx-section-title fx-section-title--lg">Recommended</h3>
        <div class="fx-grid-2">
          <TechnicianCard
            v-for="tech in technicians"
            :key="tech.id"
            :tech="tech"
            @select="openProfile"
          />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import TechnicianCard from '../../components/TechnicianCard.vue';
import { technicians, type Technician } from '../../data/mock';

const router = useRouter();
const loading = ref(true);

onMounted(() => setTimeout(() => (loading.value = false), 1600));

function openProfile(tech: Technician) {
  router.push({ path: '/client/request/technician', query: { id: String(tech.id) } });
}
</script>

<style scoped>
.matching-hero { text-align: center; }
.spinner { width: 56px; height: 56px; margin: 0 auto 14px; position: relative; }
.spinner::before, .spinner::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.25);
}
.spinner::after { border-top-color: #fff; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.matching-hero__title { font-size: 22px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.3px; }
.matching-hero__sub { font-size: 14px; opacity: 0.88; margin: 0; }
.factors { display: flex; justify-content: center; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
.factors span {
  padding: 7px 14px; background: rgba(255, 255, 255, 0.18); border-radius: 999px;
  font-size: 13px; font-weight: 600;
}
</style>
