<template>
  <ion-page>
    <ScreenHeader title="Reports & Analytics" :show-back="false" />
    <ion-content>
      <div class="fx-page fx-page--wide">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Reports &amp; Analytics</h1>
            <p class="fx-page__sub">Explore completed repairs and the brands repaired most often.</p>
          </div>
        </div>

        <section class="fx-card reports__filters" aria-label="Report filters">
          <fieldset>
            <legend>Report period</legend>
            <div class="reports__periods">
              <button v-for="option in REPORT_PERIODS" :key="option.value" type="button" :aria-pressed="period === option.value" :class="{ 'reports__period--active': period === option.value }" :data-period="option.value" @click="period = option.value">{{ option.label }}</button>
            </div>
          </fieldset>
          <label class="reports__date" for="report-date">Date within period<input id="report-date" v-model="referenceDate" type="date" min="0001-01-01" max="9999-12-31" aria-describedby="report-date-hint"></label>
          <p id="report-date-hint" class="reports__hint">Choose any date within the day, week, month, or year. Weeks run Monday–Sunday; dates use Philippines time (Asia/Manila).</p>
        </section>

        <p v-if="loadError" class="reports__error" role="alert">{{ loadError }}</p>
        <p v-if="loading" role="status">Loading Supabase reports…</p>

        <p v-if="!report" class="reports__error" role="alert">Choose a valid date to see reports.</p>
        <template v-else-if="!loading && !loadError">
          <p class="reports__range" role="status" data-testid="report-range">{{ report.range.label }} · {{ report.total }} completed {{ report.total === 1 ? 'repair' : 'repairs' }}</p>
          <div class="fx-stat-grid reports__stats">
            <div class="fx-stat">
              <div class="fx-stat__icon fx-stat__icon--blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6" /></svg>
              </div>
              <p class="fx-stat__value" data-testid="report-total">{{ report.total.toLocaleString() }}</p>
              <p class="fx-stat__label">Completed Repairs</p>
            </div>
          </div>

          <div class="reports__charts">
            <section class="fx-card reports__chart" aria-labelledby="brand-chart-title">
              <header class="reports__chart-head">
                <div><h2 id="brand-chart-title" class="chart-title">Repairs by Brand</h2><p class="reports__chart-sub">Repair counts and share for the selected period.</p></div>
              </header>
              <p v-if="report.brands.length" class="reports__leading" data-testid="report-top-brand">Most repaired: <strong>{{ report.brands[0].label }}</strong> · {{ report.brands[0].value }} {{ report.brands[0].value === 1 ? 'repair' : 'repairs' }}</p>
              <DonutChart label="Completed repairs by brand" :segments="report.brands" data-testid="brand-donut" />
            </section>
            <section class="fx-card reports__chart" aria-labelledby="service-chart-title">
              <header class="reports__chart-head">
                <div><h2 id="service-chart-title" class="chart-title">Service Type Distribution</h2><p class="reports__chart-sub">Home service versus drop-off for the same period.</p></div>
              </header>
              <template v-if="report.total">
                <BarChart :data="report.services" :chart-height="200" aria-hidden="true" />
                <dl class="reports__services">
                  <div v-for="service in report.services" :key="service.label">
                    <dt>{{ service.label }}</dt>
                    <dd>{{ service.value }} {{ service.value === 1 ? 'repair' : 'repairs' }} <span>({{ service.height.toFixed(1) }}%)</span></dd>
                  </div>
                </dl>
              </template>
              <p v-else class="reports__empty">No completed repairs in this period.</p>
            </section>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { computed, ref, watch } from 'vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import BarChart from '../../components/BarChart.vue';
import DonutChart from '../../components/DonutChart.vue';
import { REPORT_PERIODS, REPORT_TIME_ZONE, type ReportPeriod, type ReportRepair } from '../../data/reports';
import { buildRepairReport, reportDateRange } from '../../utils/reports';
import { fetchReportRepairs } from '../../services/adminAnalytics';

const period = ref<ReportPeriod>('month');
const referenceDate = ref(new Intl.DateTimeFormat('en-CA', { timeZone: REPORT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
const records = ref<ReportRepair[]>([]);
const loading = ref(false);
const loadError = ref('');
const report = computed(() => buildRepairReport(records.value, period.value, referenceDate.value));
watch([period, referenceDate], async ([selectedPeriod, date], _old, onCleanup) => {
  if (!reportDateRange(selectedPeriod, date)) return;
  let cancelled = false;
  onCleanup(() => { cancelled = true; });
  loading.value = true;
  loadError.value = '';
  records.value = [];
  try {
    const result = await fetchReportRepairs(selectedPeriod, date);
    if (!cancelled) records.value = result;
  } catch {
    if (!cancelled) loadError.value = 'Unable to load reports from Supabase.';
  } finally {
    if (!cancelled) loading.value = false;
  }
}, { immediate: true });
</script>

<style scoped>
.reports__stats { margin-bottom: 20px; }
.reports__stats .fx-stat__value { overflow-wrap: anywhere; }
.reports__filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 18px 24px; margin-bottom: 18px; }
.reports__filters fieldset { flex: 1 1 300px; min-width: 0; border: none; padding: 0; margin: 0; }
.reports__filters legend, .reports__date { font-size: 13px; font-weight: 700; color: var(--text-dark); }
.reports__filters legend { margin-bottom: 10px; }
.reports__periods { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 4px; background: var(--bg); border: 1px solid var(--hairline); border-radius: 12px; }
.reports__periods button { min-width: 0; min-height: 44px; padding: 10px 6px; border: none; border-radius: 8px; background: transparent; color: var(--text-muted); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.reports__periods .reports__period--active { background: var(--primary); color: #fff; box-shadow: var(--shadow-sm); }
.reports__periods button:focus-visible, .reports__date input:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.reports__date { display: grid; gap: 10px; flex: 0 1 220px; min-width: 0; }
.reports__date input { width: 100%; min-width: 0; min-height: 54px; padding: 10px 12px; border: 1px solid var(--hairline); border-radius: 10px; background: #fff; color: var(--text-dark); font: inherit; }
.reports__hint { flex-basis: 100%; color: var(--text-muted); font-size: 12px; line-height: 1.8; margin: 0; }
.reports__range { font-size: 14px; font-weight: 700; color: var(--primary); margin: 0 0 18px; line-height: 1.7; }
.reports__charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr)); gap: 20px; align-items: start; }
.reports__chart-head { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.chart-title { font-size: 16px; font-weight: 700; color: var(--text-dark); margin: 0; }
.reports__chart-sub { font-size: 12px; color: var(--text-muted); line-height: 1.7; margin: 5px 0 0; }
.reports__leading { padding: 10px 12px; background: var(--gradient-soft); color: var(--primary); border-radius: 10px; font-size: 12px; line-height: 1.8; margin: 0 0 20px; }
.reports__services { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 20px 0 0; padding-top: 16px; border-top: 1px solid var(--hairline); }
.reports__services dt { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.reports__services dd { font-size: 14px; color: var(--text-dark); font-weight: 700; line-height: 1.7; margin: 0; }
.reports__services dd span { color: var(--text-muted); font-size: 12px; font-weight: 400; }
.reports__empty { color: var(--text-muted); font-size: 14px; line-height: 1.8; margin: 0; padding: 20px 0; }
.reports__error { color: var(--danger); font-size: 14px; line-height: 1.8; }
@media (max-width: 600px) {
  .reports__date { flex: 1 1 100%; }
  .reports__periods button { font-size: 12px; }
}
</style>
