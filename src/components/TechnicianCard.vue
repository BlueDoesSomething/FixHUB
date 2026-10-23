<template>
  <div class="tech-card" :class="{ 'tech-card--best': tech.best }" @click="emit('select', tech)">
    <span v-if="tech.best" class="tech-card__badge">★ Best Match</span>
    <div class="tech-card__top">
      <InitialAvatar :initials="tech.initials" :gradient="tech.color" :size="44" :verified="tech.verified" />
      <div class="tech-card__info">
        <h4>{{ tech.name }}</h4>
        <p class="tech-card__spec">{{ tech.specialty }}</p>
        <div class="tech-card__rating">
          <span class="stars">★★★★★</span>
          <span>{{ tech.rating }}</span>
          <span class="tech-card__reviews">({{ tech.reviews }})</span>
        </div>
      </div>
    </div>
    <div class="tech-card__stats">
      <div><div class="v">{{ tech.distance }}</div><div class="l">Distance</div></div>
      <div><div class="v">{{ tech.response }}</div><div class="l">Response</div></div>
      <div><div class="v">{{ tech.repairs }}</div><div class="l">Repairs</div></div>
    </div>
    <button class="tech-card__action">View Technician →</button>
  </div>
</template>

<script setup lang="ts">
import InitialAvatar from './InitialAvatar.vue';
import type { Technician } from '../data/mock';

const props = defineProps<{ tech: Technician }>();
const emit = defineEmits<{ select: [tech: Technician] }>();
void props;
</script>

<style scoped>
.tech-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1.5px solid var(--hairline);
  cursor: pointer;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.tech-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: rgba(20, 99, 68, 0.2); }
.tech-card--best { border-color: var(--primary); background: var(--gradient-soft); }
.tech-card__badge {
  position: absolute; top: -10px; right: 16px;
  background: var(--accent); color: #fff;
  padding: 4px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700;
  box-shadow: 0 4px 10px rgba(247, 157, 31, 0.3);
}
.tech-card__top { display: flex; gap: 14px; margin-bottom: 16px; }
.tech-card__info h4 { font-size: 16px; font-weight: 700; color: var(--text-dark); margin: 0; }
.tech-card__spec { font-size: 13px; color: var(--text-muted); margin: 3px 0 6px; }
.tech-card__rating { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; color: var(--text-dark); }
.tech-card__rating .stars { color: var(--accent); }
.tech-card__reviews { color: var(--text-muted); font-weight: 400; }
.tech-card__stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
  padding-top: 14px; border-top: 1px solid var(--hairline); text-align: center;
}
.tech-card__stats .v { font-size: 15px; font-weight: 700; color: var(--primary); }
.tech-card__stats .l { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.tech-card__action {
  margin-top: 16px; padding: 11px; width: 100%;
  background: var(--primary); border: none; border-radius: 10px;
  color: #fff; font-size: 13px; font-weight: 700;
  font-family: inherit; cursor: pointer;
  transition: background 0.2s ease;
}
.tech-card__action:hover { background: var(--primary-dark); }
</style>
