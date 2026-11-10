<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div v-if="tech" class="fx-page">
        <section class="fx-hero">
          <div class="fx-hero-body profile-hero">
            <button class="back" type="button" aria-label="Go back" @click="router.push('/client/request/matching')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div class="profile-hero__avatar">
              <InitialAvatar :initials="tech.initials" :gradient="tech.color" :size="72" :verified="tech.verified" />
            </div>
            <h3 class="profile-hero__name">{{ tech.name }}</h3>
            <p class="profile-hero__sub">{{ tech.specialty }} • Expert</p>
          </div>
        </section>

        <div class="fx-split">
          <div class="profile-main">
            <div class="fx-stat-grid stats">
              <div class="fx-stat">
                <p class="fx-stat__value">{{ reviewSummary.average?.toFixed(1) ?? '—' }} ★</p>
                <p class="fx-stat__label">Rating</p>
              </div>
              <div class="fx-stat">
                <p class="fx-stat__value">{{ tech.repairs }}</p>
                <p class="fx-stat__label">Repairs</p>
              </div>
            </div>

            <section>
              <h4 class="fx-section-title">Reviews</h4>
              <ReviewFeed :key="tech.id" :technician-id="tech.id" />
            </section>
          </div>

          <aside>
            <div class="fx-card aside-card">
              <h4 class="fx-section-title">Quick Info</h4>
              <div class="fx-info-row"><span class="fx-info-label">Specialty</span><span class="fx-info-value">{{ tech.specialty }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Rating</span><span class="fx-info-value">{{ reviewSummary.average?.toFixed(1) ?? '—' }} ★ · {{ reviewSummary.total }} reviews</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Repairs</span><span class="fx-info-value">{{ tech.repairs }}+</span></div>
              <button class="fx-btn fx-btn-primary fx-btn--block" @click="router.push('/client/request')">
                Start a Repair Request
              </button>
            </div>
          </aside>
        </div>
      </div>
      <div v-else class="fx-page"><div class="fx-card"><h1 class="fx-page__title">Technician not found</h1><p>Select an available technician to view their profile.</p><button class="fx-btn fx-btn-secondary" @click="router.push('/client/request/matching')">Go Back</button></div></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import InitialAvatar from '../../components/InitialAvatar.vue';
import { technicians } from '../../data/catalog';
import ReviewFeed from '../../components/reviews/ReviewFeed.vue';
import { useReviews } from '../../stores/reviews';

const route = useRoute();
const router = useRouter();

const tech = computed(
  () => technicians.find((t) => t.id === Number(route.query.id)),
);
const { summary } = useReviews();
const reviewSummary = computed(() => summary(tech.value?.id ?? -1));
</script>

<style scoped>
.profile-hero { text-align: center; }
.back {
  position: absolute; top: 0; left: 0;
  width: 40px; height: 40px; border: none; cursor: pointer;
  background: rgba(255, 255, 255, 0.2); border-radius: 12px; color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.back:hover { background: rgba(255, 255, 255, 0.3); }
.profile-hero__avatar { display: flex; justify-content: center; margin-bottom: 14px; }
.profile-hero__name { font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
.profile-hero__sub { font-size: 14px; opacity: 0.9; margin: 6px 0 0; }

.profile-main { display: flex; flex-direction: column; gap: 20px; }
.stats { margin: 0; }
.aside-card { position: sticky; top: 20px; }
.profile-note { font-size: 12px; line-height: 1.7; color: var(--text-muted); }

.tags { display: flex; gap: 10px; flex-wrap: wrap; }
.tag {
  padding: 7px 14px; background: var(--gradient-soft); color: var(--primary);
  border-radius: 999px; font-size: 13px; font-weight: 600;
}

@media (max-width: 767px) {
  .aside-card { position: static; }
}
</style>
