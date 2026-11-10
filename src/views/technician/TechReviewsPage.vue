<template>
  <ion-page>
    <ScreenHeader title="Customer Reviews" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head"><div><h1 class="fx-page__title">Customer Reviews</h1><p class="fx-page__sub">See how customers rate your repairs and respond to their feedback.</p></div></div>
        <p v-if="state.storageError" role="alert">{{ state.storageError }}</p>
        <ReviewFeed v-if="technicianId !== null" :technician-id="technicianId" can-reply />
        <div v-else class="fx-card"><h2>No customer reviews yet</h2><p>Reviews will appear here after completed repairs.</p></div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { computed, onMounted, ref } from 'vue';
import ReviewFeed from '../../components/reviews/ReviewFeed.vue';
import { technicians } from '../../data/catalog';
import { useAuth } from '../../stores/auth';
import { useReviews } from '../../stores/reviews';
const auth = useAuth();
const { state, refresh } = useReviews();
const remoteProfileId = ref<string | null>(null);
// The directory holds no demo entries, so real technicians are matched by their FIXHUB profile id.
const directoryId = computed(() => technicians.find(tech => tech.name === auth.profile().name)?.id ?? null);
const technicianId = computed<number | string | null>(() => directoryId.value ?? remoteProfileId.value);
onMounted(() => {
  void refresh().then(() => { remoteProfileId.value = state.myTechnicianProfileId; });
});
</script>
