<template>
  <ion-page>
    <ScreenHeader title="New Requests" :show-back="false" />
    <ion-content class="req-content">
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">New Requests</h1>
            <p class="fx-page__sub">Review and respond to incoming repair jobs.</p>
          </div>
          <span class="fx-pill fx-pill--progress">{{ requests.length }} pending</span>
        </div>

        <div v-if="requests.length" class="fx-grid-2">
          <RequestCard
            v-for="req in requests"
            :key="req.id"
            :request="req"
            @accept="accept"
            @reject="reject"
          />
        </div>
        <p v-else class="empty">No new requests right now.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import RequestCard from '../../components/RequestCard.vue';
import { newRequests, type ServiceRequest } from '../../data/catalog';

const router = useRouter();
const requests = ref<ServiceRequest[]>([...newRequests]);

function accept() {
  router.push('/technician/active');
}

function reject(req: ServiceRequest) {
  requests.value = requests.value.filter((r) => r.id !== req.id);
}
</script>

<style scoped>
.req-content { --background: var(--bg); }

.empty {
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 48px;
}
</style>
