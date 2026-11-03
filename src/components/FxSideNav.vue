<template>
  <div class="fx-sidenav">
    <div class="fx-sidenav__header">
      <BrandLogo />
    </div>
    <div class="fx-sidenav__scroll">
      <div v-for="group in sections" :key="group.title" class="fx-sidenav__group">
        <div class="fx-sidenav__section">{{ group.title }}</div>
        <nav class="fx-sidenav__nav">
          <a
            v-for="item in group.items"
            :key="item.id"
            :href="item.route"
            class="fx-sidenav__item"
            :class="{ 'fx-sidenav__item--active': isActive(item.route) }"
            @click.prevent="navigate(item.route)"
          >
            <span class="fx-sidenav__icon" v-html="item.icon" />
            <span class="fx-sidenav__label">{{ item.label }}</span>
            <span v-if="item.fab" class="fx-sidenav__fab-indicator" />
          </a>
        </nav>
      </div>
    </div>
    <div class="fx-sidenav__footer">
      <div class="fx-sidenav__user" @click="goToProfile">
        <InitialAvatar :initials="profile.initials" :gradient="profile.color" :size="40" />
        <div class="fx-sidenav__user-info">
          <p class="fx-sidenav__user-name">{{ profile.name }}</p>
          <p class="fx-sidenav__user-role">{{ roleLabel }}</p>
        </div>
        <svg class="fx-sidenav__chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import BrandLogo from './BrandLogo.vue';
import InitialAvatar from './InitialAvatar.vue';
import type { NavItem } from '../data/navigation';
import { useAuth } from '../stores/auth';

const props = defineProps<{ items: NavItem[]; role: string }>();
const router = useRouter();
const route = useRoute();
const { profile: getProfile } = useAuth();

const profile = computed(getProfile);
const roleLabel = computed(() => {
  const r = props.role;
  return r.charAt(0).toUpperCase() + r.slice(1);
});

function isActive(path: string) {
  const matches = props.items.filter(
    (i) => route.path === i.route || route.path.startsWith(i.route + '/'),
  );
  if (!matches.length) return false;
  matches.sort((a, b) => b.route.length - a.route.length);
  return matches[0].route === path;
}

const sections = computed(() => {
  const groups: { title: string; items: NavItem[] }[] = [];
  for (const item of props.items) {
    const title = item.section || 'Menu';
    let group = groups.find((g) => g.title === title);
    if (!group) {
      group = { title, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
});

function navigate(path: string) {
  router.push(path);
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
.fx-sidenav {
  display: none;
  flex-direction: column;
  width: 268px;
  height: 100%;
  background: #fff;
  border-right: 1px solid var(--hairline);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

@media (min-width: 1024px) {
  .fx-sidenav { display: flex; }
}

.fx-sidenav__header {
  padding: 22px 20px 18px;
  border-bottom: 1px solid var(--hairline);
}

.fx-sidenav__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 16px;
}

.fx-sidenav__section {
  padding: 18px 24px 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.fx-sidenav__group:first-child .fx-sidenav__section { padding-top: 12px; }

.fx-sidenav__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 14px;
}

.fx-sidenav__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-muted);
  transition: all 0.18s ease;
  position: relative;
}

.fx-sidenav__item:hover {
  background: var(--primary-light);
  color: var(--primary);
}

.fx-sidenav__item--active {
  background: var(--gradient);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(20, 99, 68, 0.22);
}

.fx-sidenav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(20, 99, 68, 0.08);
  color: currentColor;
  flex-shrink: 0;
}

.fx-sidenav__item--active .fx-sidenav__icon {
  background: rgba(255, 255, 255, 0.2);
}

.fx-sidenav__label { font-size: 14px; font-weight: 600; }

.fx-sidenav__fab-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  margin-left: auto;
}

.fx-sidenav__item--active .fx-sidenav__fab-indicator { background: #fff; }

.fx-sidenav__footer {
  padding: 14px;
  border-top: 1px solid var(--hairline);
}

.fx-sidenav__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.18s ease;
  background: var(--bg);
}

.fx-sidenav__user:hover { background: var(--primary-light); }

.fx-sidenav__user-info { flex: 1; min-width: 0; }

.fx-sidenav__user-name {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fx-sidenav__user-role { margin: 0; font-size: 11px; color: var(--text-muted); }

.fx-sidenav__chev { color: var(--text-muted); flex-shrink: 0; }
</style>
