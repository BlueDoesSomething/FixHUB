<template>
  <p v-if="showSaveStatus" class="save-status" role="status">{{ saveLabel }}</p>
  <p v-if="state.error" class="storage-error" role="alert">{{ state.error }}</p>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRepairDraft } from '../../stores/repair';
defineProps<{ showSaveStatus?: boolean }>();
const { state } = useRepairDraft();
const saveLabel = computed(() => ({ idle: 'Draft not saved yet', saving: 'Saving draft…', saved: 'Draft saved on this device', error: 'Draft could not be saved' }[state.saveStatus]));
</script>
<style scoped>
.save-status { margin: 0 0 20px; color: var(--text-muted); font-size: 12px; }
.storage-error { padding: 12px 16px; background: #fef2f2; color: #b91c1c; border-radius: 10px; font-size: 13px; margin: 0 0 20px; }
</style>
