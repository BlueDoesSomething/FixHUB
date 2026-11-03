<template>
  <div>
    <div class="photo-upload" :class="{ dragging }" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="drop">
      <label for="repair-photos" class="fx-label">Photos of the problem (optional)</label>
      <p>Up to {{ MAX_REPAIR_PHOTOS }} JPG, PNG, or WebP photos, 5 MB each. Videos and HEIC are not supported yet.</p>
      <input id="repair-photos" ref="input" type="file" accept="image/jpeg,image/png,image/webp" multiple :disabled="busy || disabled || modelValue.length >= MAX_REPAIR_PHOTOS" @change="choose" />
      <p>Choose files or drag them here. Avoid including passwords, IDs, or other private information.</p>
    </div>
    <p class="photo-count" role="status">{{ busy ? 'Checking photos…' : `${modelValue.length} of ${MAX_REPAIR_PHOTOS} photos attached` }}</p>
    <ul v-if="errors.length" class="photo-errors" role="alert"><li v-for="error in errors" :key="error">{{ error }}</li></ul>
    <RepairPhotoGallery :photos="modelValue" removable :disabled="busy || disabled" @remove="remove" />
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { MAX_REPAIR_PHOTOS, type RepairPhoto } from '../../data/repair';
import { prepareRepairPhoto } from '../../services/repairPhotos';
import RepairPhotoGallery from './RepairPhotoGallery.vue';

const props = defineProps<{ modelValue: RepairPhoto[]; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [photos: RepairPhoto[]]; busy: [value: boolean] }>();
const input = ref<HTMLInputElement | null>(null);
const busy = ref(false);
const dragging = ref(false);
const errors = ref<string[]>([]);
let generation = 0;

async function add(files: File[]) {
  if (busy.value || props.disabled) return;
  const current = ++generation;
  busy.value = true;
  emit('busy', true);
  errors.value = [];
  const photos = [...props.modelValue];
  for (const file of files) {
    if (photos.length >= MAX_REPAIR_PHOTOS) { errors.value.push('Only 3 photos can be attached. Remove one before adding another.'); break; }
    try {
      const photo = await prepareRepairPhoto(file);
      if (current !== generation) return;
      photos.push(photo);
    } catch (error) {
      if (current !== generation) return;
      errors.value.push(`${file.name}: ${error instanceof Error ? error.message : 'Unable to read this photo.'}`);
    }
  }
  if (current !== generation) return;
  emit('update:modelValue', photos);
  busy.value = false;
  emit('busy', false);
  if (input.value) input.value.value = '';
}

function choose(event: Event) { void add(Array.from((event.target as HTMLInputElement).files ?? [])); }
function drop(event: DragEvent) { dragging.value = false; void add(Array.from(event.dataTransfer?.files ?? [])); }
function remove(id: string) { errors.value = []; emit('update:modelValue', props.modelValue.filter(photo => photo.id !== id)); }
onBeforeUnmount(() => { generation += 1; emit('busy', false); });
</script>
<style scoped>
.photo-upload { padding: 18px; border: 1.5px dashed rgba(20, 99, 68, 0.3); border-radius: 12px; background: var(--bg); color: var(--text-dark); }
.photo-upload.dragging { background: var(--primary-light); border-color: var(--primary); }
.photo-upload p, .photo-count { font-size: 12px; line-height: 1.6; color: var(--text-muted); margin: 8px 0; }
.photo-upload input { display: block; width: 100%; margin: 12px 0; font: inherit; font-size: 13px; }
.photo-errors { color: #b91c1c; font-size: 13px; padding-left: 20px; }
</style>
