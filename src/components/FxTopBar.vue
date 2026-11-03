<template>
  <header class="fx-topbar">
    <div class="fx-topbar__left">
      <button v-if="showBack" class="fx-topbar__back" aria-label="Go back" @click="goBack">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
      </button>
      <div class="fx-topbar__heading">
        <h1 class="fx-topbar__title">{{ title }}</h1>
        <p class="fx-topbar__crumb">{{ roleLabel }} workspace · FIXHUB</p>
      </div>
    </div>

    <div class="fx-topbar__right">
      <label class="fx-topbar__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input v-model="query" type="text" placeholder="Search FIXHUB…" />
      </label>
      <button class="fx-topbar__icon" aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
      </button>
      <button class="fx-topbar__avatar" aria-label="Profile" @click="goToProfile">
        <InitialAvatar :initials="profile.initials" :gradient="profile.color" :size="38" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import InitialAvatar from './InitialAvatar.vue';
import type { NavItem } from '../data/navigation';
import { useAuth } from '../stores/auth';

const props = defineProps<{ items: NavItem[]; role: string }>();
const route = useRoute();
const router = useRouter();
const { profile: getProfile } = useAuth();

const profile = computed(getProfile);
const query = ref('');

const roleLabel = computed(() => {
  const r = props.role;
  return r.charAt(0).toUpperCase() + r.slice(1);
});

const title = computed(() => {
  const meta = route.meta.title as string | undefined;
  if (meta) return meta;
  const match = props.items.find((i) => route.path === i.route);
  return match ? match.label : 'Dashboard';
});

const showBack = computed(() => !props.items.some((i) => route.path === i.route));

function goBack() {
  router.back();
}

function goToProfile() {
  let rolePath = '/client/profile';
  if (props.role === 'technician') {
    rolePath = '/technician/profile';
  } else if (props.role === 'admin') {
    rolePath = '/admin/profile';
  }
  router.push(rolePath);
}
</script>

<style scoped>
.fx-topbar__heading { min-width: 0; }
.fx-topbar__avatar {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  line-height: 0;
}
</style>
