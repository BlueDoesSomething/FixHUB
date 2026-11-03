import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { isProxy } from 'vue';
import { emptyRepairDraft, type RepairDraft, type SubmittedRepairRequest } from '@/data/repair';

const storage = vi.hoisted(() => ({
  loadRepairDraft: vi.fn(), listRepairRequests: vi.fn(), saveRepairDraft: vi.fn(), submitRepairRequest: vi.fn(),
  repairStorageMessage: vi.fn(() => 'Could not save on this device.'),
}));
vi.mock('@/services/repairStorage', () => storage);

type Store = ReturnType<typeof import('@/stores/repair')['useRepairDraft']>;
let store: Store;

function completeDraft(draft: RepairDraft) {
  Object.assign(draft, { brand: 'Dell', model: 'XPS 13', problem: 'The laptop is not charging correctly.', location: 'Example building, Makati', coordinates: { lat: 14.5547, lng: 121.0244 } });
}
function record(draft: RepairDraft): SubmittedRepairRequest {
  return { ...draft, ownerId: 'test-client', reference: 'FH-TEST', status: 'Pending', createdAt: new Date().toISOString() };
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  vi.clearAllMocks();
  storage.loadRepairDraft.mockResolvedValue(null);
  storage.listRepairRequests.mockResolvedValue([]);
  storage.saveRepairDraft.mockResolvedValue(undefined);
  storage.submitRepairRequest.mockImplementation(async (_owner, draft) => record(draft));
  const { signInTestUser } = await import('./fixtures/accounts');
  signInTestUser();
  store = (await import('@/stores/repair')).useRepairDraft();
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

describe('repair request state', () => {
  test('reads and writes only the authenticated account namespace', async () => {
    await store.initialize();
    expect(storage.loadRepairDraft).toHaveBeenCalledWith('test-client');
    expect(storage.listRepairRequests).toHaveBeenCalledWith('test-client');
    store.draft.brand = 'Dell';
    await store.saveDraft();
    expect(storage.saveRepairDraft.mock.calls.at(-1)?.[0]).toBe('test-client');
  });

  test('clears the current account view and prevents storage access after sign-out', async () => {
    await store.initialize();
    completeDraft(store.draft);
    store.state.requests = [record(store.draft)];
    const { signOutTestUser } = await import('./fixtures/accounts');
    signOutTestUser();
    expect(store.draft.brand).toBe('');
    expect(store.state.requests).toEqual([]);
    expect(store.state.ready).toBe(false);
    await expect(store.initialize()).rejects.toThrow('Sign in');
    await expect(store.submit()).rejects.toThrow('Sign in');
  });

  test('ignores a previous account read that finishes after the account changes', async () => {
    let finish!: (draft: RepairDraft) => void;
    storage.loadRepairDraft.mockImplementationOnce(() => new Promise<RepairDraft>(resolve => { finish = resolve; }));
    const pending = store.initialize();
    const { signInTestUser } = await import('./fixtures/accounts');
    signInTestUser('technician');
    const oldDraft = emptyRepairDraft();
    oldDraft.brand = 'Private old draft';
    finish(oldDraft);
    await pending;
    expect(store.draft.brand).toBe('');
    expect(store.state.ready).toBe(false);
    await store.initialize();
    expect(storage.loadRepairDraft).toHaveBeenLastCalledWith('test-technician');
  });

  test('debounces draft persistence and passes plain snapshots to storage', async () => {
    await store.initialize();
    store.draft.brand = 'Dell';
    store.draft.model = 'XPS 13';
    expect(storage.saveRepairDraft).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(350);
    expect(storage.saveRepairDraft).toHaveBeenCalledOnce();
    const value = storage.saveRepairDraft.mock.calls[0][1];
    expect(isProxy(value)).toBe(false);
    expect(value.model).toBe('XPS 13');
    expect(store.state.saveStatus).toBe('saved');
  });

  test('does not overwrite edits made during the initial draft read', async () => {
    let resolveRead!: (draft: RepairDraft) => void;
    storage.loadRepairDraft.mockImplementation(() => new Promise<RepairDraft>(resolve => { resolveRead = resolve; }));
    const loading = store.initialize();
    store.draft.problem = 'A new issue entered while storage was loading.';
    const saved = emptyRepairDraft();
    saved.problem = 'Old saved text';
    resolveRead(saved);
    await loading;
    expect(store.draft.problem).toBe('A new issue entered while storage was loading.');
    expect(storage.saveRepairDraft.mock.calls.at(-1)?.[1].problem).toBe(store.draft.problem);
  });

  test('coalesces duplicate submit clicks and resets only after a successful commit', async () => {
    await store.initialize();
    completeDraft(store.draft);
    let finish!: (record: SubmittedRepairRequest) => void;
    storage.submitRepairRequest.mockImplementation(() => new Promise<SubmittedRepairRequest>(resolve => { finish = resolve; }));
    const original = { ...store.draft };
    const first = store.submit();
    const second = store.submit();
    expect(first).toBe(second);
    await vi.advanceTimersByTimeAsync(0);
    expect(storage.submitRepairRequest).toHaveBeenCalledOnce();
    expect(store.draft.id).toBe(original.id);
    finish(record(original));
    await first;
    expect(store.state.requests).toHaveLength(1);
    expect(store.draft.id).not.toBe(original.id);
    expect(store.draft.brand).toBe('');
    expect(store.draft.photos).toEqual([]);
    expect(store.draft.coordinates).toBeNull();
  });

  test('preserves the draft when submission fails and permits a successful retry', async () => {
    await store.initialize();
    completeDraft(store.draft);
    const id = store.draft.id;
    storage.submitRepairRequest.mockRejectedValueOnce(new Error('Quota exceeded'));
    await expect(store.submit()).rejects.toThrow('Quota exceeded');
    expect(store.state.requests).toHaveLength(0);
    expect(store.draft.id).toBe(id);
    expect(store.draft.model).toBe('XPS 13');
    expect(store.state.submitting).toBe(false);
    expect(store.state.error).toContain('Could not save');
    await store.submit();
    expect(store.state.requests).toHaveLength(1);
  });

  test('rejects an incomplete draft before calling the storage transaction', async () => {
    await store.initialize();
    await expect(store.submit()).rejects.toThrow('required details');
    expect(storage.submitRepairRequest).not.toHaveBeenCalled();
  });

  test('retains newer edits made during submission without treating them as submitted data', async () => {
    await store.initialize();
    completeDraft(store.draft);
    let finish!: (record: SubmittedRepairRequest) => void;
    let snapshot!: RepairDraft;
    storage.submitRepairRequest.mockImplementation((_owner, draft) => {
      snapshot = draft;
      return new Promise<SubmittedRepairRequest>(resolve => { finish = resolve; });
    });
    const pending = store.submit();
    await vi.advanceTimersByTimeAsync(0);
    store.draft.problem = 'A newer edit that was not part of the submitted request.';
    finish(record(snapshot));
    const submitted = await pending;
    expect(submitted.problem).toBe('The laptop is not charging correctly.');
    expect(store.draft.problem).toContain('newer edit');
    expect(storage.saveRepairDraft.mock.calls.at(-1)?.[1].problem).toContain('newer edit');
  });
});
