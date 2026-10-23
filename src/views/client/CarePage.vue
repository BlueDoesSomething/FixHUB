<template>
  <ion-page>
    <ScreenHeader title="FIXHUB Care" default-href="/client/home" />
    <ion-content>
      <div class="fx-page">
        <section class="fx-hero care-hero">
          <div class="fx-hero-body">
            <span class="care-hero__eyebrow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="4.93" y1="4.93" x2="9.17" y2="9.17" /><line x1="14.83" y1="14.83" x2="19.07" y2="19.07" /><line x1="14.83" y1="9.17" x2="19.07" y2="4.93" /><line x1="4.93" y1="19.07" x2="9.17" y2="14.83" /></svg>
              Self-Service Support
            </span>
            <h1 class="care-hero__title">Fix it yourself, first.</h1>
            <p class="care-hero__sub">
              Step-by-step troubleshooting for common phone problems. Resolve the simple ones in minutes —
              and book a verified technician only when you really need one.
            </p>
          </div>
        </section>

        <div class="fx-stat-grid intro-stats">
          <div v-for="s in stats" :key="s.label" class="fx-stat">
            <div class="fx-stat__icon" :class="s.iconClass" v-html="s.icon" />
            <p class="fx-stat__value">{{ s.value }}</p>
            <p class="fx-stat__label">{{ s.label }}</p>
          </div>
        </div>

        <div class="toolbar">
          <label class="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input v-model="query" class="search__input" placeholder="Search a problem, e.g. battery, Wi-Fi, camera…" />
          </label>
          <div class="chips">
            <button
              v-for="c in careCategories"
              :key="c"
              class="chip"
              :class="{ 'chip--active': activeCategory === c }"
              @click="activeCategory = c"
            >
              {{ c }}
            </button>
          </div>
        </div>

        <h3 class="fx-section-title fx-section-title--lg">
          {{ activeCategory === 'All' ? 'Common problems' : activeCategory }}
          <span class="count">({{ filtered.length }})</span>
        </h3>

        <div v-if="filtered.length" class="fx-grid-3">
          <button
            v-for="issue in filtered"
            :key="issue.id"
            class="fx-card fx-card--interactive issue"
            @click="router.push('/client/care/' + issue.id)"
          >
            <div class="issue__top">
              <div class="issue__icon" v-html="issue.icon" />
              <span class="fx-pill" :class="rateClass(issue.successRate)">{{ issue.successRate }}% self-fix</span>
            </div>
            <h4 class="issue__title">{{ issue.title }}</h4>
            <p class="issue__summary">{{ issue.summary }}</p>
            <div class="issue__foot">
              <span class="meta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {{ issue.estimatedTime }}
              </span>
              <span class="meta">{{ issue.steps.length }} steps · {{ issue.difficulty }}</span>
              <span class="issue__go">Start ›</span>
            </div>
          </button>
        </div>

        <div v-else class="fx-card empty">
          <div class="empty__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>
          <p class="empty__title">No matching topic</p>
          <p class="empty__sub">We could not find a guide for “{{ query }}”. You can still book a technician and describe the issue.</p>
          <button class="fx-btn fx-btn-primary fx-btn--sm" @click="router.push('/client/request')">Book a repair</button>
        </div>

        <div class="cta">
          <div class="cta__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
          </div>
          <div class="cta__text">
            <h3 class="cta__title">Still not working?</h3>
            <p class="cta__sub">If the guide did not solve it, a verified FIXHUB technician can diagnose and repair your device.</p>
          </div>
          <button class="fx-btn fx-btn-primary" @click="router.push('/client/request')">Book a repair</button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { careCategories, careIssues, careStats, type CareIssue } from '../../data/care';

const router = useRouter();
const query = ref('');
const activeCategory = ref('All');

const iconClass: Record<number, string> = { 0: 'fx-stat__icon--green', 1: 'fx-stat__icon--blue', 2: 'fx-stat__icon--orange' };
const icons = [
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
];
const stats = careStats.map((s, i) => ({ ...s, icon: icons[i], iconClass: iconClass[i] }));

