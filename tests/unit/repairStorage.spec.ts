import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { deleteDB } from 'idb';
import { Blob as NodeBlob } from 'node:buffer';
import { emptyRepairDraft, snapshotRepair, validateRepair, type RepairDraft } from '@/data/repair';
import { closeRepairStorage, getRepairRequest, listRepairRequests, loadRepairDraft, repairStorageMessage, saveRepairDraft, submitRepairRequest } from '@/services/repairStorage';

function validDraft(): RepairDraft {
  return { ...emptyRepairDraft(), brand: 'Apple', model: 'iPhone 13', problem: 'The phone no longer charges.', location: 'Example building, Makati', coordinates: { lat: 14.5547, lng: 121.0244 } };
}

beforeEach(async () => { await closeRepairStorage(); await deleteDB('fixhub-repairs-v1'); });
afterEach(async () => { vi.restoreAllMocks(); await closeRepairStorage(); });

describe('repair draft validation', () => {
  test('starts without fabricated device details and validates whitespace-only inputs', () => {
    const draft = emptyRepairDraft();
    expect(draft.brand).toBe('');
    expect(draft.model).toBe('');
    expect(draft.problem).toBe('');
    expect(draft.coordinates).toBeNull();
    draft.brand = '   ';
    expect(Object.keys(validateRepair(draft))).toEqual(expect.arrayContaining(['brand', 'model', 'problem', 'location']));
  });

  test('separates device validation from the required location step', () => {
    const draft = validDraft();
    draft.coordinates = null;
    expect(validateRepair(draft, false)).toEqual({});
    expect(validateRepair(draft).location).toBeDefined();
    draft.coordinates = { lat: 1000, lng: 121 };
    expect(validateRepair(draft).location).toBeDefined();
  });

  test('accepts home and drop-off, rejects oversized fields and invalid photos', () => {
    const draft = validDraft();
    draft.serviceType = 'dropoff';
    expect(validateRepair(draft)).toEqual({});
    draft.model = 'x'.repeat(121);
    expect(validateRepair(draft).model).toBeDefined();
    draft.photos = [{ id: 'bad', name: 'bad.svg', type: 'image/svg+xml', size: 1, blob: new Blob(['x'], { type: 'image/svg+xml' }) }];
    expect(validateRepair(draft).photos).toBeDefined();
  });

  test('snapshots are independent and normalize text', () => {
    const draft = validDraft();
    draft.brand = ' Apple ';
    const saved = snapshotRepair(draft);
    draft.coordinates!.lat = 15;
    expect(saved.brand).toBe('Apple');
    expect(saved.coordinates!.lat).toBe(14.5547);
  });
});

describe('IndexedDB repair storage', () => {
  test('recognizes quota exceptions from a different browser context', () => {
    expect(repairStorageMessage({ name: 'QuotaExceededError', message: 'Full' })).toContain('device storage is full');
  });

  test('persists incomplete drafts and binary attachments across database reopen', async () => {
    const draft = validDraft();
    // Node's native Blob supports structuredClone used by fake-indexeddb.
    const blob = new NodeBlob([new Uint8Array([1, 2, 3])], { type: 'image/png' }) as unknown as Blob;
    draft.photos = [{ id: 'photo-1', name: 'device.png', type: blob.type, size: blob.size, blob }];
    await saveRepairDraft('alice', draft);
    await closeRepairStorage();
    const restored = await loadRepairDraft('alice');
    expect(restored?.id).toBe(draft.id);
    expect(restored?.photos[0].name).toBe('device.png');
    expect(Array.from(new Uint8Array(await restored!.photos[0].blob.arrayBuffer()))).toEqual([1, 2, 3]);
  });

  test('submission saves a pending request and clears the persisted draft atomically', async () => {
    const draft = validDraft();
    const next = emptyRepairDraft();
    await saveRepairDraft('alice', draft);
    const request = await submitRepairRequest('alice', draft, next);
    expect(request.status).toBe('Pending');
    expect(request.reference).toMatch(/^FH-/);
    expect((await loadRepairDraft('alice'))?.id).toBe(next.id);
    expect((await listRepairRequests('alice'))).toHaveLength(1);
  });

  test('repeated or concurrent submissions of one draft produce a single immutable record', async () => {
    const draft = validDraft();
    const [first, second] = await Promise.all([
      submitRepairRequest('alice', draft, emptyRepairDraft()),
      submitRepairRequest('alice', draft, emptyRepairDraft()),
    ]);
    expect(first.id).toBe(second.id);
    expect(await listRepairRequests('alice')).toHaveLength(1);
    draft.problem = 'Changed after the first submission.';
    const repeated = await submitRepairRequest('alice', draft, emptyRepairDraft());
    expect(repeated.problem).toBe('The phone no longer charges.');
  });

  test('invalid requests do not write a record or clear the draft', async () => {
    const draft = emptyRepairDraft();
    await saveRepairDraft('alice', draft);
    await expect(submitRepairRequest('alice', draft, emptyRepairDraft())).rejects.toThrow('required');
    expect(await listRepairRequests('alice')).toHaveLength(0);
    expect((await loadRepairDraft('alice'))?.id).toBe(draft.id);
  });

  test('loads a retired-device draft without deleting it and rejects its submission', async () => {
    const draft = { ...validDraft(), device: 'Console' };
    await saveRepairDraft('alice', draft);
    await closeRepairStorage();
    expect(await loadRepairDraft('alice')).toEqual(draft);
    await expect(submitRepairRequest('alice', draft, emptyRepairDraft())).rejects.toThrow('required');
    expect(await listRepairRequests('alice')).toHaveLength(0);
    expect(await loadRepairDraft('alice')).toEqual(draft);
  });

  test('a failed draft-reset write rolls back the request instead of showing false success', async () => {
    const draft = validDraft();
    await saveRepairDraft('alice', draft);
    const original = IDBObjectStore.prototype.put;
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
      if (this.name === 'drafts') throw new DOMException('Full', 'QuotaExceededError');
      return key === undefined ? original.call(this, value) : original.call(this, value, key);
    });
    await expect(submitRepairRequest('alice', draft, emptyRepairDraft())).rejects.toThrow('Full');
    spy.mockRestore();
    expect(await listRepairRequests('alice')).toHaveLength(0);
    expect((await loadRepairDraft('alice'))?.id).toBe(draft.id);
  });

  test('local owner filters do not return another profile’s requests', async () => {
    const request = await submitRepairRequest('alice', validDraft(), emptyRepairDraft());
    expect(await getRepairRequest('bob', request.id)).toBeNull();
    expect(await listRepairRequests('bob')).toHaveLength(0);
    expect((await getRepairRequest('alice', request.id))?.id).toBe(request.id);
  });
});
