import { reactive, watch } from 'vue';
import { emptyRepairDraft, snapshotRepair, validateRepair, type SubmittedRepairRequest } from '../data/repair';
import { listRepairRequests, loadRepairDraft, repairStorageMessage, saveRepairDraft, submitRepairRequest } from '../services/repairStorage';
import { useAuth } from './auth';

export type { RepairDraft, ServiceType } from '../data/repair';

const draft = reactive(emptyRepairDraft());
const state = reactive({
  ready: false,
  saveStatus: 'idle' as 'idle' | 'saving' | 'saved' | 'error',
  error: '',
  submitting: false,
  requests: [] as SubmittedRepairRequest[],
});
let loading: Promise<void> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let writeQueue: Promise<unknown> = Promise.resolve();
let submission: Promise<SubmittedRepairRequest> | undefined;
let hydrating = false;
let revision = 0;

const auth = useAuth();
export function repairOwnerId() {
  const ownerId = auth.state.session?.userId;
  if (!auth.state.isAuthenticated || !ownerId) throw new Error('Sign in to access your repair requests.');
  return ownerId;
}

// Retired shared-account records are left on disk, but are never loaded for a real user.
watch(() => auth.state.session?.userId, () => {
  clearSaveTimer();
  revision += 1;
  replaceDraft(emptyRepairDraft());
  state.requests = [];
  state.ready = false;
  state.error = '';
  state.saveStatus = 'idle';
  state.submitting = false;
  loading = undefined;
  submission = undefined;
}, { flush: 'sync' });

function replaceDraft(value: ReturnType<typeof emptyRepairDraft>) {
  hydrating = true;
  Object.assign(draft, value);
  hydrating = false;
}

function clearSaveTimer() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = undefined;
}

watch(draft, () => {
  if (hydrating) return;
  revision += 1;
  if (!state.ready || state.submitting) return;
  clearSaveTimer();
  state.saveStatus = 'saving';
  saveTimer = setTimeout(() => { void saveDraft().catch(() => undefined); }, 350);
}, { deep: true, flush: 'sync' });

async function initialize() {
  const ownerId = repairOwnerId();
  if (state.ready) return;
  if (loading) return loading;
  const initialRevision = revision;
  loading = (async () => {
    try {
      const [saved, requests] = await Promise.all([loadRepairDraft(ownerId), listRepairRequests(ownerId)]);
      if (auth.state.session?.userId !== ownerId) return;
      // Do not overwrite edits made while the first database read was pending.
      if (saved && revision === initialRevision) replaceDraft(saved);
      state.requests = requests;
      state.error = '';
      state.saveStatus = saved ? 'saved' : 'idle';
    } catch (error) {
      if (auth.state.session?.userId !== ownerId) return;
      state.error = repairStorageMessage(error);
      state.saveStatus = 'error';
    } finally {
      if (auth.state.session?.userId === ownerId) {
        state.ready = true;
        loading = undefined;
      }
    }
    if (auth.state.session?.userId === ownerId && revision !== initialRevision) await saveDraft().catch(() => undefined);
  })();
  return loading;
}

async function saveDraft() {
  const ownerId = repairOwnerId();
  clearSaveTimer();
  const value = snapshotRepair(draft);
  const savedRevision = revision;
  state.saveStatus = 'saving';
  const operation = writeQueue.catch(() => undefined).then(() => saveRepairDraft(ownerId, value));
  writeQueue = operation;
  try {
    await operation;
    if (auth.state.session?.userId === ownerId && revision === savedRevision) {
      state.saveStatus = 'saved';
      state.error = '';
    }
  } catch (error) {
    if (auth.state.session?.userId === ownerId) {
      state.saveStatus = 'error';
      state.error = repairStorageMessage(error);
    }
    throw error;
  }
}

function reset() {
  clearSaveTimer();
  revision += 1;
  replaceDraft(emptyRepairDraft());
  if (state.ready) void saveDraft().catch(() => undefined);
}

function submit(): Promise<SubmittedRepairRequest> {
  let ownerId: string;
  try { ownerId = repairOwnerId(); }
  catch (error) { return Promise.reject(error); }
  if (submission) return submission;
  if (Object.keys(validateRepair(draft)).length) return Promise.reject(new Error('Complete the required details and location before submitting.'));
  clearSaveTimer();
  const value = snapshotRepair(draft);
  const submittedRevision = revision;
  const next = emptyRepairDraft();
  state.submitting = true;
  state.error = '';
  submission = (async () => {
    try {
      await writeQueue.catch(() => undefined);
      const record = await submitRepairRequest(ownerId, value, next);
      if (auth.state.session?.userId !== ownerId) throw new Error('The signed-in account changed. Open Repair History after signing in again.');
      state.requests = [record, ...state.requests.filter(request => request.id !== record.id)];
      if (revision === submittedRevision) {
        replaceDraft(next);
        state.saveStatus = 'saved';
      } else {
        // Preserve any newer edit made while the transaction was in progress.
        await saveDraft().catch(() => undefined);
      }
      return record;
    } catch (error) {
      if (auth.state.session?.userId === ownerId) state.error = repairStorageMessage(error);
      throw error;
    } finally {
      if (auth.state.session?.userId === ownerId) {
        state.submitting = false;
        submission = undefined;
      }
    }
  })();
  return submission;
}

async function refreshRequests() {
  await initialize();
  const ownerId = repairOwnerId();
  const requests = await listRepairRequests(ownerId);
  if (auth.state.session?.userId === ownerId) state.requests = requests;
}

export function useRepairDraft() {
  return { draft, state, initialize, saveDraft, reset, submit, refreshRequests };
}
