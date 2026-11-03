<template>
  <div class="app-form">
    <ol class="wizard">
      <li
        v-for="(s, i) in FORM_STEPS"
        :key="s.key"
        :class="['wizard__step', i === step ? 'is-active' : '', i < step ? 'is-done' : '']"
      >
        <span class="wizard__dot">
          <i v-if="i < step" data-lucide="check" class="wizard__ico"></i>
          <span v-else>{{ i + 1 }}</span>
        </span>
        <span class="wizard__label">{{ s.title }}</span>
      </li>
    </ol>

    <div class="fx-card app-form__panel">
      <h3 class="fx-section-title fx-section-title--lg">{{ FORM_STEPS[step].title }} Information</h3>
      <p class="app-form__hint">All fields are required unless stated otherwise.</p>

      <div v-if="step === 0" class="app-form__grid">
        <div class="fx-field app-form__col">
          <label class="fx-label">Full Name</label>
          <input v-model="form.fullName" class="fx-input" type="text" placeholder="Your full name" @input="clearErr('fullName')" />
          <p v-if="errors.fullName" class="err">{{ errors.fullName }}</p>
        </div>
        <div class="fx-field app-form__col">
          <label class="fx-label">Email Address</label>
          <input v-model="form.email" class="fx-input" type="email" placeholder="Your email address" @input="clearErr('email')" />
          <p v-if="errors.email" class="err">{{ errors.email }}</p>
        </div>
        <div class="fx-field app-form__col">
          <label class="fx-label">Contact Number</label>
          <input v-model="form.contactNumber" class="fx-input" type="tel" placeholder="+63 917 000 0000" @input="clearErr('contactNumber')" />
          <p v-if="errors.contactNumber" class="err">{{ errors.contactNumber }}</p>
        </div>
        <div class="fx-field app-form__col">
          <label class="fx-label">City / Municipality</label>
          <input v-model="form.city" class="fx-input" type="text" placeholder="Quezon City" @input="clearErr('city')" />
          <p v-if="errors.city" class="err">{{ errors.city }}</p>
        </div>
      </div>

      <div v-else-if="step === 1" class="app-form__stack">
        <div class="fx-field">
          <label class="fx-label">Years of Experience</label>
          <input v-model="form.yearsExperience" class="fx-input" type="number" min="0" placeholder="e.g. 4" @input="clearErr('yearsExperience')" />
          <p v-if="errors.yearsExperience" class="err">{{ errors.yearsExperience }}</p>
        </div>
        <div class="fx-field">
          <label class="fx-label">Brands You Repair</label>
          <div class="chips">
            <button
              v-for="b in BRANDS"
              :key="b"
              type="button"
              class="chip"
              :class="{ 'chip--on': form.brands.includes(b) }"
              @click="toggle('brands', b)"
            >{{ b }}</button>
          </div>
          <input v-if="form.brands.includes('Others')" v-model="form.brandsOther" class="fx-input app-form__sub" type="text" placeholder="List other brands, comma separated" />
          <p v-if="errors.brands" class="err">{{ errors.brands }}</p>
        </div>
        <div class="fx-field">
          <label class="fx-label">Specializations</label>
          <div class="chips">
            <button
              v-for="s in SPECIALIZATIONS"
              :key="s"
              type="button"
              class="chip"
              :class="{ 'chip--on': form.specializations.includes(s) }"
              @click="toggle('specializations', s)"
            >{{ s }}</button>
          </div>
          <input v-if="form.specializations.includes('Other Repairs')" v-model="form.specializationsOther" class="fx-input app-form__sub" type="text" placeholder="Describe other specializations" />
          <p v-if="errors.specializations" class="err">{{ errors.specializations }}</p>
        </div>
        <div class="fx-field">
          <label class="fx-label">Experience Description</label>
          <textarea v-model="form.experienceDescription" class="fx-input app-form__textarea" rows="4" placeholder="Tell us about your repair background, training, and typical jobs (minimum 20 characters)." @input="clearErr('experienceDescription')"></textarea>
          <p v-if="errors.experienceDescription" class="err">{{ errors.experienceDescription }}</p>
        </div>
      </div>

      <div v-else-if="step === 2" class="app-form__stack">
        <div class="fx-field">
          <label class="fx-label">Service Type</label>
          <select v-model="form.serviceType" class="fx-input" @change="clearErr('serviceType')">
            <option value="" disabled>Select a service type</option>
            <option v-for="t in SERVICE_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
          <p v-if="errors.serviceType" class="err">{{ errors.serviceType }}</p>
        </div>
        <div class="fx-field">
          <label class="fx-label">Coverage Area</label>
          <input v-model="form.coverageArea" class="fx-input" type="text" placeholder="e.g. Makati, Taguig, Pasay" @input="clearErr('coverageArea')" />
          <p v-if="errors.coverageArea" class="err">{{ errors.coverageArea }}</p>
        </div>
        <div class="fx-field">
          <label class="fx-label">Working Days</label>
          <div class="chips">
            <button
              v-for="d in WORKING_DAYS"
              :key="d"
              type="button"
              class="chip chip--day"
              :class="{ 'chip--on': form.workingDays.includes(d) }"
              @click="toggle('workingDays', d)"
            >{{ d }}</button>
          </div>
          <p v-if="errors.workingDays" class="err">{{ errors.workingDays }}</p>
        </div>
        <div class="fx-field">
          <label class="fx-label">Working Hours</label>
          <input v-model="form.workingHours" class="fx-input" type="text" placeholder="e.g. 9:00 AM - 6:00 PM" @input="clearErr('workingHours')" />
          <p v-if="errors.workingHours" class="err">{{ errors.workingHours }}</p>
        </div>
      </div>

      <div v-else-if="step === 3" class="app-form__stack">
        <p class="app-form__hint">Upload your service certificates, valid ID, or photos of previous work. Accepted formats: {{ ACCEPTED_FILE_EXT }} (max 5MB each).</p>
        <div class="fx-field">
          <label class="fx-label">Certificates &amp; Valid ID</label>
          <label class="upload">
            <i data-lucide="upload-cloud" class="upload__ico"></i>
            <span>Choose files to upload</span>
            <input type="file" multiple :accept="ACCEPTED_FILE_EXT" class="upload__input" @change="onFiles($event, 'certificates')" />
          </label>
          <ul v-if="form.certificates.length" class="files">
            <li v-for="(f, i) in form.certificates" :key="f.name + i" class="files__item">
              <span class="files__name">{{ f.name }}</span>
              <span class="files__size">{{ formatBytes(f.size) }}</span>
              <button type="button" class="files__remove" @click="removeFile('certificates', i)">Remove</button>
            </li>
          </ul>
        </div>
        <div class="fx-field">
          <label class="fx-label">Work Photos</label>
          <label class="upload">
            <i data-lucide="image" class="upload__ico"></i>
            <span>Choose photos to upload</span>
            <input type="file" multiple :accept="ACCEPTED_FILE_EXT" class="upload__input" @change="onFiles($event, 'workPhotos')" />
          </label>
          <ul v-if="form.workPhotos.length" class="files">
            <li v-for="(f, i) in form.workPhotos" :key="f.name + i" class="files__item">
              <span class="files__name">{{ f.name }}</span>
              <span class="files__size">{{ formatBytes(f.size) }}</span>
              <button type="button" class="files__remove" @click="removeFile('workPhotos', i)">Remove</button>
            </li>
          </ul>
        </div>
        <p v-if="fileError" class="err">{{ fileError }}</p>
        <p v-if="errors.documents" class="err">{{ errors.documents }}</p>
      </div>

      <div v-else class="app-form__stack">
        <div class="review-grid">
          <div class="fx-card fx-card--sm">
            <p class="review__label">Applicant</p>
            <p class="review__value">{{ form.fullName }}</p>
            <p class="review__sub">{{ form.email }} · {{ form.contactNumber }}</p>
            <p class="review__sub">{{ form.city }}</p>
          </div>
          <div class="fx-card fx-card--sm">
            <p class="review__label">Experience</p>
            <p class="review__value">{{ form.yearsExperience }} year(s)</p>
            <p class="review__sub">{{ form.brands.join(', ') || '—' }}</p>
          </div>
          <div class="fx-card fx-card--sm">
            <p class="review__label">Specializations</p>
            <p class="review__value">{{ form.specializations.length }} selected</p>
            <p class="review__sub">{{ form.specializations.join(', ') || '—' }}</p>
          </div>
          <div class="fx-card fx-card--sm">
            <p class="review__label">Service</p>
            <p class="review__value">{{ form.serviceType || '—' }}</p>
            <p class="review__sub">{{ form.coverageArea }} · {{ form.workingDays.join(', ') }}</p>
          </div>
          <div class="fx-card fx-card--sm">
            <p class="review__label">Documents</p>
            <p class="review__value">{{ totalFiles }} file(s)</p>
            <p class="review__sub">{{ form.certificates.length }} certificate(s) · {{ form.workPhotos.length }} photo(s)</p>
          </div>
        </div>

        <label class="agree">
          <input v-model="form.agreed" type="checkbox" @change="clearErr('agreed')" />
          <span>I confirm the information provided is accurate and I agree to FIXHUB's technician terms and verification process.</span>
        </label>
        <p v-if="errors.agreed" class="err">{{ errors.agreed }}</p>
      </div>

      <div class="app-form__nav">
        <button v-if="step > 0" type="button" class="fx-btn fx-btn-secondary" @click="prev">
          <i data-lucide="arrow-left" class="btn-ico"></i> Back
        </button>
        <span class="app-form__spacer"></span>
        <button v-if="step < FORM_STEPS.length - 1" type="button" class="fx-btn fx-btn-primary" @click="next">
          Continue <i data-lucide="arrow-right" class="btn-ico"></i>
        </button>
        <button v-else type="button" class="fx-btn fx-btn-primary" @click="requestSubmit">
          Submit Application <i data-lucide="send" class="btn-ico"></i>
        </button>
      </div>
    </div>

    <transition name="overlay-fade">
      <div v-if="showConfirm" class="overlay" @click.self="showConfirm = false">
        <div class="confirm fx-card">
          <div class="confirm__ico"><i data-lucide="clipboard-check"></i></div>
          <h3 class="confirm__title">{{ props.existing ? 'Resubmit application?' : 'Submit application?' }}</h3>
          <p class="confirm__text">
            Once submitted, our team will review your credentials. You can track the status from this page.
          </p>
          <div class="confirm__actions">
            <button type="button" class="fx-btn fx-btn-secondary" @click="showConfirm = false">Cancel</button>
            <button type="button" class="fx-btn fx-btn-primary" @click="confirmSubmit">Confirm &amp; Submit</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="overlay-fade">
      <div v-if="submitting" class="overlay">
        <div class="confirm fx-card">
          <div class="spinner"></div>
          <p class="confirm__text">Submitting your application…</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import {
  ACCEPTED_FILE_EXT,
  ACCEPTED_FILE_TYPES,
  BRANDS,
  FORM_STEPS,
  MAX_FILES,
  MAX_FILE_BYTES,
  SERVICE_TYPES,
  SPECIALIZATIONS,
  WORKING_DAYS,
  emptyApplicationForm,
  formatBytes,
  type ApplicationFormState,
  type TechnicianApplication,
  type TechnicianApplicationPayload,
  type UploadedFile,
} from '../../data/technicianApplication';
import { useTechnicianApplications } from '../../stores/technicianApplications';

