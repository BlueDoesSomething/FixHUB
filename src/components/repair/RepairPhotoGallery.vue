<template>
  <ul v-if="photos.length" class="photo-grid" aria-label="Attached repair photos">
    <li v-for="photo in photos" :key="photo.id" class="photo">
      <img v-if="urls[photo.id]" :src="urls[photo.id]" :alt="photo.name" loading="lazy" />
      <div class="photo__details">
        <strong>{{ photo.name }}</strong>
        <span>{{ (photo.size / 1024 / 1024).toFixed(2) }} MB</span>
        <button v-if="removable" type="button" :disabled="disabled" :aria-label="`Remove ${photo.name}`" @click="emit('remove', photo.id)">Remove</button>
      </div>
    </li>
  </ul>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import type { RepairPhoto } from '../../data/repair';
const props = defineProps<{ photos: RepairPhoto[]; removable?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ remove: [id: string] }>();
const urls = ref<Record<string, string>>({});
watch(() => props.photos, photos => {
  for (const id of Object.keys(urls.value)) {
    if (!photos.some(photo => photo.id === id)) { URL.revokeObjectURL(urls.value[id]); delete urls.value[id]; }
  }
  for (const photo of photos) {
    if (!urls.value[photo.id] && typeof URL.createObjectURL === 'function') urls.value[photo.id] = URL.createObjectURL(photo.blob);
  }
}, { deep: true, immediate: true });
onBeforeUnmount(() => Object.values(urls.value).forEach(url => URL.revokeObjectURL(url)));
</script>
<style scoped>
.photo-grid { padding: 0; margin: 16px 0 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.photo { border: 1px solid var(--hairline); border-radius: 12px; overflow: hidden; min-width: 0; color: var(--text-dark); }
.photo img { width: 100%; height: 130px; object-fit: cover; background: var(--bg); display: block; }
.photo__details { display: flex; flex-direction: column; gap: 5px; padding: 10px; font-size: 12px; }
.photo strong { overflow-wrap: anywhere; }
.photo span { color: var(--text-muted); }
.photo button { padding: 6px; color: #b91c1c; border: 1px solid #fecaca; background: #fff; border-radius: 6px; cursor: pointer; }
.photo button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
