import { reactive, watch } from 'vue';
import { emptyRepairDraft, snapshotRepair, validateRepair, type SubmittedRepairRequest } from '../data/repair';
import { listRepairRequests, loadRepairDraft, markRepairRequestSynced, repairStorageMessage, saveRepairDraft } from '../services/repairStorage';
import { fetchRemoteRepairRequests, mergeRepairRequests, pushRepairRequest, RepairPhotoUploadError } from '../services/repairSync';
import { isSupabaseConfigured } from '../services/supabase';
import { useAuth } from './auth';

export type { RepairDraft, ServiceType } from '../data/repair';

const draft = reactive(emptyRepairDraft());
const state = reactive({
  ready: false,
  saveStatus: 'idle' as 'idle' | 'saving' | 'saved' | 'error',
  error: '',
  submitting: false,
  requests: [] as SubmittedRepairRequest[],
  unsentLegacyCount: 0,
});
let loading: Promise<void> | undefined;
let refreshing: Promise<void> | undefined;
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
  state.unsentLegacyCount = 0;
  state.ready = false;
  state.error = '';
  state.saveStatus = 'idle';
  state.submitting = false;
  loading = undefined;
  refreshing = undefined;
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

/** Migrate older unsent browser records in the background, without presenting them as submitted. */
async function publishPending(ownerId: string, records: SubmittedRepairRequest[]) {
  if (!isSupabaseConfigured()) return records.filter(item => !item.synced).length;
  let failed = 0;
  for (const request of records.filter(item => !item.synced)) {
    if (auth.state.session?.userId !== ownerId) return failed;
    try {
      if (await pushRepairRequest(request, ownerId)) {
        await markRepairRequestSynced(ownerId, request.id).catch(() => undefined);
      } else failed++;
    } catch (error) {
      if (error instanceof RepairPhotoUploadError) failed++;
      else throw error;
    }
  }
  return failed;
}

async function initialize() {
  const ownerId = repairOwnerId();
  if (loading) return loading;
  if (state.ready) return;
  const initialRevision = revision;
  loading = (async () => {
    try {
      const [saved, requests] = await Promise.all([loadRepairDraft(ownerId), listRepairRequests(ownerId)]);
      if (auth.state.session?.userId !== ownerId) return;
      // Do not overwrite edits made while the first database read was pending.
      if (saved && revision === initialRevision) replaceDraft(saved);
      state.saveStatus = saved ? 'saved' : 'idle';
      // Offline drafts do not depend on a successful server history read.
      state.ready = true;
      const failed = await publishPending(ownerId, requests);
      const remote = await fetchRemoteRepairRequests(ownerId);
      if (auth.state.session?.userId !== ownerId) return;
      state.requests = mergeRepairRequests(requests, remote);
      state.unsentLegacyCount = failed;
      state.error = '';
    } catch (error) {
      if (auth.state.session?.userId !== ownerId) return;
      state.error = error instanceof Error ? error.message : 'Could not load requests from FIXHUB. Check your connection and retry.';
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
      // A failed send must leave a durable copy of the current draft, even if
      // the submit click arrived before the normal debounce completed.
      await saveDraft();
      if (auth.state.session?.userId !== ownerId) throw new Error('The signed-in account changed. Open Repair History after signing in again.');
      const record: SubmittedRepairRequest = {
        ...value, ownerId,
        reference: `FH-${value.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
        createdAt: new Date().toISOString(), status: 'Pending',
      };
      if (!isSupabaseConfigured() || !await pushRepairRequest(record, ownerId)) {
        throw new Error('Could not send your repair request to FIXHUB. Check your connection and try again; your draft is still available.');
      }
      if (auth.state.session?.userId !== ownerId) throw new Error('The signed-in account changed. Open Repair History after signing in again.');
      const published = { ...record, synced: true };
      state.requests = [published, ...state.requests.filter(request => request.id !== published.id)];
      if (revision === submittedRevision) {
        replaceDraft(next);
        try { await saveRepairDraft(ownerId, next); state.saveStatus = 'saved'; }
        catch { state.saveStatus = 'error'; state.error = 'Your request was submitted to FIXHUB, but the new blank draft could not be saved on this device.'; }
      } else {
        // Preserve any newer edit made while the transaction was in progress.
        await saveDraft().catch(() => undefined);
      }
      return published;
    } catch (error) {
      if (auth.state.session?.userId === ownerId && revision !== submittedRevision) {
        await saveDraft().catch(() => undefined);
      }
      if (auth.state.session?.userId === ownerId) state.error = error instanceof Error ? error.message : repairStorageMessage(error);
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

function refreshRequests(): Promise<void> {
  if (refreshing) return refreshing;
  const operation = (async () => {
    await initialize();
    const ownerId = repairOwnerId();
    const local = await listRepairRequests(ownerId);
    const failed = await publishPending(ownerId, local);
    const remote = await fetchRemoteRepairRequests(ownerId);
    if (auth.state.session?.userId === ownerId) {
      state.requests = mergeRepairRequests(local, remote);
      state.unsentLegacyCount = failed;
    }
  })().finally(() => { if (refreshing === operation) refreshing = undefined; });
  refreshing = operation;
  return refreshing;
}

export function useRepairDraft() {
  return { draft, state, initialize, saveDraft, reset, submit, refreshRequests };
}
