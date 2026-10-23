<template>
  <transition name="modal-fade">
    <div v-if="tech" class="modal" @click.self="emit('close')">
      <div class="modal__panel">
        <button class="modal__close" aria-label="Close" @click="emit('close')">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>

        <div class="modal__header">
          <div :class="['modal__avatar', tech.avatarBg]">{{ tech.initials }}</div>
          <div class="modal__id">
            <h3 class="modal__name">{{ tech.name }}</h3>
            <p class="modal__spec">{{ tech.specialization }}</p>
            <span :class="['modal__badge', tech.available ? 'is-online' : 'is-busy']">
              <span class="modal__dot"></span>{{ tech.available ? 'Available now' : 'Currently busy' }}
            </span>
          </div>
        </div>

        <div class="modal__stats">
          <div class="modal__stat">
            <i data-lucide="star" class="w-4 h-4 text-brand-accent"></i>
            <span class="v">{{ tech.rating }}</span>
            <span class="l">{{ tech.reviews }} reviews</span>
          </div>
          <div class="modal__stat">
            <i data-lucide="map-pin" class="w-4 h-4 text-brand-primary"></i>
            <span class="v">{{ tech.distance }}</span>
            <span class="l">Away from you</span>
          </div>
          <div class="modal__stat">
            <i data-lucide="briefcase" class="w-4 h-4 text-brand-primary"></i>
            <span class="v">{{ tech.completed }}</span>
            <span class="l">Repairs done</span>
          </div>
        </div>

        <div class="modal__section">
          <h4 class="modal__section-title">Exact Location</h4>
          <div class="modal__location">
            <i data-lucide="navigation" class="w-4 h-4"></i>
            <span>{{ tech.location }}</span>
          </div>
          <div class="modal__map">
            <MapCanvas :vh="300" height="260px" :markers="markers" :route="route" />
          </div>
          <div class="modal__legend">
            <span class="leg"><span class="leg__dot leg__dot--you"></span> Your location</span>
            <span class="leg"><span class="leg__dot leg__dot--tech"></span> {{ tech.name }}</span>
          </div>
        </div>

        <div class="modal__footer">
          <button class="modal__btn modal__btn--ghost" @click="emit('close')">Close</button>
          <button
            :disabled="!tech.available"
            class="modal__btn modal__btn--primary"
            @click="emit('request', tech)"
          >
            {{ tech.available ? 'Request this technician' : 'Unavailable' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import MapCanvas from '../../MapCanvas.vue';
import type { MapMarker } from '../../../types/map';
import type { LandingTechnician } from '../../../data/landing/technicians';

const props = defineProps<{ tech: LandingTechnician | null }>();
const emit = defineEmits<{ close: []; request: [tech: LandingTechnician] }>();

const YOU = { x: 200, y: 180 };

const markers = computed<MapMarker[]>(() => {
  if (!props.tech) return [];
  return [
    { x: YOU.x, y: YOU.y, kind: 'dest' },
    { x: props.tech.mapX, y: props.tech.mapY, kind: 'pulse', label: props.tech.initials, color: props.tech.markerColor },
  ];
});

const route = computed(() => {
  if (!props.tech) return undefined;
  const mx = (props.tech.mapX + YOU.x) / 2;
  const my = (props.tech.mapY + YOU.y) / 2 - 40;
  return `M ${props.tech.mapX} ${props.tech.mapY} Q ${mx} ${my} ${YOU.x} ${YOU.y}`;
});

const refreshIcons = () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

onMounted(refreshIcons);
watch(() => props.tech, refreshIcons);
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(8, 28, 18, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.modal__panel {
  position: relative;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(232, 245, 238, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 30px 70px rgba(8, 28, 18, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
.modal__close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--hairline);
  background: #fff;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.modal__close:hover { color: var(--primary); border-color: var(--primary); }

.modal__header { display: flex; align-items: center; gap: 18px; margin-bottom: 24px; padding-right: 40px; }
.modal__avatar {
  width: 72px; height: 72px;
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 26px; font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 10px 24px rgba(20, 99, 68, 0.22);
}
.modal__name { font-size: 22px; font-weight: 800; color: var(--text-dark); margin: 0; }
.modal__spec { font-size: 14px; color: var(--primary); font-weight: 600; margin: 3px 0 8px; }
.modal__badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 999px;
  font-size: 12px; font-weight: 700;
}
.modal__badge.is-online { background: #dcfce7; color: #15803d; }
.modal__badge.is-busy { background: #f1f5f9; color: #64748b; }
.modal__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

.modal__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.modal__stat {
  background: var(--bg);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: 14px;
  text-align: center;
}
.modal__stat .v { display: block; font-size: 18px; font-weight: 800; color: var(--text-dark); margin-top: 4px; }
.modal__stat .l { display: block; font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.modal__section-title { font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0 0 12px; }
.modal__location {
  display: flex; align-items: center; gap: 10px;
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px; font-weight: 600;
  margin-bottom: 14px;
}
.modal__map { border-radius: 16px; overflow: hidden; border: 1px solid var(--hairline); }
.modal__legend { display: flex; gap: 18px; margin-top: 12px; font-size: 12px; color: var(--text-muted); }
.leg { display: inline-flex; align-items: center; gap: 7px; }
.leg__dot { width: 10px; height: 10px; border-radius: 50%; }
.leg__dot--you { background: #ef4444; }
.leg__dot--tech { background: var(--primary); }

.modal__footer { display: flex; gap: 12px; margin-top: 24px; }
.modal__btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}
.modal__btn--ghost { background: var(--bg); color: var(--text-muted); flex: 0 0 auto; padding: 14px 24px; }
.modal__btn--ghost:hover { background: rgba(20, 99, 68, 0.08); color: var(--primary); }
.modal__btn--primary { background: var(--primary); color: #fff; }
.modal__btn--primary:hover:not(:disabled) { background: var(--primary-dark); }
.modal__btn--primary:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .modal__panel { padding: 20px; border-radius: 20px; }
  .modal__name { font-size: 19px; }
  .modal__avatar { width: 60px; height: 60px; font-size: 22px; border-radius: 16px; }
  .modal__stat { padding: 12px; }
  .modal__stat .v { font-size: 16px; }
  .modal__footer { flex-direction: column; }
  .modal__btn--ghost { width: 100%; }
}
</style>
