<template>
  <ion-page>
    <ScreenHeader title="Request Repair" default-href="/client/home" />
    <ion-content>
      <div class="fx-page">
        <div class="fx-page__head">
          <div><h1 class="fx-page__title">Request a Repair</h1><p class="fx-page__sub">Tell us about your device, then choose a location and review your request.</p></div>
        </div>
        <RepairSteps :step="1" />
        <RepairSaveStatus show-save-status />
        <p v-if="!state.ready" role="status">Loading your saved draft…</p>
        <form v-else ref="form" novalidate @submit.prevent="continueToLocation">
          <p v-if="attempted && Object.keys(errors).length" class="form-error" role="alert">Please correct the highlighted fields before continuing.</p>
          <fieldset class="request-fields" :disabled="state.submitting || saving">
            <div class="fx-split request-layout">
              <div>
                <section class="fx-card section">
                  <h2 class="fx-section-title">Select Device</h2>
                  <div class="device-grid" role="group" aria-label="Device type">
                    <button v-for="device in devices" :key="device.name" type="button" class="device-option" :class="{ selected: draft.device === device.name }" :aria-pressed="draft.device === device.name" @click="draft.device = device.name">
                      <span class="device-option__icon">{{ device.icon }}</span><span>{{ device.name }}</span>
                    </button>
                  </div>
                  <p v-if="attempted && errors.device" class="field-error">{{ errors.device }}</p>
                </section>

                <section class="fx-card section">
                  <h2 class="fx-section-title">Device Details</h2>
                  <div class="fx-field">
                    <label class="fx-label" for="repair-brand">Device brand <span aria-hidden="true">*</span></label>
                    <input id="repair-brand" v-model="draft.brand" class="fx-input" list="repair-brands" required maxlength="100" placeholder="e.g. Apple, Samsung, Dell" :aria-invalid="attempted && !!errors.brand" :aria-describedby="attempted && errors.brand ? 'brand-error' : undefined" />
                    <datalist id="repair-brands"><option v-for="brand in brands" :key="brand" :value="brand" /></datalist>
                    <p v-if="attempted && errors.brand" id="brand-error" class="field-error">{{ errors.brand }}</p>
                  </div>
                  <div class="fx-field">
                    <label class="fx-label" for="repair-model">Device model <span aria-hidden="true">*</span></label>
                    <input id="repair-model" v-model="draft.model" class="fx-input" required maxlength="120" placeholder="e.g. iPhone 13" :aria-invalid="attempted && !!errors.model" :aria-describedby="attempted && errors.model ? 'model-error' : undefined" />
                    <p v-if="attempted && errors.model" id="model-error" class="field-error">{{ errors.model }}</p>
                  </div>
                  <div class="fx-field section__last">
                    <label class="fx-label" for="repair-problem">Describe the problem <span aria-hidden="true">*</span></label>
                    <textarea id="repair-problem" v-model="draft.problem" class="fx-input" required minlength="10" maxlength="5000" rows="4" placeholder="What is wrong, and when did it start?" :aria-invalid="attempted && !!errors.problem" aria-describedby="problem-help problem-error" />
                    <p id="problem-help" class="field-hint">10–5,000 characters. {{ draft.problem.length }}/5,000</p>
                    <p v-if="attempted && errors.problem" id="problem-error" class="field-error">{{ errors.problem }}</p>
                  </div>
                </section>

                <section class="fx-card section">
                  <h2 class="fx-section-title">Attach Photos</h2>
                  <RepairPhotoPicker :key="draft.id" v-model="draft.photos" @busy="photosBusy = $event" />
                  <p v-if="errors.photos" class="field-error">{{ errors.photos }}</p>
                </section>

                <section class="fx-card section">
                  <h2 class="fx-section-title">Choose Service Type</h2>
                  <div class="service-grid" role="group" aria-label="Service type">
                    <button type="button" class="service-card" :class="{ selected: draft.serviceType === 'home' }" :aria-pressed="draft.serviceType === 'home'" @click="draft.serviceType = 'home'"><strong>🏠 Home Service</strong><span>Technician comes to your selected address.</span></button>
                    <button type="button" class="service-card" :class="{ selected: draft.serviceType === 'dropoff' }" :aria-pressed="draft.serviceType === 'dropoff'" @click="draft.serviceType = 'dropoff'"><strong>📦 Drop-off</strong><span>Choose your starting area now; a shop is arranged later.</span></button>
                  </div>
                  <p v-if="attempted && errors.serviceType" class="field-error">{{ errors.serviceType }}</p>
                </section>
              </div>

              <aside class="form-aside">
                <div class="fx-card">
                  <h2 class="fx-section-title">Draft Summary</h2>
                  <div class="fx-info-row"><span class="fx-info-label">Device</span><span class="fx-info-value">{{ draft.device }}</span></div>
                  <div class="fx-info-row"><span class="fx-info-label">Brand</span><span class="fx-info-value">{{ draft.brand || 'Not provided' }}</span></div>
                  <div class="fx-info-row"><span class="fx-info-label">Model</span><span class="fx-info-value">{{ draft.model || 'Not provided' }}</span></div>
                  <div class="fx-info-row"><span class="fx-info-label">Service</span><span class="fx-info-value">{{ serviceLabel(draft.serviceType) }}</span></div>
                  <div class="fx-info-row"><span class="fx-info-label">Photos</span><span class="fx-info-value">{{ draft.photos.length }}</span></div>
                  <p class="field-hint">No price has been agreed. Technician acceptance and quotations will be added separately.</p>
                </div>
                <button class="fx-btn fx-btn-primary fx-btn--block" type="submit" :disabled="photosBusy || saving">{{ saving ? 'Saving draft…' : 'Continue to Location' }}</button>
                <button class="fx-btn fx-btn-secondary fx-btn--block" type="button" :disabled="photosBusy || saving" @click="save">Save Draft</button>
                <button class="fx-btn fx-btn-ghost fx-btn--block" type="button" :disabled="photosBusy || saving" @click="startOver">Start Over</button>
              </aside>
            </div>
          </fieldset>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
