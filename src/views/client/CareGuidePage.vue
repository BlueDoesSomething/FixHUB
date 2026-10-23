<template>
  <ion-page>
    <ScreenHeader :title="issue ? issue.title : 'FIXHUB Care'" default-href="/client/care" />
    <ion-content>
      <div class="fx-page">
        <template v-if="issue">
          <button class="crumb" @click="router.push('/client/care')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            All FIXHUB Care topics
          </button>

          <div class="fx-card head">
            <div class="head__icon" v-html="issue.icon" />
            <div class="head__body">
              <span class="fx-pill fx-pill--pending">{{ issue.category }}</span>
              <h1 class="head__title">{{ issue.title }}</h1>
              <p class="head__summary">{{ issue.summary }}</p>
              <div class="head__meta">
                <span class="meta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {{ issue.estimatedTime }}
                </span>
                <span class="meta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6.5 7 .6-5.3 4.6L18.4 21 12 17.3 5.6 21l1.7-7.3L2 9.1l7-.6z" /></svg>
                  {{ issue.difficulty }}
                </span>
                <span class="meta meta--success">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  {{ issue.successRate }}% fixed by users
                </span>
              </div>
            </div>
          </div>

          <div class="fx-split guide">
            <div>
              <div class="fx-card symptoms" v-if="issue.symptoms.length">
                <h3 class="fx-section-title">Does this match your problem?</h3>
                <ul class="symptoms__list">
                  <li v-for="s in issue.symptoms" :key="s">{{ s }}</li>
                </ul>
              </div>

              <div class="fx-card safety" v-if="issue.safety">
                <div class="safety__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <div>
                  <p class="safety__title">Safety first</p>
                  <p class="safety__text">{{ issue.safety }}</p>
                </div>
              </div>

              <div class="fx-card stepper" v-if="outcome === 'none'">
                <div class="stepper__top">
                  <span class="stepper__count">Step {{ current + 1 }} of {{ total }}</span>
                  <span class="stepper__pct">{{ progress }}%</span>
                </div>
                <div class="bar"><span :style="{ width: progress + '%' }" /></div>

                <div class="stepper__body">
                  <div class="stepper__num">{{ current + 1 }}</div>
                  <h3 class="stepper__title">{{ currentStep?.title }}</h3>
                  <p class="stepper__detail">{{ currentStep?.detail }}</p>
                </div>

                <div class="stepper__nav">
                  <button class="fx-btn fx-btn-secondary" :disabled="current === 0" @click="back">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    Back
                  </button>
                  <button class="fx-btn fx-btn-primary" @click="next">
                    {{ isLast ? "I've finished these steps" : 'Next step' }}
                    <svg v-if="!isLast" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </button>
                </div>
              </div>

              <div class="fx-card result" v-else-if="outcome === 'decide'">
                <div class="result__icon result__icon--ask">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <h3 class="result__title">Did these steps solve your problem?</h3>
                <p class="result__text">If your device works normally now, you are all set. If not, we will help you book a verified technician.</p>
                <div class="result__actions">
                  <button class="fx-btn fx-btn-primary" @click="outcome = 'fixed'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Yes, it's fixed
                  </button>
                  <button class="fx-btn fx-btn-secondary" @click="outcome = 'unresolved'">No, still broken</button>
                </div>
              </div>

              <div class="fx-card result" v-else-if="outcome === 'fixed'">
                <div class="result__icon result__icon--ok">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h3 class="result__title">Nice work — problem solved!</h3>
                <p class="result__text">You fixed it without a repair visit. That saves you time and money. If the issue comes back, FIXHUB Care and our technicians are always here.</p>
                <div class="result__actions">
                  <button class="fx-btn fx-btn-primary" @click="router.push('/client/care')">Browse more topics</button>
                  <button class="fx-btn fx-btn-ghost" @click="restart">Restart this guide</button>
                </div>
              </div>

              <div class="fx-card result" v-else-if="outcome === 'unresolved'">
                <div class="result__icon result__icon--book">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                </div>
                <h3 class="result__title">Let's get a technician on it</h3>
                <p class="result__text">No problem — some faults need professional tools. We'll carry over your issue so the technician knows exactly what to check.</p>
                <div class="result__actions">
                  <button class="fx-btn fx-btn-primary" @click="bookRepair">Book a repair</button>
                  <button class="fx-btn fx-btn-ghost" @click="restart">Restart troubleshooting</button>
                </div>
              </div>
            </div>

            <aside class="guide__aside">
              <div class="fx-card">
                <h3 class="fx-section-title">Your progress</h3>
                <ol class="checklist">
                  <li
                    v-for="(step, i) in steps"
                    :key="step.title"
                    class="checklist__item"
                    :class="{ 'is-done': i < current || outcome !== 'none', 'is-active': i === current && outcome === 'none' }"
                  >
                    <span class="checklist__dot">
                      <svg v-if="i < current || outcome !== 'none'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      <template v-else>{{ i + 1 }}</template>
                    </span>
                    <span class="checklist__label">{{ step.title }}</span>
                  </li>
                </ol>
              </div>

              <div class="fx-card help">
                <h3 class="fx-section-title">Prefer a pro?</h3>
                <p class="help__text">Skip the troubleshooting and book a verified technician right away.</p>
                <button class="fx-btn fx-btn-accent fx-btn--block" @click="bookRepair">Book a repair</button>
              </div>
            </aside>
          </div>
        </template>

        <div v-else class="fx-card empty">
          <h2 class="empty__title">Guide not found</h2>
          <p class="empty__sub">We could not find that troubleshooting topic.</p>
          <button class="fx-btn fx-btn-primary" @click="router.push('/client/care')">Back to FIXHUB Care</button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { getCareIssue } from '../../data/care';
