<template>
  <ion-page>
    <ScreenHeader :title="otherName || 'Conversation'" :default-href="messagesPath" />
    <ion-content>
      <div class="fx-page">
        <p v-if="loading" role="status">Loading conversation…</p>
        <div v-else-if="error" class="fx-card" role="alert">{{ error }} <button class="fx-btn fx-btn-secondary fx-btn--sm" @click="load">Try Again</button></div>
        <div v-else-if="!conversation" class="fx-card"><h1 class="fx-page__title">No conversation selected</h1><p class="fx-page__sub">Open an accepted repair from Messages to continue.</p><RouterLink class="fx-btn fx-btn-secondary" :to="messagesPath">View Messages</RouterLink></div>
        <template v-else>
          <div class="fx-page__head"><div><h1 class="fx-page__title">{{ otherName }}</h1><p class="fx-page__sub">{{ conversation.reference }} · {{ conversation.device }} {{ conversation.model }}</p></div><button class="fx-btn fx-btn-secondary fx-btn--sm" @click="refreshMessages">Refresh</button></div>
          <div class="fx-card message-list" aria-label="Repair messages" aria-live="polite">
            <p v-if="!messages.length" class="fx-page__sub">No messages yet. Send a message to start the conversation.</p>
            <div v-for="message in messages" :key="message.id" class="message" :class="{ 'message--mine': message.sender_id === userId }" data-testid="repair-message">
              <strong>{{ message.sender_id === userId ? 'You' : otherName }}</strong>
              <p>{{ message.body }}</p><time :datetime="message.created_at">{{ new Date(message.created_at).toLocaleString() }}</time>
            </div>
          </div>
          <form class="composer" @submit.prevent="send">
            <label for="message-body">Message {{ otherName }}</label>
            <textarea id="message-body" v-model="draft" :disabled="sending || conversation.status === 'cancelled'" maxlength="2000" rows="3" placeholder="Write a message…" />
            <p v-if="conversation.status === 'cancelled'" role="status">This repair was cancelled; new messages are disabled.</p>
            <p v-if="sendError" role="alert">{{ sendError }}</p>
            <button class="fx-btn fx-btn-primary" type="submit" :disabled="sending || !draft.trim() || conversation.status === 'cancelled'">{{ sending ? 'Sending…' : 'Send Message' }}</button>
          </form>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { IonPage, IonContent, onIonViewWillEnter, onIonViewDidLeave } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { fetchRepairConversations, fetchRepairMessages, sendRepairMessage, type RepairConversation, type RepairMessage } from '../../services/repairMessages';
import { useAuth } from '../../stores/auth';

const auth = useAuth();
const route = useRoute();
const userId = computed(() => auth.state.session?.userId);
const messagesPath = computed(() => auth.state.role === 'technician' ? '/technician/messages' : '/client/messages');
const conversation = ref<RepairConversation | null>(null);
const otherName = computed(() => auth.state.role === 'technician' ? conversation.value?.customerName : conversation.value?.technicianName);
const messages = ref<RepairMessage[]>([]);
const loading = ref(true);
const error = ref('');
const sendError = ref('');
const sending = ref(false);
const draft = ref('');
let version = 0;
let poller: ReturnType<typeof setInterval> | undefined;
async function refreshMessages() {
  const current = version;
  const id = conversation.value?.repairId;
  const viewer = userId.value;
  if (!id || !viewer) return;
  try {
    const result = await fetchRepairMessages(id);
    if (current === version && userId.value === viewer) messages.value = result;
  } catch {
    if (current === version) sendError.value = 'Messages could not be refreshed. Check your connection and try again.';
  }
}
async function load() {
  const current = ++version;
  const viewer = userId.value;
  const repairId = route.params.repairId;
  loading.value = true;
  error.value = '';
  sendError.value = '';
  conversation.value = null;
  messages.value = [];
  if (typeof repairId !== 'string' || !viewer) { loading.value = false; return; }
  try {
    const threads = await fetchRepairConversations();
    if (current !== version || userId.value !== viewer) return;
    const selected = threads.find(item => item.repairId === repairId);
    if (!selected) { error.value = 'This conversation is not available to your account.'; return; }
    const result = await fetchRepairMessages(repairId);
    if (current === version && userId.value === viewer) {
      conversation.value = selected;
      messages.value = result;
    }
  } catch {
    if (current === version) error.value = 'Could not load this conversation from FIXHUB. Check your connection and try again.';
  } finally { if (current === version) loading.value = false; }
}
async function send() {
  const thread = conversation.value;
  const viewer = userId.value;
  const text = draft.value.trim();
  if (!thread || !viewer || !text || text.length > 2000 || sending.value || thread.status === 'cancelled') return;
  sending.value = true;
  sendError.value = '';
  const current = version;
  try {
    const saved = await sendRepairMessage(thread.repairId, text, crypto.randomUUID(), viewer);
    if (current === version && userId.value === viewer) {
      messages.value = [...messages.value.filter(message => message.id !== saved.id), saved];
      draft.value = '';
    }
  } catch {
    if (current === version) sendError.value = 'Your message was not confirmed by FIXHUB. Check your connection and try again.';
  } finally { sending.value = false; }
}
function startPolling() {
  if (poller) clearInterval(poller);
  poller = setInterval(() => { void refreshMessages(); }, 5000);
}
function stopPolling() { if (poller) clearInterval(poller); poller = undefined; }
watch(() => [route.params.repairId, userId.value], () => {
  stopPolling(); version++; conversation.value = null; messages.value = []; draft.value = '';
  void load(); startPolling();
}, { flush: 'sync' });
onMounted(() => { void load(); startPolling(); });
onIonViewWillEnter(() => { void load(); startPolling(); });
onIonViewDidLeave(stopPolling);
onBeforeUnmount(stopPolling);
</script>
<style scoped>
.message-list { display: grid; gap: 12px; margin-bottom: 16px; min-height: 120px; }
.message { max-width: 85%; justify-self: start; padding: 12px; border-radius: 12px; background: var(--bg); overflow-wrap: anywhere; }
.message--mine { justify-self: end; background: var(--gradient-soft); }
.message strong { font-size: 12px; }
.message p { white-space: pre-wrap; margin: 6px 0; }
.message time { font-size: 11px; color: var(--text-muted); }
.composer { display: grid; gap: 10px; }
.composer label { font-weight: 700; }
.composer textarea { padding: 12px; border: 1px solid var(--hairline); border-radius: 10px; font: inherit; }
.composer [role='alert'] { color: var(--danger); }
.composer button { justify-self: start; }
</style>
