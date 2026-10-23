<template>
  <ion-page>
    <ScreenHeader title="Juan Dela Cruz" :show-back="false">
      <template #end>
        <span class="online">● Online</span>
      </template>
    </ScreenHeader>
    <ion-content ref="contentRef" class="chat-content">
      <div class="fx-page">
        <div class="chat-date">Today, Oct 9, 2026</div>
        <div v-for="(m, i) in messages" :key="i" class="bubble" :class="m.from === 'me' ? 'bubble--out' : 'bubble--in'">
          {{ m.text }}
          <div class="bubble__time">{{ m.time }}</div>
        </div>
      </div>
    </ion-content>
    <ion-footer>
      <div class="chat-input">
        <div class="chat-input__attach">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
        </div>
        <input class="chat-input__field" v-model="draftMessage" placeholder="Type a message..." @keyup.enter="send" />
        <button class="chat-input__send" @click="send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { IonPage, IonContent, IonFooter } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';

interface Message { text: string; time: string; from: 'me' | 'them' }

const contentRef = ref<{ $el?: HTMLElement & { scrollToBottom?: (duration?: number) => void } } | null>(null);
const draftMessage = ref('');

const messages = ref<Message[]>([
  { text: "Hi Alex! I'm Juan, your technician. 🙋‍♂️", time: '9:32 AM', from: 'them' },
  { text: "Hi, I'm already at home.", time: '9:35 AM', from: 'me' },
  { text: "Okay, I'm on the way. ETA ~12 min. 🚗", time: '9:36 AM', from: 'them' },
  { text: 'Thank you 👍', time: '9:37 AM', from: 'me' },
]);

function send() {
  const text = draftMessage.value.trim();
  if (!text) return;
  messages.value.push({ text, time: 'Now', from: 'me' });
  draftMessage.value = '';
  nextTick(() => contentRef.value?.$el?.scrollToBottom?.(200));
}
</script>

<style scoped>
.chat-content { --background: var(--bg); }
.chat-date { text-align: center; font-size: 12px; color: var(--text-muted); margin: 8px 0 20px; }
.bubble {
  max-width: 70%; padding: 12px 16px; border-radius: 16px;
  font-size: 14px; line-height: 1.5; margin-bottom: 10px; word-wrap: break-word;
}
.bubble--in { background: #fff; color: var(--text-dark); border-bottom-left-radius: 4px; margin-right: auto; box-shadow: var(--shadow-sm); }
.bubble--out { background: var(--gradient); color: #fff; border-bottom-right-radius: 4px; margin-left: auto; }
.bubble__time { font-size: 11px; opacity: 0.7; margin-top: 5px; }

ion-footer { background: #fff; border-top: 1px solid var(--hairline); }
.chat-input {
  max-width: 900px; margin: 0 auto; padding: 14px 20px;
  display: flex; align-items: center; gap: 10px;
}
.chat-input__attach {
  width: 40px; height: 40px; background: var(--primary-light); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: var(--primary); cursor: pointer; flex-shrink: 0;
}
.chat-input__attach:hover { background: var(--primary-muted); }
.chat-input__field {
  flex: 1; padding: 12px 18px; background: var(--bg); border: 1px solid var(--hairline);
  border-radius: 999px; font-size: 14px; font-family: inherit; color: var(--text-dark); outline: none;
}
.chat-input__field:focus { border-color: var(--primary); }
.chat-input__send {
  width: 44px; height: 44px; background: var(--gradient); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; border: none; flex-shrink: 0;
}
.chat-input__send:hover { box-shadow: 0 6px 16px rgba(20, 99, 68, 0.3); }
.online { font-size: 12px; color: var(--success); font-weight: 700; }
</style>
