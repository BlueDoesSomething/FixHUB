<template>
  <ion-page>
    <ScreenHeader title="Verify Technicians" :show-back="false" />
    <ion-content>
      <div class="fx-page fx-page--wide">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Verify Technicians</h1>
            <p class="fx-page__sub">Review credentials and approve new technicians</p>
          </div>
          <span class="fx-pill fx-pill--progress">{{ pending.length }} pending</span>
        </div>

        <div class="fx-stack">
          <div class="fx-table">
            <h4 class="fx-table__title">Pending Verification</h4>
            <p v-if="!pending.length" class="fx-page__sub">No verification records available.</p>
            <div v-for="t in pending" :key="t.id" class="fx-table__row">
              <div class="fx-table__avatar" :style="{ background: t.color }">{{ t.initials }}</div>
              <div class="fx-table__info">
                <p class="fx-table__name">{{ t.name }}</p>
                <p class="fx-table__sub">{{ t.specialty }} • {{ t.experience }}</p>
              </div>
              <button class="fx-btn fx-btn-primary fx-btn--sm" @click="verify(t.id)">Verify</button>
            </div>
          </div>

          <div class="fx-table">
            <h4 class="fx-table__title">Verified Technicians</h4>
            <p class="fx-page__sub">No technician records available.</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';

interface PendingTech {
  id: number;
  initials: string;
  name: string;
  specialty: string;
  experience: string;
  color: string;
}

const pending = ref<PendingTech[]>([]);

function verify(id: number) {
  pending.value = pending.value.filter((t) => t.id !== id);
}
</script>

<style scoped>
.fx-stack { display: flex; flex-direction: column; gap: 20px; }
</style>
