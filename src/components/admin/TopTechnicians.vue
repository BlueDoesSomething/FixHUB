<template>
  <section class="fx-card top-techs" aria-labelledby="top-technicians-title" data-testid="top-technicians">
    <header class="top-techs__header">
      <div>
        <h2 id="top-technicians-title" class="top-techs__title">Top Technicians</h2>
        <p class="top-techs__subtitle">Customer feedback and completed repairs, together.</p>
      </div>
    </header>

    <ol v-if="technicians.length" class="top-techs__list" role="list">
      <li v-for="(technician, index) in technicians" :key="technician.id" class="top-techs__row" :class="{ 'top-techs__row--first': index === 0 }" :data-technician-id="technician.id">
        <span class="top-techs__rank" :aria-label="`Rank ${index + 1}`">{{ index + 1 }}</span>
        <div class="top-techs__identity">
          <InitialAvatar :initials="technician.name.split(' ').map(part => part[0]).slice(0, 2).join('')" gradient="linear-gradient(135deg, #146344, #3d9870)" :size="44" :verified="true" />
          <div><h3>{{ technician.name }}</h3><p>{{ technician.specialty }}</p></div>
        </div>
        <dl class="top-techs__metrics">
          <div>
            <dt>Customer rating</dt>
            <dd><span class="top-techs__star" aria-hidden="true">★</span> <span :aria-label="`${technician.averageRating.toFixed(1)} out of 5 stars`">{{ technician.averageRating.toFixed(1) }}</span><small>{{ technician.reviewCount }} {{ technician.reviewCount === 1 ? 'review' : 'reviews' }}</small></dd>
          </div>
          <div>
            <dt>Completed repairs</dt>
            <dd>{{ technician.repairs.toLocaleString() }}</dd>
          </div>
          <div>
            <dt>Ranking score</dt>
            <dd class="top-techs__score">{{ technician.score.toFixed(1) }}<span> / 100</span></dd>
            <progress :value="technician.score" max="100" :aria-label="`${technician.name}: ranking score ${technician.score.toFixed(1)} out of 100`" />
          </div>
        </dl>
      </li>
    </ol>
    <p v-else class="top-techs__empty">No technicians qualify yet. Verified technicians need at least one review and one completed repair to appear here.</p>

    <details class="top-techs__method">
      <summary>How technicians are ranked</summary>
      <p>{{ TECHNICIAN_RANKING_WEIGHTS.rating * 100 }}% average customer rating (out of 5) + {{ TECHNICIAN_RANKING_WEIGHTS.repairs * 100 }}% completed repair volume (relative to the highest eligible repair total). Shows up to five verified technicians with reviews and completed repairs. Ties use rating, repair total, review count, then name.</p>
    </details>
  </section>
</template>

<script setup lang="ts">
import InitialAvatar from '../InitialAvatar.vue';
import { TECHNICIAN_RANKING_WEIGHTS } from '../../utils/technicianRanking';
import type { Overview } from '../../services/adminAnalytics';

defineProps<{ technicians: Overview['topTechnicians'] }>();
// Ranking and counts are aggregated by the admin-only Supabase RPC.
</script>

<style scoped>
.top-techs { color: var(--text-dark); }
.top-techs__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.top-techs__title { font-size: 18px; font-weight: 800; margin: 0; }
.top-techs__subtitle { font-size: 13px; color: var(--text-muted); margin: 5px 0 0; }
.top-techs__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.top-techs__row { display: grid; grid-template-columns: 32px minmax(180px, 1fr) minmax(350px, 1.4fr); gap: 16px; align-items: center; padding: 16px; border: 1px solid var(--hairline); border-radius: 14px; }
.top-techs__row--first { background: var(--gradient-soft); border-color: #b8d9ca; }
.top-techs__rank { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; background: var(--bg); color: var(--text-muted); font-size: 14px; font-weight: 800; }
.top-techs__row--first .top-techs__rank { background: #fef3c7; color: #854d0e; }
.top-techs__identity { display: flex; align-items: center; gap: 12px; min-width: 0; }
.top-techs__identity > div:last-child { min-width: 0; }
.top-techs__identity h3 { font-size: 14px; font-weight: 700; margin: 0; overflow-wrap: anywhere; }
.top-techs__identity p { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
.top-techs__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 0; }
.top-techs__metrics dt { font-size: 11px; line-height: 1.5; color: var(--text-muted); margin-bottom: 4px; }
.top-techs__metrics dd { margin: 0; font-size: 18px; font-weight: 800; }
.top-techs__metrics small { display: block; font-size: 11px; font-weight: 400; color: var(--text-muted); margin-top: 3px; }
.top-techs__star { color: #b77908; font-size: 16px; }
.top-techs__score { color: var(--primary); }
.top-techs__score span { font-size: 11px; font-weight: 400; color: var(--text-muted); }
.top-techs progress { display: block; width: 100%; max-width: 100px; height: 5px; margin-top: 8px; border: none; border-radius: 10px; overflow: hidden; background: #e2e8f0; }
.top-techs progress::-webkit-progress-bar { background: #e2e8f0; border-radius: 10px; }
.top-techs progress::-webkit-progress-value { background: var(--primary); border-radius: 10px; }
.top-techs progress::-moz-progress-bar { background: var(--primary); border-radius: 10px; }
.top-techs__method { margin-top: 18px; font-size: 12px; line-height: 1.8; color: var(--text-muted); }
.top-techs__method summary { cursor: pointer; width: fit-content; color: var(--primary); font-weight: 700; }
.top-techs__method summary:focus-visible { outline: 2px solid var(--primary); outline-offset: 4px; border-radius: 4px; }
.top-techs__method p { margin: 8px 0 0; }
.top-techs__empty { font-size: 14px; line-height: 1.8; color: var(--text-muted); padding: 12px 0; }
.top-techs__error { font-size: 12px; line-height: 1.7; color: var(--danger); }
@media (max-width: 1100px) {
  .top-techs__row { grid-template-columns: 32px minmax(0, 1fr); gap: 14px; }
  .top-techs__metrics { grid-column: 2; }
}
@media (max-width: 480px) {
  .top-techs__row { padding: 14px; gap: 12px; }
  .top-techs__metrics { grid-column: 1 / -1; padding-top: 12px; border-top: 1px solid var(--hairline); gap: 8px; }
  .top-techs__metrics dd { font-size: 17px; }
}
</style>
