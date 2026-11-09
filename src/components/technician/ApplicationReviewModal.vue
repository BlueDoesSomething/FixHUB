<template>
  <transition name="modal-fade">
    <div v-if="application" class="overlay" @click.self="emit('close')">
      <div class="panel">
        <header class="panel__head">
          <div class="panel__id">
            <div class="fx-table__avatar">{{ initialsOf(application.applicant.fullName) }}</div>
            <div>
              <h2 class="panel__name">{{ application.applicant.fullName }}</h2>
              <p class="panel__sub">{{ application.applicant.email }} · {{ application.id.toUpperCase() }}</p>
            </div>
          </div>
          <div class="panel__head-right">
            <span class="fx-pill" :class="meta.pill">{{ meta.label }}</span>
            <button class="panel__close" aria-label="Close" @click="emit('close')"><i data-lucide="x"></i></button>
          </div>
        </header>

        <div class="panel__body">
          <p class="panel__desc">{{ meta.description }}</p>

          <div class="fx-grid-2">
            <div class="fx-card fx-card--sm">
              <h3 class="fx-section-title">Personal Information</h3>
              <div class="fx-info-row"><span class="fx-info-label">Full Name</span><span class="fx-info-value">{{ application.applicant.fullName }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Email</span><span class="fx-info-value">{{ application.applicant.email }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Contact</span><span class="fx-info-value">{{ application.applicant.contactNumber }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">City</span><span class="fx-info-value">{{ application.applicant.city }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Submitted</span><span class="fx-info-value">{{ formatDate(application.createdAt) }}</span></div>
            </div>

            <div class="fx-card fx-card--sm">
              <h3 class="fx-section-title">Professional Information</h3>
              <div class="fx-info-row"><span class="fx-info-label">Experience</span><span class="fx-info-value">{{ application.professional.yearsExperience }} year(s)</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Brands</span><span class="fx-info-value">{{ brandsText }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Specializations</span><span class="fx-info-value">{{ application.professional.specializations.join(', ') }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Service Type</span><span class="fx-info-value">{{ application.service.serviceType }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Coverage</span><span class="fx-info-value">{{ application.service.coverageArea }}</span></div>
              <div class="fx-info-row"><span class="fx-info-label">Schedule</span><span class="fx-info-value">{{ scheduleText }}</span></div>
            </div>
          </div>

          <div class="fx-card fx-card--sm">
            <h3 class="fx-section-title">Experience Description</h3>
            <p class="panel__paragraph">{{ application.professional.experienceDescription }}</p>
          </div>

          <div class="fx-card fx-card--sm">
            <h3 class="fx-section-title">Supporting Documents</h3>
            <p v-if="allFiles.length === 0" class="panel__muted">No documents were uploaded.</p>
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
                  <span class="doclist__size">{{ formatBytes(f.size) }}</span>
                  <a class="doclist__link" :href="f.dataUrl" :download="f.name">Download</a>
                </li>
              </ul>
            </template>
          </div>

          <div class="fx-card fx-card--sm">
            <h3 class="fx-section-title">Review History</h3>
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

          <div v-if="isDecidable" class="fx-card fx-card--sm decision">
            <h3 class="fx-section-title">Decision &amp; Feedback</h3>
            <div class="fx-field">
              <label class="fx-label">Notes to applicant</label>
              <textarea
                v-model="note"
                class="fx-input decision__textarea"
                rows="3"
                placeholder="Required when requesting information or rejecting. Optional for approvals."
              ></textarea>
            </div>
            <p v-if="actionError" class="panel__err">{{ actionError }}</p>
            <p v-if="savedMsg" class="panel__saved"><i data-lucide="check" class="panel__saved-ico"></i> {{ savedMsg }}</p>
            <div class="decision__actions">
              <button v-if="showStartReview" class="fx-btn fx-btn-secondary" @click="act('start-review')">
                <i data-lucide="play" class="panel__btn-ico"></i> Start Review
              </button>
              <button class="fx-btn fx-btn-secondary" @click="act('request-info')">
                <i data-lucide="help-circle" class="panel__btn-ico"></i> Request Info
              </button>
              <button class="fx-btn fx-btn-primary" @click="act('approve')">
                <i data-lucide="check" class="panel__btn-ico"></i> Approve
              </button>
              <button class="fx-btn fx-btn-ghost decision__reject" @click="act('reject')">
                <i data-lucide="x" class="panel__btn-ico"></i> Reject
              </button>
            </div>
          </div>

          <div v-else class="fx-card fx-card--sm decision">
            <h3 class="fx-section-title">Final Decision</h3>
            <p class="panel__paragraph">
              <strong>{{ application.review.reviewer || 'Admin' }}</strong>
              {{ application.status === 'Approved' ? 'approved' : 'rejected' }} this application on
              {{ formatDate(application.review.reviewedAt) }}.
            </p>
            <p v-if="application.review.feedback" class="panel__paragraph">"{{ application.review.feedback }}"</p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  STATUS_META,
  formatBytes,
  formatDate,
  formatDateTime,
  initialsOf,
  type TechnicianApplication,
} from '../../data/technicianApplication';
import { useTechnicianApplications, type ReviewAction } from '../../stores/technicianApplications';
import { useAuth } from '../../stores/auth';
import {
  approveApplication,
  rejectApplication,
  requestApplicationInfo,
  startApplicationReview,
} from '../../services/technicianApplications';

const props = defineProps<{ application: TechnicianApplication | null }>();
const emit = defineEmits<{ close: [] }>();

const store = useTechnicianApplications();
const { profile } = useAuth();

const note = ref('');
const actionError = ref('');
const savedMsg = ref('');

watch(
  () => props.application?.id,
  () => {
    note.value = '';
    actionError.value = '';
    savedMsg.value = '';
    if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 30);
  },
);

const meta = computed(() => STATUS_META[props.application!.status]);
const orderedHistory = computed(() => [...(props.application?.history ?? [])].reverse());

const allFiles = computed(() => [
  ...(props.application?.documents.certificates ?? []),
  ...(props.application?.documents.workPhotos ?? []),
]);
const images = computed(() => allFiles.value.filter((f) => f.type.startsWith('image/')));
const files = computed(() => allFiles.value.filter((f) => !f.type.startsWith('image/')));

const brandsText = computed(() => {
  const p = props.application!.professional;
  const list = [...p.brands];
  if (p.brandsOther) list.push(p.brandsOther);
  return list.join(', ');
});

const scheduleText = computed(() => {
  const s = props.application!.service;
  return `${s.workingDays.join(', ')} · ${s.workingHours}`;
});

const isDecidable = computed(
  () => props.application!.status !== 'Approved' && props.application!.status !== 'Rejected',
);
const showStartReview = computed(
  () => props.application!.status === 'Pending' || props.application!.status === 'Needs Information',
);

async function act(action: ReviewAction) {
  actionError.value = '';
  savedMsg.value = '';
  if ((action === 'request-info' || action === 'reject') && note.value.trim().length < 5) {
    actionError.value = 'Please add a short note (at least 5 characters) for this action.';
    return;
  }
  const updated = store.review(props.application!.id, action, note.value.trim(), profile().name);
  if (updated) {
    savedMsg.value = `Status updated to "${updated.status}".`;
    note.value = '';
    // Persist the decision to Supabase so backend technician profiles/roles stay in sync.
    try {
      if (action === 'approve') {
        await approveApplication(props.application!.id);
      } else if (action === 'reject') {
        await rejectApplication(props.application!.id, note.value.trim());
      } else if (action === 'request-info') {
        await requestApplicationInfo(props.application!.id, note.value.trim());
      } else if (action === 'start-review') {
        await startApplicationReview(props.application!.id);
      }
    } catch {
      // Supabase row may not exist yet (application submitted locally only).
      // Local approval/rejection is still valid; Supabase sync can happen later.
    }
    if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 30);
  }
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; z-index: 110; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(8, 28, 18, 0.5); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.panel { width: 100%; max-width: 880px; max-height: 90vh; display: flex; flex-direction: column; background: var(--bg); border-radius: 20px; overflow: hidden; box-shadow: 0 30px 70px rgba(8, 28, 18, 0.35); }
.panel__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px; background: #fff; border-bottom: 1px solid var(--hairline); }
.panel__id { display: flex; align-items: center; gap: 14px; min-width: 0; }
.panel__name { font-size: 18px; font-weight: 800; color: var(--text-dark); margin: 0; }
.panel__sub { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
.panel__head-right { display: flex; align-items: center; gap: 12px; }
.panel__close { width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--hairline); background: #fff; color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.panel__close:hover { color: var(--primary); border-color: var(--primary); }
.panel__close :deep(svg) { width: 18px; height: 18px; }
.panel__body { padding: 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; }
.panel__desc { font-size: 14px; color: var(--text-muted); margin: 0; }
.panel__paragraph { font-size: 14px; color: var(--text-dark); margin: 0; line-height: 1.6; }
.panel__muted { font-size: 13px; color: var(--text-muted); margin: 0; }
.panel__err { color: #b91c1c; font-size: 12px; margin: 8px 0 0; }
.panel__saved { display: flex; align-items: center; gap: 6px; color: #15803d; font-size: 13px; font-weight: 700; margin: 10px 0 0; }
.panel__saved-ico { width: 15px; height: 15px; }
.panel__btn-ico { width: 15px; height: 15px; }

.thumbs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.thumbs__item { width: 64px; height: 64px; border-radius: 10px; overflow: hidden; border: 1px solid var(--hairline); }
.thumbs__item img { width: 100%; height: 100%; object-fit: cover; }
.doclist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.doclist__item { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.doclist__ico { width: 16px; height: 16px; color: var(--primary); flex-shrink: 0; }
.doclist__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-dark); }
.doclist__size { color: var(--text-muted); font-size: 12px; }
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

.decision__textarea { resize: vertical; min-height: 84px; font-family: inherit; }
.decision__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.decision__reject { color: #b91c1c; }
.decision__reject:hover { background: #fee2e2; color: #b91c1c; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .panel { max-height: 94vh; border-radius: 16px; }
  .panel__head { padding: 14px 16px; }
  .panel__body { padding: 16px; }
}
</style>