const filtered = computed<CareIssue[]>(() => {
  const q = query.value.trim().toLowerCase();
  return careIssues.filter((issue) => {
    const inCategory = activeCategory.value === 'All' || issue.category === activeCategory.value;
    if (!inCategory) return false;
    if (!q) return true;
    return (
      issue.title.toLowerCase().includes(q) ||
      issue.summary.toLowerCase().includes(q) ||
      issue.category.toLowerCase().includes(q) ||
      issue.symptoms.some((s) => s.toLowerCase().includes(q))
    );
  });
});

function rateClass(rate: number) {
  if (rate >= 70) return 'fx-pill--success';
  if (rate >= 45) return 'fx-pill--progress';
  return 'fx-pill--danger';
}
</script>

<style scoped>
.care-hero__eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase;
  background: rgba(255, 255, 255, 0.18); padding: 6px 12px; border-radius: 999px;
}
.care-hero__title { font-size: 30px; font-weight: 800; margin: 14px 0 0; letter-spacing: -0.6px; }
.care-hero__sub { font-size: 15px; opacity: 0.9; margin: 8px 0 0; max-width: 620px; line-height: 1.55; }

.intro-stats { margin: 24px 0 28px; }

.toolbar { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
.search {
  display: flex; align-items: center; gap: 10px; max-width: 520px;
  background: var(--surface); border: 1.5px solid var(--hairline); border-radius: 12px;
  padding: 12px 16px; color: var(--text-muted);
}
.search:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(20, 99, 68, 0.12); }
.search__input { flex: 1; border: none; outline: none; background: transparent; font-family: inherit; font-size: 14px; color: var(--text-dark); }

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  font-family: inherit; font-size: 13px; font-weight: 600; color: var(--text-muted);
  background: var(--surface); border: 1px solid var(--hairline); border-radius: 999px;
  padding: 8px 14px; cursor: pointer; transition: all 0.18s ease;
}
.chip:hover { border-color: var(--primary); color: var(--primary); }
.chip--active { background: var(--gradient); color: #fff; border-color: transparent; box-shadow: 0 6px 14px rgba(20, 99, 68, 0.22); }

.count { font-size: 13px; font-weight: 600; color: var(--text-muted); }

.issue { display: flex; flex-direction: column; text-align: left; gap: 10px; border: 1px solid var(--hairline); }
.issue__top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.issue__icon {
  width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
  background: var(--gradient-soft, var(--primary-light)); color: var(--primary);
  display: flex; align-items: center; justify-content: center;
}
.issue__title { font-size: 15.5px; font-weight: 800; color: var(--text-dark); margin: 0; }
.issue__summary { font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.5; flex: 1; }
.issue__foot { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.meta { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--text-muted); }
.issue__go { margin-left: auto; font-size: 13px; font-weight: 700; color: var(--primary); }

.empty { text-align: center; padding: 40px 20px; }
.empty__icon {
  width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 14px;
  background: var(--primary-light); color: var(--primary);
  display: flex; align-items: center; justify-content: center;
}
.empty__title { font-size: 16px; font-weight: 800; color: var(--text-dark); margin: 0 0 4px; }
.empty__sub { font-size: 13px; color: var(--text-muted); margin: 0 auto 16px; max-width: 420px; line-height: 1.5; }

.cta {
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
  margin-top: 32px; padding: 22px 24px; border-radius: 18px;
  background: var(--gradient-soft, var(--primary-light)); border: 1px solid var(--hairline);
}
.cta__icon {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: var(--gradient); color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.cta__text { flex: 1; min-width: 200px; }
.cta__title { font-size: 17px; font-weight: 800; color: var(--text-dark); margin: 0 0 2px; }
.cta__sub { font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.5; }

@media (max-width: 767px) {
  .care-hero__title { font-size: 23px; }
  .cta { flex-direction: column; align-items: flex-start; }
  .cta :deep(.fx-btn) { width: 100%; }
}
</style>