const props = defineProps<{
  existing?: TechnicianApplication | null;
  profileName?: string;
  profileEmail?: string;
  profilePhone?: string;
}>();

const emit = defineEmits<{
  submitted: [id: string];
  cancel: [];
}>();

const store = useTechnicianApplications();
const step = ref(0);
const errors = reactive<Record<string, string>>({});
const fileError = ref('');
const showConfirm = ref(false);
const submitting = ref(false);

const form = reactive<ApplicationFormState>(emptyApplicationForm());

function hydrate() {
  Object.assign(form, emptyApplicationForm());
  if (props.existing) {
    form.fullName = props.existing.applicant.fullName;
    form.email = props.existing.applicant.email;
    form.contactNumber = props.existing.applicant.contactNumber;
    form.city = props.existing.applicant.city;
    form.yearsExperience = props.existing.professional.yearsExperience;
    form.brands = [...props.existing.professional.brands];
    form.brandsOther = props.existing.professional.brandsOther ?? '';
    form.specializations = [...props.existing.professional.specializations];
    form.specializationsOther = props.existing.professional.specializationsOther ?? '';
    form.experienceDescription = props.existing.professional.experienceDescription;
    form.serviceType = props.existing.service.serviceType;
    form.coverageArea = props.existing.service.coverageArea;
    form.workingDays = [...props.existing.service.workingDays];
    form.workingHours = props.existing.service.workingHours;
    form.certificates = [...props.existing.documents.certificates];
    form.workPhotos = [...props.existing.documents.workPhotos];
  } else {
    form.fullName = props.profileName ?? '';
    form.email = props.profileEmail ?? '';
    form.contactNumber = props.profilePhone ?? '';
  }
}

