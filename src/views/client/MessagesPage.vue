<template>
  <ion-page>
    <ScreenHeader title="Messages" :show-back="false" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head"><h1 class="fx-page__title">Messages</h1><button class="fx-btn fx-btn-secondary fx-btn--sm" :disabled="loading" @click="load(false)">Refresh</button></div>
        <p v-if="loading" role="status">Loading conversations…</p>
        <div v-else-if="error" class="fx-card" role="alert">{{ error }} <button class="fx-btn fx-btn-secondary fx-btn--sm" @click="load(false)">Try Again</button></div>
        <div v-else-if="!conversations.length" class="fx-card"><h2 class="fx-section-title">No conversations available</h2><p class="fx-page__sub">When a technician accepts a repair, the conversation will appear here for both accounts.</p></div>
        <div v-else class="conversation-list">
          <RouterLink v-for="item in conversations" :key="item.repairId" class="fx-card conversation" :to="{ name: chatRoute, params: { repairId: item.repairId } }" data-testid="repair-conversation">
            <div><h2>{{ otherName(item) }}</h2><p>{{ item.reference }} · {{ item.device }} {{ item.model }}</p></div>
            <span class="fx-pill fx-pill--progress">{{ item.status.replaceAll('_', ' ') }}</span>
          </RouterLink>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { IonPage, IonContent, onIonViewWillEnter, onIonViewDidLeave } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { fetchRepairConversations, type RepairConversation } from '../../services/repairMessages';
import { useAuth } from '../../stores/auth';

const auth = useAuth();
const conversations = ref<RepairConversation[]>([]);
const loading = ref(true);
const error = ref('');
const chatRoute = computed(() => auth.state.role === 'technician' ? 'technician-chat' : 'client-chat');
const otherName = (item: RepairConversation) => auth.state.role === 'technician' ? item.customerName : item.technicianName;
let version = 0;
let poller: ReturnType<typeof setInterval> | undefined;
async function load(silent = false) {
  const current = ++version;
  const userId = auth.state.session?.userId;
  if (!silent) loading.value = true;
  try {
    const result = await fetchRepairConversations();
    if (current === version && userId === auth.state.session?.userId) { conversations.value = result; error.value = ''; }
  } catch {
    if (current === version) error.value = 'Could not load conversations from FIXHUB. Check your connection and try again.';
  } finally { if (current === version) loading.value = false; }
}
watch(() => auth.state.session?.userId, () => {
  version++;
  conversations.value = [];
  error.value = '';
  if (auth.state.isAuthenticated) void load();
}, { flush: 'sync' });
onMounted(() => { void load(); });
onIonViewWillEnter(() => {
  void load();
  if (poller) clearInterval(poller);
  poller = setInterval(() => { if (!loading.value) void load(true); }, 5000);
});
function stopPolling() { if (poller) clearInterval(poller); poller = undefined; }
onIonViewDidLeave(stopPolling);
onBeforeUnmount(stopPolling);
</script>
<style scoped>
.conversation-list { display: grid; gap: 12px; }
.conversation { display: flex; justify-content: space-between; align-items: center; gap: 12px; text-decoration: none; color: var(--text-dark); }
.conversation h2 { font-size: 16px; margin: 0 0 6px; }
.conversation p { color: var(--text-muted); font-size: 13px; margin: 0; }
.conversation .fx-pill { text-transform: capitalize; }
</style>
