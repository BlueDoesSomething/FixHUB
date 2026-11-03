<template>
  <ion-page>
    <ScreenHeader title="Customer Reviews" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head"><div><h1 class="fx-page__title">Customer Reviews</h1><p class="fx-page__sub">See how customers rate your repairs and respond to their feedback.</p></div></div>
        <ReviewFeed v-if="technician" :technician-id="technician.id" can-reply />
        <div v-else class="fx-card"><h2>No customer reviews yet</h2><p>Reviews will appear here after completed repairs.</p></div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { computed } from 'vue';
import ReviewFeed from '../../components/reviews/ReviewFeed.vue';
import { technicians } from '../../data/catalog';
import { useAuth } from '../../stores/auth';
const auth = useAuth();
const technician = computed(() => technicians.find(tech => tech.name === auth.profile().name));
</script>
