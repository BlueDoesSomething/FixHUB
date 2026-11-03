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

        <div class="fx-table">
          <h4 class="fx-table__title">All Customers</h4>
          <p v-if="!users.length" class="fx-page__sub">No customer records available.</p>
          <div v-for="u in users" :key="u.id" class="fx-table__row">
            <div class="fx-table__avatar">{{ u.initials }}</div>
            <div class="fx-table__info">
              <p class="fx-table__name">{{ u.name }}</p>
              <p class="fx-table__sub">{{ u.email }}</p>
            </div>
            <span class="fx-pill" :class="u.active ? 'fx-pill--completed' : 'fx-pill--pending'">
              {{ u.active ? 'Active' : 'Suspended' }}
            </span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';

const users: { id: string; initials: string; name: string; email: string; active: boolean }[] = [];
</script>
