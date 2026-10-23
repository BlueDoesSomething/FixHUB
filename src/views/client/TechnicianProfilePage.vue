<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="fx-page">
        <section class="fx-hero">
          <div class="fx-hero-body profile-hero">
            <button class="back" @click="router.back()">
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
                <p class="fx-stat__value">{{ tech.rating }} ★</p>
                <p class="fx-stat__label">Rating</p>
              </div>
              <div class="fx-stat">
                <p class="fx-stat__value">{{ tech.repairs }}</p>
                <p class="fx-stat__label">Repairs</p>
              </div>
              <div class="fx-stat">
                <p class="fx-stat__value">6 yrs</p>
                <p class="fx-stat__label">Experience</p>
              </div>
            </div>

            <div class="fx-card">
              <h4 class="fx-section-title">Services Offered</h4>
              <div class="tags">
                <span class="tag">🏠 Home</span>
                <span class="tag">📦 Drop-off</span>
                <span class="tag">📱 iPhone</span>
                <span class="tag">🔋 Battery</span>
              </div>
            </div>

            <div class="fx-card">
              <h4 class="fx-section-title">Reviews</h4>
              <div class="review">
                <div class="review__top">
                  <div class="review__user">
                    <InitialAvatar initials="MR" gradient="linear-gradient(135deg, #146344, #1b7a54)" :size="36" />
                    <span>Maria Reyes</span>
                  </div>
                  <span class="review__date">2 days ago</span>
                </div>
                <div class="review__stars">★★★★★</div>
                <p class="review__text">"Super fast and professional!"</p>
              </div>
            </div>
          </div>

          <aside>
            <div class="fx-card aside-card">
              <h4 class="fx-section-title">Quick Info</h4>
              <div class="fx-info-row"><span class="fx-info-label">Specialty</span><span class="fx-info-value">{{ tech.specialty }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Rating</span><span class="fx-info-value">{{ tech.rating }} ★</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Repairs</span><span class="fx-info-value">{{ tech.repairs }}+</span></div>
              <button class="fx-btn fx-btn-primary fx-btn--block" @click="router.push('/client/home/tracking')">
                Request This Technician
              </button>
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
import { technicians } from '../../data/mock';

const route = useRoute();
const router = useRouter();

const tech = computed(
  () => technicians.find((t) => t.id === Number(route.query.id)) ?? technicians[0],
);
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

.tags { display: flex; gap: 10px; flex-wrap: wrap; }
.tag {
  padding: 7px 14px; background: var(--gradient-soft); color: var(--primary);
  border-radius: 999px; font-size: 13px; font-weight: 600;
}

.review__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.review__user { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: var(--text-dark); }
.review__date { font-size: 12px; color: var(--text-muted); }
.review__stars { color: var(--warning); font-size: 14px; }
.review__text { font-size: 14px; color: var(--text-dark); line-height: 1.5; margin: 6px 0 0; }

@media (max-width: 767px) {
  .aside-card { position: static; }
}
</style>