const totalFiles = computed(() => form.certificates.length + form.workPhotos.length);

function clearErr(key: string) {
  if (errors[key]) delete errors[key];
}

function toggle(key: 'brands' | 'specializations' | 'workingDays', value: string) {
  const list = form[key];
  const idx = list.indexOf(value);
  if (idx === -1) list.push(value);
  else list.splice(idx, 1);
  clearErr(key);
}

function readFile(file: File): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, type: file.type, size: file.size, dataUrl: String(reader.result) });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function onFiles(event: Event, key: 'certificates' | 'workPhotos') {
  fileError.value = '';
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  for (const file of files) {
    if (form[key].length >= MAX_FILES) {
      fileError.value = `You can upload up to ${MAX_FILES} files per section.`;
      break;
    }
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      fileError.value = `"${file.name}" is not supported. Allowed: ${ACCEPTED_FILE_EXT}.`;
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      fileError.value = `"${file.name}" is larger than 5MB.`;
      continue;
    }
    try {
      form[key].push(await readFile(file));
    } catch {
      fileError.value = `Could not read "${file.name}".`;
    }
  }
  input.value = '';
  clearErr('documents');
}

function removeFile(key: 'certificates' | 'workPhotos', index: number) {
  form[key].splice(index, 1);
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^[+()\d\s-]{7,}$/;

function validateStep(index: number): boolean {
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (index === 0) {
    if (form.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.';
    if (!emailRe.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (!phoneRe.test(form.contactNumber.trim())) errors.contactNumber = 'Enter a valid contact number.';
    if (form.city.trim().length < 2) errors.city = 'Please enter your city or municipality.';
  } else if (index === 1) {
    const yrs = Number(form.yearsExperience);
    if (form.yearsExperience === '' || Number.isNaN(yrs) || yrs < 0) errors.yearsExperience = 'Enter your years of experience.';
    if (form.brands.length === 0) errors.brands = 'Select at least one brand.';
    if (form.brands.includes('Others') && form.brandsOther.trim().length < 2) errors.brands = 'Please list the other brands.';
    if (form.specializations.length === 0) errors.specializations = 'Select at least one specialization.';
    if (form.specializations.includes('Other Repairs') && form.specializationsOther.trim().length < 2) errors.specializations = 'Please describe your other specializations.';
    if (form.experienceDescription.trim().length < 20) errors.experienceDescription = 'Please write at least 20 characters.';
  } else if (index === 2) {
    if (!form.serviceType) errors.serviceType = 'Select a service type.';
    if (form.coverageArea.trim().length < 2) errors.coverageArea = 'Enter your coverage area.';
    if (form.workingDays.length === 0) errors.workingDays = 'Select at least one working day.';
    if (form.workingHours.trim().length < 3) errors.workingHours = 'Enter your working hours.';
  } else if (index === 3) {
    if (totalFiles.value === 0) errors.documents = 'Upload at least one certificate, ID, or work photo.';
  } else if (index === 4) {
    if (!form.agreed) errors.agreed = 'Please confirm the information is accurate.';
  }
  return Object.keys(errors).length === 0;
}

function next() {
  if (validateStep(step.value)) {
    step.value += 1;
    refreshIcons();
  }
}

function prev() {
  if (step.value > 0) {
    step.value -= 1;
    refreshIcons();
  }
}

function requestSubmit() {
  if (validateStep(4)) showConfirm.value = true;
}

function buildPayload(): TechnicianApplicationPayload {
  return {
    applicant: {
      userId: form.email.trim().toLowerCase(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      contactNumber: form.contactNumber.trim(),
      city: form.city.trim(),
    },
    professional: {
      yearsExperience: form.yearsExperience,
      brands: [...form.brands],
      brandsOther: form.brandsOther.trim() || undefined,
      specializations: [...form.specializations],
      specializationsOther: form.specializationsOther.trim() || undefined,
      experienceDescription: form.experienceDescription.trim(),
    },
    service: {
      serviceType: form.serviceType,
      coverageArea: form.coverageArea.trim(),
      workingDays: [...form.workingDays],
      workingHours: form.workingHours.trim(),
    },
    documents: {
      certificates: [...form.certificates],
      workPhotos: [...form.workPhotos],
    },
  };
}

async function confirmSubmit() {
  showConfirm.value = false;
  submitting.value = true;
  await new Promise((resolve) => setTimeout(resolve, 700));
  const payload = buildPayload();
  const app = props.existing ? store.resubmit(props.existing.id, payload) : store.submit(payload);
  submitting.value = false;
  if (app) {
    emit('submitted', app.id);
    step.value = 0;
    hydrate();
  }
}

function refreshIcons() {
  if (typeof lucide !== 'undefined') {
    nextTick(() => lucide.createIcons());
  }
}

let iconTimer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  hydrate();
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
    iconTimer = setInterval(() => lucide.createIcons(), 600);
  }
});
onUnmounted(() => {
  if (iconTimer) clearInterval(iconTimer);
});

watch(
  () => props.existing?.id,
  () => {
    step.value = 0;
    hydrate();
    refreshIcons();
  },
);
</script>

<style scoped>
.app-form { display: flex; flex-direction: column; gap: 18px; }
.app-form__panel { padding: 24px; }
.app-form__hint { font-size: 13px; color: var(--text-muted); margin: 0 0 18px; }
.app-form__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0 18px; }
.app-form__col { min-width: 0; }
.app-form__stack { display: flex; flex-direction: column; }
.app-form__sub { margin-top: 10px; }
.app-form__textarea { resize: vertical; min-height: 96px; font-family: inherit; }
.app-form__nav { display: flex; align-items: center; gap: 12px; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--hairline); }
.app-form__spacer { flex: 1; }
.btn-ico { width: 16px; height: 16px; }

