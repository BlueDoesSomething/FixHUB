<template>
  <div class="status">
    <section class="status__banner" :class="bannerClass">
      <div class="status__banner-ico"><i :data-lucide="meta.icon"></i></div>
      <div class="status__banner-text">
        <p class="status__eyebrow">Application Status</p>
        <h2 class="status__title">{{ meta.label }}</h2>
        <p class="status__desc">{{ meta.description }}</p>
      </div>
      <span class="fx-pill" :class="meta.pill">{{ meta.label }}</span>
    </section>

    <div class="fx-grid-2">
      <div class="fx-card">
        <h3 class="fx-section-title">Application Summary</h3>
        <div class="fx-info-row"><span class="fx-info-label">Applicant</span><span class="fx-info-value">{{ app.applicant.fullName }}</span></div>
        <div class="fx-info-row"><span class="fx-info-label">Email</span><span class="fx-info-value">{{ app.applicant.email }}</span></div>
        <div class="fx-info-row"><span class="fx-info-label">Contact</span><span class="fx-info-value">{{ app.applicant.contactNumber }}</span></div>
        <div class="fx-info-row"><span class="fx-info-label">City</span><span class="fx-info-value">{{ app.applicant.city }}</span></div>
        <div class="fx-info-row"><span class="fx-info-label">Experience</span><span class="fx-info-value">{{ app.professional.yearsExperience }} year(s)</span></div>
        <div class="fx-info-row"><span class="fx-info-label">Service Type</span><span class="fx-info-value">{{ app.service.serviceType }}</span></div>
        <div class="fx-info-row"><span class="fx-info-label">Coverage</span><span class="fx-info-value">{{ app.service.coverageArea }}</span></div>
        <div class="fx-info-row"><span class="fx-info-label">Working Days</span><span class="fx-info-value">{{ app.service.workingDays.join(', ') }}</span></div>
        <div class="fx-info-row"><span class="fx-info-label">Working Hours</span><span class="fx-info-value">{{ app.service.workingHours }}</span></div>
        <div class="fx-info-row"><span class="fx-info-label">Reference</span><span class="fx-info-value">{{ app.id.toUpperCase() }}</span></div>
        <div class="fx-info-row"><span class="fx-info-label">Submitted</span><span class="fx-info-value">{{ formatDate(app.createdAt) }}</span></div>
        <div class="fx-info-row"><span class="fx-info-label">Last Updated</span><span class="fx-info-value">{{ formatDate(app.updatedAt) }}</span></div>
      </div>

      <div class="status__aside">
        <div v-if="app.review.feedback" class="fx-card status__feedback">
          <h3 class="fx-section-title">Reviewer Feedback</h3>
          <p class="status__feedback-from">
            <i data-lucide="user-check" class="status__inline-ico"></i>
            {{ app.review.reviewer || 'FIXHUB Reviewer' }} · {{ formatDate(app.review.reviewedAt) }}
          </p>
          <p class="status__feedback-text">{{ app.review.feedback }}</p>
        </div>

        <div class="fx-card">
          <h3 class="fx-section-title">Documents</h3>
          <p v-if="totalFiles === 0" class="status__muted">No documents uploaded yet.</p>
          <template v-else>
            <div v-if="images.length" class="thumbs">
              <a v-for="(f, i) in images" :key="'img' + i" class="thumbs__item" :href="f.dataUrl" :download="f.name">
                <img :src="f.dataUrl" :alt="f.name" />
              </a>
            </div>
            <ul class="doclist">
              <li v-for="(f, i) in files" :key="'doc' + i" class="doclist__item">
                <i data-lucide="file-text" class="doclist__ico"></i>
                <span class="doclist__name">{{ f.name }}</span>
                <a class="doclist__link" :href="f.dataUrl" :download="f.name">Download</a>
              </li>
            </ul>
          </template>
        </div>

        <div v-if="showActions" class="status__actions">
          <button v-if="app.status === 'Needs Information'" class="fx-btn fx-btn-primary fx-btn--block" @click="emit('edit')">
            <i data-lucide="edit-3" class="status__inline-ico"></i> Update &amp; Resubmit
          </button>
          <button v-else-if="app.status === 'Rejected' && app.review.allowReapply" class="fx-btn fx-btn-secondary fx-btn--block" @click="emit('reapply')">
            <i data-lucide="refresh-cw" class="status__inline-ico"></i> Reapply
          </button>
          <button v-else-if="app.status === 'Approved'" class="fx-btn fx-btn-primary fx-btn--block" @click="openDashboard">
            <i data-lucide="layout-dashboard" class="status__inline-ico"></i> Open Technician Dashboard
          </button>
        </div>
      </div>
    </div>

    <div class="fx-card">
      <h3 class="fx-section-title">Review Timeline</h3>
      <ul class="timeline">
        <li v-for="(event, i) in orderedHistory" :key="i" class="timeline__item">
          <span class="timeline__dot" :class="STATUS_META[event.status].pill"></span>
          <div class="timeline__body">
            <p class="timeline__top">
              <span class="timeline__status">{{ event.status }}</span>
              <span class="timeline__date">{{ formatDateTime(event.at) }}</span>
            </p>
            <p class="timeline__by">by {{ event.by }}</p>
            <p v-if="event.note" class="timeline__note">{{ event.note }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  STATUS_META,
  formatDate,
  formatDateTime,
  type TechnicianApplication,
  type UploadedFile,
} from '../../data/technicianApplication';
import { useAuth } from '../../stores/auth';

