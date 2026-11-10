<template>
  <header ref="topbar" class="fx-topbar" @keydown.esc="closeMenu(true)">
    <div class="fx-topbar__left">
      <button
        ref="menuButton"
        class="fx-topbar__menu-toggle"
        type="button"
        :aria-label="menuOpen ? 'Close navigation menu' : 'Open navigation menu'"
        :aria-expanded="menuOpen"
        :aria-controls="`${role}-navigation-menu`"
        @click="menuOpen = !menuOpen"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path v-if="menuOpen" d="m6 6 12 12M6 18 18 6" /><path v-else d="M3 6h18M3 12h18M3 18h18" /></svg>
      </button>
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

    <nav v-if="menuOpen" :id="`${role}-navigation-menu`" class="fx-topbar__menu" :aria-label="`${roleLabel} navigation`">
      <p class="fx-topbar__menu-title">{{ roleLabel }} menu</p>
      <div class="fx-topbar__menu-links">
        <a
          v-for="item in menuItems"
          :key="item.id"
          :href="item.route"
          class="fx-topbar__menu-link"
          :aria-current="activeMenuItem?.id === item.id ? 'page' : undefined"
          @click.prevent="navigate(item.route)"
        >
          <span aria-hidden="true" v-html="item.icon" />
          <span>{{ item.label }}</span>
        </a>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import InitialAvatar from './InitialAvatar.vue';
import type { NavItem } from '../data/navigation';
import { useAuth } from '../stores/auth';
import { backDestination } from '../utils/backNavigation';

const props = defineProps<{ items: NavItem[]; role: string }>();
const route = useRoute();
const router = useRouter();
const { profile: getProfile } = useAuth();

const profile = computed(getProfile);
const query = ref('');
const topbar = ref<HTMLElement | null>(null);
const menuButton = ref<HTMLButtonElement | null>(null);
const menuOpen = ref(false);
const menuItems = computed(() => props.items.filter(item => !item.mobileOnly));
const activeMenuItem = computed(() => menuItems.value
  .filter(item => [item.route, ...(item.matchRoutes ?? [])].some(path => route.path === path || route.path.startsWith(`${path}/`)))
  .sort((a, b) => b.route.length - a.route.length)[0]);

function closeMenu(restoreFocus = false) {
  menuOpen.value = false;
  if (restoreFocus) menuButton.value?.focus();
}

function navigate(path: string) {
  closeMenu(true);
  router.push(path);
}

function outsideMenu(event: PointerEvent) {
  if (event.target instanceof Node && !topbar.value?.contains(event.target)) closeMenu();
}

function onResize() { closeMenu(); }
watch(() => route.path, () => closeMenu());
onMounted(() => {
  document.addEventListener('pointerdown', outsideMenu);
  document.addEventListener('focusin', onFocusIn);
  window.addEventListener('resize', onResize);
});
function onFocusIn(event: FocusEvent) {
  if (event.target instanceof Node && !topbar.value?.contains(event.target)) closeMenu();
}
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outsideMenu);
  document.removeEventListener('focusin', onFocusIn);
  window.removeEventListener('resize', onResize);
});

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
  void router.push(backDestination(route.path, props.role));
}

function goToProfile() {
  closeMenu();
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
.fx-topbar__menu-toggle { display: none; }
.fx-topbar__menu {
  position: absolute;
  top: calc(100% + 8px);
  left: max(12px, var(--ion-safe-area-left, 0px));
  right: max(12px, var(--ion-safe-area-right, 0px));
  max-height: calc(100dvh - 160px - var(--ion-safe-area-top, 0px) - var(--ion-safe-area-bottom, 0px));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px;
  border: 1px solid var(--hairline);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}
.fx-topbar__menu-title { margin: 0 0 10px; color: var(--text-muted); font-size: 12px; font-weight: 700; }
.fx-topbar__menu-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.fx-topbar__menu-link { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 10px; border-radius: 10px; color: var(--text-dark); text-decoration: none; font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.fx-topbar__menu-link > span:first-child { display: flex; flex-shrink: 0; color: var(--primary); }
.fx-topbar__menu-link:hover, .fx-topbar__menu-link[aria-current="page"] { background: var(--primary-light); color: var(--primary); }
.fx-topbar button:focus-visible, .fx-topbar__menu-link:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
@media (min-width: 1024px) { .fx-topbar__menu { display: none; } }
@media (max-width: 1023px) {
  .fx-topbar__menu-toggle { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; border: 1px solid var(--hairline); border-radius: 12px; background: var(--primary-light); color: var(--primary); cursor: pointer; }
  .fx-topbar__avatar { display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; }
}
@media (max-width: 359px) { .fx-topbar__menu-links { grid-template-columns: minmax(0, 1fr); } }
.fx-topbar__avatar {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  line-height: 0;
}
</style>
