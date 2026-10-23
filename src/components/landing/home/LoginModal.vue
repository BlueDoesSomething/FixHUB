<template>
  <transition name="modal-fade">
    <div v-if="open" class="login-overlay" @click.self="emit('close')">
      <button class="login-overlay__close" aria-label="Close" @click="emit('close')">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
      <AuthForm :redirect="redirect" />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import AuthForm from './AuthForm.vue';

const props = withDefaults(defineProps<{ open: boolean; redirect?: string }>(), {
  redirect: '/client/home',
});
const emit = defineEmits<{ close: [] }>();

const refreshIcons = () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

onMounted(refreshIcons);
watch(
  () => props.open,
  (v) => { if (v) setTimeout(refreshIcons, 50); },
);
</script>

<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(8, 28, 18, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.login-overlay__close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}
.login-overlay__close:hover { background: rgba(255, 255, 255, 0.28); }

/* Frosted glass panel, not solid white */
.login-overlay :deep(.glass-form) {
  background: rgba(232, 245, 238, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 24px 60px rgba(8, 28, 18, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
.login-overlay :deep(.glass-form input) {
  background: rgba(255, 255, 255, 0.5);
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .login-overlay { padding: 16px; }
  .login-overlay__close { top: 16px; right: 16px; }
  .login-overlay :deep(.glass-form) { padding: 22px; border-radius: 22px; }
}
</style>