const props = defineProps<{ application: TechnicianApplication }>();
const emit = defineEmits<{ edit: []; reapply: [] }>();

const router = useRouter();
const { refreshSession } = useAuth();

const app = computed(() => props.application);
const meta = computed(() => STATUS_META[props.application.status]);

const bannerClass = computed(() => `status__banner--${props.application.status.toLowerCase().replace(/\s+/g, '-')}`);

const orderedHistory = computed(() => [...props.application.history].reverse());

const allFiles = computed<UploadedFile[]>(() => [
  ...props.application.documents.certificates,
  ...props.application.documents.workPhotos,
]);
const images = computed(() => allFiles.value.filter((f) => f.type.startsWith('image/')));
const files = computed(() => allFiles.value.filter((f) => !f.type.startsWith('image/')));
const totalFiles = computed(() => allFiles.value.length);

const showActions = computed(
  () =>
    props.application.status === 'Needs Information' ||
    props.application.status === 'Approved' ||
    (props.application.status === 'Rejected' && !!props.application.review.allowReapply),
);

async function openDashboard() {
  const session = await refreshSession();
  // An approved application means the user is a technician; route to the
  // technician dashboard regardless of the cached session role, which may not
  // have been refreshed after the admin approval yet.
  if (props.application.status === 'Approved') {
    router.push('/technician/dashboard');
  } else if (session?.account.role === 'technician' || session?.account.role === 'admin') {
    router.push('/technician/dashboard');
  }
}
</script>

<style scoped>
.status { display: flex; flex-direction: column; gap: 20px; }
.status__banner { display: flex; align-items: center; gap: 18px; border-radius: 18px; padding: 22px; border: 1px solid var(--hairline); background: #fff; }
.status__banner-ico { width: 54px; height: 54px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.status__banner-ico :deep(svg) { width: 26px; height: 26px; }
.status__banner-text { flex: 1; min-width: 0; }
.status__eyebrow { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin: 0; }
.status__title { font-size: 22px; font-weight: 800; margin: 2px 0; color: var(--text-dark); }
.status__desc { font-size: 13px; color: var(--text-muted); margin: 0; }

.status__banner--pending { background: #fffbeb; border-color: #fde68a; }
.status__banner--pending .status__banner-ico { background: #fef3c7; color: #b45309; }
.status__banner--under-review { background: #f8fafc; border-color: #e2e8f0; }
.status__banner--under-review .status__banner-ico { background: #e2e8f0; color: #475569; }
.status__banner--needs-information { background: rgba(247, 157, 31, 0.08); border-color: rgba(247, 157, 31, 0.35); }
.status__banner--needs-information .status__banner-ico { background: rgba(247, 157, 31, 0.18); color: #b45309; }
.status__banner--approved { background: #f0fdf4; border-color: #bbf7d0; }
.status__banner--approved .status__banner-ico { background: #dcfce7; color: #15803d; }
.status__banner--rejected { background: #fef2f2; border-color: #fecaca; }
.status__banner--rejected .status__banner-ico { background: #fee2e2; color: #b91c1c; }

.status__aside { display: flex; flex-direction: column; gap: 20px; }
.status__feedback-text { font-size: 14px; color: var(--text-dark); margin: 4px 0 0; white-space: pre-wrap; }
.status__feedback-from { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); margin: 0 0 8px; }
.status__inline-ico { width: 15px; height: 15px; }
.status__muted { font-size: 13px; color: var(--text-muted); margin: 0; }
.status__actions { display: flex; flex-direction: column; gap: 10px; }

.thumbs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.thumbs__item { width: 64px; height: 64px; border-radius: 10px; overflow: hidden; border: 1px solid var(--hairline); }
.thumbs__item img { width: 100%; height: 100%; object-fit: cover; }
.doclist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.doclist__item { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.doclist__ico { width: 16px; height: 16px; color: var(--primary); flex-shrink: 0; }
.doclist__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-dark); }
.doclist__link { color: var(--primary); font-weight: 700; }

.timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.timeline__item { display: flex; gap: 12px; }
.timeline__dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.timeline__body { flex: 1; min-width: 0; }
.timeline__top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0; }
.timeline__status { font-size: 14px; font-weight: 700; color: var(--text-dark); }
.timeline__date { font-size: 12px; color: var(--text-muted); }
.timeline__by { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
.timeline__note { font-size: 13px; color: var(--text-dark); margin: 6px 0 0; }
</style>
