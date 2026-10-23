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
            <div class="fx-table__row">
              <div class="fx-table__avatar">JD</div>
              <div class="fx-table__info">
                <p class="fx-table__name">Juan Dela Cruz</p>
                <p class="fx-table__sub">Apple Specialist • 6 yrs exp</p>
              </div>
              <span class="fx-pill fx-pill--completed">Verified</span>
            </div>
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

const pending = ref<PendingTech[]>([
  { id: 1, initials: 'MS', name: 'Mark Santos', specialty: 'Laptop Specialist', experience: '2 yrs exp', color: 'linear-gradient(135deg, #A8E6CF, #56C596)' },
  { id: 2, initials: 'RC', name: 'Rico Castillo', specialty: 'Android Specialist', experience: '4 yrs exp', color: 'linear-gradient(135deg, #C9B6E4, #8B6FC0)' },
]);

function verify(id: number) {
  pending.value = pending.value.filter((t) => t.id !== id);
}
</script>

<style scoped>
.fx-stack { display: flex; flex-direction: column; gap: 20px; }
</style>