import { useRepairDraft } from '../../stores/repair';

const route = useRoute();
const router = useRouter();
const { draft } = useRepairDraft();

const issue = computed(() => getCareIssue(String(route.params.issueId)));
const outcome = ref<'none' | 'decide' | 'fixed' | 'unresolved'>('none');
const current = ref(0);

const steps = computed(() => issue.value?.steps ?? []);
const total = computed(() => steps.value.length);
const currentStep = computed(() => steps.value[current.value]);
const isLast = computed(() => current.value >= total.value - 1);
const progress = computed(() => (total.value ? Math.round(((current.value + 1) / total.value) * 100) : 0));

function next() {
  if (isLast.value) {
    outcome.value = 'decide';
  } else {
    current.value++;
  }
}

function back() {
  if (current.value > 0) current.value--;
}

function restart() {
  current.value = 0;
  outcome.value = 'none';
}

function bookRepair() {
  if (issue.value) {
    draft.problem = `${issue.value.title} — self-service troubleshooting did not resolve it.`;
  }
  router.push('/client/request');
}
</script>

<style scoped>
.crumb {
  display: inline-flex; align-items: center; gap: 6px; margin-bottom: 16px;
  background: none; border: none; cursor: pointer; font-family: inherit;
  font-size: 13px; font-weight: 700; color: var(--text-muted); padding: 0;
}
.crumb:hover { color: var(--primary); }

.head { display: flex; gap: 18px; align-items: flex-start; margin-bottom: 24px; }
.head__icon {
  width: 60px; height: 60px; border-radius: 16px; flex-shrink: 0;
  background: var(--gradient-soft, var(--primary-light)); color: var(--primary);
  display: flex; align-items: center; justify-content: center;
}
.head__body { flex: 1; min-width: 0; }
.head__title { font-size: 24px; font-weight: 800; color: var(--text-dark); margin: 10px 0 6px; letter-spacing: -0.5px; }
.head__summary { font-size: 14px; color: var(--text-muted); margin: 0 0 12px; line-height: 1.55; }
.head__meta { display: flex; flex-wrap: wrap; gap: 16px; }
.meta { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text-muted); }
.meta--success { color: var(--success, #15803d); }

.guide { align-items: start; }
.symptoms { margin-bottom: 20px; }
.symptoms__list { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
.symptoms__list li { font-size: 13.5px; color: var(--text-dark); line-height: 1.5; }

.safety { display: flex; gap: 14px; margin-bottom: 20px; border-color: rgba(247, 157, 31, 0.35); background: rgba(247, 157, 31, 0.08); }
.safety__icon {
  width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
  background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center;
}
.safety__title { font-size: 14px; font-weight: 800; color: #b45309; margin: 0 0 2px; }
.safety__text { font-size: 13px; color: #92400e; margin: 0; line-height: 1.5; }

.stepper__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.stepper__count { font-size: 12px; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase; color: var(--primary); }
.stepper__pct { font-size: 13px; font-weight: 700; color: var(--text-muted); }
.bar { height: 8px; border-radius: 999px; background: rgba(20, 99, 68, 0.1); overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: 999px; background: var(--gradient); transition: width 0.3s ease; }
.stepper__body { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; padding: 22px 0 20px; }
.stepper__num {
  grid-row: span 2; width: 40px; height: 40px; border-radius: 12px;
  background: var(--gradient); color: #fff; font-size: 18px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.stepper__title { font-size: 18px; font-weight: 800; color: var(--text-dark); margin: 0; align-self: center; }
.stepper__detail { font-size: 14px; color: var(--text-dark); margin: 8px 0 0; line-height: 1.6; }
.stepper__nav { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid var(--hairline); padding-top: 18px; }
.stepper__nav .fx-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.result { text-align: center; padding: 32px 24px; }
.result__icon {
  width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 18px;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.result__icon--ask { background: var(--gradient); }
.result__icon--ok { background: var(--success, #15803d); }
.result__icon--book { background: var(--accent); }
.result__title { font-size: 20px; font-weight: 800; color: var(--text-dark); margin: 0 0 8px; }
.result__text { font-size: 14px; color: var(--text-muted); margin: 0 auto 20px; max-width: 480px; line-height: 1.6; }
.result__actions { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }

.guide__aside { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 20px; }
.checklist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.checklist__item { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 10px; }
.checklist__item.is-active { background: var(--primary-light); }
.checklist__dot {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: rgba(20, 99, 68, 0.1); color: var(--text-muted);
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.checklist__item.is-active .checklist__dot { background: var(--gradient); color: #fff; }
.checklist__item.is-done .checklist__dot { background: var(--success, #15803d); color: #fff; }
.checklist__label { font-size: 13.5px; font-weight: 600; color: var(--text-muted); }
.checklist__item.is-active .checklist__label { color: var(--primary); font-weight: 700; }
.checklist__item.is-done .checklist__label { color: var(--text-dark); }

.help__text { font-size: 13px; color: var(--text-muted); margin: 0 0 14px; line-height: 1.5; }

.empty { text-align: center; padding: 48px 24px; }
.empty__title { font-size: 20px; font-weight: 800; color: var(--text-dark); margin: 0 0 6px; }
.empty__sub { font-size: 14px; color: var(--text-muted); margin: 0 0 18px; }

@media (max-width: 767px) {
  .head { flex-direction: column; gap: 14px; }
  .head__title { font-size: 20px; }
  .guide__aside { position: static; }
  .stepper__nav .fx-btn { flex: 1; }
  .result__actions .fx-btn { width: 100%; }
}
</style>
