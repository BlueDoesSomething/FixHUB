<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="fx-page">
        <section class="fx-hero">
          <div class="fx-hero-body matching-hero">
            <h1>Find a Technician</h1>
            <p>Automatically locate nearby repair professionals and follow their shared location updates.</p>
          </div>
        </section>
        <section class="fx-card nearby-picker">
          <h2 class="fx-section-title">Your starting point</h2>
          <p class="fx-page__sub">Allow device location to follow your position, or choose a pin manually. Your starting point is not published.</p>
          <LocationPicker v-if="userId" :key="userId" ref="picker" id="nearby-location" v-model="point" v-model:address="address" auto-locate :active="active" label="Find technicians near your selected location" :extra-markers="markers" />
        </section>
        <NearbyTechnicians v-if="userId" :key="userId" id="nearby" :point="point" :active="active" title="Nearby technicians" @markers="markers = $event" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IonPage, IonContent, onIonViewWillEnter, onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue';
import LocationPicker from '../../components/LocationPicker.vue';
import NearbyTechnicians from '../../components/NearbyTechnicians.vue';
import { useAuth } from '../../stores/auth';
import type { GeoPoint, MapMarker } from '../../types/map';

const { state: authState } = useAuth();
const userId = computed(() => authState.session?.userId);
const active = ref(true);
const picker = ref<InstanceType<typeof LocationPicker> | null>(null);
const point = ref<GeoPoint | null>(null);
const address = ref('');
const markers = ref<MapMarker[]>([]);
watch(userId, () => { point.value = null; address.value = ''; markers.value = []; });
onIonViewWillEnter(() => { active.value = true; });
onIonViewDidEnter(() => picker.value?.resize());
onIonViewDidLeave(() => { active.value = false; });
</script>

<style scoped>
.matching-hero { text-align: center; }
.matching-hero h1 { font-size: 22px; margin: 0 0 8px; }
.matching-hero p { font-size: 14px; opacity: 0.9; }
.nearby-picker { margin: 24px 0; }
.nearby-picker > p { margin-bottom: 16px; }
</style>
