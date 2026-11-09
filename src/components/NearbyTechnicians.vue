<template>
  <section aria-label="Nearby technician recommendations">
    <div class="nearby-heading">
      <h2 class="fx-section-title">{{ title }}</h2>
      <div class="nearby-controls">
        <label :for="`${id}-radius`">Search radius</label>
        <select :id="`${id}-radius`" v-model.number="radius" class="fx-input" :disabled="!point">
          <option v-for="km in [5, 10, 25, 50, 100]" :key="km" :value="km">{{ km }} km</option>
        </select>
        <button class="fx-btn fx-btn-secondary fx-btn--sm" type="button" :disabled="loading" @click="refresh()">Refresh</button>
      </div>
    </div>
    <p class="nearby-note" role="status">{{ setupRequired ? 'Automatic refresh is paused until the server is configured. Press Refresh after the database migrations are applied.' : connected ? 'Connected to live technician updates.' : 'Refreshing technician locations every 15 seconds; live connection unavailable.' }}</p>
    <p v-if="error" class="nearby-error" role="alert">{{ error }}</p>
    <p v-if="loading && !technicians.length" role="status">Loading technician locations…</p>
    <template v-else-if="!error">
      <p v-if="!point" class="nearby-note">Waiting for your location. Allow device location or choose a map pin to see nearby recommendations.</p>
      <p v-else-if="!nearby.length" class="fx-card" role="status">No matching technicians have shared a location within this radius. Try a larger radius or another starting point.</p>
      <div v-if="point && nearby.length" class="fx-grid-2">
        <article v-for="tech in nearby" :key="tech.id" class="fx-card nearby-technician" data-testid="nearby-technician">
          <div class="nearby-technician__head"><h3>{{ tech.full_name }}</h3><strong>{{ tech.distance?.toFixed(1) }} km away</strong></div>
          <p>{{ tech.specializations.join(' · ') }}</p>
          <p>{{ tech.service_type === 'both' ? 'Home service & drop-off' : tech.service_type === 'home' ? 'Home service' : 'Drop-off' }}</p>
          <p>{{ tech.address }}</p>
          <p class="nearby-note">{{ tech.location_mode === 'live' ? 'Live GPS' : 'Saved service location' }} · Updated {{ new Date(tech.updated_at).toLocaleTimeString() }}</p>
          <a class="fx-btn fx-btn-secondary fx-btn--sm" :href="technicianDirections(tech, point)" target="_blank" rel="noopener noreferrer">Get directions ↗</a>
        </article>
      </div>
      <p v-if="point" class="nearby-note">Nearest first{{ device ? ` · Request: ${device}` : '' }}{{ serviceType ? ` · ${serviceType === 'home' ? 'Home service' : 'Drop-off'}` : '' }}. Confirm device support with the technician. Distances are straight-line estimates, not driving distances. Recommendations do not assign or notify a technician.</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { GeoPoint, MapMarker } from '../types/map';
import type { ServiceType } from '../data/repair';
import { useTechnicianDirectory } from '../composables/useTechnicianDirectory';
import { nearbyTechnicians, technicianDirections } from '../utils/nearbyTechnicians';

const props = withDefaults(defineProps<{
  id: string; point: GeoPoint | null; active?: boolean; device?: string; serviceType?: ServiceType; title?: string;
}>(), { active: true, title: 'Recommended nearby technicians' });
const emit = defineEmits<{ markers: [markers: MapMarker[]] }>();
const radius = ref(25);
const { technicians, loading, error, connected, setupRequired, now, refresh } = useTechnicianDirectory(() => props.active);
const nearby = computed(() => nearbyTechnicians(technicians.value, props.point, radius.value, now.value, props.device, props.serviceType));
watch(() => [nearby.value, props.point] as const, () => emit('markers', props.point ? nearby.value.map(tech => ({
  id: tech.id, lat: tech.latitude, lng: tech.longitude, title: tech.full_name, kind: tech.location_mode === 'live' ? 'pulse' : 'tech',
})) : []), { immediate: true });
</script>

<style scoped>
.nearby-heading, .nearby-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.nearby-heading { justify-content: space-between; margin: 20px 0 12px; }
.nearby-heading h2 { margin: 0; }
.nearby-controls { font-size: 13px; color: var(--text-muted); }
.nearby-controls select { width: auto; }
.nearby-technician { display: flex; flex-direction: column; gap: 10px; }
.nearby-technician__head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.nearby-technician h3 { font-size: 17px; margin: 0; }
.nearby-technician p { margin: 0; font-size: 13px; overflow-wrap: anywhere; }
.nearby-technician strong { font-size: 13px; color: var(--primary); }
.nearby-technician a { align-self: start; margin-top: auto; }
.nearby-note { color: var(--text-muted); font-size: 12px; line-height: 1.6; margin: 12px 0; }
.nearby-error { padding: 12px; border-radius: 10px; background: #fef2f2; color: #b91c1c; }
</style>
