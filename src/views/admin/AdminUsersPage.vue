<template>
  <ion-page>
    <ScreenHeader title="Manage Users" :show-back="false" />
    <ion-content>
      <div class="fx-page fx-page--wide">
        <div class="fx-page__head">
          <div>
            <h1 class="fx-page__title">Manage Users</h1>
            <p class="fx-page__sub">All registered customers on FIXHUB</p>
          </div>
          <span class="fx-pill fx-pill--accent">{{ users.length }} customers</span>
        </div>

        <div v-if="loading" class="fx-page__sub" role="status">Loading users…</div>

        <div v-if="error" class="fx-page__sub" role="alert">{{ error }}</div>

        <div class="fx-table">
          <h4 class="fx-table__title">All Customers</h4>
          <p v-if="!users.length && !loading && !error" class="fx-page__sub">No customer records available.</p>
          <div v-for="u in users" :key="u.user_id" class="fx-table__row">
            <div class="fx-table__avatar">{{ u.initials }}</div>
            <div class="fx-table__info">
              <p class="fx-table__name">{{ u.full_name }}</p>
              <p class="fx-table__sub">{{ u.city }}{{ u.phone ? ' · ' + u.phone : '' }}</p>
            </div>
            <span class="fx-pill" :class="u.role === 'technician' ? 'fx-pill--completed' : 'fx-pill--pending'">
              {{ u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Customer' }}
            </span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import { fetchUsers } from '../../services/technicianApplications';

interface AdminUser {
  user_id: string;
  initials: string;
  full_name: string;
  city: string;
  phone: string | null;
  role: string | null;
  created_at: string;
}

const users = ref<AdminUser[]>([]);
const loading = ref(false);
const error = ref('');

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const rows = await fetchUsers();
    users.value = rows.map((u) => ({
      user_id: u.user_id,
      initials: initialsOf(u.full_name),
      full_name: u.full_name,
      city: u.city,
      phone: u.phone,
      role: u.role,
      created_at: u.created_at,
    }));
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to load users.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
</style>
