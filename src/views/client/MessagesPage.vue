<template>
  <ion-page>
    <ScreenHeader title="Messages" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Messages</h1>
            <p class="fx-page__sub">Conversations with your technicians</p>
          </div>
        </div>

        <div class="fx-table">
          <div class="convo fx-table__row" @click="openChat">
            <InitialAvatar initials="JD" gradient="linear-gradient(135deg, #146344, #1b7a54)" :size="44" />
            <div class="convo__body fx-table__info">
              <div class="convo__row">
                <span class="convo__name">Juan Dela Cruz</span>
                <span class="convo__time">9:37 AM</span>
              </div>
              <p class="convo__msg">Okay, I'm on the way. ETA ~12 min. 🚗</p>
            </div>
            <span class="convo__badge">2</span>
          </div>
          <div class="convo fx-table__row" @click="openChat">
            <InitialAvatar initials="MS" gradient="linear-gradient(135deg, #A8E6CF, #56C596)" :size="44" />
            <div class="convo__body fx-table__info">
              <div class="convo__row">
                <span class="convo__name">Maria Santos</span>
                <span class="convo__time">Yesterday</span>
              </div>
              <p class="convo__msg">Thank you for the repair! ⭐</p>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import InitialAvatar from '../../components/InitialAvatar.vue';
import { useAuth } from '../../stores/auth';

const router = useRouter();
const { state } = useAuth();

function openChat() {
  const base = state.role === 'technician' ? '/technician' : '/client';
  router.push(`${base}/messages/chat`);
}
</script>

<style scoped>
.convo { cursor: pointer; }
.convo:hover { background: var(--primary-light); }
.convo__body { flex: 1; min-width: 0; }
.convo__row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.convo__name { font-size: 15px; font-weight: 700; color: var(--text-dark); }
.convo__time { font-size: 12px; color: var(--text-muted); }
.convo__msg { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.convo__badge {
  width: 22px; height: 22px; background: var(--accent); color: #fff;
  border-radius: 50%; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
</style>
