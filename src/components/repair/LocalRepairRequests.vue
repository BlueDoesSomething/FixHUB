<template>
  <div class="fx-grid-2">
    <article v-for="request in requests" :key="request.id" class="fx-card saved-request" data-testid="saved-request">
      <div class="saved-request__head"><h3>{{ request.brand }} {{ request.model }}</h3><span class="fx-pill" :class="statusPillClass(request)">{{ request.synced ? request.status : 'Pending · local' }}</span></div>
      <p class="saved-request__ref">{{ request.reference }} · {{ request.device }}</p>
      <p class="saved-request__problem">{{ request.problem.length > 180 ? `${request.problem.slice(0, 180)}…` : request.problem }}</p>
      <p class="saved-request__meta">{{ serviceLabel(request.serviceType) }} · {{ request.photos.length }} photo(s) · {{ new Date(request.createdAt).toLocaleDateString() }}</p>
      <RouterLink class="fx-btn fx-btn-secondary fx-btn--sm" :to="{ name: 'client-request-details', params: { requestId: request.id } }">View Request</RouterLink>
    </article>
  </div>
</template>
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { serviceLabel, statusPillClass, type SubmittedRepairRequest } from '../../data/repair';
defineProps<{ requests: SubmittedRepairRequest[] }>();
</script>
<style scoped>
.saved-request { color: var(--text-dark); }
.saved-request__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: start; gap: 10px; }
.saved-request h3 { margin: 0; font-size: 17px; overflow-wrap: anywhere; }
.saved-request__ref, .saved-request__meta { color: var(--text-muted); font-size: 12px; line-height: 1.7; }
.saved-request__problem { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; line-height: 1.7; }
@media (max-width: 400px) { .fx-grid-2 { grid-template-columns: minmax(0, 1fr); } }
</style>