import ScreenHeader from '../../components/ScreenHeader.vue';
import RepairSteps from '../../components/repair/RepairSteps.vue';
import RepairSaveStatus from '../../components/repair/RepairSaveStatus.vue';
import RepairPhotoPicker from '../../components/repair/RepairPhotoPicker.vue';
import { devices } from '../../data/catalog';
import { serviceLabel, validateRepair } from '../../data/repair';
import { useRepairDraft } from '../../stores/repair';

const router = useRouter();
const { draft, state, initialize, saveDraft, reset } = useRepairDraft();
const form = ref<HTMLFormElement | null>(null);
const attempted = ref(false);
const photosBusy = ref(false);
const saving = ref(false);
const errors = computed(() => validateRepair(draft, false));
const brands = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Huawei', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Sony', 'Nintendo', 'Microsoft'];

async function save() {
  saving.value = true;
  try { await saveDraft(); }
  catch { /* The shared notice explains storage failures without discarding edits. */ }
  finally { saving.value = false; }
}

async function continueToLocation() {
  if (photosBusy.value || saving.value || state.submitting) return;
  attempted.value = true;
  if (Object.keys(errors.value).length) {
    await nextTick();
    form.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    return;
  }
  saving.value = true;
  try { await saveDraft(); await router.push('/client/request/location'); }
  catch { /* Do not navigate away from an unsaved draft. */ }
  finally { saving.value = false; }
}

function startOver() {
  if (!window.confirm('Clear this draft and its attached photos? Previously submitted requests will be kept.')) return;
  reset();
  attempted.value = false;
}

onMounted(initialize);
onIonViewWillEnter(initialize);
</script>

<style scoped>
.fx-page { color: var(--text-dark); }
.request-fields { padding: 0; margin: 0; border: 0; min-width: 0; }
.section { margin-bottom: 20px; }
.section__last { margin-bottom: 0; }
.device-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(105px, 1fr)); gap: 10px; }
.device-option { display: flex; flex-direction: column; align-items: center; gap: 6px; background: var(--surface); border: 1.5px solid var(--hairline); border-radius: 14px; padding: 14px 6px; cursor: pointer; font: inherit; font-size: 13px; color: var(--primary); font-weight: 700; }
.device-option.selected, .service-card.selected { background: var(--primary-light); border-color: var(--primary); }
.device-option__icon { font-size: 26px; }
.service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.service-card { display: flex; flex-direction: column; gap: 10px; background: var(--surface); border: 2px solid var(--hairline); border-radius: 14px; padding: 20px 14px; text-align: left; font: inherit; color: var(--primary); cursor: pointer; }
.service-card span { color: var(--text-muted); font-size: 12px; line-height: 1.6; }
.form-aside { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 20px; }
.field-error, .form-error { color: #b91c1c; font-size: 13px; margin: 8px 0 0; }
.form-error { padding: 12px; margin: 0 0 20px; border-radius: 10px; background: #fef2f2; }
.field-hint { color: var(--text-muted); font-size: 12px; line-height: 1.6; margin: 8px 0 0; }
.fx-input[aria-invalid="true"] { border-color: #dc2626; }
button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
@media (max-width: 1100px) { .request-layout { grid-template-columns: 1fr; } .form-aside { position: static; } }
</style>