.wizard { list-style: none; display: flex; flex-wrap: wrap; gap: 8px 6px; margin: 0; padding: 0; }
.wizard__step { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; background: #fff; border: 1px solid var(--hairline); font-size: 13px; font-weight: 600; color: var(--text-muted); }
.wizard__step.is-active { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.wizard__step.is-done { color: var(--primary); border-color: rgba(20, 99, 68, 0.25); }
.wizard__dot { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--gradient-soft); font-size: 11px; font-weight: 800; color: var(--primary); }
.wizard__step.is-active .wizard__dot { background: var(--primary); color: #fff; }
.wizard__ico { width: 12px; height: 12px; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 9px 14px; border-radius: 999px; border: 1.5px solid var(--hairline); background: #fff; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--text-dark); cursor: pointer; transition: all 0.15s ease; }
.chip:hover { border-color: rgba(20, 99, 68, 0.35); }
.chip--on { background: var(--primary); border-color: var(--primary); color: #fff; }
.chip--day { min-width: 56px; }

.upload { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 20px; border: 1.5px dashed rgba(20, 99, 68, 0.3); border-radius: 14px; background: var(--primary-light); color: var(--primary); font-size: 13px; font-weight: 700; cursor: pointer; text-align: center; }
.upload:hover { border-color: var(--primary); }
.upload__ico { width: 22px; height: 22px; }
.upload__input { display: none; }

.files { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.files__item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; background: var(--bg); border: 1px solid var(--hairline); font-size: 13px; }
.files__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; color: var(--text-dark); }
.files__size { color: var(--text-muted); font-size: 12px; }
.files__remove { background: none; border: none; color: #b91c1c; font-weight: 700; font-size: 12px; cursor: pointer; }

.err { color: #b91c1c; font-size: 12px; margin: 6px 0 0; }

.review-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px; }
.review__label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-muted); margin: 0 0 6px; }
.review__value { font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0; }
.review__sub { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }

.agree { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--text-dark); cursor: pointer; }
.agree input { margin-top: 2px; width: 16px; height: 16px; accent-color: var(--primary); }

.overlay { position: fixed; inset: 0; z-index: 120; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(8, 28, 18, 0.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.confirm { max-width: 400px; width: 100%; text-align: center; padding: 28px; }
.confirm__ico { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; background: var(--primary-light); color: var(--primary); }
.confirm__title { font-size: 18px; font-weight: 800; color: var(--text-dark); margin: 0 0 8px; }
.confirm__text { font-size: 13px; color: var(--text-muted); margin: 0 0 20px; }
.confirm__actions { display: flex; gap: 10px; justify-content: center; }

.spinner { width: 40px; height: 40px; margin: 0 auto 16px; border-radius: 50%; border: 4px solid var(--primary-light); border-top-color: var(--primary); animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 0.2s ease; }
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .app-form__panel { padding: 18px; }
  .wizard__label { display: none; }
  .wizard__step { padding: 8px; }
}
</style>
